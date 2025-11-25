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
import { RecruiterSelector } from "@/components/recruiter-selector";
import ReactMarkdown from "react-markdown";
import {
  IconExternalLink,
  IconTrash,
  IconEdit,
  IconX,
  IconUser,
  IconMail,
} from "@tabler/icons-react";

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
  recruiterId?: Id<"recruiters">;
  createdAt: number;
  updatedAt: number;
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

  // Fetch recruiter data if linked
  const recruiter = useQuery(
    api.recruiters.get,
    job?.recruiterId ? { recruiterId: job.recruiterId } : "skip"
  );

  useOnClickOutside(ref as React.RefObject<HTMLElement>, (event) => {
    // Ignore clicks inside dialogs or select dropdowns (which are in portals)
    const target = event.target as HTMLElement;
    if (
      target.closest('[role="dialog"]') ||
      target.closest('[role="listbox"]') ||
      target.closest(".radix-select-content")
    ) {
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
  }, [job, onClose]);

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
              className="flex max-h-[90vh] w-full max-w-2xl cursor-auto flex-col gap-4 overflow-y-auto rounded-xl border bg-background p-6 shadow-2xl"
              style={{ borderRadius: 12 }}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <motion.h2
                    layoutId={`job-company-${job._id}`}
                    className="font-bold text-2xl"
                  >
                    {job.companyName}
                  </motion.h2>
                  <motion.p
                    layoutId={`job-title-${job._id}`}
                    className="text-muted-foreground"
                  >
                    {job.title}
                  </motion.p>
                </div>
                <div className="flex gap-2">
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

              {/* Badges */}
              <motion.div
                layoutId={`job-badges-${job._id}`}
                className="flex flex-wrap gap-2"
              >
                {job.salary && <Badge variant="secondary">{job.salary}</Badge>}
                {job.remoteType && (
                  <Badge variant="outline">{job.remoteType}</Badge>
                )}
                {job.location && (
                  <Badge variant="outline">{job.location}</Badge>
                )}
              </motion.div>

              {/* AI Assistant Toolbar */}
              <AIToolbar jobId={job._id} />

              {/* Recruiter Section */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-lg border bg-card/50 p-4"
              >
                <h3 className="mb-3 font-semibold text-sm">Recruiter</h3>
                {recruiter ? (
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <IconUser className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {recruiter.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {recruiter.position && `${recruiter.position} at `}
                            {recruiter.company}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <IconMail className="h-3.5 w-3.5" />
                      <a
                        href={`mailto:${recruiter.email}`}
                        className="text-primary hover:underline"
                      >
                        {recruiter.email}
                      </a>
                    </div>
                    <RecruiterSelector
                      jobId={job._id}
                      currentRecruiterId={job.recruiterId}
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      No recruiter linked to this job
                    </p>
                    <RecruiterSelector jobId={job._id} />
                  </div>
                )}
              </motion.div>

              {/* Content - Fades in */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.05 } }}
                className="space-y-4"
              >
                {job.url && (
                  <div>
                    <h3 className="mb-2 font-semibold text-sm">Job URL</h3>
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary text-sm hover:underline break-all"
                      title={job.url}
                    >
                      <span className="truncate">{job.url}</span>
                      <IconExternalLink className="h-4 w-4 shrink-0" />
                    </a>
                  </div>
                )}

                {job.notes && (
                  <div>
                    <h3 className="mb-2 font-semibold text-sm">Notes</h3>
                    <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                      <ReactMarkdown>{job.notes}</ReactMarkdown>
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <p className="font-medium capitalize">{job.status}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Added</p>
                      <p className="font-medium">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
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
