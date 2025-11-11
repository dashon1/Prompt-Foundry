export type GeneratorType = "prompt_generator" | "agent_helper" | "general";

export interface PromptGenerator {
  category: string;
  type: "prompt_generator";
  role?: string;
  inputs: Record<string, string>;
  template: string;
}

export interface AgentHelper {
  category: string;
  type: "agent_helper";
  checks: string[];
}

export interface GeneralGenerator {
  category: string;
  type: "general";
  inputs: Record<string, string>;
  output?: string;
}

export type PromptSpec = PromptGenerator | AgentHelper | GeneralGenerator;