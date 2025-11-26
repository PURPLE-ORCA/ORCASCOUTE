"use client";

import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { IconBrandGoogle, IconBrandLinkedin } from "@tabler/icons-react";
import Link from "next/link";

export default function SignInPage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setIsLoading(true);

    try {
      const signInAttempt = await signIn.create({
        identifier: email,
        password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        router.push("/jobs");
      } else {
        console.error("Sign-in not complete:", signInAttempt.status);
        toast.error("Sign in failed. Please try again.");
      }
    } catch (err: any) {
      console.error("Sign-in error:", err);
      toast.error(err.errors?.[0]?.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (
    strategy: "oauth_google" | "oauth_linkedin_oidc"
  ) => {
    if (!isLoaded) return;

    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/jobs",
      });
    } catch (err: any) {
      console.error("OAuth error:", err);
      toast.error("OAuth sign in failed");
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-8 shadow-2xl">
      <div className="text-center">
        <h1 className="font-bold text-3xl">Welcome back</h1>
        <p className="mt-2 text-muted-foreground text-sm">
          Sign in to your account to continue
        </p>
      </div>

      {/* OAuth Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          onClick={() => handleOAuthSignIn("oauth_google")}
          className="border-zinc-800 bg-zinc-900 hover:bg-zinc-800"
        >
          <IconBrandGoogle className="mr-2 h-4 w-4" />
          Google
        </Button>
        <Button
          variant="outline"
          onClick={() => handleOAuthSignIn("oauth_linkedin_oidc")}
          className="border-zinc-800 bg-zinc-900 hover:bg-zinc-800"
        >
          <IconBrandLinkedin className="mr-2 h-4 w-4" />
          LinkedIn
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-zinc-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-zinc-950 px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      {/* Email/Password Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border-zinc-800 bg-zinc-900"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="Forgot password? text-sm hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="border-zinc-800 bg-zinc-900"
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      <p className="text-center text-muted-foreground text-sm">
        Don't have an account?{" "}
        <Link href="/sign-up" className="text-muted-foreground hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
