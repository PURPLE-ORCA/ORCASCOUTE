"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  IconBuilding,
  IconMail,
  IconBrandLinkedin,
  IconUsers,
  IconBriefcase,
  IconEye,
  IconEdit,
  IconTrash,
} from "@tabler/icons-react";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { toast } from "sonner";

interface CompanyCardProps {
  company: {
    _id: Id<"companies">;
    name: string;
    emails: string[];
    linkedInProfiles?: string[];
    contactCount: number;
    jobCount: number;
    createdAt: number;
  };
  onView: () => void;
  onEdit: () => void;
}

export function CompanyCard({ company, onView, onEdit }: CompanyCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const deleteCompany = useMutation(api.companies.remove);

  const handleDelete = async () => {
    await deleteCompany({ companyId: company._id });
    setShowDeleteDialog(false);
  };

  const handleCopyEmail = (e: React.MouseEvent, email: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(email);
    toast.success("Email copied to clipboard");
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
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div>
                <h3 className="font-semibold text-lg leading-tight">
                  {company.name}
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* Emails & LinkedIn */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 space-y-1 min-w-0">
            {company.emails.slice(0, 2).map((email, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-lg text-muted-foreground opacity-80 hover:opacity-100 transition-opacity cursor-pointer "
                onClick={(e) => handleCopyEmail(e, email)}
              >
                <IconMail className="h-5 w-5 shrink-0" />
                <span className="truncate text-lg ">{email}</span>
              </div>
            ))}
            {company.emails.length > 2 && (
              <p className="text-lg text-muted-foreground pl-5.5">
                +{company.emails.length - 2} more
              </p>
            )}
          </div>

          {/* LinkedIn */}
          {company.linkedInProfiles && company.linkedInProfiles.length > 0 && (
            <div className="shrink-0">
              <a
                href={company.linkedInProfiles[0]}
                target="_blank"
                rel="noopener noreferrer"
                className="block opacity-80 hover:opacity-100 transition-opacity"
              >
                <Icon icon="lineicons:linkedin" width="60" height="60" />
              </a>
            </div>
          )}
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
          title="Delete Company"
          description={`Are you sure you want to delete ${company.name}? This will unlink all associated contacts and jobs.`}
        />
      </Card>
    </motion.div>
  );
}
