// server.js
// Minimal backend that keeps your Gemini API key secret on the server
// and proxies chat requests to Google's free Gemini API. Serves the
// custom frontend from /public.

import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const PORT = process.env.PORT || 3000;

// Only these models can be selected from the UI.
const ALLOWED_MODELS = new Set([
  'gemini-2.5-flash',
  'gemini-2.0-flash',
]);

if (!GEMINI_API_KEY) {
  console.warn('⚠️  GEMINI_API_KEY is not set. Add it to a .env file before chatting.');
}

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// POST /api/chat
// body: { messages: [{ role: "user"|"assistant", content: string }], system?: string, model?: string }
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, system, model } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const selectedModel = ALLOWED_MODELS.has(model) ? model : DEFAULT_MODEL;

    // Convert our simple {role, content} shape into Gemini's
    // {role: "user"|"model", parts: [{text}]} shape.
    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const body = { contents };
    if (system) {
      body.system_instruction = { parts: [{ text: system }] };
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API error:', data);
      return res.status(response.status).json({ error: data.error?.message || 'Upstream API error' });
    }

    const text = data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text)
      .filter(Boolean)
      .join('\n') || '';

    res.json({ text, raw: data });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Something went wrong talking to the model.' });
  }
});

app.listen(PORT, () => {
  console.log(`✨ App running at http://localhost:${PORT}`);
});
