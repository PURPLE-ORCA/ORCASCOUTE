"use client";

import { ProfileForm } from "@/components/profile-form";
import { Card } from "@/components/ui/card";

export default function ProfilePage() {
  return (
    <div className="container mx-auto max-w-3xl p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your personal information and preferences. This data will be
          used to personalize AI-generated content.
        </p>
      </div>

      {/* Profile Form Card */}
      <Card className="border-none bg-transparent p-6 backdrop-blur-sm md:p-8">
        <ProfileForm />
      </Card>
    </div>
  );
}
