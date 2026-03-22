import type { Express } from "express";
import { createServer, type Server } from "http";
import {
  getUser, saveGenerationHistory, getUserHistory,
  createPreset, getUserPresets, updatePreset, deletePreset, togglePresetFavorite,
  toggleHistoryFavorite, deleteHistory,
  createSharedLink, getSharedLinkByShareId, getUserSharedLinks, deleteSharedLink,
  createApiKey, getUserApiKeys, deleteApiKey, toggleApiKeyStatus,
  createN8nWorkflow, getUserN8nWorkflows, deleteN8nWorkflow, toggleN8nWorkflowFavorite
} from "./storage";
import { generatePrompt, callOpenAIChat } from "./openai";
import { GENERATOR_SCHEMAS, CATEGORIES, GENERATOR_TYPES, CATEGORY_METADATA } from "@shared/schema";
import type { Category, GeneratorType } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // Auth endpoint - get current user
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Generator endpoint: POST /api/generator/:category/:genType
  app.post("/api/generator/:category/:genType", async (req: any, res) => {
    try {
      const { category, genType } = req.params;

      // Validate category and genType
      if (!CATEGORIES.includes(category as Category)) {
        return res.status(404).json({
          error: "Unknown category",
          message: `Category '${category}' not found. Valid categories: ${CATEGORIES.join(", ")}`
        });
      }

      if (!GENERATOR_TYPES.includes(genType as GeneratorType)) {
        return res.status(404).json({
          error: "Unknown generator type",
          message: `Generator type '${genType}' not found. Valid types: ${GENERATOR_TYPES.join(", ")}`
        });
      }

      // Get the schema for validation
      const schema = GENERATOR_SCHEMAS[category as Category][genType as GeneratorType];

      // Validate request body
      const validationResult = schema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(422).json({
          error: "Validation failed",
          message: "Input validation failed",
          details: validationResult.error.errors
        });
      }

      // Generate the prompt using OpenAI
      const result = await generatePrompt(
        category as Category,
        genType as GeneratorType,
        validationResult.data
      );

      // Save to history with userId if authenticated
      const userId = req.isAuthenticated() ? req.user.claims.sub : null;
      await saveGenerationHistory({
        userId,
        category,
        genType,
        inputs: validationResult.data,
        output: result.output
      });

      // Return the result
      res.json(result);
    } catch (error: any) {
      console.error("Error generating prompt:", error);
      res.status(500).json({
        error: "Service error",
        message: error.message || "Failed to generate prompt. Please try again."
      });
    }
  });

  // Analyze n8n workflow and convert to prompt inputs (requires authentication)
  app.post("/api/workflows/analyze", isAuthenticated, async (req: any, res) => {
    try {
      const { workflow } = req.body;
      
      if (!workflow || !workflow.nodes || !Array.isArray(workflow.nodes)) {
        return res.status(400).json({
          error: "Invalid workflow",
          message: "Workflow must contain a valid nodes array"
        });
      }

      const nodes = workflow.nodes || [];
      const nodeCount = nodes.length;
      
      const validNodes = nodes.filter((n: any) => n && typeof n.type === 'string');
      const nodesUsed = Array.from(new Set(validNodes.map((n: any) => n.type)));
      
      let workflowType = "general automation";
      if (validNodes.some((n: any) => n.type.toLowerCase().includes("trigger"))) {
        workflowType = "event-driven automation";
      }
      if (validNodes.some((n: any) => n.type.toLowerCase().includes("http") || n.type.toLowerCase().includes("webhook"))) {
        workflowType = "API integration";
      }

      const workflowDescription = `${workflowType} workflow with ${nodeCount} nodes (${nodesUsed.join(", ")})`;
      
      const extractedInputs = {
        task_description: `Create an automation similar to this n8n workflow: ${workflow.name || "Untitled"}`,
        workflow_details: workflowDescription,
        nodes_used: nodesUsed.join(", "),
        desired_outcome: `Replicate the functionality of ${nodeCount} interconnected nodes handling ${workflowType}`
      };

      res.json({
        suggestedCategory: "automation_augmentation",
        extractedInputs,
        nodeCount,
        nodesUsed,
        workflowType
      });
    } catch (error: any) {
      console.error("Error analyzing workflow:", error);
      res.status(500).json({
        error: "Service error",
        message: "Failed to analyze workflow"
      });
    }
  });

  // Get user's generation history
  app.get("/api/history", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const history = await getUserHistory(userId, limit);
      res.json({ history });
    } catch (error: any) {
      console.error("Error fetching history:", error);
      res.status(500).json({
        error: "Service error",
        message: "Failed to fetch history"
      });
    }
  });

  // Toggle history favorite
  app.patch("/api/history/:id/favorite", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await toggleHistoryFavorite(id);
      res.json(updated);
    } catch (error: any) {
      console.error("Error toggling history favorite:", error);
      res.status(500).json({
        error: "Service error",
        message: "Failed to update favorite status"
      });
    }
  });

  // Delete history item
  app.delete("/api/history/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await deleteHistory(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting history:", error);
      res.status(500).json({
        error: "Service error",
        message: "Failed to delete history"
      });
    }
  });

  // Preset endpoints
  app.get("/api/presets", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const presets = await getUserPresets(userId);
      res.json({ presets });
    } catch (error: any) {
      console.error("Error fetching presets:", error);
      res.status(500).json({
        error: "Service error",
        message: "Failed to fetch presets"
      });
    }
  });

  app.post("/api/presets", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const preset = await createPreset({
        ...req.body,
        userId
      });
      res.json(preset);
    } catch (error: any) {
      console.error("Error creating preset:", error);
      res.status(500).json({
        error: "Service error",
        message: "Failed to create preset"
      });
    }
  });

  app.patch("/api/presets/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await updatePreset(id, req.body);
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating preset:", error);
      res.status(500).json({
        error: "Service error",
        message: "Failed to update preset"
      });
    }
  });

  app.patch("/api/presets/:id/favorite", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await togglePresetFavorite(id);
      res.json(updated);
    } catch (error: any) {
      console.error("Error toggling preset favorite:", error);
      res.status(500).json({
        error: "Service error",
        message: "Failed to update favorite status"
      });
    }
  });

  app.delete("/api/presets/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await deletePreset(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting preset:", error);
      res.status(500).json({
        error: "Service error",
        message: "Failed to delete preset"
      });
    }
  });

  // Shared links endpoints
  app.post("/api/share", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const link = await createSharedLink({
        ...req.body,
        userId
      });
      res.json(link);
    } catch (error: any) {
      console.error("Error creating shared link:", error);
      res.status(500).json({
        error: "Service error",
        message: "Failed to create shared link"
      });
    }
  });

  app.get("/api/share/:shareId", async (req, res) => {
    try {
      const { shareId } = req.params;
      const link = await getSharedLinkByShareId(shareId);
      if (!link) {
        return res.status(404).json({
          error: "Not found",
          message: "Shared link not found"
        });
      }
      res.json(link);
    } catch (error: any) {
      console.error("Error fetching shared link:", error);
      res.status(500).json({
        error: "Service error",
        message: "Failed to fetch shared link"
      });
    }
  });

  app.get("/api/shares", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const links = await getUserSharedLinks(userId);
      res.json({ links });
    } catch (error: any) {
      console.error("Error fetching shared links:", error);
      res.status(500).json({
        error: "Service error",
        message: "Failed to fetch shared links"
      });
    }
  });

  app.delete("/api/shares/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await deleteSharedLink(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting shared link:", error);
      res.status(500).json({
        error: "Service error",
        message: "Failed to delete shared link"
      });
    }
  });

  // API Keys endpoints
  app.get("/api/keys", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const keys = await getUserApiKeys(userId);
      res.json({ keys });
    } catch (error: any) {
      console.error("Error fetching API keys:", error);
      res.status(500).json({
        error: "Service error",
        message: "Failed to fetch API keys"
      });
    }
  });

  app.post("/api/keys", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name } = req.body;
      const result = await createApiKey(userId, name);
      res.json(result);
    } catch (error: any) {
      console.error("Error creating API key:", error);
      res.status(500).json({
        error: "Service error",
        message: "Failed to create API key"
      });
    }
  });

  app.patch("/api/keys/:id/toggle", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await toggleApiKeyStatus(id);
      res.json(updated);
    } catch (error: any) {
      console.error("Error toggling API key:", error);
      res.status(500).json({
        error: "Service error",
        message: "Failed to toggle API key"
      });
    }
  });

  app.delete("/api/keys/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await deleteApiKey(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting API key:", error);
      res.status(500).json({
        error: "Service error",
        message: "Failed to delete API key"
      });
    }
  });

  // AI-assisted field completion
  app.post("/api/ai-assist", isAuthenticated, async (req: any, res) => {
    try {
      const { category, genType, currentInputs, emptyFields, workflowContext } = req.body;
      
      if (!category || !genType || !emptyFields || !Array.isArray(emptyFields)) {
        return res.status(400).json({
          error: "Invalid request",
          message: "Must provide category, genType, and emptyFields array"
        });
      }

      const categoryMeta = CATEGORY_METADATA.find(c => c.id === category);
      if (!categoryMeta) {
        return res.status(404).json({
          error: "Category not found",
          message: `Category ${category} not found`
        });
      }

      const systemPrompt = `You are an AI assistant helping users fill out prompt generator forms.
The user is working on a ${categoryMeta.name} generator (${genType}).
Description: ${categoryMeta.description}

CRITICAL RULES:
- You MUST return a JSON object with a value for EVERY field listed
- Do NOT skip any fields — include all of them in your response
- Suggestions should be practical, specific, and immediately useful
- Base suggestions on: the category purpose, any existing values, and the field names
- For string fields: provide a meaningful sentence or phrase (not empty)
- For array fields: provide a JSON array of 2-4 relevant strings
- For number fields: provide a sensible number`;

      const emptyFieldsJson = emptyFields.reduce((acc, field) => {
        acc[field] = "string or array depending on field type";
        return acc;
      }, {} as Record<string, string>);

      const userPrompt = `Category: ${category} (${genType})
${Object.keys(currentInputs).length > 0 ? `Already filled fields: ${JSON.stringify(currentInputs, null, 2)}` : "No fields filled yet."}
${workflowContext ? `\nWorkflow context: ${JSON.stringify(workflowContext, null, 2)}` : ""}

You MUST return a JSON object with ALL ${emptyFields.length} of these keys filled in:
${emptyFields.map(f => `- ${f}`).join("\n")}

Return ONLY this JSON structure with every key present:
${JSON.stringify(emptyFieldsJson, null, 2)}`;

      const suggestions = await callOpenAIChat(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        { 
          temperature: 0.7, 
          max_completion_tokens: 1000,
          response_format: { type: "json_object" }
        }
      );

      let parsedSuggestions = {};
      try {
        parsedSuggestions = JSON.parse(suggestions);
      } catch (parseError) {
        parsedSuggestions = emptyFields.reduce((acc, field) => {
          acc[field] = suggestions;
          return acc;
        }, {} as Record<string, string>);
      }

      res.json({ suggestions: parsedSuggestions });
    } catch (error: any) {
      console.error("Error in AI assist:", error);
      res.status(500).json({
        error: "Service error",
        message: "Failed to generate field suggestions"
      });
    }
  });

  // n8n Workflow endpoints
  app.get("/api/workflows", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const workflows = await getUserN8nWorkflows(userId);
      res.json({ workflows });
    } catch (error: any) {
      console.error("Error fetching workflows:", error);
      res.status(500).json({
        error: "Service error",
        message: "Failed to fetch workflows"
      });
    }
  });

  app.post("/api/workflows", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name, description, workflowData, workflowType, nodesUsed, tags } = req.body;
      
      const workflow = await createN8nWorkflow({
        userId,
        name,
        description,
        workflowData,
        workflowType,
        nodesUsed,
        tags
      });
      
      res.json(workflow);
    } catch (error: any) {
      console.error("Error saving workflow:", error);
      res.status(500).json({
        error: "Service error",
        message: "Failed to save workflow"
      });
    }
  });

  app.patch("/api/workflows/:id/favorite", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await toggleN8nWorkflowFavorite(id);
      res.json(updated);
    } catch (error: any) {
      console.error("Error toggling workflow favorite:", error);
      res.status(500).json({
        error: "Service error",
        message: "Failed to toggle favorite"
      });
    }
  });

  app.delete("/api/workflows/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await deleteN8nWorkflow(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting workflow:", error);
      res.status(500).json({
        error: "Service error",
        message: "Failed to delete workflow"
      });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      categories: CATEGORIES.length,
      generatorTypes: GENERATOR_TYPES.length
    });
  });

  const httpServer = createServer(app);

  return httpServer;
}
