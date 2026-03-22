import OpenAI from "openai";
import pLimit from "p-limit";
import pRetry, { AbortError } from "p-retry";
import type { Category, GeneratorType } from "@shared/schema";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

function isRateLimitError(error: any): boolean {
  const errorMsg = error?.message || String(error);
  return (
    errorMsg.includes("429") ||
    errorMsg.includes("RATELIMIT_EXCEEDED") ||
    errorMsg.toLowerCase().includes("quota") ||
    errorMsg.toLowerCase().includes("rate limit")
  );
}

// Category-specific system prompt context
const CATEGORY_CONTEXT: Record<string, { domain: string; instructions: string }> = {
  // Core Creative
  image: {
    domain: "AI image generation prompt engineering",
    instructions: `- Create detailed, vivid image prompts that produce stunning visual results
- Include specific camera settings (lens, aperture, focal length), lighting setups, mood, and composition
- Use precise style descriptors and artistic references
- Include both positive prompt elements and negative prompt exclusions
- Reference specific photographic or artistic techniques when relevant`
  },
  video: {
    domain: "AI video production and cinematography",
    instructions: `- Design complete video sequences with clear shot-by-shot breakdowns
- Specify camera motion, transitions, pacing, and visual style
- Include audio direction: music mood, sound effects, voice-over notes
- Define duration, frame rate preferences, and post-production style
- Think like a director: coverage, continuity, and narrative flow`
  },
  youtube_titles: {
    domain: "YouTube content strategy and SEO copywriting",
    instructions: `- Create titles that balance search optimization with emotional appeal
- Use proven power words, numbers, and curiosity gaps
- Consider click-through rate psychology and audience intent
- Respect YouTube's algorithm preferences for title length (60 chars)
- Match the tone and style to the target audience and content type`
  },
  apps: {
    domain: "software product design and development planning",
    instructions: `- Think like a product manager and senior engineer
- Define clear feature scope, technical architecture, and user flows
- Specify technology stack choices with justifications
- Include non-functional requirements: performance, security, scalability
- Plan for MVP vs full-featured implementations`
  },
  marketing_content: {
    domain: "digital marketing and conversion copywriting",
    instructions: `- Focus on audience pain points, desires, and transformation
- Use proven copywriting frameworks (AIDA, PAS, StoryBrand)
- Define the unique value proposition and key differentiators
- Include channel-specific best practices for the target platform
- Optimize for the specific goal: awareness, leads, or conversion`
  },
  visual_design: {
    domain: "UI/UX and brand visual design",
    instructions: `- Think systematically about design: hierarchy, spacing, color theory
- Include brand guidelines, typography choices, and color systems
- Define component specs and design tokens
- Consider accessibility (WCAG) and responsive design
- Specify deliverable formats and handoff requirements`
  },
  av_production: {
    domain: "audio-visual production and post-production",
    instructions: `- Plan complete AV projects from concept to delivery
- Include shot lists, storyboards, audio specifications
- Define technical specs: resolution, codec, aspect ratio, color space
- Plan for production logistics: crew, equipment, schedule
- Include post-production workflow and delivery formats`
  },
  business_analysis: {
    domain: "business intelligence and strategic analysis",
    instructions: `- Think like a management consultant or business analyst
- Frame analysis around clear business questions and decision needs
- Identify key metrics, KPIs, and success criteria
- Structure insights as actionable recommendations
- Include data validation, caveats, and confidence levels`
  },
  dev_tasks: {
    domain: "software engineering and code development",
    instructions: `- Write precise, technically accurate development prompts
- Include language, framework, and version specifications
- Define input/output contracts, edge cases, and error handling
- Follow clean code principles and design patterns
- Include testing requirements and documentation needs`
  },
  personal_helper: {
    domain: "personal productivity and communication assistance",
    instructions: `- Tailor output to the individual's context and goals
- Match tone and formality to the situation
- Be actionable and concise; avoid unnecessary filler
- For communications: be clear, empathetic, and persuasive
- For planning: be structured, realistic, and motivating`
  },
  strategy_innovation: {
    domain: "strategic planning and innovation consulting",
    instructions: `- Apply frameworks like Porter's Five Forces, Blue Ocean, SWOT
- Think long-term: 1-year, 3-year, 5-year horizons
- Challenge assumptions and identify second-order effects
- Define clear OKRs, decision criteria, and success metrics
- Include risk assessment and mitigation strategies`
  },
  data_decision: {
    domain: "data science and decision intelligence",
    instructions: `- Apply statistical rigor and data science best practices
- Define clear hypotheses, metrics, and validation approaches
- Identify potential biases, confounders, and data quality issues
- Structure analysis to support specific business decisions
- Present insights with appropriate confidence and uncertainty`
  },
  hyper_personalization: {
    domain: "personalization engineering and behavioral marketing",
    instructions: `- Create truly personalized variants based on persona attributes
- Use dynamic content principles and segmentation strategies
- Balance personalization depth with scalability
- Include A/B testing design for variant validation
- Respect privacy and preference boundaries`
  },
  automation_augmentation: {
    domain: "workflow automation and AI augmentation design",
    instructions: `- Design clear trigger-action-outcome automation flows
- Identify human-in-the-loop checkpoints and approval gates
- Define error handling, retry logic, and fallback paths
- Specify integration points, API requirements, and data schemas
- Include monitoring, alerting, and rollback procedures`
  },
  content_creation: {
    domain: "content strategy and batch content production",
    instructions: `- Plan content systematically for scale and consistency
- Define content pillars, formats, and distribution strategy
- Maintain brand voice across all content pieces
- Include editorial calendar and production workflow
- Balance evergreen content with timely, trending topics`
  },
  science_rnd: {
    domain: "scientific research and experimental design",
    instructions: `- Apply rigorous scientific method: hypothesis, methodology, analysis
- Follow domain-specific research protocols and standards
- Define control variables, dependent/independent variables
- Include statistical power analysis and sample size planning
- Specify data collection, storage, and analysis procedures`
  },
  hr_operations: {
    domain: "human resources management and organizational operations",
    instructions: `- Apply HR best practices and employment law awareness
- Create fair, objective, and legally defensible processes
- Focus on employee experience alongside operational efficiency
- Include DE&I considerations in all people processes
- Align HR initiatives with business strategy and culture`
  },

  // Startup Categories
  startup_idea_refinement: {
    domain: "startup ideation and business validation",
    instructions: `- Apply lean startup methodology and Jobs-to-be-Done framework
- Challenge assumptions with market reality checks
- Identify the core pain point and value proposition clearly
- Define target customer precisely with demographic and psychographic detail
- Suggest validation experiments and MVP approaches`
  },
  lean_canvas: {
    domain: "lean business model design",
    instructions: `- Complete all 9 lean canvas blocks systematically
- Focus on unfair advantage and unique value proposition
- Define channels, cost structure, and revenue streams specifically
- Identify riskiest assumptions that need immediate validation
- Keep language concise and hypothesis-driven`
  },
  startup_name_generator: {
    domain: "startup branding and naming strategy",
    instructions: `- Generate names that are memorable, pronounceable, and available
- Consider domain availability and trademark clearance factors
- Match naming style to industry tone (playful, professional, technical)
- Include rationale for each name suggestion
- Provide variations: compound words, portmanteaus, invented words`
  },
  startup_competitor_mapping: {
    domain: "competitive intelligence and market positioning",
    instructions: `- Map competitors across direct, indirect, and substitute categories
- Analyze positioning dimensions: price, features, target market, brand
- Identify white space and differentiation opportunities
- Include SWOT-style analysis for key competitors
- Define your sustainable competitive advantages`
  },
  startup_customer_plan: {
    domain: "customer acquisition and growth strategy",
    instructions: `- Define the full customer acquisition funnel: awareness to retention
- Identify acquisition channels with CAC estimates
- Set realistic conversion rate benchmarks
- Plan for viral/referral loops and network effects
- Include retention and lifetime value optimization strategies`
  },
  startup_mvp_prioritization: {
    domain: "product management and MVP strategy",
    instructions: `- Apply impact vs. effort prioritization frameworks (RICE, ICE)
- Define the minimum set of features for market validation
- Identify what to cut vs. what is truly core to the value prop
- Plan feature rollout phases post-MVP
- Set clear success metrics for each feature`
  },
  startup_brand_voice: {
    domain: "brand identity and communication strategy",
    instructions: `- Define brand personality with 3-5 core character traits
- Create voice and tone guidelines for different contexts
- Develop vocabulary guidelines: words to use and avoid
- Include example copy that demonstrates the brand voice
- Align brand voice with target audience preferences`
  },
  startup_launch_checklist: {
    domain: "product launch strategy and execution",
    instructions: `- Create a comprehensive pre-launch, launch day, and post-launch checklist
- Include technical readiness: performance, security, monitoring
- Cover marketing: PR, social, email, paid acquisition
- Address customer support and success preparation
- Define success metrics and review cadence`
  },
  startup_pitch: {
    domain: "investor pitch and persuasive storytelling",
    instructions: `- Structure the pitch using proven investor narrative frameworks
- Lead with the problem story, not the solution
- Quantify market opportunity with credible data
- Show traction, validation, and momentum clearly
- Define the ask with clear use of funds and milestones`
  },
  startup_content_calendar: {
    domain: "content marketing and editorial planning",
    instructions: `- Plan content themes aligned with business goals and seasons
- Balance educational, entertaining, and promotional content
- Define platform-specific content formats and best practices
- Include content repurposing strategy across channels
- Set publishing cadence based on available resources`
  },
  startup_offer_stack: {
    domain: "pricing strategy and offer design",
    instructions: `- Design a tiered offer structure with clear value escalation
- Create compelling names and positioning for each tier
- Include bonuses, guarantees, and risk-reversal elements
- Price based on value delivered, not cost-plus
- Define upsell and cross-sell paths in the funnel`
  },
  startup_roadmap: {
    domain: "product strategy and roadmap planning",
    instructions: `- Organize roadmap by themes and strategic goals, not just features
- Balance technical debt, new features, and user-requested improvements
- Define clear milestones with measurable outcomes
- Include dependency mapping and resource requirements
- Communicate roadmap with confidence intervals, not firm dates`
  },
  startup_customer_avatar: {
    domain: "customer research and persona development",
    instructions: `- Build richly detailed personas beyond basic demographics
- Include psychographics: values, fears, aspirations, daily routines
- Define Jobs-to-be-Done: functional, emotional, and social jobs
- Identify trigger moments that drive purchase decisions
- Map the journey from problem-awareness to brand advocate`
  },
  startup_brand_story: {
    domain: "brand narrative and founder storytelling",
    instructions: `- Use the hero's journey or origin story narrative structure
- Connect the founder's personal experience to the mission
- Make the customer the hero; the brand is the guide
- Include specific, concrete details that build authenticity
- End with the transformative impact on customers and world`
  },
  startup_site_wireframe: {
    domain: "website architecture and UX planning",
    instructions: `- Plan site structure based on user intent and conversion goals
- Define page hierarchy and navigation architecture
- Specify key components for each page: hero, features, social proof, CTA
- Include mobile-first and responsive design considerations
- Map user flows for key conversion paths`
  },
  startup_productivity_system: {
    domain: "founder productivity and operational systems",
    instructions: `- Design systems that scale with the startup, not just the individual
- Balance deep work blocks with communication and management time
- Include tools, templates, and automations for key workflows
- Address energy management alongside time management
- Create review cadences: daily, weekly, quarterly`
  },
  startup_email_sequence: {
    domain: "email marketing and lifecycle automation",
    instructions: `- Design sequences for specific lifecycle stages: welcome, nurture, convert, retain
- Apply direct response copywriting principles to each email
- Define subject line strategy, preview text, and send timing
- Include segmentation and personalization logic
- Set up tracking and optimization metrics per email`
  },
  startup_pitch_deck: {
    domain: "investor presentation and pitch deck design",
    instructions: `- Structure the 10-12 slide deck following proven investor templates
- Lead with the problem slide using a compelling market story
- Show traction with visual charts and clear metrics
- Make financials accessible: revenue model, projections, unit economics
- Design slides for both presenting and leaving behind`
  },
  startup_partnership_pipeline: {
    domain: "business development and strategic partnerships",
    instructions: `- Define ideal partner profiles with clear criteria
- Design outreach strategy: warm introduction paths and cold outreach
- Create partnership value proposition from both perspectives
- Include deal structure options: revenue share, integration, co-marketing
- Build pipeline stages with clear next-action triggers`
  },
  startup_objection_handling: {
    domain: "sales enablement and persuasive communication",
    instructions: `- Anticipate the top 10 objections with validated responses
- Use the Feel-Felt-Found and Acknowledge-Reframe-Advance frameworks
- Practice objection prevention through earlier qualification
- Include emotional acknowledgment before logical counters
- Train responses to be conversational, not scripted`
  },
  startup_stress_framework: {
    domain: "founder mental health and resilience building",
    instructions: `- Design practical, sustainable stress management systems
- Include both reactive (crisis) and proactive (maintenance) strategies
- Address the unique stressors of startup life: uncertainty, isolation, failure
- Incorporate evidence-based approaches: mindfulness, exercise, sleep hygiene
- Build community and peer support structures`
  },
  startup_skills_plan: {
    domain: "professional development and skills acquisition",
    instructions: `- Prioritize skills by their ROI for the startup's current stage
- Design learning sprints: 30/60/90-day skill milestones
- Balance depth (mastery) vs. breadth (T-shaped learning)
- Include resources: courses, books, mentors, communities
- Connect skills directly to business outcomes and metrics`
  },
  startup_feedback_loop: {
    domain: "customer feedback and product iteration",
    instructions: `- Design multi-channel feedback collection systems
- Create feedback classification and prioritization frameworks
- Build rapid response and follow-up protocols
- Include quantitative (surveys, NPS) and qualitative (interviews) methods
- Close the loop with customers on how feedback influenced decisions`
  },
  startup_networking_system: {
    domain: "professional networking and relationship building",
    instructions: `- Design a systematic approach to building strategic relationships
- Define target network segments: investors, customers, advisors, talent
- Create outreach templates and conversation frameworks
- Build habits for relationship maintenance and nurturing
- Track relationship health with simple CRM workflows`
  },
  startup_customer_journey: {
    domain: "customer experience and journey mapping",
    instructions: `- Map all touchpoints from first awareness to brand advocacy
- Identify emotional highs and lows throughout the journey
- Define moments of truth that most impact retention and referral
- Include offline and online journey intersections
- Design interventions at each stage to improve experience`
  },

  // Food & Hospitality
  baking_formula: {
    domain: "professional baking, pastry arts, and recipe development",
    instructions: `- Use bakers' percentages and precise weight measurements
- Explain the science behind key ingredients and their ratios
- Include mixing method, fermentation/proofing times, and baking temperatures
- Address altitude, humidity, and equipment variations
- Provide troubleshooting guidance for common issues`
  },
  food_business_concept: {
    domain: "food and hospitality business development",
    instructions: `- Design complete food business concepts with clear differentiation
- Define service model, target market, and location strategy
- Include menu development direction and pricing strategy
- Address operational requirements: equipment, staffing, sourcing
- Include financial projections and break-even analysis`
  },
  event_food_planning: {
    domain: "catering, event planning, and food service",
    instructions: `- Plan menus that scale to guest count with reliable execution
- Balance dietary restrictions, allergies, and preferences
- Design service flow: stations, buffets, plated service logistics
- Include procurement planning: sourcing, quantities, prep timeline
- Plan for contingencies: weather, dietary surprises, equipment issues`
  },
  food_social_content: {
    domain: "food photography, styling, and social media content",
    instructions: `- Create content that makes viewers hungry and engaged
- Define visual storytelling: hero shot, process shots, lifestyle context
- Include caption strategy: hooks, story, CTAs for each platform
- Plan content batching and seasonal content opportunities
- Align content with food trends and platform-specific formats`
  },
  food: {
    domain: "culinary arts, recipe development, and food culture",
    instructions: `- Apply culinary principles: flavor balance, texture contrast, color
- Include precise measurements, techniques, and timing
- Reference regional traditions and ingredient origins when relevant
- Explain the 'why' behind techniques for educational value
- Consider presentation and plating as part of the dish`
  },

  // Real Estate & Investment
  rei_market_research: {
    domain: "real estate investment market analysis",
    instructions: `- Analyze market using key REI metrics: cap rates, price-to-rent ratios, absorption rates
- Identify supply/demand dynamics: new construction, vacancy rates, population trends
- Include macro economic factors: employment, interest rates, migration patterns
- Profile the specific sub-market or neighborhood in detail
- Provide data-driven investment thesis with risk assessment`
  },
  rei_acquisition_system: {
    domain: "real estate acquisition strategy and deal sourcing",
    instructions: `- Define target property criteria: class, size, location, condition
- Build systematic deal sourcing channels: MLS, off-market, wholesalers
- Create offer strategy and negotiation framework
- Include due diligence checklist and timeline
- Define financing strategy: conventional, hard money, creative`
  },
  rei_inspection_notes: {
    domain: "property inspection and due diligence documentation",
    instructions: `- Document all systems thoroughly: structural, mechanical, electrical, plumbing
- Prioritize findings by severity: critical, major, minor, cosmetic
- Estimate repair costs with contractor-grade accuracy
- Identify deferred maintenance and life expectancy of major systems
- Flag code violations, safety hazards, and deal-breakers`
  },
  rei_investor: {
    domain: "real estate investment strategy and portfolio management",
    instructions: `- Apply professional investor frameworks: IRR, cash-on-cash, equity multiple
- Design investment strategy aligned with risk tolerance and timeline
- Include portfolio diversification across asset types and markets
- Plan exit strategies: refinance, sell, 1031 exchange, hold
- Address tax optimization: depreciation, cost segregation, opportunity zones`
  },
  real_estate: {
    domain: "real estate practice and property transactions",
    instructions: `- Apply real estate principles: valuation, market analysis, transaction management
- Include both buyer and seller perspectives in analysis
- Address financing options and qualification requirements
- Cover legal and contractual considerations in real estate transactions
- Provide practical, actionable guidance for real estate decisions`
  },

  // Finance & Business
  business_credit: {
    domain: "business credit building and commercial lending",
    instructions: `- Design systematic business credit building progression
- Include major credit reporting agencies: Dun & Bradstreet, Experian Business, Equifax Business
- Define vendor credit to bank credit progression strategy
- Address PAYDEX scores, business credit utilization, and reporting
- Include timeline expectations and milestone targets`
  },
  credit: {
    domain: "credit management, repair, and optimization",
    instructions: `- Apply FICO score factors: payment history, utilization, age, mix, inquiries
- Design dispute and correction strategies for inaccurate items
- Include rapid rescore techniques and credit optimization strategies
- Address both personal and business credit management
- Provide realistic timelines for credit score improvements`
  },
  day_trading: {
    domain: "active trading strategies and technical analysis",
    instructions: `- Apply technical analysis: chart patterns, indicators, volume analysis
- Define entry/exit rules with precise trigger conditions
- Include risk management: position sizing, stop-loss placement, max daily loss
- Specify time frames, instruments, and market conditions for the strategy
- Address psychological discipline and trading journal practices
- Note: this is for educational purposes; include appropriate risk disclaimers`
  },
  trust_estate_info_gather: {
    domain: "estate planning and trust documentation",
    instructions: `- Gather comprehensive information for estate planning purposes
- Address all asset classes: real estate, financial accounts, business interests, personal property
- Include beneficiary designations and contingency planning
- Cover healthcare directives and powers of attorney
- Note when professional legal counsel is required for specific provisions`
  },
  business_entity_overview: {
    domain: "business entity structure and formation",
    instructions: `- Compare entity types: sole proprietorship, partnership, LLC, S-corp, C-corp
- Address tax implications for each structure
- Include liability protection analysis by entity type
- Cover formation requirements, ongoing compliance, and costs
- Align entity recommendation with business goals, size, and investor plans`
  },

  // Specialized Categories
  mcp_product_builder: {
    domain: "Model Context Protocol product development",
    instructions: `- Design MCP-compatible tools, resources, and prompts
- Define server capabilities and client integration patterns
- Include schema definitions for tools and resources
- Address authentication, rate limiting, and error handling
- Plan for Claude Desktop and other MCP client compatibility`
  },
  ethical_data_extraction: {
    domain: "responsible data collection and web scraping",
    instructions: `- Apply ethical data collection principles: robots.txt compliance, rate limiting
- Define data sources, legal basis, and privacy considerations
- Include data minimization and purpose limitation principles
- Design data handling: storage, access controls, retention policies
- Address GDPR, CCPA, and other relevant compliance frameworks`
  },
  seo_frameworks: {
    domain: "search engine optimization and organic growth",
    instructions: `- Apply technical, on-page, and off-page SEO frameworks
- Define keyword strategy: search intent, volume, competition analysis
- Include content architecture and internal linking strategy
- Address Core Web Vitals and technical SEO requirements
- Plan link acquisition strategy with ethical, sustainable approaches`
  },
  elearning_builder: {
    domain: "instructional design and online course creation",
    instructions: `- Apply adult learning principles: Bloom's taxonomy, spaced repetition
- Design course architecture: modules, lessons, assessments, practice
- Define learning objectives with measurable outcomes
- Include multimedia and interactive elements for engagement
- Plan for different learner levels and learning styles`
  },
  meditation_script: {
    domain: "guided meditation and mindfulness facilitation",
    instructions: `- Use calming, present-tense language throughout
- Include breath anchoring and progressive relaxation techniques
- Match script length to intended session duration
- Layer sensory details: visual, auditory, kinesthetic imagery
- Build toward a clear intention or transformational insight`
  },
  lets_get_viral: {
    domain: "viral content strategy and social media growth",
    instructions: `- Apply viral content mechanics: emotion, identity, novelty, utility
- Define the shareable hook that triggers immediate engagement
- Design content for specific platform algorithms and formats
- Include community and conversation activation strategies
- Balance trending topics with brand-aligned messaging`
  },
  long_covid: {
    domain: "Long COVID education, support, and resources",
    instructions: `- Apply current clinical understanding and emerging research
- Use patient-centered, empathetic language throughout
- Include multi-system symptom awareness: fatigue, cognitive, autonomic
- Provide practical pacing and energy management strategies
- Always recommend working with qualified healthcare professionals
- Note: provide educational support only, not medical advice`
  },
  music: {
    domain: "music composition, production, and sound design",
    instructions: `- Define genre, tempo (BPM), key, and time signature precisely
- Describe arrangement: instrumentation, sonic layers, dynamics
- Include production style references and sonic palette
- Address song structure: intro, verse, chorus, bridge, outro
- Specify mood, energy arc, and emotional journey of the piece`
  },
  service_business_sites: {
    domain: "service business website strategy and copywriting",
    instructions: `- Design sites that convert visitors to inquiries and bookings
- Lead with the customer outcome, not the service features
- Include trust signals: testimonials, credentials, guarantees
- Define service area, ideal client profile, and key differentiators
- Create clear conversion paths: contact forms, booking, quote requests`
  },
  website_building: {
    domain: "web development planning and site architecture",
    instructions: `- Define site goals, target audience, and success metrics
- Plan information architecture and user experience flows
- Specify technical requirements: CMS, integrations, performance targets
- Include content strategy: what to write for each page
- Address SEO, accessibility, and mobile optimization requirements`
  },
  photorealistic_images: {
    domain: "photorealistic AI image generation",
    instructions: `- Focus on physical accuracy and real-world plausibility
- Use photography-specific language: lens, DOF, exposure, color grade
- Apply the PHOTOREALISM_ADDON: unsmoothed skin, real imperfections, true physics lighting
- Reference real photographers, films, or locations for style
- Include negative prompts to avoid CGI look, AI artifacts, and over-processing`
  }
};

