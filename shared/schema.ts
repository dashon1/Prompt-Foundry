import { z } from "zod";
import { pgTable, serial, varchar, text, timestamp, integer, jsonb, boolean, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";

// Preset constants
export const PHOTOREALISM_ADDON = "unsmoothed skin, real imperfections, true physics lighting, physically accurate textures, no CGI sheen, no stylized rendering, zero AI perfection artifacts";

export const IMAGE_DEFAULTS = {
  camera: { lens: "85mm", aperture: "f/1.8", angle: "eye-level" },
  lighting: { type: "soft diffused", direction: "3/4 back", time_of_day: "golden hour" }
};

export const VIDEO_DEFAULTS = {
  duration_seconds: 12,
  lens_family: "35–50mm",
  motion: "slow, stable"
};

// Category and Generator Type definitions
export const CATEGORIES = [
  "image", "video", "youtube_titles", "apps", "marketing_content",
  "visual_design", "av_production", "business_analysis", "dev_tasks",
  "personal_helper", "strategy_innovation", "data_decision",
  "hyper_personalization", "automation_augmentation", "content_creation",
  "science_rnd", "hr_operations",
  // Startup categories (24)
  "startup_idea_refinement", "lean_canvas", "startup_name_generator",
  "startup_competitor_mapping", "startup_customer_plan", "startup_mvp_prioritization",
  "startup_brand_voice", "startup_launch_checklist", "startup_pitch",
  "startup_content_calendar", "startup_offer_stack", "startup_roadmap",
  "startup_customer_avatar", "startup_brand_story", "startup_site_wireframe",
  "startup_productivity_system", "startup_email_sequence", "startup_pitch_deck",
  "startup_partnership_pipeline", "startup_objection_handling", "startup_stress_framework",
  "startup_skills_plan", "startup_feedback_loop", "startup_networking_system",
  "startup_customer_journey",
  // Food & Hospitality categories (5)
  "baking_formula", "food_business_concept", "event_food_planning",
  "food_social_content", "food",
  // Real Estate & Investment categories (5)
  "rei_market_research", "rei_acquisition_system", "rei_inspection_notes",
  "rei_investor", "real_estate",
  // Finance & Business categories (5)
  "business_credit", "credit", "day_trading",
  "trust_estate_info_gather", "business_entity_overview",
  // Specialized categories (11)
  "mcp_product_builder", "ethical_data_extraction", "seo_frameworks",
  "elearning_builder", "meditation_script", "lets_get_viral",
  "long_covid", "music", "service_business_sites", "website_building",
  "photorealistic_images"
] as const;

export const GENERATOR_TYPES = ["prompt_generator", "agent_helper", "general_generator"] as const;

export type Category = typeof CATEGORIES[number];
export type GeneratorType = typeof GENERATOR_TYPES[number];

// Image Generator Schemas
export const imagePromptGeneratorSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  setting: z.string().min(1, "Setting is required"),
  style_tags: z.array(z.string()).default([]),
  camera: z.object({
    lens: z.string().default("85mm"),
    focal_length_mm: z.number().default(85),
    aperture: z.string().default("f/1.8"),
    angle: z.string().default("eye-level"),
    distance: z.string().default("medium")
  }).default({}),
  lighting: z.object({
    type: z.string().default("soft diffused"),
    direction: z.string().default("3/4 back"),
    time_of_day: z.string().default("golden hour")
  }).default({}),
  mood: z.string().default(""),
  color_palette: z.array(z.string()).default([]),
  composition: z.string().default(""),
  technical: z.array(z.string()).default([]),
  negatives: z.array(z.string()).default([])
});

export const imageAgentHelperSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  setting: z.string().min(1, "Setting is required"),
  lighting_type: z.string().default("natural"),
  lens: z.string().default("50mm")
});

export const imageGeneralGeneratorSchema = z.object({
  item: z.string().min(1, "Item is required"),
  context: z.string().default(""),
  visual_intent: z.string().default(""),
  camera_prefs: z.string().default(""),
  lighting_prefs: z.string().default(""),
  mood: z.string().default(""),
  negatives: z.string().default("")
});

// Video Generator Schemas
export const videoPromptGeneratorSchema = z.object({
  concept: z.string().min(1, "Concept is required"),
  duration_seconds: z.number().default(12),
  shots: z.array(z.object({
    id: z.number(),
    description: z.string(),
    camera: z.string(),
    motion: z.string()
  })).default([]),
  look_and_feel: z.array(z.string()).default([]),
  audio: z.object({
    type: z.string().default("ambient"),
    notes: z.string().default("")
  }).default({})
});

export const videoAgentHelperSchema = z.object({
  duration_seconds: z.number().default(12),
  shots: z.array(z.object({
    description: z.string(),
    camera: z.string(),
    motion: z.string()
  })).default([]),
  audio: z.string().default("")
});

export const videoGeneralGeneratorSchema = z.object({
  topic_or_item: z.string().min(1, "Topic is required"),
  duration_seconds: z.number().default(12),
  visual_style: z.string().default(""),
  camera_style: z.string().default(""),
  audio_style: z.string().default("")
});

// YouTube Titles Generator Schemas
export const youtubeTitlesPromptGeneratorSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  audience: z.string().default(""),
  tone: z.string().default(""),
  constraints: z.object({
    max_words: z.number().default(10),
    power_words_required: z.boolean().default(false),
    case_style: z.string().default("title")
  }).default({}),
  quantity: z.number().default(5)
});

export const youtubeTitlesAgentHelperSchema = z.object({
  draft_titles: z.array(z.string()).min(1, "At least one draft title is required"),
  max_words: z.number().default(10),
  return_top_k: z.number().default(3)
});

export const youtubeTitlesGeneralGeneratorSchema = z.object({
  item_or_topic: z.string().min(1, "Topic is required"),
  angle: z.string().default(""),
  tone: z.string().default(""),
  max_words: z.number().default(10),
  count: z.number().default(5)
});

// Apps Generator Schemas
export const appsPromptGeneratorSchema = z.object({
  app_concept: z.string().min(1, "App concept is required"),
  platforms: z.array(z.string()).default([]),
  core_features: z.array(z.string()).default([]),
  non_functional: z.array(z.string()).default([]),
  stack_preferences: z.object({
    frontend: z.string().default(""),
    backend: z.string().default(""),
    db: z.string().default(""),
    auth: z.string().default("")
  }).default({})
});

export const appsAgentHelperSchema = z.object({
  core_features: z.array(z.string()).min(1, "At least one feature is required"),
  stack_preferences: z.object({
    frontend: z.string().default(""),
    backend: z.string().default(""),
    db: z.string().default(""),
    auth: z.string().default("")
  }).default({}),
  non_functional: z.array(z.string()).default([])
});

export const appsGeneralGeneratorSchema = z.object({
  item_type: z.string().default(""),
  goal: z.string().min(1, "Goal is required"),
  constraints: z.array(z.string()).default([]),
  language_or_stack: z.string().default(""),
  mode: z.string().default("")
});

// Marketing Content Generator Schemas
export const marketingContentPromptGeneratorSchema = z.object({
  asset_type: z.string().min(1, "Asset type is required"),
  topic: z.string().min(1, "Topic is required"),
  audience: z.string().default(""),
  goal: z.string().default(""),
  tone: z.string().default(""),
  length: z.string().default(""),
  keywords: z.array(z.string()).default([]),
  cta: z.string().default(""),
  channels: z.array(z.string()).default([])
});

export const marketingContentAgentHelperSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  audience: z.string().default(""),
  goal: z.string().default(""),
  keywords: z.array(z.string()).default([])
});

export const marketingContentGeneralGeneratorSchema = z.object({
  asset_type: z.string().default(""),
  topic: z.string().min(1, "Topic is required"),
  audience: z.string().default(""),
  goal: z.string().default(""),
  tone: z.string().default(""),
  length: z.string().default(""),
  mode: z.string().default("")
});

// Visual Design Generator Schemas
export const visualDesignPromptGeneratorSchema = z.object({
  artifact_type: z.string().min(1, "Artifact type is required"),
  theme: z.string().default(""),
  use_case: z.string().default(""),
  brand_attributes: z.array(z.string()).default([]),
  color_palette: z.array(z.string()).default([]),
  constraints: z.array(z.string()).default([]),
  deliverable_format: z.string().default("")
});

export const visualDesignAgentHelperSchema = z.object({
  brand_attributes: z.array(z.string()).default([]),
  color_palette: z.array(z.string()).default([]),
  export_formats: z.array(z.string()).default([])
});

export const visualDesignGeneralGeneratorSchema = z.object({
  artifact_type: z.string().min(1, "Artifact type is required"),
  theme: z.string().default(""),
  constraints: z.array(z.string()).default([]),
  export: z.string().default("")
});

