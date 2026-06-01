import { delay, generateCertificateId, computeCertHash } from '@/lib/utils';
import { SEED_CERTIFICATES } from '@/data/mockData';
import { notifyChange } from '@/lib/db';

/**
 * Certificate persistence layer (localStorage-backed mock DB).
 */
const KEY = 'mc.certificates';

function load() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || 'null');

    if (stored?.length) {
      // Backfill newly-added fields (learningHours) for any pre-existing
      // certs so the dashboard math doesn't show zeros for seed records.
      const seedMap = new Map(SEED_CERTIFICATES.map((c) => [c.id, c]));
      let dirty = false;
      const upgraded = stored.map((c) => {
        if (c.learningHours == null) {
          dirty = true;
          return { ...c, learningHours: seedMap.get(c.id)?.learningHours ?? 20 };
        }
        return c;
      });
      if (dirty) {
        localStorage.setItem(KEY, JSON.stringify(upgraded));
        notifyChange('certificates');
      }
      return upgraded;
    }
  } catch (_) {}
  localStorage.setItem(KEY, JSON.stringify(SEED_CERTIFICATES));
  notifyChange('certificates');
  return SEED_CERTIFICATES;
}

function save(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
  notifyChange('certificates');
}

export async function listCertificates(filter = {}) {
  await delay(400);
  // Make sure every cert in the registry has a valid canonical SHA-256.
  // Seed-time fake hashes get replaced with real ones on first read.
  await syncHashesIfNeeded();
  let list = load();
  if (filter.recipientName) {
    list = list.filter((c) => c.recipientName === filter.recipientName);
  }
  if (filter.status) list = list.filter((c) => c.status === filter.status);
  return [...list].sort((a, b) => new Date(b.issuedAt || 0) - new Date(a.issuedAt || 0));
}

export async function getCertificate(id) {
  await delay(300);
  await syncHashesIfNeeded();
  return load().find((c) => c.id === id) || null;
}

export async function createCertificate(data) {
  await delay(700);
  const id = generateCertificateId();
  // Build the cert first so its hash is computed from the final canonical
  // payload (id + recipient + course + score + hours + issuedAt + ...).
  const draft = {
    id,
    status: 'issued',
    issuedAt: new Date().toISOString(),
    issuedBy: 'Hexaware Mavericks Academy',
    verifications: 0,
    ...data,
  };
  const cert = { ...draft, hash: await computeCertHash(draft) };
  const list = load();
  save([cert, ...list]);
  return cert;
}

export async function bulkCreate(rows) {
  await delay(1200);
  const list = load();
  const drafts = rows.map((row, i) => ({
    id: generateCertificateId(),
    status: 'issued',
    issuedAt: new Date(Date.now() - i * 1000).toISOString(),
    issuedBy: 'Hexaware Mavericks Academy',
    verifications: 0,
    ...row,
  }));
  const created = await Promise.all(
    drafts.map(async (d) => ({ ...d, hash: await computeCertHash(d) }))
  );
  save([...created, ...list]);
  return created;
}

/**
 * Recompute and persist canonical SHA-256 hashes for any cert whose stored
 * hash doesn't match (or is missing). Idempotent — only writes if dirty.
 * Run once on first listCertificates after a session starts.
 */
let hashSyncRan = false;
async function syncHashesIfNeeded() {
  if (hashSyncRan) return;
  hashSyncRan = true;
  const list = load();
  let dirty = false;
  const updated = await Promise.all(list.map(async (c) => {
    const real = await computeCertHash(c);
    if (c.hash !== real) {
      dirty = true;
      return { ...c, hash: real };
    }
    return c;
  }));
  if (dirty) save(updated);
}

export async function updateStatus(id, status) {
  await delay(400);
  const list = load().map((c) => (c.id === id ? { ...c, status } : c));
  save(list);
  return list.find((c) => c.id === id);
}
