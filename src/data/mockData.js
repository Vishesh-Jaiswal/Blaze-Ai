import { ROLES } from '@/config/roles';

/**
 * Seed accounts for the mock auth system. Any password works in demo mode,
 * but these are the "official" demo credentials surfaced on the login screen.
 */
export const DEMO_USERS = [
  {
    id: 'u-maverick',
    name: 'Aarav Sharma',
    email: 'maverick@hexaware.com',
    password: 'demo1234',
    role: ROLES.MAVERICK,
    department: 'Cloud Engineering',
    title: 'Maverick — Batch 2026',
    joinedAt: '2026-01-12',
    avatar: null,
  },
  {
    id: 'u-hr',
    name: 'Priya Nair',
    email: 'hr@hexaware.com',
    password: 'demo1234',
    role: ROLES.HR_ADMIN,
    department: 'Human Resources',
    title: 'HR Operations Lead',
    joinedAt: '2022-06-03',
    avatar: null,
  },
  {
    id: 'u-lnd',
    name: 'Rohan Mehta',
    email: 'lnd@hexaware.com',
    password: 'demo1234',
    role: ROLES.LND_MANAGER,
    department: 'Learning & Development',
    title: 'L&D Program Manager',
    joinedAt: '2021-02-18',
    avatar: null,
  },
  {
    id: 'u-super',
    name: 'Kavya Reddy',
    email: 'admin@hexaware.com',
    password: 'demo1234',
    role: ROLES.SUPER_ADMIN,
    department: 'Platform',
    title: 'Super Administrator',
    joinedAt: '2020-09-01',
    avatar: null,
  },
  {
    id: 'u-verifier',
    name: 'Acme Corp Verifier',
    email: 'verify@acme.com',
    password: 'demo1234',
    role: ROLES.VERIFIER,
    department: 'External — Acme Corp',
    title: 'Talent Acquisition',
    joinedAt: '2025-11-20',
    avatar: null,
  },
];

export const DEPARTMENTS = [
  'Cloud Engineering',
  'Data & AI',
  'Cybersecurity',
  'Full-Stack Development',
  'DevOps & SRE',
  'Quality Engineering',
  'Business Analysis',
  'UX Engineering',
];

export const COURSES = [
  'Cloud Foundations on AWS',
  'Advanced React & System Design',
  'Generative AI Engineering',
  'Cybersecurity Essentials',
  'Kubernetes & DevOps Mastery',
  'Data Engineering with Spark',
  'Microservices Architecture',
  'Agile Delivery Excellence',
];

export const SKILL_BANK = [
  'React', 'TypeScript', 'AWS', 'Docker', 'Kubernetes', 'Python', 'Machine Learning',
  'System Design', 'CI/CD', 'GraphQL', 'Node.js', 'Terraform', 'Security', 'SQL',
  'Microservices', 'Agile', 'Leadership', 'Problem Solving',
];

/** Certificate templates for the Smart Design Engine. */
export const TEMPLATES = [
  {
    id: 'aurora',
    name: 'Aurora',
    vibe: 'Electric blue, cinematic — the flagship Hexaware look',
    accent: '#2f80ff',
    gradient: 'linear-gradient(135deg, #0b3fa3 0%, #06c8ff 100%)',
    recommendedFor: ['Cloud Engineering', 'DevOps & SRE'],
  },
  {
    id: 'quantum',
    name: 'Quantum',
    vibe: 'Deep violet holographic, premium AI feel',
    accent: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #4c1d95 0%, #8b5cf6 100%)',
    recommendedFor: ['Data & AI', 'UX Engineering'],
  },
  {
    id: 'sentinel',
    name: 'Sentinel',
    vibe: 'Emerald secure tone, ideal for security tracks',
    accent: '#10b981',
    gradient: 'linear-gradient(135deg, #065f46 0%, #34d399 100%)',
    recommendedFor: ['Cybersecurity', 'Quality Engineering'],
  },
  {
    id: 'ember',
    name: 'Ember',
    vibe: 'Warm amber accents, celebratory recognition',
    accent: '#f59e0b',
    gradient: 'linear-gradient(135deg, #92400e 0%, #fbbf24 100%)',
    recommendedFor: ['Business Analysis', 'Agile Delivery Excellence'],
  },
];

