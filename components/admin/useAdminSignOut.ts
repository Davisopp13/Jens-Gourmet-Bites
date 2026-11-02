"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { disableDevicePush } from "./PushSettings";

// Keep desktop and mobile sign-out behavior identical.
export function useAdminSignOut() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const signOut = async () => {
    setSigningOut(true);
    let cleanupFailed = false;
    try {
      await disableDevicePush();
    } catch {
      cleanupFailed = true;
    }
    try {
      const { error } = await createClient().auth.signOut();
      if (error) throw error;
      if (cleanupFailed)
        window.alert(
          "You are signed out, but notification cleanup could not be confirmed. If alerts continue, turn off notifications for Jen’s Admin in this device’s settings.",
        );
      router.replace("/admin/login");
      router.refresh();
    } catch {
      window.alert("Sign-out could not be completed. Please try again.");
    } finally {
      setSigningOut(false);
    }
  };

  return { signOut, signingOut };
}
