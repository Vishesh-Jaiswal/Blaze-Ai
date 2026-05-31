import { QRCodeSVG } from 'qrcode.react';

/**
 * Real scannable QR code for certificate verification.
 *
 * The QR encodes the public verification URL for this credential:
 *   {origin}/verify?id=CERT_ID
 *
 * Scanning it with any phone camera opens the public verifier with the
 * cert ID pre-filled — no login required.
 *
 * If a `value` prop is passed explicitly, that takes precedence (so the
 * component can still be reused for ad-hoc payloads).
 */
export default function QRCode({
  value,
  certId,
  size = 120,
  fg = '#05060f',
  bg = '#ffffff',
  className = '',
}) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const payload = value || (certId ? `${origin}/verify?id=${encodeURIComponent(certId)}` : `${origin}/verify`);

  return (
    <QRCodeSVG
      value={payload}
      size={size}
      bgColor={bg}
      fgColor={fg}
      level="M"
      marginSize={2}
      className={className}
    />
  );
}
