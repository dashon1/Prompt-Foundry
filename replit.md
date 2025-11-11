# Prompt Foundry

## Overview

Prompt Foundry is a comprehensive prompt generation platform that creates AI prompts across 68 categories spanning diverse domains: startups, food & hospitality, real estate & investment, finance & business, images, video, YouTube, apps, marketing, design, production, analysis, development, science, HR, and many specialized areas. The application provides a playground for designing prompts, an API for programmatic access, and Zod-validated schemas ensuring type-safe inputs and outputs.

The platform uses OpenAI's API (via Replit's AI Integrations service) to generate high-quality, detailed prompts based on user specifications. Each generator type follows industry best practices and returns structured JSON outputs that match defined schemas.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework:** React with TypeScript
- **Routing:** Wouter (lightweight client-side router)
- **State Management:** TanStack Query (React Query) for server state
- **Form Handling:** React Hook Form with Zod validation via @hookform/resolvers
- **UI Components:** Radix UI primitives with shadcn/ui component library
- **Styling:** Tailwind CSS with custom design system (New York style)

**Design System:**
- Typography: Inter font family (via Google Fonts)
- Dark mode support with CSS custom properties
- Modern developer platform aesthetic inspired by Linear, Stripe, and Vercel
- Component variants using class-variance-authority (CVA)
- Elevation system with hover and active states

**Key Pages:**
- Home: Landing page with features and CTAs
- Generators: Catalog of all 68 generator categories
- Playground: Interactive form-based generator interface
- API: Documentation for RESTful endpoints

### Backend Architecture

**Framework:** Express.js with TypeScript
- **Runtime:** Node.js with ESM modules
- **Build Tool:** Vite for frontend, esbuild for server bundling
- **Development:** tsx for TypeScript execution in development

**Request Flow:**
1. Client submits form data via POST to `/api/generator/:category/:genType`
2. Route validates category and genType against allowed values
3. Schema validates request body using Zod
4. OpenAI service generates prompt using GPT model
5. Response returned as structured JSON
6. Optional: History saved to in-memory storage

**Error Handling:**
- Input validation errors return 422 with detailed error messages
- Unknown categories/types return 404 with helpful error messages
- Rate limiting and retry logic built into OpenAI service using p-retry and p-limit

### Data Storage Solutions

**Current Implementation:** PostgreSQL database with Drizzle ORM
- **Active Database:** PostgreSQL via @neondatabase/serverless
- **ORM:** Drizzle with full type safety
- **Schema Location:** `shared/schema.ts`
- **Storage Layer:** `server/storage.ts` with comprehensive CRUD operations

**Database Tables:**
1. **users** - Replit Auth compatible user accounts (varchar UUID primary key)
2. **sessions** - PostgreSQL session store for authentication
3. **presets** - User-saved generator configurations
4. **generation_history** - All generated prompts with optional user association
5. **shared_links** - Shareable prompt configurations with view tracking
6. **api_keys** - User API keys for external integrations with rate limiting

**Storage Operations:**
- User management: `getUser()`, `upsertUser()`
- Presets: `createPreset()`, `getUserPresets()`, `updatePreset()`, `deletePreset()`, `togglePresetFavorite()`
- History: `saveGenerationHistory()`, `getUserHistory()`, `toggleHistoryFavorite()`, `deleteHistory()`
- Shared Links: `createSharedLink()`, `getSharedLinkByShareId()`, `getUserSharedLinks()`, `deleteSharedLink()`
- API Keys: `createApiKey()`, `verifyApiKey()`, `getUserApiKeys()`, `deleteApiKey()`, `toggleApiKeyStatus()`

**Authentication:**
- Replit Auth via OpenID Connect (openid-client)
- Session management with connect-pg-simple
- Auth routes: `/api/login`, `/api/logout`, `/api/callback`
- Protected routes use `isAuthenticated` middleware
- User profile endpoint: `/api/auth/user`

### Schema & Validation System

**Zod Schemas:** Core validation layer in `shared/schema.ts`
- 68 categories defined as const array across 8 major domains
- 3 generator types: prompt_generator, agent_helper, general_generator
- Each category/type combination has dedicated input schema (201 total schemas)
- Schemas include defaults, nested objects, and array validations

**Category Domains:**
1. **Core Creative** (17 categories): Image, Video, YouTube, Apps, Marketing, Visual Design, AV Production, Business Analysis, Development, Personal Helper, Strategy, Data & Decision, Hyper Personalization, Automation, Content Creation, Science R&D, HR Operations
2. **Startup & Entrepreneurship** (24 categories): Idea Refinement, Lean Canvas, Name Generator, Competitor Mapping, Customer Acquisition, MVP Prioritization, Brand Voice, Launch Checklist, Pitch Creation, Content Calendar, Offer Stack, Product Roadmap, Customer Avatar, Brand Story, Site Wireframe, Productivity System, Email Sequence, Pitch Deck, Partnership Pipeline, Objection Handling, Stress Management, Skills Development, Feedback Loop, Networking System, Customer Journey
3. **Food & Hospitality** (5 categories): Baking Formula, Food Business Concept, Event Food Planning, Food Social Content, General Culinary
4. **Real Estate & Investment** (5 categories): Market Research, Acquisition System, Inspection Notes, Investor Tools, General Real Estate
5. **Finance & Business** (5 categories): Business Credit, Credit Management, Day Trading, Trust & Estate Planning, Business Entity Guide
6. **Specialized Tools** (11 categories): MCP Product Builder, Ethical Data Extraction, SEO Frameworks, eLearning Builder, Meditation Scripts, Viral Content, Long COVID Resources, Music Creation, Service Business Sites, Website Building, Photorealistic Images

**Schema Features:**
- Type-safe inputs with TypeScript inference
- Default values for optional fields (IMAGE_DEFAULTS, VIDEO_DEFAULTS)
- Preset constants (PHOTOREALISM_ADDON for realistic image generation)
- Category metadata with icons, names, descriptions for all 68 generators

### External Dependencies

**AI Services:**
- OpenAI API via Replit AI Integrations
- Base URL: `process.env.AI_INTEGRATIONS_OPENAI_BASE_URL`
- API Key: `process.env.AI_INTEGRATIONS_OPENAI_API_KEY`
- No personal OpenAI API key required
- Rate limiting handled with p-limit concurrency control
- Retry logic for transient failures using p-retry

**UI Component Library:**
- Radix UI: Headless accessible components (@radix-ui/react-*)
- shadcn/ui: Pre-styled component implementations
- Lucide React: Icon library
- cmdk: Command menu component

**Utilities:**
- date-fns: Date manipulation
- clsx + tailwind-merge: Conditional className handling
- nanoid: ID generation
- embla-carousel-react: Carousel functionality

**Development Tools:**
- @replit/vite-plugin-runtime-error-modal: Error overlay
- @replit/vite-plugin-cartographer: Code navigation (dev only)
- @replit/vite-plugin-dev-banner: Development banner (dev only)

**Database (Configured but not required):**
- Drizzle ORM with drizzle-zod for schema validation
- @neondatabase/serverless for PostgreSQL connection
- drizzle-kit for migrations

**Build & Bundling:**
- Vite: Frontend bundling and dev server
- esbuild: Server-side bundling for production
- PostCSS with Tailwind CSS and Autoprefixer