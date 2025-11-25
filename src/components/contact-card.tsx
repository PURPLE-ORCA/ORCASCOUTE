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
  IconBuilding,
  IconMail,
  IconPhone,
  IconBrandLinkedin,
  IconBriefcase,
  IconEye,
  IconEdit,
  IconTrash,
  IconClock,
} from "@tabler/icons-react";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { motion } from "framer-motion";

interface ContactCardProps {
  contact: {
    _id: Id<"contacts">;
    name: string;
    company?: {
      name: string;
    } | null;
    position?: string;
    email?: string;
    phone?: string;
    linkedIn?: string;
    jobCount: number;
    lastContact?: number;
  };
  onView: () => void;
  onEdit: () => void;
}

export function ContactCard({ contact, onView, onEdit }: ContactCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const deleteContact = useMutation(api.contacts.remove);

  const handleDelete = async () => {
    await deleteContact({ contactId: contact._id });
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
        return minutes <= 1 ? "Just now" : `${minutes} m ago`;
      }
      return hours === 1 ? "1 h ago" : `${hours} h ago`;
    }
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} d ago`;
    if (days < 30) {
      const weeks = Math.floor(days / 7);
      return weeks === 1 ? "1 w ago" : `${weeks} w ago`;
    }
    const months = Math.floor(days / 30);
    return months === 1 ? "1 mo ago" : `${months} mo ago`;
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
                  {contact.name}
                </h3>
                {contact.position && (
                  <p className="text-xs text-muted-foreground">
                    {contact.position}
                  </p>
                )}
              </div>
            </div>
            {contact.company && (
              <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                <IconBuilding className="h-3.5 w-3.5" />
                <span>{contact.company.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Contact Details */}
        <div className="mb-4 space-y-1.5">
          {contact.email && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <IconMail className="h-3.5 w-3.5" />
              <span className="truncate">{contact.email}</span>
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <IconPhone className="h-3.5 w-3.5" />
              <span className="truncate">{contact.phone}</span>
            </div>
          )}
          {contact.linkedIn && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <IconBrandLinkedin className="h-3.5 w-3.5" />
              <span className="truncate">LinkedIn Profile</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mb-4 flex items-center gap-4 text-xs">
          <Badge variant="secondary" className="font-normal">
            <IconBriefcase className="mr-1 h-3 w-3" />
            {contact.jobCount} {contact.jobCount === 1 ? "job" : "jobs"}
          </Badge>
          <div className="flex items-center text-muted-foreground">
            <IconClock className="mr-1 h-3 w-3" />
            {formatLastContact(contact.lastContact)}
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
          title="Delete Contact"
          itemName={contact.name}
          description={`Are you sure you want to delete ${contact.name}? This will unlink them from all associated jobs.`}
        />
      </Card>
    </motion.div>
  );
}
