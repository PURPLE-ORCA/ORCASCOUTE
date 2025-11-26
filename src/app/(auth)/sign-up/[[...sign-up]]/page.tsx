"use client";

import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { IconBrandGoogle, IconBrandLinkedin } from "@tabler/icons-react";
import Link from "next/link";

export default function SignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setIsLoading(true);

    try {
      await signUp.create({
        emailAddress: email,
        password,
      });

      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });

      setVerifying(true);
      toast.success("Verification code sent to your email");
    } catch (err: any) {
      console.error("Sign-up error:", err);
      toast.error(err.errors?.[0]?.message || "Sign up failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setIsLoading(true);

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (signUpAttempt.status === "complete") {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.push("/jobs");
      } else {
        console.error("Verification not complete:", signUpAttempt.status);
        toast.error("Verification failed. Please try again.");
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      toast.error(err.errors?.[0]?.message || "Invalid verification code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignUp = async (
    strategy: "oauth_google" | "oauth_linkedin_oidc"
  ) => {
    if (!isLoaded) return;

    try {
      await signUp.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/jobs",
      });
    } catch (err: any) {
      console.error("OAuth error:", err);
      toast.error("OAuth sign up failed");
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Verification Form
  if (verifying) {
    return (
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-8 shadow-2xl">
        <div className="text-center">
          <h1 className="font-bold text-3xl">Verify your email</h1>
          <p className="mt-2 text-muted-foreground text-sm">
            We sent a verification code to <strong>{email}</strong>
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              type="text"
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              maxLength={6}
              className="border-zinc-800 bg-zinc-900 text-center text-2xl tracking-widest"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Verifying...
              </>
            ) : (
              "Verify Email"
            )}
          </Button>
        </form>

        <p className="text-center text-muted-foreground text-sm">
          Didn't receive the code?{" "}
          <button
            onClick={async () => {
              try {
                await signUp.prepareEmailAddressVerification({
                  strategy: "email_code",
                });
                toast.success("New code sent!");
              } catch (err) {
                toast.error("Failed to resend code");
              }
            }}
            className="text-primary hover:underline"
          >
            Resend
          </button>
        </p>
      </div>
    );
  }

  // Sign Up Form
  return (
    <div className="w-full max-w-md space-y-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-8 shadow-2xl">
      <div className="text-center">
        <h1 className="font-bold text-3xl">Create an account</h1>
        <p className="mt-2 text-muted-foreground text-sm">
          Get started with your job hunting journey
        </p>
      </div>

      {/* OAuth Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          onClick={() => handleOAuthSignUp("oauth_google")}
          className="border-zinc-800 bg-zinc-900 hover:bg-zinc-800"
        >
          <IconBrandGoogle className="mr-2 h-4 w-4" />
          Google
        </Button>
        <Button
          variant="outline"
          onClick={() => handleOAuthSignUp("oauth_linkedin_oidc")}
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
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="border-zinc-800 bg-zinc-900"
          />
          <p className="text-muted-foreground text-xs">
            Must be at least 8 characters
          </p>
        </div>

        {/* Clerk Captcha */}
        <div id="clerk-captcha" />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>

      <p className="text-center text-muted-foreground text-sm">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-muted-foreground hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
