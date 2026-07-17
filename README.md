# Script Studio — Complete Guide

Script Studio is a small app that runs entirely on your own computer and takes a video from **idea to finished voice-over script**:

- you give it a video title and a few YouTube links;
- it pulls the transcripts and **every single comment** automatically (no more copy-pasting or CSV exports);
- it researches the topic with live web search and double-checks every product against the current web;
- a **second, independent AI model** fact-checks the research and catches hallucinations;
- **you** approve the final product list — nothing is ever removed without your say-so;
- it writes the script in your channel's exact style and length;
- it checks the result mechanically (word count, risky words, TTS spellings, structure) and fixes spellings in one click;
- it exports a file ready for Word or your text-to-speech software.

Nothing runs in the cloud on your behalf and nothing is ever published anywhere. The app lives in one folder on your machine; the only things it talks to are YouTube/Google News (to fetch material) and the AI services, using your own keys.

---

## Contents

1. [What you need](#1-what-you-need)
2. [Install Node.js](#2-install-nodejs-one-time)
3. [Download the app](#3-download-the-app)
4. [First launch](#4-first-launch)
5. [Enter your API keys](#5-enter-your-api-keys-one-time)
6. [A quick tour of the app](#6-a-quick-tour-of-the-app)
7. [Making a script — full walkthrough](#7-making-a-script--full-walkthrough)
8. [Everyday use](#8-everyday-use)
9. [Costs](#9-costs)
10. [Troubleshooting](#10-troubleshooting)
11. [FAQ](#11-faq)
12. [For developers](#12-for-developers)

---

## 1. What you need

| Thing | Details |
|---|---|
| A Windows 10 or 11 computer | Any spec is fine — the heavy AI work happens on Google's and Anthropic's servers, not your machine. |
| An internet connection | Needed while fetching sources and running the AI steps. |
| **Node.js** (free) | The engine the app runs on. Installation is covered in section 2. |
| **Google Gemini API key** with billing enabled | You already created this. If you ever need to re-create it: https://aistudio.google.com/apikey → **Create API key**. Billing: AI Studio → **API Keys** → your key row → **Activate billing** (in the Billing Tier column) → add a card. Without billing Google gives new accounts almost no usage and the research step fails with a "quota" error. |
| **Anthropic (Claude) API key** with some credit | You already created this. If you ever need another: https://console.anthropic.com → **Settings → Billing** → add credit ($10–15 is plenty to start) → **API Keys → Create Key**. |

> **Keep your keys private.** Anyone who has them can spend your API credit. Don't post them anywhere public; the app stores them only on your computer.

## 2. Install Node.js (one time)

1. Open https://nodejs.org in your browser.
2. Click the big green button that says **LTS** (it will have a version number, e.g. "22.x.x LTS"). A file called something like `node-v22.x.x-x64.msi` downloads.
3. Double-click the downloaded file.
4. In the installer: click **Next** → tick "I accept…" → **Next** → **Next** (don't change the folder) → **Next** (don't change any features) → **Next** (leave the "automatically install tools" box **unticked**) → **Install** → allow the Windows prompt → **Finish**.
5. Done. You never need to open Node.js — the app uses it in the background.

## 3. Download the app

**If you were sent a ZIP file directly:** save it somewhere easy (e.g. Documents), right-click it → **Extract All…** → **Extract**. Skip to section 4.

**If you were sent a GitHub link:**

1. Open the link in your browser.
2. Click the green **Code** button (top right of the file list).
3. Click **Download ZIP** at the bottom of the little menu.
4. When it finishes downloading, right-click the ZIP file → **Extract All…** → choose where to put it (e.g. `Documents`) → **Extract**.
5. You now have a folder containing files like `start.bat`, `README.md`, and folders like `client`, `server`, `prompts`. That folder is the app.

## 4. First launch

1. Open the app folder and find **`start.bat`** (Windows may show it as just "start"; its icon looks like a little gear-window).
2. **Double-click it.**
3. If Windows shows a blue box saying **"Windows protected your PC"** — click **More info**, then **Run anyway**. (This warning only means the app isn't from the Microsoft Store; it's our app.)
4. A **black window** opens. On the very first run it says *"First run - installing the app…"* and works for **2–5 minutes** — it's downloading the app's building blocks. Let it finish.
5. When it's ready, your browser opens the app by itself at **http://localhost:3001**. If the browser doesn't open, open it yourself and type `localhost:3001` in the address bar.

**Important to understand:**

- The **black window is the app's engine**. Keep it open (you can minimise it) the whole time you're using the app.
- To **stop** the app: just close the black window. Nothing is lost — every project saves itself automatically as you go.
- To **start again tomorrow**: double-click `start.bat` again. From now on it starts in a few seconds.

## 5. Enter your API keys (one time)

1. In the app, click **Settings** in the top-right corner.
2. You'll see two boxes: **Google Gemini API key** and **Anthropic (Claude) API key**.
3. Paste each key into its box (the text shows as dots — that's normal).
4. Click **Save keys**.

Your keys are stored in a file inside the app's folder on your computer. They are never sent anywhere except directly to Google and Anthropic when the app works for you.

*(The Settings page also shows the two AI prompts that drive the research and the writing. You don't need to touch these — they're the engine room. If they're ever updated, we'll handle it.)*

## 6. A quick tour of the app

- **Home screen ("Scripts")** — a form to start a new script, and below it, **Previous scripts**: every project you've ever made, clickable to reopen at any stage.
- **The numbered steps bar** (1. Sources → 2. Research → 3. Approve list → 4. Script → 5. Export) — appears at the top when a project is open. It shows where you are, and you can click any step to jump back and forth (e.g. reopen an old project and re-export it).
- **Settings** — your API keys and the AI prompts.

## 7. Making a script — full walkthrough

### Step 1 — Start a new script

On the home screen:

1. **Video title** — type it exactly as you'd write it for YouTube, e.g. `12 Worst Biscuit Brands in UK Supermarkets`. The research uses the title to work out the category, the number of products and the promise of the video — so word it like a real title.
2. **Target word count** — how long the finished script should be (the app aims for this ±200). Default is 4200.
3. Click **Start**.

### Step 2 — Sources

This page collects the raw material — the same things you used to gather by hand.

**YouTube videos** (competitor videos, or your own previous videos on the topic):

1. Find 2–4 relevant videos on YouTube and copy their links.
2. Paste them into the big box (one per line, or separated by spaces).
3. Click **Fetch transcripts & comments**. Each video appears as a card showing how many transcript words and how many comments were pulled. Every comment is collected — hundreds at a time.
4. If a video is **US-based** and you're only using it because there's nothing good for the UK: tick **"US video — inspiration only"** on its card. The research will then treat it as inspiration and will never present American product facts as UK facts.
5. If a card says *"no transcript"* — that video simply has no captions; its comments are still used. Add a different video if you need more transcript material.
6. The **remove** link on a card takes that video out.

**Comment CSV files** (exports from YouTube or Reddit tools):

1. In the "Comment CSV files" card, click the file picker and choose one or more `.csv` files.
2. Each file appears with the number of comments found. Column names (Comment/body/text, Author, Likes/score…) are detected automatically, whatever tool made the export — even a plain text file with one comment per line works.
3. Every comment from these files joins the comment pool and **counts toward the 100% comment analysis**, exactly like YouTube comments.

**Reddit threads:**

1. Open the Reddit thread in your browser.
2. Press **Ctrl+A** (select all), then **Ctrl+C** (copy).
3. Click into the Reddit box in the app, press **Ctrl+V**, then click **Add thread**.

**Latest UK news:**

1. The search box is pre-filled with your title — edit it if you like (e.g. just `UK biscuits`).
2. Click **Search Google News (UK)**. A list of recent articles appears with tick-boxes.
3. Untick anything irrelevant. Ticked articles are handed to the research as leads.

**Anything else** — paste any other text you want the research to consider (an article, notes, a comment dump) and click **Add**.

The bar at the bottom sums up what you've collected. When you're happy, click **Continue to research →**.

> **How much material is enough?** 2–3 videos with comments is a good normal. More material = richer research but a slightly longer research step.

### Step 3 — Research (the AI heavy lifting)

Three buttons, run them **top to bottom**. Each one runs in the background on your computer — you can minimise the browser, or even close the tab and come back: the work carries on and the result will be waiting.

1. **Analyse comments** (~1–3 min) — reads every collected comment in batches. When done you'll see a green line like *"✔ 277 of 277 comments analysed (100% coverage)"* — proof that nothing was skimmed. Click "Comment analysis" to read what the audience is saying.
2. **Run research** (~10–15 min, the longest step) — deep research: the AI studies the topic from scratch with live Google searches, digests the transcripts, the news and the comment analysis, then **verifies every candidate product against the current web one by one** (current ingredients, pack sizes, recent news — with sources). The finished package appears under "Research package"; the header shows how many live web searches were made.
3. **Run fact-check** (~2–3 min) — a completely different AI model (Claude) goes through the research like a sceptical editor: it flags hallucinations, UK/US mix-ups, outdated claims and anything legally risky, and lists the verified strongest facts. This is the safety net that used to be your "paste everything into Claude" step.

Then click **Build final list for approval →** (~1 min).

> If a step fails, a red message appears under the buttons saying exactly why (usually a key or billing issue — see Troubleshooting). Fix the cause and click the same button again.

### Step 4 — Approve the list (your decision point)

You get the proposed **Avoid list** (in countdown order — the top card is the highest number, i.e. the most familiar brands come first) and the **Actually good list**. For each product you see the name and its *angle* — the distinct main point its section will make.

- **Untick** a product to drop it. It stays visible but greyed out — nothing is ever silently deleted, and you can re-tick it any time.
- **↑ ↓** — move a product up or down the order.
- **→ good / → avoid** — move a product to the other list.
- The numbers shown ("Number twelve.", "Number eleven." …) update live as you tick and reorder — that's exactly how the countdown will appear in the script.

When the list looks right, click **Approve list — write the script →**. From this point the list is locked in: the script will contain exactly these products in exactly this order.

### Step 5 — Script

1. Click **Write the script** (~5–12 min). The app writes the full script and, if the first draft comes out shorter or longer than your target, **automatically revises it** until it lands within ±200 words — you'll see the progression (e.g. "3,018 → 3,903 → 4,197") next to the word count.
2. Read the **Automatic checks** panel:
   - **Word count** — green when within target ±200.
   - **Demonetisation words** — any risky word is listed with its position and surrounding text; anything in the **first 60 seconds** is marked loudest. The app flags rather than deletes — you decide (sometimes "blood sugar" is exactly what you meant to say).
   - **TTS spellings** — if any Azda/Liddle/Yoggurt-style spellings are missing, one click on **Apply all TTS spellings** fixes every one.
   - **Years as digits**, the required opening line, *"And, let's get into it."*, the countdown count, the good-list markers, the Hype CTA, the *"…protect your plate."* ending, no "quid" — each with a ✔ or ⚠.
   - **Intro length** is shown for reference (your guideline is ≈333 words).
3. The script sits in an **editable box** — change anything you like, then click **Save edits & re-check** and the checks update instantly.
4. Not happy overall? **Regenerate script** writes a fresh version (the approved list stays fixed).

### Step 6 — Export

Two buttons under the script:

- **Export .docx (Word)** — a clean Word document.
- **Export .txt (TTS)** — plain text ready to paste into your text-to-speech software.

Files land in your browser's normal Downloads folder. You can re-open any old project later and export again — nothing expires.

## 8. Everyday use

- One video = one project. Start each new video from the home screen.
- The long AI steps don't need you watching — start them, go edit a thumbnail, come back.
- You can go back to any step at any time with the numbered bar (e.g. add one more YouTube video, re-run research).
- Old projects stay in **Previous scripts** forever (they live in the app's folder on your disk).
- Updating the app (when we send you a new version): download/extract the new folder the same way, run `start.bat` once — done. Your projects can be carried over; we'll help with that when it's relevant.

## 9. Costs

- There are **no subscriptions**. You pay Google and Anthropic only for what the AI actually processes.
- A typical finished script costs **about $1** of API usage in total (research + fact-check + writing, including automatic length revisions).
- At ~4 scripts a week that's roughly **$16–25 a month**.
- You can watch usage anytime: Google — https://aistudio.google.com → **Usage**; Anthropic — https://console.anthropic.com → **Usage**. We'll also set a spending alert together on our call, so you'd get an email long before anything unusual.

## 10. Troubleshooting

| What you see | What it means | What to do |
|---|---|---|
| Double-clicking `start.bat` says **Node.js is not installed** | Node.js missing | Do section 2, then run `start.bat` again. |
| **"Windows protected your PC"** | Normal Windows caution for non-Store apps | **More info → Run anyway**. |
| Browser says **"can't reach this page"** at localhost:3001 | The engine isn't running | Make sure the black window is open; if it is, wait 10 seconds and refresh. Otherwise run `start.bat`. |
| First run seems stuck in the black window | It's downloading components (2–5 min) | Give it a few minutes; it only does this once. If truly frozen for 10+ min, close the window and run `start.bat` again. |
| A research step fails mentioning **quota / billing / 429** | Google billing not active on your key | Section 1's Gemini row: AI Studio → API Keys → your key → **Activate billing**. Then click the failed button again. |
| A step fails mentioning **API key / authentication / credit** | A key is wrong, or Anthropic credit ran out | Check both keys in Settings (no spaces around them); top up Anthropic credit if needed. |
| A video card says **"no transcript"** | That video has no captions at all | Its comments still count. Add another video for transcript material. |
| A step failed with a red message once | Sometimes a network hiccup | Just click the same button again — the app retries safely. |
| The script has a ⚠ in the checks | Not an error — something for your judgement | Read the line; edit the script in the box or click the offered fix button. |
| Something else / looks broken | — | Close the black window, run `start.bat` again, try once more. Still stuck? Send us a screenshot of the red message — we'll sort it quickly. |

## 11. FAQ

**Do I have to keep the black window open?** Yes, while using the app. Minimise it — just don't close it mid-step. Closing it between sessions is completely fine.

**Can I close the browser tab while research is running?** Yes. The work runs in the engine, not the tab. Reopen the project and the result (or the still-running progress) is there.

**Is anything published or uploaded anywhere?** No. Projects, keys and scripts stay in the app's folder on your computer.

**Can it use American videos?** Yes — tick "US video — inspiration only" on that video's card, and the research borrows the angle without ever mixing US product facts into your UK script.

**What if I want a different script length?** Set the target when creating the project. The app aims for it ±200 words automatically.

**Where exactly are my projects stored?** In the app folder → `server` → `data` → `projects`. Back that folder up if you ever move computers.

**Can I run two projects at once?** You can have any number of projects, but run the heavy AI steps one project at a time for predictable speed.

## 12. For developers

```bash
npm install
npm run dev        # server on :3001 + Vite dev server on :5173 (proxies /api)
npm run build      # build client to client/dist
npm start          # production: serve client + API on :3001
```

- `server/` — Express API: source ingestion (`services/`), AI pipeline (`pipeline/`), local JSON storage in `server/data/` (gitignored — API keys and projects live there)
- `client/` — React (Vite) frontend
- `prompts/` — the two pipeline prompts as plain text, editable from the app's Settings screen; input placeholders are matched loosely (see `pipeline/research.js` / `pipeline/script.js`)
- `reference-scripts/` — the channel's top-performing scripts, used as the style benchmark and as test cases for `server/src/pipeline/checks.js`
- AI stages run as background jobs: `POST /api/pipeline/:id/run/:stage`, then poll `GET /api/projects/:id` and read `project.jobs[stage]`
