"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useOnClickOutside } from "usehooks-ts";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { AddContactDialog } from "@/components/add-contact-dialog";
import { CompanyDetailView } from "@/components/company-detail-view";
import ReactMarkdown from "react-markdown";
import {
  IconMail,
  IconPhone,
  IconBrandLinkedin,
  IconBriefcase,
  IconTrash,
  IconEdit,
  IconX,
  IconClock,
  IconExternalLink,
  IconBuilding,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ContactDetailViewProps {
  contactId: Id<"contacts"> | null;
  onClose: () => void;
}

export function ContactDetailView({
  contactId,
  onClose,
}: ContactDetailViewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] =
    useState<Id<"companies"> | null>(null);

  const contactData = useQuery(
    api.contacts.get,
    contactId ? { contactId } : "skip"
  );
  const updateLastContact = useMutation(api.contacts.updateLastContact);
  const deleteContact = useMutation(api.contacts.remove);

  useOnClickOutside(ref as React.RefObject<HTMLElement>, (event) => {
    const target = event.target as HTMLElement;
    if (
      target.closest('[role="dialog"]') ||
      target.closest('[role="listbox"]') ||
      target.closest(".radix-select-content")
    ) {
      return;
    }

    if (!showDeleteDialog && !showEditDialog && !selectedCompanyId) {
      onClose();
    }
  });

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        event.key === "Escape" &&
        !showDeleteDialog &&
        !showEditDialog &&
        !selectedCompanyId
      ) {
        onClose();
      }
    }

    if (contactId) {
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }
  }, [contactId, onClose, showDeleteDialog, showEditDialog, selectedCompanyId]);

  const handleDelete = async () => {
    if (!contactId) return;

    setIsDeleting(true);
    try {
      await deleteContact({ contactId });
      toast.success("Contact deleted successfully");
      onClose();
    } catch (error) {
      console.error("Failed to delete contact:", error);
      toast.error("Failed to delete contact");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLogContact = async () => {
    if (!contactId) return;

    try {
      await updateLastContact({ contactId });
      toast.success("Contact logged successfully");
    } catch (error) {
      console.error("Failed to log contact:", error);
      toast.error("Failed to log contact");
    }
  };

  const handleSendEmail = () => {
    if (contactData) {
      window.location.href = `mailto:${contactData.email}`;
    }
  };

  const handleOpenLinkedIn = () => {
    if (contactData?.linkedIn) {
      window.open(contactData.linkedIn, "_blank");
    }
  };

  const handleJobClick = (jobId: Id<"jobs">) => {
    router.push(`/jobs?selected=${jobId}`);
    onClose();
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

  if (!contactId || !contactData) return null;

  return (
    <>
      <AnimatePresence>
        {contactId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-40 bg-black/20 backdrop-blur-md"
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {contactId && contactData && (
          <div className="fixed inset-0 z-50 grid place-items-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              ref={ref}
              className="flex max-h-[90vh] w-full max-w-2xl cursor-auto flex-col gap-4 overflow-y-auto rounded-xl border bg-background p-6 shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="font-bold text-2xl">{contactData.name}</h2>
                  <p className="text-muted-foreground">
                    {contactData.position && `${contactData.position}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowEditDialog(true)}
                  >
                    <IconEdit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <IconTrash className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={onClose}>
                    <IconX className="h-4 w-4" />
                  </Button>
                  {contactData.linkedIn && (
                    <div className="flex items-center gap-2 text-sm">
                      <IconBrandLinkedin className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={contactData.linkedIn}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        LinkedIn Profile
                        <IconExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                  {contactData.company ? (
                    <div className="flex items-center gap-2 text-sm">
                      <IconBuilding className="h-4 w-4 text-muted-foreground" />
                      <button
                        onClick={() =>
                          setSelectedCompanyId(contactData.company!._id)
                        }
                        className="text-primary hover:underline"
                      >
                        {contactData.company.name}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <IconBuilding className="h-4 w-4" />
                      <span>No company linked</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <IconClock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Last contact: {formatLastContact(contactData.lastContact)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {contactData.tags && contactData.tags.length > 0 && (
                <div>
                  <h3 className="mb-2 font-semibold text-sm">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {contactData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {contactData.notes && (
                <div>
                  <h3 className="mb-2 font-semibold text-sm">Notes</h3>
                  <div className="prose prose-sm dark:prose-invert max-w-none rounded-lg border bg-card/50 p-4 text-muted-foreground">
                    <ReactMarkdown>{contactData.notes}</ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Related Jobs */}
              <div>
                <h3 className="mb-3 font-semibold text-sm">
                  Related Jobs ({contactData.jobs.length})
                </h3>
                {contactData.jobs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No jobs linked to this contact yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {contactData.jobs.map((job) => (
                      <button
                        key={job._id}
                        onClick={() => handleJobClick(job._id)}
                        className="w-full rounded-lg border bg-card/50 p-3 text-left transition-colors hover:bg-accent"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm">{job.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {job.companyName}
                            </p>
                          </div>
                          <Badge variant="outline" className="capitalize">
                            {job.status}
                          </Badge>
                        </div>
                        {job.appliedAt && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Applied:{" "}
                            {new Date(job.appliedAt).toLocaleDateString()}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 border-t pt-4">
                <Button onClick={handleSendEmail} variant="outline">
                  <IconMail className="mr-2 h-4 w-4" />
                  Send Email
                </Button>
                {contactData.linkedIn && (
                  <Button onClick={handleOpenLinkedIn} variant="outline">
                    <IconBrandLinkedin className="mr-2 h-4 w-4" />
                    Open LinkedIn
                  </Button>
                )}
                <Button onClick={handleLogContact} variant="outline">
                  <IconClock className="mr-2 h-4 w-4" />
                  Log Contact
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        title="Delete Contact"
        itemName={contactData?.name}
        description={`Are you sure you want to delete ${contactData?.name}? This will unlink them from all associated jobs.`}
        isLoading={isDeleting}
      />

      {/* Edit Dialog */}
      {showEditDialog && contactData && (
        <AddContactDialog
          contact={contactData}
          onSuccess={() => setShowEditDialog(false)}
        >
          <div />
        </AddContactDialog>
      )}

      {/* Company Detail View (Nested) */}
      {selectedCompanyId && (
        <CompanyDetailView
          companyId={selectedCompanyId}
          onClose={() => setSelectedCompanyId(null)}
        />
      )}
    </>
  );
}
