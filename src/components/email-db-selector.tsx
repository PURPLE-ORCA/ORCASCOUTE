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
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "@/components/ui/select";
import { AddContactDialog } from "@/components/add-contact-dialog";
import { AddCompanyDialog } from "@/components/add-company-dialog";
import { IconPlus, IconX, IconBuilding, IconUser } from "@tabler/icons-react";
import { toast } from "sonner";

interface EmailDbSelectorProps {
  jobId: Id<"jobs">;
  currentContactId?: Id<"contacts">;
  currentCompanyId?: Id<"companies">;
  onLinked?: () => void;
}

export function EmailDbSelector({
  jobId,
  currentContactId,
  currentCompanyId,
  onLinked,
}: EmailDbSelectorProps) {
  const contacts = useQuery(api.contacts.getAll);
  const companies = useQuery(api.companies.getAll);

  const linkContact = useMutation(api.jobs.linkContact);
  const unlinkContact = useMutation(api.jobs.unlinkContact);
  const linkCompany = useMutation(api.jobs.linkCompany);
  const unlinkCompany = useMutation(api.jobs.unlinkCompany);

  const [showAddContactDialog, setShowAddContactDialog] = useState(false);
  const [showAddCompanyDialog, setShowAddCompanyDialog] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

  const handleSelect = async (value: string) => {
    if (value === "add-contact") {
      setShowAddContactDialog(true);
      return;
    }
    if (value === "add-company") {
      setShowAddCompanyDialog(true);
      return;
    }

    if (value === "remove") {
      setIsLinking(true);
      try {
        if (currentContactId) await unlinkContact({ jobId });
        if (currentCompanyId) await unlinkCompany({ jobId });
        toast.success("Removed from job");
        onLinked?.();
      } catch (error) {
        console.error("Failed to unlink:", error);
        toast.error("Failed to remove");
      } finally {
        setIsLinking(false);
      }
      return;
    }

    const [type, id] = value.split(":");
    setIsLinking(true);

    try {
      // First unlink any existing connection to avoid confusion
      if (currentContactId) await unlinkContact({ jobId });
      if (currentCompanyId) await unlinkCompany({ jobId });

      if (type === "contact") {
        await linkContact({
          jobId,
          contactId: id as Id<"contacts">,
        });
        toast.success("Contact linked to job");
      } else if (type === "company") {
        await linkCompany({
          jobId,
          companyId: id as Id<"companies">,
        });
        toast.success("Company linked to job");
      }
      onLinked?.();
    } catch (error) {
      console.error("Failed to link:", error);
      toast.error("Failed to link");
    } finally {
      setIsLinking(false);
    }
  };

  const handleNewAdded = () => {
    setShowAddContactDialog(false);
    setShowAddCompanyDialog(false);
    onLinked?.();
  };

  if (contacts === undefined || companies === undefined) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  const currentValue = currentContactId
    ? `contact:${currentContactId}`
    : currentCompanyId
    ? `company:${currentCompanyId}`
    : "none";

  return (
    <div className="space-y-2">
      <Select
        value={currentValue}
        onValueChange={handleSelect}
        disabled={isLinking}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Link a contact or company..." />
        </SelectTrigger>
        <SelectContent>
          {(currentContactId || currentCompanyId) && (
            <SelectItem value="remove" className="text-destructive">
              <div className="flex items-center gap-2">
                <IconX className="h-4 w-4" />
                Remove Link
              </div>
            </SelectItem>
          )}

          <SelectItem value="none" disabled>
            {currentContactId || currentCompanyId
              ? "Change link..."
              : "Select to link..."}
          </SelectItem>

          <SelectGroup>
            <SelectLabel>Contacts</SelectLabel>
            {contacts.map((contact) => (
              <SelectItem key={contact._id} value={`contact:${contact._id}`}>
                <div className="flex items-center gap-2">
                  <IconUser className="h-4 w-4 text-muted-foreground" />
                  <span>{contact.name}</span>
                  {contact.company && (
                    <span className="text-xs text-muted-foreground">
                      ({contact.company.name})
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
            <SelectItem value="add-contact">
              <div className="flex items-center gap-2 text-primary">
                <IconPlus className="h-4 w-4" />
                Add New Contact
              </div>
            </SelectItem>
          </SelectGroup>

          <SelectSeparator />

          <SelectGroup>
            <SelectLabel>Companies</SelectLabel>
            {companies.map((company) => (
              <SelectItem key={company._id} value={`company:${company._id}`}>
                <div className="flex items-center gap-2">
                  <IconBuilding className="h-4 w-4 text-muted-foreground" />
                  <span>{company.name}</span>
                </div>
              </SelectItem>
            ))}
            <SelectItem value="add-company">
              <div className="flex items-center gap-2 text-primary">
                <IconPlus className="h-4 w-4" />
                Add New Company
              </div>
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      {showAddContactDialog && (
        <AddContactDialog onSuccess={handleNewAdded}>
          <div />
        </AddContactDialog>
      )}

      {showAddCompanyDialog && (
        <AddCompanyDialog onSuccess={handleNewAdded}>
          <div />
        </AddCompanyDialog>
      )}
    </div>
  );
}
