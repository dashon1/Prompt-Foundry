import OpenAI from "openai";
import pLimit from "p-limit";
import pRetry from "p-retry";
import type { Category, GeneratorType } from "@shared/schema";

// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access without requiring your own OpenAI API key.
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

// Helper function to check if error is rate limit or quota violation
function isRateLimitError(error: any): boolean {
  const errorMsg = error?.message || String(error);
  return (
    errorMsg.includes("429") ||
    errorMsg.includes("RATELIMIT_EXCEEDED") ||
    errorMsg.toLowerCase().includes("quota") ||
    errorMsg.toLowerCase().includes("rate limit")
  );
}

// Build the system prompt for a given category and generator type
function buildSystemPrompt(category: Category, genType: GeneratorType): string {
  const categoryName = category.replace(/_/g, " ");
  const typeName = genType.replace(/_/g, " ");
  
  return `You are an expert ${categoryName} ${typeName}. Your role is to generate high-quality, detailed prompts based on user inputs.

IMPORTANT GUIDELINES:
- Generate comprehensive, professional outputs
- Use industry best practices and terminology
- Be specific and actionable
- Follow the exact output format requested
- For image prompts: Include camera settings, lighting, mood, composition
- For video prompts: Include shots, motion, audio specifications
- For marketing/content: Focus on audience, goals, and engagement
- For technical prompts: Be precise with technical specifications
- Always return valid JSON matching the expected output structure

Your output must be a JSON object with the exact fields specified for this generator type.`;
}

// Build the user prompt from inputs
function buildUserPrompt(category: Category, genType: GeneratorType, inputs: any): string {
  let prompt = `Generate a ${category} ${genType} with the following specifications:\n\n`;
  
  // Add all input fields
  Object.entries(inputs).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          prompt += `${key}: ${JSON.stringify(value)}\n`;
        }
      } else if (typeof value === "object") {
        prompt += `${key}: ${JSON.stringify(value, null, 2)}\n`;
      } else {
        prompt += `${key}: ${value}\n`;
      }
    }
  });

  // Add output format instructions based on generator type
  prompt += `\n\nPlease return a JSON object with the appropriate output fields for this ${category} ${genType}.`;
  
  return prompt;
}

// Determine expected output structure
function getOutputStructure(category: Category, genType: GeneratorType): string {
  // Define output structures for each category/type combination
  const outputStructures: Record<string, Record<string, string>> = {
    image: {
      prompt_generator: '{"final_prompt": "string"}',
      agent_helper: '{"final_prompt": "string", "negatives": ["string"]}',
      general_generator: '{"final_prompt": "string"}'
    },
    video: {
      prompt_generator: '{"sequence_prompt": "string"}',
      agent_helper: '{"sequence_prompt": "string", "shot_table": "string"}',
      general_generator: '{"sequence_prompt": "string"}'
    },
    youtube_titles: {
      prompt_generator: '{"titles": ["string"]}',
      agent_helper: '{"ranked_titles": ["string"], "notes": "string"}',
      general_generator: '{"titles": ["string"]}'
    },
    apps: {
      prompt_generator: '{"outline": "string"}',
      agent_helper: '{"architecture_outline": "string", "risk_notes": "string"}',
      general_generator: '{"result": "string"}'
    },
    marketing_content: {
      prompt_generator: '{"brief": "string"}',
      agent_helper: '{"funnel_stage": "string", "outline": "string", "brief": "string"}',
      general_generator: '{"content": "string"}'
    },
    visual_design: {
      prompt_generator: '{"design_brief": "string"}',
      agent_helper: '{"layout_systems": "string", "handoff_specs": "string", "qa_checklist": ["string"]}',
      general_generator: '{"brief": "string"}'
    },
    av_production: {
      prompt_generator: '{"plan": "string"}',
      agent_helper: '{"shotlist": "string", "timecodes": "string", "continuity_notes": "string"}',
      general_generator: '{"plan": "string"}'
    },
    business_analysis: {
      prompt_generator: '{"brief": "string"}',
      agent_helper: '{"insights": "string", "actions": "string", "caveats": "string"}',
      general_generator: '{"analysis": "string"}'
    },
    dev_tasks: {
      prompt_generator: '{"code_and_explanation": "string"}',
      agent_helper: '{"review_notes": "string", "improvements": "string", "tests": "string"}',
      general_generator: '{"result": "string"}'
    },
    personal_helper: {
      prompt_generator: '{"draft": "string", "checklist": ["string"]}',
      agent_helper: '{"variant_a": "string", "variant_b": "string", "final": "string", "next_steps": ["string"]}',
      general_generator: '{"content": "string", "actions": ["string"]}'
    },
    strategy_innovation: {
      prompt_generator: '{"strategic_brief": "string"}',
      agent_helper: '{"scenarios": "string", "risks": "string", "decision_rules": "string"}',
      general_generator: '{"strategy": "string"}'
    },
    data_decision: {
      prompt_generator: '{"analysis_plan": "string"}',
      agent_helper: '{"top_signals": "string", "validation": "string", "decision_pack": "string"}',
      general_generator: '{"analysis": "string"}'
    },
    hyper_personalization: {
      prompt_generator: '{"variants": "string"}',
      agent_helper: '{"field_map": "string", "scores": "string", "notes": "string"}',
      general_generator: '{"variants": "string", "test_plan": "string"}'
    },
    automation_augmentation: {
      prompt_generator: '{"workflow_design": "string"}',
      agent_helper: '{"runbook": "string", "metrics": ["string"]}',
      general_generator: '{"workflow": "string"}'
    },
    content_creation: {
      prompt_generator: '{"batch_plan": "string"}',
      agent_helper: '{"canonical_list": "string", "scores": "string", "samples_for_review": "string", "production_batch": "string"}',
      general_generator: '{"brief": "string", "variants": "string", "qc": "string"}'
    },
    science_rnd: {
      prompt_generator: '{"experiment_plan": "string"}',
      agent_helper: '{"protocol": "string", "data_schema": "string", "analysis_plan": "string"}',
      general_generator: '{"protocol_or_sim": "string"}'
    },
    hr_operations: {
      prompt_generator: '{"sop_or_rubric": "string"}',
      agent_helper: '{"sop": "string", "audit_trail": "string"}',
      general_generator: '{"sop": "string"}'
    }
  };

  return outputStructures[category]?.[genType] || '{"result": "string"}';
}

// Generate prompt using OpenAI
export async function generatePrompt(
  category: Category,
  genType: GeneratorType,
  inputs: any
): Promise<any> {
  const limit = pLimit(1); // Process one at a time for single requests
  
  return limit(() =>
    pRetry(
      async () => {
        try {
          const systemPrompt = buildSystemPrompt(category, genType);
          const userPrompt = buildUserPrompt(category, genType, inputs);
          const outputStructure = getOutputStructure(category, genType);

          const response = await openai.chat.completions.create({
            model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt + `\n\nExpected output format: ${outputStructure}` }
            ],
            response_format: { type: "json_object" },
            max_completion_tokens: 8192,
          });

          const content = response.choices[0]?.message?.content;
          if (!content) {
            throw new Error("No content in response");
          }

          // Parse and validate JSON response
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
          // Check if it's a rate limit error
          if (isRateLimitError(error)) {
            throw error; // Rethrow to trigger p-retry
          }
          // For non-rate-limit errors, throw immediately (don't retry)
          throw new pRetry.AbortError(error);
        }
      },
      {
        retries: 7,
        minTimeout: 2000,
        maxTimeout: 128000,
        factor: 2,
      }
    )
  );
}
