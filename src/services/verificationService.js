import { delay } from '@/lib/utils';
import { getCertificate } from './certificateService';

/**
 * Certificate verification — simulates a blockchain-style ledger lookup
 * plus a confidence-scored authenticity check.
 */
export async function verifyById(certId) {
  await delay(1400);
  const cert = await getCertificate(certId?.trim());

  if (!cert) {
    return {
      result: 'not_found',
      confidence: 0,
      certId,
      message: 'No certificate matches this ID on the Hexaware ledger.',
      checks: [
        { label: 'Ledger record', pass: false },
        { label: 'Hash integrity', pass: false },
        { label: 'Issuer signature', pass: false },
        { label: 'QR authenticity', pass: false },
      ],
    };
  }

  if (cert.status === 'revoked') {
    return {
      result: 'revoked',
      confidence: 100,
      cert,
      certId,
      message: 'This certificate has been revoked by the issuing authority.',
      checks: [
        { label: 'Ledger record', pass: true },
        { label: 'Hash integrity', pass: true },
        { label: 'Issuer signature', pass: true },
        { label: 'Revocation status', pass: false, note: 'Revoked' },
      ],
    };
  }

  return {
    result: 'authentic',
    confidence: 97 + (certId.length % 3),
    cert,
    certId,
    message: 'Certificate is authentic and verified on the Hexaware ledger.',
    blockHeight: 1480000 + (certId.charCodeAt(certId.length - 1) % 9999),
    checks: [
      { label: 'Ledger record', pass: true },
      { label: 'Hash integrity', pass: true },
      { label: 'Issuer signature', pass: true },
      { label: 'QR authenticity', pass: true },
      { label: 'Tamper check', pass: true },
    ],
  };
}

/**
 * Simulate verifying an uploaded file (e.g. PDF). We can't truly inspect it
 * in the mock, so we derive a deterministic-ish result from the file name/size.
 */
export async function verifyUpload(file) {
  await delay(1800);
  const suspicious = /copy|edit|fake|test|untitled/i.test(file?.name || '');
  if (suspicious) {
    return {
      result: 'suspicious',
      confidence: 44,
      message: 'This document shows signs of tampering and could not be verified.',
      checks: [
        { label: 'File integrity', pass: true },
        { label: 'Embedded QR', pass: false, note: 'Missing' },
        { label: 'Metadata match', pass: false, note: 'Anomaly' },
        { label: 'Layout analysis', pass: false, note: 'Mismatch' },
      ],
    };
  }
  return {
    result: 'authentic',
    confidence: 95,
    message: 'Document verified successfully against the Hexaware ledger.',
    checks: [
      { label: 'File integrity', pass: true },
      { label: 'Embedded QR', pass: true },
      { label: 'Metadata match', pass: true },
      { label: 'Layout analysis', pass: true },
    ],
  };
}
