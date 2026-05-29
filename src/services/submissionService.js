import { delay, generateCertificateId, generateHash } from '@/lib/utils';
import { SEED_SUBMISSIONS } from '@/data/mockData';
import { createCertificate } from '@/services/certificateService';

/**
 * Certificate submission workflow layer (localStorage-backed mock DB).
 *
 * A "submission" is a Maverick-originated request that flows:
 *   pending → (admin review) → approved (issues a certificate) | rejected
 *
 * Internal submissions carry an assessment score; external submissions also
 * carry an issuing organisation and uploaded proof documents.
 */
const KEY = 'mc.submissions';

function load() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (Array.isArray(stored)) return stored;
  } catch (_) {}
  localStorage.setItem(KEY, JSON.stringify(SEED_SUBMISSIONS));
  return SEED_SUBMISSIONS;
}

function save(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

const byNewest = (a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0);

export async function listSubmissions(filter = {}) {
  await delay(400);
  let list = load();
  if (filter.submittedById) list = list.filter((s) => s.submittedById === filter.submittedById);
  if (filter.status) list = list.filter((s) => s.status === filter.status);
  if (filter.type) list = list.filter((s) => s.type === filter.type);
  return [...list].sort(byNewest);
}

export async function getSubmission(id) {
  await delay(250);
  return load().find((s) => s.id === id) || null;
}

let counter = 5;
function nextId() {
  const seq = String(counter++).padStart(4, '0');
  return `SUB-2026-${seq}`;
}

export async function createSubmission(data) {
  await delay(700);
  const submission = {
    id: nextId(),
    type: data.type || 'internal',
    submittedById: data.submittedById,
    submittedByName: data.submittedByName,
    submittedByEmail: data.submittedByEmail,
    department: data.department || '',
    certificateName: data.certificateName,
    issuingOrg:
      data.issuingOrg || (data.type === 'external' ? '' : 'Hexaware Mavericks Academy'),
    score: data.score ?? null,
    completionDate: data.completionDate || '',
    remarks: data.remarks || '',
    skills: data.skills || [],
    documents: data.documents || [],
    status: 'pending',
    submittedAt: new Date().toISOString(),
    reviewedAt: null,
    reviewedBy: null,
    adminComment: '',
    issuedCertId: null,
  };
  save([submission, ...load()]);
  return submission;
}

/**
 * Admin decision. On approval an issued certificate is minted and linked back.
 * `decision` = 'approved' | 'rejected'.
 */
export async function reviewSubmission(id, { decision, comment = '', reviewer, templateId = 'aurora' }) {
  await delay(600);
  const list = load();
  const submission = list.find((s) => s.id === id);
  if (!submission) return null;

  let issuedCertId = submission.issuedCertId;
  if (decision === 'approved' && !issuedCertId) {
    const cert = await createCertificate({
      recipientName: submission.submittedByName,
      recipientId: submission.submittedById,
      course: submission.certificateName,
      department: submission.department,
      score: submission.score,
      skills: submission.skills,
      templateId,
      issuedBy: submission.issuingOrg || 'Hexaware Mavericks Academy',
      source: submission.type,
      summary: `${submission.submittedByName} successfully completed ${submission.certificateName}${
        submission.issuingOrg ? ` issued by ${submission.issuingOrg}` : ''
      }.`,
    });
    issuedCertId = cert.id;
  }

  const updated = {
    ...submission,
    status: decision,
    reviewedAt: new Date().toISOString(),
    reviewedBy: reviewer || 'Administrator',
    adminComment: comment,
    issuedCertId,
  };
  save(list.map((s) => (s.id === id ? updated : s)));
  return updated;
}

export async function pendingCount() {
  return load().filter((s) => s.status === 'pending').length;
}
