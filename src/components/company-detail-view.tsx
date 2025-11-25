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
import { AddCompanyDialog } from "@/components/add-company-dialog";
import ReactMarkdown from "react-markdown";
import {
  IconMail,
  IconBrandLinkedin,
  IconBuilding,
  IconTrash,
  IconEdit,
  IconX,
  IconExternalLink,
  IconUsers,
  IconBriefcase,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface CompanyDetailViewProps {
  companyId: Id<"companies"> | null;
  onClose: () => void;
}

export function CompanyDetailView({
  companyId,
  onClose,
}: CompanyDetailViewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const companyData = useQuery(
    api.companies.get,
    companyId ? { companyId } : "skip"
  );
  const deleteCompany = useMutation(api.companies.remove);

  useOnClickOutside(ref as React.RefObject<HTMLElement>, (event) => {
    const target = event.target as HTMLElement;
    if (
      target.closest('[role="dialog"]') ||
      target.closest('[role="listbox"]') ||
      target.closest(".radix-select-content")
    ) {
      return;
    }

    if (!showDeleteDialog && !showEditDialog) {
      onClose();
    }
  });

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !showDeleteDialog && !showEditDialog) {
        onClose();
      }
    }

    if (companyId) {
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }
  }, [companyId, onClose, showDeleteDialog, showEditDialog]);

  const handleDelete = async () => {
    if (!companyId) return;

    setIsDeleting(true);
    try {
      await deleteCompany({ companyId });
      toast.success("Company deleted successfully");
      onClose();
    } catch (error) {
      console.error("Failed to delete company:", error);
      toast.error("Failed to delete company");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleJobClick = (jobId: Id<"jobs">) => {
    router.push(`/jobs?selected=${jobId}`);
    onClose();
  };

  if (!companyId || !companyData) return null;

  return (
    <>
      <AnimatePresence>
        {companyId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-40 bg-black/20 backdrop-blur-md"
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {companyId && companyData && (
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
                  <h2 className="font-bold text-2xl">{companyData.name}</h2>
                  <p className="text-muted-foreground">Company</p>
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
                </div>
              </div>

              {/* Contact Information */}
              <div className="rounded-lg border bg-card/50 p-4">
                <h3 className="mb-3 font-semibold text-sm">
                  Contact Information
                </h3>
                <div className="space-y-2">
                  {companyData.emails.map((email, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm"
                    >
                      <IconMail className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`mailto:${email}`}
                        className="text-primary hover:underline"
                      >
                        {email}
                      </a>
                    </div>
                  ))}
                  {companyData.linkedInProfiles &&
                    companyData.linkedInProfiles.map((profile, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm"
                      >
                        <IconBrandLinkedin className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={profile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          LinkedIn Profile
                          <IconExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    ))}
                </div>
              </div>

              {/* Tags */}
              {companyData.tags && companyData.tags.length > 0 && (
                <div>
                  <h3 className="mb-2 font-semibold text-sm">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {companyData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {companyData.notes && (
                <div>
                  <h3 className="mb-2 font-semibold text-sm">Notes</h3>
                  <div className="prose prose-sm dark:prose-invert max-w-none rounded-lg border bg-card/50 p-4 text-muted-foreground">
                    <ReactMarkdown>{companyData.notes}</ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Related Contacts */}
              <div>
                <h3 className="mb-3 font-semibold text-sm">
                  <IconUsers className="mr-2 inline h-4 w-4" />
                  Contacts ({companyData.contacts.length})
                </h3>
                {companyData.contacts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No contacts at this company yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {companyData.contacts.map((contact) => (
                      <div
                        key={contact._id}
                        className="rounded-lg border bg-card/50 p-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm">
                              {contact.name}
                            </p>
                            {contact.position && (
                              <p className="text-xs text-muted-foreground">
                                {contact.position}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {contact.email}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Related Jobs */}
              <div>
                <h3 className="mb-3 font-semibold text-sm">
                  <IconBriefcase className="mr-2 inline h-4 w-4" />
                  Related Jobs ({companyData.jobs.length})
                </h3>
                {companyData.jobs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No jobs linked to this company yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {companyData.jobs.map((job) => (
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        title="Delete Company"
        itemName={companyData?.name}
        description={`Are you sure you want to delete ${companyData?.name}? This will unlink all associated contacts and jobs.`}
        isLoading={isDeleting}
      />

      {/* Edit Dialog */}
      {showEditDialog && companyData && (
        <AddCompanyDialog
          company={companyData}
          onSuccess={() => setShowEditDialog(false)}
        >
          <div />
        </AddCompanyDialog>
      )}
    </>
  );
}
