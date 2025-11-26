"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function SSOCallback() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center">
      <AuthenticateWithRedirectCallback
        afterSignInUrl="/jobs"
        afterSignUpUrl="/jobs"
      />
    </div>
  );
}
