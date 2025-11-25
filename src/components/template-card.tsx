"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconMail, IconEdit, IconTrash, IconCopy } from "@tabler/icons-react";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface TemplateCardProps {
  template: {
    _id: Id<"email_templates">;
    title: string;
    subject?: string;
    body: string;
    tags?: string[];
    createdAt: number;
  };
  onView: () => void;
  onEdit: () => void;
}

export function TemplateCard({ template, onView, onEdit }: TemplateCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const deleteTemplate = useMutation(api.templates.remove);

  const handleDelete = async () => {
    try {
      await deleteTemplate({ id: template._id });
      toast.success("Template deleted");
      setShowDeleteDialog(false);
    } catch (error) {
      toast.error("Failed to delete template");
      console.error(error);
    }
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const content = template.subject
        ? `${template.subject}\n\n${template.body}`
        : template.body;
      await navigator.clipboard.writeText(content);
      toast.success("Template copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy template");
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="group relative cursor-pointer overflow-hidden border-border/50 bg-card/50 p-4 backdrop-blur-sm transition-all hover:border-primary/50 hover:shadow-lg"
        onClick={onView}
      >
        {/* Header with Icon */}

        {/* Title */}
        <h3 className="mb-2 line-clamp-1 font-semibold text-base">
          {template.title}
        </h3>

        {/* Subject (if exists) */}
        {template.subject && (
          <p className="mb-2 line-clamp-1 text-sm text-muted-foreground">
            <span className="font-medium">Subject:</span> {template.subject}
          </p>
        )}

        {/* Body Preview */}
        <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
          {truncateText(template.body, 120)}
        </p>

        {/* Created Date */}
        <div className="flex items-start justify-between">
          <p className="text-xs text-muted-foreground/80">
            Created {formatDate(template.createdAt)}
          </p>
          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                handleCopy(e);
              }}
            >
              <IconCopy className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <IconEdit className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteDialog(true);
              }}
            >
              <IconTrash className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onConfirm={handleDelete}
          title="Delete Template"
          description={`Are you sure you want to delete "${template.title}"? This action cannot be undone.`}
        />
      </Card>
    </motion.div>
  );
}
