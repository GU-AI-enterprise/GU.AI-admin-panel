"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [statusMessage, setStatusMessage] = useState("Đang thiết lập phiên đăng nhập quản trị...");
  const [isError, setIsError] = useState(false);
  const [errorDetail, setErrorDetail] = useState("");

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Kiểm tra error parameter trong URL trước
      const error = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");
      
      if (error) {
        console.error("OAuth Error:", error, errorDescription);
        setIsError(true);
        setErrorDetail(errorDescription || "Lỗi không xác định");
        setStatusMessage("Xác thực thất bại. Đang chuyển hướng về trang đăng nhập...");
        setTimeout(() => {
          router.push(`/login?error=${error}&description=${encodeURIComponent(errorDescription || "")}`);
        }, 3000);
        return;
      }

      try {
        // Lắng nghe sự kiện Auth thay đổi - cách này đáng tin cậy hơn cho OAuth
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
          console.log("Auth event:", event, "Has session:", !!newSession);
          
          if (event === "SIGNED_IN" && newSession) {
            // Kiểm tra role admin
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('role')
              .eq('id', newSession.user.id)
              .single();

            if (userError || !userData || userData.role !== 'admin') {
              // Không phải admin - logout và báo lỗi
              await supabase.auth.signOut();
              setIsError(true);
              setErrorDetail("Bạn không có quyền truy cập Admin Panel. Chỉ Admin mới được phép.");
              setStatusMessage("Không có quyền truy cập. Đang chuyển hướng...");
              setTimeout(() => {
                router.push("/login?error=not_admin");
              }, 2000);
              authListener.subscription.unsubscribe();
              return;
            }

            // Là admin - tiếp tục
            setStatusMessage("Đăng nhập thành công! Đang chuyển hướng...");
            setTimeout(() => {
              router.push("/dashboard");
            }, 500);
            authListener.subscription.unsubscribe();
          } else if (event === "SIGNED_OUT") {
            setIsError(true);
            setStatusMessage("Phiên đăng nhập đã hết hạn. Đang chuyển hướng...");
            setTimeout(() => {
              router.push("/login?error=SessionExpired");
            }, 2000);
          }
        });

        // Timeout fallback - nếu không có event trong 5s thì thử lấy session trực tiếp
        const timeout = setTimeout(async () => {
          if (!isError) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              // Kiểm tra role admin
              const { data: userData, error: userError } = await supabase
                .from('users')
                .select('role')
                .eq('id', session.user.id)
                .single();

              if (userError || !userData || userData.role !== 'admin') {
                await supabase.auth.signOut();
                setIsError(true);
                setErrorDetail("Bạn không có quyền truy cập Admin Panel. Chỉ Admin mới được phép.");
                setStatusMessage("Không có quyền truy cập. Đang chuyển hướng...");
                setTimeout(() => {
                  router.push("/login?error=not_admin");
                }, 2000);
                authListener.subscription.unsubscribe();
                return;
              }

              setStatusMessage("Đăng nhập thành công! Đang chuyển hướng...");
              setTimeout(() => {
                router.push("/dashboard");
              }, 500);
            } else {
              setIsError(true);
              setStatusMessage("Không thể lấy session. Đang chuyển hướng...");
              setTimeout(() => {
                router.push("/login?error=NoSession");
              }, 2000);
            }
          }
          authListener.subscription.unsubscribe();
        }, 5000);

        return () => {
          clearTimeout(timeout);
          authListener.subscription.unsubscribe();
        };
      } catch (err: any) {
        console.error("Lỗi callback:", err);
        setIsError(true);
        setErrorDetail(err.message);
        setStatusMessage("Đã xảy ra lỗi. Đang chuyển hướng về trang đăng nhập...");
        setTimeout(() => {
          router.push("/login?error=Exception");
        }, 2000);
      }
    };

    handleAuthCallback();
  }, [router, searchParams, isError]);

  return (
    <div className="flex flex-col min-h-screen items-center justify-center text-center p-6 space-y-6 bg-background text-foreground">
      {/* Animated Glowing Logo */}
      <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/5 border border-primary/20 shadow-md">
        <div className="absolute inset-0 rounded-2xl bg-primary/10 blur-md opacity-75 animate-pulse" />
        {isError ? (
          <AlertCircle className="h-10 w-10 text-destructive" />
        ) : (
          <Sparkles className="h-10 w-10 text-primary animate-[spin_8s_linear_infinite]" />
        )}
      </div>

      <div className="space-y-2 max-w-md">
        <h3 className="font-serif text-xl font-medium">
          {isError ? "Xác thực không thành công" : "Đang xác thực quyền quản trị"}
        </h3>
        <p className="text-xs font-light text-muted-foreground animate-pulse">
          {statusMessage}
        </p>
        {isError && errorDetail && (
          <p className="text-xs text-destructive/80 mt-2 break-words">
            Chi tiết: {errorDetail}
          </p>
        )}
      </div>

      {/* Spinner or Check */}
      {isError ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Đang chuyển hướng về trang đăng nhập...</span>
        </div>
      ) : (
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      )}
    </div>
  );
}
