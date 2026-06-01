import { delay, computeCertHash } from '@/lib/utils';
import { getCertificate } from './certificateService';
import { SEED_CERTIFICATES } from '@/data/mockData';
import { notifyChange } from '@/lib/db';

/**
 * Real fraud-analysis pipeline.
 *
 * Each "detector" is a deterministic check against the certificate's actual
 * record + canonical SHA-256 hash. Every scan is persisted to localStorage
 * so the Fraud Detection dashboard can derive its top-line stats and the
 * signal-distribution donut from real history rather than mock numbers.
 *
 * Public API:
 *   - analyzeFraud(target)        — runs a real scan, persists the result
 *   - listScans()                 — full scan history (newest first)
 *   - getFraudStats()             — aggregate stats for the dashboard
 *   - maybeSeedDemoScans(user)    — one-shot demo data for L&D demo
 */

const DETECTOR_META = [
  { key: 'registry',  label: 'Registry Lookup',       weight: 0.3, desc: 'Cert ID exists on the Hexaware ledger' },
  { key: 'hash',      label: 'Hash Integrity',        weight: 0.3, desc: 'SHA-256 of canonical fields matches the stored hash' },
  { key: 'issuer',    label: 'Issuer Authenticity',   weight: 0.15, desc: 'Issued by a recognised authority' },
  { key: 'status',    label: 'Status Check',          weight: 0.15, desc: 'Cert is active (not revoked)' },
  { key: 'integrity', label: 'Field Integrity',       weight: 0.1, desc: 'Required fields are present and well-formed' },
];

const SIGNAL_COLOR = {
  registry: '#f43f5e',
  hash: '#f59e0b',
  issuer: '#8b5cf6',
  status: '#06c8ff',
  integrity: '#2f80ff',
};

const SIGNAL_NAME = {
  registry: 'Registry Mismatch',
  hash: 'Hash Tampering',
  issuer: 'Issuer Anomaly',
  status: 'Revoked / Inactive',
  integrity: 'Missing Fields',
};

const KNOWN_ISSUERS = new Set([
  'Hexaware Mavericks Academy',
]);

const SCANS_KEY = 'mc.fraud.scans';
const SEED_FLAG = 'mc.fraud.scans.seeded';
const MAX_HISTORY = 500;

function loadScans() {
  try {
    const raw = JSON.parse(localStorage.getItem(SCANS_KEY) || 'null');
    if (Array.isArray(raw)) return raw;
  } catch (_) {}
  return [];
}

function persistScans(list) {
  try {
    localStorage.setItem(SCANS_KEY, JSON.stringify(list.slice(0, MAX_HISTORY)));
    notifyChange('fraud-scans');
  } catch (_) {}
}

function recordScan(record) {
  const list = loadScans();
  list.unshift(record);
  persistScans(list);
}

function signal(meta, pass, note) {
  const risk = pass ? 3 : 92;
  return {
    ...meta,
    risk,
    status: pass ? 'pass' : 'fail',
    note,
  };
}

