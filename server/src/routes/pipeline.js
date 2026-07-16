import { Router } from 'express';
import { getProject, saveProject } from '../store.js';
import { analyzeComments } from '../pipeline/comments.js';
import { runResearch } from '../pipeline/research.js';
import { runFactCheck, extractList } from '../pipeline/factcheck.js';
import { runScript } from '../pipeline/script.js';
import { analyzeScript, applyTtsFixes } from '../pipeline/checks.js';
import { toTxt, toDocx } from '../pipeline/export.js';

const router = Router();

const wrap = (fn) => (req, res, next) => fn(req, res).catch(next);

function load(req, res) {
  const project = getProject(req.params.id);
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return null;
  }
  return project;
}

router.post(
  '/:id/comments',
  wrap(async (req, res) => {
    const project = load(req, res);
    if (!project) return;
    project.commentAnalysis = await analyzeComments(project);
    res.json(saveProject(project));
  })
);

router.post(
  '/:id/research',
  wrap(async (req, res) => {
    const project = load(req, res);
    if (!project) return;
    project.research = await runResearch(project);
    project.stage = 'research';
    res.json(saveProject(project));
  })
);

router.post(
  '/:id/factcheck',
  wrap(async (req, res) => {
    const project = load(req, res);
    if (!project) return;
    if (!project.research) return res.status(400).json({ error: 'Run research first' });
    project.factcheck = await runFactCheck(project);
    res.json(saveProject(project));
  })
);

router.post(
  '/:id/extract-list',
  wrap(async (req, res) => {
    const project = load(req, res);
    if (!project) return;
    if (!project.research) return res.status(400).json({ error: 'Run research first' });
    project.list = await extractList(project);
    project.stage = 'approval';
    res.json(saveProject(project));
  })
);

router.post(
  '/:id/script',
  wrap(async (req, res) => {
    const project = load(req, res);
    if (!project) return;
    if (!project.research) return res.status(400).json({ error: 'Run research first' });
    project.script = await runScript(project);
    project.stage = 'script';
    res.json(saveProject(project));
  })
);

// re-run checks after manual edits / apply TTS fixes
router.post(
  '/:id/checks',
  wrap(async (req, res) => {
    const project = load(req, res);
    if (!project) return;
    if (!project.script) return res.status(400).json({ error: 'No script yet' });
    if (typeof req.body.text === 'string') project.script.text = req.body.text;
    if (req.body.applyTtsFixes) project.script.text = applyTtsFixes(project.script.text);
    project.script.checks = analyzeScript(project.script.text, project.targetWords);
    res.json(saveProject(project));
  })
);

router.get(
  '/:id/export',
  wrap(async (req, res) => {
    const project = load(req, res);
    if (!project) return;
    if (!project.script?.text) return res.status(400).json({ error: 'No script to export' });
    const safeTitle = project.title.replace(/[^\w\- ]+/g, '').slice(0, 60).trim() || 'script';
    if (req.query.format === 'docx') {
      const buffer = await toDocx(project.title, project.script.text);
      res
        .set('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
        .set('Content-Disposition', `attachment; filename="${safeTitle}.docx"`)
        .send(buffer);
    } else {
      res
        .set('Content-Type', 'text/plain; charset=utf-8')
        .set('Content-Disposition', `attachment; filename="${safeTitle}.txt"`)
        .send(toTxt(project.script.text));
    }
  })
);

export default router;