// AV Production Generator Schemas
export const avProductionPromptGeneratorSchema = z.object({
  asset_type: z.string().min(1, "Asset type is required"),
  concept: z.string().min(1, "Concept is required"),
  duration: z.string().default(""),
  shots_or_sections: z.string().default(""),
  visual_style: z.string().default(""),
  audio_style: z.string().default(""),
  output_specs: z.string().default("")
});

export const avProductionAgentHelperSchema = z.object({
  duration_seconds: z.number().default(30),
  sections: z.number().default(3),
  audio_style: z.string().default("")
});

export const avProductionGeneralGeneratorSchema = z.object({
  asset_type: z.string().default(""),
  duration: z.string().default(""),
  style: z.string().default(""),
  audio: z.string().default("")
});

// Business Analysis Generator Schemas
export const businessAnalysisPromptGeneratorSchema = z.object({
  task: z.string().min(1, "Task is required"),
  data_sources: z.array(z.string()).default([]),
  scope: z.string().default(""),
  metrics_or_signals: z.array(z.string()).default([]),
  output_type: z.string().default(""),
  constraints: z.array(z.string()).default([])
});

export const businessAnalysisAgentHelperSchema = z.object({
  facts: z.array(z.string()).min(1, "At least one fact is required"),
  insight_targets: z.array(z.string()).default([])
});

export const businessAnalysisGeneralGeneratorSchema = z.object({
  analysis_type: z.string().default(""),
  topic: z.string().min(1, "Topic is required"),
  data_refs: z.string().default(""),
  audience: z.string().default("")
});

// Dev Tasks Generator Schemas
export const devTasksPromptGeneratorSchema = z.object({
  task_type: z.string().min(1, "Task type is required"),
  language: z.string().default(""),
  framework: z.string().default(""),
  constraints: z.array(z.string()).default([]),
  context: z.string().default("")
});

export const devTasksAgentHelperSchema = z.object({
  code: z.string().min(1, "Code is required"),
  language: z.string().default("")
});

export const devTasksGeneralGeneratorSchema = z.object({
  mode: z.string().default(""),
  language: z.string().default(""),
  framework: z.string().default(""),
  goal: z.string().min(1, "Goal is required"),
  constraints: z.array(z.string()).default([])
});

// Personal Helper Generator Schemas
export const personalHelperPromptGeneratorSchema = z.object({
  task: z.string().min(1, "Task is required"),
  context: z.string().default(""),
  tone: z.string().default(""),
  length: z.string().default(""),
  extras: z.array(z.string()).default([])
});

export const personalHelperAgentHelperSchema = z.object({
  intent: z.string().min(1, "Intent is required"),
  constraints: z.array(z.string()).default([])
});

export const personalHelperGeneralGeneratorSchema = z.object({
  item_type: z.string().default(""),
  topic_or_destination: z.string().min(1, "Topic is required"),
  constraints: z.array(z.string()).default([]),
  tone: z.string().default("")
});

// Strategy Innovation Generator Schemas
export const strategyInnovationPromptGeneratorSchema = z.object({
  initiative_type: z.string().min(1, "Initiative type is required"),
  objective: z.string().min(1, "Objective is required"),
  market_context: z.string().default(""),
  constraints: z.array(z.string()).default([]),
  horizon: z.string().default(""),
  stakeholders: z.array(z.string()).default([])
});

export const strategyInnovationAgentHelperSchema = z.object({
  objective: z.string().min(1, "Objective is required"),
  decision_window: z.string().default("")
});

export const strategyInnovationGeneralGeneratorSchema = z.object({
  mode: z.string().default(""),
  goal: z.string().min(1, "Goal is required"),
  context: z.string().default(""),
  constraints: z.array(z.string()).default([])
});

// Data Decision Generator Schemas
export const dataDecisionPromptGeneratorSchema = z.object({
  task: z.string().min(1, "Task is required"),
  datasets: z.array(z.string()).default([]),
  target_metric: z.string().default(""),
  time_window: z.string().default(""),
  constraints: z.array(z.string()).default([]),
  explainability: z.string().default("")
});

export const dataDecisionAgentHelperSchema = z.object({
  data_profile: z.string().min(1, "Data profile is required")
});

export const dataDecisionGeneralGeneratorSchema = z.object({
  analysis_type: z.string().default(""),
  question: z.string().min(1, "Question is required"),
  data_refs: z.array(z.string()).default([]),
  audience: z.string().default("")
});

// Hyper Personalization Generator Schemas
export const hyperPersonalizationPromptGeneratorSchema = z.object({
  channel: z.string().min(1, "Channel is required"),
  persona: z.string().min(1, "Persona is required"),
  goal: z.string().default(""),
  content_types: z.array(z.string()).default([]),
  constraints: z.array(z.string()).default([]),
  variants: z.number().default(3)
});

export const hyperPersonalizationAgentHelperSchema = z.object({
  persona_fields: z.array(z.string()).min(1, "At least one persona field is required"),
  messages: z.array(z.string()).default([])
});

export const hyperPersonalizationGeneralGeneratorSchema = z.object({
  asset: z.string().min(1, "Asset is required"),
  persona: z.string().min(1, "Persona is required"),
  goal: z.string().default(""),
  fields: z.array(z.string()).default([]),
  count: z.number().default(3)
});

// Automation Augmentation Generator Schemas
export const automationAugmentationPromptGeneratorSchema = z.object({
  use_case: z.string().min(1, "Use case is required"),
  systems: z.array(z.string()).default([]),
  triggers: z.array(z.string()).default([]),
  actions: z.array(z.string()).default([]),
  human_in_loop: z.string().default(""),
  slo: z.string().default("")
});

export const automationAugmentationAgentHelperSchema = z.object({
  steps: z.array(z.string()).min(1, "At least one step is required"),
  permissions: z.array(z.string()).default([])
});

export const automationAugmentationGeneralGeneratorSchema = z.object({
  goal: z.string().min(1, "Goal is required"),
  apps: z.array(z.string()).default([]),
  trigger: z.string().default(""),
  steps: z.array(z.string()).default([]),
  approvals: z.string().default("")
});

// Content Creation Generator Schemas
export const contentCreationPromptGeneratorSchema = z.object({
  artifact: z.string().min(1, "Artifact is required"),
  goal: z.string().default(""),
  constraints: z.array(z.string()).default([]),
  quantity: z.number().default(1),
  structure: z.string().default("")
});

export const contentCreationAgentHelperSchema = z.object({
  topics: z.array(z.string()).min(1, "At least one topic is required")
});

export const contentCreationGeneralGeneratorSchema = z.object({
  artifact: z.string().min(1, "Artifact is required"),
  count: z.number().default(1),
  style: z.string().default(""),
  constraints: z.array(z.string()).default([])
});

// Science R&D Generator Schemas
export const scienceRndPromptGeneratorSchema = z.object({
  field: z.string().min(1, "Field is required"),
  hypothesis: z.string().min(1, "Hypothesis is required"),
  data_or_sim: z.string().default(""),
  constraints: z.array(z.string()).default([]),
  success_criteria: z.string().default("")
});

export const scienceRndAgentHelperSchema = z.object({
  variables: z.array(z.string()).min(1, "At least one variable is required")
});

export const scienceRndGeneralGeneratorSchema = z.object({
  study_type: z.string().default(""),
  goal: z.string().min(1, "Goal is required"),
  resources: z.string().default(""),
  constraints: z.array(z.string()).default([])
});

// HR Operations Generator Schemas
export const hrOperationsPromptGeneratorSchema = z.object({
  task: z.string().min(1, "Task is required"),
  role_or_team: z.string().default(""),
  criteria: z.array(z.string()).default([]),
  constraints: z.array(z.string()).default([]),
  output_type: z.string().default("")
});

export const hrOperationsAgentHelperSchema = z.object({
  criteria: z.array(z.string()).min(1, "At least one criterion is required"),
  weights: z.array(z.number()).default([])
});

export const hrOperationsGeneralGeneratorSchema = z.object({
  process: z.string().min(1, "Process is required"),
  goal: z.string().default(""),
  constraints: z.array(z.string()).default([]),
  stakeholders: z.array(z.string()).default([])
});

// ======================================
// STARTUP GENERATORS (24 categories)
// ======================================

// Startup Idea Refinement
export const startupIdeaRefinementPromptGeneratorSchema = z.object({
  raw_idea: z.string().min(1, "Raw idea is required"),
  target_customer: z.string().default(""),
  differentiator: z.string().default("")
});

export const startupIdeaRefinementAgentHelperSchema = z.object({
  raw_idea: z.string().min(1, "Raw idea is required")
});

export const startupIdeaRefinementGeneralGeneratorSchema = z.object({
  raw_idea: z.string().min(1, "Raw idea is required")
});

// Lean Canvas
export const leanCanvasPromptGeneratorSchema = z.object({
  business_type: z.string().min(1, "Business type is required"),
  customer_segment: z.string().default("")
});

