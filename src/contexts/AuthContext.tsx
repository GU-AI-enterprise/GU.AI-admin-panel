"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useAppDispatch } from "@/store/hooks";
import { setAuth, clearAuth, setAuthLoading } from "@/features/auth/authSlice";
import { setAuthToken } from "@/lib/apiFetch";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  userRole: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Track whether initial load has finished so the listener doesn't race with it
  const initialLoadDone = useRef(false);

  const syncUserToRedux = async (s: Session): Promise<{ role: string | null; admin: boolean }> => {
    // Set token immediately — before any async work — so API calls made
    // during or after this function always have a valid Bearer token.
    setAuthToken(s.access_token);

    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", s.user.id)
      .single();

    const role = userData?.role ?? null;
    const admin = role === "admin" || role === "staff";

    dispatch(setAuth({
      userId: s.user.id,
      email: s.user.email ?? null,
      displayName:
        s.user.user_metadata?.full_name ??
        s.user.user_metadata?.name ??
        s.user.email?.split("@")[0] ??
        null,
      avatarUrl: s.user.user_metadata?.avatar_url ?? s.user.user_metadata?.picture ?? null,
      userRole: role,
      isAdmin: admin,
      accessToken: s.access_token,
    }));

    return { role, admin };
  };

  useEffect(() => {
    dispatch(setAuthLoading(true));
    let mounted = true;

    const init = async () => {
      try {
        let { data: { session: s } } = await supabase.auth.getSession();
        if (!mounted) return;

        // If the stored session is expired (or within 60s of expiring), force a
        // refresh NOW before making any DB calls — otherwise syncUserToRedux
        // will fail with an expired JWT and isAdmin stays false, causing an
        // immediate redirect to login before the background refresh finishes.
        if (s?.expires_at && s.expires_at - Date.now() / 1000 < 60) {
          const { data: refreshed } = await supabase.auth.refreshSession();
          if (!mounted) return;
          s = refreshed.session;
        }

        setSession(s);
        setUser(s?.user ?? null);

        if (s?.user) {
          const result = await syncUserToRedux(s).catch(() => null);
          if (!mounted) return;
          setUserRole(result?.role ?? null);
          setIsAdmin(result?.admin ?? false);
        } else {
          dispatch(clearAuth());
        }
      } catch {
        if (mounted) {
          setSession(null);
          setUser(null);
          dispatch(clearAuth());
        }
      } finally {
        if (mounted) {
          setLoading(false);
          initialLoadDone.current = true;
        }
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, s) => {
        if (!mounted) return;

        // Skip INITIAL_SESSION — init() handles it to avoid double DB calls
        if (event === "INITIAL_SESSION") return;

        setSession(s);
        setUser(s?.user ?? null);

        if (s?.user) {
          const result = await syncUserToRedux(s).catch(() => null);
          if (!mounted) return;
          // Only update role/admin when DB query succeeded.
          // A transient failure must not clear isAdmin and kick the user out.
          if (result !== null) {
            setUserRole(result.role);
            setIsAdmin(result.admin);
          }
        } else {
          setUserRole(null);
          setIsAdmin(false);
          setAuthToken(null);
          dispatch(clearAuth());
        }

        // Only update loading if initial load is already done
        if (initialLoadDone.current) {
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    dispatch(clearAuth());
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, userRole, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
