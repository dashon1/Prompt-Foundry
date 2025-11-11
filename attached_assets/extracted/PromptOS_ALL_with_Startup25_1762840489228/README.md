# PromptOS – Updated Bundle (Appended 25 Startup Modules)

This package includes:
- /bundle/json: All prompt specs (base + 25 startup modules)
- /schemas: TypeScript interfaces + Zod validators
- /edge/generate-prompt.ts: Supabase Edge Function starter
- /web: Minimal Next.js App Router UI

## Run UI
cd web && npm install && npm run dev

## Deploy Edge Function
Create `generate-prompt`, paste file, deploy, POST { category, inputs }