export const leanCanvasAgentHelperSchema = z.object({
  business_type: z.string().min(1, "Business type is required")
});

export const leanCanvasGeneralGeneratorSchema = z.object({
  business_type: z.string().min(1, "Business type is required")
});

// Startup Name Generator
export const startupNameGeneratorPromptGeneratorSchema = z.object({
  industry: z.string().min(1, "Industry is required"),
  keywords: z.array(z.string()).default([]),
  style: z.string().default("")
});

export const startupNameGeneratorAgentHelperSchema = z.object({
  industry: z.string().min(1, "Industry is required")
});

export const startupNameGeneratorGeneralGeneratorSchema = z.object({
  industry: z.string().min(1, "Industry is required"),
  keywords: z.array(z.string()).default([])
});

// Startup Competitor Mapping
export const startupCompetitorMappingPromptGeneratorSchema = z.object({
  your_product: z.string().min(1, "Your product is required"),
  market: z.string().default(""),
  competitors: z.array(z.string()).default([])
});

export const startupCompetitorMappingAgentHelperSchema = z.object({
  your_product: z.string().min(1, "Your product is required")
});

export const startupCompetitorMappingGeneralGeneratorSchema = z.object({
  your_product: z.string().min(1, "Your product is required"),
  market: z.string().default("")
});

// Startup Customer Plan
export const startupCustomerPlanPromptGeneratorSchema = z.object({
  product: z.string().min(1, "Product is required"),
  target_segment: z.string().default(""),
  acquisition_channels: z.array(z.string()).default([])
});

export const startupCustomerPlanAgentHelperSchema = z.object({
  product: z.string().min(1, "Product is required")
});

export const startupCustomerPlanGeneralGeneratorSchema = z.object({
  product: z.string().min(1, "Product is required"),
  target_segment: z.string().default("")
});

// Startup MVP Prioritization
export const startupMvpPrioritizationPromptGeneratorSchema = z.object({
  features: z.array(z.string()).min(1, "At least one feature is required"),
  goal: z.string().default(""),
  constraints: z.string().default("")
});

export const startupMvpPrioritizationAgentHelperSchema = z.object({
  features: z.array(z.string()).min(1, "At least one feature is required")
});

export const startupMvpPrioritizationGeneralGeneratorSchema = z.object({
  features: z.array(z.string()).min(1, "At least one feature is required"),
  goal: z.string().default("")
});

// Startup Brand Voice
export const startupBrandVoicePromptGeneratorSchema = z.object({
  brand_name: z.string().min(1, "Brand name is required"),
  industry: z.string().default(""),
  values: z.array(z.string()).default([]),
  target_audience: z.string().default("")
});

export const startupBrandVoiceAgentHelperSchema = z.object({
  brand_name: z.string().min(1, "Brand name is required")
});

export const startupBrandVoiceGeneralGeneratorSchema = z.object({
  brand_name: z.string().min(1, "Brand name is required"),
  values: z.array(z.string()).default([])
});

// Startup Launch Checklist
export const startupLaunchChecklistPromptGeneratorSchema = z.object({
  product_type: z.string().min(1, "Product type is required"),
  launch_date: z.string().default(""),
  team_size: z.string().default("")
});

export const startupLaunchChecklistAgentHelperSchema = z.object({
  product_type: z.string().min(1, "Product type is required")
});

export const startupLaunchChecklistGeneralGeneratorSchema = z.object({
  product_type: z.string().min(1, "Product type is required")
});

// Startup Pitch
export const startupPitchPromptGeneratorSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  problem: z.string().default(""),
  solution: z.string().default(""),
  market_size: z.string().default(""),
  traction: z.string().default("")
});

export const startupPitchAgentHelperSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  problem: z.string().default("")
});

export const startupPitchGeneralGeneratorSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  elevator_pitch: z.string().default("")
});

// Startup Content Calendar
export const startupContentCalendarPromptGeneratorSchema = z.object({
  platforms: z.array(z.string()).default([]),
  frequency: z.string().default(""),
  content_pillars: z.array(z.string()).default([]),
  duration_weeks: z.number().default(4)
});

export const startupContentCalendarAgentHelperSchema = z.object({
  platforms: z.array(z.string()).min(1, "At least one platform is required")
});

export const startupContentCalendarGeneralGeneratorSchema = z.object({
  content_focus: z.string().min(1, "Content focus is required"),
  duration_weeks: z.number().default(4)
});

// Startup Offer Stack
export const startupOfferStackPromptGeneratorSchema = z.object({
  product_service: z.string().min(1, "Product/service is required"),
  price_point: z.string().default(""),
  target_customer: z.string().default("")
});

export const startupOfferStackAgentHelperSchema = z.object({
  product_service: z.string().min(1, "Product/service is required")
});

export const startupOfferStackGeneralGeneratorSchema = z.object({
  product_service: z.string().min(1, "Product/service is required")
});

// Startup Roadmap
export const startupRoadmapPromptGeneratorSchema = z.object({
  vision: z.string().min(1, "Vision is required"),
  timeframe: z.string().default(""),
  milestones: z.array(z.string()).default([])
});

export const startupRoadmapAgentHelperSchema = z.object({
  vision: z.string().min(1, "Vision is required")
});

export const startupRoadmapGeneralGeneratorSchema = z.object({
  vision: z.string().min(1, "Vision is required"),
  timeframe: z.string().default("")
});

// Startup Customer Avatar
export const startupCustomerAvatarPromptGeneratorSchema = z.object({
  product: z.string().min(1, "Product is required"),
  industry: z.string().default(""),
  demographics: z.string().default(""),
  psychographics: z.string().default("")
});

export const startupCustomerAvatarAgentHelperSchema = z.object({
  product: z.string().min(1, "Product is required")
});

export const startupCustomerAvatarGeneralGeneratorSchema = z.object({
  product: z.string().min(1, "Product is required")
});

// Startup Brand Story
export const startupBrandStoryPromptGeneratorSchema = z.object({
  founder_story: z.string().default(""),
  problem_discovered: z.string().default(""),
  mission: z.string().min(1, "Mission is required")
});

export const startupBrandStoryAgentHelperSchema = z.object({
  mission: z.string().min(1, "Mission is required")
});

export const startupBrandStoryGeneralGeneratorSchema = z.object({
  mission: z.string().min(1, "Mission is required")
});

// Startup Site Wireframe
export const startupSiteWireframePromptGeneratorSchema = z.object({
  site_type: z.string().min(1, "Site type is required"),
  pages: z.array(z.string()).default([]),
  key_features: z.array(z.string()).default([])
});

export const startupSiteWireframeAgentHelperSchema = z.object({
  site_type: z.string().min(1, "Site type is required")
});

export const startupSiteWireframeGeneralGeneratorSchema = z.object({
  site_type: z.string().min(1, "Site type is required"),
  pages: z.array(z.string()).default([])
});

// Startup Productivity System
export const startupProductivitySystemPromptGeneratorSchema = z.object({
  role: z.string().min(1, "Role is required"),
  goals: z.array(z.string()).default([]),
  constraints: z.string().default("")
});

export const startupProductivitySystemAgentHelperSchema = z.object({
  role: z.string().min(1, "Role is required")
});

export const startupProductivitySystemGeneralGeneratorSchema = z.object({
  role: z.string().min(1, "Role is required")
});

// Startup Email Sequence
export const startupEmailSequencePromptGeneratorSchema = z.object({
  goal: z.string().min(1, "Goal is required"),
  audience: z.string().default(""),
  sequence_length: z.number().default(5),
  tone: z.string().default("")
});

export const startupEmailSequenceAgentHelperSchema = z.object({
  goal: z.string().min(1, "Goal is required")
});

export const startupEmailSequenceGeneralGeneratorSchema = z.object({
  goal: z.string().min(1, "Goal is required"),
  sequence_length: z.number().default(5)
});

// Startup Pitch Deck
export const startupPitchDeckPromptGeneratorSchema = z.object({
  company: z.string().min(1, "Company name is required"),
  slides_needed: z.array(z.string()).default([]),
  audience: z.string().default("")
});

export const startupPitchDeckAgentHelperSchema = z.object({
  company: z.string().min(1, "Company name is required")
});

export const startupPitchDeckGeneralGeneratorSchema = z.object({
  company: z.string().min(1, "Company name is required")
});

// Startup Partnership Pipeline
export const startupPartnershipPipelinePromptGeneratorSchema = z.object({
  company: z.string().min(1, "Company name is required"),
  partnership_type: z.string().default(""),
  target_partners: z.array(z.string()).default([])
});

export const startupPartnershipPipelineAgentHelperSchema = z.object({
  company: z.string().min(1, "Company name is required")
});

export const startupPartnershipPipelineGeneralGeneratorSchema = z.object({
  company: z.string().min(1, "Company name is required")
});

