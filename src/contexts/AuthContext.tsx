"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
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

  const syncUserToRedux = async (session: Session | null) => {
    if (!session?.user) {
      dispatch(clearAuth());
      return;
    }

    const { user } = session;
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = userData?.role ?? null;
    const admin = role === "admin" || role === "staff";

    setAuthToken(session.access_token);
    dispatch(setAuth({
      userId: user.id,
      email: user.email ?? null,
      displayName:
        user.user_metadata?.full_name ??
        user.user_metadata?.name ??
        user.email?.split("@")[0] ??
        null,
      avatarUrl: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null,
      userRole: role,
      isAdmin: admin,
      accessToken: session.access_token,
    }));

    return { role, admin };
  };

  useEffect(() => {
    dispatch(setAuthLoading(true));

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const result = await syncUserToRedux(session);
        setUserRole(result?.role ?? null);
        setIsAdmin(result?.admin ?? false);
      } else {
        dispatch(clearAuth());
      }
      setLoading(false);
    };

    init().catch(() => {
      dispatch(clearAuth());
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const result = await syncUserToRedux(session);
          setUserRole(result?.role ?? null);
          setIsAdmin(result?.admin ?? false);
        } else {
          setUserRole(null);
          setIsAdmin(false);
          setAuthToken(null);
          dispatch(clearAuth());
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    dispatch(clearAuth());
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, isAdmin, userRole, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
