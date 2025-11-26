"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { useEffect } from "react";

export default function SSOCallback() {
  useEffect(() => {
    // Check if we're already authenticated after a short delay
    const checkAuth = setTimeout(() => {
      // If we're still on this page after 3 seconds, force redirect
      window.location.href = "/jobs";
    }, 3000);

    return () => clearTimeout(checkAuth);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
      <AuthenticateWithRedirectCallback />
    </div>
  );
}
