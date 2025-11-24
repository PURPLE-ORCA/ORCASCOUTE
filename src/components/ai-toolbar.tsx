"use client";

import { motion } from "framer-motion";
import { IconSparkles, IconMail, IconFileText } from "@tabler/icons-react";
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"email" | "coverLetter">(
    "email"
  );

  // Check if user has profile and CV
  const hasProfile = user?.title || (user?.skills && user.skills.length > 0);
  const hasCVs = cvs && cvs.length > 0;
  const canUseAI = hasProfile && hasCVs;

  // Check quota
  const hasQuota =
    usage && usage.remaining !== undefined && usage.remaining > 0;
  const isLowQuota =
    usage && usage.remaining !== undefined && usage.remaining <= 5;

  const handleOpenDialog = (type: "email" | "coverLetter") => {
    setDialogType(type);
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
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <IconSparkles className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-sm">AI Assistant</h3>
          </div>
          {usage && (
            <span
              className={`text-xs font-medium ${
                isLowQuota ? "text-yellow-500" : "text-muted-foreground"
              }`}
            >
              {usage.remaining}/{usage.limit} uses left
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenDialog("email")}
            className="flex-1"
          >
            <IconMail className="mr-2 h-4 w-4" />
            Generate Email
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenDialog("coverLetter")}
            className="flex-1"
          >
            <IconFileText className="mr-2 h-4 w-4" />
            Cover Letter
          </Button>
        </div>

        {isLowQuota && (
          <p className="text-xs text-yellow-500 mt-2">
            ⚠️ Only {usage?.remaining} generations remaining this month
          </p>
        )}
      </motion.div>

      <AIGenerationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        jobId={jobId}
        type={dialogType}
      />
    </>
  );
}
