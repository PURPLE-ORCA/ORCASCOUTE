"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAction } from "convex/react";
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
// Toast functionality - using alert for now

type AIGenerationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: Id<"jobs">;
  type: "email" | "coverLetter";
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
}: AIGenerationDialogProps) {
  // const { toast } = useToast();
  const generateEmail = useAction(api.ai.generateEmail);
  const generateCoverLetter = useAction(api.ai.generateCoverLetter);

  // State
  const [state, setState] = useState<DialogState>("config");
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [error, setError] = useState<string>("");

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

  // Reset state when dialog opens/closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setState("config");
      setError("");
      setGeneratedEmail(null);
      setGeneratedCoverLetter("");
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
    } catch (err) {
      clearInterval(interval);
      setError(err instanceof Error ? err.message : "Failed to generate email");
      setState("error");
    }
  };

  // Generate cover letter
  const handleGenerateCoverLetter = async () => {
    if (!coverLetterCvId) {
      alert("Please select a CV to generate a cover letter.");
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
    } catch (err) {
      clearInterval(interval);
      setError(
        err instanceof Error ? err.message : "Failed to generate cover letter"
      );
      setState("error");
    }
  };

  // Copy to clipboard
  const handleCopy = () => {
    const content =
      type === "email"
        ? `Subject: ${generatedEmail?.subject}\n\n${generatedEmail?.body}`
        : generatedCoverLetter;

    navigator.clipboard.writeText(content);
    alert(
      "✅ Copied to clipboard! Paste it into your email client or document."
    );
  };

  // Regenerate
  const handleRegenerate = () => {
    setState("config");
    setGeneratedEmail(null);
    setGeneratedCoverLetter("");
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
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center py-12"
            >
              <IconSparkles className="h-16 w-16 text-primary animate-pulse mb-4" />
              <p className="text-sm text-muted-foreground">
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
              {type === "email" && generatedEmail ? (
                <>
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <div className="rounded-md border bg-muted p-3">
                      <p className="text-sm">{generatedEmail.subject}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Email Body</Label>
                    <div className="rounded-md border bg-muted p-4 max-h-96 overflow-y-auto">
                      <pre className="text-sm whitespace-pre-wrap font-sans">
                        {generatedEmail.body}
                      </pre>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Label>Cover Letter</Label>
                  <div className="rounded-md border bg-muted p-6 max-h-96 overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap font-sans">
                      {generatedCoverLetter}
                    </pre>
                  </div>
                </div>
              )}

              <div className="flex justify-between gap-2">
                <Button variant="outline" onClick={handleRegenerate}>
                  <IconRefresh className="mr-2 h-4 w-4" />
                  Regenerate
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleCopy}>
                    <IconCopy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                  <Button onClick={() => onOpenChange(false)}>
                    <IconCheck className="mr-2 h-4 w-4" />
                    Done
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Error State */}
          {state === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="space-y-4"
            >
              <div className="rounded-md border border-red-500/20 bg-red-500/10 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <IconAlertCircle className="h-5 w-5 text-red-500" />
                  <p className="font-semibold text-sm">Generation Failed</p>
                </div>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setState("config")}>Try Again</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
