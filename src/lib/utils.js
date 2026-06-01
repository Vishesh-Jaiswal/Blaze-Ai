// Small utility helpers used across the app.

/**
 * Conditionally join class names (tiny clsx replacement).
 * @param  {...any} classes
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

/** Sleep helper to simulate async network latency in mock services. */
export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Format a number with thousands separators. */
export const formatNumber = (n) =>
  new Intl.NumberFormat('en-US').format(Math.round(n || 0));

/** Format an ISO date string into a friendly label. */
export function formatDate(iso, opts) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...opts,
  });
}

/** Relative time, e.g. "2 days ago". */
export function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.round(months / 12)}y ago`;
}

/** Deterministic pseudo-random number from a string seed (stable across renders). */
export function seededRandom(seed) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return ((h ^= h >>> 16) >>> 0) / 4294967296;
}

/**
 * Real SHA-256 hash via Web Crypto. Returns a 64-char lowercase hex string.
 * Anyone (verifier, client, recruiter) can recompute this from a cert's
 * canonical fields and compare to detect tampering.
 */
export async function sha256(text) {
  const buf = new TextEncoder().encode(String(text));
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Canonical serialization of a cert for hashing. Order is fixed and
 * deliberately excludes mutable fields (verifications counter, hash itself).
 */
export function canonicalCertPayload(cert) {
  return [
    cert.id,
    cert.recipientId || '',
    cert.recipientName || '',
    cert.course || '',
    cert.department || '',
    String(cert.score ?? ''),
    String(cert.learningHours ?? ''),
    cert.issuedAt || '',
    cert.issuedBy || '',
    cert.templateId || '',
  ].join('|');
}

/** Compute the canonical SHA-256 hash for a certificate, prefixed with 0x. */
export async function computeCertHash(cert) {
  return '0x' + (await sha256(canonicalCertPayload(cert)));
}

/** Generate a human-friendly certificate ID, e.g. HEX-MAV-2026-8F3A1C. */
export function generateCertificateId() {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(16).slice(2, 8).toUpperCase();
  return `HEX-MAV-${year}-${rand}`;
}

/** Get initials from a full name. */
export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

/** Clamp a number between min and max. */
export const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

/** Truncate text with an ellipsis. */
export const truncate = (str = '', len = 80) =>
  str.length > len ? str.slice(0, len).trim() + '…' : str;
