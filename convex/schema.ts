import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Minimal Convex backend for the AP Physics platform.
 *
 * The app's sign-in remains browser-local; Convex stores durable learning
 * data (progress, diagnostic results) keyed by the local session's user id,
 * so progress can persist beyond a single browser profile.
 */
export default defineSchema({
  progress: defineTable({
    userId: v.string(),
    payload: v.any(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  diagnosticResults: defineTable({
    userId: v.string(),
    kind: v.string(), // "standard" | "ap"
    score: v.number(),
    total: v.number(),
    detail: v.optional(v.any()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
});
