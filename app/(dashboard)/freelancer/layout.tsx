// app/(dashboard)/freelancer/layout.tsx
// Server Layout cho Freelancer Dashboard

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import FreelancerSidebar from "@/components/dashboard/freelancer-sidebar";

export default async function FreelancerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Middleware bảo vệ route, kiểm tra lại để an toàn
  if (!user) {
    redirect("/login");
  }

  const role = user.user_metadata?.role;
  if (role !== "freelancer") {
    redirect(role === "creator" ? "/creator" : "/login");
  }

  const userData = {
    email: user.email || "",
    fullName: user.user_metadata?.full_name || "Freelancer",
    avatarUrl: user.user_metadata?.avatar_url || "",
  };

  return (
    <div className="flex h-screen w-screen bg-surface overflow-hidden font-sans">
      {/* Sidebar bên trái */}
      <FreelancerSidebar user={userData} />

      {/* Main panel bên phải */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-surface">
        {/* Top Header */}
        <header className="h-16 px-8 border-b border-hairline bg-canvas flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-sm font-bold text-ink tracking-tight">
              Bảng quản lý Công việc
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold px-3 py-1 bg-brand-tag/10 text-brand-tag border border-brand-tag/20 rounded-full">
              💻 Freelancer Mode
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
