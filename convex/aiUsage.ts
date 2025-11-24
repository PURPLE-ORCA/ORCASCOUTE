import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

/**
 * Record AI usage for tracking and quotas
 */
export const recordUsage = internalMutation({
  args: {
    userId: v.id("users"),
    type: v.string(),
    jobId: v.id("jobs"),
    tokensUsed: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("ai_requests", {
      userId: args.userId,
      type: args.type,
      model: "gemini-2.0-flash-exp",
      tokensUsed: args.tokensUsed,
      timestamp: Date.now(),
    });
  },
});

/**
 * Get AI usage count for the current month
 */
export const getMonthlyUsage = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { count: 0, limit: 20 };

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) return { count: 0, limit: 20 };

    // Get start of current month
    const now = new Date();
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    ).getTime();

    const requests = await ctx.db
      .query("ai_requests")
      .withIndex("by_user_timestamp", (q) =>
        q.eq("userId", user._id).gte("timestamp", startOfMonth)
      )
      .collect();

    const limit = user.settings?.aiDailyQuota || 20;

    return {
      count: requests.length,
      limit,
      remaining: Math.max(0, limit - requests.length),
    };
  },
});

/**
 * Check if user has remaining AI quota
 */
export const hasRemainingQuota = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) return false;

    // Get start of current month
    const now = new Date();
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    ).getTime();

    const requests = await ctx.db
      .query("ai_requests")
      .withIndex("by_user_timestamp", (q) =>
        q.eq("userId", user._id).gte("timestamp", startOfMonth)
      )
      .collect();

    const limit = user.settings?.aiDailyQuota || 20;

    return requests.length < limit;
  },
});
