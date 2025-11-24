import { v } from "convex/values";
import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

/**
 * Generate a personalized email for a job application
 */
export const generateEmail = action({
  args: {
    jobId: v.id("jobs"),
    cvId: v.optional(v.id("cv_versions")),
    tone: v.union(
      v.literal("professional"),
      v.literal("friendly"),
      v.literal("enthusiastic")
    ),
    additionalContext: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    // Fetch job details
    const job = await ctx.runQuery(api.jobs.get, {
      id: args.jobId,
    });

    if (!job) {
      throw new Error("Job not found");
    }

    // Fetch user profile
    const user = await ctx.runQuery(api.users.getByToken, {
      tokenIdentifier: identity.tokenIdentifier,
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Fetch CV content if provided
    let cvText = "";
    if (args.cvId) {
      const cv = await ctx.runQuery(api.cvs.getCV, {
        cvId: args.cvId,
      });
      cvText = cv?.text || "";
    }

    // Build the prompt for Gemini
    const prompt = buildEmailPrompt({
      job,
      user,
      cvText,
      tone: args.tone,
      additionalContext: args.additionalContext,
    });

    // Call Gemini 2.5 Pro API
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2000, // Increased to allow for thinking tokens
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("Gemini API Response:", JSON.stringify(data, null, 2));

      const candidate = data.candidates?.[0];
      const generatedText = candidate?.content?.parts?.[0]?.text || "";

      if (!generatedText) {
        const finishReason = candidate?.finishReason;
        const safetyRatings = candidate?.safetyRatings;
        throw new Error(
          `No content generated. Finish reason: ${finishReason}. Safety ratings: ${JSON.stringify(
            safetyRatings
          )}`
        );
      }

      // Track usage
      await ctx.runMutation(internal.aiUsage.recordUsage, {
        userId: user._id,
        type: "email",
        jobId: args.jobId,
        tokensUsed: data.usageMetadata?.totalTokenCount || 0,
      });

      // Parse the generated email
      const emailParts = parseGeneratedEmail(generatedText);

      return {
        subject: emailParts.subject,
        body: emailParts.body,
        fullText: generatedText,
      };
    } catch (error) {
      console.error("Error generating email:", error);
      throw new Error(
        `Failed to generate email: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  },
});

/**
 * Generate a personalized cover letter for a job application
 */
export const generateCoverLetter = action({
  args: {
    jobId: v.id("jobs"),
    cvId: v.id("cv_versions"), // Required for cover letters
    length: v.union(
      v.literal("short"),
      v.literal("medium"),
      v.literal("detailed")
    ),
    focusAreas: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    // Fetch job details
    const job = await ctx.runQuery(api.jobs.get, {
      id: args.jobId,
    });

    if (!job) {
      throw new Error("Job not found");
    }

    // Fetch user profile
    const user = await ctx.runQuery(api.users.getByToken, {
      tokenIdentifier: identity.tokenIdentifier,
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Fetch CV content (required)
    const cv = await ctx.runQuery(api.cvs.getCV, {
      cvId: args.cvId,
    });

    // Use CV text if available, otherwise fallback to profile data
    let cvText = cv?.text || "";
    if (!cvText) {
      console.log("CV text not found, falling back to profile data");
      cvText = `
        Name: ${user.name}
        Title: ${user.title || "N/A"}
        Skills: ${user.skills?.join(", ") || "N/A"}
        Email: ${user.email}
      `;
    }

    // Build the prompt for Gemini
    const prompt = buildCoverLetterPrompt({
      job,
      user,
      cvText,
      length: args.length,
      focusAreas: args.focusAreas,
    });

    // Call Gemini 2.5 Pro API
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens:
                args.length === "detailed"
                  ? 5000
                  : args.length === "medium"
                  ? 3000
                  : 2000,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("Gemini API Response:", JSON.stringify(data, null, 2));

      const candidate = data.candidates?.[0];
      const generatedText = candidate?.content?.parts?.[0]?.text || "";

      if (!generatedText) {
        const finishReason = candidate?.finishReason;
        const safetyRatings = candidate?.safetyRatings;
        throw new Error(
          `No content generated. Finish reason: ${finishReason}. Safety ratings: ${JSON.stringify(
            safetyRatings
          )}`
        );
      }

      // Track usage
      await ctx.runMutation(internal.aiUsage.recordUsage, {
        userId: user._id,
        type: "coverLetter",
        jobId: args.jobId,
        tokensUsed: data.usageMetadata?.totalTokenCount || 0,
      });

      return {
        content: generatedText,
      };
    } catch (error) {
      console.error("Error generating cover letter:", error);
      throw new Error(
        `Failed to generate cover letter: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  },
});

// Helper functions

function buildEmailPrompt(params: {
  job: any;
  user: any;
  cvText: string;
  tone: "professional" | "friendly" | "enthusiastic";
  additionalContext?: string;
}): string {
  const { job, user, cvText, tone, additionalContext } = params;

  return `You are a professional career advisor helping a job seeker write an email to a recruiter.

Job Details:
- Company: ${job.companyName}
- Position: ${job.title}
${job.url ? `- Job URL: ${job.url}` : ""}
${job.location ? `- Location: ${job.location}` : ""}

User Profile:
- Name: ${user.name}
- Email: ${user.email}
- Phone: ${user.phone || "[Phone Number]"}
${user.portfolioUrl ? `- Portfolio/GitHub: ${user.portfolioUrl}` : ""}
${user.title ? `- Current Title: ${user.title}` : ""}
${
  user.skills && user.skills.length > 0
    ? `- Skills: ${user.skills.join(", ")}`
    : ""
}

${
  cvText
    ? `CV Summary (extract key relevant points):\n${cvText.substring(0, 1000)}`
    : ""
}

${additionalContext ? `Additional Context: ${additionalContext}` : ""}

Selected Tone: ${tone}

STRICTLY FOLLOW THESE RULES FOR THE EMAIL:
1. Keep it short, polite, and confident.
2. Mention the position title and company name.
3. Explicitly state that the CV and cover letter are attached.
4. Include availability for an interview.
5. Tone must be professional but warm, not robotic.
6. NO clichés like "I have the honor..." or overly formal archaic phrasing.
7. Optional: Include one short line showing relevance to the job/company.
8. End with the signature block:
   ${user.name}
   ${user.phone || "[Phone Number]"}
   ${user.email}
   ${user.portfolioUrl ? user.portfolioUrl : ""}

Format the response as:
Subject: [subject line]

[email body]`;
}

function buildCoverLetterPrompt(params: {
  job: any;
  user: any;
  cvText: string;
  length: "short" | "medium" | "detailed";
  focusAreas: string[];
}): string {
  const { job, user, cvText, length, focusAreas } = params;

  return `You are a professional career advisor helping a job seeker write a cover letter.

Job Details:
- Company: ${job.companyName}
- Position: ${job.title}
${job.url ? `- Job URL: ${job.url}` : ""}
${job.location ? `- Location: ${job.location}` : ""}
${job.notes ? `- Job Notes: ${job.notes}` : ""}

User Profile:
- Name: ${user.name}
- Email: ${user.email}
- Phone: ${user.phone || "[Phone Number]"}
${user.title ? `- Current Title: ${user.title}` : ""}
${
  user.skills && user.skills.length > 0
    ? `- Skills: ${user.skills.join(", ")}`
    : ""
}

CV Content:
${cvText}

Focus Areas:
${
  focusAreas.length > 0
    ? focusAreas.map((area, i) => `${i + 1}. ${area}`).join("\n")
    : "General experience and skills"
}

Length: ${length}

STRICTLY FOLLOW THESE RULES FOR THE COVER LETTER:

✅ STRUCTURE
1. Subject line (Objet)
2. Professional greeting
3. Paragraph 1: Who I am + what I’m applying for
4. Paragraph 2: Experience + relevant technologies (highlight real projects)
5. Paragraph 3: Relevant projects + results (emphasize autonomy, delivery, deadlines, collaboration)
6. Paragraph 4: Why this company + motivation
7. Closing line + availability
8. Signature

✅ TONE REQUIREMENTS
- Professional, confident, smooth, and natural.
- Assertive but not arrogant.
- NO exaggerated formal French/English phrasing.
- NO slang.
- NO stiff admin-style phrasing.
- NO begging for the job or sounding unsure.
- NO overuse of "I would like" or "I wish".
- Do NOT write like a student with no confidence.

✅ STYLE RULES
- Highlight real projects.
- Mention relevant tech stack naturally without listing it like a CV.
- Keep sentences clear and not too long.
- NO spelling or grammar mistakes.
- NO overuse of buzzwords.
- Do NOT copy CV bullet points.

✅ CUSTOMIZATION RULES
Adapt based on the job details:
- If React/Laravel/Full-Stack: Emphasize full-stack work and app features.
- If SEO/WordPress: Emphasize blog, optimization, on-page & technical SEO.
- If Maintenance/Support: Emphasize fixing bugs, evolving apps, reliability.
- If Branding/Content: Emphasize creativity, digital presence, visuals.
- If years of experience mentioned: Reposition as practical experience, real delivered projects, and ability to ramp up fast.

Generate a professional cover letter following these strict guidelines.`;
}

function parseGeneratedEmail(text: string): {
  subject: string;
  body: string;
} {
  const lines = text.split("\n");
  let subject = "";
  let body = "";
  let foundSubject = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.toLowerCase().startsWith("subject:")) {
      subject = line.substring(8).trim();
      foundSubject = true;
    } else if (foundSubject && line) {
      // Start collecting body after subject
      body = lines.slice(i).join("\n").trim();
      break;
    }
  }

  // Fallback if parsing fails
  if (!subject) {
    subject = "Application for Position";
  }
  if (!body) {
    body = text;
  }

  return { subject, body };
}