// Startup Objection Handling
export const startupObjectionHandlingPromptGeneratorSchema = z.object({
  product: z.string().min(1, "Product is required"),
  common_objections: z.array(z.string()).default([]),
  target_market: z.string().default("")
});

export const startupObjectionHandlingAgentHelperSchema = z.object({
  product: z.string().min(1, "Product is required")
});

export const startupObjectionHandlingGeneralGeneratorSchema = z.object({
  product: z.string().min(1, "Product is required")
});

// Startup Stress Framework
export const startupStressFrameworkPromptGeneratorSchema = z.object({
  role: z.string().min(1, "Role is required"),
  stressors: z.array(z.string()).default([]),
  support_available: z.string().default("")
});

export const startupStressFrameworkAgentHelperSchema = z.object({
  role: z.string().min(1, "Role is required")
});

export const startupStressFrameworkGeneralGeneratorSchema = z.object({
  role: z.string().min(1, "Role is required")
});

// Startup Skills Plan
export const startupSkillsPlanPromptGeneratorSchema = z.object({
  current_role: z.string().min(1, "Current role is required"),
  target_role: z.string().default(""),
  timeframe: z.string().default("")
});

export const startupSkillsPlanAgentHelperSchema = z.object({
  current_role: z.string().min(1, "Current role is required")
});

export const startupSkillsPlanGeneralGeneratorSchema = z.object({
  current_role: z.string().min(1, "Current role is required")
});

// Startup Feedback Loop
export const startupFeedbackLoopPromptGeneratorSchema = z.object({
  product: z.string().min(1, "Product is required"),
  feedback_channels: z.array(z.string()).default([]),
  frequency: z.string().default("")
});

export const startupFeedbackLoopAgentHelperSchema = z.object({
  product: z.string().min(1, "Product is required")
});

export const startupFeedbackLoopGeneralGeneratorSchema = z.object({
  product: z.string().min(1, "Product is required")
});

// Startup Networking System
export const startupNetworkingSystemPromptGeneratorSchema = z.object({
  goals: z.array(z.string()).min(1, "At least one goal is required"),
  industry: z.string().default(""),
  time_commitment: z.string().default("")
});

export const startupNetworkingSystemAgentHelperSchema = z.object({
  goals: z.array(z.string()).min(1, "At least one goal is required")
});

export const startupNetworkingSystemGeneralGeneratorSchema = z.object({
  goals: z.array(z.string()).min(1, "At least one goal is required")
});

// Startup Customer Journey
export const startupCustomerJourneyPromptGeneratorSchema = z.object({
  product: z.string().min(1, "Product is required"),
  customer_type: z.string().default(""),
  touchpoints: z.array(z.string()).default([])
});

export const startupCustomerJourneyAgentHelperSchema = z.object({
  product: z.string().min(1, "Product is required")
});

export const startupCustomerJourneyGeneralGeneratorSchema = z.object({
  product: z.string().min(1, "Product is required")
});

// ======================================
// FOOD & HOSPITALITY GENERATORS (5 categories)
// ======================================

// Baking Formula
export const bakingFormulaPromptGeneratorSchema = z.object({
  product_type: z.string().min(1, "Product type is required"),
  batch_size: z.string().default(""),
  dietary_requirements: z.array(z.string()).default([])
});

export const bakingFormulaAgentHelperSchema = z.object({
  product_type: z.string().min(1, "Product type is required")
});

export const bakingFormulaGeneralGeneratorSchema = z.object({
  product_type: z.string().min(1, "Product type is required")
});

// Food Business Concept
export const foodBusinessConceptPromptGeneratorSchema = z.object({
  concept: z.string().min(1, "Concept is required"),
  cuisine_type: z.string().default(""),
  target_market: z.string().default("")
});

export const foodBusinessConceptAgentHelperSchema = z.object({
  concept: z.string().min(1, "Concept is required")
});

export const foodBusinessConceptGeneralGeneratorSchema = z.object({
  concept: z.string().min(1, "Concept is required")
});

// Event Food Planning
export const eventFoodPlanningPromptGeneratorSchema = z.object({
  event_type: z.string().min(1, "Event type is required"),
  guest_count: z.number().default(50),
  dietary_restrictions: z.array(z.string()).default([]),
  budget: z.string().default("")
});

export const eventFoodPlanningAgentHelperSchema = z.object({
  event_type: z.string().min(1, "Event type is required"),
  guest_count: z.number().default(50)
});

export const eventFoodPlanningGeneralGeneratorSchema = z.object({
  event_type: z.string().min(1, "Event type is required"),
  guest_count: z.number().default(50)
});

// Food Social Content
export const foodSocialContentPromptGeneratorSchema = z.object({
  dish_or_brand: z.string().min(1, "Dish or brand is required"),
  platform: z.string().default(""),
  content_type: z.string().default(""),
  quantity: z.number().default(5)
});

export const foodSocialContentAgentHelperSchema = z.object({
  dish_or_brand: z.string().min(1, "Dish or brand is required")
});

export const foodSocialContentGeneralGeneratorSchema = z.object({
  dish_or_brand: z.string().min(1, "Dish or brand is required"),
  quantity: z.number().default(5)
});

// Food (General)
export const foodPromptGeneratorSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  cuisine: z.string().default(""),
  goal: z.string().default("")
});

export const foodAgentHelperSchema = z.object({
  topic: z.string().min(1, "Topic is required")
});

export const foodGeneralGeneratorSchema = z.object({
  topic: z.string().min(1, "Topic is required")
});

// ======================================
// REAL ESTATE & INVESTMENT GENERATORS (5 categories)
// ======================================

// REI Market Research
export const reiMarketResearchPromptGeneratorSchema = z.object({
  location: z.string().min(1, "Location is required"),
  property_type: z.string().default(""),
  investment_goals: z.array(z.string()).default([])
});

export const reiMarketResearchAgentHelperSchema = z.object({
  location: z.string().min(1, "Location is required")
});

export const reiMarketResearchGeneralGeneratorSchema = z.object({
  location: z.string().min(1, "Location is required")
});

// REI Acquisition System
export const reiAcquisitionSystemPromptGeneratorSchema = z.object({
  strategy: z.string().min(1, "Strategy is required"),
  budget: z.string().default(""),
  target_properties: z.string().default("")
});

export const reiAcquisitionSystemAgentHelperSchema = z.object({
  strategy: z.string().min(1, "Strategy is required")
});

export const reiAcquisitionSystemGeneralGeneratorSchema = z.object({
  strategy: z.string().min(1, "Strategy is required")
});

// REI Inspection Notes
export const reiInspectionNotesPromptGeneratorSchema = z.object({
  property_address: z.string().min(1, "Property address is required"),
  property_type: z.string().default(""),
  inspection_focus: z.array(z.string()).default([])
});

export const reiInspectionNotesAgentHelperSchema = z.object({
  property_address: z.string().min(1, "Property address is required")
});

export const reiInspectionNotesGeneralGeneratorSchema = z.object({
  property_address: z.string().min(1, "Property address is required")
});

// REI Investor
export const reiInvestorPromptGeneratorSchema = z.object({
  investment_type: z.string().min(1, "Investment type is required"),
  goals: z.array(z.string()).default([]),
  experience_level: z.string().default("")
});

export const reiInvestorAgentHelperSchema = z.object({
  investment_type: z.string().min(1, "Investment type is required")
});

export const reiInvestorGeneralGeneratorSchema = z.object({
  investment_type: z.string().min(1, "Investment type is required")
});

// Real Estate (General)
export const realEstatePromptGeneratorSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  market: z.string().default(""),
  goal: z.string().default("")
});

export const realEstateAgentHelperSchema = z.object({
  topic: z.string().min(1, "Topic is required")
});

export const realEstateGeneralGeneratorSchema = z.object({
  topic: z.string().min(1, "Topic is required")
});

// ======================================
// FINANCE & BUSINESS GENERATORS (5 categories)
// ======================================

// Business Credit
export const businessCreditPromptGeneratorSchema = z.object({
  business_type: z.string().min(1, "Business type is required"),
  goal: z.string().default(""),
  current_status: z.string().default("")
});

export const businessCreditAgentHelperSchema = z.object({
  business_type: z.string().min(1, "Business type is required")
});

export const businessCreditGeneralGeneratorSchema = z.object({
  business_type: z.string().min(1, "Business type is required")
});

// Credit (General)
export const creditPromptGeneratorSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  goal: z.string().default(""),
  context: z.string().default("")
});

export const creditAgentHelperSchema = z.object({
  topic: z.string().min(1, "Topic is required")
});

export const creditGeneralGeneratorSchema = z.object({
  topic: z.string().min(1, "Topic is required")
});

// Day Trading
export const dayTradingPromptGeneratorSchema = z.object({
  strategy: z.string().min(1, "Strategy is required"),
  market: z.string().default(""),
  risk_tolerance: z.string().default("")
});

