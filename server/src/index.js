import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import ingestRouter from './routes/ingest.js';
import settingsRouter from './routes/settings.js';
import promptsRouter from './routes/prompts.js';
import projectsRouter from './routes/projects.js';
import pipelineRouter from './routes/pipeline.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
// pasted transcripts/comment dumps can be large
app.use(express.json({ limit: '50mb' }));

app.use('/api/ingest', ingestRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/prompts', promptsRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/pipeline', pipelineRouter);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// serve the built client in production
const dist = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal error' });
});

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => console.log(`Script Studio server on http://localhost:${PORT}`));
// pipeline stages (research, script generation) legitimately run for many minutes
server.requestTimeout = 0;
server.headersTimeout = 0;
