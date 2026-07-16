import { Router } from 'express';
import { getSettings, saveSettings } from '../store.js';

const router = Router();

router.get('/', (_req, res) => res.json(getSettings()));

router.put('/', (req, res) => {
  const current = getSettings();
  const next = { ...current, ...req.body };
  saveSettings(next);
  res.json(next);
});

export default router;
