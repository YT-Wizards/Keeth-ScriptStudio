import { useState } from 'react';
import { api } from './api.js';
import ProjectList from './components/ProjectList.jsx';
import SourcesStep from './components/SourcesStep.jsx';
import ResearchStep from './components/ResearchStep.jsx';
import ApprovalStep from './components/ApprovalStep.jsx';
import ScriptStep from './components/ScriptStep.jsx';
import SettingsPage from './components/SettingsPage.jsx';

const STAGES = [
  { key: 'sources', label: '1. Sources' },
  { key: 'research', label: '2. Research' },
  { key: 'approval', label: '3. Approve list' },
  { key: 'script', label: '4. Script' },
  { key: 'export', label: '5. Export' },
];

export default function App() {
  const [view, setView] = useState('projects'); // projects | project | settings
  const [project, setProject] = useState(null);

  async function openProject(id) {
    setProject(await api.getProject(id));
    setView('project');
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1 onClick={() => setView('projects')}>Script Studio</h1>
        <nav>
          <button className={view !== 'settings' ? 'active' : ''} onClick={() => setView('projects')}>
            Scripts
          </button>
          <button className={view === 'settings' ? 'active' : ''} onClick={() => setView('settings')}>
            Settings
          </button>
        </nav>
      </header>

      {view === 'projects' && <ProjectList onOpen={openProject} />}
      {view === 'settings' && <SettingsPage />}
      {view === 'project' && project && (
        <div className="project">
          <div className="stagebar">
            {STAGES.map((s) => (
              <button
                key={s.key}
                className={`stage ${project.stage === s.key ? 'current' : ''}`}
                onClick={async () => setProject(await api.updateProject(project.id, { stage: s.key }))}
              >
                {s.label}
              </button>
            ))}
          </div>
          <h2>{project.title}</h2>
          {project.stage === 'sources' && <SourcesStep project={project} onUpdate={setProject} />}
          {project.stage === 'research' && <ResearchStep project={project} onUpdate={setProject} />}
          {project.stage === 'approval' && <ApprovalStep project={project} onUpdate={setProject} />}
          {(project.stage === 'script' || project.stage === 'export') && (
            <ScriptStep project={project} onUpdate={setProject} />
          )}
        </div>
      )}
    </div>
  );
}
