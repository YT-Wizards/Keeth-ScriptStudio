import fs from 'node:fs';
import path from 'node:path';
import { PROMPTS_DIR } from '../store.js';
import { geminiGenerate } from '../services/gemini.js';

function loadPrompt(file) {
  return fs.readFileSync(path.join(PROMPTS_DIR, file), 'utf-8');
}

function buildCompetitorSection(project) {
  const parts = [];
  for (const v of project.sources.youtube ?? []) {
    if (!v.transcript) continue;
    const marker = v.usInspirationOnly
      ? ' [US-BASED VIDEO — INSPIRATION ONLY. Do NOT treat any product, formula, price or claim in it as applying to the UK version.]'
      : '';
    parts.push(`--- Transcript: "${v.title}" by ${v.channel}${marker} ---\n${v.transcript}`);
  }
  for (const r of project.sources.reddit ?? []) {
    parts.push(`--- Reddit thread: "${r.title}" ---\n${r.text ?? r.selftext ?? ''}`);
  }
  for (const m of project.sources.manual ?? []) {
    parts.push(`--- Pasted material ---\n${m.text}`);
  }
  return parts.join('\n\n') || '(none supplied)';
}

function buildNewsSection(project) {
  const items = (project.sources.news ?? []).filter((n) => n.selected !== false);
  if (!items.length) return '';
  const list = items.map((n) => `- ${n.title} (${n.source}, ${n.published}) ${n.link}`).join('\n');
  return `\n\nADDITIONAL USER-SUPPLIED FRESH NEWS LEADS (verify and use where genuinely helpful):\n${list}`;
}

export async function runResearch(project) {
  const template = loadPrompt('1-research.txt');

  const commentsSection = project.commentAnalysis?.summary
    ? `NOTE: The raw comments (${project.commentAnalysis.totalComments} of them) were already exhaustively analysed in batches — every single comment was read. Below is the consolidated analysis. Treat it as the complete audience-comment evidence base.\n\n${project.commentAnalysis.summary}`
    : '(no comments available)';

  // The prompt is user-editable (Iren tweaks it), so placeholder wording can
  // drift — match loosely and fall back to appending a clearly-labelled
  // section rather than silently dropping an input.
  const inputs = [
    { re: /\[PASTE THE VIDEO TITLE HERE\]/i, value: project.title, label: 'VIDEO TITLE' },
    {
      re: /\[PASTE ONE OR MORE COMPETITOR VIDEO SCRIPTS[^\]]*\]/i,
      value: buildCompetitorSection(project),
      label: 'COMPETITOR SCRIPTS / TRANSCRIPTS',
    },
    {
      re: /\[PASTE ALL AVAILABLE AUDIENCE COMMENTS[^\]]*\]/i,
      value: commentsSection,
      label: 'AUDIENCE COMMENTS',
    },
  ];
  let prompt = template;
  const appended = [];
  for (const input of inputs) {
    if (input.re.test(prompt)) prompt = prompt.replace(input.re, () => input.value);
    else appended.push(`\n\n=== ${input.label} (input section not found in prompt template — supplied here) ===\n${input.value}`);
  }
  prompt += appended.join('') + buildNewsSection(project);

  // Phase 1 — synthesis. On very long prompts Gemini reliably SKIPS the search
  // tool (verified empirically), so grounding happens in phase 2 instead.
  const synthesis = await geminiGenerate({ prompt, useSearch: true });

  // Phase 2 — live web verification. Search only triggers dependably on short
  // prompts, so verify one product per compact call, in parallel.
  const addendum = await liveVerification(project.title, synthesis.text);

  return {
    text: `${synthesis.text}\n\n=== LIVE WEB VERIFICATION ADDENDUM (search-grounded second pass; where this conflicts with the package above, THIS is current) ===\n${addendum.text}`,
    model: synthesis.model,
    grounded: addendum.grounded,
    searchQueries: addendum.searchQueries,
    usage: synthesis.usage,
    at: new Date().toISOString(),
  };
}

// prefer flash for the many small verification calls — faster, grounds reliably
const VERIFY_MODELS = ['gemini-flash-latest', 'gemini-pro-latest', 'gemini-flash-lite-latest'];
const VERIFY_CONCURRENCY = 10;
const VERIFY_MAX_PRODUCTS = 20;

async function liveVerification(title, packageText) {
  // pull the final product names out of the package (cheap, no search needed)
  let names = [];
  try {
    const extraction = await geminiGenerate({
      models: VERIFY_MODELS,
      prompt: `From the research package below, output ONLY the exact product names on the Final Proposed Avoid List and the Final Proposed Actually Good List — one per line, brand included, no numbering, no commentary.\n\n${packageText}`,
    });
    names = extraction.text
      .split('\n')
      .map((l) => l.replace(/^[-*\d.\s]+/, '').trim())
      .filter((l) => l && l.length < 90)
      .slice(0, VERIFY_MAX_PRODUCTS);
  } catch {
    names = [];
  }

  const tasks = names.map((name) => async () => {
    const { text, grounded, searchQueries } = await geminiGenerate({
      models: VERIFY_MODELS,
      useSearch: true,
      system:
        'You are a live product verification researcher for UK consumer journalism. You MUST use the Google Search tool — never answer from memory.',
      prompt: `Search the web for the CURRENT UK version of this product: "${name}".\nReport in 5-8 plain lines: current ingredient list highlights (first ingredients, notable additives/oils/sweeteners), current pack size, current availability in UK supermarkets, any reformulation/shrinkflation/recall/news from the last year (with dates), and name your sources. If something cannot be verified, say so explicitly.`,
    });
    return { name, text, grounded, searchQueries };
  });
  // fresh category news sweep as one extra compact call
  tasks.push(async () => {
    const { text, grounded, searchQueries } = await geminiGenerate({
      models: VERIFY_MODELS,
      useSearch: true,
      system: 'You MUST use the Google Search tool — never answer from memory.',
      prompt: `Search for UK news from the last 60 days relevant to this video topic: "${title}" (reformulations, recalls, price rises, shrinkflation, public backlash, regulator rulings). List each genuinely useful finding with its date and source. If nothing significant, say so.`,
    });
    return { name: 'FRESH CATEGORY NEWS', text, grounded, searchQueries };
  });

  // transient network failures are common on parallel calls — retry each task
  const withRetry = (task) => async () => {
    let lastError;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await task();
      } catch (e) {
        lastError = e;
        await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)));
      }
    }
    throw lastError;
  };

  const results = [];
  for (let i = 0; i < tasks.length; i += VERIFY_CONCURRENCY) {
    const batch = await Promise.allSettled(
      tasks.slice(i, i + VERIFY_CONCURRENCY).map((t) => withRetry(t)())
    );
    for (const r of batch) {
      if (r.status === 'fulfilled') results.push(r.value);
      else results.push({ name: '(verification call failed)', text: r.reason.message, grounded: false, searchQueries: 0 });
    }
  }

  if (!results.length) {
    return { text: '(live verification unavailable — no products extracted)', grounded: false, searchQueries: 0 };
  }
  return {
    text: results.map((r) => `--- ${r.name}${r.grounded ? '' : ' [NOT search-verified]'} ---\n${r.text}`).join('\n\n'),
    grounded: results.some((r) => r.grounded),
    searchQueries: results.reduce((sum, r) => sum + (r.searchQueries || 0), 0),
  };
}
