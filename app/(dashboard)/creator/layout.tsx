// app/(dashboard)/creator/layout.tsx
// Server Layout cho Creator Dashboard

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import CreatorSidebar from "@/components/dashboard/sidebar";

export default async function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Middleware đã bảo vệ route này, nhưng double check để an toàn và ép kiểu
  if (!user) {
    redirect("/login");
  }

  const role = user.user_metadata?.role;
  if (role !== "creator") {
    redirect(role === "freelancer" ? "/freelancer" : "/login");
  }

  const userData = {
    email: user.email || "",
    fullName: user.user_metadata?.full_name || "Nhà sáng tạo",
    avatarUrl: user.user_metadata?.avatar_url || "",
  };

  return (
    <div className="flex h-screen w-screen bg-surface overflow-hidden font-sans">
      {/* Sidebar bên trái */}
      <CreatorSidebar user={userData} />

      {/* Main panel bên phải */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-surface">
        {/* Top Header */}
        <header className="h-16 px-8 border-b border-hairline bg-canvas flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-sm font-bold text-ink tracking-tight">
              Bảng quản lý Dự án
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold px-3 py-1 bg-brand-green/10 text-brand-green border border-brand-green/20 rounded-full">
              👑 Creator Mode
            </span>
            <div className="w-8 h-8 rounded-full bg-charcoal text-on-dark flex items-center justify-center font-bold text-xs">
              {userData.fullName.substring(0, 1).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content View */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          {children}
        </div>
      </main>
    </div>
  );
}