function buildSystemPrompt(category: Category, genType: GeneratorType): string {
  const context = CATEGORY_CONTEXT[category];
  const typeLabel = genType === "prompt_generator" 
    ? "Prompt Generator" 
    : genType === "agent_helper" 
      ? "Agent Helper" 
      : "General Generator";

  if (!context) {
    const categoryName = category.replace(/_/g, " ");
    return `You are an expert ${categoryName} ${typeLabel}. Generate high-quality, professional outputs based on user inputs. Always return valid JSON.`;
  }

  return `You are an expert in ${context.domain}, acting as a ${typeLabel}.

DOMAIN-SPECIFIC GUIDELINES:
${context.instructions}

GENERATOR TYPE ROLE:
${genType === "prompt_generator" 
  ? "- Generate a comprehensive, detailed prompt ready to use with AI tools\n- Be specific, structured, and professionally formatted\n- Include all relevant details the user provided"
  : genType === "agent_helper"
    ? "- Act as an expert agent analyzing, enhancing, and expanding on the inputs\n- Provide strategic guidance, multiple options, or enriched outputs\n- Think critically and add expert insight beyond what the user asked"
    : "- Generate practical, immediately usable content or guidance\n- Be direct, actionable, and focused on real-world application\n- Adapt depth and format to what is most useful for this request"
}

Always return valid JSON matching the exact output structure specified. Be thorough and professional.`;
}

