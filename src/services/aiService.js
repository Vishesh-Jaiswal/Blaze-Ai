import { delay, seededRandom } from '@/lib/utils';
import { TEMPLATES, SKILL_BANK } from '@/data/mockData';
import { callClaude, hasApiKey } from './anthropicClient';

/**
 * AI engine. When a provider key (Anthropic or Gemini) is set, every
 * primitive routes to the real LLM via anthropicClient:
 *   1. generateAchievementSummary  — certificate narrative
 *   2. recommendTemplate           — picks the best template + reason
 *   3. suggestSkills               — picks skills from the bank
 *   4. polishComment               — rewrites a rough admin note professionally
 *   5. suggestRejectionReason      — drafts a rejection note from scratch
 *   6. generateInsights            — 4 dashboard insights from real metrics
 *
 * When no key is set or a call fails, the deterministic mock fallback runs
 * so the app always behaves.
 */

/* -------------------------------------------------------------------------- */
/*  Mock fallbacks — unchanged from the pre-AI version                        */
/* -------------------------------------------------------------------------- */

const OPENERS = [
  'In recognition of outstanding dedication and technical mastery,',
  'With distinction and a relentless drive to excel,',
  'Demonstrating exceptional skill and professional rigour,',
  'Through sustained excellence and a growth mindset,',
  'In acknowledgment of remarkable craftsmanship and accountability,',
  'Combining intellectual rigour with practical execution,',
  'With consistent excellence across every evaluation,',
  'For delivering production-grade quality under real-world constraints,',
];

const MIDS = [
  'completed the {course} program, mastering the full breadth of its curriculum',
  'successfully navigated the {course} track, exceeding every benchmark',
  'achieved comprehensive command of {course}, applying concepts to real engagements',
  'delivered standout results across the {course} pathway',
  'demonstrated end-to-end fluency in the {course} stack',
  'progressed through the {course} programme with consistently top-decile performance',
  'showcased deep, applied understanding of {course} principles in live scenarios',
  'completed every milestone of the {course} journey with rigour and creativity',
];

const CLOSERS = [
  'and now stands ready to deliver enterprise-grade impact at Hexaware.',
  'setting a benchmark for the {dept} cohort.',
  'earning a place among the top performers of the 2026 Mavericks batch.',
  'and is formally recognised for client-ready capability.',
  'positioning them as a go-to contributor for {dept} engagements.',
  'and is endorsed for high-impact assignments across the practice.',
  'reflecting the standards expected of senior Hexaware engineers.',
  'a credential earned through measurable, reproducible results.',
];

const HIGHLIGHT_TEMPLATES = [
  ' Notable strengths surface in {skill1} and {skill2}, both proven across hands-on assignments.',
  ' This achievement is anchored by demonstrated expertise in {skill1}, {skill2} and {skill3}.',
  ' Practical proficiency in {skill1} and {skill2} forms the backbone of this recognition.',
];

function mockNarrative(input, nonce) {
  const { recipientName, course, score, duration, skills = [], department, managerFeedback } = input;
  const seedBase = `${recipientName}-${course}-${score}-${nonce}`;
  const o = OPENERS[Math.floor(seededRandom(seedBase + 'o') * OPENERS.length)];
  const m = MIDS[Math.floor(seededRandom(seedBase + 'm') * MIDS.length)].replace('{course}', course);
  const c = CLOSERS[Math.floor(seededRandom(seedBase + 'c') * CLOSERS.length)].replace(
    '{dept}',
    department || 'engineering'
  );

  const scorePhrase = score
    ? ` Final assessment score: ${score}% — a top ${Math.max(1, 100 - score)}% result.`
    : '';
  const durationPhrase = duration ? ` Completed across an intensive ${duration} curriculum.` : '';

  let highlightPhrase = '';
  if (skills.length) {
    const tmpl = HIGHLIGHT_TEMPLATES[Math.floor(seededRandom(seedBase + 'h') * HIGHLIGHT_TEMPLATES.length)];
    highlightPhrase = tmpl
      .replace('{skill1}', skills[0] || 'core engineering')
      .replace('{skill2}', skills[1] || skills[0] || 'system design')
      .replace('{skill3}', skills[2] || skills[1] || skills[0] || 'problem solving');
  }

  const feedbackPhrase = managerFeedback
    ? ` Manager endorsement: “${managerFeedback.trim()}”`
    : '';

  const orderPick = Math.floor(seededRandom(seedBase + 'ord') * 3);
  const tail = orderPick === 0
    ? `${scorePhrase}${durationPhrase}${highlightPhrase}${feedbackPhrase}`
    : orderPick === 1
      ? `${highlightPhrase}${scorePhrase}${durationPhrase}${feedbackPhrase}`
      : `${durationPhrase}${scorePhrase}${highlightPhrase}${feedbackPhrase}`;

  return `${o} ${recipientName} ${m}, ${c}${tail}`;
}

/* -------------------------------------------------------------------------- */
/*  1. Achievement narrative                                                  */
/* -------------------------------------------------------------------------- */

