import fs from 'node:fs';
import path from 'node:path';
import { PROMPTS_DIR } from '../store.js';
import { claudeGenerate } from '../services/claude.js';
import { analyzeScript } from './checks.js';

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

  const prompt =
    template.replace('[ENTER THE REQUIRED TOTAL SCRIPT WORD COUNT HERE]', String(project.targetWords)) +
    `\n\nCONTEXT FROM EARLIER PIPELINE STAGES (this replaces "earlier in this conversation"):\n\n=== RESEARCH & SCRIPT PREPARATION PACKAGE ===\n${project.research.text}\n\n=== INDEPENDENT FACT-CHECK REPORT (a second model verified the research — its rulings override the research package where they conflict) ===\n${project.factcheck?.text ?? '(not run)'}${approvedListSection(project.list)}`;

  const { text, usage, stopReason } = await claudeGenerate({
    prompt,
    maxTokens: 64000,
    effort: 'high',
  });

  return {
    text,
    usage,
    stopReason,
    checks: analyzeScript(text, project.targetWords),
    at: new Date().toISOString(),
  };
}
