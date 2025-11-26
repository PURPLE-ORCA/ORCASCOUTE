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
import { AIToolbar } from "@/components/ai-toolbar";
import { EmailDbSelector } from "@/components/email-db-selector";
import ReactMarkdown from "react-markdown";
import {
  IconExternalLink,
  IconTrash,
  IconEdit,
  IconX,
  IconUser,
  IconMail,
  IconBuilding,
  IconCalendar,
  IconLink,
  IconCopy,
} from "@tabler/icons-react";
import { toast } from "sonner";

type Job = {
  _id: Id<"jobs">;
  title: string;
  companyName: string;
  url?: string;
  location?: string;
  salary?: string;
  remoteType?: string;
  notes?: string;
  status: string;
  contactId?: Id<"contacts">;
  emailDbCompanyId?: Id<"companies">;
  createdAt: number;
  updatedAt: number;
  appliedAt?: number;
};

type ExpandableJobDetailProps = {
  job: Job | null;
  onClose: () => void;
  onEdit: (job: Job) => void;
};

export function ExpandableJobDetail({
  job,
  onClose,
  onEdit,
}: ExpandableJobDetailProps) {
  const ref = useRef<HTMLDivElement>(null);
  const deleteJob = useMutation(api.jobs.remove);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch contact data if linked
  const contact = useQuery(
    api.contacts.get,
    job?.contactId ? { contactId: job.contactId } : "skip"
  );

  // Fetch company data if linked
  const company = useQuery(
    api.companies.get,
    job?.emailDbCompanyId ? { companyId: job.emailDbCompanyId } : "skip"
  );

  useOnClickOutside(ref as React.RefObject<HTMLElement>, (event) => {
    // Ignore clicks inside dialogs or select dropdowns (which are in portals)
    const target = event.target as HTMLElement;

    // Check if the click target is within a Radix UI portal or other overlay
    const isInsidePortal =
      target.closest("[data-radix-portal]") ||
      target.closest('[role="dialog"]') ||
      target.closest('[role="listbox"]') ||
      target.closest(".radix-select-content");

    if (isInsidePortal) {
      return;
    }

    if (!showDeleteDialog) {
      onClose();
    }
  });

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !showDeleteDialog) {
        onClose();
      }
    }

    if (job) {
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }
  }, [job, onClose, showDeleteDialog]);

  const handleDelete = async () => {
    if (!job) return;

    setIsDeleting(true);
    try {
      await deleteJob({ id: job._id });
      onClose();
    } catch (error) {
      console.error("Failed to delete job:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {job && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-40 bg-black/20 backdrop-blur-md"
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {job && (
          <div className="fixed inset-0 z-50 grid place-items-center p-4">
            <motion.div
              layoutId={`job-card-${job._id}`}
              ref={ref}
              className="flex max-h-[110vh] w-full max-w-4xl cursor-auto flex-col gap-4 overflow-y-auto rounded-xl border bg-background p-6 shadow-2xl"
              style={{ borderRadius: 12 }}
            >
              {/* Header */}
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <motion.h2
                      layoutId={`job-company-${job._id}`}
                      className="font-bold text-3xl"
                    >
                      {job.companyName}
                    </motion.h2>
                    <motion.p
                      layoutId={`job-title-${job._id}`}
                      className="text-muted-foreground text-lg mt-1"
                    >
                      {job.title}
                    </motion.p>
                  </div>
                  <div className="flex gap-2">
                    {job.url && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => window.open(job.url, "_blank")}
                      >
                        <IconExternalLink className="h-4 w-4" />
                        Visit Job
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(job)}
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

                {/* Meta Info Row */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <Badge variant="outline" className="capitalize">
                    {job.status}
                  </Badge>

                  <div className="flex items-center gap-1.5">
                    <IconCalendar className="h-4 w-4" />
                    <span>
                      Added {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {job.location && (
                    <Badge variant="secondary" className="font-normal">
                      {job.location}
                    </Badge>
                  )}

                  {job.remoteType && (
                    <Badge variant="secondary" className="font-normal">
                      {job.remoteType}
                    </Badge>
                  )}

                  {job.salary && (
                    <Badge variant="secondary" className="font-normal">
                      {job.salary}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Content - Fades in */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.05 } }}
                className="space-y-4"
              >
                {job.notes && (
                  <div>
                    <h3 className="mb-2 font-semibold text-sm">Notes</h3>
                    <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                      <ReactMarkdown>{job.notes}</ReactMarkdown>
                    </div>
                  </div>
                )}

                {/* Email DB Link Section */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-xl border bg-card/50 p-4 transition-colors hover:bg-card/80"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <IconLink className="h-4 w-4" />
                      Linked Connection
                    </h3>
                  </div>

                  {contact ? (
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-primary/10 p-2.5">
                        <IconUser className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base truncate">
                          {contact.name}
                        </p>
                        <p className="text-sm text-muted-foreground truncate mb-1">
                          {contact.position && `${contact.position}`}
                          {contact.company && ` at ${contact.company.name}`}
                        </p>
                        <div
                          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary cursor-pointer transition-colors w-fit"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (contact.email) {
                              navigator.clipboard.writeText(contact.email);
                              toast.success("Email copied");
                            }
                          }}
                        >
                          <IconMail className="h-3.5 w-3.5" />
                          <span className="truncate">{contact.email}</span>
                          <IconCopy className="h-3 w-3 opacity-50" />
                        </div>
                      </div>
                    </div>
                  ) : company ? (
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-primary/10 p-2.5">
                        <IconBuilding className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base truncate">
                          {company.name}
                        </p>
                        <p className="text-sm text-muted-foreground truncate mb-1">
                          {company.emails.length} email address
                          {company.emails.length !== 1 ? "es" : ""} found
                        </p>
                        {company.emails.length > 0 && (
                          <div
                            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary cursor-pointer transition-colors w-fit"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(company.emails[0]);
                              toast.success("Email copied");
                            }}
                          >
                            <IconMail className="h-3.5 w-3.5" />
                            <span className="truncate">
                              {company.emails[0]}
                            </span>
                            <IconCopy className="h-3 w-3 opacity-50" />
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground italic">
                      No contact or company linked. Select one below to enable
                      AI features.
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t">
                    <EmailDbSelector
                      jobId={job._id}
                      currentContactId={job.contactId}
                      currentCompanyId={job.emailDbCompanyId}
                    />
                  </div>
                </motion.div>

                {/* AI Assistant Toolbar */}
                <AIToolbar jobId={job._id} />
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        title="Delete Job"
        itemName={job?.companyName}
        description={`Are you sure you want to delete the job application for ${job?.companyName}? This action cannot be undone.`}
        isLoading={isDeleting}
      />
    </>
  );
}
