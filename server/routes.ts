import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generatePrompt } from "./openai";
import { GENERATOR_SCHEMAS, CATEGORIES, GENERATOR_TYPES } from "@shared/schema";
import type { Category, GeneratorType } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Generator endpoint: POST /api/generator/:category/:genType
  app.post("/api/generator/:category/:genType", async (req, res) => {
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

      // Optionally save to history
      await storage.saveHistory({
        category,
        genType,
        inputs: validationResult.data,
        output: result.output,
        timestamp: result.metadata.timestamp
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

  // Optional: Get generator history
  app.get("/api/history", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const history = await storage.getHistory(limit);
      res.json({ history });
    } catch (error: any) {
      console.error("Error fetching history:", error);
      res.status(500).json({ 
        error: "Service error",
        message: "Failed to fetch history"
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
