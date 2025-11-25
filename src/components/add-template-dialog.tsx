"use client";

import { useState, useEffect } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { IconX } from "@tabler/icons-react";
import { toast } from "sonner";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subject: z.string().optional(),
  body: z.string().min(1, "Body is required"),
  tags: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddTemplateDialogProps {
  children?: React.ReactNode;
  template?: {
    _id: Id<"email_templates">;
    title: string;
    subject?: string;
    body: string;
    tags?: string[];
  };
  onSuccess?: () => void;
}

export function AddTemplateDialog({
  children,
  template,
  onSuccess,
}: AddTemplateDialogProps) {
  const [open, setOpen] = useState(!!template);
  const [tagInput, setTagInput] = useState("");
  const createTemplate = useMutation(api.templates.create);
  const updateTemplate = useMutation(api.templates.update);

  const isEditing = !!template;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: template?.title || "",
      subject: template?.subject || "",
      body: template?.body || "",
      tags: template?.tags || [],
    },
  });

  // Update form when template prop changes
  useEffect(() => {
    if (template) {
      form.reset({
        title: template.title,
        subject: template.subject || "",
        body: template.body,
        tags: template.tags || [],
      });
      setOpen(true);
    }
  }, [template, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEditing && template) {
        await updateTemplate({
          id: template._id,
          title: values.title,
          subject: values.subject || undefined,
          body: values.body,
          tags: values.tags || [],
        });
        toast.success("Template updated");
      } else {
        await createTemplate({
          title: values.title,
          subject: values.subject || undefined,
          body: values.body,
          tags: values.tags || [],
        });
        toast.success("Template created");
      }
      form.reset();
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      toast.error(
        isEditing ? "Failed to update template" : "Failed to create template"
      );
      console.error(error);
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.getValues("tags")?.includes(tag)) {
      const currentTags = form.getValues("tags") || [];
      form.setValue("tags", [...currentTags, tag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = form.getValues("tags") || [];
    form.setValue(
      "tags",
      currentTags.filter((tag) => tag !== tagToRemove)
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Template" : "Create Template"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your email template"
              : "Create a reusable email template"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Follow-up Email, Initial Outreach, etc."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Re: Application for [Position]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Optional email subject line
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Body *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Dear [Recruiter Name],&#10;&#10;I hope this email finds you well. I wanted to follow up on my application for the [Position] role at [Company]...&#10;&#10;Best regards,&#10;[Your Name]"
                      rows={10}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a tag (e.g., follow-up, initial)"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddTag}
                      >
                        Add
                      </Button>
                    </div>
                    {field.value && field.value.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {field.value.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="gap-1"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="ml-1 rounded-full hover:bg-background/50"
                            >
                              <IconX className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <FormDescription className="text-xs">
                    Organize templates with tags
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  onSuccess?.();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    {isEditing ? "Updating..." : "Creating..."}
                  </>
                ) : isEditing ? (
                  "Update Template"
                ) : (
                  "Create Template"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
