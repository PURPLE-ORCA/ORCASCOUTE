"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SSOCallback() {
  const router = useRouter();

  useEffect(() => {
    // Add a timeout to redirect if the callback takes too long
    const timeout = setTimeout(() => {
      router.push("/jobs");
    }, 5000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
      <AuthenticateWithRedirectCallback
        signInFallbackRedirectUrl="/jobs"
        signUpFallbackRedirectUrl="/jobs"
        continueSignUpUrl="/jobs"
      />
    </div>
  );
}
