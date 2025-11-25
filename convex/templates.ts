import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Create a new email template
 */
export const create = mutation({
  args: {
    title: v.string(),
    subject: v.optional(v.string()),
    body: v.string(),
    tags: v.optional(v.array(v.string())),
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

    const templateId = await ctx.db.insert("email_templates", {
      userId: user._id,
      title: args.title,
      subject: args.subject,
      body: args.body,
      tags: args.tags || [],
      createdAt: Date.now(),
    });

    return templateId;
  },
});

/**
 * Get all templates for the current user
 */
export const list = query({
  args: {},
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

    const templates = await ctx.db
      .query("email_templates")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    return templates;
  },
});

/**
 * Get a single template by ID
 */
export const get = query({
  args: {
    id: v.id("email_templates"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const template = await ctx.db.get(args.id);

    if (!template) {
      return null;
    }

    // Verify ownership
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || template.userId !== user._id) {
      return null;
    }

    return template;
  },
});

/**
 * Update an existing template
 */
export const update = mutation({
  args: {
    id: v.id("email_templates"),
    title: v.string(),
    subject: v.optional(v.string()),
    body: v.string(),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const template = await ctx.db.get(args.id);
    if (!template) {
      throw new Error("Template not found");
    }

    // Verify ownership
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || template.userId !== user._id) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.id, {
      title: args.title,
      subject: args.subject,
      body: args.body,
      tags: args.tags || [],
    });

    return args.id;
  },
});

/**
 * Delete a template
 */
export const remove = mutation({
  args: {
    id: v.id("email_templates"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const template = await ctx.db.get(args.id);
    if (!template) {
      throw new Error("Template not found");
    }

    // Verify ownership
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || template.userId !== user._id) {
      throw new Error("Not authorized");
    }

    await ctx.db.delete(args.id);
  },
});

/**
 * Search templates by query and/or tags
 */
export const search = query({
  args: {
    query: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
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

    let templates = await ctx.db
      .query("email_templates")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    // Filter by search query
    if (args.query) {
      const query = args.query.toLowerCase();
      templates = templates.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          (t.subject?.toLowerCase().includes(query) ?? false) ||
          t.body.toLowerCase().includes(query)
      );
    }

    // Filter by tags
    if (args.tags && args.tags.length > 0) {
      templates = templates.filter((t) =>
        args.tags!.some((tag) => t.tags?.includes(tag))
      );
    }

    return templates;
  },
});
