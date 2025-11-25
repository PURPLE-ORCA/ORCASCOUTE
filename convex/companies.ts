import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Create a new company
export const create = mutation({
  args: {
    name: v.string(),
    emails: v.array(v.string()),
    linkedInProfiles: v.optional(v.array(v.string())),
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

    const companyId = await ctx.db.insert("companies", {
      userId: user._id,
      name: args.name,
      emails: args.emails,
      linkedInProfiles: args.linkedInProfiles,
      tags: args.tags,
      notes: args.notes,
      createdAt: Date.now(),
    });

    return companyId;
  },
});

// Get all companies for the current user
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

    const companies = await ctx.db
      .query("companies")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Get contact and job counts for each company
    const companiesWithCounts = await Promise.all(
      companies.map(async (company) => {
        const contacts = await ctx.db
          .query("contacts")
          .withIndex("by_company", (q) => q.eq("companyId", company._id))
          .collect();

        const jobs = await ctx.db
          .query("jobs")
          .withIndex("by_emaildb_company", (q) =>
            q.eq("emailDbCompanyId", company._id)
          )
          .collect();

        return {
          ...company,
          contactCount: contacts.length,
          jobCount: jobs.length,
        };
      })
    );

    // Sort by name
    return companiesWithCounts.sort((a, b) => a.name.localeCompare(b.name));
  },
});

// Get a single company with related contacts and jobs
export const get = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const company = await ctx.db.get(args.companyId);
    if (!company) {
      throw new Error("Company not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || company.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    // Get related contacts
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_company", (q) => q.eq("companyId", company._id))
      .collect();

    // Get related jobs
    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_emaildb_company", (q) =>
        q.eq("emailDbCompanyId", company._id)
      )
      .collect();

    return {
      ...company,
      contacts,
      jobs,
    };
  },
});

// Update company details
export const update = mutation({
  args: {
    companyId: v.id("companies"),
    name: v.optional(v.string()),
    emails: v.optional(v.array(v.string())),
    linkedInProfiles: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const company = await ctx.db.get(args.companyId);
    if (!company) {
      throw new Error("Company not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || company.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    const { companyId, ...updates } = args;
    await ctx.db.patch(companyId, updates);
  },
});

// Delete company
export const remove = mutation({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const company = await ctx.db.get(args.companyId);
    if (!company) {
      throw new Error("Company not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || company.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    // Unlink from all contacts
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_company", (q) => q.eq("companyId", company._id))
      .collect();

    for (const contact of contacts) {
      await ctx.db.patch(contact._id, { companyId: undefined });
    }

    // Unlink from all jobs
    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_emaildb_company", (q) =>
        q.eq("emailDbCompanyId", company._id)
      )
      .collect();

    for (const job of jobs) {
      await ctx.db.patch(job._id, { emailDbCompanyId: undefined });
    }

    // Delete company
    await ctx.db.delete(args.companyId);
  },
});