export const dayTradingAgentHelperSchema = z.object({
  strategy: z.string().min(1, "Strategy is required")
});

export const dayTradingGeneralGeneratorSchema = z.object({
  strategy: z.string().min(1, "Strategy is required")
});

// Trust Estate Info Gather
export const trustEstateInfoGatherPromptGeneratorSchema = z.object({
  estate_type: z.string().min(1, "Estate type is required"),
  jurisdiction: z.string().default(""),
  goals: z.array(z.string()).default([])
});

export const trustEstateInfoGatherAgentHelperSchema = z.object({
  estate_type: z.string().min(1, "Estate type is required")
});

export const trustEstateInfoGatherGeneralGeneratorSchema = z.object({
  estate_type: z.string().min(1, "Estate type is required")
});

// Business Entity Overview
export const businessEntityOverviewPromptGeneratorSchema = z.object({
  entity_type: z.string().min(1, "Entity type is required"),
  industry: z.string().default(""),
  jurisdiction: z.string().default("")
});

export const businessEntityOverviewAgentHelperSchema = z.object({
  entity_type: z.string().min(1, "Entity type is required")
});

export const businessEntityOverviewGeneralGeneratorSchema = z.object({
  entity_type: z.string().min(1, "Entity type is required")
});

// ======================================
// SPECIALIZED GENERATORS (11 categories)
// ======================================

// MCP Product Builder
export const mcpProductBuilderPromptGeneratorSchema = z.object({
  product_idea: z.string().min(1, "Product idea is required"),
  target_market: z.string().default(""),
  features: z.array(z.string()).default([])
});

export const mcpProductBuilderAgentHelperSchema = z.object({
  product_idea: z.string().min(1, "Product idea is required")
});

export const mcpProductBuilderGeneralGeneratorSchema = z.object({
  product_idea: z.string().min(1, "Product idea is required")
});

// Ethical Data Extraction
export const ethicalDataExtractionPromptGeneratorSchema = z.object({
  data_source: z.string().min(1, "Data source is required"),
  purpose: z.string().default(""),
  constraints: z.array(z.string()).default([])
});

export const ethicalDataExtractionAgentHelperSchema = z.object({
  data_source: z.string().min(1, "Data source is required")
});

export const ethicalDataExtractionGeneralGeneratorSchema = z.object({
  data_source: z.string().min(1, "Data source is required")
});

// SEO Frameworks
export const seoFrameworksPromptGeneratorSchema = z.object({
  website_type: z.string().min(1, "Website type is required"),
  target_keywords: z.array(z.string()).default([]),
  goals: z.array(z.string()).default([])
});

export const seoFrameworksAgentHelperSchema = z.object({
  website_type: z.string().min(1, "Website type is required")
});

export const seoFrameworksGeneralGeneratorSchema = z.object({
  website_type: z.string().min(1, "Website type is required")
});

// eLearning Builder
export const elearningBuilderPromptGeneratorSchema = z.object({
  course_topic: z.string().min(1, "Course topic is required"),
  audience: z.string().default(""),
  duration: z.string().default(""),
  learning_objectives: z.array(z.string()).default([])
});

export const elearningBuilderAgentHelperSchema = z.object({
  course_topic: z.string().min(1, "Course topic is required")
});

export const elearningBuilderGeneralGeneratorSchema = z.object({
  course_topic: z.string().min(1, "Course topic is required")
});

// Meditation Script
export const meditationScriptPromptGeneratorSchema = z.object({
  theme: z.string().min(1, "Theme is required"),
  duration_minutes: z.number().default(10),
  style: z.string().default("")
});

export const meditationScriptAgentHelperSchema = z.object({
  theme: z.string().min(1, "Theme is required")
});

export const meditationScriptGeneralGeneratorSchema = z.object({
  theme: z.string().min(1, "Theme is required"),
  duration_minutes: z.number().default(10)
});

// Let's Get Viral
export const letsGetViralPromptGeneratorSchema = z.object({
  content_idea: z.string().min(1, "Content idea is required"),
  platform: z.string().default(""),
  target_audience: z.string().default("")
});

export const letsGetViralAgentHelperSchema = z.object({
  content_idea: z.string().min(1, "Content idea is required")
});

export const letsGetViralGeneralGeneratorSchema = z.object({
  content_idea: z.string().min(1, "Content idea is required")
});

// Long COVID
export const longCovidPromptGeneratorSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  focus_area: z.string().default(""),
  audience: z.string().default("")
});

export const longCovidAgentHelperSchema = z.object({
  topic: z.string().min(1, "Topic is required")
});

export const longCovidGeneralGeneratorSchema = z.object({
  topic: z.string().min(1, "Topic is required")
});

// Music
export const musicPromptGeneratorSchema = z.object({
  genre: z.string().min(1, "Genre is required"),
  mood: z.string().default(""),
  instruments: z.array(z.string()).default([]),
  purpose: z.string().default("")
});

export const musicAgentHelperSchema = z.object({
  genre: z.string().min(1, "Genre is required")
});

export const musicGeneralGeneratorSchema = z.object({
  genre: z.string().min(1, "Genre is required")
});

// Service Business Sites
export const serviceBusinessSitesPromptGeneratorSchema = z.object({
  service_type: z.string().min(1, "Service type is required"),
  target_market: z.string().default(""),
  key_services: z.array(z.string()).default([])
});

export const serviceBusinessSitesAgentHelperSchema = z.object({
  service_type: z.string().min(1, "Service type is required")
});

export const serviceBusinessSitesGeneralGeneratorSchema = z.object({
  service_type: z.string().min(1, "Service type is required")
});

// Website Building
export const websiteBuildingPromptGeneratorSchema = z.object({
  site_purpose: z.string().min(1, "Site purpose is required"),
  pages: z.array(z.string()).default([]),
  features: z.array(z.string()).default([]),
  tech_stack: z.string().default("")
});

export const websiteBuildingAgentHelperSchema = z.object({
  site_purpose: z.string().min(1, "Site purpose is required")
});

export const websiteBuildingGeneralGeneratorSchema = z.object({
  site_purpose: z.string().min(1, "Site purpose is required")
});

// Photorealistic Images (Enhanced)
export const photorealisticImagesPromptGeneratorSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  setting: z.string().min(1, "Setting is required"),
  lighting: z.string().default(""),
  camera_settings: z.string().default(""),
  realism_level: z.string().default("high"),
  details: z.array(z.string()).default([])
});

export const photorealisticImagesAgentHelperSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  setting: z.string().min(1, "Setting is required")
});

export const photorealisticImagesGeneralGeneratorSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  realism_level: z.string().default("high")
});

// Generator Request and Response types
export interface GeneratorRequest {
  category: Category;
  genType: GeneratorType;
  inputs: any;
}

export interface GeneratorResponse {
  output: any;
  metadata?: {
    category: Category;
    genType: GeneratorType;
    timestamp: string;
  };
}

// Helper type to get schema by category and type
export type GeneratorSchemas = {
  [K in Category]: {
    [T in GeneratorType]: z.ZodSchema;
  };
};

