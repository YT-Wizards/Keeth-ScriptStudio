// Mechanical style checks. Philosophy: flag + offer a fix, never hard-fail —
// analysis of the client's 8 top scripts showed the "rules" are guidelines he
// sometimes breaks deliberately, so he stays in control.

const BANNED_WORDS = [
  'kill', 'kills', 'killed', 'killing', 'death', 'deaths', 'die', 'dies', 'died', 'dying',
  'suicide', 'violence', 'violent', 'blood', 'bloody', 'murder', 'attack', 'attacks',
  'attacked', 'weapon', 'weapons', 'abuse', 'fraud',
];

// fraud is banned everywhere, not just the first 60 seconds
const BANNED_EVERYWHERE = new Set(['fraud']);

export const TTS_SUBSTITUTIONS = [
  { from: /\bAsda\b/g, to: 'Azda' },
  { from: /\bLidl\b/g, to: 'Liddle' },
  { from: /\bherbs\b/g, to: 'hherbs' },
  { from: /\bHerbs\b/g, to: 'Hherbs' },
  { from: /\bturmeric\b/g, to: 'turrmeric' },
  { from: /\bTurmeric\b/g, to: 'Turrmeric' },
  { from: /\bbasil\b/g, to: 'bazil' },
  { from: /\bBasil\b/g, to: 'Bazil' },
  { from: /\bcoeliac\b/gi, to: 'seeliak' },
  { from: /\bBovaer\b/gi, to: 'bovair' },
  { from: /\byogurts\b/g, to: 'Yoggurts' },
  { from: /\byogurt\b/g, to: 'Yoggurt' },
  { from: /\bYogurts\b/g, to: 'Yoggurts' },
  { from: /\bYogurt\b/g, to: 'Yoggurt' },
  { from: /\bpasta\b/g, to: 'passta' },
  { from: /\bPasta\b/g, to: 'Passta' },
];

const WORDS_PER_MINUTE = 150; // spoken pace → "first 60 seconds" ≈ first 150 words

export function wordCount(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function analyzeScript(text, targetWords) {
  const words = wordCount(text);
  const lower = text.toLowerCase();

  // banned / demonetisation-sensitive words
  const bannedFindings = [];
  for (const word of BANNED_WORDS) {
    const re = new RegExp(`\\b${word}\\b`, 'gi');
    let m;
    while ((m = re.exec(text)) !== null) {
      const wordsBefore = wordCount(text.slice(0, m.index));
      bannedFindings.push({
        word: m[0],
        position: wordsBefore,
        inFirst60s: wordsBefore <= WORDS_PER_MINUTE,
        critical: BANNED_EVERYWHERE.has(word) || wordsBefore <= WORDS_PER_MINUTE,
        context: text.slice(Math.max(0, m.index - 60), m.index + word.length + 60).replace(/\s+/g, ' '),
      });
    }
  }

  // TTS spelling substitutions still pending
  const ttsPending = [];
  for (const sub of TTS_SUBSTITUTIONS) {
    const matches = text.match(sub.from);
    if (matches) ttsPending.push({ from: sub.from.source.replace(/\\b/g, ''), to: sub.to, count: matches.length });
  }

  // years written as digits
  const digitYears = [...text.matchAll(/\b(19|20)\d{2}\b/g)].map((m) => m[0]);

  const structure = {
    opensCorrectly: /^Today, we uncover the shocking truth about/.test(text.trim()),
    hasLetsGetIntoIt: text.includes("And, let's get into it."),
    endsProtectYourPlate: /protect your plate[.!]?\s*$/.test(text.trim()),
    countdownItems: (text.match(/\bNumber\s+[A-Za-z]+\s*[.,]/gi) ?? []).length,
    goodListMarkers: (text.match(/(?:^|\n|\. )(First|Second|Third|Fourth|Fifth|Sixth)[,.]/g) ?? []).length,
    hasHypeCta: /hype/i.test(text),
    usesQuid: /\bquid\b/i.test(text),
    usesMath: /\bmath\b/i.test(lower.replace(/\bmaths\b/g, '')),
  };

  return {
    wordCount: words,
    targetWords,
    withinRange: Math.abs(words - targetWords) <= 200,
    banned: bannedFindings,
    ttsPending,
    digitYears,
    structure,
  };
}

export function applyTtsFixes(text) {
  let fixed = text;
  for (const sub of TTS_SUBSTITUTIONS) fixed = fixed.replace(sub.from, sub.to);
  return fixed;
}
