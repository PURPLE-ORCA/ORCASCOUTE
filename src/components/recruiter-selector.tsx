"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AddRecruiterDialog } from "@/components/add-recruiter-dialog";
import { IconPlus, IconX } from "@tabler/icons-react";
import { toast } from "sonner";

interface RecruiterSelectorProps {
  jobId: Id<"jobs">;
  currentRecruiterId?: Id<"recruiters">;
  onRecruiterLinked?: () => void;
}

export function RecruiterSelector({
  jobId,
  currentRecruiterId,
  onRecruiterLinked,
}: RecruiterSelectorProps) {
  const recruiters = useQuery(api.recruiters.getAll);
  const linkRecruiter = useMutation(api.jobs.linkRecruiter);
  const unlinkRecruiter = useMutation(api.jobs.unlinkRecruiter);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

  const handleSelectRecruiter = async (recruiterId: string) => {
    if (recruiterId === "add-new") {
      setShowAddDialog(true);
      return;
    }

    if (recruiterId === "remove") {
      setIsLinking(true);
      try {
        await unlinkRecruiter({ jobId });
        toast.success("Recruiter removed from job");
        onRecruiterLinked?.();
      } catch (error) {
        console.error("Failed to unlink recruiter:", error);
        toast.error("Failed to remove recruiter");
      } finally {
        setIsLinking(false);
      }
      return;
    }

    setIsLinking(true);
    try {
      await linkRecruiter({
        jobId,
        recruiterId: recruiterId as Id<"recruiters">,
      });
      toast.success("Recruiter linked to job");
      onRecruiterLinked?.();
    } catch (error) {
      console.error("Failed to link recruiter:", error);
      toast.error("Failed to link recruiter");
    } finally {
      setIsLinking(false);
    }
  };

  const handleNewRecruiterAdded = () => {
    setShowAddDialog(false);
    onRecruiterLinked?.();
  };

  if (recruiters === undefined) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-2">
      <Select
        value={currentRecruiterId || "none"}
        onValueChange={handleSelectRecruiter}
        disabled={isLinking}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a recruiter..." />
        </SelectTrigger>
        <SelectContent>
          {currentRecruiterId && (
            <SelectItem value="remove" className="text-destructive">
              <div className="flex items-center gap-2">
                <IconX className="h-4 w-4" />
                Remove Recruiter
              </div>
            </SelectItem>
          )}
          <SelectItem value="none" disabled>
            {currentRecruiterId
              ? "Change recruiter..."
              : "Select a recruiter..."}
          </SelectItem>
          {recruiters.map((recruiter) => (
            <SelectItem key={recruiter._id} value={recruiter._id}>
              {recruiter.name} - {recruiter.company}
            </SelectItem>
          ))}
          <SelectItem value="add-new">
            <div className="flex items-center gap-2 text-primary">
              <IconPlus className="h-4 w-4" />
              Add New Recruiter
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      {showAddDialog && (
        <AddRecruiterDialog onSuccess={handleNewRecruiterAdded}>
          <div />
        </AddRecruiterDialog>
      )}
    </div>
  );
}
