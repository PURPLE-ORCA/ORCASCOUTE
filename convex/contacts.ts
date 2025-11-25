import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Create a new contact
export const create = mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    linkedIn: v.optional(v.string()),
    phone: v.optional(v.string()),
    companyId: v.optional(v.id("companies")),
    position: v.optional(v.string()),
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

    const contactId = await ctx.db.insert("contacts", {
      userId: user._id,
      name: args.name,
      email: args.email,
      linkedIn: args.linkedIn,
      phone: args.phone,
      companyId: args.companyId,
      position: args.position,
      tags: args.tags,
      notes: args.notes,
      lastContact: undefined,
      createdAt: Date.now(),
    });

    return contactId;
  },
});

// Get all contacts for the current user
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

    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Get company info and job counts for each contact
    const contactsWithDetails = await Promise.all(
      contacts.map(async (contact) => {
        // Get company info if linked
        const company = contact.companyId
          ? await ctx.db.get(contact.companyId)
          : null;

        // Get job count
        const jobs = await ctx.db
          .query("jobs")
          .withIndex("by_contact", (q) => q.eq("contactId", contact._id))
          .collect();

        return {
          ...contact,
          company,
          jobCount: jobs.length,
        };
      })
    );

    // Sort by lastContact (most recent first), then by createdAt
    return contactsWithDetails.sort((a, b) => {
      if (a.lastContact && b.lastContact) {
        return b.lastContact - a.lastContact;
      }
      if (a.lastContact) return -1;
      if (b.lastContact) return 1;
      return b.createdAt - a.createdAt;
    });
  },
});

// Get a single contact with company and related jobs
export const get = query({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const contact = await ctx.db.get(args.contactId);
    if (!contact) {
      throw new Error("Contact not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || contact.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    // Get company info if linked
    const company = contact.companyId
      ? await ctx.db.get(contact.companyId)
      : null;

    // Get related jobs
    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_contact", (q) => q.eq("contactId", contact._id))
      .collect();

    return {
      ...contact,
      company,
      jobs,
    };
  },
});

// Update contact details
export const update = mutation({
  args: {
    contactId: v.id("contacts"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    linkedIn: v.optional(v.string()),
    phone: v.optional(v.string()),
    companyId: v.optional(v.id("companies")),
    position: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const contact = await ctx.db.get(args.contactId);
    if (!contact) {
      throw new Error("Contact not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || contact.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    const { contactId, ...updates } = args;
    await ctx.db.patch(contactId, updates);
  },
});

// Update last contact timestamp
export const updateLastContact = mutation({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const contact = await ctx.db.get(args.contactId);
    if (!contact) {
      throw new Error("Contact not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || contact.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.contactId, {
      lastContact: Date.now(),
    });
  },
});

// Delete contact
export const remove = mutation({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const contact = await ctx.db.get(args.contactId);
    if (!contact) {
      throw new Error("Contact not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || contact.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    // Unlink from all jobs
    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_contact", (q) => q.eq("contactId", contact._id))
      .collect();

    for (const job of jobs) {
      await ctx.db.patch(job._id, { contactId: undefined });
    }

    // Delete contact
    await ctx.db.delete(args.contactId);
  },
});
