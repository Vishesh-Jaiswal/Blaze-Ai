/**
 * Browser-side AI client. Despite the file/function name, this routes to
 * whichever LLM provider is configured in .env.local:
 *
 *   1. Anthropic Claude  → VITE_ANTHROPIC_API_KEY  (paid, ~$0.001/call on Haiku)
 *   2. Google Gemini      → VITE_GEMINI_API_KEY    (FREE tier — 1500 req/day)
 *
 * If no key is set, callers fall back to deterministic mocks. Existing
 * service code calls `callClaude(...)` unchanged — the dispatch happens
 * here transparently.
 *
 * Browser-direct API access is fine for a local demo but exposes the key
 * in the bundle. For any hosted deploy, move these calls behind a proxy.
 */

const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || '';
const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

const ANTHROPIC_MODEL = import.meta.env.VITE_ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

/**
 * Provider selection: prefer whichever key is set. If both are set,
 * Anthropic wins (a paid plan is presumably intentional). Otherwise
 * fall back to Gemini, then to "none" (mocks).
 */
function activeProvider() {
  if (ANTHROPIC_KEY && ANTHROPIC_KEY.startsWith('sk-')) return 'anthropic';
  if (GEMINI_KEY) return 'gemini';
  return 'none';
}

/** Truthy when ANY LLM provider key is configured in .env.local. */
export function hasApiKey() {
  return activeProvider() !== 'none';
}

/** Human-friendly label for the AI Online dropdown. */
export function modelName() {
  const p = activeProvider();
  if (p === 'anthropic') return ANTHROPIC_MODEL;
  if (p === 'gemini') return GEMINI_MODEL;
  return 'mock';
}

/** Which provider the app is currently using ('anthropic' | 'gemini' | 'none'). */
export function providerName() {
  return activeProvider();
}

// Last error message from a failed call — surfaced to the UI.
let lastError = null;
export function lastClaudeError() {
  return lastError;
}

// Live health subscription — see Topbar usage.
let healthState = 'idle';
const healthSubscribers = new Set();
export function getApiHealth() {
  return healthState;
}
export function subscribeApiHealth(fn) {
  healthSubscribers.add(fn);
  return () => healthSubscribers.delete(fn);
}
function setHealth(next) {
  if (healthState === next) return;
  healthState = next;
  healthSubscribers.forEach((fn) => fn(next));
}

/* -------------------------------------------------------------------------- */
/*  Public dispatcher — name kept as `callClaude` for backwards compat        */
/* -------------------------------------------------------------------------- */

export async function callClaude(opts) {
  lastError = null;
  const provider = activeProvider();
  if (provider === 'anthropic') return callAnthropic(opts);
  if (provider === 'gemini') return callGemini(opts);
  lastError = 'No AI provider key configured (VITE_ANTHROPIC_API_KEY or VITE_GEMINI_API_KEY).';
  return null;
}

/* -------------------------------------------------------------------------- */
/*  Anthropic implementation                                                  */
/* -------------------------------------------------------------------------- */

