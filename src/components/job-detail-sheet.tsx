"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  IconExternalLink,
  IconTrash,
  IconEdit,
  IconMapPin,
  IconCurrencyDollar,
  IconDeviceLaptop,
  IconCalendar,
  IconSparkles,
  IconMail,
  IconFileText,
  IconArrowLeft,
  IconCopy,
  IconCheck,
  IconUser,
  IconBuilding,
} from "@tabler/icons-react";
import ReactMarkdown from "react-markdown";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { EmailDbSelector } from "@/components/email-db-selector";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { JobAIView } from "@/components/job-ai-view";

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
};

type JobDetailSheetProps = {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (job: Job) => void;
};

export function JobDetailSheet({
  job,
  isOpen,
  onClose,
  onEdit,
}: JobDetailSheetProps) {
  const deleteJob = useMutation(api.jobs.remove);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [aiView, setAiView] = useState<"menu" | "email" | "coverLetter">(
    "menu"
  );

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

  // Reset AI view when job changes or sheet closes
  useEffect(() => {
    if (!isOpen || !job) {
      setAiView("menu");
    }
  }, [isOpen, job?._id]);

  // Fetch saved content
  const savedEmail = useQuery(
    api.ai.getGeneratedContent,
    job ? { jobId: job._id, type: "email" } : "skip"
  );
  const savedCoverLetter = useQuery(
    api.ai.getGeneratedContent,
    job ? { jobId: job._id, type: "coverLetter" } : "skip"
  );

  const handleDelete = async () => {
    if (!job) return;
    setIsDeleting(true);
    try {
      await deleteJob({ id: job._id });
      onClose();
    } catch (error) {
      console.error("Failed to delete job:", error);
      toast.error("Failed to delete job");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!job) return null;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 h-full">
            {aiView === "menu" ? (
              <div className="p-6 flex flex-col gap-6">
                {/* Header Actions */}
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="capitalize">
                    {job.status}
                  </Badge>
                  <div className="flex gap-1">
                    {job.url && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => window.open(job.url, "_blank")}
                        title="Visit Job URL"
                      >
                        <IconExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onEdit(job)}
                      title="Edit Job"
                    >
                      <IconEdit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setShowDeleteDialog(true)}
                      title="Delete Job"
                    >
                      <IconTrash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Title Section */}
                <SheetHeader className="space-y-1">
                  <SheetTitle className="text-2xl font-bold">
                    {job.companyName}
                  </SheetTitle>
                  <SheetDescription className="text-lg font-medium text-foreground">
                    {job.title}
                  </SheetDescription>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                    <IconCalendar className="h-3.5 w-3.5" />
                    <span>
                      Added {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </SheetHeader>

                <Separator />

                {/* Quick Info Badges */}
                <div className="flex flex-wrap gap-3">
                  {job.location && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-md">
                      <IconMapPin className="h-4 w-4" />
                      <span>{job.location}</span>
                    </div>
                  )}
                  {job.salary && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-md">
                      <IconCurrencyDollar className="h-4 w-4" />
                      <span>{job.salary}</span>
                    </div>
                  )}
                  {job.remoteType && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-md">
                      <IconDeviceLaptop className="h-4 w-4" />
                      <span>{job.remoteType}</span>
                    </div>
                  )}
                </div>

                {/* Notes Section */}
                {job.notes && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">Notes</h3>
                    <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground bg-muted/30 p-3 rounded-lg text-sm">
                      <ReactMarkdown>{job.notes}</ReactMarkdown>
                    </div>
                  </div>
                )}

                {/* Linked Connection Section */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Linked Connection</h3>

                  {contact ? (
                    <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                      <div className="rounded-full bg-primary/10 p-2">
                        <IconUser className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {contact.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {contact.position && `${contact.position}`}
                          {contact.company && ` at ${contact.company.name}`}
                        </p>
                        {contact.email && (
                          <div
                            className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground hover:text-primary cursor-pointer w-fit"
                            onClick={() => {
                              navigator.clipboard.writeText(contact.email!);
                              toast.success("Email copied");
                            }}
                          >
                            <IconMail className="h-3 w-3" />
                            <span className="truncate">{contact.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : company ? (
                    <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                      <div className="rounded-full bg-primary/10 p-2">
                        <IconBuilding className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {company.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {company.emails.length} email address
                          {company.emails.length !== 1 ? "es" : ""} found
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground italic px-1">
                      No contact linked. Select one below to enable AI features.
                    </div>
                  )}

                  <EmailDbSelector
                    jobId={job._id}
                    currentContactId={job.contactId}
                    currentCompanyId={job.emailDbCompanyId}
                  />
                </div>

                <Separator />

                {/* AI Assistant Section */}
                <div className="space-y-3 pb-6">
                  <div className="flex items-center gap-2">
                    <IconSparkles className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-sm">AI Assistant</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant={savedEmail ? "secondary" : "outline"}
                      className="h-auto py-4 flex flex-col gap-2 items-center justify-center border-dashed hover:border-solid hover:bg-primary/5 hover:text-primary transition-all"
                      onClick={() => setAiView("email")}
                    >
                      <IconMail className="h-5 w-5" />
                      <span className="text-xs font-medium">
                        {savedEmail ? "View Saved Email" : "Generate Email"}
                      </span>
                    </Button>
                    <Button
                      variant={savedCoverLetter ? "secondary" : "outline"}
                      className="h-auto py-4 flex flex-col gap-2 items-center justify-center border-dashed hover:border-solid hover:bg-primary/5 hover:text-primary transition-all"
                      onClick={() => setAiView("coverLetter")}
                    >
                      <IconFileText className="h-5 w-5" />
                      <span className="text-xs font-medium">
                        {savedCoverLetter
                          ? "View Saved Letter"
                          : "Cover Letter"}
                      </span>
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 h-full">
                <JobAIView
                  jobId={job._id}
                  type={aiView as "email" | "coverLetter"}
                  onBack={() => setAiView("menu")}
                  initialContent={
                    aiView === "email"
                      ? savedEmail
                        ? {
                            content: savedEmail.content,
                            subject: savedEmail.subject,
                          }
                        : null
                      : savedCoverLetter
                      ? { content: savedCoverLetter.content }
                      : null
                  }
                />
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        title="Delete Job"
        itemName={job.companyName}
        description={`Are you sure you want to delete the job application for ${job.companyName}? This action cannot be undone.`}
        isLoading={isDeleting}
      />
    </>
  );
}
