import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * List all jobs for the current user
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) return [];

    return await ctx.db
      .query("jobs")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

/**
 * Get a single job by ID
 */
export const get = query({
  args: { id: v.id("jobs") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const job = await ctx.db.get(args.id);
    if (!job) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || job.userId !== user._id) {
      return null;
    }

    return job;
  },
});

/**
 * Create a new job
 */
export const create = mutation({
  args: {
    title: v.string(),
    companyName: v.string(),
    url: v.optional(v.string()),
    location: v.optional(v.string()),
    salary: v.optional(v.string()),
    remoteType: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) throw new Error("User not found");

    return await ctx.db.insert("jobs", {
      userId: user._id,
      title: args.title,
      companyName: args.companyName,
      url: args.url,
      location: args.location,
      salary: args.salary,
      remoteType: args.remoteType,
      tags: args.tags || [],
      notes: args.notes,
      status: "saved",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Update job status (for drag & drop)
 */
export const updateStatus = mutation({
  args: {
    id: v.id("jobs"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const job = await ctx.db.get(args.id);
    if (!job) throw new Error("Job not found");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || job.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Update job details
 */
export const update = mutation({
  args: {
    id: v.id("jobs"),
    title: v.optional(v.string()),
    companyName: v.optional(v.string()),
    url: v.optional(v.string()),
    location: v.optional(v.string()),
    salary: v.optional(v.string()),
    remoteType: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const job = await ctx.db.get(args.id);
    if (!job) throw new Error("Job not found");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || job.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    const { id, ...updates } = args;
    await ctx.db.patch(args.id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Delete a job
 */
export const remove = mutation({
  args: {
    id: v.id("jobs"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const job = await ctx.db.get(args.id);
    if (!job) throw new Error("Job not found");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || job.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.id);
  },
});
