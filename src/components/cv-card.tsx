"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  IconFileTypePdf,
  IconFileTypeDocx,
  IconDownload,
  IconEdit,
  IconTrash,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { motion } from "framer-motion";

interface CVCardProps {
  cv: {
    _id: Id<"cv_versions">;
    name: string;
    fileRef?: string;
    createdAt: number;
  };
}

export function CVCard({ cv }: CVCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(cv.name);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const updateCVName = useMutation(api.cvs.updateCVName);
  const deleteCV = useMutation(api.cvs.deleteCV);
  const cvUrl = useQuery(
    api.cvs.getCVUrl,
    cv.fileRef ? { storageId: cv.fileRef as Id<"_storage"> } : "skip"
  );

  const fileType = cv.name.toLowerCase().endsWith(".pdf") ? "pdf" : "docx";

  const handleSaveName = async () => {
    if (editedName.trim() && editedName !== cv.name) {
      await updateCVName({ cvId: cv._id, name: editedName.trim() });
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedName(cv.name);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    await deleteCV({ cvId: cv._id });
    setShowDeleteDialog(false);
  };

  const handleDownload = () => {
    if (cvUrl) {
      window.open(cvUrl, "_blank");
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group relative overflow-hidden border-border/50 bg-card/50 p-4 backdrop-blur-sm transition-all hover:border-primary/50 hover:shadow-lg">
        {/* File Type Icon */}
        <div className="flex items-start justify-between">
          <div className="rounded-lg bg-background/50 p-3">
            {fileType === "pdf" ? (
              <IconFileTypePdf className="h-8 w-8 text-red-500" />
            ) : (
              <IconFileTypeDocx className="h-8 w-8 text-blue-500" />
            )}
          </div>
        </div>

        {/* CV Name */}
        <div className="">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveName();
                  if (e.key === "Escape") handleCancelEdit();
                }}
                className="h-8 text-sm"
                autoFocus
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={handleSaveName}
              >
                <IconCheck className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={handleCancelEdit}
              >
                <IconX className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <h3 className="line-clamp-2 text-sm font-semibold">{cv.name}</h3>
          )}
        </div>

        {/* Upload Date */}
        <p className="text-xs text-muted-foreground">
          Uploaded {formatDate(cv.createdAt)}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={handleDownload}
            disabled={!cvUrl}
          >
            <IconDownload className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsEditing(true)}
            disabled={isEditing}
          >
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
          title="Delete CV"
          description={`Are you sure you want to delete "${cv.name}"? This action cannot be undone.`}
        />
      </Card>
    </motion.div>
  );
}
