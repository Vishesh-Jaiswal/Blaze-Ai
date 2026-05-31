/**
 * Certificate PDF export.
 * Rasterizes the on-screen <CertificatePreview /> DOM node with html2canvas
 * and embeds it into a landscape A4 PDF via jsPDF.
 *
 * Two entry points:
 *  - viewCertificatePdf(node, cert)     → opens the PDF in a new browser tab
 *  - downloadCertificatePdf(node, cert) → triggers a file download
 *
 * Both dynamically import the heavy libs so they don't bloat the initial bundle.
 */

function safeFileName(cert) {
  const name = (cert?.recipientName || 'maverick').replace(/\s+/g, '_');
  const id = cert?.id || 'certificate';
  return `${id}-${name}.pdf`;
}

async function rasterizeToPdf(node, cert) {
  if (!node) throw new Error('Certificate preview node is not mounted yet');

  const [{ default: html2canvas }, jsPdfMod] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);
  const jsPDF = jsPdfMod.jsPDF || jsPdfMod.default;

  const canvas = await html2canvas(node, {
    backgroundColor: '#080a18',
    scale: 2,
    useCORS: true,
    logging: false,
    windowWidth: node.scrollWidth,
    windowHeight: node.scrollHeight,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 24;
  const maxW = pageW - margin * 2;
  const maxH = pageH - margin * 2;
  const imgRatio = canvas.width / canvas.height;
  const boxRatio = maxW / maxH;

  let w, h;
  if (imgRatio > boxRatio) {
    w = maxW;
    h = w / imgRatio;
  } else {
    h = maxH;
    w = h * imgRatio;
  }
  const x = (pageW - w) / 2;
  const y = (pageH - h) / 2;

  pdf.addImage(imgData, 'PNG', x, y, w, h);

  pdf.setProperties({
    title: `${cert?.recipientName || ''} — ${cert?.course || 'Certificate'}`,
    subject: 'Mavericks Certify',
    author: 'Hexaware Mavericks Academy',
    keywords: cert?.id || '',
    creator: 'Mavericks Certify',
  });

  return pdf;
}

export async function viewCertificatePdf(node, cert) {
  const pdf = await rasterizeToPdf(node, cert);
  const blob = pdf.output('blob');
  const url = URL.createObjectURL(blob);
  // Open in new tab. Browsers render PDFs inline via the built-in viewer.
  window.open(url, '_blank', 'noopener,noreferrer');
  // Keep the blob URL alive long enough for the new tab to fetch it.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function downloadCertificatePdf(node, cert) {
  const pdf = await rasterizeToPdf(node, cert);
  pdf.save(safeFileName(cert));
}
