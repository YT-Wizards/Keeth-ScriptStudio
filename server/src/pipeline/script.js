import fs from 'node:fs';
import path from 'node:path';
import { PROMPTS_DIR } from '../store.js';
import { claudeGenerate } from '../services/claude.js';
import { analyzeScript, wordCount } from './checks.js';

const TOLERANCE = 200;
const MAX_REVISIONS = 2;

function approvedListSection(list) {
  if (!list) return '';
  const avoid = list.avoid.filter((p) => p.included);
  const good = list.good.filter((p) => p.included);
  return `\n\nUSER-APPROVED FINAL LIST — this order and content is final and overrides any list in the research package. Do not add, remove, or reorder products.\nAvoid list (countdown starts at number ${avoid.length}, in this exact order):\n${avoid
    .map((p, i) => `${avoid.length - i}. ${p.name} — angle: ${p.angle}`)
    .join('\n')}\nActually good list (use "First," "Second," …):\n${good
    .map((p, i) => `${i + 1}. ${p.name} — ${p.angle}`)
    .join('\n')}`;
}

export async function runScript(project) {
  const template = fs.readFileSync(path.join(PROMPTS_DIR, '2-script.txt'), 'utf-8');

  // models consistently undershoot by ~20-25%, so ask for slightly more than
  // the real target up front — fewer (or no) revision passes needed after
  const biasedTarget = project.targetWords + 300;
  const prompt =
    template.replace('[ENTER THE REQUIRED TOTAL SCRIPT WORD COUNT HERE]', String(biasedTarget)) +
    `\n\nCONTEXT FROM EARLIER PIPELINE STAGES (this replaces "earlier in this conversation"):\n\n=== RESEARCH & SCRIPT PREPARATION PACKAGE ===\n${project.research.text}\n\n=== INDEPENDENT FACT-CHECK REPORT (a second model verified the research — its rulings override the research package where they conflict) ===\n${project.factcheck?.text ?? '(not run)'}${approvedListSection(project.list)}`;

  let { text, usage, stopReason } = await claudeGenerate({
    prompt,
    maxTokens: 64000,
    effort: 'high',
  });

  // Models tend to undershoot the word target. If the draft lands outside the
  // ±200 range, run revision passes that expand (or trim) it to the target.
  const attempts = [{ words: wordCount(text) }];
  for (let i = 0; i < MAX_REVISIONS; i++) {
    const words = wordCount(text);
    const diff = project.targetWords - words;
    if (Math.abs(diff) <= TOLERANCE) break;

    const direction =
      diff > 0
        ? `EXPAND it by roughly ${diff} words. Deepen the strongest avoid-product sections with additional specific, verified material from the research package (historical comparisons, marketing-versus-reality contrasts, audience sentiment, fresh news) and let strong stories breathe. Do not pad with filler, do not repeat points already made, and do not add or remove products.`
        : `TRIM it by roughly ${-diff} words. Tighten the weakest sections and remove repetition. Do not remove any product, any required phrase, or any CTA.`;

    const revision = await claudeGenerate({
      prompt: `A complete voice-over script is below, together with the research package it was written from. The script is ${words} words; the required total is ${project.targetWords} words (acceptable range ${project.targetWords - TOLERANCE}–${project.targetWords + TOLERANCE}).

${direction}

Every original rule still applies: keep the exact opening line, the "And, let's get into it." line, the countdown format, the "First," / "Second," good list, all CTAs, the closing "…protect your plate.", British English, spoken contractions, years written as words, the TTS spellings (Azda, Liddle, Yoggurt, hherbs…), and no demonetisation trigger words. Output ONLY the complete revised script — no notes, no word-count report.

=== CURRENT SCRIPT ===
${text}

=== RESEARCH PACKAGE (source material for expansion) ===
${project.research.text}

=== FACT-CHECK RULINGS (do not use claims these mark as unusable) ===
${project.factcheck?.text ?? '(not run)'}`,
      maxTokens: 64000,
      effort: 'high',
    });

    text = revision.text;
    stopReason = revision.stopReason;
    usage = {
      input_tokens: (usage.input_tokens ?? 0) + (revision.usage.input_tokens ?? 0),
      output_tokens: (usage.output_tokens ?? 0) + (revision.usage.output_tokens ?? 0),
    };
    attempts.push({ words: wordCount(text), revision: i + 1 });
  }

  return {
    text,
    usage,
    stopReason,
    attempts,
    checks: analyzeScript(text, project.targetWords),
    at: new Date().toISOString(),
  };
}
