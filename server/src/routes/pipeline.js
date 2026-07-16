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

// AI stages run for minutes — far beyond browser/HTTP timeouts — so they run
// as background jobs: POST starts the job and returns immediately; the client
// polls GET /api/projects/:id and reads project.jobs[stage].
const STAGES = {
  comments: {
    precondition: () => null,
    run: async (project) => {
      project.commentAnalysis = await analyzeComments(project);
    },
  },
  research: {
    precondition: () => null,
    run: async (project) => {
      project.research = await runResearch(project);
      project.stage = 'research';
    },
  },
  factcheck: {
    precondition: (p) => (p.research ? null : 'Run research first'),
    run: async (project) => {
      project.factcheck = await runFactCheck(project);
    },
  },
  'extract-list': {
    precondition: (p) => (p.research ? null : 'Run research first'),
    run: async (project) => {
      project.list = await extractList(project);
      project.stage = 'approval';
    },
  },
  script: {
    precondition: (p) => (p.research ? null : 'Run research first'),
    run: async (project) => {
      project.script = await runScript(project);
      project.stage = 'script';
    },
  },
};

router.post('/:id/run/:stage', (req, res) => {
  const stageDef = STAGES[req.params.stage];
  if (!stageDef) return res.status(404).json({ error: `Unknown stage: ${req.params.stage}` });
  const project = load(req, res);
  if (!project) return;

  const failed = stageDef.precondition(project);
  if (failed) return res.status(400).json({ error: failed });

  const stage = req.params.stage;
  if (project.jobs?.[stage]?.status === 'running') {
    return res.json(project); // already running — polling will pick it up
  }

  project.jobs = { ...project.jobs, [stage]: { status: 'running', startedAt: new Date().toISOString() } };
  res.json(saveProject(project));

  // fire-and-forget; result lands in the project file
  (async () => {
    const fresh = getProject(project.id);
    try {
      await stageDef.run(fresh);
      fresh.jobs = { ...fresh.jobs, [stage]: { status: 'done', finishedAt: new Date().toISOString() } };
    } catch (e) {
      console.error(`Stage ${stage} failed:`, e);
      fresh.jobs = {
        ...fresh.jobs,
        [stage]: { status: 'error', message: e.message, finishedAt: new Date().toISOString() },
      };
    }
    saveProject(fresh);
  })();
});

// fast, synchronous: re-run checks after manual edits / apply TTS fixes
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
