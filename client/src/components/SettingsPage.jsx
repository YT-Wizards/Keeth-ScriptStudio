import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function SettingsPage() {
  const [settings, setSettings] = useState({ geminiApiKey: '', anthropicApiKey: '' });
  const [prompts, setPrompts] = useState({ research: '', script: '' });
  const [status, setStatus] = useState('');

  useEffect(() => {
    api.getSettings().then(setSettings).catch(() => {});
    api.getPrompts().then(setPrompts).catch(() => {});
  }, []);

  async function saveKeys(e) {
    e.preventDefault();
    await api.saveSettings(settings);
    setStatus('API keys saved.');
  }

  async function savePrompt(key) {
    await api.savePrompt(key, prompts[key]);
    setStatus(`Prompt "${key}" saved.`);
  }

  return (
    <div className="page">
      <section className="card">
        <h2>API keys</h2>
        <p className="muted">
          Stored only on this computer. We'll set these up together on a call — you never need to share them.
        </p>
        <form onSubmit={saveKeys} className="newProject">
          <label>
            Google Gemini API key
            <input
              type="password"
              value={settings.geminiApiKey || ''}
              onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
            />
          </label>
          <label>
            Anthropic (Claude) API key
            <input
              type="password"
              value={settings.anthropicApiKey || ''}
              onChange={(e) => setSettings({ ...settings, anthropicApiKey: e.target.value })}
            />
          </label>
          <label>
            Claude model (fact-check & scriptwriting)
            <select
              value={settings.claudeModel || 'claude-opus-4-8'}
              onChange={(e) => setSettings({ ...settings, claudeModel: e.target.value })}
            >
              <option value="claude-opus-4-8">Opus 4.8 — best quality (recommended)</option>
              <option value="claude-sonnet-5">Sonnet 5 — cheaper, slightly below Opus</option>
            </select>
          </label>
          <button type="submit">Save keys</button>
        </form>
      </section>

      <section className="card">
        <h2>Pipeline prompts</h2>
        <p className="muted">
          The two prompts that drive research and scriptwriting. Editable here — no code changes needed.
        </p>
        {['research', 'script'].map((key) => (
          <details key={key} className="promptEditor">
            <summary>{key === 'research' ? 'Prompt 1 — research & preparation' : 'Prompt 2 — final script'}</summary>
            <textarea
              rows="20"
              value={prompts[key]}
              onChange={(e) => setPrompts({ ...prompts, [key]: e.target.value })}
            />
            <button onClick={() => savePrompt(key)}>Save prompt</button>
          </details>
        ))}
      </section>

      {status && <p className="busy">{status}</p>}
    </div>
  );
}
