import { getSettings } from '../store.js';

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models/';

// Newest first; on quota/availability errors we fall down the chain.
const MODEL_CHAIN = ['gemini-pro-latest', 'gemini-flash-latest', 'gemini-flash-lite-latest'];

export class GeminiQuotaError extends Error {}

export async function geminiGenerate({ prompt, system, useSearch = false, models = MODEL_CHAIN }) {
  const { geminiApiKey } = getSettings();
  if (!geminiApiKey) throw new Error('Gemini API key is not set — add it on the Settings screen');

  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  };
  if (system) body.systemInstruction = { parts: [{ text: system }] };
  if (useSearch) body.tools = [{ google_search: {} }];

  const errors = [];
  for (const model of models) {
    const res = await fetch(`${BASE}${model}:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(600_000),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      const text = (data.candidates?.[0]?.content?.parts ?? [])
        .map((p) => p.text ?? '')
        .join('');
      if (!text.trim()) {
        errors.push(`${model}: empty response (${data.candidates?.[0]?.finishReason || 'no candidates'})`);
        continue;
      }
      return {
        text,
        model,
        grounded: !!data.candidates?.[0]?.groundingMetadata,
        usage: data.usageMetadata ?? null,
      };
    }
    errors.push(`${model}: ${res.status} ${(data.error?.message || '').slice(0, 120)}`);
    // 429/404/503 → try the next model; anything else is a real error
    if (![429, 404, 503].includes(res.status)) break;
  }

  const message = `All Gemini models failed:\n${errors.join('\n')}`;
  if (errors.every((e) => e.includes('429'))) {
    throw new GeminiQuotaError(
      `${message}\n\nThe free tier on this key has no quota for these models — enable billing on the Google account (aistudio.google.com → Settings → Billing).`
    );
  }
  throw new Error(message);
}
