"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { IconPlus, IconX } from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddCompanyDialogProps {
  children?: React.ReactNode;
  company?: {
    _id: Id<"companies">;
    name: string;
    emails: string[];
    linkedInProfiles?: string[];
    tags?: string[];
    notes?: string;
  };
  onSuccess?: () => void;
}

export function AddCompanyDialog({
  children,
  company,
  onSuccess,
}: AddCompanyDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [emails, setEmails] = useState<string[]>(company?.emails || []);
  const [emailInput, setEmailInput] = useState("");

  const [linkedInProfiles, setLinkedInProfiles] = useState<string[]>(
    company?.linkedInProfiles || []
  );
  const [linkedInInput, setLinkedInInput] = useState("");

  const [tags, setTags] = useState<string[]>(company?.tags || []);
  const [tagInput, setTagInput] = useState("");

  const createCompany = useMutation(api.companies.create);
  const updateCompany = useMutation(api.companies.update);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: company?.name || "",
      notes: company?.notes || "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (emails.length === 0) {
      toast.error("Please add at least one email address");
      return;
    }

    setIsLoading(true);
    try {
      if (company) {
        await updateCompany({
          companyId: company._id,
          ...values,
          emails,
          linkedInProfiles,
          tags,
        });
        toast.success("Company updated successfully");
      } else {
        await createCompany({
          ...values,
          emails,
          linkedInProfiles,
          tags,
        });
        toast.success("Company added successfully");
      }
      setOpen(false);
      form.reset();
      setEmails([]);
      setLinkedInProfiles([]);
      setTags([]);
      onSuccess?.();
    } catch (error) {
      console.error("Error saving company:", error);
      toast.error("Failed to save company");
    } finally {
      setIsLoading(false);
    }
  };

  const addEmail = () => {
    const trimmed = emailInput.trim();
    if (trimmed && !emails.includes(trimmed)) {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmed)) {
        toast.error("Please enter a valid email address");
        return;
      }
      setEmails([...emails, trimmed]);
      setEmailInput("");
    }
  };

  const removeEmail = (emailToRemove: string) => {
    setEmails(emails.filter((e) => e !== emailToRemove));
  };

  const addLinkedIn = () => {
    const trimmed = linkedInInput.trim();
    if (trimmed && !linkedInProfiles.includes(trimmed)) {
      setLinkedInProfiles([...linkedInProfiles, trimmed]);
      setLinkedInInput("");
    }
  };

  const removeLinkedIn = (profileToRemove: string) => {
    setLinkedInProfiles(linkedInProfiles.filter((p) => p !== profileToRemove));
  };

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      form.reset();
      setEmails(company?.emails || []);
      setLinkedInProfiles(company?.linkedInProfiles || []);
      setTags(company?.tags || []);
      setEmailInput("");
      setLinkedInInput("");
      setTagInput("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <IconPlus className="mr-2 h-4 w-4" />
            Add Company
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{company ? "Edit Company" : "Add Company"}</DialogTitle>
          <DialogDescription>
            {company
              ? "Update company information"
              : "Add a new company to your Email DB"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Google" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Emails */}
            <div className="space-y-2">
              <FormLabel>Email Addresses *</FormLabel>
              <div className="flex gap-2">
                <Input
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addEmail();
                    }
                  }}
                  placeholder="jobs@company.com"
                  type="email"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={addEmail}
                >
                  <IconPlus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <AnimatePresence mode="popLayout">
                  {emails.map((email) => (
                    <motion.div
                      key={email}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1 pr-1"
                      >
                        {email}
                        <button
                          type="button"
                          onClick={() => removeEmail(email)}
                          className="ml-1 rounded-full p-0.5 hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <IconX className="h-3 w-3" />
                        </button>
                      </Badge>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* LinkedIn Profiles */}
            <div className="space-y-2">
              <FormLabel>LinkedIn Profiles</FormLabel>
              <div className="flex gap-2">
                <Input
                  value={linkedInInput}
                  onChange={(e) => setLinkedInInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addLinkedIn();
                    }
                  }}
                  placeholder="https://linkedin.com/company/google"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={addLinkedIn}
                >
                  <IconPlus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <AnimatePresence mode="popLayout">
                  {linkedInProfiles.map((profile) => (
                    <motion.div
                      key={profile}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1 pr-1"
                      >
                        <span className="max-w-[200px] truncate">
                          {profile}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeLinkedIn(profile)}
                          className="ml-1 rounded-full p-0.5 hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <IconX className="h-3 w-3" />
                        </button>
                      </Badge>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <FormLabel>Tags</FormLabel>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Add a tag..."
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={addTag}
                >
                  <IconPlus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <AnimatePresence mode="popLayout">
                  {tags.map((tag) => (
                    <motion.div
                      key={tag}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1 pr-1"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 rounded-full p-0.5 hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <IconX className="h-3 w-3" />
                        </button>
                      </Badge>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Markdown supported)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional information about this company..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Spinner className="mr-2 h-4 w-4" />}
                {company ? "Update Company" : "Add Company"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
