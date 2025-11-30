"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SSOCallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        <p className="text-muted-foreground">Completing authentication...</p>
      </div>
      <AuthenticateWithRedirectCallback
        afterSignInUrl="/jobs"
        afterSignUpUrl="/jobs"
      />
    </div>
  );
}
