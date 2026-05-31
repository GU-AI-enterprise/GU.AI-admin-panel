"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function RootPage() {
  const router = useRouter();
  const { session, isAdmin, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (session && isAdmin) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [loading, session, isAdmin, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>
  );
}
