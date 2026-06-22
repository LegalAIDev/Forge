# Deploying the Forge web UI to Netlify

Netlify hosts Forge's **frontend** (`web/`) as a static site. It cannot host
the **backend** — the Fastify server depends on a persistent local SQLite file,
a local Ollama model (the privacy gateway + embeddings), Server-Sent Events, and
native OCR/canvas modules, none of which fit Netlify's serverless model. Run the
backend on a normal server/VM/container and point the static frontend at it.

```
┌────────────────────┐        /api/*         ┌──────────────────────────┐
│  Netlify (static)  │ ───────────────────▶  │  Forge backend (VM)      │
│  web/dist          │                       │  Fastify + SQLite + LLM  │
└────────────────────┘                       └──────────────────────────┘
```

## 1. Connect the repo

In the Netlify UI: **Add new site → Import from Git**, pick this repo, and the
branch you want to deploy. `netlify.toml` already sets the build:

| Setting       | Value                       |
| ------------- | --------------------------- |
| Base directory | `web`                      |
| Build command | `npm install && npm run build` |
| Publish directory | `dist` (resolved as `web/dist`) |
| Node version  | `22` (via `NODE_VERSION`)   |

The SPA fallback redirect (`/* → /index.html`) is already configured, so
client-side navigation works on refresh/deep links.

## 2. Point the frontend at your backend

The frontend defaults to calling same-origin `/api/*`. Pick one wiring:

**Option A — same-origin proxy (recommended, no CORS).** In `netlify.toml`,
uncomment the `/api/*` redirect and set `YOUR-BACKEND-HOST` to your backend's
host. Netlify forwards `/api/*` to the backend, so the browser only ever talks
to the Netlify origin. The `/api/*` block must stay **above** the SPA fallback.

**Option B — cross-origin.** Leave the redirect commented and set the build env
var `VITE_API_BASE_URL=https://your-backend-host` in **Site settings → Environment
variables**. The frontend then calls the backend directly, so the backend must
allow the Netlify origin in its CORS config (`src/server.ts` currently only
allows localhost — add your Netlify URL there).

## 3. Stand up the backend (separately)

Any host that gives you a persistent disk and long-lived process works
(Fly.io, Render, Railway, a plain VM). It must:

- persist `FORGE_DB_PATH` on a real volume (SQLite WAL file),
- set `ANTHROPIC_API_KEY`,
- set `FORGE_HOST=0.0.0.0` **only behind a reverse proxy/auth** — Forge ships
  with **no authentication**, so anyone who can reach it has full access,
- update CORS in `src/server.ts` to include the Netlify origin (Option B), or
  sit behind the Netlify proxy (Option A).

### Privacy gateway / embeddings (Ollama → cloud)

Forge's local "privacy gateway" and embeddings run on Ollama at `localhost:11434`.
In a hosted deployment you decided to **replace Ollama with a cloud provider**.
This is a **backend** change (not part of the Netlify frontend) and is still
**outstanding** — it needs implementing once the backend host and provider are
chosen. It touches `src/ai/ollama.js`, `src/search/embeddings.ts`, and
`src/search/hybrid.ts`. Until then, search degrades gracefully to keyword/BM25
when no embedding model is reachable.

> Note: moving the privacy gateway to a third-party API changes Forge's privacy
> posture (masked content would leave the local environment). Confirm the
> provider before wiring it in. Anthropic recommends Voyage AI for embeddings.

## 4. Deploy

Push to the connected branch (or **Trigger deploy** in the UI). Netlify builds
`web/` and publishes `web/dist`. Verify by loading the site; the UI loads even
before the backend is connected (API calls will 404/502 until step 2 + 3 land).
