/**
 * Disk-backed sync layer.
 *
 * The app's source-of-truth at runtime is still localStorage (every service
 * reads from it synchronously). This module:
 *   1. On startup, fetches each tracked resource from /api/db/<key> (served
 *      by the Vite dev middleware out of data/<key>.json) and mirrors it
 *      into localStorage. Anything in localStorage that differs from disk
 *      gets replaced with the disk version — disk is the cross-machine
 *      source of truth.
 *   2. After every service write, the service calls `notifyChange(key)`
 *      which debounces a PUT back to disk. The data folder is committed
 *      to git, so `git clone` carries the full app state with the code.
 *
 * Production builds (`npm run build`) have no server — every fetch fails
 * silently and the app continues in localStorage-only mode.
 */

const ACTIVITY_PREFIX = 'mc.activity.';

/**
 * Map a disk resource (the URL slug under /api/db/) to the localStorage
 * key and the JSON shape it lives in.
 */
const RESOURCES = {
  users: {
    storageKey: 'mc.users',
    shape: 'array',
  },
  certificates: {
    storageKey: 'mc.certificates',
    shape: 'array',
  },
  submissions: {
    storageKey: 'mc.submissions.v2',
    shape: 'array',
  },
  'fraud-scans': {
    storageKey: 'mc.fraud.scans',
    shape: 'array',
  },
  activity: {
    // Activity is keyed by userId — we keep it as an object on disk
    // ({ "userId": [events] }) and fan it out into per-user localStorage
    // keys ("mc.activity.{userId}") at bootstrap. On save we collect all
    // per-user keys back into the single object.
    storageKey: null,
    shape: 'activity-map',
  },
};

let bootstrapped = false;

async function fetchJson(key) {
  try {
    const res = await fetch(`/api/db/${encodeURIComponent(key)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function putJson(key, value) {
  try {
    await fetch(`/api/db/${encodeURIComponent(key)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(value),
    });
  } catch {
    /* dev server not running — silently degrade */
  }
}

function activityMapFromLocalStorage() {
  const out = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(ACTIVITY_PREFIX)) continue;
    const userId = key.slice(ACTIVITY_PREFIX.length);
    try {
      const v = JSON.parse(localStorage.getItem(key) || 'null');
      if (Array.isArray(v) && v.length) out[userId] = v;
    } catch {}
  }
  return out;
}

/**
 * Pull every disk file into localStorage. Resolves once everything is in.
 * Idempotent — safe to call multiple times, but only does work once.
 */
export async function bootstrap() {
  if (bootstrapped) return;
  bootstrapped = true;

  const tasks = Object.entries(RESOURCES).map(async ([key, meta]) => {
    const data = await fetchJson(key);

    if (meta.shape === 'array') {
      const diskList = Array.isArray(data) ? data : [];
      let localList = [];
      try {
        const parsed = JSON.parse(localStorage.getItem(meta.storageKey) || 'null');
        if (Array.isArray(parsed)) localList = parsed;
      } catch {}

      if (localList.length > diskList.length) {
        // Local has more rows (e.g. fresh signup not yet flushed to disk) —
        // push local to disk so the JSON file reflects the user's state.
        notifyChange(key);
      } else if (diskList.length > 0) {
        // Disk is the cross-machine source of truth — hydrate local from it.
        localStorage.setItem(meta.storageKey, JSON.stringify(diskList));
      }
      return;
    }

    if (meta.shape === 'activity-map') {
      const diskMap = data && typeof data === 'object' ? data : {};
      const localMap = activityMapFromLocalStorage();
      const diskKeys = Object.keys(diskMap).length;
      const localKeys = Object.keys(localMap).length;

      if (localKeys > diskKeys) {
        notifyChange('activity');
      } else if (diskKeys > 0) {
        for (const [userId, events] of Object.entries(diskMap)) {
          if (Array.isArray(events) && events.length) {
            localStorage.setItem(`${ACTIVITY_PREFIX}${userId}`, JSON.stringify(events));
          }
        }
      }
    }
  });

  await Promise.all(tasks);
}

// Debounce per-key so a flurry of writes coalesces into one PUT.
const pending = new Map();
const DEBOUNCE_MS = 200;

function schedule(key) {
  if (pending.has(key)) clearTimeout(pending.get(key));
  pending.set(
    key,
    setTimeout(() => {
      pending.delete(key);
      const meta = RESOURCES[key];
      if (!meta) return;
      if (meta.shape === 'array') {
        try {
          const value = JSON.parse(localStorage.getItem(meta.storageKey) || 'null') ?? [];
          putJson(key, value);
        } catch {}
      } else if (meta.shape === 'activity-map') {
        putJson(key, activityMapFromLocalStorage());
      }
    }, DEBOUNCE_MS)
  );
}

/**
 * Call this after writing to localStorage for a tracked resource.
 * The corresponding disk file gets refreshed (debounced) so the change
 * is captured in git on the user's next commit.
 */
export function notifyChange(key) {
  if (!RESOURCES[key]) return;
  schedule(key);
}

/** Resource keys for callers who want the disk slug (e.g. for logging). */
export const DB_KEYS = Object.keys(RESOURCES);
