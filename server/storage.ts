import { db } from "./db";
import { 
  users, presets, generationHistory, sharedLinks, apiKeys, n8nWorkflows,
  type User, type Preset, type GenerationHistory, type SharedLink, type ApiKey, type N8nWorkflow,
  type UpsertUser, type InsertPreset, type InsertGenerationHistory, type InsertSharedLink, type InsertApiKey, type InsertN8nWorkflow
} from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import crypto from "crypto";

// User operations (Replit Auth compatible)
export async function getUser(id: string): Promise<User | undefined> {
  return db.query.users.findFirst({
    where: eq(users.id, id)
  });
}

export async function upsertUser(userData: UpsertUser): Promise<User> {
  const [user] = await db
    .insert(users)
    .values(userData)
    .onConflictDoUpdate({
      target: users.id,
      set: {
        ...userData,
        updatedAt: new Date(),
      },
    })
    .returning();
  return user;
}

// Preset operations
export async function createPreset(presetData: InsertPreset): Promise<Preset> {
  const [preset] = await db.insert(presets).values(presetData).returning();
  return preset;
}

export async function getUserPresets(userId: string): Promise<Preset[]> {
  return db.query.presets.findMany({
    where: eq(presets.userId, userId),
    orderBy: [desc(presets.createdAt)]
  });
}

export async function getPresetById(id: number): Promise<Preset | undefined> {
  return db.query.presets.findFirst({
    where: eq(presets.id, id)
  });
}

export async function updatePreset(id: number, updates: Partial<Preset>): Promise<Preset | undefined> {
  const [updated] = await db.update(presets)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(presets.id, id))
    .returning();
  return updated;
}

export async function deletePreset(id: number): Promise<void> {
  await db.delete(presets).where(eq(presets.id, id));
}

export async function togglePresetFavorite(id: number): Promise<Preset | undefined> {
  const preset = await getPresetById(id);
  if (!preset) return undefined;
  
  return updatePreset(id, { isFavorite: !preset.isFavorite });
}

// Generation history operations
export async function saveGenerationHistory(historyData: InsertGenerationHistory): Promise<GenerationHistory> {
  const [history] = await db.insert(generationHistory).values(historyData).returning();
  return history;
}

export async function getUserHistory(userId: string, limit = 50): Promise<GenerationHistory[]> {
  return db.query.generationHistory.findMany({
    where: eq(generationHistory.userId, userId),
    orderBy: [desc(generationHistory.createdAt)],
    limit
  });
}

export async function getHistoryById(id: number): Promise<GenerationHistory | undefined> {
  return db.query.generationHistory.findFirst({
    where: eq(generationHistory.id, id)
  });
}

export async function toggleHistoryFavorite(id: number): Promise<GenerationHistory | undefined> {
  const history = await getHistoryById(id);
  if (!history) return undefined;
  
  const [updated] = await db.update(generationHistory)
    .set({ isFavorite: !history.isFavorite })
    .where(eq(generationHistory.id, id))
    .returning();
  return updated;
}

export async function deleteHistory(id: number): Promise<void> {
  await db.delete(generationHistory).where(eq(generationHistory.id, id));
}

// Shared links operations
export async function createSharedLink(linkData: Omit<InsertSharedLink, "shareId">): Promise<SharedLink> {
  const shareId = nanoid(10);
  const [link] = await db.insert(sharedLinks).values({ ...linkData, shareId }).returning();
  return link;
}

export async function getSharedLinkByShareId(shareId: string): Promise<SharedLink | undefined> {
  const link = await db.query.sharedLinks.findFirst({
    where: eq(sharedLinks.shareId, shareId)
  });
  
  if (link) {
    await db.update(sharedLinks)
      .set({ viewCount: link.viewCount + 1 })
      .where(eq(sharedLinks.id, link.id));
  }
  
  return link;
}

export async function getUserSharedLinks(userId: string): Promise<SharedLink[]> {
  return db.query.sharedLinks.findMany({
    where: eq(sharedLinks.userId, userId),
    orderBy: [desc(sharedLinks.createdAt)]
  });
}

export async function deleteSharedLink(id: number): Promise<void> {
  await db.delete(sharedLinks).where(eq(sharedLinks.id, id));
}

// API Keys operations
export async function createApiKey(userId: string, name: string): Promise<{ apiKey: ApiKey; rawKey: string }> {
  const rawKey = `pf_${nanoid(32)}`;
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
  const keyPreview = `${rawKey.substring(0, 10)}...${rawKey.substring(rawKey.length - 4)}`;
  
  const [apiKey] = await db.insert(apiKeys).values({
    userId,
    name,
    keyHash,
    keyPreview
  }).returning();
  
  return { apiKey, rawKey };
}

export async function verifyApiKey(rawKey: string): Promise<ApiKey | undefined> {
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
  
  const apiKey = await db.query.apiKeys.findFirst({
    where: and(
      eq(apiKeys.keyHash, keyHash),
      eq(apiKeys.isActive, true)
    )
  });
  
  if (apiKey) {
    await db.update(apiKeys)
      .set({ 
        lastUsedAt: new Date(),
        requestCount: apiKey.requestCount + 1
      })
      .where(eq(apiKeys.id, apiKey.id));
  }
  
  return apiKey;
}

export async function getUserApiKeys(userId: string): Promise<ApiKey[]> {
  return db.query.apiKeys.findMany({
    where: eq(apiKeys.userId, userId),
    orderBy: [desc(apiKeys.createdAt)]
  });
}

export async function deleteApiKey(id: number): Promise<void> {
  await db.delete(apiKeys).where(eq(apiKeys.id, id));
}

export async function toggleApiKeyStatus(id: number): Promise<ApiKey | undefined> {
  const apiKey = await db.query.apiKeys.findFirst({
    where: eq(apiKeys.id, id)
  });
  
  if (!apiKey) return undefined;
  
  const [updated] = await db.update(apiKeys)
    .set({ isActive: !apiKey.isActive })
    .where(eq(apiKeys.id, id))
    .returning();
  return updated;
}

// n8n Workflow operations
export async function createN8nWorkflow(workflowData: InsertN8nWorkflow): Promise<N8nWorkflow> {
  const [workflow] = await db.insert(n8nWorkflows).values(workflowData).returning();
  return workflow;
}

export async function getUserN8nWorkflows(userId: string): Promise<N8nWorkflow[]> {
  return db.query.n8nWorkflows.findMany({
    where: eq(n8nWorkflows.userId, userId),
    orderBy: [desc(n8nWorkflows.createdAt)]
  });
}

export async function getN8nWorkflowById(id: number): Promise<N8nWorkflow | undefined> {
  return db.query.n8nWorkflows.findFirst({
    where: eq(n8nWorkflows.id, id)
  });
}

export async function updateN8nWorkflow(id: number, updates: Partial<Omit<InsertN8nWorkflow, 'userId'>>): Promise<N8nWorkflow | undefined> {
  const [updated] = await db.update(n8nWorkflows)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(n8nWorkflows.id, id))
    .returning();
  return updated;
}

export async function deleteN8nWorkflow(id: number): Promise<void> {
  await db.delete(n8nWorkflows).where(eq(n8nWorkflows.id, id));
}

export async function toggleN8nWorkflowFavorite(id: number): Promise<N8nWorkflow | undefined> {
  const workflow = await getN8nWorkflowById(id);
  if (!workflow) return undefined;
  
  return updateN8nWorkflow(id, { isFavorite: !workflow.isFavorite });
}
