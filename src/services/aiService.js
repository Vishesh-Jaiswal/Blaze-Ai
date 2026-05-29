import { delay, seededRandom } from '@/lib/utils';
import { TEMPLATES } from '@/data/mockData';

/**
 * Mock AI engine. In production this would call an LLM (e.g. Claude) behind
 * an authenticated backend endpoint. Here we synthesise realistic, varied
 * narratives deterministically so the UX feels intelligent and consistent.
 */

const OPENERS = [
  'In recognition of outstanding dedication and technical mastery,',
  'With distinction and a relentless drive to excel,',
  'Demonstrating exceptional skill and professional rigour,',
  'Through sustained excellence and a growth mindset,',
];

const MIDS = [
  'completed the {course} program, mastering the full breadth of its curriculum',
  'successfully navigated the {course} track, exceeding every benchmark',
  'achieved comprehensive command of {course}, applying concepts to real engagements',
  'delivered standout results across the {course} pathway',
];

const CLOSERS = [
  'and now stands ready to deliver enterprise-grade impact at Hexaware.',
  'setting a benchmark for the {dept} cohort.',
  'earning a place among the top performers of the 2026 Mavericks batch.',
  'and is formally recognised for client-ready capability.',
];

/**
 * Generate a personalised achievement narrative from structured inputs.
 * @returns {Promise<string>}
 */
export async function generateAchievementSummary(input) {
  await delay(1100 + Math.random() * 900);
  const { recipientName, course, score, duration, skills = [], department, managerFeedback } = input;
  const seedBase = `${recipientName}-${course}-${score}`;
  const o = OPENERS[Math.floor(seededRandom(seedBase + 'o') * OPENERS.length)];
  const m = MIDS[Math.floor(seededRandom(seedBase + 'm') * MIDS.length)].replace('{course}', course);
  const c = CLOSERS[Math.floor(seededRandom(seedBase + 'c') * CLOSERS.length)].replace(
    '{dept}',
    department || 'engineering'
  );

  const skillPhrase = skills.length
    ? ` Core competencies validated include ${skills.slice(0, 4).join(', ')}.`
    : '';
  const scorePhrase = score
    ? ` Final assessment score: ${score}% — a top ${Math.max(1, 100 - score)}% result.`
    : '';
  const durationPhrase = duration ? ` Completed across an intensive ${duration} curriculum.` : '';
  const feedbackPhrase = managerFeedback
    ? ` Manager endorsement: “${managerFeedback.trim()}”`
    : '';

  return `${o} ${recipientName} ${m}, ${c}${scorePhrase}${durationPhrase}${skillPhrase}${feedbackPhrase}`;
}

/**
 * Recommend the best template for a department and skill profile.
 * @returns {Promise<{templateId: string, reason: string, confidence: number}>}
 */
export async function recommendTemplate(input) {
  await delay(600);
  const { department = '', skills = [] } = input;
  let best = TEMPLATES[0];
  for (const t of TEMPLATES) {
    if (t.recommendedFor.some((r) => r.toLowerCase().includes(department.toLowerCase().split(' ')[0]))) {
      best = t;
      break;
    }
  }
  // Security skills bias toward Sentinel
  if (skills.some((s) => /secur/i.test(s))) best = TEMPLATES.find((t) => t.id === 'sentinel') || best;
  if (skills.some((s) => /(ml|ai|data|machine)/i.test(s)))
    best = TEMPLATES.find((t) => t.id === 'quantum') || best;

  return {
    templateId: best.id,
    reason: `Matched “${best.name}” to ${department || 'this profile'} based on department alignment and skill signals.`,
    confidence: 88 + Math.floor(seededRandom(department + best.id) * 10),
  };
}

/** Suggest skill tags from a course name (mock NLP). */
export async function suggestSkills(course = '') {
  await delay(450);
  const map = {
    cloud: ['AWS', 'Docker', 'Terraform', 'CI/CD'],
    react: ['React', 'TypeScript', 'System Design', 'GraphQL'],
    ai: ['Python', 'Machine Learning', 'Data', 'System Design'],
    security: ['Security', 'Networking', 'Python', 'Problem Solving'],
    kubernetes: ['Kubernetes', 'Docker', 'CI/CD', 'DevOps'],
    data: ['SQL', 'Python', 'Spark', 'Data'],
    micro: ['Microservices', 'Node.js', 'System Design', 'Docker'],
    agile: ['Agile', 'Leadership', 'Problem Solving'],
  };
  const key = Object.keys(map).find((k) => course.toLowerCase().includes(k));
  return key ? map[key] : ['Problem Solving', 'Leadership', 'System Design'];
}
