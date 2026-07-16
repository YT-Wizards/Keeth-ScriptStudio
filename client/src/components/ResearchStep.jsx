import { useState } from 'react';
import { api } from '../api.js';

export default function ResearchStep({ project, onUpdate }) {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const totalComments = (project.sources.youtube ?? []).reduce(
    (sum, v) => sum + (v.commentCount || 0),
    0
  );

  async function run(stage, label) {
    setBusy(label);
    setError('');
    try {
      onUpdate(await api.runStage(project.id, stage));
    } catch (e) {
      setError(e.message);
    }
    setBusy('');
  }

  const ca = project.commentAnalysis;

  return (
    <div className="page">
      <section className="card">
        <h3>Step 1 — Analyse every comment</h3>
        <p className="muted">
          {totalComments.toLocaleString()} comments collected. Each one is read in batches — nothing
          is skimmed. Takes a few minutes.
        </p>
        <button onClick={() => run('comments', 'Analysing comments…')} disabled={!!busy || !totalComments}>
          {ca ? 'Re-analyse comments' : 'Analyse comments'}
        </button>
        {ca && (
          <p className="ok">
            ✔ {ca.analyzedComments.toLocaleString()} of {ca.totalComments.toLocaleString()} comments
            analysed (100% coverage, {ca.batches.length} batch{ca.batches.length === 1 ? '' : 'es'})
          </p>
        )}
        {ca?.summary && (
          <details>
            <summary>Comment analysis</summary>
            <pre className="output">{ca.summary}</pre>
          </details>
        )}
      </section>

      <section className="card">
        <h3>Step 2 — Deep research (Gemini, with live web search)</h3>
        <p className="muted">
          Researches the topic from scratch, digests transcripts, fresh UK news and the comment
          analysis into a full script-preparation package. This is the longest step (5–15 min).
        </p>
        <button onClick={() => run('research', 'Researching…')} disabled={!!busy}>
          {project.research ? 'Re-run research' : 'Run research'}
        </button>
        {project.research && (
          <details>
            <summary>
              Research package ({project.research.model}
              {project.research.grounded ? ', web-grounded' : ''})
            </summary>
            <pre className="output">{project.research.text}</pre>
          </details>
        )}
      </section>

      <section className="card">
        <h3>Step 3 — Independent fact-check (Claude)</h3>
        <p className="muted">
          A second, independent model verifies the research and catches hallucinations — the step
          your old workflow did by pasting everything into Claude.
        </p>
        <button onClick={() => run('factcheck', 'Fact-checking…')} disabled={!!busy || !project.research}>
          {project.factcheck ? 'Re-run fact-check' : 'Run fact-check'}
        </button>
        {project.factcheck && (
          <details>
            <summary>Fact-check report</summary>
            <pre className="output">{project.factcheck.text}</pre>
          </details>
        )}
      </section>

      {busy && <p className="busy">{busy} — this can take a while, leave the tab open.</p>}
      {error && <p className="error">{error}</p>}

      <section className="card summary">
        <span className="muted">Next: extract the product list for your approval.</span>
        <button
          className="primary"
          onClick={() => run('extract-list', 'Building the list…')}
          disabled={!!busy || !project.research}
        >
          Build final list for approval →
        </button>
      </section>
    </div>
  );
}
