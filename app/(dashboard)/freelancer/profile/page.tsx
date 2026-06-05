// app/(dashboard)/freelancer/profile/page.tsx
// Server Page cho trang Chỉnh sửa hồ sơ cá nhân của Freelancer

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import ProfileForm from "./profile-form";

export default async function FreelancerProfilePage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || "mock-user-123";
  const cookieStore = await cookies();
  const mockSession = cookieStore.get("mock-session");
  const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || (mockSession && mockSession.value);

  let profileData = {
    fullName: user?.user_metadata?.full_name || "Hoàng Minh",
    bio: "",
    skills: [] as string[],
    portfolioVideoUrl: "",
    email: user?.email || "demo@creatorhire.vn"
  };

  if (isMock) {
    try {
      const cookieStore = await cookies();
      const mockProfileCookie = cookieStore.get("mock-profile");
      if (mockProfileCookie && mockProfileCookie.value) {
        const parsed = JSON.parse(mockProfileCookie.value);
        profileData.fullName = parsed.name || profileData.fullName;
        profileData.bio = parsed.bio || "";
        profileData.skills = parsed.skills || [];
        profileData.portfolioVideoUrl = parsed.portfolio_video_url || "";
      } else {
        // Giá trị giả lập mặc định ban đầu
        profileData.bio = "Mình có 3 năm kinh nghiệm dựng Shorts/Reels công nghệ. Đã edit cho 3 kênh công nghệ đạt mốc 100k subscribers. Cam kết đúng deadline và xử lý âm thanh SFX kịch tính.";
        profileData.skills = ["Premiere Pro", "After Effects", "Shorts Edit", "Sound Design", "Color Grading"];
        profileData.portfolioVideoUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
      }
    } catch (e) {
      console.error("Lỗi đọc profile cookie giả lập", e);
    }
  } else {
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profile && !error) {
        profileData.fullName = profile.full_name || profileData.fullName;
        profileData.bio = profile.bio || "";
        profileData.skills = profile.skills || [];
        profileData.portfolioVideoUrl = profile.portfolio_video_url || "";
      }
    } catch (e) {
      console.error("Lỗi đọc profile từ database Supabase", e);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-base font-bold text-ink">Hồ sơ năng lực cá nhân</h2>
        <p className="text-xs text-steel">
          Cập nhật thông tin tiểu sử, thẻ kỹ năng và link video portfolio để Creator đánh giá năng lực của bạn.
        </p>
      </div>

      <ProfileForm initialData={profileData} />
    </div>
  );
}
