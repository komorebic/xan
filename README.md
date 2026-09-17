# Xanthos

A custom-branded chat app that talks to Claude Fable 5.1 through your own
Anthropic API key. No Claude logo, no default UI — you own the whole look.

## Setup

1. Install Node.js 18+ if you don't have it.
2. In this folder, install dependencies:

   ```bash
   npm install
   ```

3. Copy the environment template and add your key:

   ```bash
   cp .env.example .env
   ```

   Then open `.env` and paste in your key from https://console.anthropic.com/settings/keys:

   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```

4. Start the app:

   ```bash
   npm start
   ```

5. Open http://localhost:3000 in your browser.

## Customizing it further

Most of this is now done **in the app itself** — tap the gear icon in the left rail to open Settings:

- **App name** — renames the app throughout the UI (header, browser tab, message labels)
- **Accent color** — five swatches (gold, teal, terracotta, slate blue, moss), applied live
- **Surface** — switch between a light or dark neomorphic surface
- **Model** — pick between Claude Fable 5.1, Opus 5, Sonnet 5, or Haiku 4.5
- **Persona / instructions** — an optional system prompt sent with every message

Settings are saved to your browser's local storage, so they persist between visits on the same device. There's a **Reset to defaults** button in the same panel if you want to start over.

For deeper changes:
- **Colors/fonts beyond the presets**: CSS variables live at the top of `public/style.css` (`:root { ... }` and `[data-theme="dark"] { ... }`). The display font is Fraunces (a warm literary serif) and the body font is Inter — both loaded from Google Fonts in `index.html`.
- **New accent swatches**: add another `<button class="swatch" data-accent="#hex" ...>` inside `#swatches` in `index.html`.
- **Allowed models**: the `ALLOWED_MODELS` set in `server.js` controls which model names the frontend is permitted to request — add or remove strings there.

## Why a backend at all?

Your API key must never be exposed in browser code — anyone could read it
from the page source and rack up charges on your account. This app runs a
small Node/Express server that holds the key privately and forwards your
messages to Anthropic on your behalf. The browser only ever talks to your
own server.

## Deploying it so it's not just on your machine

Any Node hosting works: Render, Railway, Fly.io, a VPS, etc. Set
`ANTHROPIC_API_KEY` as an environment variable in that platform's dashboard
(never commit your `.env` file) and deploy this folder as-is.
