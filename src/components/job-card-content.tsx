import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

type JobCardContentProps = {
  job: {
    _id?: string;
    title?: string;
    companyName?: string;
    salary?: string;
    location?: string;
    remoteType?: string;
  } & Record<string, unknown>;
};

export function JobCardContent({ job }: JobCardContentProps) {
  const jobId = job._id || job.id;

  return (
    <div className="flex flex-col gap-2">
      <div>
        <motion.p
          layoutId={`job-company-${jobId}`}
          className="font-semibold text-lg"
        >
          {job.companyName}
        </motion.p>
        <motion.p
          layoutId={`job-title-${jobId}`}
          className="text-muted-foreground text-base"
        >
          {job.title}
        </motion.p>
      </div>

      {(job.salary || job.remoteType) && (
        <motion.div
          layoutId={`job-badges-${jobId}`}
          className="flex flex-wrap gap-1"
        >
          {job.salary && (
            <Badge variant="secondary" className="text-xs">
              {job.salary}
            </Badge>
          )}
          {job.remoteType && (
            <Badge variant="outline" className="text-xs">
              {job.remoteType}
            </Badge>
          )}
        </motion.div>
      )}
    </div>
  );
}
