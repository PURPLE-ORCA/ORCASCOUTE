"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TemplateCard } from "@/components/template-card";
import { AddTemplateDialog } from "@/components/add-template-dialog";
import { TemplateDetailView } from "@/components/template-detail-view";
import { Spinner } from "@/components/ui/spinner";
import {
  IconPlus,
  IconSearch,
  IconMail,
  IconMailOff,
} from "@tabler/icons-react";
import { AnimatePresence } from "framer-motion";

export default function TemplatesPage() {
  const templates = useQuery(api.templates.list);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] =
    useState<Id<"email_templates"> | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);

  if (templates === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  // Get all unique tags
  const allTags = Array.from(
    new Set(templates.flatMap((t) => t.tags || []))
  ).sort();

  // Filter templates
  const filteredTemplates = templates.filter((template) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        template.title.toLowerCase().includes(query) ||
        (template.subject?.toLowerCase().includes(query) ?? false) ||
        template.body.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Tag filter
    if (selectedTags.length > 0) {
      const matchesTags = selectedTags.some((tag) =>
        template.tags?.includes(tag)
      );
      if (!matchesTags) return false;
    }

    return true;
  });

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <>
      <div className="container mx-auto max-w-6xl p-6 md:p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Email Templates
            </h1>
            <p className="mt-2 text-muted-foreground">
              Create and manage reusable email templates
            </p>
          </div>
          <AddTemplateDialog>
            <Button>
              <IconPlus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </AddTemplateDialog>
        </div>

        {templates.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-background/50 p-12 text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
              <IconMailOff className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">No templates yet</h3>
            <p className="mb-6 max-w-sm text-sm text-muted-foreground">
              Create your first email template to speed up your job application
              process.
            </p>
            <AddTemplateDialog>
              <Button>
                <IconPlus className="mr-2 h-4 w-4" />
                Create Your First Template
              </Button>
            </AddTemplateDialog>
          </div>
        ) : (
          <>
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search templates by title, subject, or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Tag Filter */}
            {allTags.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-3 font-semibold text-sm">Filter by tags</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={selectedTags.length === 0 ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setSelectedTags([])}
                  >
                    All
                  </Badge>
                  {allTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={
                        selectedTags.includes(tag) ? "default" : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Templates Grid */}
            {filteredTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-background/50 p-12 text-center">
                <IconSearch className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">
                  No templates found
                </h3>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {filteredTemplates.map((template) => (
                    <TemplateCard
                      key={template._id}
                      template={template}
                      onView={() => setSelectedTemplateId(template._id)}
                      onEdit={() => setEditingTemplate(template)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail View */}
      <TemplateDetailView
        templateId={selectedTemplateId}
        onClose={() => setSelectedTemplateId(null)}
        onEdit={(template) => setEditingTemplate(template)}
      />

      {/* Edit Dialog */}
      {editingTemplate && (
        <AddTemplateDialog
          template={editingTemplate}
          onSuccess={() => setEditingTemplate(null)}
        >
          <div />
        </AddTemplateDialog>
      )}
    </>
  );
}
