import { db } from "./db";
import { 
  users, presets, generationHistory, sharedLinks, apiKeys, n8nWorkflows,
  type User, type Preset, type GenerationHistory, type SharedLink, type ApiKey, type N8nWorkflow,
  type UpsertUser, type InsertPreset, type InsertGenerationHistory, type InsertSharedLink, type InsertApiKey, type InsertN8nWorkflow
} from "@shared/schema";
import { eq, desc, and, gte, count, sql } from "drizzle-orm";
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

export async function getPresetById(id: number, userId: string): Promise<Preset | undefined> {
  return db.query.presets.findFirst({
    where: and(eq(presets.id, id), eq(presets.userId, userId))
  });
}

export async function updatePreset(id: number, userId: string, updates: Partial<Pick<Preset, "name" | "category" | "genType" | "inputs" | "isFavorite">>): Promise<Preset | undefined> {
  const [updated] = await db.update(presets)
    .set({ ...updates, updatedAt: new Date() })
    .where(and(eq(presets.id, id), eq(presets.userId, userId)))
    .returning();
  return updated;
}

export async function deletePreset(id: number, userId: string): Promise<boolean> {
  const deleted = await db.delete(presets).where(and(eq(presets.id, id), eq(presets.userId, userId))).returning({ id: presets.id });
  return deleted.length > 0;
}

export async function togglePresetFavorite(id: number, userId: string): Promise<Preset | undefined> {
  const preset = await getPresetById(id, userId);
  if (!preset) return undefined;
  
  return updatePreset(id, userId, { isFavorite: !preset.isFavorite });
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

export async function getHistoryById(id: number, userId: string): Promise<GenerationHistory | undefined> {
  return db.query.generationHistory.findFirst({
    where: and(eq(generationHistory.id, id), eq(generationHistory.userId, userId))
  });
}

export async function toggleHistoryFavorite(id: number, userId: string): Promise<GenerationHistory | undefined> {
  const history = await getHistoryById(id, userId);
  if (!history) return undefined;
  
  const [updated] = await db.update(generationHistory)
    .set({ isFavorite: !history.isFavorite })
    .where(and(eq(generationHistory.id, id), eq(generationHistory.userId, userId)))
    .returning();
  return updated;
}

export async function deleteHistory(id: number, userId: string): Promise<boolean> {
  const deleted = await db.delete(generationHistory).where(and(eq(generationHistory.id, id), eq(generationHistory.userId, userId))).returning({ id: generationHistory.id });
  return deleted.length > 0;
}

export async function rateHistoryItem(id: number, userId: string, rating: number | null): Promise<GenerationHistory | undefined> {
  const [updated] = await db.update(generationHistory)
    .set({ rating })
    .where(and(eq(generationHistory.id, id), eq(generationHistory.userId, userId)))
    .returning();
  return updated;
}

export async function getUserStats(userId: string) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [totalsResult] = await db
    .select({
      total: count(),
      favorites: sql<number>`sum(case when ${generationHistory.isFavorite} then 1 else 0 end)`,
      thumbsUp: sql<number>`sum(case when ${generationHistory.rating} = 1 then 1 else 0 end)`,
    })
    .from(generationHistory)
    .where(eq(generationHistory.userId, userId));

  const [weekResult] = await db
    .select({ thisWeek: count() })
    .from(generationHistory)
    .where(and(eq(generationHistory.userId, userId), gte(generationHistory.createdAt, sevenDaysAgo)));

  const topCategoriesRaw = await db
    .select({ category: generationHistory.category, cnt: count() })
    .from(generationHistory)
    .where(eq(generationHistory.userId, userId))
    .groupBy(generationHistory.category)
    .orderBy(desc(count()))
    .limit(5);

  const recentGenerations = await db.query.generationHistory.findMany({
    where: eq(generationHistory.userId, userId),
    orderBy: [desc(generationHistory.createdAt)],
    limit: 8,
    columns: { id: true, category: true, genType: true, createdAt: true, isFavorite: true, rating: true }
  });

  return {
    totalGenerations: Number(totalsResult?.total ?? 0),
    thisWeek: Number(weekResult?.thisWeek ?? 0),
    favorites: Number(totalsResult?.favorites ?? 0),
    thumbsUp: Number(totalsResult?.thumbsUp ?? 0),
    topCategories: topCategoriesRaw.map(r => ({ category: r.category, count: Number(r.cnt) })),
    recentGenerations,
  };
}

export async function getPublicSharedLinks(limit = 24): Promise<SharedLink[]> {
  return db.query.sharedLinks.findMany({
    orderBy: [desc(sharedLinks.createdAt)],
    limit,
  });
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

export async function deleteSharedLink(id: number, userId: string): Promise<boolean> {
  const deleted = await db.delete(sharedLinks).where(and(eq(sharedLinks.id, id), eq(sharedLinks.userId, userId))).returning({ id: sharedLinks.id });
  return deleted.length > 0;
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

export async function deleteApiKey(id: number, userId: string): Promise<boolean> {
  const deleted = await db.delete(apiKeys).where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId))).returning({ id: apiKeys.id });
  return deleted.length > 0;
}

export async function toggleApiKeyStatus(id: number, userId: string): Promise<ApiKey | undefined> {
  const apiKey = await db.query.apiKeys.findFirst({
    where: and(eq(apiKeys.id, id), eq(apiKeys.userId, userId))
  });
  
  if (!apiKey) return undefined;
  
  const [updated] = await db.update(apiKeys)
    .set({ isActive: !apiKey.isActive })
    .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)))
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

export async function getN8nWorkflowById(id: number, userId: string): Promise<N8nWorkflow | undefined> {
  return db.query.n8nWorkflows.findFirst({
    where: and(eq(n8nWorkflows.id, id), eq(n8nWorkflows.userId, userId))
  });
}

export async function updateN8nWorkflow(id: number, userId: string, updates: Partial<Omit<InsertN8nWorkflow, 'userId'>>): Promise<N8nWorkflow | undefined> {
  const [updated] = await db.update(n8nWorkflows)
    .set({ ...updates, updatedAt: new Date() })
    .where(and(eq(n8nWorkflows.id, id), eq(n8nWorkflows.userId, userId)))
    .returning();
  return updated;
}

export async function deleteN8nWorkflow(id: number, userId: string): Promise<boolean> {
  const deleted = await db.delete(n8nWorkflows).where(and(eq(n8nWorkflows.id, id), eq(n8nWorkflows.userId, userId))).returning({ id: n8nWorkflows.id });
  return deleted.length > 0;
}

export async function toggleN8nWorkflowFavorite(id: number, userId: string): Promise<N8nWorkflow | undefined> {
  const workflow = await getN8nWorkflowById(id, userId);
  if (!workflow) return undefined;
  
  return updateN8nWorkflow(id, userId, { isFavorite: !workflow.isFavorite });
}