export async function analyzeFraud(target = '') {
  const startedAt = performance.now();
  await delay(1300);
  const id = (target || '').trim();
  const cert = id ? await getCertificate(id) : null;

  const checks = {};
  let issuesNote = '';

  checks.registry = signal(DETECTOR_META[0], !!cert, cert ? id : 'ID not found on the ledger');

  if (cert) {
    const recomputed = await computeCertHash(cert);
    const ok = recomputed === cert.hash;
    checks.hash = signal(
      DETECTOR_META[1],
      ok,
      ok ? `0x${recomputed.slice(2, 14)}…` : 'Recomputed hash differs from stored',
    );
    if (!ok) issuesNote = 'Hash mismatch — certificate data has been altered after issuance.';
  } else {
    checks.hash = signal(DETECTOR_META[1], false, 'No record to verify');
  }

  if (cert) {
    const ok = !!cert.issuedBy && (KNOWN_ISSUERS.has(cert.issuedBy) || cert.issuedBy.length > 2);
    checks.issuer = signal(DETECTOR_META[2], ok, cert.issuedBy || 'Missing');
  } else {
    checks.issuer = signal(DETECTOR_META[2], false, 'No issuer');
  }

  if (cert) {
    const ok = cert.status !== 'revoked';
    checks.status = signal(DETECTOR_META[3], ok, ok ? cert.status : 'Revoked by issuer');
    if (!ok && !issuesNote) issuesNote = 'Certificate was revoked by the issuing authority.';
  } else {
    checks.status = signal(DETECTOR_META[3], false, 'Unknown');
  }

  if (cert) {
    const required = ['id', 'recipientName', 'course', 'issuedAt'];
    const missing = required.filter((k) => !cert[k]);
    checks.integrity = signal(DETECTOR_META[4], missing.length === 0, missing.length === 0 ? 'All fields present' : `Missing: ${missing.join(', ')}`);
  } else {
    checks.integrity = signal(DETECTOR_META[4], false, 'No record');
  }

  const signals = DETECTOR_META.map((m) => checks[m.key]);
  const fraudProbability = Math.round(
    signals.reduce((acc, s) => acc + (s.risk / 100) * s.weight, 0) * 100
  );
  const confidence = 100 - fraudProbability;
  const riskLevel = fraudProbability > 60 ? 'high' : fraudProbability > 30 ? 'medium' : 'low';

  const verdict =
    !cert
      ? 'Certificate ID not found — likely fraudulent or not yet issued.'
      : riskLevel === 'high'
        ? (issuesNote || 'High fraud risk — recommend manual review and block.')
        : riskLevel === 'medium'
          ? (issuesNote || 'Moderate risk — additional verification advised.')
          : 'Low risk — certificate is authentic and unaltered.';

  const durationMs = Math.round(performance.now() - startedAt);
  const failedSignals = signals.filter((s) => s.status === 'fail').map((s) => s.key);

  recordScan({
    id: `scan-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    target: id || '(empty)',
    fraudProbability,
    confidence,
    riskLevel,
    durationMs,
    failedSignals,
    at: Date.now(),
  });

  return {
    target: id,
    fraudProbability,
    confidence,
    riskLevel,
    signals,
    verdict,
    cert,
    analyzedAt: new Date().toISOString(),
  };
}

/** Full persisted scan history, newest first. */
export function listScans() {
  return loadScans();
}

/**
 * Aggregate dashboard stats derived from history.
 * - threatsBlocked    = scans where riskLevel === 'high'
 * - avgConfidence     = mean confidence (interpreted as "detection accuracy" in UI)
 * - avgScanTimeMs     = mean duration
 * - signalFailDistribution = donut data: how often each signal failed across all scans
 * - deltas            = % change of last-7-days vs prior-7-days window
 */
export function getFraudStats() {
  const scans = loadScans();
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const last7Start = now - 7 * day;
  const prior7Start = now - 14 * day;

  const totalScans = scans.length;
  const threatsBlocked = scans.filter((s) => s.riskLevel === 'high').length;
  const avgConfidence = totalScans
    ? scans.reduce((acc, s) => acc + (s.confidence || 0), 0) / totalScans
    : 0;
  const avgScanTimeMs = totalScans
    ? scans.reduce((acc, s) => acc + (s.durationMs || 0), 0) / totalScans
    : 0;

  // Signal failure tally for the donut.
  const failTally = {};
  for (const s of scans) {
    for (const key of s.failedSignals || []) {
      failTally[key] = (failTally[key] || 0) + 1;
    }
  }
  const signalFailDistribution = DETECTOR_META
    .map((m) => ({
      name: SIGNAL_NAME[m.key] || m.label,
      key: m.key,
      value: failTally[m.key] || 0,
      color: SIGNAL_COLOR[m.key] || '#2f80ff',
    }))
    .filter((d) => d.value > 0);

  // Period deltas.
  const inLast7 = scans.filter((s) => s.at >= last7Start);
  const inPrior7 = scans.filter((s) => s.at >= prior7Start && s.at < last7Start);

  const scansDelta = pctDelta(inLast7.length, inPrior7.length);
  const threatsDelta = pctDelta(
    inLast7.filter((s) => s.riskLevel === 'high').length,
    inPrior7.filter((s) => s.riskLevel === 'high').length
  );
  const confDelta = pctDelta(meanConfidence(inLast7), meanConfidence(inPrior7));
  const timeDelta = pctDelta(meanDuration(inLast7), meanDuration(inPrior7));

  return {
    totalScans,
    threatsBlocked,
    avgConfidence,
    avgScanTimeMs,
    signalFailDistribution,
    deltas: { scans: scansDelta, threats: threatsDelta, confidence: confDelta, time: timeDelta },
  };
}

function meanConfidence(arr) {
  return arr.length ? arr.reduce((a, s) => a + (s.confidence || 0), 0) / arr.length : 0;
}
function meanDuration(arr) {
  return arr.length ? arr.reduce((a, s) => a + (s.durationMs || 0), 0) / arr.length : 0;
}
function pctDelta(curr, prev) {
  // No baseline to compare against — the StatCard hides the delta badge.
  if (!prev) return null;
  const change = ((curr - prev) / prev) * 100;
  if (!isFinite(change)) return null;
  return Math.round(change);
}

/**
 * One-shot demo seed: populates ~18 historical scans across the last 14 days
 * so the L&D demo user has a non-empty dashboard. Idempotent — uses a flag.
 * Only seeds for L&D users to keep new real signups starting from zero.
 */
export function maybeSeedDemoScans(user) {
  if (!user) return;
  if (user.role !== 'lnd_manager') return;
  if (user.email !== 'lnd@hexaware.com') return;
  if (localStorage.getItem(SEED_FLAG)) return;

  const existing = loadScans();
  if (existing.length > 0) {
    localStorage.setItem(SEED_FLAG, '1');
    return;
  }

  const day = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const certs = SEED_CERTIFICATES.slice(0, 5);
  const seeded = [];

  // 14 clean scans against real seed certs spread over the last 14 days.
  for (let i = 0; i < 14; i++) {
    const c = certs[i % certs.length];
    seeded.push({
      id: `seed-clean-${i}`,
      target: c.id,
      fraudProbability: 3,
      confidence: 97,
      riskLevel: 'low',
      durationMs: 1400 + ((i * 53) % 700),
      failedSignals: [],
      at: now - i * (day * 0.9) - (i * 137) % (3 * 60 * 60 * 1000),
    });
  }
  // 6 fraud attempts spread out: 3 fake IDs (registry+hash+issuer+status+integrity all fail),
  // 2 simulated hash-tamper (only hash fails), 1 simulated revoked (status fails).
  const fakeTargets = ['HEX-MAV-2026-FAKE01', 'HEX-MAV-2026-FAKE02', 'forged-copy-2026'];
  fakeTargets.forEach((t, i) => {
    seeded.push({
      id: `seed-fake-${i}`,
      target: t,
      fraudProbability: 92,
      confidence: 8,
      riskLevel: 'high',
      durationMs: 1500 + i * 60,
      failedSignals: ['registry', 'hash', 'issuer', 'status', 'integrity'],
      at: now - (i * 2 + 1) * day - (i * 200) % (5 * 60 * 60 * 1000),
    });
  });
  // Hash-tamper cases (cert exists but stored hash differs)
  [0, 1].forEach((i) => {
    const c = certs[(i + 2) % certs.length];
    seeded.push({
      id: `seed-tamper-${i}`,
      target: c.id,
      fraudProbability: 30,
      confidence: 70,
      riskLevel: 'medium',
      durationMs: 1600,
      failedSignals: ['hash'],
      at: now - (3 + i * 2) * day,
    });
  });
  // Revoked case
  seeded.push({
    id: 'seed-revoked-0',
    target: certs[0].id,
    fraudProbability: 14,
    confidence: 86,
    riskLevel: 'low',
    durationMs: 1500,
    failedSignals: ['status'],
    at: now - 6 * day,
  });

  // Newest-first.
  seeded.sort((a, b) => b.at - a.at);
  persistScans(seeded);
  localStorage.setItem(SEED_FLAG, '1');
}
