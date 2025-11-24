import { Badge } from "@/components/ui/badge";

type JobCardContentProps = {
  job: {
    title?: string;
    companyName?: string;
    salary?: string;
    location?: string;
    remoteType?: string;
  } & Record<string, any>;
};

export function JobCardContent({ job }: JobCardContentProps) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <p className="font-semibold text-sm">{job.companyName}</p>
        <p className="text-muted-foreground text-xs">{job.title}</p>
      </div>

      {(job.salary || job.remoteType) && (
        <div className="flex flex-wrap gap-1">
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
        </div>
      )}

      {job.location && (
        <p className="text-muted-foreground text-xs">{job.location}</p>
      )}
    </div>
  );
}
