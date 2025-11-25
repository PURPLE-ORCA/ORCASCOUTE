"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  IconX,
  IconEdit,
  IconTrash,
  IconCopy,
  IconMail,
} from "@tabler/icons-react";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface TemplateDetailViewProps {
  templateId: Id<"email_templates"> | null;
  onClose: () => void;
  onEdit?: (template: any) => void;
}

export function TemplateDetailView({
  templateId,
  onClose,
  onEdit,
}: TemplateDetailViewProps) {
  const template = useQuery(
    api.templates.get,
    templateId ? { id: templateId } : "skip"
  );
  const deleteTemplate = useMutation(api.templates.remove);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = async () => {
    if (!templateId) return;
    try {
      await deleteTemplate({ id: templateId });
      toast.success("Template deleted");
      setShowDeleteDialog(false);
      onClose();
    } catch (error) {
      toast.error("Failed to delete template");
      console.error(error);
    }
  };

  const handleCopySubject = async () => {
    if (!template?.subject) return;
    try {
      await navigator.clipboard.writeText(template.subject);
      toast.success("Subject copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy subject");
    }
  };

  const handleCopyBody = async () => {
    if (!template?.body) return;
    try {
      await navigator.clipboard.writeText(template.body);
      toast.success("Body copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy body");
    }
  };

  const handleCopyAll = async () => {
    if (!template) return;
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
      month: "long",
      day: "numeric",
    });
  };

  if (!templateId) return null;

  return (
    <AnimatePresence>
      {templateId && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Detail Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 h-full w-full overflow-y-auto border-l bg-background shadow-2xl sm:w-[600px]"
          >
            {template === undefined ? (
              <div className="flex h-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : template === null ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">Template not found</p>
              </div>
            ) : (
              <div className="flex h-full flex-col">
                {/* Header */}
                <div className="flex items-start justify-between border-b p-6">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <IconMail className="h-5 w-5 text-primary" />
                      </div>
                      <h2 className="font-bold text-2xl">{template.title}</h2>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Created {formatDate(template.createdAt)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="shrink-0"
                  >
                    <IconX className="h-5 w-5" />
                  </Button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {/* Subject */}
                  {template.subject && (
                    <>
                      <div className="mb-6">
                        <div className="mb-2 flex items-center justify-between">
                          <h3 className="font-semibold text-sm">Subject</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCopySubject}
                          >
                            <IconCopy className="mr-2 h-4 w-4" />
                            Copy
                          </Button>
                        </div>
                        <div className="rounded-lg border bg-muted/50 p-4">
                          <p className="text-sm">{template.subject}</p>
                        </div>
                      </div>
                      <Separator className="my-6" />
                    </>
                  )}

                  {/* Body */}
                  <div className="mb-6">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="font-semibold text-sm">Body</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyBody}
                      >
                        <IconCopy className="mr-2 h-4 w-4" />
                        Copy
                      </Button>
                    </div>
                    <div className="rounded-lg border bg-muted/50 p-4">
                      <p className="whitespace-pre-wrap text-sm">
                        {template.body}
                      </p>
                    </div>
                  </div>

                  {/* Tags */}
                  {template.tags && template.tags.length > 0 && (
                    <div className="mb-6">
                      <h3 className="mb-2 font-semibold text-sm">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {template.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                </div>

                {/* Actions Footer */}
                <div className="border-t p-6">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleCopyAll}
                    >
                      <IconCopy className="mr-2 h-4 w-4" />
                      Copy All
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        onEdit?.(template);
                        onClose();
                      }}
                    >
                      <IconEdit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <IconTrash className="mr-2 h-4 w-4" />
                      Delete
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
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