async function callAnthropic({
  system,
  user,
  maxTokens = 500,
  temperature = 0.7,
  tool = null,
}) {
  const body = {
    model: ANTHROPIC_MODEL,
    max_tokens: maxTokens,
    temperature,
    messages: [{ role: 'user', content: user }],
  };
  if (system) body.system = system;
  if (tool) {
    body.tools = [tool];
    body.tool_choice = { type: 'tool', name: tool.name };
  }

  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': ANTHROPIC_VERSION,
        'content-type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const raw = await res.text().catch(() => '');
      let detail = raw.slice(0, 240);
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.error?.message) detail = parsed.error.message;
      } catch {}
      lastError = `HTTP ${res.status} · ${detail}`;
      console.warn('[anthropic]', lastError);
      setHealth('failed');
      return null;
    }

    const data = await res.json();

    if (data?.stop_reason === 'refusal') {
      lastError = 'Model declined to generate (safety filter).';
      setHealth('failed');
      return null;
    }

    if (tool) {
      const block = data.content?.find((c) => c.type === 'tool_use');
      if (!block?.input) {
        lastError = `No tool_use block in response (stop_reason: ${data?.stop_reason || 'unknown'}).`;
        setHealth('failed');
        return null;
      }
      setHealth('ok');
      return block.input;
    }
    const textBlock = data.content?.find((c) => c.type === 'text');
    const text = textBlock?.text?.trim();
    if (!text) {
      lastError = `Empty text response (stop_reason: ${data?.stop_reason || 'unknown'}).`;
      setHealth('failed');
      return null;
    }
    setHealth('ok');
    return text;
  } catch (err) {
    lastError = `Network error: ${err?.message || err}`;
    setHealth('failed');
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*  Gemini implementation (free tier)                                         */
/* -------------------------------------------------------------------------- */

async function callGemini({
  system,
  user,
  maxTokens = 500,
  temperature = 0.7,
  tool = null,
}) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_KEY)}`;

  const body = {
    contents: [{ role: 'user', parts: [{ text: user }] }],
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  };
  if (system) {
    body.systemInstruction = { parts: [{ text: system }] };
  }
  if (tool) {
    // Strip JSON-Schema fields Gemini doesn't accept on input_schema.
    const params = sanitizeForGemini(tool.input_schema);
    body.tools = [{
      functionDeclarations: [{
        name: tool.name,
        description: tool.description || '',
        parameters: params,
      }],
    }];
    body.toolConfig = {
      functionCallingConfig: {
        mode: 'ANY',
        allowedFunctionNames: [tool.name],
      },
    };
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const raw = await res.text().catch(() => '');
      let detail = raw.slice(0, 240);
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.error?.message) detail = parsed.error.message;
      } catch {}
      lastError = `HTTP ${res.status} · ${detail}`;
      console.warn('[gemini]', lastError);
      setHealth('failed');
      return null;
    }

    const data = await res.json();
    const candidate = data?.candidates?.[0];

    if (!candidate || candidate.finishReason === 'SAFETY' || candidate.finishReason === 'BLOCKLIST') {
      lastError = `Gemini declined to generate (${candidate?.finishReason || 'no candidate'}).`;
      setHealth('failed');
      return null;
    }

    const parts = candidate.content?.parts || [];

    if (tool) {
      const fnCall = parts.find((p) => p.functionCall)?.functionCall;
      if (!fnCall?.args) {
        lastError = `No function call in response (finishReason: ${candidate.finishReason || 'unknown'}).`;
        setHealth('failed');
        return null;
      }
      setHealth('ok');
      return fnCall.args;
    }

    const text = parts.map((p) => p.text || '').join('').trim();
    if (!text) {
      lastError = `Empty text response (finishReason: ${candidate.finishReason || 'unknown'}).`;
      setHealth('failed');
      return null;
    }
    setHealth('ok');
    return text;
  } catch (err) {
    lastError = `Network error: ${err?.message || err}`;
    setHealth('failed');
    return null;
  }
}

/**
 * Gemini accepts a subset of JSON Schema for function parameters and will
 * reject keys it doesn't recognise (e.g. minimum/maximum on numbers,
 * `enum` arrays of strings ARE supported). Strip unsupported keys.
 */
function sanitizeForGemini(schema) {
  if (!schema || typeof schema !== 'object') return schema;
  if (Array.isArray(schema)) return schema.map(sanitizeForGemini);
  const allowed = new Set([
    'type', 'description', 'properties', 'required', 'items',
    'enum', 'format', 'nullable',
  ]);
  const out = {};
  for (const [k, v] of Object.entries(schema)) {
    if (!allowed.has(k)) continue;
    out[k] = sanitizeForGemini(v);
  }
  return out;
}
