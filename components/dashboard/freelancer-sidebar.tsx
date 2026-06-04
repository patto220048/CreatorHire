"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import gsap from "gsap";
import { LayoutDashboard, Search, FileText, User, LogOut } from "lucide-react";

interface SidebarProps {
  user: {
    email?: string;
    fullName?: string;
    avatarUrl?: string;
  };
}

export default function FreelancerSidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);

  const menuItems = [
    { name: "Tổng quan", path: "/freelancer", icon: LayoutDashboard },
    { name: "Tìm dự án", path: "/jobs", icon: Search },
    { name: "Đề xuất của tôi", path: "/freelancer/proposals", icon: FileText },
    { name: "Hồ sơ cá nhân", path: "/freelancer/profile", icon: User },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Slide-in sidebar từ bên trái
      gsap.fromTo(
        sidebarRef.current,
        { x: -100, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
      );

      // 2. Cascade fade-in cho các item trong menu
      if (linksRef.current) {
        const links = linksRef.current.querySelectorAll(".menu-item");
        if (links && links.length > 0) {
          gsap.fromTo(
            links,
            { x: -20, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.6, stagger: 0.1, delay: 0.2, ease: "power2.out" }
          );
        }
      }
    });

    return () => ctx.revert();
  }, []);

  const handleLogout = async () => {
    try {
      const { getSupabaseClient } = await import("@/lib/supabase/client");
      const supabase = await getSupabaseClient();
      await supabase.auth.signOut();
      
      router.push("/");
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div
      ref={sidebarRef}
      className="w-64 bg-canvas-dark text-on-dark flex flex-col h-screen border-r border-stone/20 overflow-y-auto"
      style={{ opacity: 0 }}
    >
      {/* Brand Header */}
      <div className="p-6 border-b border-stone/10">
        <Link href="/" className="text-xl font-bold tracking-wider text-on-dark block">
          creator<span className="text-brand-green">hire.</span>
        </Link>
        <span className="text-[10px] uppercase tracking-widest text-on-dark-muted mt-1 block">
          Freelancer Space
        </span>
      </div>

      {/* User Information */}
      <div className="p-6 border-b border-stone/10 bg-stone/5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-brand-green/20 text-brand-green border border-brand-green/30 flex items-center justify-center font-bold text-sm">
          {user.fullName ? user.fullName.substring(0, 2).toUpperCase() : "FL"}
        </div>
        <div className="overflow-hidden">
          <h4 className="text-xs font-semibold text-on-dark truncate">{user.fullName || "Freelancer"}</h4>
          <p className="text-[10px] text-on-dark-muted truncate">{user.email || "freelancer@creatorhire.vn"}</p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav ref={linksRef} className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`menu-item flex items-center gap-3 px-4 py-3 text-xs font-medium rounded-full transition-all duration-300 relative group overflow-hidden ${
                isActive
                  ? "bg-brand-green text-canvas font-semibold"
                  : "text-on-dark-muted hover:text-on-dark hover:bg-stone/5"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.name}</span>
              
              {!isActive && (
                <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-brand-green scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-center" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout button at bottom */}
      <div className="p-4 border-t border-stone/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-stone/20 rounded-full text-xs font-semibold text-on-dark-muted hover:text-on-dark hover:border-brand-error hover:bg-brand-error/10 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" /> Đăng xuất
        </button>
      </div>
    </div>
  );
}
