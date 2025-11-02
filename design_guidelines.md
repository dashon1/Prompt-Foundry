# Design Guidelines: Prompt Foundry

## Design Approach

**Selected Approach: Modern Developer Platform (Linear + Stripe + Vercel Fusion)**

Drawing inspiration from Linear's precision, Stripe's documentation clarity, and Vercel's modern aesthetic, this design creates a powerful yet approachable developer tool. The dark interface emphasizes focus and reduces eye strain during extended sessions while cyan and green accents provide clear visual hierarchy and feedback.

**Design Principles:**
- Developer-first clarity: Every element serves a functional purpose
- Information density with breathing room: Pack capability without overwhelming
- Technical precision meets modern polish
- Fast, confident interactions

---

## Core Design Elements

### A. Typography

**Font Family:** Inter (via Google Fonts CDN)
- Headings: Inter 600-700 (Semibold to Bold)
- Body: Inter 400-500 (Regular to Medium)
- Code/Technical: `font-mono` (system monospace stack)

**Type Scale:**
- Hero Headline: text-5xl md:text-6xl, font-bold
- Section Headers: text-3xl md:text-4xl, font-semibold
- Card/Component Titles: text-xl md:text-2xl, font-semibold
- Subheadings: text-lg font-medium
- Body Text: text-base
- Small/Meta Text: text-sm
- Code Snippets: text-sm font-mono

**Line Height:**
- Headlines: leading-tight (1.25)
- Body: leading-relaxed (1.625)
- Code: leading-normal (1.5)

### B. Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24
- Micro spacing (between related elements): 2, 4
- Component internal padding: 6, 8
- Component spacing: 12, 16
- Section padding: 20, 24
- Major section gaps: 32

**Container Strategy:**
- Full-width sections: w-full with inner max-w-7xl mx-auto
- Content sections: max-w-6xl mx-auto
- Form containers: max-w-4xl mx-auto
- Documentation: max-w-5xl mx-auto
- Cards grid: max-w-7xl with responsive columns

**Grid System:**
- Catalog Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Feature Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8
- Two-column layouts: grid-cols-1 lg:grid-cols-2 gap-12

### C. Component Library

**Navigation:**
- Sticky header with backdrop-blur-md effect
- Logo left, navigation center/right
- Height: h-16 with px-6 horizontal padding
- Subtle border-b with low opacity
- Active state: underline with primary accent
- Mobile: Hamburger menu transforming to full-screen overlay

**Hero Section:**
- Height: min-h-[600px] md:min-h-[700px] (not forced 100vh)
- Two-column layout: 60/40 split (text/visual)
- Large hero image showing the playground interface in action (screenshot or abstract visualization of prompt generation flow)
- Text column: Hero headline, tagline, dual CTAs (primary + secondary), tech logo strip
- Visual column: Gradient-mesh background with floating UI elements or product screenshot
- Background: Subtle grid pattern with radial gradient fade

**Form Renderer (Playground):**
- Two-panel layout: Form inputs (left 40%) | Results preview (right 60%)
- Input groups with clear labels (text-sm font-medium, mb-2)
- Text inputs: h-10 with rounded-lg border
- Select dropdowns: Styled with chevron icons
- Array inputs (tags): Pill-style tags with remove buttons
- Number inputs: Stepper controls integrated
- Submit button: Full-width primary CTA at bottom
- Validation: Inline error messages in red-400, shake animation on error

**Cards (Generators Catalog):**
- Rounded-xl border with subtle hover lift (hover:scale-[1.02])
- Padding: p-6
- Icon at top (h-12 w-12 in accent color)
- Title: text-xl font-semibold
- Description: text-sm text-gray-400, 2-3 lines
- Tag pills: Small rounded-full badges for category/type
- "Try it" button at bottom
- Background: Slight gradient from transparent to subtle accent

**Result Panel:**
- Sticky panel that scrolls independently
- Header with action buttons (Copy, Download JSON, Export MD, Save Preset)
- Content area with syntax highlighting for code blocks
- Success state: Green border-l-4 accent
- Loading state: Skeleton animation
- Empty state: Centered icon + message

**API Documentation:**
- Three-column layout at large screens
- Left sidebar: Table of contents (sticky)
- Center: Documentation content with code examples
- Right sidebar: Endpoint explorer (interactive)
- Code blocks: Dark background with line numbers
- Endpoint cards: Method badge (POST/GET) + URL + description