function buildUserPrompt(category: Category, genType: GeneratorType, inputs: any): string {
  const categoryName = category.replace(/_/g, " ");
  let prompt = `Generate a ${categoryName} output using the following inputs:\n\n`;
  
  Object.entries(inputs).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      const label = key.replace(/_/g, " ");
      if (Array.isArray(value)) {
        if (value.length > 0) {
          prompt += `${label}: ${value.join(", ")}\n`;
        }
      } else if (typeof value === "object") {
        const objEntries = Object.entries(value as any).filter(([, v]) => v !== "" && v !== null && v !== undefined);
        if (objEntries.length > 0) {
          prompt += `${label}:\n`;
          objEntries.forEach(([k, v]) => {
            prompt += `  - ${k.replace(/_/g, " ")}: ${v}\n`;
          });
        }
      } else {
        prompt += `${label}: ${value}\n`;
      }
    }
  });

  return prompt;
}

// Comprehensive output structures for all 68 categories
const OUTPUT_STRUCTURES: Record<string, Record<string, string>> = {
  // Core Creative
  image: {
    prompt_generator: '{"final_prompt": "string - complete image generation prompt", "negative_prompt": "string - elements to exclude", "style_notes": "string"}',
    agent_helper: '{"final_prompt": "string", "negative_prompt": "string", "variations": ["string"], "technical_settings": "string"}',
    general_generator: '{"final_prompt": "string", "negative_prompt": "string", "notes": "string"}'
  },
  video: {
    prompt_generator: '{"sequence_prompt": "string - full video prompt", "shot_breakdown": "string", "audio_direction": "string", "style_guide": "string"}',
    agent_helper: '{"sequence_prompt": "string", "shot_table": "string - shot by shot breakdown", "audio_spec": "string", "director_notes": "string"}',
    general_generator: '{"sequence_prompt": "string", "style_notes": "string"}'
  },
  youtube_titles: {
    prompt_generator: '{"titles": ["string - 5-10 optimized titles"], "keywords": ["string"], "strategy_notes": "string"}',
    agent_helper: '{"ranked_titles": ["string"], "analysis": "string - why each title works", "ab_test_pairs": ["string"]}',
    general_generator: '{"titles": ["string"], "notes": "string"}'
  },
  apps: {
    prompt_generator: '{"product_brief": "string", "feature_list": ["string"], "technical_architecture": "string", "stack_recommendation": "string", "mvp_scope": "string"}',
    agent_helper: '{"architecture_outline": "string", "feature_breakdown": "string", "risk_assessment": "string", "implementation_phases": ["string"]}',
    general_generator: '{"result": "string", "next_steps": ["string"]}'
  },
  marketing_content: {
    prompt_generator: '{"content_brief": "string", "headline_options": ["string"], "body_copy": "string", "cta": "string", "channel_notes": "string"}',
    agent_helper: '{"strategy": "string", "funnel_stage": "string", "content_variations": ["string"], "performance_kpis": ["string"]}',
    general_generator: '{"content": "string", "summary": "string"}'
  },
  visual_design: {
    prompt_generator: '{"design_brief": "string", "color_system": "string", "typography_direction": "string", "component_specs": "string", "deliverables": ["string"]}',
    agent_helper: '{"design_system": "string", "layout_guidance": "string", "accessibility_notes": "string", "handoff_specs": "string", "qa_checklist": ["string"]}',
    general_generator: '{"brief": "string", "key_recommendations": ["string"]}'
  },
  av_production: {
    prompt_generator: '{"production_plan": "string", "shot_list": "string", "audio_spec": "string", "post_production_notes": "string"}',
    agent_helper: '{"shotlist": "string", "storyboard_notes": "string", "audio_direction": "string", "continuity_notes": "string", "delivery_specs": "string"}',
    general_generator: '{"plan": "string", "key_specs": "string"}'
  },
  business_analysis: {
    prompt_generator: '{"analysis_framework": "string", "key_findings": ["string"], "recommendations": ["string"], "metrics_to_track": ["string"]}',
    agent_helper: '{"executive_summary": "string", "insights": "string", "action_items": ["string"], "risks": ["string"], "next_steps": ["string"]}',
    general_generator: '{"analysis": "string", "conclusion": "string"}'
  },
  dev_tasks: {
    prompt_generator: '{"implementation_plan": "string", "code_outline": "string", "key_functions": ["string"], "testing_approach": "string"}',
    agent_helper: '{"code_review": "string", "improvement_suggestions": ["string"], "refactoring_notes": "string", "test_cases": ["string"]}',
    general_generator: '{"solution": "string", "explanation": "string", "next_steps": ["string"]}'
  },
  personal_helper: {
    prompt_generator: '{"draft_content": "string", "action_checklist": ["string"], "personalization_notes": "string"}',
    agent_helper: '{"primary_draft": "string", "alternative_approach": "string", "coaching_notes": "string", "follow_up_actions": ["string"]}',
    general_generator: '{"content": "string", "tips": ["string"]}'
  },
  strategy_innovation: {
    prompt_generator: '{"strategic_brief": "string", "strategic_options": ["string"], "decision_framework": "string", "success_metrics": ["string"]}',
    agent_helper: '{"strategic_analysis": "string", "scenario_planning": "string", "risk_assessment": "string", "recommended_path": "string", "milestone_plan": "string"}',
    general_generator: '{"strategy_summary": "string", "key_actions": ["string"]}'
  },
  data_decision: {
    prompt_generator: '{"analysis_plan": "string", "methodology": "string", "data_requirements": ["string"], "validation_approach": "string"}',
    agent_helper: '{"data_insights": "string", "key_signals": ["string"], "statistical_notes": "string", "decision_recommendation": "string"}',
    general_generator: '{"analysis": "string", "findings": ["string"]}'
  },
  hyper_personalization: {
    prompt_generator: '{"personalization_strategy": "string", "content_variants": ["string"], "segmentation_logic": "string", "testing_plan": "string"}',
    agent_helper: '{"variant_matrix": "string", "personalization_rules": "string", "performance_framework": "string"}',
    general_generator: '{"variants": ["string"], "personalization_notes": "string"}'
  },
  automation_augmentation: {
    prompt_generator: '{"workflow_design": "string", "trigger_logic": "string", "action_steps": ["string"], "error_handling": "string", "monitoring_plan": "string"}',
    agent_helper: '{"automation_blueprint": "string", "runbook": "string", "integration_specs": "string", "kpi_metrics": ["string"]}',
    general_generator: '{"workflow_summary": "string", "implementation_steps": ["string"]}'
  },
  content_creation: {
    prompt_generator: '{"content_strategy": "string", "content_calendar": "string", "content_pieces": ["string"], "distribution_plan": "string"}',
    agent_helper: '{"content_audit": "string", "priority_pieces": ["string"], "quality_criteria": "string", "production_workflow": "string"}',
    general_generator: '{"content": "string", "content_ideas": ["string"]}'
  },
  science_rnd: {
    prompt_generator: '{"research_protocol": "string", "methodology": "string", "data_collection_plan": "string", "analysis_approach": "string", "success_criteria": "string"}',
    agent_helper: '{"experimental_design": "string", "variable_definitions": "string", "statistical_plan": "string", "data_schema": "string"}',
    general_generator: '{"research_plan": "string", "key_considerations": ["string"]}'
  },
  hr_operations: {
    prompt_generator: '{"hr_framework": "string", "process_documentation": "string", "evaluation_criteria": ["string"], "implementation_guide": "string"}',
    agent_helper: '{"hr_policy": "string", "process_sop": "string", "compliance_checklist": ["string"], "success_metrics": ["string"]}',
    general_generator: '{"guidance": "string", "recommended_approach": "string"}'
  },

  // Startup Categories
  startup_idea_refinement: {
    prompt_generator: '{"refined_concept": "string", "value_proposition": "string", "target_customer": "string", "differentiators": ["string"], "validation_experiments": ["string"]}',
    agent_helper: '{"idea_assessment": "string", "strengths": ["string"], "risks": ["string"], "pivot_options": ["string"], "recommended_mvp": "string"}',
    general_generator: '{"refined_idea": "string", "next_steps": ["string"]}'
  },
  lean_canvas: {
    prompt_generator: '{"problem": "string", "solution": "string", "unique_value_proposition": "string", "unfair_advantage": "string", "customer_segments": "string", "key_metrics": ["string"], "channels": "string", "cost_structure": "string", "revenue_streams": "string"}',
    agent_helper: '{"canvas_analysis": "string", "riskiest_assumptions": ["string"], "validation_priorities": ["string"], "recommended_experiments": ["string"]}',
    general_generator: '{"canvas_summary": "string", "key_insights": ["string"]}'
  },
  startup_name_generator: {
    prompt_generator: '{"name_options": ["string"], "rationale": "string", "domain_availability_notes": "string", "brand_fit_analysis": "string"}',
    agent_helper: '{"top_names": ["string"], "analysis": "string", "trademark_considerations": "string", "recommended_choice": "string"}',
    general_generator: '{"names": ["string"], "notes": "string"}'
  },
  startup_competitor_mapping: {
    prompt_generator: '{"competitor_map": "string", "direct_competitors": ["string"], "indirect_competitors": ["string"], "positioning_gaps": ["string"], "differentiation_strategy": "string"}',
    agent_helper: '{"competitive_analysis": "string", "swot_summary": "string", "white_space_opportunities": ["string"], "positioning_recommendation": "string"}',
    general_generator: '{"competitive_landscape": "string", "key_insights": ["string"]}'
  },
  startup_customer_plan: {
    prompt_generator: '{"acquisition_strategy": "string", "channel_breakdown": ["string"], "funnel_design": "string", "cac_estimates": "string", "retention_plan": "string"}',
    agent_helper: '{"growth_strategy": "string", "channel_priorities": ["string"], "conversion_benchmarks": "string", "viral_loop_design": "string"}',
    general_generator: '{"customer_plan": "string", "priority_actions": ["string"]}'
  },
  startup_mvp_prioritization: {
    prompt_generator: '{"mvp_feature_set": ["string"], "excluded_features": ["string"], "prioritization_rationale": "string", "phase_2_features": ["string"], "success_metrics": ["string"]}',
    agent_helper: '{"feature_scoring": "string", "mvp_recommendation": "string", "trade_off_analysis": "string", "launch_criteria": ["string"]}',
    general_generator: '{"mvp_summary": "string", "priority_features": ["string"]}'
  },
  startup_brand_voice: {
    prompt_generator: '{"brand_personality": ["string"], "voice_description": "string", "tone_guidelines": "string", "vocabulary_dos": ["string"], "vocabulary_donts": ["string"], "example_copy": ["string"]}',
    agent_helper: '{"brand_voice_guide": "string", "tone_matrix": "string", "copy_examples": ["string"], "consistency_checklist": ["string"]}',
    general_generator: '{"brand_voice_summary": "string", "key_guidelines": ["string"]}'
  },
  startup_launch_checklist: {
    prompt_generator: '{"pre_launch_checklist": ["string"], "launch_day_checklist": ["string"], "post_launch_checklist": ["string"], "success_metrics": ["string"], "contingency_plans": "string"}',
    agent_helper: '{"comprehensive_checklist": "string", "critical_path_items": ["string"], "risk_mitigation": ["string"], "launch_timeline": "string"}',
    general_generator: '{"launch_checklist": ["string"], "priority_items": ["string"]}'
  },
  startup_pitch: {
    prompt_generator: '{"pitch_script": "string", "key_messages": ["string"], "proof_points": ["string"], "objection_responses": ["string"], "call_to_action": "string"}',
    agent_helper: '{"pitch_structure": "string", "narrative_arc": "string", "data_points_needed": ["string"], "delivery_coaching": "string"}',
    general_generator: '{"pitch_summary": "string", "key_talking_points": ["string"]}'
  },
  startup_content_calendar: {
    prompt_generator: '{"content_themes": ["string"], "weekly_schedule": "string", "content_mix": "string", "platform_strategy": "string", "sample_posts": ["string"]}',
    agent_helper: '{"full_calendar": "string", "content_pillars": ["string"], "repurposing_strategy": "string", "engagement_plan": "string"}',
    general_generator: '{"calendar_overview": "string", "content_ideas": ["string"]}'
  },
  startup_offer_stack: {
    prompt_generator: '{"offer_tiers": ["string"], "tier_names": ["string"], "pricing_strategy": "string", "bonuses": ["string"], "guarantee": "string", "upsell_path": "string"}',
    agent_helper: '{"offer_analysis": "string", "pricing_recommendations": "string", "value_ladder": "string", "positioning_strategy": "string"}',
    general_generator: '{"offer_summary": "string", "key_elements": ["string"]}'
  },
  startup_roadmap: {
    prompt_generator: '{"roadmap_themes": ["string"], "q1_milestones": ["string"], "q2_milestones": ["string"], "q3_4_milestones": ["string"], "success_metrics": ["string"], "dependencies": ["string"]}',
    agent_helper: '{"strategic_roadmap": "string", "prioritization_rationale": "string", "resource_requirements": "string", "risk_factors": ["string"]}',
    general_generator: '{"roadmap_summary": "string", "key_milestones": ["string"]}'
  },
  startup_customer_avatar: {
    prompt_generator: '{"avatar_name": "string", "demographics": "string", "psychographics": "string", "jobs_to_be_done": "string", "pain_points": ["string"], "aspirations": ["string"], "buying_triggers": ["string"], "preferred_channels": ["string"]}',
    agent_helper: '{"detailed_persona": "string", "journey_map": "string", "messaging_implications": "string", "content_preferences": ["string"]}',
    general_generator: '{"persona_summary": "string", "key_insights": ["string"]}'
  },
  startup_brand_story: {
    prompt_generator: '{"origin_story": "string", "mission_statement": "string", "hero_customer_story": "string", "brand_promise": "string", "values_in_action": ["string"]}',
    agent_helper: '{"narrative_arc": "string", "emotional_hooks": ["string"], "story_variations": ["string"], "brand_messaging_framework": "string"}',
    general_generator: '{"brand_story": "string", "key_themes": ["string"]}'
  },
  startup_site_wireframe: {
    prompt_generator: '{"site_structure": "string", "page_outlines": ["string"], "conversion_flows": "string", "key_components": ["string"], "content_requirements": "string"}',
    agent_helper: '{"ux_recommendations": "string", "wireframe_description": "string", "user_flows": "string", "cro_opportunities": ["string"]}',
    general_generator: '{"site_plan": "string", "key_pages": ["string"]}'
  },
  startup_productivity_system: {
    prompt_generator: '{"daily_system": "string", "weekly_review": "string", "tool_stack": ["string"], "automation_opportunities": ["string"], "energy_management": "string"}',
    agent_helper: '{"productivity_audit": "string", "optimized_system": "string", "habit_stack": "string", "review_cadences": "string"}',
    general_generator: '{"productivity_plan": "string", "key_practices": ["string"]}'
  },
  startup_email_sequence: {
    prompt_generator: '{"sequence_overview": "string", "email_subjects": ["string"], "email_bodies": ["string"], "send_timing": ["string"], "personalization_variables": ["string"]}',
    agent_helper: '{"sequence_strategy": "string", "full_email_drafts": ["string"], "segmentation_logic": "string", "optimization_notes": "string"}',
    general_generator: '{"sequence_outline": "string", "key_emails": ["string"]}'
  },
  startup_pitch_deck: {
    prompt_generator: '{"deck_outline": "string", "slide_contents": ["string"], "data_requirements": ["string"], "visual_direction": "string", "presenter_notes": "string"}',
    agent_helper: '{"complete_deck_content": "string", "storytelling_arc": "string", "investor_faqs": ["string"], "data_visualization_suggestions": "string"}',
    general_generator: '{"deck_summary": "string", "key_slides": ["string"]}'
  },
  startup_partnership_pipeline: {
    prompt_generator: '{"ideal_partner_profile": "string", "outreach_strategy": "string", "value_proposition": "string", "partnership_tiers": ["string"], "deal_structures": ["string"]}',
    agent_helper: '{"pipeline_framework": "string", "target_partner_list": ["string"], "outreach_templates": "string", "partnership_evaluation_criteria": ["string"]}',
    general_generator: '{"partnership_strategy": "string", "priority_actions": ["string"]}'
  },
  startup_objection_handling: {
    prompt_generator: '{"common_objections": ["string"], "response_scripts": ["string"], "prevention_strategies": ["string"], "qualifying_questions": ["string"]}',
    agent_helper: '{"objection_playbook": "string", "response_framework": "string", "role_play_scenarios": ["string"], "coaching_tips": "string"}',
    general_generator: '{"objection_responses": "string", "key_strategies": ["string"]}'
  },
  startup_stress_framework: {
    prompt_generator: '{"stress_assessment": "string", "daily_practices": ["string"], "crisis_protocol": "string", "support_systems": ["string"], "recovery_plan": "string"}',
    agent_helper: '{"resilience_framework": "string", "stress_inventory": "string", "personalized_practices": ["string"], "community_recommendations": "string"}',
    general_generator: '{"wellness_plan": "string", "key_practices": ["string"]}'
  },
  startup_skills_plan: {
    prompt_generator: '{"priority_skills": ["string"], "learning_roadmap": "string", "resources": ["string"], "30_day_plan": "string", "90_day_goals": ["string"]}',
    agent_helper: '{"skills_assessment": "string", "gap_analysis": "string", "learning_path": "string", "accountability_plan": "string"}',
    general_generator: '{"skills_summary": "string", "recommended_focus": ["string"]}'
  },
  startup_feedback_loop: {
    prompt_generator: '{"feedback_system": "string", "collection_methods": ["string"], "classification_framework": "string", "response_protocol": "string", "metrics": ["string"]}',
    agent_helper: '{"feedback_architecture": "string", "survey_designs": "string", "analysis_workflow": "string", "reporting_cadence": "string"}',
    general_generator: '{"feedback_plan": "string", "implementation_steps": ["string"]}'
  },
  startup_networking_system: {
    prompt_generator: '{"networking_strategy": "string", "target_segments": ["string"], "outreach_templates": ["string"], "nurture_system": "string", "tracking_approach": "string"}',
    agent_helper: '{"relationship_framework": "string", "weekly_networking_habits": "string", "conversation_guides": ["string"], "crm_workflow": "string"}',
    general_generator: '{"networking_plan": "string", "priority_actions": ["string"]}'
  },
  startup_customer_journey: {
    prompt_generator: '{"journey_map": "string", "touchpoints": ["string"], "emotional_arc": "string", "moments_of_truth": ["string"], "improvement_opportunities": ["string"]}',
    agent_helper: '{"detailed_journey": "string", "pain_point_analysis": "string", "intervention_plan": "string", "experience_metrics": ["string"]}',
    general_generator: '{"journey_summary": "string", "key_improvements": ["string"]}'
  },

  // Food & Hospitality
  baking_formula: {
    prompt_generator: '{"formula_name": "string", "ingredients_by_percentage": "string", "method": "string", "baking_parameters": "string", "troubleshooting_notes": "string"}',
    agent_helper: '{"recipe_analysis": "string", "optimized_formula": "string", "scaling_guide": "string", "variations": ["string"]}',
    general_generator: '{"recipe": "string", "key_techniques": ["string"]}'
  },
  food_business_concept: {
    prompt_generator: '{"concept_overview": "string", "target_market": "string", "menu_direction": "string", "service_model": "string", "financial_highlights": "string", "differentiators": ["string"]}',
    agent_helper: '{"business_analysis": "string", "concept_refinement": "string", "operational_requirements": "string", "launch_strategy": "string"}',
    general_generator: '{"concept_summary": "string", "key_elements": ["string"]}'
  },
  event_food_planning: {
    prompt_generator: '{"menu_plan": "string", "dietary_accommodations": "string", "service_flow": "string", "shopping_list": ["string"], "prep_timeline": "string"}',
    agent_helper: '{"event_food_strategy": "string", "menu_options": ["string"], "quantity_guide": "string", "vendor_recommendations": "string"}',
    general_generator: '{"food_plan": "string", "key_considerations": ["string"]}'
  },
  food_social_content: {
    prompt_generator: '{"content_concept": "string", "visual_direction": "string", "caption_options": ["string"], "hashtag_strategy": "string", "posting_schedule": "string"}',
    agent_helper: '{"content_strategy": "string", "content_series": ["string"], "engagement_tactics": ["string"], "platform_optimization": "string"}',
    general_generator: '{"content_ideas": ["string"], "posting_tips": ["string"]}'
  },
  food: {
    prompt_generator: '{"recipe_or_content": "string", "techniques": ["string"], "serving_suggestions": "string", "variations": ["string"]}',
    agent_helper: '{"culinary_guidance": "string", "technique_breakdown": "string", "ingredient_alternatives": ["string"], "presentation_ideas": "string"}',
    general_generator: '{"culinary_content": "string", "key_tips": ["string"]}'
  },

  // Real Estate & Investment
  rei_market_research: {
    prompt_generator: '{"market_analysis": "string", "key_metrics": "string", "supply_demand": "string", "investment_thesis": "string", "risk_factors": ["string"]}',
    agent_helper: '{"research_report": "string", "market_scoring": "string", "comparable_markets": ["string"], "recommended_submarkets": ["string"]}',
    general_generator: '{"market_summary": "string", "key_findings": ["string"]}'
  },
  rei_acquisition_system: {
    prompt_generator: '{"acquisition_criteria": "string", "deal_sourcing_strategy": "string", "offer_framework": "string", "due_diligence_checklist": ["string"], "financing_plan": "string"}',
    agent_helper: '{"acquisition_playbook": "string", "deal_analysis_template": "string", "negotiation_strategy": "string", "closing_timeline": "string"}',
    general_generator: '{"acquisition_plan": "string", "priority_actions": ["string"]}'
  },
  rei_inspection_notes: {
    prompt_generator: '{"inspection_summary": "string", "critical_issues": ["string"], "major_repairs": ["string"], "minor_items": ["string"], "estimated_costs": "string", "recommendation": "string"}',
    agent_helper: '{"detailed_report": "string", "priority_matrix": "string", "contractor_scope": "string", "negotiation_leverage": "string"}',
    general_generator: '{"inspection_overview": "string", "key_findings": ["string"]}'
  },
  rei_investor: {
    prompt_generator: '{"investment_strategy": "string", "portfolio_framework": "string", "deal_criteria": "string", "returns_analysis": "string", "exit_strategies": ["string"]}',
    agent_helper: '{"investor_playbook": "string", "underwriting_template": "string", "portfolio_analysis": "string", "tax_strategy_notes": "string"}',
    general_generator: '{"investment_guidance": "string", "key_strategies": ["string"]}'
  },
  real_estate: {
    prompt_generator: '{"real_estate_analysis": "string", "market_context": "string", "transaction_guidance": "string", "key_considerations": ["string"]}',
    agent_helper: '{"comprehensive_guidance": "string", "scenario_analysis": "string", "decision_framework": "string", "risk_assessment": "string"}',
    general_generator: '{"guidance": "string", "recommendations": ["string"]}'
  },

  // Finance & Business
  business_credit: {
    prompt_generator: '{"credit_building_roadmap": "string", "immediate_steps": ["string"], "vendor_credit_targets": ["string"], "bank_credit_progression": "string", "timeline_milestones": "string"}',
    agent_helper: '{"credit_strategy": "string", "action_plan": ["string"], "vendor_list": ["string"], "monitoring_plan": "string"}',
    general_generator: '{"credit_guidance": "string", "priority_actions": ["string"]}'
  },
  credit: {
    prompt_generator: '{"credit_analysis": "string", "improvement_strategy": "string", "dispute_approach": "string", "optimization_steps": ["string"], "timeline": "string"}',
    agent_helper: '{"credit_action_plan": "string", "dispute_letters": "string", "score_improvement_tactics": ["string"], "monitoring_recommendations": "string"}',
    general_generator: '{"credit_guidance": "string", "key_steps": ["string"]}'
  },
  day_trading: {
    prompt_generator: '{"trading_strategy": "string", "entry_rules": "string", "exit_rules": "string", "risk_management": "string", "setup_criteria": ["string"], "disclaimer": "string"}',
    agent_helper: '{"strategy_analysis": "string", "setup_conditions": "string", "trade_management": "string", "journal_template": "string", "risk_disclaimer": "string"}',
    general_generator: '{"trading_guidance": "string", "key_principles": ["string"], "risk_warning": "string"}'
  },
  trust_estate_info_gather: {
    prompt_generator: '{"information_checklist": ["string"], "asset_inventory": "string", "beneficiary_details": "string", "directive_requirements": "string", "professional_consultation_notes": "string"}',
    agent_helper: '{"estate_planning_overview": "string", "document_requirements": ["string"], "asset_organization": "string", "next_steps": ["string"]}',
    general_generator: '{"planning_guidance": "string", "required_information": ["string"]}'
  },
  business_entity_overview: {
    prompt_generator: '{"entity_comparison": "string", "recommended_structure": "string", "tax_implications": "string", "liability_analysis": "string", "formation_steps": ["string"]}',
    agent_helper: '{"entity_analysis": "string", "pros_cons": "string", "compliance_requirements": "string", "advisor_questions": ["string"]}',
    general_generator: '{"entity_guidance": "string", "key_considerations": ["string"]}'
  },

  // Specialized
  mcp_product_builder: {
    prompt_generator: '{"mcp_product_spec": "string", "tools_definition": "string", "resources_definition": "string", "prompts_definition": "string", "implementation_guide": "string"}',
    agent_helper: '{"mcp_architecture": "string", "capability_matrix": "string", "integration_plan": "string", "testing_approach": "string"}',
    general_generator: '{"mcp_concept": "string", "key_components": ["string"]}'
  },
  ethical_data_extraction: {
    prompt_generator: '{"data_collection_plan": "string", "ethical_framework": "string", "technical_approach": "string", "compliance_checklist": ["string"], "data_handling_policy": "string"}',
    agent_helper: '{"ethical_assessment": "string", "collection_methodology": "string", "privacy_safeguards": ["string"], "legal_considerations": "string"}',
    general_generator: '{"extraction_guidance": "string", "ethical_guidelines": ["string"]}'
  },
  seo_frameworks: {
    prompt_generator: '{"seo_strategy": "string", "keyword_framework": "string", "content_architecture": "string", "technical_priorities": ["string"], "link_strategy": "string"}',
    agent_helper: '{"seo_audit_framework": "string", "optimization_plan": "string", "keyword_clusters": ["string"], "quick_wins": ["string"]}',
    general_generator: '{"seo_guidance": "string", "priority_actions": ["string"]}'
  },
  elearning_builder: {
    prompt_generator: '{"course_outline": "string", "learning_objectives": ["string"], "module_breakdown": "string", "assessment_design": "string", "engagement_elements": ["string"]}',
    agent_helper: '{"instructional_design": "string", "curriculum_map": "string", "content_scripts": "string", "multimedia_plan": "string"}',
    general_generator: '{"course_concept": "string", "key_components": ["string"]}'
  },
  meditation_script: {
    prompt_generator: '{"meditation_script": "string", "duration_estimate": "string", "breathing_cues": ["string"], "visualization_elements": "string", "closing_intention": "string"}',
    agent_helper: '{"full_script": "string", "facilitator_notes": "string", "variation_options": ["string"], "music_suggestions": "string"}',
    general_generator: '{"meditation_guide": "string", "key_elements": ["string"]}'
  },
  lets_get_viral: {
    prompt_generator: '{"viral_concept": "string", "hook_options": ["string"], "content_format": "string", "share_triggers": ["string"], "platform_strategy": "string"}',
    agent_helper: '{"viral_strategy": "string", "content_series": ["string"], "community_activation": "string", "amplification_tactics": ["string"]}',
    general_generator: '{"viral_ideas": ["string"], "key_tactics": ["string"]}'
  },
  long_covid: {
    prompt_generator: '{"information_overview": "string", "symptom_guidance": "string", "management_strategies": ["string"], "resources": ["string"], "healthcare_guidance": "string", "disclaimer": "string"}',
    agent_helper: '{"comprehensive_resources": "string", "pacing_strategy": "string", "support_network_building": "string", "medical_consultation_guide": "string", "disclaimer": "string"}',
    general_generator: '{"support_guidance": "string", "key_resources": ["string"], "medical_disclaimer": "string"}'
  },
  music: {
    prompt_generator: '{"music_concept": "string", "arrangement_guide": "string", "production_direction": "string", "lyrics_concept": "string", "reference_tracks": ["string"]}',
    agent_helper: '{"composition_analysis": "string", "arrangement_details": "string", "production_specs": "string", "mix_direction": "string"}',
    general_generator: '{"music_ideas": "string", "creative_direction": ["string"]}'
  },
  service_business_sites: {
    prompt_generator: '{"site_strategy": "string", "homepage_copy": "string", "services_pages": ["string"], "trust_signals": ["string"], "conversion_elements": "string"}',
    agent_helper: '{"site_audit": "string", "copy_improvements": "string", "conversion_optimization": "string", "seo_recommendations": ["string"]}',
    general_generator: '{"site_plan": "string", "key_elements": ["string"]}'
  },
  website_building: {
    prompt_generator: '{"site_requirements": "string", "architecture_plan": "string", "tech_stack_recommendation": "string", "content_plan": "string", "launch_checklist": ["string"]}',
    agent_helper: '{"technical_spec": "string", "development_phases": ["string"], "integration_requirements": "string", "performance_targets": "string"}',
    general_generator: '{"build_plan": "string", "recommendations": ["string"]}'
  },
  photorealistic_images: {
    prompt_generator: '{"final_prompt": "string - ultra-detailed photorealistic prompt", "negative_prompt": "string", "camera_settings": "string", "lighting_setup": "string", "realism_enhancers": ["string"]}',
    agent_helper: '{"refined_prompt": "string", "negative_prompt": "string", "realism_checklist": ["string"], "variations": ["string"]}',
    general_generator: '{"photo_prompt": "string", "negative_prompt": "string", "technical_notes": "string"}'
  }
};