export const GENERATOR_SCHEMAS: GeneratorSchemas = {
  image: {
    prompt_generator: imagePromptGeneratorSchema,
    agent_helper: imageAgentHelperSchema,
    general_generator: imageGeneralGeneratorSchema
  },
  video: {
    prompt_generator: videoPromptGeneratorSchema,
    agent_helper: videoAgentHelperSchema,
    general_generator: videoGeneralGeneratorSchema
  },
  youtube_titles: {
    prompt_generator: youtubeTitlesPromptGeneratorSchema,
    agent_helper: youtubeTitlesAgentHelperSchema,
    general_generator: youtubeTitlesGeneralGeneratorSchema
  },
  apps: {
    prompt_generator: appsPromptGeneratorSchema,
    agent_helper: appsAgentHelperSchema,
    general_generator: appsGeneralGeneratorSchema
  },
  marketing_content: {
    prompt_generator: marketingContentPromptGeneratorSchema,
    agent_helper: marketingContentAgentHelperSchema,
    general_generator: marketingContentGeneralGeneratorSchema
  },
  visual_design: {
    prompt_generator: visualDesignPromptGeneratorSchema,
    agent_helper: visualDesignAgentHelperSchema,
    general_generator: visualDesignGeneralGeneratorSchema
  },
  av_production: {
    prompt_generator: avProductionPromptGeneratorSchema,
    agent_helper: avProductionAgentHelperSchema,
    general_generator: avProductionGeneralGeneratorSchema
  },
  business_analysis: {
    prompt_generator: businessAnalysisPromptGeneratorSchema,
    agent_helper: businessAnalysisAgentHelperSchema,
    general_generator: businessAnalysisGeneralGeneratorSchema
  },
  dev_tasks: {
    prompt_generator: devTasksPromptGeneratorSchema,
    agent_helper: devTasksAgentHelperSchema,
    general_generator: devTasksGeneralGeneratorSchema
  },
  personal_helper: {
    prompt_generator: personalHelperPromptGeneratorSchema,
    agent_helper: personalHelperAgentHelperSchema,
    general_generator: personalHelperGeneralGeneratorSchema
  },
  strategy_innovation: {
    prompt_generator: strategyInnovationPromptGeneratorSchema,
    agent_helper: strategyInnovationAgentHelperSchema,
    general_generator: strategyInnovationGeneralGeneratorSchema
  },
  data_decision: {
    prompt_generator: dataDecisionPromptGeneratorSchema,
    agent_helper: dataDecisionAgentHelperSchema,
    general_generator: dataDecisionGeneralGeneratorSchema
  },
  hyper_personalization: {
    prompt_generator: hyperPersonalizationPromptGeneratorSchema,
    agent_helper: hyperPersonalizationAgentHelperSchema,
    general_generator: hyperPersonalizationGeneralGeneratorSchema
  },
  automation_augmentation: {
    prompt_generator: automationAugmentationPromptGeneratorSchema,
    agent_helper: automationAugmentationAgentHelperSchema,
    general_generator: automationAugmentationGeneralGeneratorSchema
  },
  content_creation: {
    prompt_generator: contentCreationPromptGeneratorSchema,
    agent_helper: contentCreationAgentHelperSchema,
    general_generator: contentCreationGeneralGeneratorSchema
  },
  science_rnd: {
    prompt_generator: scienceRndPromptGeneratorSchema,
    agent_helper: scienceRndAgentHelperSchema,
    general_generator: scienceRndGeneralGeneratorSchema
  },
  hr_operations: {
    prompt_generator: hrOperationsPromptGeneratorSchema,
    agent_helper: hrOperationsAgentHelperSchema,
    general_generator: hrOperationsGeneralGeneratorSchema
  },
  // Startup Categories
  startup_idea_refinement: {
    prompt_generator: startupIdeaRefinementPromptGeneratorSchema,
    agent_helper: startupIdeaRefinementAgentHelperSchema,
    general_generator: startupIdeaRefinementGeneralGeneratorSchema
  },
  lean_canvas: {
    prompt_generator: leanCanvasPromptGeneratorSchema,
    agent_helper: leanCanvasAgentHelperSchema,
    general_generator: leanCanvasGeneralGeneratorSchema
  },
  startup_name_generator: {
    prompt_generator: startupNameGeneratorPromptGeneratorSchema,
    agent_helper: startupNameGeneratorAgentHelperSchema,
    general_generator: startupNameGeneratorGeneralGeneratorSchema
  },
  startup_competitor_mapping: {
    prompt_generator: startupCompetitorMappingPromptGeneratorSchema,
    agent_helper: startupCompetitorMappingAgentHelperSchema,
    general_generator: startupCompetitorMappingGeneralGeneratorSchema
  },
  startup_customer_plan: {
    prompt_generator: startupCustomerPlanPromptGeneratorSchema,
    agent_helper: startupCustomerPlanAgentHelperSchema,
    general_generator: startupCustomerPlanGeneralGeneratorSchema
  },
  startup_mvp_prioritization: {
    prompt_generator: startupMvpPrioritizationPromptGeneratorSchema,
    agent_helper: startupMvpPrioritizationAgentHelperSchema,
    general_generator: startupMvpPrioritizationGeneralGeneratorSchema
  },
  startup_brand_voice: {
    prompt_generator: startupBrandVoicePromptGeneratorSchema,
    agent_helper: startupBrandVoiceAgentHelperSchema,
    general_generator: startupBrandVoiceGeneralGeneratorSchema
  },
  startup_launch_checklist: {
    prompt_generator: startupLaunchChecklistPromptGeneratorSchema,
    agent_helper: startupLaunchChecklistAgentHelperSchema,
    general_generator: startupLaunchChecklistGeneralGeneratorSchema
  },
  startup_pitch: {
    prompt_generator: startupPitchPromptGeneratorSchema,
    agent_helper: startupPitchAgentHelperSchema,
    general_generator: startupPitchGeneralGeneratorSchema
  },
  startup_content_calendar: {
    prompt_generator: startupContentCalendarPromptGeneratorSchema,
    agent_helper: startupContentCalendarAgentHelperSchema,
    general_generator: startupContentCalendarGeneralGeneratorSchema
  },
  startup_offer_stack: {
    prompt_generator: startupOfferStackPromptGeneratorSchema,
    agent_helper: startupOfferStackAgentHelperSchema,
    general_generator: startupOfferStackGeneralGeneratorSchema
  },
  startup_roadmap: {
    prompt_generator: startupRoadmapPromptGeneratorSchema,
    agent_helper: startupRoadmapAgentHelperSchema,
    general_generator: startupRoadmapGeneralGeneratorSchema
  },
  startup_customer_avatar: {
    prompt_generator: startupCustomerAvatarPromptGeneratorSchema,
    agent_helper: startupCustomerAvatarAgentHelperSchema,
    general_generator: startupCustomerAvatarGeneralGeneratorSchema
  },
  startup_brand_story: {
    prompt_generator: startupBrandStoryPromptGeneratorSchema,
    agent_helper: startupBrandStoryAgentHelperSchema,
    general_generator: startupBrandStoryGeneralGeneratorSchema
  },
  startup_site_wireframe: {
    prompt_generator: startupSiteWireframePromptGeneratorSchema,
    agent_helper: startupSiteWireframeAgentHelperSchema,
    general_generator: startupSiteWireframeGeneralGeneratorSchema
  },
  startup_productivity_system: {
    prompt_generator: startupProductivitySystemPromptGeneratorSchema,
    agent_helper: startupProductivitySystemAgentHelperSchema,
    general_generator: startupProductivitySystemGeneralGeneratorSchema
  },
  startup_email_sequence: {
    prompt_generator: startupEmailSequencePromptGeneratorSchema,
    agent_helper: startupEmailSequenceAgentHelperSchema,
    general_generator: startupEmailSequenceGeneralGeneratorSchema
  },
  startup_pitch_deck: {
    prompt_generator: startupPitchDeckPromptGeneratorSchema,
    agent_helper: startupPitchDeckAgentHelperSchema,
    general_generator: startupPitchDeckGeneralGeneratorSchema
  },
  startup_partnership_pipeline: {
    prompt_generator: startupPartnershipPipelinePromptGeneratorSchema,
    agent_helper: startupPartnershipPipelineAgentHelperSchema,
    general_generator: startupPartnershipPipelineGeneralGeneratorSchema
  },
  startup_objection_handling: {
    prompt_generator: startupObjectionHandlingPromptGeneratorSchema,
    agent_helper: startupObjectionHandlingAgentHelperSchema,
    general_generator: startupObjectionHandlingGeneralGeneratorSchema
  },
  startup_stress_framework: {
    prompt_generator: startupStressFrameworkPromptGeneratorSchema,
    agent_helper: startupStressFrameworkAgentHelperSchema,
    general_generator: startupStressFrameworkGeneralGeneratorSchema
  },
  startup_skills_plan: {
    prompt_generator: startupSkillsPlanPromptGeneratorSchema,
    agent_helper: startupSkillsPlanAgentHelperSchema,
    general_generator: startupSkillsPlanGeneralGeneratorSchema
  },
  startup_feedback_loop: {
    prompt_generator: startupFeedbackLoopPromptGeneratorSchema,
    agent_helper: startupFeedbackLoopAgentHelperSchema,
    general_generator: startupFeedbackLoopGeneralGeneratorSchema
  },
  startup_networking_system: {
    prompt_generator: startupNetworkingSystemPromptGeneratorSchema,
    agent_helper: startupNetworkingSystemAgentHelperSchema,
    general_generator: startupNetworkingSystemGeneralGeneratorSchema
  },
  startup_customer_journey: {
    prompt_generator: startupCustomerJourneyPromptGeneratorSchema,
    agent_helper: startupCustomerJourneyAgentHelperSchema,
    general_generator: startupCustomerJourneyGeneralGeneratorSchema
  },
  // Food & Hospitality Categories
  baking_formula: {
    prompt_generator: bakingFormulaPromptGeneratorSchema,
    agent_helper: bakingFormulaAgentHelperSchema,
    general_generator: bakingFormulaGeneralGeneratorSchema
  },
  food_business_concept: {
    prompt_generator: foodBusinessConceptPromptGeneratorSchema,
    agent_helper: foodBusinessConceptAgentHelperSchema,
    general_generator: foodBusinessConceptGeneralGeneratorSchema
  },
  event_food_planning: {
    prompt_generator: eventFoodPlanningPromptGeneratorSchema,
    agent_helper: eventFoodPlanningAgentHelperSchema,
    general_generator: eventFoodPlanningGeneralGeneratorSchema
  },
  food_social_content: {
    prompt_generator: foodSocialContentPromptGeneratorSchema,
    agent_helper: foodSocialContentAgentHelperSchema,
    general_generator: foodSocialContentGeneralGeneratorSchema
  },
  food: {
    prompt_generator: foodPromptGeneratorSchema,
    agent_helper: foodAgentHelperSchema,
    general_generator: foodGeneralGeneratorSchema
  },
  // Real Estate & Investment Categories
  rei_market_research: {
    prompt_generator: reiMarketResearchPromptGeneratorSchema,
    agent_helper: reiMarketResearchAgentHelperSchema,
    general_generator: reiMarketResearchGeneralGeneratorSchema
  },
  rei_acquisition_system: {
    prompt_generator: reiAcquisitionSystemPromptGeneratorSchema,
    agent_helper: reiAcquisitionSystemAgentHelperSchema,
    general_generator: reiAcquisitionSystemGeneralGeneratorSchema
  },
  rei_inspection_notes: {
    prompt_generator: reiInspectionNotesPromptGeneratorSchema,
    agent_helper: reiInspectionNotesAgentHelperSchema,
    general_generator: reiInspectionNotesGeneralGeneratorSchema
  },
  rei_investor: {
    prompt_generator: reiInvestorPromptGeneratorSchema,
    agent_helper: reiInvestorAgentHelperSchema,
    general_generator: reiInvestorGeneralGeneratorSchema
  },
  real_estate: {
    prompt_generator: realEstatePromptGeneratorSchema,
    agent_helper: realEstateAgentHelperSchema,
    general_generator: realEstateGeneralGeneratorSchema
  },
  // Finance & Business Categories
  business_credit: {
    prompt_generator: businessCreditPromptGeneratorSchema,
    agent_helper: businessCreditAgentHelperSchema,
    general_generator: businessCreditGeneralGeneratorSchema
  },
  credit: {
    prompt_generator: creditPromptGeneratorSchema,
    agent_helper: creditAgentHelperSchema,
    general_generator: creditGeneralGeneratorSchema
  },
  day_trading: {
    prompt_generator: dayTradingPromptGeneratorSchema,
    agent_helper: dayTradingAgentHelperSchema,
    general_generator: dayTradingGeneralGeneratorSchema
  },
  trust_estate_info_gather: {
    prompt_generator: trustEstateInfoGatherPromptGeneratorSchema,
    agent_helper: trustEstateInfoGatherAgentHelperSchema,
    general_generator: trustEstateInfoGatherGeneralGeneratorSchema
  },
  business_entity_overview: {
    prompt_generator: businessEntityOverviewPromptGeneratorSchema,
    agent_helper: businessEntityOverviewAgentHelperSchema,
    general_generator: businessEntityOverviewGeneralGeneratorSchema
  },
  // Specialized Categories
  mcp_product_builder: {
    prompt_generator: mcpProductBuilderPromptGeneratorSchema,
    agent_helper: mcpProductBuilderAgentHelperSchema,
    general_generator: mcpProductBuilderGeneralGeneratorSchema
  },
  ethical_data_extraction: {
    prompt_generator: ethicalDataExtractionPromptGeneratorSchema,
    agent_helper: ethicalDataExtractionAgentHelperSchema,
    general_generator: ethicalDataExtractionGeneralGeneratorSchema
  },
  seo_frameworks: {
    prompt_generator: seoFrameworksPromptGeneratorSchema,
    agent_helper: seoFrameworksAgentHelperSchema,
    general_generator: seoFrameworksGeneralGeneratorSchema
  },
  elearning_builder: {
    prompt_generator: elearningBuilderPromptGeneratorSchema,
    agent_helper: elearningBuilderAgentHelperSchema,
    general_generator: elearningBuilderGeneralGeneratorSchema
  },
  meditation_script: {
    prompt_generator: meditationScriptPromptGeneratorSchema,
    agent_helper: meditationScriptAgentHelperSchema,
    general_generator: meditationScriptGeneralGeneratorSchema
  },
  lets_get_viral: {
    prompt_generator: letsGetViralPromptGeneratorSchema,
    agent_helper: letsGetViralAgentHelperSchema,
    general_generator: letsGetViralGeneralGeneratorSchema
  },
  long_covid: {
    prompt_generator: longCovidPromptGeneratorSchema,
    agent_helper: longCovidAgentHelperSchema,
    general_generator: longCovidGeneralGeneratorSchema
  },
  music: {
    prompt_generator: musicPromptGeneratorSchema,
    agent_helper: musicAgentHelperSchema,
    general_generator: musicGeneralGeneratorSchema
  },
  service_business_sites: {
    prompt_generator: serviceBusinessSitesPromptGeneratorSchema,
    agent_helper: serviceBusinessSitesAgentHelperSchema,
    general_generator: serviceBusinessSitesGeneralGeneratorSchema
  },
  website_building: {
    prompt_generator: websiteBuildingPromptGeneratorSchema,
    agent_helper: websiteBuildingAgentHelperSchema,
    general_generator: websiteBuildingGeneralGeneratorSchema
  },
  photorealistic_images: {
    prompt_generator: photorealisticImagesPromptGeneratorSchema,
    agent_helper: photorealisticImagesAgentHelperSchema,
    general_generator: photorealisticImagesGeneralGeneratorSchema
  }
};

