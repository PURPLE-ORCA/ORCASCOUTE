"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { CVUploadDialog } from "@/components/cv-upload-dialog";
import { CVCard } from "@/components/cv-card";
import { Spinner } from "@/components/ui/spinner";
import { IconPlus, IconFileOff } from "@tabler/icons-react";
import { AnimatePresence } from "framer-motion";

export default function CVsPage() {
  const cvs = useQuery(api.cvs.getCVs);

  if (cvs === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl p-6 md:p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My CVs</h1>
          <p className="mt-2 text-muted-foreground">
            Upload and manage different versions of your CV
          </p>
        </div>
        <CVUploadDialog>
          <Button>
            <IconPlus className="mr-2 h-4 w-4" />
            Upload CV
          </Button>
        </CVUploadDialog>
      </div>

      {/* CV Grid */}
      {cvs.length === 0 ? (
        // Empty State
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-background/50 p-12 text-center">
          <div className="mb-4 rounded-full bg-muted p-4">
            <IconFileOff className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">No CVs uploaded yet</h3>
          <p className="mb-6 max-w-sm text-sm text-muted-foreground">
            Upload your first CV to get started. You can manage multiple
            versions and use them for AI-powered job applications.
          </p>
          <CVUploadDialog>
            <Button>
              <IconPlus className="mr-2 h-4 w-4" />
              Upload Your First CV
            </Button>
          </CVUploadDialog>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {cvs.map((cv) => (
              <CVCard key={cv._id} cv={cv} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
