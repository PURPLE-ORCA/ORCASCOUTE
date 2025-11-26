"use client";

import { Unauthenticated, Authenticated } from "convex/react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { IconX, IconInfoCircle } from "@tabler/icons-react";
import { useState, useEffect } from "react";

export default function Home() {
  const router = useRouter();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const bannerDismissed = localStorage.getItem("betaBannerDismissed");
    if (!bannerDismissed) {
      setShowBanner(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("betaBannerDismissed", "true");
    setShowBanner(false);
  };

  return (
    <>
      {/* Beta Banner */}
      {showBanner && (
        <div className="bg-primary/10 border-b border-primary/20">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <IconInfoCircle className="h-5 w-5 text-primary shrink-0" />
                <p className="text-sm">
                  <span className="font-semibold">v1.0 Preview:</span> This app
                  is in early beta. Features are actively being developed and
                  improved.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleDismiss}
              >
                <IconX className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

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
            <Button
              size="lg"
              className="text-lg"
              onClick={() => router.push("/sign-in")}
            >
              Get Started
            </Button>
          </Unauthenticated>

          <Authenticated>
            <Button size="lg" onClick={() => router.push("/jobs")}>
              Go to Dashboard
            </Button>
          </Authenticated>
        </div>
      <footer>
        <p className="mt-50 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Orcascoute v1.0 Preview. All rights reserved.
        </p>
      </footer>
      </div>
    </>
  );
}