// Category metadata for UI display
export interface CategoryMetadata {
  id: Category;
  name: string;
  description: string;
  icon: string;
}

export const CATEGORY_METADATA: CategoryMetadata[] = [
  { id: "image", name: "Image Generation", description: "Create detailed image prompts with camera, lighting, and style controls", icon: "Camera" },
  { id: "video", name: "Video Production", description: "Design video sequences with shots, motion, and audio specifications", icon: "Video" },
  { id: "youtube_titles", name: "YouTube Titles", description: "Generate engaging YouTube titles optimized for click-through", icon: "Youtube" },
  { id: "apps", name: "App Development", description: "Plan app architecture, features, and technical stack", icon: "Smartphone" },
  { id: "marketing_content", name: "Marketing Content", description: "Create marketing copy, campaigns, and content strategies", icon: "TrendingUp" },
  { id: "visual_design", name: "Visual Design", description: "Design brand assets, layouts, and visual systems", icon: "Palette" },
  { id: "av_production", name: "AV Production", description: "Plan audio-visual projects with detailed production specs", icon: "Film" },
  { id: "business_analysis", name: "Business Analysis", description: "Analyze business data and generate insights", icon: "BarChart" },
  { id: "dev_tasks", name: "Dev Tasks", description: "Code review, debugging, and development assistance", icon: "Code" },
  { id: "personal_helper", name: "Personal Helper", description: "Drafts, emails, planning, and personal productivity", icon: "UserCheck" },
  { id: "strategy_innovation", name: "Strategy & Innovation", description: "Strategic planning and innovation frameworks", icon: "Lightbulb" },
  { id: "data_decision", name: "Data & Decision", description: "Data analysis and decision support systems", icon: "Database" },
  { id: "hyper_personalization", name: "Hyper Personalization", description: "Create personalized content variants at scale", icon: "Users" },
  { id: "automation_augmentation", name: "Automation & Augmentation", description: "Design workflows and automation systems", icon: "Zap" },
  { id: "content_creation", name: "Content Creation", description: "Batch content generation for blogs, social, and more", icon: "FileText" },
  { id: "science_rnd", name: "Science R&D", description: "Research protocols and experimental design", icon: "Microscope" },
  { id: "hr_operations", name: "HR Operations", description: "HR processes, rubrics, and operational procedures", icon: "Briefcase" },
  // Startup Categories
  { id: "startup_idea_refinement", name: "Startup Idea Refinement", description: "Refine and validate your startup concepts with structured analysis", icon: "Lightbulb" },
  { id: "lean_canvas", name: "Lean Canvas", description: "Create lean business model canvases for startups", icon: "Layout" },
  { id: "startup_name_generator", name: "Startup Name Generator", description: "Generate creative and memorable startup names", icon: "Sparkles" },
  { id: "startup_competitor_mapping", name: "Competitor Mapping", description: "Map and analyze your competitive landscape", icon: "Target" },
  { id: "startup_customer_plan", name: "Customer Acquisition Plan", description: "Build customer acquisition and growth strategies", icon: "Users" },
  { id: "startup_mvp_prioritization", name: "MVP Prioritization", description: "Prioritize features for your minimum viable product", icon: "ListChecks" },
  { id: "startup_brand_voice", name: "Brand Voice", description: "Define your startup's unique brand voice and tone", icon: "MessageSquare" },
  { id: "startup_launch_checklist", name: "Launch Checklist", description: "Comprehensive startup launch preparation checklist", icon: "ClipboardCheck" },
  { id: "startup_pitch", name: "Startup Pitch", description: "Craft compelling pitches for investors and customers", icon: "Presentation" },
  { id: "startup_content_calendar", name: "Content Calendar", description: "Plan and organize your startup's content strategy", icon: "Calendar" },
  { id: "startup_offer_stack", name: "Offer Stack", description: "Design irresistible product and service offerings", icon: "Package" },
  { id: "startup_roadmap", name: "Product Roadmap", description: "Create strategic product development roadmaps", icon: "Map" },
  { id: "startup_customer_avatar", name: "Customer Avatar", description: "Define detailed customer personas and avatars", icon: "UserCircle" },
  { id: "startup_brand_story", name: "Brand Story", description: "Craft authentic and engaging brand narratives", icon: "BookOpen" },
  { id: "startup_site_wireframe", name: "Site Wireframe", description: "Plan website structure and user flows", icon: "Layout" },
  { id: "startup_productivity_system", name: "Productivity System", description: "Design productivity workflows for founders", icon: "Clock" },
  { id: "startup_email_sequence", name: "Email Sequence", description: "Create effective email marketing sequences", icon: "Mail" },
  { id: "startup_pitch_deck", name: "Pitch Deck", description: "Build investor-ready pitch deck content", icon: "FileSlides" },
  { id: "startup_partnership_pipeline", name: "Partnership Pipeline", description: "Develop strategic partnership strategies", icon: "Handshake" },
  { id: "startup_objection_handling", name: "Objection Handling", description: "Handle sales objections effectively", icon: "Shield" },
  { id: "startup_stress_framework", name: "Stress Management", description: "Build resilience and manage founder stress", icon: "Heart" },
  { id: "startup_skills_plan", name: "Skills Development", description: "Plan skill acquisition for startup success", icon: "GraduationCap" },
  { id: "startup_feedback_loop", name: "Feedback Loop", description: "Design customer feedback collection systems", icon: "MessageCircle" },
  { id: "startup_networking_system", name: "Networking System", description: "Build effective professional networking strategies", icon: "Network" },
  { id: "startup_customer_journey", name: "Customer Journey", description: "Map complete customer experience journeys", icon: "Route" },
  // Food & Hospitality Categories
  { id: "baking_formula", name: "Baking Formula", description: "Create precise baking recipes and formulas", icon: "Cookie" },
  { id: "food_business_concept", name: "Food Business Concept", description: "Develop food business ideas and concepts", icon: "Store" },
  { id: "event_food_planning", name: "Event Food Planning", description: "Plan catering and food for events", icon: "PartyPopper" },
  { id: "food_social_content", name: "Food Social Content", description: "Generate engaging food content for social media", icon: "Instagram" },
  { id: "food", name: "Food & Culinary", description: "General food and culinary content generation", icon: "UtensilsCrossed" },
  // Real Estate & Investment Categories
  { id: "rei_market_research", name: "REI Market Research", description: "Research real estate investment markets", icon: "Search" },
  { id: "rei_acquisition_system", name: "REI Acquisition System", description: "Build property acquisition strategies", icon: "Home" },
  { id: "rei_inspection_notes", name: "REI Inspection Notes", description: "Create property inspection documentation", icon: "ClipboardList" },
  { id: "rei_investor", name: "REI Investor Tools", description: "Tools and strategies for real estate investors", icon: "Building" },
  { id: "real_estate", name: "Real Estate", description: "General real estate content and tools", icon: "Building2" },
  // Finance & Business Categories
  { id: "business_credit", name: "Business Credit", description: "Build and manage business credit strategies", icon: "CreditCard" },
  { id: "credit", name: "Credit Management", description: "Personal and business credit guidance", icon: "Wallet" },
  { id: "day_trading", name: "Day Trading", description: "Day trading strategies and analysis", icon: "TrendingUp" },
  { id: "trust_estate_info_gather", name: "Trust & Estate Planning", description: "Estate and trust planning documentation", icon: "FileCheck" },
  { id: "business_entity_overview", name: "Business Entity Guide", description: "Business entity structure guidance", icon: "Building" },
  // Specialized Categories
  { id: "mcp_product_builder", name: "MCP Product Builder", description: "Build Model Context Protocol products", icon: "Blocks" },
  { id: "ethical_data_extraction", name: "Ethical Data Extraction", description: "Responsible data collection and usage", icon: "Shield" },
  { id: "seo_frameworks", name: "SEO Frameworks", description: "Search engine optimization strategies", icon: "Search" },
  { id: "elearning_builder", name: "eLearning Builder", description: "Create online courses and learning content", icon: "BookOpen" },
  { id: "meditation_script", name: "Meditation Scripts", description: "Write guided meditation and mindfulness scripts", icon: "Brain" },
  { id: "lets_get_viral", name: "Viral Content", description: "Create content optimized for viral potential", icon: "Rocket" },
  { id: "long_covid", name: "Long COVID Resources", description: "Long COVID information and support resources", icon: "HeartPulse" },
  { id: "music", name: "Music Creation", description: "Music composition and production guidance", icon: "Music" },
  { id: "service_business_sites", name: "Service Business Sites", description: "Service business website planning", icon: "Wrench" },
  { id: "website_building", name: "Website Building", description: "Complete website development planning", icon: "Globe" },
  { id: "photorealistic_images", name: "Photorealistic Images", description: "Ultra-realistic image generation prompts", icon: "Camera" }
];

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => ({
    expireIdx: index("IDX_session_expire").on(table.expire)
  })
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const presets = pgTable("presets", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(),
  genType: varchar("gen_type", { length: 100 }).notNull(),
  inputs: jsonb("inputs").notNull(),
  isFavorite: boolean("is_favorite").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  userIdIdx: index("presets_user_id_idx").on(table.userId),
  categoryIdx: index("presets_category_idx").on(table.category)
}));

