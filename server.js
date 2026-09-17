// server.js
// Minimal backend that keeps your Anthropic API key secret on the server
// and proxies chat requests to it. Serves the custom frontend from /public.

import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || 'claude-fable-5-1';
const PORT = process.env.PORT || 3000;

// Only these models can be selected from the UI — prevents arbitrary
// model strings (and arbitrary spend) being sent from the client.
const ALLOWED_MODELS = new Set([
  'claude-fable-5-1',
  'claude-opus-5',
  'claude-sonnet-5',
  'claude-haiku-4-5-20251001',
]);

if (!ANTHROPIC_API_KEY) {
  console.warn('⚠️  ANTHROPIC_API_KEY is not set. Add it to a .env file before chatting.');
}

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// POST /api/chat
// body: { messages: [...], system?: string, model?: string }
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, system, model } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const selectedModel = ALLOWED_MODELS.has(model) ? model : DEFAULT_MODEL;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: selectedModel,
        max_tokens: 2048,
        system: system || undefined,
        messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic API error:', data);
      return res.status(response.status).json({ error: data.error?.message || 'Upstream API error' });
    }

    const text = data.content
      ?.filter((block) => block.type === 'text')
      .map((block) => block.text)
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
