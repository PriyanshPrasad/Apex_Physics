import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/** Load the persisted progress payload for a user (null if none). */
export const getProgress = query({
  args: { userId: v.string() },
  handler: async (db, { userId }) => {
    const row = await db
      .query("progress")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    return row?.payload ?? null;
  },
});

/** Create or overwrite the progress payload for a user. */
export const saveProgress = mutation({
  args: { userId: v.string(), payload: v.any() },
  handler: async (db, { userId, payload }) => {
    const existing = await db
      .query("progress")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    const updatedAt = Date.now();
    if (existing) {
      await db.patch(existing._id, { payload, updatedAt });
      return existing._id;
    }
    return db.insert("progress", { userId, payload, updatedAt });
  },
});

/** Save a diagnostic result (standard or AP). */
export const saveDiagnosticResult = mutation({
  args: {
    userId: v.string(),
    kind: v.string(),
    score: v.number(),
    total: v.number(),
    detail: v.optional(v.any()),
  },
  handler: async (db, args) => {
    return db.insert("diagnosticResults", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

/** List recent diagnostic results for a user. */
export const listDiagnosticResults = query({
  args: { userId: v.string() },
  handler: async (db, { userId }) => {
    return await db
      .query("diagnosticResults")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(20);
  },
});
