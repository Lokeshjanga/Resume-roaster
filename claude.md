# Resume Roaster — claude.md

> Hand this file to Claude Code. It should be able to build the entire project from scratch by following these instructions.

---

## Project Summary

Build a full-stack **Resume Roaster** web app where users paste resume text or upload a PDF, and an AI gives a savage, funny roast of their resume with a score out of 10. Think Comedy Central roast, but for CVs.

---

## Folder Structure to Create

```
resume-roaster/
├── backend/
│   ├── index.js
│   ├── .env
│   └── package.json
├── frontend/
│   └── index.html        ← single file, no framework
└── README.md
```

---

## Backend

### Stack
- Node.js + Express
- `multer` — for PDF file upload handling
- `pdf-parse` — extract text from uploaded PDF
- `cors` — allow frontend to call backend
- `dotenv` — load env vars
- Groq SDK (`groq-sdk`) — LLM API calls

### Install dependencies
```bash
cd backend
npm init -y
npm install express cors multer pdf-parse dotenv groq-sdk
```

### .env file
```
GROQ_API_KEY=your_groq_api_key_here
PORT=3001
```
> Tell user to get free API key from https://console.groq.com

### index.js — Full implementation

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const Groq = require('groq-sdk');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(cors());
app.use(express.json());

const ROAST_PROMPT = `You are a savage, brutally funny resume roaster. Think Gordon Ramsay meets HR from hell.

Your job:
1. Read the resume carefully
2. Roast it mercilessly — call out clichés, vague buzzwords, weak projects, formatting sins, anything cringe
3. Be funny, specific, and brutal. Use sarcasm, analogies, and jokes. Reference specific lines from the resume.
4. End with a SCORE out of 10 (most resumes deserve a 3–6, be harsh)

Output format — respond ONLY in this JSON format, nothing else:
{
  "roast": "your full savage roast here (3-5 paragraphs, funny and brutal)",
  "burns": [
    "specific burn #1 about a specific resume line",
    "specific burn #2",
    "specific burn #3",
    "specific burn #4",
    "specific burn #5"
  ],
  "score": 4,
  "verdict": "one-liner savage verdict (like a mic drop)"
}`;

app.post('/roast', async (req, res) => {
  try {
    const { resumeText } = req.body;

    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({ error: 'Resume text too short. Give me something to work with.' });
    }

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: ROAST_PROMPT },
        { role: 'user', content: `Here is the resume to roast:\n\n${resumeText}` }
      ],
      temperature: 0.9,
      max_tokens: 1500,
    });

    const raw = completion.choices[0].message.content;
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const result = JSON.parse(cleaned);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Roasting failed. Even our AI gave up on your resume.' });
  }
});

app.post('/roast-pdf', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF uploaded.' });
    }

    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = pdfData.text;

    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({ error: 'Could not extract text from PDF.' });
    }

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: ROAST_PROMPT },
        { role: 'user', content: `Here is the resume to roast:\n\n${resumeText}` }
      ],
      temperature: 0.9,
      max_tokens: 1500,
    });

    const raw = completion.choices[0].message.content;
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const result = JSON.parse(cleaned);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'PDF roasting failed. Your PDF is as unreadable as your career prospects.' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Resume Roaster backend running on port ${PORT}`));
```

---

## Frontend

### File: `frontend/index.html`

Single HTML file. No framework. No build step. Just open in browser.

**Design direction:**
- Dark theme — deep black background `#0a0a0a`
- Accent color: hot orange/red `#ff4500` (roast = fire)
- Font: `Bebas Neue` for headings (Google Fonts), `DM Mono` for body/results
- Aesthetic: like a comedy roast show poster — dramatic, bold, slightly aggressive
- Flame emoji and fire motifs throughout
- Animations: result cards fade+slide in, score counter animates up, burn list items appear one by one with stagger

**UI Sections:**

1. **Hero Header**
   - Big bold title: `RESUME ROASTER 🔥`
   - Subtitle: `"We read it so your future employer doesn't have to"`

2. **Input Section** — two tabs:
   - Tab 1: `Paste Text` — large textarea for resume text
   - Tab 2: `Upload PDF` — drag & drop zone or file picker
   - Big CTA button: `ROAST ME 🔥` (red, full width, bold)

