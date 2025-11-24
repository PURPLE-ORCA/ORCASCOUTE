"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { IconExternalLink, IconTrash, IconEdit } from "@tabler/icons-react";

const formSchema = z.object({
  title: z.string().min(1, "Job title is required"),
  companyName: z.string().min(1, "Company name is required"),
  url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  location: z.string().optional(),
  salary: z.string().optional(),
  remoteType: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

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
  createdAt: number;
  updatedAt: number;
};

type JobDetailDialogProps = {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function JobDetailDialog({
  job,
  open,
  onOpenChange,
}: JobDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(true);
  const updateJob = useMutation(api.jobs.update);
  const deleteJob = useMutation(api.jobs.remove);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: job
      ? {
          title: job.title,
          companyName: job.companyName,
          url: job.url || "",
          location: job.location || "",
          salary: job.salary || "",
          remoteType: job.remoteType || "",
          notes: job.notes || "",
        }
      : undefined,
  });

  const onSubmit = async (values: FormValues) => {
    if (!job) return;

    try {
      await updateJob({
        id: job._id,
        title: values.title,
        companyName: values.companyName,
        url: values.url || undefined,
        location: values.location || undefined,
        salary: values.salary || undefined,
        remoteType: values.remoteType || undefined,
        notes: values.notes || undefined,
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update job:", error);
    }
  };

  const handleDelete = async () => {
    if (!job) return;
    if (!confirm("Are you sure you want to delete this job?")) return;

    try {
      await deleteJob({ id: job._id });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to delete job:", error);
    }
  };

  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl">{job.companyName}</DialogTitle>
              <DialogDescription className="text-base">
                {job.title}
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              {!isEditing && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsEditing(true)}
                  >
                    <IconEdit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleDelete}>
                    <IconTrash className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        {isEditing ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Senior Frontend Developer"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company *</FormLabel>
                      <FormControl>
                        <Input placeholder="Google" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://careers.company.com/job/123"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="San Francisco, CA" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="salary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salary</FormLabel>
                      <FormControl>
                        <Input placeholder="$150k - $180k" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="remoteType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remote Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select remote type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Remote">Remote</SelectItem>
                        <SelectItem value="Hybrid">Hybrid</SelectItem>
                        <SelectItem value="On-site">On-site</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Referral from John, hiring manager is Jane..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {job.salary && <Badge variant="secondary">{job.salary}</Badge>}
              {job.remoteType && (
                <Badge variant="outline">{job.remoteType}</Badge>
              )}
              {job.location && <Badge variant="outline">{job.location}</Badge>}
            </div>

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
                <p className="whitespace-pre-wrap text-muted-foreground text-sm">
                  {job.notes}
                </p>
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
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
