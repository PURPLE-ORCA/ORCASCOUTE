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
          className="font-semibold text-base truncate"
          title={job.companyName}
        >
          {job.companyName}
        </motion.p>
        <motion.p
          className="text-muted-foreground text-sm line-clamp-2"
          title={job.title}
        >
          {job.title}
        </motion.p>
      </div>

      {(job.salary || job.remoteType) && (
        <motion.div className="flex flex-wrap gap-1">
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
