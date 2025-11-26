"use client";

import { AuthenticateWithRedirectCallback, useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SSOCallback() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded) {
      if (userId) {
        // User is authenticated, redirect to jobs
        console.log("User authenticated, redirecting to /jobs");
        router.push("/jobs");
      } else {
        // Not authenticated yet, wait a bit then force redirect
        const timeout = setTimeout(() => {
          console.log("Timeout reached, forcing redirect");
          window.location.href = "/jobs";
        }, 3000);
        return () => clearTimeout(timeout);
      }
    }
  }, [isLoaded, userId, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        <p className="text-muted-foreground">Completing sign in...</p>
        {isLoaded && !userId && (
          <p className="mt-2 text-xs text-muted-foreground">
            Establishing session...
          </p>
        )}
      </div>
      <AuthenticateWithRedirectCallback />
    </div>
  );
}
