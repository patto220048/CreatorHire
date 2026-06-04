// app/(dashboard)/freelancer/profile/actions.ts
// Server Action cập nhật Hồ sơ Năng lực cho Freelancer

"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function updateFreelancerProfileAction(prevState: any, formData: FormData) {
  const fullName = formData.get("full_name")?.toString().trim();
  const bio = formData.get("bio")?.toString().trim();
  const skillsStr = formData.get("skills")?.toString().trim() || "";
  const portfolioVideoUrl = formData.get("portfolio_video_url")?.toString().trim() || "";

  if (!fullName) {
    return { error: "Họ và tên không được để trống." };
  }

  // Phân tích danh sách kỹ năng ngăn cách bởi dấu phẩy
  const skills = skillsStr
    ? skillsStr.split(",").map((s) => s.trim()).filter((s) => s.length > 0)
    : [];

  const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (isMock) {
    try {
      const cookieStore = await cookies();
      
      // Cập nhật session mock để đồng bộ tên
      const mockSessionCookie = cookieStore.get("mock-session");
      let sessionData = { role: "freelancer", fullName: "Hoàng Minh", email: "demo@creatorhire.vn" };
      if (mockSessionCookie && mockSessionCookie.value) {
        try {
          sessionData = JSON.parse(mockSessionCookie.value);
        } catch (e) {}
      }
      
      sessionData.fullName = fullName;
      cookieStore.set("mock-session", JSON.stringify(sessionData), { path: "/", maxAge: 86400 });

      // Lưu hồ sơ freelancer giả lập vào cookie
      const mockProfile = {
        id: "mock-user-123",
        name: fullName,
        role: "Video Editor",
        bio: bio || "Chuyên edit video ngắn và xây dựng hình ảnh thương hiệu.",
        skills: skills.length > 0 ? skills : ["Premiere Pro", "After Effects", "Shorts Edit"],
        portfolio_video_url: portfolioVideoUrl,
        experience: "3 năm kinh nghiệm"
      };

      cookieStore.set("mock-profile", JSON.stringify(mockProfile), { path: "/", maxAge: 86400 });

    } catch (e) {
      console.error("Lỗi lưu cookie profile giả lập", e);
      return { error: "Lỗi lưu cookie hồ sơ giả lập." };
    }
  } else {
    try {
      const supabase = await getSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { error: "Phiên làm việc hết hạn. Vui lòng đăng nhập lại." };
      }

      // Cập nhật bảng profiles trong Supabase
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          bio: bio,
          skills: skills,
          portfolio_video_url: portfolioVideoUrl,
        })
        .eq("id", user.id);

      if (updateError) {
        return { error: `Lỗi cập nhật hồ sơ: ${updateError.message}` };
      }
    } catch (e) {
      console.error("Lỗi kết nối cơ sở dữ liệu khi cập nhật profile", e);
      return { error: "Lỗi kết nối cơ sở dữ liệu." };
    }
  }

  // Làm mới cache
  revalidatePath("/freelancer");
  revalidatePath("/freelancers");
  revalidatePath("/freelancer/profile");

  return { success: true };
}
