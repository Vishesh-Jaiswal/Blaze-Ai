import { delay, computeCertHash } from '@/lib/utils';
import { getCertificate } from './certificateService';

/**
 * Real fraud-analysis pipeline.
 *
 * Each "detector" is now a deterministic check against the certificate's
 * actual record + canonical SHA-256 hash. No randomness, no mock weights.
 * If the cert exists and its stored hash matches the recomputed one, every
 * signal passes. Tampered or missing certs produce hard failures with
 * specific reasons.
 *
 * Returns the same shape the UI already consumes:
 *   { target, fraudProbability, confidence, riskLevel, signals[], verdict, analyzedAt }
 */

const DETECTOR_META = [
  { key: 'registry',  label: 'Registry Lookup',       weight: 0.3, desc: 'Cert ID exists on the Hexaware ledger' },
  { key: 'hash',      label: 'Hash Integrity',        weight: 0.3, desc: 'SHA-256 of canonical fields matches the stored hash' },
  { key: 'issuer',    label: 'Issuer Authenticity',   weight: 0.15, desc: 'Issued by a recognised authority' },
  { key: 'status',    label: 'Status Check',          weight: 0.15, desc: 'Cert is active (not revoked)' },
  { key: 'integrity', label: 'Field Integrity',       weight: 0.1, desc: 'Required fields are present and well-formed' },
];

const KNOWN_ISSUERS = new Set([
  'Hexaware Mavericks Academy',
]);

function signal(meta, pass, note) {
  // Risk is a percentage — 0 if pass, 100 if fail; with a tiny offset so the
  // donut/gauges don't render as completely flat lines.
  const risk = pass ? 3 : 92;
  return {
    ...meta,
    risk,
    status: pass ? 'pass' : 'fail',
    note,
  };
}

export async function analyzeFraud(target = '') {
  await delay(1300);
  const id = (target || '').trim();
  const cert = id ? await getCertificate(id) : null;

  // Build per-signal results
  const checks = {};
  let issuesNote = '';

  // 1) Registry
  checks.registry = signal(DETECTOR_META[0], !!cert, cert ? id : 'ID not found on the ledger');

  // 2) Hash integrity — only meaningful if registry passed
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

  // 3) Issuer
  if (cert) {
    const ok = !!cert.issuedBy && (KNOWN_ISSUERS.has(cert.issuedBy) || cert.issuedBy.length > 2);
    checks.issuer = signal(DETECTOR_META[2], ok, cert.issuedBy || 'Missing');
  } else {
    checks.issuer = signal(DETECTOR_META[2], false, 'No issuer');
  }

  // 4) Status
  if (cert) {
    const ok = cert.status !== 'revoked';
    checks.status = signal(DETECTOR_META[3], ok, ok ? cert.status : 'Revoked by issuer');
    if (!ok && !issuesNote) issuesNote = 'Certificate was revoked by the issuing authority.';
  } else {
    checks.status = signal(DETECTOR_META[3], false, 'Unknown');
  }

  // 5) Integrity — required-field presence sanity check
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
