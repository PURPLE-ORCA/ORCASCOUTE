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
    contactId: v.optional(v.id("contacts")), // Link to contact (HR person)
    emailDbCompanyId: v.optional(v.id("companies")), // Link to company from Email DB
    createdAt: v.number(),
    updatedAt: v.number(),
    fitScore: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"])
    .index("by_contact", ["contactId"])
    .index("by_emaildb_company", ["emailDbCompanyId"]),

  companies: defineTable({
    userId: v.id("users"),
    name: v.string(),
    emails: v.array(v.string()), // ["jobs@company.com", "hr@company.com"]
    linkedInProfiles: v.optional(v.array(v.string())), // Company page, careers page
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_name", ["name"]),

  contacts: defineTable({
    userId: v.id("users"),
    name: v.string(),
    email: v.optional(v.string()), // Primary email (most important)
    linkedIn: v.optional(v.string()), // Second most important
    phone: v.optional(v.string()), // Third most important
    companyId: v.optional(v.id("companies")), // Link to company
    position: v.optional(v.string()),
    lastContact: v.optional(v.number()),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_company", ["companyId"])
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

  generated_content: defineTable({
    userId: v.id("users"),
    jobId: v.id("jobs"),
    type: v.union(v.literal("email"), v.literal("coverLetter")),
    content: v.string(),
    subject: v.optional(v.string()), // Only for emails
    createdAt: v.number(),
  })
    .index("by_job_and_type", ["jobId", "type"])
    .index("by_user", ["userId"]),

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
