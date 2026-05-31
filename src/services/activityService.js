/**
 * Per-user activity log. localStorage-backed, keyed by user id.
 * Powers:
 *  - Weekly activity chart (7-day bucketed counts)
 *  - Recognition timeline (recent milestone events)
 *  - Notifications dropdown (real-time approvals/rejections, etc.)
 *
 * Admin actions that target a Maverick (e.g. approval) write to that
 * Maverick's log so the notification appears on their next session.
 */

const KEY = (userId) => `mc.activity.${userId}`;
const MAX_EVENTS = 200;

export const EVENT_TYPES = {
  SUBMITTED: 'submitted',
  APPROVED: 'cert_approved',
  REJECTED: 'cert_rejected',
  VERIFIED: 'verified',
  ISSUED: 'cert_issued',
  VIEWED_PDF: 'viewed_pdf',
  LOGGED_IN: 'logged_in',
};

function load(userId) {
  if (!userId) return [];
  try {
    const v = JSON.parse(localStorage.getItem(KEY(userId)) || 'null');
    if (Array.isArray(v)) return v;
  } catch (_) {}
  return [];
}

function save(userId, events) {
  if (!userId) return;
  try {
    localStorage.setItem(KEY(userId), JSON.stringify(events.slice(0, MAX_EVENTS)));
  } catch (_) {}
}

let counter = 0;
function nextId() {
  counter += 1;
  return `evt-${Date.now().toString(36)}-${counter}`;
}

export function trackEvent(userId, type, payload = {}) {
  if (!userId || !type) return;
  const events = load(userId);
  events.unshift({ id: nextId(), type, payload, at: Date.now() });
  save(userId, events);
}

export function listEvents(userId) {
  return load(userId);
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Returns the last 7 calendar days bucketed by event count.
 * Today is always the rightmost bar.
 */
export function getWeeklyActivity(userId) {
  const events = load(userId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const buckets = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const start = d.getTime();
    const end = start + 86400000;
    const count = events.filter((e) => e.at >= start && e.at < end).length;
    buckets.push({ day: DAY_LABELS[d.getDay()], value: count });
  }
  return buckets;
}

const MILESTONE_TYPES = new Set([
  EVENT_TYPES.SUBMITTED,
  EVENT_TYPES.APPROVED,
  EVENT_TYPES.REJECTED,
  EVENT_TYPES.VERIFIED,
  EVENT_TYPES.ISSUED,
]);

export function getMilestones(userId, limit = 6) {
  return load(userId).filter((e) => MILESTONE_TYPES.has(e.type)).slice(0, limit);
}

/**
 * Seed a rich activity history for the demo Maverick on first session.
 * Idempotent — only seeds when the user has zero events.
 */
export function maybeSeedDemoActivity(user) {
  if (!user) return;
  const isDemoMaverick = user.email === 'maverick@hexaware.com';
  if (!isDemoMaverick) return;
  const existing = load(user.id);
  if (existing.length > 0) return;

  const now = Date.now();
  const hours = (h) => now - h * 3600 * 1000;
  const days = (d) => now - d * 86400 * 1000;

  const seed = [
    { type: EVENT_TYPES.APPROVED, payload: { certificateName: 'Advanced React & System Design' }, at: hours(2) },
    { type: EVENT_TYPES.VERIFIED, payload: { by: 'Acme Corp', certificateName: 'Cloud Foundations on AWS' }, at: hours(8) },
    { type: EVENT_TYPES.VIEWED_PDF, payload: {}, at: hours(20) },
    { type: EVENT_TYPES.LOGGED_IN, payload: {}, at: days(1) + 3600000 },
    { type: EVENT_TYPES.VIEWED_PDF, payload: {}, at: days(1) + 9000000 },
    { type: EVENT_TYPES.SUBMITTED, payload: { certificateName: 'AWS Solutions Architect' }, at: days(2) },
    { type: EVENT_TYPES.LOGGED_IN, payload: {}, at: days(2) + 7200000 },
    { type: EVENT_TYPES.VIEWED_PDF, payload: {}, at: days(3) },
    { type: EVENT_TYPES.ISSUED, payload: { certificateName: 'Cloud Foundations on AWS' }, at: days(4) },
    { type: EVENT_TYPES.VERIFIED, payload: { by: 'Globex HR' }, at: days(5) },
    { type: EVENT_TYPES.LOGGED_IN, payload: {}, at: days(5) + 14400000 },
    { type: EVENT_TYPES.VIEWED_PDF, payload: {}, at: days(6) },
  ];

  save(user.id, seed.map((e, i) => ({ ...e, id: `seed-${i}` })));
}
