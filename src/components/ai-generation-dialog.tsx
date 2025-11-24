"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { CVSelector } from "./cv-selector";
import {
  IconSparkles,
  IconCopy,
  IconRefresh,
  IconDeviceFloppy,
  IconCheck,
  IconAlertCircle,
} from "@tabler/icons-react";
import { toast } from "sonner";

type AIGenerationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: Id<"jobs">;
  type: "email" | "coverLetter";
  initialContent?: {
    content: string;
    subject?: string;
  } | null;
};

type DialogState = "config" | "generating" | "preview" | "error";

const LOADING_MESSAGES = [
  "Analyzing your profile...",
  "Reading job requirements...",
  "Crafting personalized content...",
  "Almost done...",
];

const FOCUS_AREAS = [
  "Technical Skills",
  "Leadership Experience",
  "Education",
  "Projects",
  "Certifications",
  "Soft Skills",
];

export function AIGenerationDialog({
  open,
  onOpenChange,
  jobId,
  type,
  initialContent,
}: AIGenerationDialogProps) {
  const generateEmail = useAction(api.ai.generateEmail);
  const generateCoverLetter = useAction(api.ai.generateCoverLetter);
  const saveContent = useMutation(api.ai.saveGeneratedContent);

  // State
  const [state, setState] = useState<DialogState>("config");
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [error, setError] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Email config
  const [cvId, setCvId] = useState<Id<"cv_versions"> | undefined>();
  const [tone, setTone] = useState<
    "professional" | "friendly" | "enthusiastic"
  >("friendly");
  const [additionalContext, setAdditionalContext] = useState("");

  // Cover letter config
  const [coverLetterCvId, setCoverLetterCvId] = useState<
    Id<"cv_versions"> | undefined
  >();
  const [length, setLength] = useState<"short" | "medium" | "detailed">(
    "medium"
  );
  const [focusAreas, setFocusAreas] = useState<string[]>([]);

  // Generated content
  const [generatedEmail, setGeneratedEmail] = useState<{
    subject: string;
    body: string;
  } | null>(null);
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState<string>("");

  // Sync state with initialContent when dialog opens or initialContent changes
  useEffect(() => {
    if (open && initialContent) {
      setState("preview");
      if (type === "email") {
        setGeneratedEmail({
          subject: initialContent.subject || "",
          body: initialContent.content,
        });
      } else {
        setGeneratedCoverLetter(initialContent.content);
      }
    } else if (open && !initialContent) {
      // Only reset to config if we are opening fresh without content
      // We don't want to reset if we are just switching tabs or something
      // But for now, let's assume if no initialContent, we start at config
      if (state !== "preview" && state !== "generating") {
        setState("config");
      }
    }
  }, [open, initialContent, type]);

  // Reset state when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Delay reset slightly to allow animation to finish, or just reset immediately
      // For simplicity, we reset immediately but maybe we should wait?
      // Actually, let's just reset when opening if needed.
      // But to be safe, let's clear errors and copy state
      setError("");
      setCopied(false);
    }
    onOpenChange(newOpen);
  };

  // Cycle loading messages
  const startLoadingCycle = () => {
    setLoadingMessageIndex(0);
    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000);
    return interval;
  };

  // Generate email
  const handleGenerateEmail = async () => {
    setState("generating");
    setError("");
    const interval = startLoadingCycle();

    try {
      const result = await generateEmail({
        jobId,
        cvId,
        tone,
        additionalContext: additionalContext || undefined,
      });

      clearInterval(interval);
      setGeneratedEmail({
        subject: result.subject,
        body: result.body,
      });
      setState("preview");
      toast.success("Email generated successfully!");
    } catch (err) {
      clearInterval(interval);
      setError(err instanceof Error ? err.message : "Failed to generate email");
      setState("error");
      toast.error("Failed to generate email");
    }
  };

  // Generate cover letter
  const handleGenerateCoverLetter = async () => {
    if (!coverLetterCvId) {
      toast.error("Please select a CV to generate a cover letter.");
      return;
    }

    setState("generating");
    setError("");
    const interval = startLoadingCycle();

    try {
      const result = await generateCoverLetter({
        jobId,
        cvId: coverLetterCvId,
        length,
        focusAreas,
      });

      clearInterval(interval);
      setGeneratedCoverLetter(result.content);
      setState("preview");
      toast.success("Cover letter generated successfully!");
    } catch (err) {
      clearInterval(interval);
      setError(
        err instanceof Error ? err.message : "Failed to generate cover letter"
      );
      setState("error");
      toast.error("Failed to generate cover letter");
    }
  };

  // Copy to clipboard
  const handleCopy = () => {
    const content =
      type === "email"
        ? `Subject: ${generatedEmail?.subject}\n\n${generatedEmail?.body}`
        : generatedCoverLetter;

    navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Save content
  const handleSave = async () => {
    try {
      setIsSaving(true);
      if (type === "email" && generatedEmail) {
        await saveContent({
          jobId,
          type: "email",
          content: generatedEmail.body,
          subject: generatedEmail.subject,
        });
      } else if (type === "coverLetter" && generatedCoverLetter) {
        await saveContent({
          jobId,
          type: "coverLetter",
          content: generatedCoverLetter,
        });
      }
      toast.success("Content saved successfully!");
    } catch (err) {
      console.error("Failed to save content:", err);
      toast.error("Failed to save content. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle focus area
  const toggleFocusArea = (area: string) => {
    setFocusAreas((prev) =>
      prev.includes(area)
        ? prev.filter((a) => a !== area)
        : prev.length < 3
        ? [...prev, area]
        : prev
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {type === "email"
              ? "✉️ Generate Email to Recruiter"
              : "📄 Generate Cover Letter"}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* Configuration State */}
          {state === "config" && (
            <motion.div
              key="config"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {type === "email" ? (
                <>
                  <div className="space-y-2">
                    <Label>Select CV (optional)</Label>
                    <CVSelector value={cvId} onValueChange={setCvId} />
                    <p className="text-xs text-muted-foreground">
                      Including your CV helps personalize the email
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Tone</Label>
                    <RadioGroup
                      value={tone}
                      onValueChange={(v: any) => setTone(v)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="professional"
                          id="professional"
                        />
                        <Label
                          htmlFor="professional"
                          className="font-normal cursor-pointer"
                        >
                          Professional
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="friendly" id="friendly" />
                        <Label
                          htmlFor="friendly"
                          className="font-normal cursor-pointer"
                        >
                          Friendly
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="enthusiastic"
                          id="enthusiastic"
                        />
                        <Label
                          htmlFor="enthusiastic"
                          className="font-normal cursor-pointer"
                        >
                          Enthusiastic
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="context">
                      Additional Context (optional)
                    </Label>
                    <Textarea
                      id="context"
                      placeholder='e.g., "Mention my React experience and interest in remote work"'
                      value={additionalContext}
                      onChange={(e) => setAdditionalContext(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleGenerateEmail}>
                      <IconSparkles className="mr-2 h-4 w-4" />
                      Generate Email
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Select CV (required)</Label>
                    <CVSelector
                      value={coverLetterCvId}
                      onValueChange={setCoverLetterCvId}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Length</Label>
                    <RadioGroup
                      value={length}
                      onValueChange={(v: any) => setLength(v)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="short" id="short" />
                        <Label
                          htmlFor="short"
                          className="font-normal cursor-pointer"
                        >
                          Short (1 page)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="medium" id="medium" />
                        <Label
                          htmlFor="medium"
                          className="font-normal cursor-pointer"
                        >
                          Medium
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="detailed" id="detailed" />
                        <Label
                          htmlFor="detailed"
                          className="font-normal cursor-pointer"
                        >
                          Detailed
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label>Focus Areas (select up to 3)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {FOCUS_AREAS.map((area) => (
                        <div key={area} className="flex items-center space-x-2">
                          <Checkbox
                            id={area}
                            checked={focusAreas.includes(area)}
                            onCheckedChange={() => toggleFocusArea(area)}
                            disabled={
                              !focusAreas.includes(area) &&
                              focusAreas.length >= 3
                            }
                          />
                          <Label
                            htmlFor={area}
                            className="font-normal cursor-pointer text-sm"
                          >
                            {area}
                          </Label>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {focusAreas.length}/3 selected
                    </p>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleGenerateCoverLetter}
                      disabled={!coverLetterCvId}
                    >
                      <IconSparkles className="mr-2 h-4 w-4" />
                      Generate Letter
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* Generating State */}
          {state === "generating" && (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12 space-y-4"
            >
              <div className="relative w-16 h-16">
                <motion.div
                  className="absolute inset-0 border-4 border-primary/30 rounded-full"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
                <motion.div
                  className="absolute inset-0 border-4 border-t-primary rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                />
              </div>
              <p className="text-lg font-medium text-primary animate-pulse">
                {LOADING_MESSAGES[loadingMessageIndex]}
              </p>
            </motion.div>
          )}

          {/* Preview State */}
          {state === "preview" && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="p-4 bg-muted/50 rounded-lg border">
                {type === "email" ? (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                        Subject
                      </Label>
                      <p className="font-medium text-lg">
                        {generatedEmail?.subject}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                        Body
                      </Label>
                      <div className="mt-2 whitespace-pre-wrap font-sans text-sm leading-relaxed">
                        {generatedEmail?.body}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {generatedCoverLetter}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setState("config")}>
                  <IconRefresh className="w-4 h-4 mr-2" />
                  Regenerate
                </Button>
                <Button variant="outline" onClick={handleCopy}>
                  {copied ? (
                    <IconCheck className="w-4 h-4 mr-2" />
                  ) : (
                    <IconCopy className="w-4 h-4 mr-2" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  <IconDeviceFloppy className="w-4 h-4 mr-2" />
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Error State */}
          {state === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-8 space-y-4 text-center"
            >
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                <IconAlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <div className="space-y-2">
                <h3 className="font-medium text-lg">Generation Failed</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {error}
                </p>
              </div>
              <Button onClick={() => setState("config")}>Try Again</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