function getOutputStructure(category: Category, genType: GeneratorType): string {
  return OUTPUT_STRUCTURES[category]?.[genType] || '{"result": "string", "details": "string", "recommendations": ["string"]}';
}

// Generic OpenAI chat completion helper
export async function callOpenAIChat(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  options?: Partial<OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming>
): Promise<string> {
  const limit = pLimit(1);
  
  return limit(() =>
    pRetry(
      async () => {
        try {
          const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages,
            max_completion_tokens: 2000,
            ...options
          });

          const content = response.choices[0]?.message?.content;
          if (!content) {
            throw new Error("No content in response");
          }

          return content;
        } catch (error: any) {
          if (isRateLimitError(error)) {
            throw error;
          }
          throw new AbortError(error);
        }
      },
      {
        retries: 3,
        minTimeout: 1000,
        maxTimeout: 16000,
        factor: 2,
      }
    )
  );
}

// Generate prompt using OpenAI
export async function generatePrompt(
  category: Category,
  genType: GeneratorType,
  inputs: any
): Promise<any> {
  const limit = pLimit(1);
  
  return limit(() =>
    pRetry(
      async () => {
        try {
          const systemPrompt = buildSystemPrompt(category, genType);
          const userPrompt = buildUserPrompt(category, genType, inputs);
          const outputStructure = getOutputStructure(category, genType);

          const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `${userPrompt}\n\nReturn a JSON object matching exactly this structure:\n${outputStructure}` }
            ],
            response_format: { type: "json_object" },
            max_completion_tokens: 4096,
          });

          const content = response.choices[0]?.message?.content;
          if (!content) {
            throw new Error("No content in response");
          }

          const output = JSON.parse(content);
          
          return {
            output,
            metadata: {
              category,
              genType,
              timestamp: new Date().toISOString()
            }
          };
        } catch (error: any) {
          if (isRateLimitError(error)) {
            throw error;
          }
          throw new AbortError(error);
        }
      },
      {
        retries: 3,
        minTimeout: 1000,
        maxTimeout: 16000,
        factor: 2,
      }
    )
  );
}
