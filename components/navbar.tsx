"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { LogOut, LayoutDashboard, Briefcase, User as UserIcon } from "lucide-react";

interface UserSession {
  email: string;
  role: "creator" | "freelancer";
  fullName: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Đọc session từ mock cookie hoặc Supabase client
  useEffect(() => {
    const fetchSession = async () => {
      setLoading(true);
      
      // 1. Kiểm tra mock session
      const getCookie = (name: string): string | null => {
        if (typeof document === "undefined") return null;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
        return null;
      };

      const mockSessionCookie = getCookie("mock-session");
      if (mockSessionCookie) {
        try {
          const parsed = JSON.parse(decodeURIComponent(mockSessionCookie));
          setSession(parsed);
          setLoading(false);
          return;
        } catch (e) {
          // Lỗi parse cookie -> Tiếp tục check Supabase
        }
      }

      // 2. Kiểm tra Supabase session thực tế
      try {
        const supabase = await getSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setSession({
            email: user.email || "",
            role: user.user_metadata?.role || "creator",
            fullName: user.user_metadata?.full_name || "Thành viên",
          });
        } else {
          setSession(null);
        }
      } catch (err) {
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [pathname]);

  const handleLogout = async () => {
    // 1. Xóa cookie mock
    document.cookie = "mock-session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    
    // 2. Sign out Supabase
    try {
      const supabase = await getSupabaseClient();
      await supabase.auth.signOut();
    } catch (e) {}

    setSession(null);
    router.push("/");
    router.refresh();
    setTimeout(() => window.location.reload(), 150);
  };

  const getDashboardUrl = () => {
    if (!session) return "/";
    return session.role === "freelancer" ? "/freelancer" : "/creator";
  };

  return (
    <header className="sticky top-0 z-40 bg-canvas/85 backdrop-blur-md border-b border-hairline-soft w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Public Navigation */}
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold tracking-wider text-ink flex items-center gap-1.5">
            creator<span className="text-brand-green">hire.</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/jobs"
              className={`text-sm font-semibold transition-colors ${
                pathname === "/jobs" ? "text-brand-green font-bold" : "text-steel hover:text-ink"
              }`}
            >
              Tìm công việc
            </Link>
            <Link
              href="/freelancers"
              className={`text-sm font-semibold transition-colors ${
                pathname.startsWith("/freelancers") ? "text-brand-green font-bold" : "text-steel hover:text-ink"
              }`}
            >
              Tìm Freelancer
            </Link>
            <Link 
              href="/pricing" 
              className="text-sm font-semibold text-steel hover:text-ink transition-colors"
            >
              Bảng giá
            </Link>
          </nav>
        </div>

        {/* User Right Section */}
        <div className="flex items-center gap-4">
          {loading ? (
            // Skeleton loader khi đang check session
            <div className="flex items-center gap-2 animate-pulse">
              <div className="w-20 h-8 bg-surface rounded-full"></div>
              <div className="w-8 h-8 bg-surface rounded-full"></div>
            </div>
          ) : session ? (
            // Đã đăng nhập
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-ink max-w-[150px] truncate">
                  {session.fullName}
                </span>
                <span className="text-[9px] uppercase tracking-wider font-semibold text-brand-green font-mono">
                  {session.role === "freelancer" ? "Freelancer" : "Creator"}
                </span>
              </div>
              
              {/* Initials Avatar */}
              <Link 
                href={getDashboardUrl()} 
                className="w-9 h-9 rounded-full bg-charcoal text-on-dark flex items-center justify-center font-bold text-xs border border-hairline-dark hover:scale-105 active:scale-95 transition-transform"
                title="Đi tới Dashboard của bạn"
              >
                {session.fullName.substring(0, 1).toUpperCase()}
              </Link>

              {/* Quick Dashboard Action */}
              <Link
                href={getDashboardUrl()}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-surface border border-hairline hover:bg-canvas rounded-full text-charcoal transition-colors cursor-pointer"
              >
                <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
              </Link>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="p-2 text-stone hover:text-brand-error transition-colors rounded-full hover:bg-surface cursor-pointer"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            // Chưa đăng nhập
            <div className="flex items-center gap-3">
              <Link 
                href="/login" 
                className="px-4 py-2 text-sm font-semibold text-charcoal hover:bg-surface rounded-full transition-colors cursor-pointer"
              >
                Đăng nhập
              </Link>
              <Link 
                href="/register" 
                className="px-4 py-2 text-sm font-semibold bg-ink text-on-dark rounded-full hover:bg-charcoal transition-colors cursor-pointer"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
