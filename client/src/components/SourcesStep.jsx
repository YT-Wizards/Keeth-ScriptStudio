import { useState } from 'react';
import { api } from '../api.js';

export default function SourcesStep({ project, onUpdate }) {
  const [ytInput, setYtInput] = useState('');
  const [redditInput, setRedditInput] = useState('');
  const [manualText, setManualText] = useState('');
  const [newsQuery, setNewsQuery] = useState(project.title);
  const [news, setNews] = useState(project.sources.news ?? []);
  const [busy, setBusy] = useState('');
  const [errors, setErrors] = useState([]);

  const sources = project.sources;

  async function save(patch) {
    const updated = await api.updateProject(project.id, {
      sources: { ...sources, ...patch },
    });
    onUpdate(updated);
    return updated;
  }

  function addError(message) {
    setErrors((prev) => [...prev, message]);
  }

  async function fetchYoutube() {
    const urls = ytInput.split(/\s+/).filter(Boolean);
    if (!urls.length) return;
    setErrors([]);
    const fetched = [...sources.youtube];
    for (const url of urls) {
      setBusy(`Fetching ${url} …`);
      try {
        const video = await api.ingestYoutube(url);
        fetched.push(video);
      } catch (e) {
        addError(`${url}: ${e.message}`);
      }
    }
    setBusy('');
    setYtInput('');
    await save({ youtube: fetched });
  }

  async function fetchReddit() {
    const urls = redditInput.split(/\s+/).filter(Boolean);
    if (!urls.length) return;
    setErrors([]);
    const fetched = [...sources.reddit];
    for (const url of urls) {
      setBusy(`Fetching ${url} …`);
      try {
        fetched.push(await api.ingestReddit(url));
      } catch (e) {
        addError(`${url}: ${e.message}`);
      }
    }
    setBusy('');
    setRedditInput('');
    await save({ reddit: fetched });
  }

  async function searchNews() {
    setBusy('Searching latest UK news…');
    setErrors([]);
    try {
      const { items } = await api.searchNews(newsQuery);
      setNews(items.map((item) => ({ ...item, selected: true })));
    } catch (e) {
      addError(e.message);
    }
    setBusy('');
  }

  async function addManual() {
    if (!manualText.trim()) return;
    await save({ manual: [...sources.manual, { text: manualText.trim(), addedAt: new Date().toISOString() }] });
    setManualText('');
  }

  async function removeSource(kind, index) {
    await save({ [kind]: sources[kind].filter((_, i) => i !== index) });
  }

  async function proceed() {
    await save({ news: news.filter((n) => n.selected) });
    const updated = await api.updateProject(project.id, { stage: 'research' });
    onUpdate(updated);
  }

  const totalComments = sources.youtube.reduce((sum, v) => sum + (v.commentCount || 0), 0);

  return (
    <div className="page">
      <section className="card">
        <h3>YouTube videos (competitors or your previous videos)</h3>
        <p className="muted">
          Transcripts and every comment are pulled automatically. US-based videos are fine when there's
          nothing for the UK — they'll be marked as inspiration-only so UK/US products never get mixed up.
        </p>
        <textarea
          rows="3"
          placeholder="Paste one or more YouTube links, separated by spaces or new lines"
          value={ytInput}
          onChange={(e) => setYtInput(e.target.value)}
        />
        <button onClick={fetchYoutube} disabled={!!busy}>Fetch transcripts & comments</button>

        {sources.youtube.length > 0 && (
          <ul className="sourceList">
            {sources.youtube.map((v, i) => (
              <li key={`${v.videoId}-${i}`}>
                <strong>{v.title || v.videoId}</strong> — {v.channel}
                <br />
                <span className="muted">
                  {v.transcript
                    ? `transcript: ${v.transcriptWordCount.toLocaleString()} words`
                    : `no transcript (${v.transcriptError || 'unavailable'})`}
                  {' · '}
                  comments: {(v.commentCount || 0).toLocaleString()}
                  {v.capped ? ' (capped)' : ''}
                  {v.commentsError ? ` (comments failed: ${v.commentsError})` : ''}
                </span>
                <label className="inline">
                  <input
                    type="checkbox"
                    checked={!!v.usInspirationOnly}
                    onChange={async (e) => {
                      const youtube = sources.youtube.map((item, j) =>
                        j === i ? { ...item, usInspirationOnly: e.target.checked } : item
                      );
                      await save({ youtube });
                    }}
                  />
                  US video — inspiration only
                </label>
                <button className="link danger" onClick={() => removeSource('youtube', i)}>remove</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h3>Reddit threads</h3>
        <textarea
          rows="2"
          placeholder="Paste Reddit links (post and comments are pulled automatically)"
          value={redditInput}
          onChange={(e) => setRedditInput(e.target.value)}
        />
        <button onClick={fetchReddit} disabled={!!busy}>Fetch threads</button>
        {sources.reddit.length > 0 && (
          <ul className="sourceList">
            {sources.reddit.map((r, i) => (
              <li key={`${r.url}-${i}`}>
                <strong>{r.title}</strong> <span className="muted">({r.subreddit}, {r.commentCount} comments)</span>
                <button className="link danger" onClick={() => removeSource('reddit', i)}>remove</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h3>Latest UK news</h3>
        <div className="row">
          <input value={newsQuery} onChange={(e) => setNewsQuery(e.target.value)} />
          <button onClick={searchNews} disabled={!!busy}>Search Google News (UK)</button>
        </div>
        {news.length > 0 && (
          <ul className="sourceList">
            {news.map((n, i) => (
              <li key={n.link}>
                <label className="inline">
                  <input
                    type="checkbox"
                    checked={!!n.selected}
                    onChange={(e) =>
                      setNews(news.map((item, j) => (j === i ? { ...item, selected: e.target.checked } : item)))
                    }
                  />
                  <strong>{n.title}</strong>
                </label>
                <span className="muted"> — {n.source}, {n.published}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h3>Anything else (paste your own material)</h3>
        <p className="muted">Article text, a transcript you copied yourself, comment dumps — anything goes.</p>
        <textarea rows="4" value={manualText} onChange={(e) => setManualText(e.target.value)} />
        <button onClick={addManual}>Add</button>
        {sources.manual.length > 0 && (
          <ul className="sourceList">
            {sources.manual.map((m, i) => (
              <li key={i}>
                <span className="muted">{m.text.slice(0, 120)}…</span>
                <button className="link danger" onClick={() => removeSource('manual', i)}>remove</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {busy && <p className="busy">{busy}</p>}
      {errors.map((e, i) => (
        <p key={i} className="error">{e}</p>
      ))}

      <section className="card summary">
        <strong>
          {sources.youtube.length} videos · {totalComments.toLocaleString()} comments collected ·{' '}
          {sources.reddit.length} Reddit threads · {news.filter((n) => n.selected).length} news articles ·{' '}
          {sources.manual.length} pasted items
        </strong>
        <button className="primary" onClick={proceed} disabled={!!busy}>
          Continue to research →
        </button>
      </section>
    </div>
  );
}