export async function generateAchievementSummary(input, opts = {}) {
  const { nonce = 0 } = opts;

  if (hasApiKey()) {
    const { recipientName, course, score, duration, skills = [], department, managerFeedback } = input;

    const user = `Write a polished, recruiter-ready achievement narrative for a corporate certificate.

Recipient: ${recipientName}
Course / programme: ${course}
Department: ${department || 'engineering'}
Final score: ${score}%
Duration: ${duration || 'standard track'}
Skills demonstrated: ${skills.join(', ') || 'core engineering'}
${managerFeedback ? `Manager endorsement: "${managerFeedback}"` : ''}

Constraints:
- 2 to 3 sentences. Under 80 words total.
- Mention the score and 2–3 specific skills naturally — don't list them.
- Confident, professional, third person. No salutation, no signature.
- Prose only. No bullet points, no markdown.
${nonce > 0 ? '- Produce a clearly different sentence shape and opening from any earlier variant for this recipient.' : ''}`;

    const text = await callClaude({
      system: 'You write polished certificate achievement narratives for a corporate learning platform.',
      user,
      maxTokens: 350,
      temperature: nonce > 0 ? 0.95 : 0.7,
    });
    if (text) return text;
  }

  // Fallback: deterministic mock
  await delay(900 + Math.random() * 600);
  return mockNarrative(input, nonce);
}

/* -------------------------------------------------------------------------- */
/*  2. Template recommendation                                                */
/* -------------------------------------------------------------------------- */

export async function recommendTemplate(input) {
  const { department = '', skills = [], course = '' } = input;

  if (hasApiKey()) {
    const templateOptions = TEMPLATES.map((t) => {
      const recFor = Array.isArray(t.recommendedFor) ? t.recommendedFor.join(', ') : '';
      return `- ${t.id}: ${t.vibe || t.name}${recFor ? ` (recommended for: ${recFor})` : ''}`;
    }).join('\n');

    const user = `Pick the best certificate template for this profile.

Department: ${department || 'engineering'}
Course: ${course || 'general'}
Skills: ${skills.join(', ') || 'none specified'}

Available templates:
${templateOptions}

Choose the single best fit. Justify in one short sentence.`;

    const result = await callClaude({
      system: 'You are a design AI that picks certificate templates based on department and skill context.',
      user,
      maxTokens: 250,
      temperature: 0.3,
      tool: {
        name: 'submit_recommendation',
        description: 'Submit the chosen template with reasoning and confidence.',
        input_schema: {
          type: 'object',
          properties: {
            templateId: {
              type: 'string',
              enum: TEMPLATES.map((t) => t.id),
              description: 'The id of the chosen template',
            },
            reason: { type: 'string', description: 'One short sentence explaining why' },
            confidence: { type: 'number', minimum: 70, maximum: 99, description: 'Confidence 70–99' },
          },
          required: ['templateId', 'reason', 'confidence'],
        },
      },
    });

    if (result?.templateId) {
      return {
        templateId: result.templateId,
        reason: result.reason || `Matched “${result.templateId}” to the ${department || 'engineering'} profile.`,
        confidence: Math.round(result.confidence || 88),
      };
    }
  }

  // Fallback: deterministic mock
  await delay(500);
  let best = TEMPLATES[0];
  for (const t of TEMPLATES) {
    if ((t.recommendedFor || []).some((r) => r.toLowerCase().includes(department.toLowerCase().split(' ')[0]))) {
      best = t;
      break;
    }
  }
  if (skills.some((s) => /secur/i.test(s))) best = TEMPLATES.find((t) => t.id === 'sentinel') || best;
  if (skills.some((s) => /(ml|ai|data|machine)/i.test(s))) best = TEMPLATES.find((t) => t.id === 'quantum') || best;

  return {
    templateId: best.id,
    reason: `Matched “${best.name}” to ${department || 'this profile'} based on department alignment and skill signals.`,
    confidence: 88 + Math.floor(seededRandom(department + best.id) * 10),
  };
}

/* -------------------------------------------------------------------------- */
/*  3. Skill suggestion                                                       */
/* -------------------------------------------------------------------------- */