**Footer:**
- Three-column grid on desktop, stacked on mobile
- Column titles: text-sm font-semibold uppercase tracking-wider
- Links: text-sm text-gray-400 hover:text-gray-200
- Bottom bar with copyright and social links
- Minimal padding: py-12 on desktop, py-8 on mobile

**Buttons:**
- Primary: bg-primary with white text, h-11, px-6, rounded-lg, font-medium
- Secondary: border border-gray-700 with white text, same dimensions
- Ghost: No background, hover:bg-gray-800/50
- Icon buttons: Square aspect (h-10 w-10), centered icon
- States: hover:opacity-90 transition-all duration-200

**Inputs & Forms:**
- Height: h-10 for single-line, h-24 for textareas
- Border: border-gray-700 focus:border-primary
- Background: bg-gray-900/50
- Rounded: rounded-lg
- Focus ring: ring-2 ring-primary/50
- Placeholder: text-gray-500

**Tabs:**
- Horizontal tabs with underline indicator
- Tab height: h-12
- Active: border-b-2 border-primary, text-white
- Inactive: text-gray-400 hover:text-gray-200
- Smooth indicator transition

### D. Animations

**Minimal, Purposeful Motion:**
- Hover scale on cards: transform scale-[1.02] duration-200
- Button hover: opacity-90 duration-150
- Page transitions: Fade in content (opacity 0 to 100, duration-300)
- Loading states: Subtle pulse animation
- Form validation: Shake animation on error (duration-300)
- Avoid: Complex scroll animations, parallax, unnecessary motion

---

## Page-Specific Layouts

**Home Page:**
1. Hero (min-h-[700px]): Headline + dual CTAs + hero image (playground screenshot)
2. Tech Logos Strip (py-12): 4-6 logos in grayscale, centered
3. Features Grid (py-24): 3 columns, icon + title + description per card
4. Category Showcase (py-20): Scrollable horizontal card carousel showing generator categories
5. How It Works (py-24): 3-step process with numbers, icons, descriptions
6. CTA Banner (py-16): Centered headline + primary button
7. Footer (py-12)

**Generators Catalog Page:**
1. Page Header (py-12): Title + description + search bar
2. Filters Sidebar (sticky): Category checkboxes, generator type filters, sort dropdown
3. Catalog Grid: 3-column responsive grid of generator cards
4. Each card shows: icon, name, category badge, description snippet, "Try it" CTA
5. Pagination: Centered page numbers at bottom

**Playground Page:**
1. Top Bar (h-16): Breadcrumb navigation + mode tabs (Prompt/Agent/General)
2. Two-column split (min-h-[calc(100vh-4rem)]):
   - Left (40%): Form renderer with schema-driven inputs, submit button
   - Right (60%): Results panel with syntax highlighting, action buttons
3. Both panels scroll independently
4. Responsive: Stack vertically on mobile

**API Documentation Page:**
1. Three-column layout:
   - Left sidebar (w-64): Sticky navigation tree
   - Center (flex-1): Markdown content, code examples, endpoint specs
   - Right sidebar (w-72): Interactive endpoint tester
2. Code blocks with copy button in top-right
3. Endpoint cards with method badges (GET/POST)
4. TypeScript type definitions in collapsible sections

---

## Images

**Hero Section:**
- Large hero image (right 60% of hero section): Screenshot of the Playground interface showing a sample prompt being generated with results displayed
- Style: High-quality UI screenshot with subtle glow/shadow, slight perspective tilt
- Alternative: Abstract gradient mesh visualization representing AI prompt flow

**Feature Cards:**
- Icon-based (no photos): Use Heroicons for feature illustrations

**Catalog Cards:**
- Category icons: Custom icon for each of 17 categories (image: camera, video: film reel, etc.)

**No other photography needed** - this is a technical tool focused on functionality over lifestyle imagery.

---

## Accessibility & Interaction

- All interactive elements meet 44x44px minimum touch target
- Focus states: ring-2 ring-primary/50 on all focusable elements
- Form labels always visible (no placeholder-only inputs)
- Error messages: Clear, actionable, red-400 with icon
- Success feedback: Green-400 with checkmark icon
- Loading states: Skeleton screens, not spinners
- Keyboard navigation: Full support with visible focus indicators
- Color contrast: WCAG AA minimum on all text

---

This design creates a professional, efficient developer tool that balances technical precision with modern polish. The dark theme reduces fatigue, the cyan/green accents provide clear hierarchy, and the layout prioritizes productivity over decoration.