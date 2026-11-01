import assert from "node:assert/strict";
import { test } from "node:test";
import { createPlaygroundUrl, readPlaygroundSearch } from "../client/src/lib/playgroundNavigation";
import { errorHandler } from "../server/errorHandler";

test("History re-run preserves nested fields, arrays, numbers, and booleans", () => {
  const inputs = {
    subject: "Ocean & cliffs",
    style_tags: ["cinematic", "blue"],
    settings: { lighting: "sunset", strength: 0.7 },
    count: 3,
    enabled: true,
  };
  const url = createPlaygroundUrl("image", "agent_helper", inputs);
  const restored = readPlaygroundSearch(url.split("?")[1]);
  assert.equal(restored.category, "image");
  assert.equal(restored.genType, "agent_helper");
  assert.deepEqual(restored.inputs, inputs);
});

test("Chain links retain more than 500 characters and support same-category navigation", () => {
  const context = "Previous output & reference material\n".repeat(100);
  const restored = readPlaygroundSearch(`category=image&chain=${encodeURIComponent(context)}`);
  assert.equal(restored.chainContext, context);
  assert.equal(restored.category, "image");
});

test("Re-running a chained generation restores its context separately from form fields", () => {
  const url = createPlaygroundUrl("image", "prompt_generator", {
    subject: "forest",
    _chainContext: "Earlier result",
  });
  const restored = readPlaygroundSearch(url.split("?")[1]);
  assert.deepEqual(restored.inputs, { subject: "forest" });
  assert.equal(restored.chainContext, "Earlier result");
});

test("Malformed saved inputs produce a visible error rather than being accepted", () => {
  for (const inputs of ["not-json", "null", "[]", "123"]) {
    const restored = readPlaygroundSearch(`inputs=${encodeURIComponent(inputs)}`);
    assert.ok(restored.error);
    assert.deepEqual(restored.inputs, {});
  }
});

test("Navigation validates category and type and supports old re-run links", () => {
  const restored = readPlaygroundSearch("category=invalid&genType=invalid&subject=forest");
  assert.equal(restored.category, "image");
  assert.equal(restored.genType, "prompt_generator");
  assert.deepEqual(restored.inputs, { subject: "forest" });
});

test("Input links discard prototype-related keys", () => {
  const restored = readPlaygroundSearch(`inputs=${encodeURIComponent('{"__proto__":{"polluted":true},"subject":"forest"}')}`);
  assert.deepEqual(restored.inputs, { subject: "forest" });
  assert.equal(({} as any).polluted, undefined);
});

test("Error handler does not write a second response or rethrow after headers are sent", () => {
  const error = new Error("Expected test error");
  let forwarded: unknown;
  const originalLog = console.error;
  console.error = () => {};
  try {
    errorHandler(error, {} as any, {
      headersSent: true,
      status: () => assert.fail("Must not write another response"),
    } as any, ((err: unknown) => { forwarded = err; }) as any);
    assert.equal(forwarded, error);
  } finally {
    console.error = originalLog;
  }
});

test("Server failures return a safe response without exposing internal errors or crashing", () => {
  let status: number | undefined;
  let body: any;
  const originalLog = console.error;
  console.error = () => {};
  try {
    const response = {
      headersSent: false,
      status: (value: number) => { status = value; return response; },
      json: (value: unknown) => { body = value; },
    };
    errorHandler(new Error("private internal details"), {} as any, response as any, (() => assert.fail("Must handle the error")) as any);
    assert.equal(status, 500);
    assert.match(body.message, /temporarily unavailable/);
    assert.doesNotMatch(body.message, /private/);
  } finally {
    console.error = originalLog;
  }
});

test("Every personal-data mutation scopes its SQL by record ID and owner", async () => {
  // This is a fake local URL. No credentials or live database are used by these tests.
  process.env.DATABASE_URL = "postgresql://test:test@localhost/test";
  const { db } = await import("../server/db");
  const storage = await import("../server/storage");
  const session = (db as any).session;
  const originalPrepare = session.prepareQuery;
  const queries: { sql: string; params: unknown[] }[] = [];
  let owned = true;
  session.prepareQuery = (query: { sql: string; params: unknown[] }) => ({
    execute: async () => {
      queries.push(query);
      if (!owned) return query.sql.startsWith("select") ? undefined : [];
      const row = { id: 17, userId: "user-a", isFavorite: false, isActive: true };
      return query.sql.startsWith("select") ? row : [row];
    },
  });
  try {
    const operations = [
      () => storage.rateHistoryItem(17, "user-a", 1),
      () => storage.toggleHistoryFavorite(17, "user-a"),
      () => storage.deleteHistory(17, "user-a"),
      () => storage.updatePreset(17, "user-a", { name: "Updated" }),
      () => storage.togglePresetFavorite(17, "user-a"),
      () => storage.deletePreset(17, "user-a"),
      () => storage.deleteSharedLink(17, "user-a"),
      () => storage.toggleApiKeyStatus(17, "user-a"),
      () => storage.deleteApiKey(17, "user-a"),
      () => storage.updateN8nWorkflow(17, "user-a", { name: "Updated" }),
      () => storage.toggleN8nWorkflowFavorite(17, "user-a"),
      () => storage.deleteN8nWorkflow(17, "user-a"),
    ];
    for (const operation of operations) {
      queries.length = 0;
      await operation();
      assert.ok(queries.length > 0);
      for (const query of queries) {
        const where = query.sql.slice(query.sql.indexOf("where"));
        assert.match(where, /"id" = \$/);
        assert.match(where, /"user_id" = \$/);
        assert.ok(query.params.includes(17));
        assert.ok(query.params.includes("user-a"));
      }
    }
    owned = false;
    assert.equal(await storage.deleteHistory(17, "user-b"), false);
    assert.equal(await storage.rateHistoryItem(17, "user-b", 1), undefined);
    assert.equal(await storage.toggleApiKeyStatus(17, "user-b"), undefined);
    assert.equal(await storage.deleteApiKey(17, "user-b"), false);
    assert.equal(await storage.deletePreset(17, "user-b"), false);
    assert.equal(await storage.deleteSharedLink(17, "user-b"), false);
    assert.equal(await storage.deleteN8nWorkflow(17, "user-b"), false);
  } finally {
    session.prepareQuery = originalPrepare;
  }
});