export const generationHistory = pgTable("generation_history", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  category: varchar("category", { length: 100 }).notNull(),
  genType: varchar("gen_type", { length: 100 }).notNull(),
  inputs: jsonb("inputs").notNull(),
  output: jsonb("output").notNull(),
  isFavorite: boolean("is_favorite").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow()
}, (table) => ({
  userIdIdx: index("history_user_id_idx").on(table.userId),
  categoryIdx: index("history_category_idx").on(table.category),
  createdAtIdx: index("history_created_at_idx").on(table.createdAt)
}));

export const sharedLinks = pgTable("shared_links", {
  id: serial("id").primaryKey(),
  shareId: varchar("share_id", { length: 20 }).notNull().unique(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  category: varchar("category", { length: 100 }).notNull(),
  genType: varchar("gen_type", { length: 100 }).notNull(),
  inputs: jsonb("inputs").notNull(),
  output: jsonb("output").notNull(),
  viewCount: integer("view_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow()
}, (table) => ({
  shareIdIdx: index("shared_links_share_id_idx").on(table.shareId)
}));

export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  keyHash: varchar("key_hash", { length: 255 }).notNull().unique(),
  keyPreview: varchar("key_preview", { length: 20 }).notNull(),
  rateLimit: integer("rate_limit").notNull().default(100),
  requestCount: integer("request_count").notNull().default(0),
  lastUsedAt: timestamp("last_used_at"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow()
}, (table) => ({
  userIdIdx: index("api_keys_user_id_idx").on(table.userId),
  keyHashIdx: index("api_keys_key_hash_idx").on(table.keyHash)
}));

export const n8nWorkflows = pgTable("n8n_workflows", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  workflowData: jsonb("workflow_data").notNull(),
  workflowType: varchar("workflow_type", { length: 100 }),
  nodesUsed: text("nodes_used").array(),
  tags: text("tags").array(),
  isFavorite: boolean("is_favorite").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  userIdIdx: index("n8n_workflows_user_id_idx").on(table.userId),
  workflowTypeIdx: index("n8n_workflows_type_idx").on(table.workflowType)
}));

// Insert schemas for type safety
export const insertPresetSchema = createInsertSchema(presets).omit({ id: true, createdAt: true, updatedAt: true });
export const insertGenerationHistorySchema = createInsertSchema(generationHistory).omit({ id: true, createdAt: true });
export const insertSharedLinkSchema = createInsertSchema(sharedLinks).omit({ id: true, createdAt: true });
export const insertApiKeySchema = createInsertSchema(apiKeys).omit({ id: true, createdAt: true });
export const insertN8nWorkflowSchema = createInsertSchema(n8nWorkflows).omit({ id: true, createdAt: true, updatedAt: true });

// User types for Replit Auth compatibility
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Select types
export type Preset = typeof presets.$inferSelect;
export type GenerationHistory = typeof generationHistory.$inferSelect;
export type SharedLink = typeof sharedLinks.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;
export type N8nWorkflow = typeof n8nWorkflows.$inferSelect;

// Insert types
export type InsertPreset = z.infer<typeof insertPresetSchema>;
export type InsertGenerationHistory = z.infer<typeof insertGenerationHistorySchema>;
export type InsertSharedLink = z.infer<typeof insertSharedLinkSchema>;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type InsertN8nWorkflow = z.infer<typeof insertN8nWorkflowSchema>;