const NAMES = [
  'Aarav Sharma', 'Diya Patel', 'Vivaan Iyer', 'Ananya Rao', 'Arjun Kapoor',
  'Ishaan Verma', 'Saanvi Gupta', 'Reyansh Nair', 'Myra Joshi', 'Aditya Menon',
  'Kiara Bose', 'Vihaan Desai', 'Anika Pillai', 'Kabir Khanna', 'Navya Reddy',
];

function pick(arr, seed) {
  return arr[seed % arr.length];
}

/** Build a deterministic set of seed certificates. */
function buildCertificates() {
  const statuses = ['issued', 'issued', 'issued', 'pending', 'issued', 'revoked'];
  const certs = [];
  for (let i = 0; i < 24; i++) {
    const name = pick(NAMES, i * 3 + 1);
    const course = pick(COURSES, i * 2 + 1);
    const dept = pick(DEPARTMENTS, i + 1);
    const score = 78 + ((i * 7) % 22);
    const issuedDaysAgo = i * 4 + 2;
    const issuedAt = new Date(Date.now() - issuedDaysAgo * 86400000).toISOString();
    const status = pick(statuses, i);
    const template = TEMPLATES[i % TEMPLATES.length];
    certs.push({
      id: `HEX-MAV-2026-${(1000 + i * 37).toString(16).toUpperCase()}`,
      recipientName: name,
      recipientId: `u-${1000 + i}`,
      course,
      department: dept,
      score,
      duration: `${6 + (i % 8)} weeks`,
      learningHours: 20 + ((i * 7) % 40), // 20–60 hours range
      skills: SKILL_BANK.slice((i * 2) % 10, ((i * 2) % 10) + 4),
      status,
      issuedAt,
      issuedBy: 'Hexaware Mavericks Academy',
      templateId: template.id,
      hash: `0x${(i * 928374).toString(16)}${'a3f9c2e1b7d4'.repeat(4)}`.slice(0, 66),
      verifications: (i * 13) % 40,
      summary: `${name} successfully completed ${course}, demonstrating exceptional proficiency and a top ${100 - score}% performance across all assessment modules.`,
      manager: pick(['Priya Nair', 'Rohan Mehta', 'Kavya Reddy'], i),
    });
  }
  return certs;
}

export const SEED_CERTIFICATES = buildCertificates();

/** Pending approval requests for the admin queue. */
export const SEED_APPROVALS = SEED_CERTIFICATES.filter((c) => c.status === 'pending').concat(
  Array.from({ length: 4 }).map((_, i) => ({
    id: `REQ-2026-${(500 + i).toString().padStart(4, '0')}`,
    recipientName: pick(NAMES, i + 5),
    course: pick(COURSES, i + 2),
    department: pick(DEPARTMENTS, i + 3),
    score: 80 + i * 3,
    duration: `${8 + i} weeks`,
    skills: SKILL_BANK.slice(i, i + 3),
    status: 'pending',
    requestedAt: new Date(Date.now() - (i + 1) * 3600000).toISOString(),
    templateId: TEMPLATES[i % TEMPLATES.length].id,
    manager: pick(['Priya Nair', 'Rohan Mehta'], i),
  }))
);

/**
 * Maverick-submitted external credential requests awaiting admin review.
 * Internal Hexaware certificates are auto-issued by HR/L&D via the AI Generator,
 * so every submission here is an external (3rd-party) credential with proof docs.
 */
