"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  IconUser,
  IconBriefcase,
  IconMail,
  IconPhone,
  IconCalendar,
  IconEye,
  IconEdit,
  IconTrash,
} from "@tabler/icons-react";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { motion } from "framer-motion";

interface RecruiterCardProps {
  recruiter: {
    _id: Id<"recruiters">;
    name: string;
    company: string;
    position?: string;
    email: string;
    phone?: string;
    jobCount: number;
    lastContact?: number;
    createdAt: number;
  };
  onView: () => void;
  onEdit: () => void;
}

export function RecruiterCard({
  recruiter,
  onView,
  onEdit,
}: RecruiterCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const deleteRecruiter = useMutation(api.recruiters.remove);

  const handleDelete = async () => {
    await deleteRecruiter({ recruiterId: recruiter._id });
    setShowDeleteDialog(false);
  };

  const formatLastContact = (timestamp?: number) => {
    if (!timestamp) return "Never";

    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return minutes <= 1 ? "Just now" : `${minutes} minutes ago`;
      }
      return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
    }
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) {
      const weeks = Math.floor(days / 7);
      return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
    }
    const months = Math.floor(days / 30);
    return months === 1 ? "1 month ago" : `${months} months ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group relative overflow-hidden border-border/50 bg-card/50 p-5 backdrop-blur-sm transition-all hover:border-primary/50 hover:shadow-lg">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-1 flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2">
                <IconUser className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-base leading-tight">
                  {recruiter.name}
                </h3>
                {recruiter.position && (
                  <p className="text-xs text-muted-foreground">
                    {recruiter.position}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Company */}
        <div className="mb-3 flex items-center gap-2 text-sm">
          <IconBriefcase className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{recruiter.company}</span>
        </div>

        {/* Contact Info */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <IconMail className="h-3.5 w-3.5" />
            <span className="truncate">{recruiter.email}</span>
          </div>
          {recruiter.phone && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <IconPhone className="h-3.5 w-3.5" />
              <span>{recruiter.phone}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mb-4 flex items-center gap-4 text-xs">
          <Badge variant="secondary" className="font-normal">
            💼 {recruiter.jobCount} {recruiter.jobCount === 1 ? "job" : "jobs"}
          </Badge>
          <div className="flex items-center gap-1 text-muted-foreground">
            <IconCalendar className="h-3.5 w-3.5" />
            <span>{formatLastContact(recruiter.lastContact)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={onView}
          >
            <IconEye className="mr-2 h-4 w-4" />
            View
          </Button>
          <Button size="icon" variant="ghost" onClick={onEdit}>
            <IconEdit className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => setShowDeleteDialog(true)}
          >
            <IconTrash className="h-4 w-4" />
          </Button>
        </div>

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onConfirm={handleDelete}
          title="Delete Recruiter"
          description={`Are you sure you want to delete ${recruiter.name}? This will unlink them from all associated jobs.`}
        />
      </Card>
    </motion.div>
  );
}
