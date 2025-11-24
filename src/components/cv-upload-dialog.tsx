"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
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
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  IconUpload,
  IconFileTypePdf,
  IconFileTypeDocx,
} from "@tabler/icons-react";

const formSchema = z.object({
  name: z.string().min(1, "CV name is required"),
  file: z.any().refine((file) => file !== null, "Please select a file"),
});

type FormValues = z.infer<typeof formSchema>;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export function CVUploadDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const generateUploadUrl = useMutation(api.cvs.generateUploadUrl);
  const saveCV = useMutation(api.cvs.saveCV);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      file: null,
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      form.setError("file", {
        message: "Only PDF and DOCX files are accepted",
      });
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      form.setError("file", {
        message: "File size must be less than 10MB",
      });
      return;
    }

    setSelectedFile(file);
    form.setValue("file", file);
    form.clearErrors("file");

    // Auto-fill name from filename if empty
    if (!form.getValues("name")) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      form.setValue("name", nameWithoutExt);
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Generate upload URL
      const uploadUrl = await generateUploadUrl();

      // Step 2: Upload file to storage
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      });

      if (!result.ok) {
        throw new Error("Upload failed");
      }

      const { storageId } = await result.json();
      setUploadProgress(50);

      // Step 3: Save CV metadata
      await saveCV({
        storageId,
        name: values.name,
      });

      setUploadProgress(100);

      // Reset and close
      form.reset();
      setSelectedFile(null);
      setOpen(false);
    } catch (error) {
      console.error("Failed to upload CV:", error);
      form.setError("file", {
        message: "Upload failed. Please try again.",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload CV</DialogTitle>
          <DialogDescription>
            Upload a new version of your CV (PDF or DOCX, max 10MB)
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* File Input */}
            <FormField
              control={form.control}
              name="file"
              render={() => (
                <FormItem>
                  <FormLabel>File</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <label
                        htmlFor="file-upload"
                        className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-background/50 p-6 transition-colors hover:border-primary hover:bg-accent/50"
                      >
                        {selectedFile ? (
                          <div className="flex items-center gap-3">
                            {selectedFile.type === "application/pdf" ? (
                              <IconFileTypePdf className="h-8 w-8 text-red-500" />
                            ) : (
                              <IconFileTypeDocx className="h-8 w-8 text-blue-500" />
                            )}
                            <div className="text-left">
                              <p className="text-sm font-medium">
                                {selectedFile.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)}{" "}
                                MB
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <IconUpload className="h-8 w-8 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              Click to browse or drag & drop
                            </p>
                            <p className="text-xs text-muted-foreground">
                              PDF or DOCX (max 10MB)
                            </p>
                          </div>
                        )}
                      </label>
                      <input
                        id="file-upload"
                        type="file"
                        accept=".pdf,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* CV Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CV Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Software Engineer CV 2024"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUploading || !selectedFile}>
                {isUploading ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Uploading...
                  </>
                ) : (
                  "Upload CV"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
