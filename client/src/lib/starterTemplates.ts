import type { Category } from "@shared/schema";

export interface StarterTemplate {
  name: string;
  inputs: Record<string, any>;
}

export const STARTER_TEMPLATES: Partial<Record<Category, StarterTemplate[]>> = {
  image: [
    { name: "Product Photography", inputs: { subject: "Wireless noise-cancelling headphones", setting: "Clean white studio with subtle gradient shadow", mood: "Premium, minimal, high-end", style_tags: ["product photography", "commercial", "minimalist", "studio lit"] } },
    { name: "Cinematic Portrait", inputs: { subject: "Young professional woman, confident expression", setting: "Modern glass office building exterior, golden hour", mood: "Ambitious, warm, cinematic", style_tags: ["portrait", "cinematic", "golden hour", "85mm"] } },
    { name: "Fantasy Landscape", inputs: { subject: "Ancient floating island with waterfalls", setting: "Above the clouds at sunrise, dramatic sky", mood: "Epic, mystical, awe-inspiring", style_tags: ["fantasy", "landscape", "concept art", "dramatic lighting"] } },
  ],
  video: [
    { name: "Brand Reveal", inputs: { concept: "Sleek product reveal for a new AI startup", duration_seconds: 30, visual_style: "Minimalist tech aesthetic, dark theme with blue accent glows", key_message: "The future of productivity, simplified" } },
    { name: "Documentary Opening", inputs: { concept: "Opening sequence for a documentary about ocean conservation", duration_seconds: 60, visual_style: "Raw, handheld footage mixed with aerial drone shots", key_message: "Our oceans are disappearing — this is their story" } },
  ],
  marketing_content: [
    { name: "SaaS Launch", inputs: { product_name: "TaskFlow AI", target_audience: "Busy professionals and small business owners", key_benefit: "Automates repetitive project management tasks, saving 3 hours per week", tone: "Professional yet approachable, benefit-focused" } },
    { name: "E-commerce Sale", inputs: { product_name: "Summer Collection Drop", target_audience: "Fashion-forward millennials aged 25-35", key_benefit: "Exclusive limited-edition pieces at 40% off for 48 hours only", tone: "Urgent, exciting, FOMO-inducing" } },
  ],
  dev_tasks: [
    { name: "REST API Design", inputs: { task: "Design a REST API for a social media platform", tech_stack: "Node.js, Express, PostgreSQL, TypeScript", requirements: "User auth, posts, comments, likes, followers, feed pagination" } },
    { name: "React Component", inputs: { task: "Build a reusable data table component with sorting and filtering", tech_stack: "React, TypeScript, Tailwind CSS, TanStack Table", requirements: "Column sorting, search filter, pagination, row selection, export to CSV" } },
  ],
  startup_pitch: [
    { name: "Series A Pitch", inputs: { startup_name: "EcoTrack", problem: "Businesses have no easy way to measure or reduce their carbon footprint", solution: "Real-time carbon tracking dashboard integrated with existing business tools", target_market: "Mid-size companies with ESG reporting requirements", traction: "$50K MRR, 120 paying customers, 40% MoM growth" } },
  ],
  startup_idea_refinement: [
    { name: "AI Productivity Tool", inputs: { idea: "An AI assistant that automatically categorizes and prioritizes your email inbox based on your work context and deadlines", target_user: "Knowledge workers and executives who receive 100+ emails daily", pain_point: "Email overload wastes 2+ hours per day for most professionals" } },
    { name: "Marketplace App", inputs: { idea: "A peer-to-peer marketplace for renting professional equipment like cameras, drones, and audio gear", target_user: "Freelance creators and small production companies", pain_point: "Professional equipment is expensive to buy but only used occasionally" } },
  ],
  day_trading: [
    { name: "Momentum Strategy", inputs: { strategy: "Momentum trading on tech stocks during earnings season", market: "NASDAQ tech stocks (NVDA, TSLA, AAPL)", risk_tolerance: "Moderate - max 2% portfolio risk per trade" } },
    { name: "Crypto Scalping", inputs: { strategy: "High-frequency scalping on BTC/USDT using 1-minute charts", market: "Binance BTC/USDT perpetual futures", risk_tolerance: "Aggressive - 5-10 trades per day, tight stops" } },
  ],
  baking_formula: [
    { name: "Sourdough Bread", inputs: { product: "Classic sourdough boule with crispy crust", servings: 1, key_ingredients: "bread flour, active sourdough starter, salt, water", dietary_notes: "Naturally vegan, long fermentation for digestibility" } },
    { name: "Chocolate Croissants", inputs: { product: "Buttery pain au chocolat with dark chocolate filling", servings: 12, key_ingredients: "all-purpose flour, European butter, chocolate batons, yeast, eggs", dietary_notes: "Contains gluten, dairy, eggs" } },
  ],
  music: [
    { name: "Cinematic Score", inputs: { genre: "Epic orchestral cinematic", mood: "Heroic and triumphant, building from quiet tension to full orchestra", instruments: "Full orchestra: strings, brass, choir, epic percussion, piano", reference_artists: "Hans Zimmer, Ludwig Goransson" } },
    { name: "Lo-fi Hip Hop", inputs: { genre: "Lo-fi hip hop study beats", mood: "Relaxed, nostalgic, cozy — perfect for studying or working", instruments: "Sampled jazz piano, boom bap drums, vinyl crackle, mellow bass", reference_artists: "Nujabes, J Dilla" } },
  ],
  content_creation: [
    { name: "Tech YouTube Channel", inputs: { platform: "YouTube", niche: "Practical AI tools and productivity", target_audience: "Professionals wanting to use AI in their workflow", content_style: "Tutorial-driven, clear explanations, real-world examples" } },
    { name: "Lifestyle Newsletter", inputs: { platform: "Email newsletter (Substack)", niche: "Minimalist living and intentional lifestyle", target_audience: "Millennials seeking simplicity and purpose", content_style: "Personal essays, practical tips, community stories" } },
  ],
  seo_frameworks: [
    { name: "SaaS Blog Strategy", inputs: { business_type: "B2B SaaS project management tool", target_keywords: "project management software, team collaboration tools, task tracking", competitor_sites: "Monday.com, Asana, ClickUp", primary_goal: "Organic lead generation from SMB decision makers" } },
  ],
  rei_market_research: [
    { name: "Multifamily Market", inputs: { location: "Phoenix, Arizona metro area", property_type: "Multifamily apartment complexes (20-100 units)", investment_strategy: "Value-add acquisitions with 5-year hold and exit", budget_range: "$2M - $8M acquisition price" } },
  ],
};
