"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { gsap } from "gsap";
import { 
  LogOut, 
  LayoutDashboard, 
  Briefcase, 
  User as UserIcon, 
  Bell, 
  Check, 
  CheckSquare, 
  Clock 
} from "lucide-react";
import { 
  getNotificationsAction, 
  markNotificationAsReadAction, 
  markAllNotificationsAsReadAction, 
  Notification 
} from "@/app/api/notifications/actions";

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
  
  // Notification states
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);

  // Đọc session từ mock cookie hoặc Supabase client
  useEffect(() => {
    const fetchSession = async () => {
      setLoading(true);
      
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
        } catch (e) {}
      }

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

  // Tải danh sách thông báo
  const loadNotifications = async () => {
    if (!session) return;
    try {
      const res = await getNotificationsAction();
      if (res.success && res.data) {
        setNotifications(res.data);
      }
    } catch (e) {
      console.error("Lỗi tải thông báo navbar:", e);
    }
  };

  useEffect(() => {
    if (session) {
      loadNotifications();

      // Polling thông báo mỗi 8 giây
      const interval = setInterval(() => {
        loadNotifications();
      }, 8000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
    }
  }, [session]);

  // GSAP animation cho dropdown thông báo
  useEffect(() => {
    if (showDropdown && dropdownRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          dropdownRef.current,
          { scale: 0.95, opacity: 0, y: -10 },
          { scale: 1, opacity: 1, y: 0, duration: 0.2, ease: "power2.out" }
        );
        
        // Hiệu ứng lắc nhẹ chuông khi mở
        if (bellRef.current) {
          gsap.fromTo(
            bellRef.current,
            { rotation: -10 },
            { rotation: 0, duration: 0.4, ease: "elastic.out(1, 0.3)" }
          );
        }
      }, dropdownRef);
      return () => ctx.revert();
    }
  }, [showDropdown]);

  // Đóng dropdown khi click ngoài
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        showDropdown &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        bellRef.current &&
        !bellRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showDropdown]);

  const handleLogout = async () => {
    document.cookie = "mock-session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
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

  // Click vào 1 thông báo
  const handleNotifClick = async (notif: Notification) => {
    setShowDropdown(false);
    if (!notif.is_read) {
      await markNotificationAsReadAction(notif.id);
      loadNotifications();
    }
    if (notif.link) {
      router.push(notif.link);
      router.refresh();
    }
  };

  // Đọc tất cả thông báo
  const handleMarkAllRead = async () => {
    await markAllNotificationsAsReadAction();
    loadNotifications();
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

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
              href="/chat"
              className={`text-sm font-semibold transition-colors ${
                pathname.startsWith("/chat") ? "text-brand-green font-bold" : "text-steel hover:text-ink"
              }`}
            >
              Tin nhắn
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
            <div className="flex items-center gap-2 animate-pulse">
              <div className="w-20 h-8 bg-surface rounded-full"></div>
              <div className="w-8 h-8 bg-surface rounded-full"></div>
            </div>
          ) : session ? (
            <div className="flex items-center gap-3">
              {/* Notification Bell (Bell) */}
              <div className="relative">
                <button
                  ref={bellRef}
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="p-2 text-stone hover:text-ink transition-all rounded-full hover:bg-surface relative cursor-pointer"
                  title="Thông báo"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-brand-green text-canvas text-[9px] font-bold rounded-full flex items-center justify-center border border-canvas scale-110 animate-bounce-short">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown thông báo */}
                {showDropdown && (
                  <div
                    ref={dropdownRef}
                    className="absolute right-0 mt-2.5 w-80 bg-canvas border border-hairline rounded-xl shadow-2xl overflow-hidden z-[99]"
                    style={{ transformOrigin: "top right" }}
                  >
                    <div className="p-3.5 border-b border-hairline flex items-center justify-between bg-surface/30">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-ink">Thông báo của bạn</h4>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[9px] font-bold text-brand-green hover:text-brand-green/80 flex items-center gap-1 cursor-pointer"
                        >
                          <CheckSquare className="w-3 h-3" /> Đọc tất cả
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-hairline-soft scrollbar-custom bg-canvas">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-stone">
                          Bạn chưa có thông báo nào.
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => handleNotifClick(notif)}
                            className={`p-3.5 cursor-pointer hover:bg-surface/50 transition-colors flex gap-2.5 items-start ${
                              !notif.is_read ? "bg-brand-green/5 font-medium" : ""
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${
                              !notif.is_read ? "bg-brand-green" : "bg-transparent"
                            }`} />
                            
                            <div className="flex-1 space-y-1">
                              <h5 className="text-[11px] font-bold text-ink leading-tight">
                                {notif.title}
                              </h5>
                              <p className="text-[10px] text-slate leading-normal">
                                {notif.content}
                              </p>
                              <span className="text-[8px] text-stone flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                {new Date(notif.created_at).toLocaleDateString("vi-VN")} {new Date(notif.created_at).toLocaleTimeString("vi-VN", {hour: '2-digit', minute: '2-digit'})}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-2 border-t border-hairline bg-surface/10 text-center">
                      <button
                        onClick={() => setShowDropdown(false)}
                        className="text-[10px] font-bold text-charcoal hover:underline cursor-pointer"
                      >
                        Đóng cửa sổ
                      </button>
                    </div>
                  </div>
                )}
              </div>

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
