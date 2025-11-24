import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    tokenIdentifier: v.string(), // Clerk ID
    title: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
    timezone: v.optional(v.string()),
    defaultSignature: v.optional(v.string()),
    createdAt: v.number(),
    settings: v.optional(
      v.object({
        aiDailyQuota: v.optional(v.number()),
        language: v.optional(v.string()),
      })
    ),
  })
    .index("by_email", ["email"])
    .index("by_token", ["tokenIdentifier"]),

  jobs: defineTable({
    userId: v.id("users"),
    title: v.string(),
    companyId: v.optional(v.id("companies")),
    companyName: v.string(),
    url: v.optional(v.string()),
    source: v.optional(v.string()),
    status: v.string(), // Saved, Applied, Interview, Offer, Rejected, Ghosted, Archived
    location: v.optional(v.string()),
    salary: v.optional(v.string()),
    remoteType: v.optional(v.string()), // remote, hybrid, onsite
    appliedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    cvVersionId: v.optional(v.id("cv_versions")),
    createdAt: v.number(),
    updatedAt: v.number(),
    fitScore: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"]),

  companies: defineTable({
    userId: v.optional(v.id("users")), // Optional if global/system company, but spec says "userId (optional if user-saved company)" - assuming mostly user-saved for now
    name: v.string(),
    website: v.optional(v.string()),
    industry: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_user", ["userId"]), // Note: userId is optional, so this index might need care if querying by it.

  recruiters: defineTable({
    userId: v.id("users"),
    jobId: v.optional(v.id("jobs")),
    companyId: v.optional(v.id("companies")),
    name: v.string(),
    role: v.optional(v.string()),
    email: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_email", ["email"]),

  cv_versions: defineTable({
    userId: v.id("users"),
    name: v.string(),
    text: v.optional(v.string()), // Full CV text or parsed JSON
    fileRef: v.optional(v.string()), // Convex storage ID or URL
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  email_templates: defineTable({
    userId: v.id("users"),
    title: v.string(),
    subject: v.optional(v.string()),
    body: v.string(),
    tags: v.optional(v.array(v.string())),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  ai_requests: defineTable({
    userId: v.id("users"),
    type: v.string(), // generateEmail, extractRequirements, etc.
    inputHash: v.optional(v.string()),
    model: v.string(), // gemini2.5, flash
    tokensUsed: v.number(),
    timestamp: v.number(),
    resultMeta: v.optional(v.any()), // size, success boolean
  }).index("by_user_timestamp", ["userId", "timestamp"]),

  activities: defineTable({
    userId: v.id("users"),
    type: v.string(), // applied, updated-status, ai-generated
    refId: v.optional(v.string()), // jobId or ai_request_id
    payload: v.optional(v.any()),
    createdAt: v.number(),
  }).index("by_user_created", ["userId", "createdAt"]),

  notifications: defineTable({
    userId: v.id("users"),
    jobId: v.optional(v.id("jobs")),
    type: v.string(), // follow-up, reminder
    when: v.number(),
    sent: v.boolean(),
    createdAt: v.number(),
  }).index("by_user_when", ["userId", "when"]),
});
