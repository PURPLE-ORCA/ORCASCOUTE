"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddRecruiterDialog } from "@/components/add-recruiter-dialog";
import { RecruiterCard } from "@/components/recruiter-card";
import { RecruiterDetailView } from "@/components/recruiter-detail-view";
import { Spinner } from "@/components/ui/spinner";
import { IconPlus, IconUsers, IconSearch } from "@tabler/icons-react";
import { AnimatePresence } from "framer-motion";

export default function RecruitersPage() {
  const recruiters = useQuery(api.recruiters.getAll);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecruiterId, setSelectedRecruiterId] =
    useState<Id<"recruiters"> | null>(null);
  const [editingRecruiter, setEditingRecruiter] = useState<any>(null);

  if (recruiters === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  // Filter recruiters based on search query
  const filteredRecruiters = recruiters.filter((recruiter) => {
    const query = searchQuery.toLowerCase();
    return (
      recruiter.name.toLowerCase().includes(query) ||
      recruiter.company.toLowerCase().includes(query) ||
      recruiter.email.toLowerCase().includes(query) ||
      (recruiter.position?.toLowerCase().includes(query) ?? false)
    );
  });

  return (
    <>
      <div className="container mx-auto max-w-6xl p-6 md:p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Recruiters</h1>
            <p className="mt-2 text-muted-foreground">
              Manage your recruiter contacts and relationships
            </p>
          </div>
          <AddRecruiterDialog>
            <Button>
              <IconPlus className="mr-2 h-4 w-4" />
              Add Recruiter
            </Button>
          </AddRecruiterDialog>
        </div>

        {/* Search Bar */}
        {recruiters.length > 0 && (
          <div className="mb-6">
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, company, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        )}

        {/* Recruiter Grid */}
        {recruiters.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-background/50 p-12 text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
              <IconUsers className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">No recruiters yet</h3>
            <p className="mb-6 max-w-sm text-sm text-muted-foreground">
              Add your first recruiter to start tracking your professional
              network and job applications.
            </p>
            <AddRecruiterDialog>
              <Button>
                <IconPlus className="mr-2 h-4 w-4" />
                Add Your First Recruiter
              </Button>
            </AddRecruiterDialog>
          </div>
        ) : filteredRecruiters.length === 0 ? (
          // No Search Results
          <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-background/50 p-12 text-center">
            <IconSearch className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No results found</h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search query
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filteredRecruiters.map((recruiter) => (
                <RecruiterCard
                  key={recruiter._id}
                  recruiter={recruiter}
                  onView={() => setSelectedRecruiterId(recruiter._id)}
                  onEdit={() => setEditingRecruiter(recruiter)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Recruiter Detail View */}
      <RecruiterDetailView
        recruiterId={selectedRecruiterId}
        onClose={() => setSelectedRecruiterId(null)}
      />

      {/* Edit Dialog */}
      {editingRecruiter && (
        <AddRecruiterDialog
          recruiter={editingRecruiter}
          onSuccess={() => setEditingRecruiter(null)}
        >
          <div />
        </AddRecruiterDialog>
      )}
    </>
  );
}
