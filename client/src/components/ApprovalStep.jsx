import { useState } from 'react';
import { api } from '../api.js';

export default function ApprovalStep({ project, onUpdate }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const list = project.list;

  async function saveList(next) {
    onUpdate(await api.updateProject(project.id, { list: { ...list, ...next } }));
  }

  function move(kind, index, delta) {
    const items = [...list[kind]];
    const j = index + delta;
    if (j < 0 || j >= items.length) return;
    [items[index], items[j]] = [items[j], items[index]];
    saveList({ [kind]: items });
  }

  function toggle(kind, index) {
    const items = list[kind].map((p, i) => (i === index ? { ...p, included: !p.included } : p));
    saveList({ [kind]: items });
  }

  function switchList(kind, index) {
    const other = kind === 'avoid' ? 'good' : 'avoid';
    const item = list[kind][index];
    saveList({
      [kind]: list[kind].filter((_, i) => i !== index),
      [other]: [...list[other], item],
    });
  }

  async function approve() {
    setBusy(true);
    setError('');
    try {
      const updated = await api.updateProject(project.id, {
        list: { ...list, approved: true },
        stage: 'script',
      });
      onUpdate(updated);
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  }

  function renderItems(kind, title, numbered) {
    const items = list[kind];
    const includedCount = items.filter((p) => p.included).length;
    return (
      <section className="card">
        <h3>{title} ({includedCount})</h3>
        <ul className="approveList">
          {items.map((p, i) => (
            <li key={`${p.name}-${i}`} className={p.included ? '' : 'excluded'}>
              <div className="approveRow">
                <label className="inline">
                  <input type="checkbox" checked={p.included} onChange={() => toggle(kind, i)} />
                  <strong>
                    {numbered && p.included
                      ? `Number ${includedCount - items.slice(0, i).filter((x) => x.included).length}. `
                      : ''}
                    {p.name}
                  </strong>
                </label>
                <span className="rowButtons">
                  <button title="Move up" onClick={() => move(kind, i, -1)}>↑</button>
                  <button title="Move down" onClick={() => move(kind, i, 1)}>↓</button>
                  <button className="link" onClick={() => switchList(kind, i)}>
                    → {kind === 'avoid' ? 'good' : 'avoid'}
                  </button>
                </span>
              </div>
              <p className="muted">{p.angle}</p>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  if (!list) return <p className="muted">No list yet — run the research steps first.</p>;

  return (
    <div className="page">
      <p className="muted">
        Untick to drop a product, reorder with ↑↓ (avoid list: most familiar first — top of the list
        is the highest countdown number), or move items between lists. Nothing is removed without
        you unticking it.
      </p>
      {renderItems('avoid', 'Avoid list (countdown order)', true)}
      {renderItems('good', 'Actually good list')}
      {error && <p className="error">{error}</p>}
      <section className="card summary">
        <strong>
          {list.avoid.filter((p) => p.included).length} avoids +{' '}
          {list.good.filter((p) => p.included).length} good ={' '}
          {list.avoid.filter((p) => p.included).length + list.good.filter((p) => p.included).length}{' '}
          products
        </strong>
        <button className="primary" onClick={approve} disabled={busy}>
          Approve list — write the script →
        </button>
      </section>
    </div>
  );
}
