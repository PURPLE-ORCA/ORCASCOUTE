"use client";

import { Unauthenticated, Authenticated } from "convex/react";
import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-8 text-center">
        <div className="flex flex-col gap-4">
          <h1 className="text-6xl font-bold tracking-tight">
            Track Your Job Hunt
            <br />
            <span className="bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Like a Pro
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-muted-foreground text-xl">
            Organize applications, generate AI-powered emails, and land your
            dream job faster.
          </p>
        </div>

        <Unauthenticated>
          <SignInButton mode="modal">
            <Button size="lg" className="text-lg">
              Get Started
            </Button>
          </SignInButton>
        </Unauthenticated>

        <Authenticated>
          <Button size="lg" onClick={() => router.push("/jobs")}>
            Go to Dashboard
          </Button>
        </Authenticated>
      </div>
    </div>
  );
}
