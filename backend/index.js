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
