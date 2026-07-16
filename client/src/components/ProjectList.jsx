import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function ProjectList({ onOpen }) {
  const [projects, setProjects] = useState([]);
  const [title, setTitle] = useState('');
  const [targetWords, setTargetWords] = useState(4200);
  const [error, setError] = useState('');

  useEffect(() => {
    api.listProjects().then(setProjects).catch((e) => setError(e.message));
  }, []);

  async function create(e) {
    e.preventDefault();
    setError('');
    try {
      const project = await api.createProject(title, Number(targetWords));
      onOpen(project.id);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="page">
      <section className="card">
        <h2>New script</h2>
        <form onSubmit={create} className="newProject">
          <label>
            Video title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 12 Worst Biscuit Brands in UK Supermarkets"
              required
            />
          </label>
          <label>
            Target word count
            <input
              type="number"
              min="1000"
              step="100"
              value={targetWords}
              onChange={(e) => setTargetWords(e.target.value)}
            />
          </label>
          <button type="submit">Start</button>
        </form>
        {error && <p className="error">{error}</p>}
      </section>

      {projects.length > 0 && (
        <section className="card">
          <h2>Previous scripts</h2>
          <ul className="projectList">
            {projects.map((p) => (
              <li key={p.id}>
                <button className="link" onClick={() => onOpen(p.id)}>
                  {p.title}
                </button>
                <span className="muted"> — {p.stage}, updated {new Date(p.updatedAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
