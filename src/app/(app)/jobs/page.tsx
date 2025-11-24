"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  KanbanProvider,
  KanbanBoard,
  KanbanHeader,
  KanbanCards,
  KanbanCard,
} from "@/components/ui/kanban";
import { JobCardContent } from "@/components/job-card-content";
import { AddJobDialog } from "@/components/add-job-dialog";
import { ExpandableJobDetail } from "@/components/expandable-job-detail";
import { JobDetailDialog } from "@/components/job-detail-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useState } from "react";
import { motion } from "framer-motion";
import type { Id } from "../../../../convex/_generated/dataModel";

const COLUMNS = [
  { id: "saved", name: "Saved" },
  { id: "applied", name: "Applied" },
  { id: "interview", name: "Interview" },
  { id: "offer", name: "Offer" },
];

export default function JobsPage() {
  const jobs = useQuery(api.jobs.list);
  const updateStatus = useMutation(api.jobs.updateStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<Id<"jobs"> | null>(null);
  const [editingJobId, setEditingJobId] = useState<Id<"jobs"> | null>(null);

  const selectedJob = jobs?.find((j) => j._id === selectedJobId) || null;
  const editingJob = jobs?.find((j) => j._id === editingJobId) || null;

  // Transform jobs data to match Kanban expected format
  const kanbanJobs =
    jobs?.map((job) => ({
      id: job._id,
      name: job.title,
      column: job.status,
      ...job,
    })) || [];

  const handleDataChange = async (newJobs: typeof kanbanJobs) => {
    setIsUpdating(true);
    try {
      // Find jobs that changed status
      const updates = newJobs.filter((newJob) => {
        const oldJob = jobs?.find((j) => j._id === newJob.id);
        return oldJob && oldJob.status !== newJob.column;
      });

      // Update each changed job
      await Promise.all(
        updates.map((job) =>
          updateStatus({
            id: job.id,
            status: job.column,
          })
        )
      );
    } finally {
      setIsUpdating(false);
    }
  };

  if (jobs === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Jobs</h1>
          <p className="text-muted-foreground">Track your job applications</p>
        </div>
        <AddJobDialog>
          <Button>+ Add Job</Button>
        </AddJobDialog>
      </div>

      {jobs.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border bg-card">
          <div className="text-center">
            <p className="mb-2 text-muted-foreground">No jobs yet</p>
            <AddJobDialog>
              <Button>+ Add Your First Job</Button>
            </AddJobDialog>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <KanbanProvider
            columns={COLUMNS}
            data={kanbanJobs}
            onDataChange={handleDataChange}
            className="h-full"
          >
            {(column) => {
              const columnJobs = kanbanJobs.filter(
                (job) => job.column === column.id
              );
              return (
                <KanbanBoard id={column.id} key={column.id}>
                  <KanbanHeader>
                    {column.name} ({columnJobs.length})
                  </KanbanHeader>
                  <KanbanCards id={column.id}>
                    {(job) => (
                      <KanbanCard
                        id={job.id}
                        name={job.name}
                        column={job.column}
                        key={job.id}
                      >
                        <motion.div
                          layoutId={`job-card-${job._id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedJobId(job._id as Id<"jobs">);
                          }}
                          className="cursor-pointer"
                        >
                          <JobCardContent job={job} />
                        </motion.div>
                      </KanbanCard>
                    )}
                  </KanbanCards>
                </KanbanBoard>
              );
            }}
          </KanbanProvider>
        </div>
      )}

      <ExpandableJobDetail
        job={selectedJob}
        onClose={() => setSelectedJobId(null)}
        onEdit={(job) => {
          setSelectedJobId(null);
          setEditingJobId(job._id);
        }}
      />

      <JobDetailDialog
        job={editingJob}
        open={!!editingJobId}
        onOpenChange={(open) => !open && setEditingJobId(null)}
      />

      {isUpdating && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 rounded-md border bg-background px-4 py-2 shadow-lg">
          <Spinner className="h-4 w-4" />
          <span className="text-sm">Updating...</span>
        </div>
      )}
    </div>
  );
}
