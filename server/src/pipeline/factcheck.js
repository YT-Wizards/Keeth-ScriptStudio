import { claudeGenerate, claudeExtractJson } from '../services/claude.js';

// Independent second-model verification — the step from the client's original
// workflow where Claude caught Gemini's hallucinations.
export async function runFactCheck(project) {
  const { text, usage } = await claudeGenerate({
    system: `You are an independent fact-checker for "Protect Our Plates", a UK consumer-watchdog food channel. A research package produced by a different AI model is provided. Your job is to catch hallucinations and errors BEFORE a video script is written from it.

Scrutinise every factual claim: current UK ingredient lists, percentages, reformulations, dates, pack sizes, prices, company statements, regulatory findings, studies, historical formulas. For each problem found, state: the claim, why it is doubtful (hallucination pattern, UK/US confusion, outdated info, unsupported accusation, legal risk), and what the script writer should do (drop it, soften it with protective wording, or verify further).

Also verify: no product was removed from any established list without flagging; hook facts are supported; nothing risks a cease-and-desist; the word "fraud" is nowhere recommended.

Structure your report:
1. VERDICT SUMMARY — overall reliability, count of issues by severity.
2. CRITICAL ISSUES — claims that must not be used as-is.
3. CAUTIONS — claims needing protective wording ("reportedly", "according to…").
4. VERIFIED STRONG CLAIMS — the hardest-hitting facts that held up (these should carry the hook).
5. CORRECTIONS — corrected versions of fixable claims.
Be specific; reference products by exact name.`,
    prompt: `Video title: "${project.title}"\n\nRESEARCH PACKAGE TO VERIFY:\n\n${project.research.text}`,
    effort: 'high',
  });
  return { text, usage, at: new Date().toISOString() };
}

const LIST_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['avoid', 'good'],
  properties: {
    avoid: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'angle'],
        properties: {
          name: { type: 'string', description: 'Exact current product name incl. brand' },
          angle: { type: 'string', description: 'The distinct primary angle for this product, one sentence' },
        },
      },
    },
    good: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'angle'],
        properties: {
          name: { type: 'string' },
          angle: { type: 'string', description: 'Why it is comparatively better, one sentence' },
        },
      },
    },
  },
};

// Pull the final proposed lists out of the research package as structured data
// for the click-to-approve UI.
export async function extractList(project) {
  const { data } = await claudeExtractJson({
    system:
      'Extract the FINAL proposed avoid list (in the recommended countdown order, most familiar first) and the actually-good list from this research package. Use the recommended order and the fact-check report: if the fact-check marked a product\'s core claims as unusable, keep the product but note it in its angle. Exact product names as they appear.',
    prompt: `RESEARCH PACKAGE:\n${project.research.text}\n\nFACT-CHECK REPORT:\n${project.factcheck?.text ?? '(not run)'}`,
    schema: LIST_SCHEMA,
  });
  return {
    avoid: data.avoid.map((p) => ({ ...p, included: true })),
    good: data.good.map((p) => ({ ...p, included: true })),
    approved: false,
    at: new Date().toISOString(),
  };
}