export async function suggestSkills(course = '') {
  if (hasApiKey()) {
    const user = `Pick up to 5 skills from this bank that best match the course "${course || 'general engineering'}".

Skill bank: ${SKILL_BANK.join(', ')}

Choose only from the bank. Order from most to least relevant.`;

    const result = await callClaude({
      system: 'You are a skill-mapping AI for a corporate learning platform.',
      user,
      maxTokens: 200,
      temperature: 0.2,
      tool: {
        name: 'submit_skills',
        description: 'Submit the matched skills.',
        input_schema: {
          type: 'object',
          properties: {
            skills: {
              type: 'array',
              items: { type: 'string', enum: SKILL_BANK },
              minItems: 1,
              maxItems: 5,
              description: 'Skills from the bank, ordered most to least relevant',
            },
          },
          required: ['skills'],
        },
      },
    });
    if (Array.isArray(result?.skills) && result.skills.length) return result.skills;
  }

  // Fallback
  await delay(400);
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

/* -------------------------------------------------------------------------- */
/*  4. Rejection-reason drafting & comment polish                              */
/* -------------------------------------------------------------------------- */

/**
 * Rewrites whatever the admin has typed into the comment field as proper,
 * professional English while preserving the original meaning and any
 * specifics. Use this when the admin already has a rough note and just
 * wants the AI to tidy it up.
 *
 * Returns null on missing key or failure — caller leaves the textarea as-is.
 */
export async function polishComment(rawText, submission = null) {
  if (!hasApiKey()) return null;
  const text = (rawText || '').trim();
  if (!text) return null;

  const context = submission
    ? `\nFor context, the comment is about this submission:
- Maverick: ${submission.submittedByName} (${submission.department || 'unknown department'})
- Certificate: "${submission.certificateName}" issued by "${submission.issuingOrg}"
- Score: ${submission.score ?? 'not provided'}`
    : '';

  const user = `Rewrite the admin's note into clear, professional English that's appropriate to send to a Maverick whose certificate submission is being reviewed. Preserve the original intent, specifics and tone (rejecting / approving / asking for changes) — do not soften a rejection into an approval or vice versa.${context}

Admin's draft note:
"""
${text}
"""

Rules:
- 1-3 sentences.
- Polite but direct. Professional, not flowery.
- Keep any concrete specifics (numbers, names, dates) the admin mentioned.
- Output ONLY the rewritten note. No greeting, no signature, no quotes around it.`;

  return await callClaude({
    system: 'You polish short admin notes into clear, professional English for a corporate learning platform.',
    user,
    maxTokens: 250,
    temperature: 0.4,
  });
}

/**
 * Drafts a polite, specific rejection note for a Maverick's submission.
 * Returns null if no API key — caller leaves the textarea blank.
 */
export async function suggestRejectionReason(submission) {
  if (!hasApiKey() || !submission) return null;

  const docs = (submission.documents || [])
    .map((d) => `- ${d.name} (${Math.round((d.size || 0) / 1024)} KB, ${d.type || 'unknown'})`)
    .join('\n') || '  none attached';

  const user = `An L&D admin needs to reject this external-certificate submission. Draft a polite, specific, professional rejection note in 2-3 sentences.

Submission:
- Maverick: ${submission.submittedByName} (${submission.department || 'unknown department'})
- Certificate name: "${submission.certificateName}"
- Issuing organization: "${submission.issuingOrg}"
- Score (as submitted): ${submission.score ?? 'not provided'}
- Completion date: ${submission.completionDate || 'not provided'}
- Maverick's remarks: ${submission.remarks || 'none'}
- Proof documents:
${docs}

Identify what looks weak, unverifiable, or inconsistent — for example: vague/garbled certificate or issuer names, scores outside normal ranges, missing or unrelated proof documents, suspiciously low effort. Be concrete about what the Maverick must fix to resubmit successfully.

Output ONLY the rejection note text. No greeting, no signature, no bullet points.`;

  return await callClaude({
    system: 'You write professional rejection notes for submitted certifications. Be specific, polite, and actionable.',
    user,
    maxTokens: 250,
    temperature: 0.4,
  });
}

/* -------------------------------------------------------------------------- */
/*  5. Analytics insights                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Generates 4 executive-level insight sentences from real platform metrics.
 * Returns null if no API key — the caller keeps its template-string fallback.
 */
export async function generateInsights(metrics) {
  if (!hasApiKey()) return null;

  const topDept = metrics.topDepartment
    ? `${metrics.topDepartment.name} (${metrics.topDepartment.count} certificates)`
    : 'none';

  const user = `Generate exactly 4 concise executive insights about a corporate certification platform.

Real metrics (current snapshot):
- Total certificates issued: ${metrics.totalCerts ?? 0}
- Issued this month: ${metrics.issuedThisMonth ?? 0}
- Top department: ${topDept}
- Pending submissions: ${metrics.pendingSubmissions ?? 0}
- Approved submissions (lifetime): ${metrics.approvedTotal ?? 0}
- Total learning hours awarded: ${metrics.learningHours ?? 0}
- Threats blocked: ${metrics.threatsBlocked ?? 0}
- Platform events in the last 7 days: ${metrics.weeklyEvents ?? 0}
- Registered Mavericks: ${metrics.mavericks ?? 0}

Each insight: ONE sentence, referencing at least one specific number above, action-oriented, no preamble. Vary the topics — don't repeat the same metric. Skip the obvious (e.g. don't say "0 events recorded" when there are zero — phrase differently).`;

  const result = await callClaude({
    system: 'You are an analytics AI generating concise executive insights for an L&D dashboard.',
    user,
    maxTokens: 500,
    temperature: 0.7,
    tool: {
      name: 'submit_insights',
      description: 'Submit four short insight sentences.',
      input_schema: {
        type: 'object',
        properties: {
          insights: {
            type: 'array',
            items: { type: 'string' },
            minItems: 4,
            maxItems: 4,
            description: 'Four single-sentence insights',
          },
        },
        required: ['insights'],
      },
    },
  });

  return Array.isArray(result?.insights) && result.insights.length === 4
    ? result.insights
    : null;
}
