import { useState } from 'react';
import { api } from '../api.js';

function CheckLine({ ok, warn, children }) {
  return <p className={ok ? 'ok' : warn ? 'warn' : 'error'}>{ok ? '✔' : '⚠'} {children}</p>;
}

export default function ScriptStep({ project, onUpdate }) {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [draft, setDraft] = useState(null); // local edits before re-check

  const script = project.script;
  const checks = script?.checks;
  const text = draft ?? script?.text ?? '';

  async function generate() {
    setBusy('Writing the script — this takes several minutes…');
    setError('');
    try {
      onUpdate(await api.runStage(project.id, 'script'));
      setDraft(null);
    } catch (e) {
      setError(e.message);
    }
    setBusy('');
  }

  async function recheck(applyTts = false) {
    setBusy('Checking…');
    setError('');
    try {
      onUpdate(await api.updateScriptChecks(project.id, { text, applyTtsFixes: applyTts }));
      setDraft(null);
    } catch (e) {
      setError(e.message);
    }
    setBusy('');
  }

  return (
    <div className="page">
      <section className="card">
        <h3>Generate the script</h3>
        <p className="muted">
          Target: {project.targetWords.toLocaleString()} words (±200). Uses the research package,
          the fact-check rulings and your approved list.
        </p>
        <button onClick={generate} disabled={!!busy}>
          {script ? 'Regenerate script' : 'Write the script'}
        </button>
      </section>

      {checks && (
        <section className="card">
          <h3>Automatic checks</h3>
          <CheckLine ok={checks.withinRange}>
            Word count: {checks.wordCount.toLocaleString()} (target{' '}
            {checks.targetWords.toLocaleString()} ±200)
          </CheckLine>
          <CheckLine ok={checks.banned.length === 0} warn={!checks.banned.some((b) => b.critical)}>
            Demonetisation words: {checks.banned.length === 0 ? 'none found' : ''}
          </CheckLine>
          {checks.banned.map((b, i) => (
            <p key={i} className={b.critical ? 'error' : 'warn'}>
              &nbsp;&nbsp;“{b.word}” at word ~{b.position}
              {b.inFirst60s ? ' — INSIDE THE FIRST 60 SECONDS' : ''}: …{b.context}…
            </p>
          ))}
          <CheckLine ok={checks.ttsPending.length === 0}>
            TTS spellings:{' '}
            {checks.ttsPending.length === 0
              ? 'all applied'
              : checks.ttsPending.map((t) => `${t.from}→${t.to} ×${t.count}`).join(', ')}
          </CheckLine>
          {checks.ttsPending.length > 0 && (
            <button onClick={() => recheck(true)} disabled={!!busy}>
              Apply all TTS spellings
            </button>
          )}
          <CheckLine ok={checks.digitYears.length === 0}>
            Years as digits: {checks.digitYears.length === 0 ? 'none' : checks.digitYears.join(', ')}
          </CheckLine>
          <CheckLine ok={checks.structure.opensCorrectly}>Opens with “Today, we uncover…”</CheckLine>
          <CheckLine ok={checks.structure.endsProtectYourPlate}>Ends with “…protect your plate.”</CheckLine>
          <CheckLine ok={checks.structure.countdownItems > 0}>
            Countdown items: {checks.structure.countdownItems} · good-list markers:{' '}
            {checks.structure.goodListMarkers}
          </CheckLine>
          <CheckLine ok={checks.structure.hasHypeCta}>Hype-button CTA present</CheckLine>
          <CheckLine ok={!checks.structure.usesQuid}>No “quid”</CheckLine>
        </section>
      )}

      {script && (
        <section className="card">
          <h3>Script (editable)</h3>
          <textarea
            rows="24"
            value={text}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className="row">
            <button onClick={() => recheck(false)} disabled={!!busy || draft === null}>
              Save edits & re-check
            </button>
            <a className="buttonLink" href={api.exportUrl(project.id, 'docx')}>Export .docx (Word)</a>
            <a className="buttonLink" href={api.exportUrl(project.id, 'txt')}>Export .txt (TTS)</a>
          </div>
        </section>
      )}

      {busy && <p className="busy">{busy}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
