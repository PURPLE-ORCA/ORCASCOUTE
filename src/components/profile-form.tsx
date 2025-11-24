"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Badge } from "@/components/ui/badge";
import { IconX, IconPlus, IconCheck } from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import { Spinner } from "@/components/ui/spinner";

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Dubai",
  "Australia/Sydney",
];

const formSchema = z.object({
  title: z.string().min(1, "Job title is required"),
  timezone: z.string(),
  defaultSignature: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

export function ProfileForm() {
  const user = useQuery(api.users.getViewer);
  const updateProfile = useMutation(api.users.updateProfile);

  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      timezone: "UTC",
      defaultSignature: "",
    },
  });

  // Initialize form when user data loads
  useEffect(() => {
    if (user) {
      form.reset({
        title: user.title || "",
        timezone: user.timezone || "UTC",
        defaultSignature: user.defaultSignature || "",
      });
      setSkills(user.skills || []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Only re-run when user data changes, not when form changes

  const addSkill = () => {
    const trimmedSkill = newSkill.trim();
    if (trimmedSkill && !skills.includes(trimmedSkill)) {
      setSkills([...skills, trimmedSkill]);
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      await updateProfile({
        title: values.title,
        skills,
        timezone: values.timezone,
        defaultSignature: values.defaultSignature,
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job Title *</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Frontend Developer"
                  {...field}
                  className="bg-background/50 backdrop-blur-sm"
                />
              </FormControl>
              <FormDescription>
                Your current or desired job title
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Skills */}
        <div className="space-y-2">
          <FormLabel>Skills</FormLabel>
          <div className="space-y-3">
            {/* Skill chips */}
            <AnimatePresence mode="popLayout">
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <motion.div
                      key={skill}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Badge
                        variant="secondary"
                        className="group flex items-center gap-1 px-3 py-1.5 text-sm"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="ml-1 rounded-full p-0.5 transition-colors hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <IconX className="h-3 w-3" />
                        </button>
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>

            {/* Add skill input */}
            <div className="flex gap-2">
              <Input
                placeholder="Add a skill (e.g., React, TypeScript)"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={handleKeyDown}
                className="bg-background/50 backdrop-blur-sm"
              />
              <Button
                type="button"
                onClick={addSkill}
                variant="outline"
                size="icon"
                disabled={!newSkill.trim()}
              >
                <IconPlus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Press Enter or click + to add skills
          </p>
        </div>

        {/* Timezone */}
        <FormField
          control={form.control}
          name="timezone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Timezone</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-background/50 backdrop-blur-sm">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Used for scheduling and reminders
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email Signature */}
        <FormField
          control={form.control}
          name="defaultSignature"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default Email Signature</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Best regards,&#10;Your Name"
                  rows={4}
                  {...field}
                  className="resize-none bg-background/50 backdrop-blur-sm"
                />
              </FormControl>
              <FormDescription>
                This will be added to AI-generated emails
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <div className="flex items-center gap-3">
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

          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400"
              >
                <IconCheck className="h-4 w-4" />
                <span>Saved successfully!</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </form>
    </Form>
  );
}
