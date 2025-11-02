# Prompt Foundry

## Overview

Prompt Foundry is a comprehensive prompt generation platform that creates AI prompts across 17+ categories including images, video, YouTube, apps, marketing, design, production, analysis, development, and more. The application provides a playground for designing prompts, an API for programmatic access, and Zod-validated schemas ensuring type-safe inputs and outputs.

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
- Generators: Catalog of all 17+ generator categories
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

**Current Implementation:** In-memory storage (MemStorage class)
- Generator history stored in Map data structure
- No persistent database configured yet
- Schema defined in `shared/schema.ts` using Zod

**Database Configuration (Prepared for PostgreSQL):**
- Drizzle ORM configured with PostgreSQL dialect
- Connection via @neondatabase/serverless
- Migration directory: `./migrations`
- Schema location: `./shared/schema.ts`
- Database provisioned via DATABASE_URL environment variable

**Session Management:**
- connect-pg-simple configured for PostgreSQL session store (not yet active)

### Schema & Validation System

**Zod Schemas:** Core validation layer in `shared/schema.ts`
- 17 categories defined as const array
- 3 generator types: prompt_generator, agent_helper, general_generator
- Each category/type combination has dedicated input schema
- Schemas include defaults, nested objects, and array validations

**Example Categories:**
- Image: Camera settings, lighting, mood, composition
- Video: Duration, lens, motion, audio specifications
- Marketing: Audience, goals, engagement metrics
- Technical: Precise technical specifications

**Schema Features:**
- Type-safe inputs with TypeScript inference
- Default values for optional fields (IMAGE_DEFAULTS, VIDEO_DEFAULTS)
- Preset constants (PHOTOREALISM_ADDON for realistic image generation)
- Category metadata with icons, names, descriptions

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