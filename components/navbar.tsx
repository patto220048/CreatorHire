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
  Clock,
  MessageSquare,
  LayoutGrid,
  ChevronDown
} from "lucide-react";
import { 
  getNotificationsAction, 
  markNotificationAsReadAction, 
  markAllNotificationsAsReadAction, 
  Notification 
} from "@/app/api/notifications/actions";
import { 
  getUnreadMessageCountAction,
  getChatPartnersAction,
  ChatPartner
} from "@/app/api/chat/actions";

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
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifDropdownRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);

  // Chat states
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);

  // Messenger Dropdown states
  const [showChatDropdown, setShowChatDropdown] = useState(false);
  const [chatPartners, setChatPartners] = useState<ChatPartner[]>([]);
  const [loadingChatPartners, setLoadingChatPartners] = useState(false);
  const chatDropdownRef = useRef<HTMLDivElement>(null);
  const messengerRef = useRef<HTMLButtonElement>(null);

  // User Dropdown states
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

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

  // Tải số lượng tin nhắn chưa đọc
  const loadUnreadMessageCount = async () => {
    if (!session) return;
    try {
      const res = await getUnreadMessageCountAction();
      if (res.success && typeof res.count === "number") {
        setUnreadMsgCount(res.count);
      }
    } catch (e) {
      console.error("Lỗi tải số tin nhắn chưa đọc:", e);
    }
  };

  // Tải danh sách cuộc trò chuyện gần đây
  const loadChatPartners = async () => {
    if (!session) return;
    setLoadingChatPartners(true);
    try {
      const res = await getChatPartnersAction();
      if (res.success && res.data) {
        setChatPartners(res.data);
      }
    } catch (e) {
      console.error("Lỗi tải đối tác chat navbar:", e);
    } finally {
      setLoadingChatPartners(false);
    }
  };

  useEffect(() => {
    if (showChatDropdown) {
      loadChatPartners();
    }
  }, [showChatDropdown]);

  useEffect(() => {
    if (session) {
      loadNotifications();
      loadUnreadMessageCount();

      // Polling thông báo & tin nhắn mỗi 5 giây
      const interval = setInterval(() => {
        loadNotifications();
        loadUnreadMessageCount();
      }, 5000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadMsgCount(0);
    }
  }, [session]);

  // GSAP animation cho dropdown thông báo
  useEffect(() => {
    if (showNotifDropdown && notifDropdownRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          notifDropdownRef.current,
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
      }, notifDropdownRef);
      return () => ctx.revert();
    }
  }, [showNotifDropdown]);

  // GSAP animation cho dropdown người dùng
  useEffect(() => {
    if (showUserDropdown && userDropdownRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          userDropdownRef.current,
          { scale: 0.95, opacity: 0, y: -10 },
          { scale: 1, opacity: 1, y: 0, duration: 0.2, ease: "power2.out" }
        );
      }, userDropdownRef);
      return () => ctx.revert();
    }
  }, [showUserDropdown]);

  // GSAP animation cho dropdown chat
  useEffect(() => {
    if (showChatDropdown && chatDropdownRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          chatDropdownRef.current,
          { scale: 0.95, opacity: 0, y: -10 },
          { scale: 1, opacity: 1, y: 0, duration: 0.2, ease: "power2.out" }
        );
      }, chatDropdownRef);
      return () => ctx.revert();
    }
  }, [showChatDropdown]);

  // Đóng dropdown khi click ngoài
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        showNotifDropdown &&
        notifDropdownRef.current &&
        !notifDropdownRef.current.contains(e.target as Node) &&
        bellRef.current &&
        !bellRef.current.contains(e.target as Node)
      ) {
        setShowNotifDropdown(false);
      }
      if (
        showChatDropdown &&
        chatDropdownRef.current &&
        !chatDropdownRef.current.contains(e.target as Node) &&
        messengerRef.current &&
        !messengerRef.current.contains(e.target as Node)
      ) {
        setShowChatDropdown(false);
      }
      if (
        showUserDropdown &&
        userDropdownRef.current &&
        !userDropdownRef.current.contains(e.target as Node) &&
        avatarRef.current &&
        !avatarRef.current.contains(e.target as Node)
      ) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showNotifDropdown, showChatDropdown, showUserDropdown]);

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
    setShowNotifDropdown(false);
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
            {/* Tin nhắn text link đã được chuyển thành Icon ở góc phải */}
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
              <div className="w-8 h-8 bg-surface rounded-full"></div>
              <div className="w-8 h-8 bg-surface rounded-full"></div>
            </div>
          ) : session ? (
            <div className="flex items-center gap-3">
              {/* 1. Grid Menu Icon (Facebook-style) */}
              <button 
                className="w-10 h-10 rounded-full bg-surface hover:bg-hairline flex items-center justify-center text-charcoal transition-colors cursor-pointer"
                title="Menu"
              >
                <LayoutGrid className="w-5 h-5 text-steel" />
              </button>

              {/* 2. Messenger Icon Button (Facebook-style) */}
              <div className="relative flex items-center justify-center">
                <button
                  ref={messengerRef}
                  onClick={() => {
                    setShowChatDropdown(!showChatDropdown);
                    setShowNotifDropdown(false);
                    setShowUserDropdown(false);
                  }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                    showChatDropdown 
                      ? "bg-brand-green/10 text-brand-green border border-brand-green/20" 
                      : "bg-surface hover:bg-hairline text-steel hover:text-ink"
                  }`}
                  title="Messenger"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2C6.36 2 2 6.13 2 11.7c0 3.22 1.45 6.06 3.75 7.9v3.7c0 .4.46.66.8.45l4.08-2.5c.44.08.9.15 1.37.15 5.64 0 10-4.13 10-9.7S17.64 2 12 2zm1.2 12.18l-2.4-2.55-4.7 2.55 5.17-5.5 2.43 2.55 4.67-2.55-5.17 5.5z"/>
                  </svg>
                  {unreadMsgCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[#f02849] text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-canvas px-1 scale-110 animate-bounce-short">
                      {unreadMsgCount}
                    </span>
                  )}
                </button>

                {/* Dropdown danh sách cuộc trò chuyện */}
                {showChatDropdown && (
                  <div
                    ref={chatDropdownRef}
                    className="absolute right-0 mt-2.5 top-10 w-80 bg-canvas border border-hairline rounded-2xl shadow-2xl overflow-hidden z-[99]"
                    style={{ transformOrigin: "top right" }}
                  >
                    <div className="p-3.5 border-b border-hairline flex items-center justify-between bg-surface/30">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-ink">Cuộc trò chuyện</h4>
                      <Link 
                        href="/chat" 
                        onClick={() => setShowChatDropdown(false)}
                        className="text-[9px] font-bold text-brand-green hover:underline cursor-pointer"
                      >
                        Mở hộp thư lớn
                      </Link>
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-hairline-soft scrollbar-custom bg-canvas">
                      {loadingChatPartners ? (
                        <div className="p-6 text-center text-xs text-stone animate-pulse">
                          Đang tải cuộc trò chuyện...
                        </div>
                      ) : chatPartners.length === 0 ? (
                        <div className="p-6 text-center text-xs text-stone">
                          Không có cuộc trò chuyện nào gần đây.
                        </div>
                      ) : (
                        chatPartners.map((partner) => (
                          <div 
                            key={partner.id}
                            onClick={() => {
                              setShowChatDropdown(false);
                              const event = new CustomEvent("open-mini-chat", {
                                detail: {
                                  id: partner.id,
                                  fullName: partner.fullName,
                                  role: partner.role,
                                  avatarUrl: partner.avatarUrl
                                }
                              });
                              window.dispatchEvent(event);
                            }}
                            className="p-3 cursor-pointer hover:bg-surface/50 transition-colors flex gap-2.5 items-center"
                          >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-green to-emerald-500 text-white flex items-center justify-center font-bold text-xs shrink-0 border border-hairline-soft">
                              {partner.fullName.slice(0, 1).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="text-xs font-bold text-ink truncate">
                                {partner.fullName}
                              </h5>
                              <p className="text-[9px] text-steel capitalize leading-none mt-1">
                                {partner.role === "freelancer" ? "Editor / Freelancer" : "Creator"}
                              </p>
                            </div>
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-green shrink-0"></span>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-2 border-t border-hairline bg-surface/10 text-center">
                      <button
                        onClick={() => setShowChatDropdown(false)}
                        className="text-[10px] font-bold text-charcoal hover:underline cursor-pointer"
                      >
                        Đóng cửa sổ
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Notification Bell (Facebook-style) */}
              <div className="relative flex items-center justify-center">
                <button
                  ref={bellRef}
                  onClick={() => {
                    setShowNotifDropdown(!showNotifDropdown);
                    setShowUserDropdown(false);
                  }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                    showNotifDropdown 
                      ? "bg-brand-green/10 text-brand-green border border-brand-green/20" 
                      : "bg-surface hover:bg-hairline text-steel hover:text-ink"
                  }`}
                  title="Thông báo"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[#f02849] text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-canvas px-1 scale-110 animate-bounce-short">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown thông báo */}
                {showNotifDropdown && (
                  <div
                    ref={notifDropdownRef}
                    className="absolute right-0 mt-2.5 top-10 w-80 bg-canvas border border-hairline rounded-2xl shadow-2xl overflow-hidden z-[99]"
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
                        onClick={() => setShowNotifDropdown(false)}
                        className="text-[10px] font-bold text-charcoal hover:underline cursor-pointer"
                      >
                        Đóng cửa sổ
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Profile Avatar với Mũi tên ChevronDown lồng ở góc dưới bên phải */}
              <div className="relative">
                <div 
                  ref={avatarRef}
                  onClick={() => {
                    setShowUserDropdown(!showUserDropdown);
                    setShowNotifDropdown(false);
                  }}
                  className="w-10 h-10 rounded-full bg-charcoal text-on-dark flex items-center justify-center font-bold text-sm border border-hairline-dark hover:scale-105 active:scale-95 transition-all cursor-pointer relative"
                  title="Tài khoản"
                >
                  {session.fullName.substring(0, 1).toUpperCase()}
                  <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#3a3b3c] border border-canvas rounded-full flex items-center justify-center text-white text-[8px] hover:bg-[#4e4f50] transition-colors">
                    <ChevronDown className="w-2.5 h-2.5" />
                  </span>
                </div>

                {/* Dropdown Menu Tài khoản (Facebook-style) */}
                {showUserDropdown && (
                  <div
                    ref={userDropdownRef}
                    className="absolute right-0 mt-2.5 w-72 bg-canvas border border-hairline rounded-2xl shadow-2xl p-4 z-[99] space-y-3"
                    style={{ transformOrigin: "top right" }}
                  >
                    {/* Header User info */}
                    <div className="flex items-center gap-3 p-2 hover:bg-surface rounded-xl transition-colors cursor-pointer" onClick={() => router.push(getDashboardUrl())}>
                      <div className="w-10 h-10 rounded-full bg-charcoal text-on-dark flex items-center justify-center font-bold text-sm shrink-0">
                        {session.fullName.substring(0, 1).toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="text-xs font-bold text-ink truncate">{session.fullName}</h4>
                        <p className="text-[9px] text-steel truncate leading-normal">{session.email}</p>
                        <span className="text-[8px] uppercase tracking-wider font-semibold text-brand-green font-mono">
                          {session.role === "freelancer" ? "Freelancer" : "Creator"}
                        </span>
                      </div>
                    </div>

                    <hr className="border-t border-hairline-soft" />

                    {/* Menu links */}
                    <div className="space-y-1">
                      <Link
                        href={getDashboardUrl()}
                        onClick={() => setShowUserDropdown(false)}
                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface rounded-xl transition-colors text-xs font-semibold text-charcoal cursor-pointer"
                      >
                        <LayoutDashboard className="w-4 h-4 text-stone shrink-0" />
                        <span>Bảng điều khiển (Dashboard)</span>
                      </Link>

                      <Link
                        href={session.role === "freelancer" ? "/freelancer/profile" : "/creator/jobs"}
                        onClick={() => setShowUserDropdown(false)}
                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface rounded-xl transition-colors text-xs font-semibold text-charcoal cursor-pointer"
                      >
                        <UserIcon className="w-4 h-4 text-stone shrink-0" />
                        <span>Cấu hình hồ sơ cá nhân</span>
                      </Link>
                    </div>

                    <hr className="border-t border-hairline-soft" />

                    {/* Logout Button */}
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-50 text-brand-error rounded-xl transition-all text-xs font-semibold text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 shrink-0" />
                      <span>Đăng xuất tài khoản</span>
                    </button>
                  </div>
                )}
              </div>
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
