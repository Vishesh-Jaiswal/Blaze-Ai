import { TEMPLATES } from '@/data/mockData';
import { formatDate } from './utils';

/**
 * Export a certificate as a self-contained, printable HTML document and
 * trigger a download. This works with zero extra dependencies and produces a
 * real artifact the user can open and print to PDF from their browser.
 */
export function downloadCertificateHtml(cert) {
  const tpl = TEMPLATES.find((t) => t.id === cert.templateId) || TEMPLATES[0];
  const skills = (cert.skills || []).map((s) => `<span class="skill">${s}</span>`).join('');

  const html = `<!doctype html>
<html><head><meta charset="utf-8"/>
<title>${cert.recipientName} — ${cert.course}</title>
<style>
  @page { size: A4 landscape; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Inter, sans-serif; }
  body { background:#05060f; display:flex; align-items:center; justify-content:center; min-height:100vh; padding:24px; }
  .cert { position:relative; width:1100px; height:778px; background:#080a18; border-radius:24px; overflow:hidden; color:#fff;
          box-shadow:0 30px 80px rgba(0,0,0,.6); border:1px solid rgba(255,255,255,.08); }
  .band { position:absolute; inset:0 0 auto 0; height:8px; background:${tpl.gradient}; }
  .glow { position:absolute; width:380px; height:380px; border-radius:50%; filter:blur(80px); opacity:.35; background:${tpl.accent}; }
  .glow.tr { top:-160px; right:-120px; } .glow.bl { bottom:-180px; left:-120px; opacity:.25; }
  .inner { position:relative; padding:64px; height:100%; display:flex; flex-direction:column; }
  .brand { display:flex; align-items:center; gap:14px; }
  .logo { width:46px; height:46px; border-radius:12px; background:${tpl.gradient}; display:flex; align-items:center; justify-content:center; font-weight:800; }
  .eyebrow { letter-spacing:.3em; text-transform:uppercase; font-size:13px; color:#94a3b8; }
  .name { font-size:54px; font-weight:800; margin-top:6px; text-shadow:0 0 40px ${tpl.accent}66; }
  .course { color:${tpl.accent}; font-weight:700; }
  .summary { color:#94a3b8; max-width:760px; margin-top:18px; line-height:1.6; font-size:15px; }
  .skills { margin-top:22px; display:flex; gap:10px; flex-wrap:wrap; }
  .skill { background:${tpl.accent}22; color:${tpl.accent}; padding:6px 14px; border-radius:8px; font-size:13px; font-weight:600; }
  .footer { margin-top:auto; display:flex; justify-content:space-between; align-items:flex-end; border-top:1px solid rgba(255,255,255,.1); padding-top:20px; }
  .sig { font-style:italic; font-size:20px; } .meta { color:#64748b; font-size:12px; margin-top:6px; }
  .center { flex:1; display:flex; flex-direction:column; justify-content:center; }
  .frame { position:absolute; inset:16px; border:1px solid rgba(255,255,255,.1); border-radius:16px; pointer-events:none; }
</style></head>
<body onload="window.print && setTimeout(()=>{},300)">
  <div class="cert">
    <div class="band"></div><div class="glow tr"></div><div class="glow bl"></div>
    <div class="inner">
      <div class="brand"><div class="logo">M</div>
        <div><div style="font-weight:800;font-size:18px;">Mavericks Certify</div>
        <div class="eyebrow">Hexaware Technologies</div></div></div>
      <div class="center">
        <div class="eyebrow">Certificate of Achievement</div>
        <div style="color:#94a3b8;margin-top:8px;">This is proudly presented to</div>
        <div class="name">${cert.recipientName}</div>
        <div style="margin-top:10px;font-size:18px;">for successfully completing <span class="course">${cert.course}</span></div>
        ${cert.summary ? `<div class="summary">${cert.summary}</div>` : ''}
        <div class="skills">
          ${cert.score != null ? `<span class="skill">Score: ${cert.score}%</span>` : ''}
          ${cert.duration ? `<span class="skill">Duration: ${cert.duration}</span>` : ''}
          ${skills}
        </div>
      </div>
      <div class="footer">
        <div><div class="sig">${cert.manager || 'Program Manager'}</div>
          <div style="width:160px;height:1px;background:rgba(255,255,255,.2);margin:6px 0;"></div>
          <div class="meta">Program Manager · ${cert.department || 'Hexaware Mavericks'}</div>
          <div class="meta">ID: ${cert.id} · Issued ${formatDate(cert.issuedAt)}</div>
          <div class="meta">Hash: ${(cert.hash || '').slice(0, 34)}…</div>
        </div>
        <div style="text-align:center;"><div style="font-size:12px;color:#64748b;">Verify at mavericks-certify</div>
          <div class="meta">Scan QR on portal</div></div>
      </div>
    </div>
    <div class="frame"></div>
  </div>
</body></html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${cert.id}-${cert.recipientName.replace(/\s+/g, '_')}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
