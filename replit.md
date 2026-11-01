# Prompt Foundry

A comprehensive AI-powered prompt generation platform with 68 categories, community sharing, comparison mode, and a usage dashboard.

## Run & Operate
- `npm run dev` — starts Express + Vite on port 5000
- `npm run db:push` — push schema changes to PostgreSQL (never write raw SQL migrations)
- `npm run build` — production build
- `npm run check` — TypeScript check
- `npm test` — regression tests (mocked persistence; no live database writes)

**Required env vars:** `DATABASE_URL`, `SESSION_SECRET`, `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY`

## Stack
- **Frontend:** React + TypeScript, Wouter, TanStack Query, React Hook Form + Zod, shadcn/ui + Tailwind CSS
- **Backend:** Express.js + TypeScript, Node.js ESM, tsx (dev) / esbuild (prod)
- **Database:** PostgreSQL via @neondatabase/serverless + Drizzle ORM
- **AI:** OpenAI GPT-4o via Replit AI Integrations

## Where things live
- `shared/schema.ts` — all 68 categories, Zod schemas, DB table definitions, `CATEGORY_DOMAINS`, `DOMAIN_LABELS`, `CATEGORY_METADATA`
- `server/routes.ts` — all API routes
- `server/storage.ts` — all DB CRUD operations
- `server/openai.ts` — prompt generation logic (category-specific system prompts)
- `client/src/pages/` — all page components
- `client/src/components/` — reusable components (ResultPanel, DynamicForm, Header, etc.)
- `client/src/lib/starterTemplates.ts` — pre-filled starter inputs for popular categories

## Architecture decisions
- Generator endpoint always saves to history and returns `historyId` so frontend can rate it without re-fetching
- All shared links are automatically public and show in Community Gallery (`/api/community` — no auth needed)
- Domain filtering (`CATEGORY_DOMAINS`) lives in schema.ts so it's shared with both FE and BE
- Rating stored as nullable integer: `1` = thumbs up, `-1` = thumbs down, `null` = unrated
- Compare page (`/compare`) fires all 3 generator types with `Promise.allSettled` and shows results side by side

## Product
- **68 generator categories** across 6 domains: Core Creative, Startup, Food & Hospitality, Real Estate, Finance, Specialized
- **3 generator types** per category: Prompt Generator, Agent Helper, General Generator
- **Playground** with AI Assist, Starter Templates, JSON import/export, presets, and "Compare All 3" shortcut
- **Compare mode** — fill inputs once, get all 3 types side by side
- **Community Gallery** — public listing of all shared prompts
- **Usage Dashboard** — total generations, this week, favorites, thumbs up, top categories, recent activity
- **History** with re-run, favorite, copy, and thumbs up/down rating
- **Prompt Chaining** — "Chain to another generator" button on results navigates with output as context
- **API Keys** — create, toggle, delete keys for programmatic access
- **Replit Auth** (OpenID Connect) — all personal features gated behind auth

## User preferences
- Simple, everyday language in all responses.

## Gotchas
- Share route is `POST /api/share` (singular) — not `/api/shares`
- API key routes use `/api/keys`; the list response is `{ keys: [...] }` and never exposes key hashes.
- Generator response includes `historyId` — used by ResultPanel for rating
- `DynamicForm` accepts `submitLabel` prop to override the default "Generate Prompt" label
- `npm run db:push` (not `--force`) for schema changes; only use `--force` if you accept data loss

## Database availability
- For a database reporting "The endpoint has been disabled", check the Database pane's Settings for "Unpause database". Schema pushes and code changes do not re-enable a disabled endpoint.
- Do not replace the database, change its credentials, or return unsaved generations as successful results to work around an outage.
- `/api/health` checks the database and returns HTTP 503 when unavailable; the UI shows an outage notice.

## Pointers
- Schema: `shared/schema.ts` (1900+ lines)
- Integrations skill: `.local/skills/integrations/SKILL.md`
- Deployment skill: `.local/skills/deployment/SKILL.md`
