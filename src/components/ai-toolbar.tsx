"use client";

import { motion } from "framer-motion";
import {
  IconSparkles,
  IconMail,
  IconFileText,
  IconEye,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";
import { AIGenerationDialog } from "@/components/ai-generation-dialog";
import Link from "next/link";

type AIToolbarProps = {
  jobId: Id<"jobs">;
};

export function AIToolbar({ jobId }: AIToolbarProps) {
  const user = useQuery(api.users.getViewer);
  const cvs = useQuery(api.cvs.getCVs);
  const usage = useQuery(api.aiUsage.getMonthlyUsage);

  // Fetch saved content
  const savedEmail = useQuery(api.ai.getGeneratedContent, {
    jobId,
    type: "email",
  });
  const savedCoverLetter = useQuery(api.ai.getGeneratedContent, {
    jobId,
    type: "coverLetter",
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"email" | "coverLetter">(
    "email"
  );
  const [dialogInitialContent, setDialogInitialContent] = useState<{
    content: string;
    subject?: string;
  } | null>(null);

  // Check if user has profile and CV
  const hasProfile = user?.title || (user?.skills && user.skills.length > 0);
  const hasCVs = cvs && cvs.length > 0;
  const canUseAI = hasProfile && hasCVs;

  // Check quota
  const hasQuota =
    usage && usage.remaining !== undefined && usage.remaining > 0;
  const isLowQuota =
    usage && usage.remaining !== undefined && usage.remaining <= 5;

  const handleOpenDialog = (
    type: "email" | "coverLetter",
    initialContent?: { content: string; subject?: string } | null
  ) => {
    setDialogType(type);
    setDialogInitialContent(initialContent || null);
    setDialogOpen(true);
  };

  // Show setup guidance if prerequisites not met
  if (!canUseAI) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-primary/20 bg-linear-to-r from-primary/5 to-purple-500/5 p-4 backdrop-blur-sm"
      >
        <div className="flex items-center gap-2 mb-3">
          <IconSparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-sm">AI Assistant</h3>
        </div>

        <div className="rounded-md border border-yellow-500/20 bg-yellow-500/10 p-3">
          <p className="text-sm font-medium mb-2">
            ⚠️ Complete your profile to unlock AI
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            To use AI features, you need:
          </p>
          <ul className="text-xs text-muted-foreground space-y-1 mb-3">
            <li className="flex items-center gap-2">
              {hasProfile ? "✓" : "✗"} Profile information
            </li>
            <li className="flex items-center gap-2">
              {hasCVs ? "✓" : "✗"} At least one CV uploaded
            </li>
          </ul>
          <div className="flex gap-2">
            {!hasProfile && (
              <Link href="/profile">
                <Button variant="outline" size="sm">
                  Complete Profile
                </Button>
              </Link>
            )}
            {!hasCVs && (
              <Link href="/cvs">
                <Button variant="outline" size="sm">
                  Upload CV
                </Button>
              </Link>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // Show quota exceeded message
  if (!hasQuota) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-primary/20 bg-linear-to-r from-primary/5 to-purple-500/5 p-4 backdrop-blur-sm"
      >
        <div className="flex items-center gap-2 mb-3">
          <IconSparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-sm">AI Assistant</h3>
        </div>

        <div className="rounded-md border border-red-500/20 bg-red-500/10 p-3">
          <p className="text-sm font-medium mb-1">❌ Monthly quota reached</p>
          <p className="text-xs text-muted-foreground">
            You've used all {usage?.limit} AI generations this month. Quota
            resets on the 1st.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-primary/20 bg-linear-to-r from-primary/5 to-purple-500/5 p-4 backdrop-blur-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <IconSparkles className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-sm">AI Assistant</h3>
          </div>
          {usage && (
            <div className="text-xs text-muted-foreground">
              <span
                className={
                  isLowQuota ? "text-yellow-500 font-medium" : "text-primary"
                }
              >
                {usage.remaining}
              </span>{" "}
              generations left
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant={savedEmail ? "secondary" : "outline"}
            className="w-full justify-start h-auto py-3 px-4"
            onClick={() =>
              handleOpenDialog(
                "email",
                savedEmail
                  ? { content: savedEmail.content, subject: savedEmail.subject }
                  : null
              )
            }
          >
            {savedEmail ? (
              <IconEye className="mr-2 h-4 w-4 text-primary" />
            ) : (
              <IconMail className="mr-2 h-4 w-4" />
            )}
            <div className="flex flex-col items-start text-left">
              <span className="text-sm font-medium">
                {savedEmail ? "View Saved Email" : "Generate Email"}
              </span>
              <span className="text-xs text-muted-foreground font-normal">
                {savedEmail ? "Open saved draft" : "Personalized outreach"}
              </span>
            </div>
          </Button>

          <Button
            variant={savedCoverLetter ? "secondary" : "outline"}
            className="w-full justify-start h-auto py-3 px-4"
            onClick={() =>
              handleOpenDialog(
                "coverLetter",
                savedCoverLetter ? { content: savedCoverLetter.content } : null
              )
            }
          >
            {savedCoverLetter ? (
              <IconEye className="mr-2 h-4 w-4 text-primary" />
            ) : (
              <IconFileText className="mr-2 h-4 w-4" />
            )}
            <div className="flex flex-col items-start text-left">
              <span className="text-sm font-medium">
                {savedCoverLetter ? "View Saved Letter" : "Cover Letter"}
              </span>
              <span className="text-xs text-muted-foreground font-normal">
                {savedCoverLetter ? "Open saved draft" : "Tailored to job"}
              </span>
            </div>
          </Button>
        </div>
      </motion.div>

      <AIGenerationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        jobId={jobId}
        type={dialogType}
        initialContent={dialogInitialContent}
      />
    </>
  );
}