export const SEED_SUBMISSIONS = [
  {
    id: 'SUB-2026-0001',
    type: 'external',
    submittedById: 'u-maverick',
    submittedByName: 'Aarav Sharma',
    submittedByEmail: 'maverick@hexaware.com',
    department: 'Cloud Engineering',
    certificateName: 'AWS Certified Solutions Architect — Associate',
    issuingOrg: 'Amazon Web Services',
    score: 870,
    completionDate: '2026-04-30',
    remarks: 'Scored 870/1000 (pass mark 720). External proof attached.',
    skills: ['AWS', 'System Design', 'Security'],
    documents: [
      { name: 'aws-saa-certificate.pdf', size: 248_512, type: 'application/pdf', dataUrl: null },
    ],
    status: 'pending',
    submittedAt: new Date(Date.now() - 26 * 3600000).toISOString(),
    reviewedAt: null,
    reviewedBy: null,
    adminComment: '',
    issuedCertId: null,
  },
  {
    id: 'SUB-2026-0002',
    type: 'external',
    submittedById: 'u-1002',
    submittedByName: 'Diya Patel',
    submittedByEmail: 'diya.patel@hexaware.com',
    department: 'DevOps & SRE',
    certificateName: 'Certified Kubernetes Administrator',
    issuingOrg: 'The Linux Foundation (CNCF)',
    score: 92,
    completionDate: '2026-05-12',
    remarks: 'Hands-on CKA exam — covered scheduling, networking and storage.',
    skills: ['Kubernetes', 'Docker', 'CI/CD'],
    documents: [
      { name: 'cka-certificate.pdf', size: 312_400, type: 'application/pdf', dataUrl: null },
    ],
    status: 'pending',
    submittedAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    reviewedAt: null,
    reviewedBy: null,
    adminComment: '',
    issuedCertId: null,
  },
  {
    id: 'SUB-2026-0003',
    type: 'external',
    submittedById: 'u-1003',
    submittedByName: 'Ananya Rao',
    submittedByEmail: 'ananya.rao@hexaware.com',
    department: 'Data & AI',
    certificateName: 'TensorFlow Developer Certificate',
    issuingOrg: 'Google / DeepLearning.AI',
    score: 88,
    completionDate: '2026-05-02',
    remarks: 'Professional certification in deep learning.',
    skills: ['Machine Learning', 'Python'],
    documents: [
      { name: 'tf-developer-cert.png', size: 412_900, type: 'image/png', dataUrl: null },
    ],
    status: 'approved',
    submittedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    reviewedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    reviewedBy: 'Rohan Mehta',
    adminComment: 'Verified against Google credential registry. Approved.',
    issuedCertId: 'HEX-MAV-2026-3E8',
  },
  {
    id: 'SUB-2026-0004',
    type: 'external',
    submittedById: 'u-1005',
    submittedByName: 'Arjun Kapoor',
    submittedByEmail: 'arjun.kapoor@hexaware.com',
    department: 'Cybersecurity',
    certificateName: 'CompTIA Security+',
    issuingOrg: 'CompTIA',
    score: 720,
    completionDate: '2026-05-10',
    remarks: 'Pass mark 750 — narrowly missed.',
    skills: ['Security'],
    documents: [
      { name: 'sec-plus-scoresheet.pdf', size: 184_000, type: 'application/pdf', dataUrl: null },
    ],
    status: 'rejected',
    submittedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    reviewedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    reviewedBy: 'Priya Nair',
    adminComment: 'Score is below the issuing-body pass mark (750). Please retake the exam and resubmit the updated score sheet.',
    issuedCertId: null,
  },
  {
    id: 'SUB-2026-0005',
    type: 'external',
    submittedById: 'u-1006',
    submittedByName: 'Ishaan Verma',
    submittedByEmail: 'ishaan.verma@hexaware.com',
    department: 'Full-Stack Development',
    certificateName: 'Meta Front-End Developer Professional Certificate',
    issuingOrg: 'Meta / Coursera',
    score: 95,
    completionDate: '2026-05-20',
    remarks: '9-course specialisation — capstone project hosted on GitHub.',
    skills: ['React', 'TypeScript', 'Node.js'],
    documents: [
      { name: 'meta-frontend-cert.png', size: 388_000, type: 'image/png', dataUrl: null },
    ],
    status: 'pending',
    submittedAt: new Date(Date.now() - 18 * 3600000).toISOString(),
    reviewedAt: null,
    reviewedBy: null,
    adminComment: '',
    issuedCertId: null,
  },
];

