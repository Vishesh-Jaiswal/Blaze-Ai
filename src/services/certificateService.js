import { delay, generateCertificateId, generateHash } from '@/lib/utils';
import { SEED_CERTIFICATES } from '@/data/mockData';

/**
 * Certificate persistence layer (localStorage-backed mock DB).
 */
const KEY = 'mc.certificates';

function load() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (stored?.length) return stored;
  } catch (_) {}
  localStorage.setItem(KEY, JSON.stringify(SEED_CERTIFICATES));
  return SEED_CERTIFICATES;
}

function save(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export async function listCertificates(filter = {}) {
  await delay(400);
  let list = load();
  if (filter.recipientName) {
    list = list.filter((c) => c.recipientName === filter.recipientName);
  }
  if (filter.status) list = list.filter((c) => c.status === filter.status);
  return [...list].sort((a, b) => new Date(b.issuedAt || 0) - new Date(a.issuedAt || 0));
}

export async function getCertificate(id) {
  await delay(300);
  return load().find((c) => c.id === id) || null;
}

export async function createCertificate(data) {
  await delay(700);
  const id = generateCertificateId();
  const cert = {
    id,
    status: 'issued',
    issuedAt: new Date().toISOString(),
    issuedBy: 'Hexaware Mavericks Academy',
    hash: '0x' + generateHash(id, 64),
    verifications: 0,
    ...data,
  };
  const list = load();
  save([cert, ...list]);
  return cert;
}

export async function bulkCreate(rows) {
  await delay(1200);
  const list = load();
  const created = rows.map((row, i) => ({
    id: generateCertificateId(),
    status: 'issued',
    issuedAt: new Date(Date.now() - i * 1000).toISOString(),
    issuedBy: 'Hexaware Mavericks Academy',
    hash: '0x' + generateHash(row.recipientName + i, 64),
    verifications: 0,
    ...row,
  }));
  save([...created, ...list]);
  return created;
}

export async function updateStatus(id, status) {
  await delay(400);
  const list = load().map((c) => (c.id === id ? { ...c, status } : c));
  save(list);
  return list.find((c) => c.id === id);
}
