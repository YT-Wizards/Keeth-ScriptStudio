# Keeth Script Studio

Local desktop app (runs in the browser) that assembles a P.O.P voice-over script from a video title and source links: pulls YouTube transcripts and comments, Reddit threads and fresh UK news automatically, runs the research/verification/writing pipeline through AI APIs, lets the user approve and reorder the final product list, applies mechanical style checks (word count, banned words, TTS spellings) and exports a Word/TTS-ready file.

## Structure

- `server/` — Node/Express backend: source ingestion, AI pipeline, checks, export, local storage
- `client/` — React (Vite) frontend
- `prompts/` — the two pipeline prompts as plain text; editable from the app's Settings screen (edits do not require a code change)

## Development

```bash
npm install
npm run dev
```

Server runs on http://localhost:3001, client dev server on http://localhost:5173 (proxies `/api` to the server).

## Production / user launch

```bash
npm run build
npm start
```

then open http://localhost:3001. API keys are entered on the Settings screen and stored locally in `server/data/settings.json` (never committed).
