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
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
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
              maxOutputTokens: 500,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const generatedText =
        data.candidates?.[0]?.content?.parts?.[0]?.text || "";

      if (!generatedText) {
        throw new Error("No content generated");
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

    if (!cv?.text) {
      throw new Error("CV text not available. Please upload a CV first.");
    }

    // Build the prompt for Gemini
    const prompt = buildCoverLetterPrompt({
      job,
      user,
      cvText: cv.text,
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
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
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
                  ? 1500
                  : args.length === "medium"
                  ? 1000
                  : 600,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const generatedText =
        data.candidates?.[0]?.content?.parts?.[0]?.text || "";

      if (!generatedText) {
        throw new Error("No content generated");
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

  const toneInstructions = {
    professional: "Use a formal, professional tone. Be respectful and concise.",
    friendly:
      "Use a warm, approachable tone while maintaining professionalism.",
    enthusiastic:
      "Use an energetic, passionate tone that shows genuine excitement about the opportunity.",
  };

  return `You are a professional career advisor helping a job seeker write an email to a recruiter.

Job Details:
- Company: ${job.companyName}
- Position: ${job.title}
${job.url ? `- Job URL: ${job.url}` : ""}
${job.location ? `- Location: ${job.location}` : ""}
${job.salary ? `- Salary: ${job.salary}` : ""}

User Profile:
- Name: ${user.name}
${user.title ? `- Current Title: ${user.title}` : ""}
${
  user.skills && user.skills.length > 0
    ? `- Skills: ${user.skills.join(", ")}`
    : ""
}
${user.defaultSignature ? `- Signature: ${user.defaultSignature}` : ""}

${
  cvText
    ? `CV Summary (extract key relevant points):\n${cvText.substring(0, 1000)}`
    : ""
}

${additionalContext ? `Additional Context: ${additionalContext}` : ""}

Tone: ${toneInstructions[tone]}

Generate a professional email expressing interest in the position. Follow these guidelines:
1. Start with a clear subject line (format: "Subject: [your subject]")
2. Keep the email concise (150-250 words)
3. Highlight 2-3 relevant skills or experiences that match the job
4. Show genuine interest in the company and role
5. Include a clear call to action (e.g., request for interview, availability to discuss)
6. End with the user's signature if provided, otherwise use "Best regards, ${
    user.name
  }"

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

  const lengthInstructions = {
    short: "Keep it to 1 page (approximately 250-300 words, 3 paragraphs)",
    medium:
      "Write a standard cover letter (approximately 350-450 words, 4 paragraphs)",
    detailed:
      "Write a comprehensive cover letter (approximately 500-600 words, 5 paragraphs)",
  };

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
${user.title ? `- Current Title: ${user.title}` : ""}
${
  user.skills && user.skills.length > 0
    ? `- Skills: ${user.skills.join(", ")}`
    : ""
}

CV Content:
${cvText}

Focus Areas (prioritize these in the letter):
${
  focusAreas.length > 0
    ? focusAreas.map((area, i) => `${i + 1}. ${area}`).join("\n")
    : "General experience and skills"
}

Length: ${lengthInstructions[length]}

Generate a professional cover letter following these guidelines:
1. Use proper business letter format with contact information and date
2. Address to "Hiring Manager" (or specific name if mentioned in job notes)
3. Opening paragraph: Express interest and briefly state why you're a good fit
4. Body paragraphs: Highlight relevant experience, skills, and achievements from the CV that match the job requirements
5. Focus on the specified focus areas
6. Closing paragraph: Express enthusiasm, mention availability, and thank them
7. Sign off with "Sincerely," followed by the user's name

Make it compelling, specific to this job, and demonstrate clear value proposition.`;
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
