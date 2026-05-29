import { delay, seededRandom } from '@/lib/utils';

/**
 * AI fraud-analysis simulation. Runs a series of "detectors" and returns a
 * weighted risk score with per-signal breakdown for the fraud dashboard.
 */
const DETECTORS = [
  { key: 'layout', label: 'Layout Analysis', weight: 0.25, desc: 'Pixel-level template structure comparison' },
  { key: 'font', label: 'Font Mismatch Detection', weight: 0.2, desc: 'Glyph & kerning fingerprinting' },
  { key: 'metadata', label: 'Metadata Forensics', weight: 0.2, desc: 'Document origin & edit-history trace' },
  { key: 'qr', label: 'QR Authenticity', weight: 0.2, desc: 'Cryptographic QR payload validation' },
  { key: 'anomaly', label: 'Anomaly Detection', weight: 0.15, desc: 'ML outlier scoring vs. issuance baseline' },
];

/**
 * Analyse a target (cert id or file name). Returns risk model.
 */
export async function analyzeFraud(target = '') {
  await delay(1600);
  const forceFraud = /fake|copy|tamper|forged/i.test(target);

  const signals = DETECTORS.map((d) => {
    const base = seededRandom(target + d.key);
    let risk = forceFraud ? 0.55 + base * 0.4 : base * 0.35;
    risk = Math.min(0.99, Math.max(0.02, risk));
    return {
      ...d,
      risk: Math.round(risk * 100),
      status: risk > 0.6 ? 'fail' : risk > 0.35 ? 'warn' : 'pass',
    };
  });

  const fraudProbability = Math.round(
    signals.reduce((acc, s) => acc + (s.risk / 100) * s.weight, 0) * 100
  );
  const confidence = 100 - fraudProbability;
  const riskLevel = fraudProbability > 60 ? 'high' : fraudProbability > 30 ? 'medium' : 'low';

  return {
    target,
    fraudProbability,
    confidence,
    riskLevel,
    signals,
    verdict:
      riskLevel === 'high'
        ? 'High fraud risk — recommend manual review and block.'
        : riskLevel === 'medium'
        ? 'Moderate risk — additional verification advised.'
        : 'Low risk — certificate appears authentic.',
    analyzedAt: new Date().toISOString(),
  };
}
