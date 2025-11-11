import { GENERATOR_SCHEMAS, CATEGORIES, GENERATOR_TYPES, type Category, type GeneratorType } from "@shared/schema";

export interface N8nWorkflow {
  id?: string | number;
  name?: string;
  nodes?: Array<{
    id?: string;
    name: string;
    type: string;
    position?: number[];
    parameters?: any;
  }>;
  connections?: any;
  settings?: any;
  active?: boolean;
  [key: string]: any;
}

export interface PromptConfig {
  category?: Category;
  genType?: GeneratorType;
  inputs?: any;
  [key: string]: any;
}

export type DetectedJSONType = 
  | { type: "n8n_workflow"; workflow: N8nWorkflow; confidence: number }
  | { type: "prompt_config"; category: Category; genType: GeneratorType; inputs: any; confidence: number }
  | { type: "unknown"; error: string };

export function detectJSONType(jsonData: any): DetectedJSONType {
  if (!jsonData || typeof jsonData !== 'object') {
    return { type: "unknown", error: "Invalid JSON data" };
  }

  const isN8nWorkflow = jsonData.nodes && Array.isArray(jsonData.nodes);
  if (isN8nWorkflow) {
    return {
      type: "n8n_workflow",
      workflow: jsonData,
      confidence: 0.95
    };
  }

  if (jsonData.category && jsonData.genType && jsonData.inputs) {
    const isValidCategory = CATEGORIES.includes(jsonData.category);
    const isValidGenType = GENERATOR_TYPES.includes(jsonData.genType);
    
    if (isValidCategory && isValidGenType) {
      return {
        type: "prompt_config",
        category: jsonData.category,
        genType: jsonData.genType,
        inputs: jsonData.inputs,
        confidence: 0.99
      };
    }
  }

  const bestMatch = findBestPromptConfigMatch(jsonData);
  if (bestMatch) {
    const normalizedInputs = normalizeFieldNames(jsonData);
    return {
      type: "prompt_config",
      category: bestMatch.category,
      genType: bestMatch.genType,
      inputs: normalizedInputs,
      confidence: bestMatch.confidence
    };
  }

  return { type: "unknown", error: "Could not determine JSON type" };
}

function normalizeFieldNames(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => normalizeFieldNames(item));
  }
  
  const normalized: any = {};
  for (const key in obj) {
    // Convert "Style Tags" to "style_tags", "CAMERA" to "camera", "Focal Length mm" to "focal_length_mm"
    const normalizedKey = key.toLowerCase().replace(/\s+/g, '_');
    let value = obj[key];
    
    // Special handling for certain fields
    if (normalizedKey === 'focal_length_mm' && typeof value === 'string') {
      // Convert "24" to 24
      const num = parseFloat(value);
      value = isNaN(num) ? value : num;
    } else if (normalizedKey === 'color_palette' && typeof value === 'string') {
      // Convert "Deep twilight blues, dark silhouettes" to array
      value = value.split(',').map(s => s.trim()).filter(s => s.length > 0);
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      // Recursively normalize nested objects
      value = normalizeFieldNames(value);
    }
    
    normalized[normalizedKey] = value;
  }
  return normalized;
}

function findBestPromptConfigMatch(jsonData: any): { category: Category; genType: GeneratorType; confidence: number } | null {
  let bestMatch: { category: Category; genType: GeneratorType; confidence: number } | null = null;
  let highestScore = 0;

  const normalizedData = normalizeFieldNames(jsonData);
  console.log("Normalized data:", normalizedData);

  for (const category of CATEGORIES) {
    for (const genType of GENERATOR_TYPES) {
      const schema = GENERATOR_SCHEMAS[category]?.[genType];
      if (!schema) continue;

      const result = schema.safeParse(normalizedData);
      if (result.success) {
        const matchScore = calculateMatchScore(normalizedData, schema);
        console.log(`Match found: ${category}/${genType} with score ${matchScore}`);
        if (matchScore > highestScore) {
          highestScore = matchScore;
          bestMatch = { category, genType, confidence: matchScore };
        }
      }
    }
  }

  console.log("Best match:", bestMatch, "with score:", highestScore);
  return highestScore > 0.5 ? bestMatch : null;
}

function calculateMatchScore(jsonData: any, schema: any): number {
  const dataKeys = Object.keys(jsonData);
  
  // Try to get schema shape from Zod schema
  let schemaShape: any = {};
  if (schema.shape) {
    schemaShape = schema.shape;
  } else if (schema._def?.shape) {
    schemaShape = typeof schema._def.shape === 'function' ? schema._def.shape() : schema._def.shape;
  }
  
  const schemaKeys = Object.keys(schemaShape);
  
  if (schemaKeys.length === 0) {
    console.log("Warning: Could not extract schema keys, returning score 0.7 for successful parse");
    // If we successfully parsed but can't get keys, give a reasonable default score
    return 0.7;
  }

  const matchingKeys = dataKeys.filter(key => schemaKeys.includes(key));
  const score = matchingKeys.length / Math.max(schemaKeys.length, dataKeys.length);
  console.log(`Score calculation: ${matchingKeys.length} matching keys / ${Math.max(schemaKeys.length, dataKeys.length)} total = ${score}`);
  return score;
}

export function analyzeN8nWorkflow(workflow: N8nWorkflow) {
  const nodes = workflow.nodes || [];
  const nodesUsed = Array.from(new Set(nodes.map(n => n.type)));
  
  let workflowType = "unknown";
  if (nodes.some(n => n.type.toLowerCase().includes("trigger"))) {
    workflowType = "automated";
  }
  if (nodes.some(n => n.type.toLowerCase().includes("http") || n.type.toLowerCase().includes("webhook"))) {
    workflowType = "webhook";
  }
  if (nodes.some(n => n.type.toLowerCase().includes("email"))) {
    workflowType = "email_automation";
  }
  if (nodes.some(n => n.type.toLowerCase().includes("database") || n.type.toLowerCase().includes("sql"))) {
    workflowType = "data_processing";
  }

  return {
    name: workflow.name || "Untitled Workflow",
    workflowType,
    nodesUsed,
    nodeCount: nodes.length,
    isActive: workflow.active || false
  };
}
