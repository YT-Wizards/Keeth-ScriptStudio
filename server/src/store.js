import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../data');
const PROJECTS_DIR = path.join(DATA_DIR, 'projects');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
export const PROMPTS_DIR = path.resolve(__dirname, '../../prompts');

fs.mkdirSync(PROJECTS_DIR, { recursive: true });

export function getSettings() {
  if (!fs.existsSync(SETTINGS_FILE)) {
    return { geminiApiKey: '', anthropicApiKey: '', redditClientId: '', redditClientSecret: '' };
  }
  return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
}

export function saveSettings(settings) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

function projectFile(id) {
  if (!/^[\w-]+$/.test(id)) throw new Error('Bad project id');
  return path.join(PROJECTS_DIR, `${id}.json`);
}

export function listProjects() {
  return fs
    .readdirSync(PROJECTS_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(PROJECTS_DIR, f), 'utf-8')))
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
}

export function getProject(id) {
  const file = projectFile(id);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

export function saveProject(project) {
  project.updatedAt = new Date().toISOString();
  fs.writeFileSync(projectFile(project.id), JSON.stringify(project, null, 2));
  return project;
}
