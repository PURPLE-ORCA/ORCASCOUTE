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
                <IconBuilding className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-base leading-tight">
                  {company.name}
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* Emails */}
        <div className="mb-3 space-y-1">
          {company.emails.slice(0, 2).map((email, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <IconMail className="h-3.5 w-3.5" />
              <span className="truncate">{email}</span>
            </div>
          ))}
          {company.emails.length > 2 && (
            <p className="text-xs text-muted-foreground pl-5">
              +{company.emails.length - 2} more
            </p>
          )}
        </div>

        {/* LinkedIn */}
        {company.linkedInProfiles && company.linkedInProfiles.length > 0 && (
          <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
            <IconBrandLinkedin className="h-3.5 w-3.5" />
            <span className="truncate">{company.linkedInProfiles[0]}</span>
          </div>
        )}

        {/* Stats */}
        <div className="mb-4 flex items-center gap-4 text-xs">
          <Badge variant="secondary" className="font-normal">
            <IconUsers className="mr-1 h-3 w-3" />
            {company.contactCount}{" "}
            {company.contactCount === 1 ? "contact" : "contacts"}
          </Badge>
          <Badge variant="secondary" className="font-normal">
            <IconBriefcase className="mr-1 h-3 w-3" />
            {company.jobCount} {company.jobCount === 1 ? "job" : "jobs"}
          </Badge>
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
