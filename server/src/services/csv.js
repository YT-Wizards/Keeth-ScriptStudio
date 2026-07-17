import { parse } from 'csv-parse/sync';

// Comment CSV exports come from many tools (YouTube exporters, Reddit scrapers)
// with wildly different column names — detect the likely columns heuristically.
const TEXT_EXACT = /^(text|body|comment|comment_text|content|message|selftext|title_and_body)$/i;
const TEXT_LOOSE = /comment|body|text|content|message/i;
const AUTHOR_LOOSE = /author|user ?name|redditor|channel ?name|display ?name/i;
const LIKES_LOOSE = /like|score|upvote|\bups\b|vote|point/i;

function pickColumn(headers, exactRe, looseRe) {
  return (
    (exactRe && headers.find((h) => exactRe.test(h.trim()))) ||
    (looseRe && headers.find((h) => looseRe.test(h.trim()) && !/id$/i.test(h.trim()))) ||
    null
  );
}

export function parseCommentCsv(csvText, filename = 'comments.csv') {
  let records;
  try {
    records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
      bom: true,
    });
  } catch {
    records = null;
  }

  // fallbacks: unparseable, or a single-column file (plain text, one comment
  // per line — the "header" is really the first comment)
  if (!records || !records.length || Object.keys(records[0]).length === 1) {
    const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    return {
      filename,
      comments: lines.map((text) => ({ author: '', text, likes: '0' })),
      note: 'Treated as plain text — one comment per line.',
    };
  }

  const headers = Object.keys(records[0]);
  let textCol = pickColumn(headers, TEXT_EXACT, TEXT_LOOSE);
  if (!textCol) {
    // pick the column with the longest average content — almost always the comment text
    let best = null;
    let bestAvg = 0;
    for (const h of headers) {
      const avg =
        records.slice(0, 50).reduce((sum, r) => sum + String(r[h] ?? '').length, 0) /
        Math.min(records.length, 50);
      if (avg > bestAvg) {
        bestAvg = avg;
        best = h;
      }
    }
    textCol = best;
  }
  const authorCol = pickColumn(headers, null, AUTHOR_LOOSE);
  const likesCol = pickColumn(headers, null, LIKES_LOOSE);

  const comments = records
    .map((r) => ({
      author: authorCol ? String(r[authorCol] ?? '') : '',
      text: String(r[textCol] ?? '').trim(),
      likes: likesCol ? String(r[likesCol] ?? '0') : '0',
    }))
    .filter((c) => c.text && c.text !== '[deleted]' && c.text !== '[removed]');

  return { filename, comments, textColumn: textCol, authorColumn: authorCol, likesColumn: likesCol };
}
