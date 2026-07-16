import { geminiGenerate } from '../services/gemini.js';

const BATCH_SIZE = 300;

export function collectComments(project) {
  const comments = [];
  for (const video of project.sources.youtube ?? []) {
    for (const c of video.comments ?? []) {
      comments.push({ source: video.title || video.videoId, ...c });
    }
  }
  return comments;
}

// Guaranteed 100% coverage: every comment goes into exactly one batch, and we
// record per-batch counts so the UI can show "N of N comments analyzed".
export async function analyzeComments(project, onProgress = () => {}) {
  const comments = collectComments(project);
  if (!comments.length) {
    return { totalComments: 0, analyzedComments: 0, batches: [], summary: '(no comments supplied)' };
  }

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
        'You analyse YouTube audience comments for a UK consumer-watchdog food channel (audience: British, 50+, nostalgic, sceptical of corporations). Read EVERY comment in the batch. Extract: repeated opinions and complaints; brands repeatedly criticised or defended; products viewers say declined or remember fondly; nostalgic memories; recipe/size/taste/texture/price complaints; positive recommendations; authentic British phrases and sentiments worth echoing; products viewers want investigated; suggestions that could change an avoid/good list. Aggregate — do not quote or copy distinctive comments verbatim. Be concrete and thorough.',
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
    totalComments: comments.length,
    analyzedComments: analyzed,
    batches: batchResults.map(({ index, count, model }) => ({ index, count, model })),
    summary,
    at: new Date().toISOString(),
  };
}
