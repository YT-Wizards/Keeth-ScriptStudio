import { geminiGenerate } from '../services/gemini.js';

const BATCH_SIZE = 300;

// "1.2K" / "1,234" / "-5" → number
function parseLikes(text) {
  const m = String(text ?? '0').replace(/,/g, '').match(/(-?[\d.]+)\s*([KMB])?/i);
  if (!m) return 0;
  const mult = { K: 1e3, M: 1e6, B: 1e9 }[m[2]?.toUpperCase()] ?? 1;
  return Math.round(parseFloat(m[1]) * mult);
}

export function collectComments(project) {
  const comments = [];
  for (const video of project.sources.youtube ?? []) {
    for (const c of video.comments ?? []) {
      comments.push({ source: video.title || video.videoId, ...c, likesNum: parseLikes(c.likes) });
    }
  }
  for (const file of project.sources.csv ?? []) {
    for (const c of file.comments ?? []) {
      comments.push({ source: file.filename, ...c, likesNum: parseLikes(c.likes) });
    }
  }
  return comments;
}

// Guaranteed 100% coverage: every comment goes into exactly one batch, and we
// record per-batch counts so the UI can show "N of N comments analyzed".
export async function analyzeComments(project, onProgress = () => {}) {
  const all = collectComments(project);
  if (!all.length) {
    return { totalComments: 0, analyzedComments: 0, excludedDownvoted: 0, batches: [], summary: '(no comments supplied)' };
  }

  // community-rejected comments (negative score — Reddit exports) are excluded,
  // matching the client's manual workflow; the rest is sorted most-liked first
  // so the analysis weights popular sentiment hardest
  const downvoted = all.filter((c) => c.likesNum < 0);
  const comments = all.filter((c) => c.likesNum >= 0).sort((a, b) => b.likesNum - a.likesNum);

  const batches = [];
  for (let i = 0; i < comments.length; i += BATCH_SIZE) {
    batches.push(comments.slice(i, i + BATCH_SIZE));
  }

  const batchResults = [];
  let analyzed = 0;
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const listing = batch
      .map((c) => `[${c.likes || 0} likes] ${c.author}: ${c.text}`)
      .join('\n');
    const { text, model } = await geminiGenerate({
      system:
        'You analyse YouTube audience comments for a UK consumer-watchdog food channel (audience: British, 50+, nostalgic, sceptical of corporations). Read EVERY comment in the batch. The comments are sorted by likes/upvotes, most-liked first — weight your analysis accordingly: a sentiment echoed in highly-liked comments represents the audience far more than a stray low-engagement remark, though repeated low-like themes still count. Extract: repeated opinions and complaints; brands repeatedly criticised or defended; products viewers say declined or remember fondly; nostalgic memories; recipe/size/taste/texture/price complaints; positive recommendations; authentic British phrases and sentiments worth echoing; products viewers want investigated; suggestions that could change an avoid/good list. Aggregate — do not quote or copy distinctive comments verbatim. Be concrete and thorough.',
      prompt: `Video title being researched: "${project.title}"\n\nComment batch ${i + 1} of ${batches.length} (${batch.length} comments):\n\n${listing}`,
    });
    analyzed += batch.length;
    batchResults.push({ index: i + 1, count: batch.length, model, analysis: text });
    onProgress({ analyzed, total: comments.length, batch: i + 1, batches: batches.length });
  }

  let summary;
  if (batchResults.length === 1) {
    summary = batchResults[0].analysis;
  } else {
    const merged = await geminiGenerate({
      system:
        'Merge these per-batch audience-comment analyses into one consolidated report for a scriptwriter. Preserve every distinct repeated sentiment, brand mention, and nostalgia trigger; combine duplicates and note how widespread each theme is across batches.',
      prompt: batchResults.map((b) => `--- Batch ${b.index} (${b.count} comments) ---\n${b.analysis}`).join('\n\n'),
    });
    summary = merged.text;
  }

  return {
    totalComments: all.length,
    analyzedComments: analyzed,
    excludedDownvoted: downvoted.length,
    batches: batchResults.map(({ index, count, model }) => ({ index, count, model })),
    summary,
    at: new Date().toISOString(),
  };
}
