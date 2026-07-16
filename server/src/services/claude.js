import Anthropic from '@anthropic-ai/sdk';
import { getSettings } from '../store.js';

const MODEL = 'claude-opus-4-8';

function client() {
  const { anthropicApiKey } = getSettings();
  if (!anthropicApiKey) throw new Error('Anthropic API key is not set — add it on the Settings screen');
  return new Anthropic({ apiKey: anthropicApiKey });
}

export async function claudeGenerate({ system, prompt, maxTokens = 64000, effort = 'high' }) {
  const stream = client().messages.stream({
    model: MODEL,
    max_tokens: maxTokens,
    thinking: { type: 'adaptive' },
    output_config: { effort },
    ...(system ? { system } : {}),
    messages: [{ role: 'user', content: prompt }],
  });
  const message = await stream.finalMessage();
  const text = message.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');
  return { text, model: MODEL, usage: message.usage, stopReason: message.stop_reason };
}

export async function claudeExtractJson({ system, prompt, schema, maxTokens = 16000 }) {
  const response = await client().messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    thinking: { type: 'adaptive' },
    ...(system ? { system } : {}),
    output_config: { format: { type: 'json_schema', schema } },
    messages: [{ role: 'user', content: prompt }],
  });
  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');
  return { data: JSON.parse(text), usage: response.usage };
}
