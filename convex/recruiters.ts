import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Create a new recruiter
export const create = mutation({
  args: {
    name: v.string(),
    company: v.string(),
    position: v.optional(v.string()),
    email: v.string(),
    phone: v.optional(v.string()),
    linkedIn: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const recruiterId = await ctx.db.insert("recruiters", {
      userId: user._id,
      name: args.name,
      company: args.company,
      position: args.position,
      email: args.email,
      phone: args.phone,
      linkedIn: args.linkedIn,
      tags: args.tags,
      notes: args.notes,
      lastContact: undefined,
      createdAt: Date.now(),
    });

    return recruiterId;
  },
});

// Get all recruiters for the current user
export const getAll = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      return [];
    }

    const recruiters = await ctx.db
      .query("recruiters")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Get job counts for each recruiter
    const recruitersWithJobCounts = await Promise.all(
      recruiters.map(async (recruiter) => {
        const jobs = await ctx.db
          .query("jobs")
          .withIndex("by_recruiter", (q) => q.eq("recruiterId", recruiter._id))
          .collect();

        return {
          ...recruiter,
          jobCount: jobs.length,
        };
      })
    );

    // Sort by lastContact (most recent first), then by createdAt
    return recruitersWithJobCounts.sort((a, b) => {
      if (a.lastContact && b.lastContact) {
        return b.lastContact - a.lastContact;
      }
      if (a.lastContact) return -1;
      if (b.lastContact) return 1;
      return b.createdAt - a.createdAt;
    });
  },
});

// Get a single recruiter with related jobs
export const get = query({
  args: { recruiterId: v.id("recruiters") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const recruiter = await ctx.db.get(args.recruiterId);
    if (!recruiter) {
      throw new Error("Recruiter not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || recruiter.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    // Get related jobs
    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_recruiter", (q) => q.eq("recruiterId", recruiter._id))
      .collect();

    return {
      ...recruiter,
      jobs,
    };
  },
});

// Update recruiter details
export const update = mutation({
  args: {
    recruiterId: v.id("recruiters"),
    name: v.optional(v.string()),
    company: v.optional(v.string()),
    position: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    linkedIn: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const recruiter = await ctx.db.get(args.recruiterId);
    if (!recruiter) {
      throw new Error("Recruiter not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || recruiter.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    const { recruiterId, ...updates } = args;
    await ctx.db.patch(recruiterId, updates);
  },
});

// Update last contact timestamp
export const updateLastContact = mutation({
  args: { recruiterId: v.id("recruiters") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const recruiter = await ctx.db.get(args.recruiterId);
    if (!recruiter) {
      throw new Error("Recruiter not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || recruiter.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.recruiterId, {
      lastContact: Date.now(),
    });
  },
});

// Delete recruiter
export const remove = mutation({
  args: { recruiterId: v.id("recruiters") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const recruiter = await ctx.db.get(args.recruiterId);
    if (!recruiter) {
      throw new Error("Recruiter not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || recruiter.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    // Unlink from all jobs
    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_recruiter", (q) => q.eq("recruiterId", recruiter._id))
      .collect();

    for (const job of jobs) {
      await ctx.db.patch(job._id, { recruiterId: undefined });
    }

    // Delete recruiter
    await ctx.db.delete(args.recruiterId);
  },
});
