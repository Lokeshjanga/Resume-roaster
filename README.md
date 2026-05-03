# Resume Roaster 🔥

A savage AI-powered resume roaster. Paste your resume or upload a PDF and get brutally honest (and funny) feedback powered by LLaMA 3.3-70B via Groq.

## Tech Stack
- **Backend:** Node.js, Express, Groq (LLaMA 3.3-70B), pdf-parse, multer
- **Frontend:** Vanilla HTML/CSS/JS (zero dependencies)

## Setup

1. Get a free Groq API key at https://console.groq.com
2. Open `backend/.env` and replace `your_groq_api_key_here` with your key
3. Install deps: `cd backend && npm install`
4. Start backend: `node index.js`
5. Open `frontend/index.html` in your browser

## Features
- Paste resume text or drag & drop a PDF
- Savage AI roast with 5 specific burns
- Animated score out of 10
- One-liner mic-drop verdict