/** Analytics datasets. */
export const ANALYTICS = {
  kpis: {
    totalIssued: 4820,
    thisMonth: 412,
    verifications: 12940,
    fraudBlocked: 37,
    avgGenerationTime: 18, // seconds
    activeMavericks: 1280,
  },
  issuanceTrend: [
    { month: 'Nov', issued: 280, verified: 640 },
    { month: 'Dec', issued: 340, verified: 820 },
    { month: 'Jan', issued: 420, verified: 1120 },
    { month: 'Feb', issued: 390, verified: 1340 },
    { month: 'Mar', issued: 510, verified: 1610 },
    { month: 'Apr', issued: 470, verified: 1890 },
    { month: 'May', issued: 412, verified: 2140 },
  ],
  byDepartment: DEPARTMENTS.map((d, i) => ({
    department: d.split(' ')[0],
    fullName: d,
    issued: 180 + ((i * 97) % 420),
  })),
  fraudBreakdown: [
    { name: 'Layout Tampering', value: 38, color: '#f43f5e' },
    { name: 'Font Mismatch', value: 24, color: '#f59e0b' },
    { name: 'Invalid QR', value: 21, color: '#8b5cf6' },
    { name: 'Metadata Anomaly', value: 17, color: '#06c8ff' },
  ],
  engagement: [
    { day: 'Mon', value: 62 },
    { day: 'Tue', value: 78 },
    { day: 'Wed', value: 71 },
    { day: 'Thu', value: 88 },
    { day: 'Fri', value: 95 },
    { day: 'Sat', value: 44 },
    { day: 'Sun', value: 38 },
  ],
  insights: [
    'Generative AI Engineering certifications grew 32% MoM — the fastest-rising track.',
    'Average certificate generation time dropped from 3 days to 18 seconds after automation.',
    'Fraud attempts are concentrated on weekends; 4 flagged uploads this week were auto-blocked.',
    'Cloud Engineering leads verification volume, signalling strong external recruiter interest.',
  ],
};

/** Leaderboard data. */
export const LEADERBOARD = NAMES.map((name, i) => {
  const certs = 12 - Math.floor(i / 2);
  const learningHours = certs * 40 - (i * 7) % 50; // ~40h per cert, slight noise
  return {
    rank: i + 1,
    name,
    department: pick(DEPARTMENTS, i),
    certificates: certs,
    learningHours,
    points: certs * 100 + learningHours * 5 + Math.max(2, 18 - i) * 5,
    streak: Math.max(2, 18 - i),
    trend: i % 3 === 0 ? 'up' : i % 3 === 1 ? 'flat' : 'down',
  };
})
  .sort((a, b) => b.points - a.points)
  .map((row, i) => ({ ...row, rank: i + 1 }));

/** Verification activity feed (recent public verifications). */
export const VERIFICATION_LOG = Array.from({ length: 10 }).map((_, i) => {
  const cert = SEED_CERTIFICATES[i];
  return {
    id: `VLOG-${2000 + i}`,
    certId: cert.id,
    recipient: cert.recipientName,
    verifiedBy: pick(['Acme Corp', 'Globex', 'Initech', 'Umbrella HR', 'Wayne Talent'], i),
    result: i === 3 ? 'fraud' : i === 7 ? 'expired' : 'authentic',
    confidence: i === 3 ? 41 : 96 + (i % 4),
    at: new Date(Date.now() - i * 5400000).toISOString(),
  };
});
