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
  "science_rnd", "hr_operations"
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
  { id: "hr_operations", name: "HR Operations", description: "HR processes, rubrics, and operational procedures", icon: "Briefcase" }
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

// Insert schemas for type safety
export const insertPresetSchema = createInsertSchema(presets).omit({ id: true, createdAt: true, updatedAt: true });
export const insertGenerationHistorySchema = createInsertSchema(generationHistory).omit({ id: true, createdAt: true });
export const insertSharedLinkSchema = createInsertSchema(sharedLinks).omit({ id: true, createdAt: true });
export const insertApiKeySchema = createInsertSchema(apiKeys).omit({ id: true, createdAt: true });

// User types for Replit Auth compatibility
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Select types
export type Preset = typeof presets.$inferSelect;
export type GenerationHistory = typeof generationHistory.$inferSelect;
export type SharedLink = typeof sharedLinks.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;

// Insert types
export type InsertPreset = z.infer<typeof insertPresetSchema>;
export type InsertGenerationHistory = z.infer<typeof insertGenerationHistorySchema>;
export type InsertSharedLink = z.infer<typeof insertSharedLinkSchema>;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