3. **Loading State**
   - Animated flame spinner
   - Rotating funny loading messages cycling every 2s:
     - "Summoning Gordon Ramsay..."
     - "Detecting buzzwords..."
     - "Calculating career damage..."
     - "Finding every red flag..."
     - "Consulting HR from hell..."

4. **Results Section** (hidden until roast received):
   - **Score Card**: Giant animated score number (e.g. `4/10`) count-up animation over 1.5s, color coded (0-4 red, 5-7 orange, 8-10 green)
   - **Verdict**: Big italic one-liner in quotes, dramatic font, centered
   - **The Roast**: Full roast text in a dark card with subtle red left border
   - **Top Burns** 🔥: Each burn in its own numbered card, stagger in with 150ms delay each
   - **Roast Again** button — resets everything back to input

5. **Footer**: `Built with 🔥 and zero mercy`

**JS behavior:**
- Tab switching (Paste Text / Upload PDF) — show/hide correct input
- On ROAST ME click:
  - Validate input (not empty)
  - Show loader, hide input section
  - Call correct endpoint (`/roast` for text, `/roast-pdf` for PDF)
  - On success: hide loader, show results section, animate score, stagger burns
  - On error: show error toast in red
- Score counter: JS setInterval counting from 0 to final score over 1.5s
- Burns: each burn card added to DOM with `setTimeout(fn, index * 150)`
- ROAST AGAIN: reset all state, show input again
- Backend URL constant at top of script: `const API_URL = 'http://localhost:3001'`

**CSS requirements:**
- All styles in `<style>` tag
- Import Google Fonts: Bebas Neue + DM Mono via `<link>`
- `@keyframes fadeSlideUp` — for cards appearing
- `@keyframes flamePulse` — for loading flame
- Fully mobile responsive using flexbox/grid
- Textarea styled dark with orange focus border
- PDF drop zone: dashed orange border, darkens on dragover
- Buttons: uppercase, letter-spacing, bold, red bg with hover scale effect

---

## Running the Project

```bash
# Terminal 1 — Backend
cd backend
node index.js
# → Running on http://localhost:3001

# Terminal 2 — Frontend
# Just open frontend/index.html in browser directly
# OR:
npx live-server frontend
```

---

## README.md

```markdown
# Resume Roaster 🔥

A savage AI-powered resume roaster. Paste your resume or upload a PDF and get brutally honest (and funny) feedback powered by LLaMA 3.3-70B via Groq.

## Tech Stack
- **Backend:** Node.js, Express, Groq (LLaMA 3.3-70B), pdf-parse, multer
- **Frontend:** Vanilla HTML/CSS/JS (zero dependencies)

## Setup

1. Get a free Groq API key at https://console.groq.com
2. Create `backend/.env` and add: `GROQ_API_KEY=your_key_here`
3. Install deps: `cd backend && npm install`
4. Start backend: `node index.js`
5. Open `frontend/index.html` in your browser

## Features
- Paste resume text or drag & drop a PDF
- Savage AI roast with 5 specific burns
- Animated score out of 10
- One-liner mic-drop verdict
```

---

## Interview Talking Points (memorize these)

**Q: What did you build?**
A: A full-stack AI app where users upload their resume and get a savage comedy-roast style feedback from LLaMA 3.3-70B via Groq. It extracts text from PDFs using pdf-parse, sends it to the LLM with a carefully engineered system prompt, and renders structured JSON output with animations on the frontend.

**Q: How did you get structured output from the LLM?**
A: I engineered the system prompt to instruct the model to respond ONLY in a specific JSON schema — roast text, array of burns, integer score, and verdict. Then I strip any markdown fences and parse with JSON.parse. In production I'd add schema validation with Zod.

**Q: What was the hardest part?**
A: Prompt engineering. Getting the model to be consistently funny AND specific — actually referencing lines from the resume — without going generic took several iterations. Temperature 0.9 hit the sweet spot between creative and coherent.

**Q: How would you scale this?**
A: Rate limiting per IP with express-rate-limit, a job queue (BullMQ + Redis) for PDF processing, storing results in Supabase so users can share their roast via a unique link, and a leaderboard of the worst-scoring resumes.

**Q: Why Groq over OpenAI?**
A: Free tier with no credit card, significantly lower latency due to custom LPU hardware, and the API is OpenAI-compatible — switching providers is literally one line change.
