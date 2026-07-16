# Script Studio

Script Studio is a small app that runs on your own computer and takes a video from **idea to finished voice-over script**: you give it a video title and a few links, it pulls transcripts and comments automatically, researches the topic with live web search, fact-checks everything with a second independent AI model, lets **you** approve the final product list, writes the script in your channel's exact style, checks it mechanically (word count, safe wording, TTS spellings), and exports a file ready for Word or your text-to-speech software.

Nothing is published anywhere and nothing runs in the cloud on your behalf — the app lives on your machine, and the only things it talks to are YouTube/Google News (to fetch material) and the AI services (using your own keys).

---

## 1. What you need before you start

| Thing | Where to get it | Cost |
|---|---|---|
| A Windows 10/11 computer | — | — |
| **Node.js** (the engine the app runs on) | https://nodejs.org — big green **LTS** button, download, run the installer, click Next-Next-Finish. No settings need changing. | Free |
| **Google Gemini API key** | https://aistudio.google.com/apikey → **Create API key** → copy the key (starts with `AIza` or `AQ.`). ⚠️ Also enable billing: AI Studio → **Settings → Billing** → add a card. Without billing Google gives new accounts almost no free usage and the research step will fail with a "quota" error. Actual usage costs pennies per script. | ~£0.10–0.50 per script |
| **Anthropic (Claude) API key** | https://console.anthropic.com → sign up → **Settings → Billing** → add £10–15 of credit → **API Keys → Create Key** → copy the key (starts with `sk-ant-`). | ~£0.50–1.50 per script |

Typical total cost per finished script: **roughly £1–2** of API usage. There are no subscriptions.

## 2. Installing the app (one time)

1. Download the app: on the GitHub page click the green **Code** button → **Download ZIP**, then right-click the downloaded file → **Extract All…** to a folder you'll remember (e.g. `Documents\Script Studio`).
   *(If you were sent the folder directly, just put it somewhere convenient — skip this step.)*
2. Open that folder and **double-click `start.bat`**.
3. The first run installs everything automatically — a black window appears and works for a few minutes. When it's done your browser opens the app by itself.

> **If Windows shows "Windows protected your PC":** click **More info → Run anyway**. That warning just means the file isn't from the Microsoft Store.

## 3. Starting and stopping

- **Start:** double-click `start.bat`. A black window opens (that's the app's engine — keep it open), and your browser opens http://localhost:3001 (if it doesn't, type that address into your browser yourself).
- **Stop:** close the black window. Your projects are saved automatically — nothing is lost.

## 4. One-time setup: enter your API keys

1. In the app, click **Settings** (top right).
2. Paste your **Gemini** key and your **Anthropic** key into the two boxes.
3. Click **Save keys**.

The keys are stored only on your computer (in the app's `server/data` folder). They are never uploaded anywhere and never leave your machine except to talk to Google/Anthropic directly.

## 5. Making a script, step by step

### Step 1 — New script
On the home screen enter the **video title** (e.g. *"12 Worst Biscuit Brands in UK Supermarkets"*) and the **target word count** (e.g. 4200), then press **Start**.

### Step 2 — Sources
Feed the app the same material you used to gather by hand:

- **YouTube videos** — paste one or more links (competitor videos, or your own past videos on the topic) and press **Fetch transcripts & comments**. Transcripts and *every single comment* are pulled automatically — no more copy-pasting or CSV exports. If a video is US-based and you're only using it for inspiration, tick **"US video — inspiration only"** on it — the app will make sure no American product facts sneak into your UK script.
- **Reddit threads** — open the thread in your browser, press **Ctrl+A** then **Ctrl+C**, and paste it into the Reddit box.
- **Latest UK news** — press **Search Google News (UK)**; tick the articles that look useful. You can also paste your own articles into the box below.
- **Anything else** — any text you want the research to take into account.

Press **Continue to research →**.

### Step 3 — Research
Three buttons, run them top to bottom (each shows its result when done — click to read):

1. **Analyse comments** — reads every collected comment in batches and shows a counter proving 100% were covered.
2. **Run research** — the deep research step: live web search, transcripts, news and the comment analysis get turned into a full script-preparation package. This is the longest step (5–15 minutes). Leave the tab open.
3. **Run fact-check** — a second, independent AI model goes through the research and catches hallucinations, UK/US mix-ups and legally risky claims before anything reaches your script.

Then press **Build final list for approval →**.

### Step 4 — Approve the list
You get the proposed **avoid list** (in countdown order, most familiar brands first) and the **actually good list** as cards:

- Untick a product to drop it. **Nothing is ever removed unless you untick it.**
- Reorder with the **↑ ↓** buttons.
- Move a product between the avoid and good lists with the **→** button.

When it looks right, press **Approve list — write the script →**.

### Step 5 — Script
Press **Write the script**. A few minutes later you get the full script plus an automatic checklist:

- word count vs your target (±200),
- any demonetisation-risk words, with their position (words inside the first 60 seconds are flagged loudest),
- TTS spellings (Azda, Liddle, Yoggurt…) — if any are missing, one click on **Apply all TTS spellings** fixes them all,
- years written as digits, the required opening/closing lines, the countdown, the Hype CTA, no "quid".

You can edit the script right in the box — press **Save edits & re-check** and the checklist updates.

### Step 6 — Export
Two buttons under the script:

- **Export .docx** — opens in Word.
- **Export .txt** — clean text for your TTS software.

Every project is saved automatically — you'll find it on the home screen under **Previous scripts**, and you can go back to any stage using the numbered steps at the top.

## 6. If something goes wrong

| Problem | Fix |
|---|---|
| Double-clicking `start.bat` says Node.js is not installed | Install Node.js from https://nodejs.org (LTS), then run `start.bat` again. |
| Browser shows "can't reach this page" | Make sure the black window is open. If it is, wait 10 seconds and refresh. |
| Research fails with a **quota / billing** message | Billing isn't enabled on your Google account yet — see the table in section 1. |
| A step fails with an **API key** message | Check the keys in Settings — no spaces before/after, and the Anthropic account has credit. |
| A YouTube video shows "no transcript" | That video has no captions at all — the comments are still used; add a different video for transcript material. |
| The script comes out short/long | Press **Regenerate script**, or edit it and re-check — the counter updates live. |
| Something else | Close the black window, start `start.bat` again, and try once more. If it persists, send us a screenshot of the red error message. |

## 7. For developers

```bash
npm install
npm run dev        # server on :3001 + Vite dev server on :5173 (proxies /api)
npm run build      # build client to client/dist
npm start          # production: serve client + API on :3001
```

- `server/` — Express API: source ingestion (`services/`), AI pipeline (`pipeline/`), local JSON storage in `server/data/` (gitignored — API keys and projects live there)
- `client/` — React (Vite) frontend
- `prompts/` — the two pipeline prompts as plain text, editable from the app's Settings screen
- `reference-scripts/` — the channel's top-performing scripts, used as the style benchmark and as test cases for `server/src/pipeline/checks.js`
