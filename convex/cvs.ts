import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Generate an upload URL for CV file upload
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Save CV metadata after successful file upload
 */
export const saveCV = mutation({
  args: {
    storageId: v.id("_storage"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    // Get user from database
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Create CV record
    const cvId = await ctx.db.insert("cv_versions", {
      userId: user._id,
      name: args.name,
      fileRef: args.storageId,
      createdAt: Date.now(),
    });

    return cvId;
  },
});

/**
 * Get all CVs for the current user
 */
export const getCVs = query({
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

    const cvs = await ctx.db
      .query("cv_versions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    return cvs;
  },
});

/**
 * Get a single CV by ID
 */
export const getCV = query({
  args: { cvId: v.id("cv_versions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const cv = await ctx.db.get(args.cvId);
    if (!cv) {
      return null;
    }

    // Verify ownership
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || cv.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    return cv;
  },
});

/**
 * Update CV name
 */
export const updateCVName = mutation({
  args: {
    cvId: v.id("cv_versions"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const cv = await ctx.db.get(args.cvId);
    if (!cv) {
      throw new Error("CV not found");
    }

    // Verify ownership
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || cv.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.cvId, { name: args.name });
  },
});

/**
 * Delete CV and its file from storage
 */
export const deleteCV = mutation({
  args: { cvId: v.id("cv_versions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const cv = await ctx.db.get(args.cvId);
    if (!cv) {
      throw new Error("CV not found");
    }

    // Verify ownership
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || cv.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    // Delete file from storage if it exists
    if (cv.fileRef) {
      await ctx.storage.delete(cv.fileRef as Id<"_storage">);
    }

    // Delete CV record
    await ctx.db.delete(args.cvId);
  },
});

/**
 * Get download URL for a CV file
 */
export const getCVUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
