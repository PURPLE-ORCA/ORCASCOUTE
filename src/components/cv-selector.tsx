"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconFileOff } from "@tabler/icons-react";
import Link from "next/link";

type CVSelectorProps = {
  value?: Id<"cv_versions">;
  onValueChange: (value: Id<"cv_versions">) => void;
  required?: boolean;
};

export function CVSelector({
  value,
  onValueChange,
  required = false,
}: CVSelectorProps) {
  const cvs = useQuery(api.cvs.getCVs);

  if (cvs === undefined) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Loading CVs..." />
        </SelectTrigger>
      </Select>
    );
  }

  if (cvs.length === 0) {
    return (
      <div className="rounded-md border border-yellow-500/20 bg-yellow-500/10 p-3">
        <div className="flex items-center gap-2 mb-2">
          <IconFileOff className="h-4 w-4 text-yellow-500" />
          <p className="text-sm font-medium">No CVs uploaded</p>
        </div>
        <p className="text-xs text-muted-foreground mb-2">
          {required
            ? "You need to upload a CV to use this feature."
            : "Upload a CV to personalize your content."}
        </p>
        <Link href="/cvs" className="text-xs text-primary hover:underline">
          Upload CV →
        </Link>
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select a CV..." />
      </SelectTrigger>
      <SelectContent>
        {cvs.map((cv: any) => (
          <SelectItem key={cv._id} value={cv._id}>
            <div className="flex flex-col">
              <span className="font-medium">{cv.name}</span>
              <span className="text-xs text-muted-foreground">
                Uploaded {new Date(cv.createdAt).toLocaleDateString()}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
