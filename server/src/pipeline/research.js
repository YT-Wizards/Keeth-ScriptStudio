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

  const prompt = template
    .replace('[PASTE THE VIDEO TITLE HERE]', project.title)
    .replace(
      '[PASTE ONE OR MORE COMPETITOR VIDEO SCRIPTS OR TRANSCRIPTS HERE.]',
      buildCompetitorSection(project)
    )
    .replace('[PASTE ALL AVAILABLE AUDIENCE COMMENTS OR CSV COMMENT DATA HERE.]', commentsSection)
    + buildNewsSection(project);

  const { text, model, grounded, usage } = await geminiGenerate({ prompt, useSearch: true });
  return { text, model, grounded, usage, at: new Date().toISOString() };
}
