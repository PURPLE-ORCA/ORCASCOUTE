"use client";

import { Unauthenticated, Authenticated } from "convex/react";
import { SignInButton } from "@clerk/nextjs";
import { UserMenu } from "@/components/user-menu";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-col items-center gap-8">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          OrcaScout
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Job hunting assistant & tracker
        </p>

        <Unauthenticated>
          <SignInButton mode="modal">
            <Button size="lg">Sign In</Button>
          </SignInButton>
        </Unauthenticated>

        <Authenticated>
          <div className="flex flex-col items-center gap-4">
            <p className="text-zinc-600 dark:text-zinc-400">Welcome back!</p>
            <UserMenu />
          </div>
        </Authenticated>
      </main>
    </div>
  );
}
