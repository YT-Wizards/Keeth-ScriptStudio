import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { PROMPTS_DIR } from '../store.js';

const router = Router();

// prompts are plain text files so Iren can edit them without touching code
const FILES = {
  research: '1-research.txt',
  script: '2-script.txt',
};

router.get('/', (_req, res) => {
  const prompts = {};
  for (const [key, file] of Object.entries(FILES)) {
    const p = path.join(PROMPTS_DIR, file);
    prompts[key] = fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : '';
  }
  res.json(prompts);
});

router.put('/:key', (req, res) => {
  const file = FILES[req.params.key];
  if (!file) return res.status(404).json({ error: `Unknown prompt: ${req.params.key}` });
  const { content } = req.body;
  if (typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({ error: 'content must be a non-empty string' });
  }
  fs.writeFileSync(path.join(PROMPTS_DIR, file), content, 'utf-8');
  res.json({ ok: true });
});

export default router;
