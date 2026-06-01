import { delay, generateCertificateId } from '@/lib/utils';
import { SEED_SUBMISSIONS } from '@/data/mockData';
import { createCertificate } from '@/services/certificateService';
import { trackEvent, EVENT_TYPES } from '@/services/activityService';
import { notifyChange } from '@/lib/db';

/**
 * Certificate submission workflow layer (localStorage-backed mock DB).
 *
 * A "submission" is a Maverick-originated request that flows:
 *   pending → (admin review) → approved (issues a certificate) | rejected
 *
 * Internal submissions carry an assessment score; external submissions also
 * carry an issuing organisation and uploaded proof documents.
 */
const KEY = 'mc.submissions.v2';

/**
 * Collapse rows that share an id. Last write wins — keeps the most recently
 * updated copy (since reviewSubmission and createSubmission both append).
 * Auto-fixes the duplicate-row issue caused by an earlier collision in
 * `nextId()` where the module counter would reset on page reload.
 */
function dedupe(list) {
  const map = new Map();
  for (const s of list) {
    if (s && s.id) map.set(s.id, s);
  }
  return Array.from(map.values());
}

function load() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (Array.isArray(stored)) {
      const deduped = dedupe(stored);
      if (deduped.length !== stored.length) {
        // Persist the cleaned list so the fix is durable.
        localStorage.setItem(KEY, JSON.stringify(deduped));
        notifyChange('submissions');
      }
      return deduped;
    }
  } catch (_) {}
  localStorage.setItem(KEY, JSON.stringify(SEED_SUBMISSIONS));
  notifyChange('submissions');
  return SEED_SUBMISSIONS;
}

function save(list) {
  // Always dedupe on the way in so an upstream bug can never persist duplicates.
  const clean = dedupe(list);
  localStorage.setItem(KEY, JSON.stringify(clean));
  notifyChange('submissions');
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

/**
 * Deterministic next ID — derived from the current max in the registry so it
 * never collides even when the page is reloaded mid-session. Year prefix
 * tracks the current calendar year.
 */
function nextId() {
  const list = load();
  let max = 0;
  for (const s of list) {
    const m = String(s.id || '').match(/^SUB-\d{4}-(\d{4,})$/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > max) max = n;
    }
  }
  const seq = String(max + 1).padStart(4, '0');
  return `SUB-${new Date().getFullYear()}-${seq}`;
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
  trackEvent(submission.submittedById, EVENT_TYPES.SUBMITTED, {
    submissionId: submission.id,
    certificateName: submission.certificateName,
    issuingOrg: submission.issuingOrg,
  });
  return submission;
}

/**
 * Admin decision. On approval an issued certificate is minted and linked back.
 * `decision` = 'approved' | 'rejected'.
 */
export async function reviewSubmission(id, { decision, comment = '', reviewer, templateId = 'aurora', learningHours = 0 }) {
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
      learningHours,
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
    awardedHours: decision === 'approved' ? learningHours : 0,
    issuedCertId,
  };
  save(list.map((s) => (s.id === id ? updated : s)));

  // Notify the recipient Maverick — write to THEIR activity log so the
  // approval/rejection shows up in their notifications & timeline.
  trackEvent(
    submission.submittedById,
    decision === 'approved' ? EVENT_TYPES.APPROVED : EVENT_TYPES.REJECTED,
    {
      submissionId: submission.id,
      certificateName: submission.certificateName,
      issuingOrg: submission.issuingOrg,
      issuedCertId,
      comment,
      reviewer: updated.reviewedBy,
    }
  );
  return updated;
}

export async function pendingCount() {
  return load().filter((s) => s.status === 'pending').length;
}
