import { Router } from 'express';
import crypto from 'node:crypto';
import { listProjects, getProject, saveProject } from '../store.js';

const router = Router();

router.get('/', (_req, res) => {
  // list view: skip heavy fields
  res.json(
    listProjects().map(({ id, title, targetWords, stage, createdAt, updatedAt }) => ({
      id,
      title,
      targetWords,
      stage,
      createdAt,
      updatedAt,
    }))
  );
});

router.post('/', (req, res) => {
  const { title, targetWords = 4200 } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'title is required' });
  const project = saveProject({
    id: crypto.randomUUID(),
    title: title.trim(),
    targetWords,
    stage: 'sources', // sources → research → approval → script → export
    sources: { youtube: [], reddit: [], news: [], manual: [], csv: [] },
    createdAt: new Date().toISOString(),
  });
  res.status(201).json(project);
});

router.get('/:id', (req, res) => {
  const project = getProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Not found' });
  res.json(project);
});

router.patch('/:id', (req, res) => {
  const project = getProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Not found' });
  const { id, createdAt, ...updates } = req.body;
  res.json(saveProject({ ...project, ...updates }));
});

export default router;
