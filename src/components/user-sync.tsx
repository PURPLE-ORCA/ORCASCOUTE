"use client";

import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";

export function UserSync() {
  const { isSignedIn } = useAuth();
  const storeUser = useMutation(api.users.store);

  useEffect(() => {
    if (isSignedIn) {
      storeUser();
    }
  }, [isSignedIn, storeUser]);

  return null;
}
