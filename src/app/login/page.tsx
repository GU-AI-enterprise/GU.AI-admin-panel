"use client";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  const errorParam = searchParams.get('error');
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(errorParam === 'not_admin' ? "Bạn không có quyền truy cập Admin Panel." : "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Đăng nhập qua Supabase
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      // Đăng nhập thành công - kiểm tra role
      if (data?.session?.user) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.session.user.id)
          .single();

        if (userError || !userData) {
          throw new Error("Không thể tìm thấy thông tin người dùng.");
        }

        if (userData.role !== 'admin') {
          // Không phải admin - logout và báo lỗi
          await supabase.auth.signOut();
          throw new Error("Bạn không có quyền truy cập Admin Panel. Chỉ Admin mới được phép.");
        }

        // Là admin - redirect
        router.push(redirect);
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Email hoặc mật khẩu không chính xác.");
    } finally {
      setIsLoading(false);
    }
  };

  // Đăng nhập OAuth qua Google bằng Supabase
  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || "Không thể đăng nhập bằng Google.");
      setIsLoading(false);
    }
  };

  // Đăng nhập OAuth qua GitHub bằng Supabase
  const handleGithubLogin = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || "Không thể đăng nhập bằng GitHub.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 text-foreground">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-border bg-card p-8 shadow-xl">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-rose-400 text-primary-foreground shadow-lg">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="mt-6 font-serif text-3xl font-light tracking-tight">
            Chào mừng <span className="font-normal italic text-primary">quay lại</span>
          </h2>
          <p className="mt-2 text-xs font-light text-muted-foreground uppercase tracking-wider">
            GU.AI Admin Console
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        {/* OAuth Buttons */}
        <div className="grid grid-cols-2 gap-3">
          {/* Google Button */}
          <button
            onClick={handleGoogleLogin}
            type="button"
            className="group flex items-center justify-center gap-2 rounded-xl border border-border bg-background py-3 text-xs font-semibold text-foreground transition-all duration-300 hover:bg-secondary hover:border-primary/30 active:scale-[0.98]"
          >
            <svg className="size-4 transition-transform duration-300 group-hover:scale-115" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                fill="#EA4335"
              />
            </svg>
            Google
          </button>

          {/* GitHub Button */}
          <button
            onClick={handleGithubLogin}
            type="button"
            className="group flex items-center justify-center gap-2 rounded-xl border border-border bg-background py-3 text-xs font-semibold text-foreground transition-all duration-300 hover:bg-secondary hover:border-primary/30 active:scale-[0.98]"
          >
            <svg className="size-4 fill-current transition-transform duration-300 group-hover:scale-115" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.167 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
            GitHub
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 py-1">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs uppercase tracking-wider text-muted-foreground/40 font-mono">hoặc</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Credentials Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Email input */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Địa chỉ Email
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background py-3 pr-4 pl-11 text-sm text-foreground placeholder-muted-foreground/40 outline-none transition-all duration-300 focus:border-primary/50 focus:bg-card focus:ring-1 focus:ring-primary/50"
                  placeholder="admin@gu.ai"
                />
                <Mail className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground/60" />
              </div>
            </div>

            {/* Password input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Mật khẩu
                </label>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background py-3 pr-11 pl-11 text-sm text-foreground placeholder-muted-foreground/40 outline-none transition-all duration-300 focus:border-primary/50 focus:bg-card focus:ring-1 focus:ring-primary/50"
                  placeholder="••••••••"
                />
                <Lock className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground/60" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-4 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="relative flex w-full justify-center items-center gap-1.5 rounded-xl bg-primary py-3 px-4 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:bg-primary/95 hover:shadow-[0_0_20px_rgba(var(--color-primary),0.15)] disabled:opacity-50 active:scale-[0.98]"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Đang xác thực...
                </div>
              ) : (
                <>
                  Đăng nhập hệ thống
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="text-center text-xs text-muted-foreground font-light">
          Phiên bản dùng thử: <span className="font-semibold text-foreground">admin@gu.ai</span> / <span className="font-semibold text-foreground">admin123</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
