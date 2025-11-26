"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function DebugAuthPage() {
  const { isLoaded, userId, sessionId } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  if (!isLoaded) {
    return <div className="p-8">Loading auth state...</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="mb-4 font-bold text-2xl">Auth Debug Page</h1>

      <div className="space-y-4 rounded-lg border p-4">
        <div>
          <strong>Is Loaded:</strong> {isLoaded ? "Yes" : "No"}
        </div>
        <div>
          <strong>User ID:</strong> {userId || "Not authenticated"}
        </div>
        <div>
          <strong>Session ID:</strong> {sessionId || "No session"}
        </div>
        <div>
          <strong>User Email:</strong>{" "}
          {user?.primaryEmailAddress?.emailAddress || "N/A"}
        </div>
        <div>
          <strong>User Name:</strong> {user?.fullName || "N/A"}
        </div>
      </div>

      <div className="mt-4 space-x-2">
        <Button onClick={() => router.push("/jobs")}>Try to go to /jobs</Button>
        <Button onClick={() => router.push("/sign-in")}>Go to Sign In</Button>
      </div>
    </div>
  );
}
