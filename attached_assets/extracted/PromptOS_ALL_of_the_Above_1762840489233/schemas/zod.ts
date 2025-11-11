import { z } from "zod";

export const PromptGeneratorSchema = z.object({
  category: z.string(),
  type: z.literal("prompt_generator"),
  role: z.string().optional(),
  inputs: z.record(z.string()),
  template: z.string()
});

export const AgentHelperSchema = z.object({
  category: z.string(),
  type: z.literal("agent_helper"),
  checks: z.array(z.string())
});

export const GeneralGeneratorSchema = z.object({
  category: z.string(),
  type: z.literal("general"),
  inputs: z.record(z.string()),
  output: z.string().optional()
});

export const PromptSpecSchema = z.union([
  PromptGeneratorSchema, AgentHelperSchema, GeneralGeneratorSchema
]);