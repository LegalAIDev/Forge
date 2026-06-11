# Contributing to Forge

Thanks for jumping in. Forge is a local-first fund formation engine: a
frontier model for reasoning, a local model on your own machine for anything
confidential. Three principles are load-bearing; keep them intact:

1. **Nothing confidential leaves the machine unmasked.** Every frontier call
   goes through `src/ai/gateway.ts` and `src/ai/claude.ts`. Don't call the
   Anthropic SDK directly from a feature; route it through `callStructured`.
2. **Every AI assertion is quoted and verified.** Outputs carry citations
   that are checked verbatim against the source (`src/engine/citations.ts`).
   If you add a generative feature, give it a citation schema and let the
   verifier mark it.
3. **Matters are walled off.** Each matter is its own SQLite file
   (`src/workspaces/`); the active one is the process-wide `getDb()`. A
   query can't span two matters by construction, so don't add one that
   reaches across files. Long async work (uploads, the drafting pipeline,
   anything that awaits the frontier) must be bracketed with `withDbOp(...)`
   so a workspace switch mid-operation is refused cleanly instead of closing
   the handle out from under it.

See the **Layout** section of the README for where each module lives.

## Getting started

Prerequisites: Node 20+, an `ANTHROPIC_API_KEY`, and (optional but
recommended) [Ollama](https://ollama.com) for on-device masking and search.

```bash
# 1. install, build the UI, seed the demo corpus
npm install && npm run setup

# 2. configure
cp .env.example .env          # add your ANTHROPIC_API_KEY

# 3. run
npm run dev                   # API + UI at http://localhost:3000

# optional: the on-device model (privacy gateway + embeddings)
ollama pull gemma2:2b && ollama pull nomic-embed-text
```

For hot-reloading UI work: `cd web && npm run dev`, then
http://localhost:5173 (it proxies `/api` to the server on :3000).

Forge degrades gracefully without Ollama. A badge shows "Degraded" and it
falls back to regex-only masking and keyword-only search, so you can develop
without it. Test the masking path with Ollama running before shipping
privacy-related changes.

## Before you open a PR

```bash
npm test            # unit tests, no network
npm run typecheck   # tsc on the API (the web UI is typechecked by its build)
npm run smoke       # end-to-end through every stage (needs ANTHROPIC_API_KEY;
                    # SMOKE_SKIP_DRAFTING=1 to skip the slow drafting stage)
npm run eval        # recall eval: blind re-extraction + unseen labeled docs +
                    # Q&A retrieval, scored against hand labels. Every metric
                    # on the scoreboard is gated; the run exits non-zero if
                    # any falls below its bar. (SKIP_QA=1 for extraction only)
```

If you touch extraction, retrieval, or prompts, run `npm run eval` before
and after. Recall (missed duties) is the failure mode that matters most
here, and it is invisible to the citation verifier.

- Keep the seed corpus (`seed/`) fictional. It's the public demo data.
- Match the surrounding style; there is no formatter config to fight.
- Changes to the privacy gateway or citation verifier should come with a
  test, and ideally a second reviewer. A silent regression there is the one
  failure mode that actually matters.

## Not legal advice

Forge is drafting and tracking support, not legal advice. Keep that framing
in any user-facing copy you add.
