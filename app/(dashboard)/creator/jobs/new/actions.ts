// app/(dashboard)/creator/jobs/new/actions.ts
// Server Action để đăng tin tuyển dụng mới

"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function createJobAction(prevState: any, formData: FormData) {
  const title = formData.get("title")?.toString().trim();
  const category = formData.get("category")?.toString();
  const budgetType = formData.get("budget_type")?.toString() || "fixed";
  const budgetAmountStr = formData.get("budget_amount")?.toString();
  const description = formData.get("description")?.toString().trim();

  // Validate các trường bắt buộc
  if (!title || !category || !budgetAmountStr || !description) {
    return { error: "Vui lòng nhập đầy đủ tất cả các trường." };
  }

  const budgetAmount = parseFloat(budgetAmountStr);
  if (isNaN(budgetAmount) || budgetAmount <= 0) {
    return { error: "Mức ngân sách phải là một số lớn hơn 0." };
  }

  const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (isMock) {
    // ----------------------------------------------------
    // CHẾ ĐỘ GIẢ LẬP: LƯU DỰ ÁN MỚI VÀO COOKIE MOCK-JOBS
    // ----------------------------------------------------
    try {
      const cookieStore = await cookies();
      const mockJobsCookie = cookieStore.get("mock-jobs");
      let currentJobs: any[] = [];
      
      if (mockJobsCookie && mockJobsCookie.value) {
        try {
          currentJobs = JSON.parse(mockJobsCookie.value);
        } catch (e) {
          // Lỗi parse -> Bỏ qua
        }
      }

      const newMockJob = {
        id: `mock-job-${Date.now()}`,
        title,
        category,
        budget_amount: budgetAmount,
        budget_type: budgetType,
        status: "open",
        created_at: "Vừa xong",
        proposals_count: 0,
        description,
      };

      // Đẩy job mới lên đầu danh sách và lưu lại cookie (hạn 1 ngày)
      cookieStore.set("mock-jobs", JSON.stringify([newMockJob, ...currentJobs]), {
        path: "/",
        maxAge: 86400,
      });
    } catch (e) {
      return { error: "Không thể lưu thông tin giả lập vào cookies." };
    }
  } else {
    // ----------------------------------------------------
    // CHẾ ĐỘ DATABASE THỰC TẾ (SUPABASE)
    // ----------------------------------------------------
    try {
      const supabase = await getSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { error: "Phiên làm việc hết hạn. Vui lòng đăng nhập lại." };
      }

      const { error } = await supabase.from("jobs").insert({
        creator_id: user.id,
        title,
        category,
        budget_type: budgetType,
        budget_amount: budgetAmount,
        description,
        status: "open",
      });

      if (error) {
        return { error: `Lỗi kết nối cơ sở dữ liệu: ${error.message}` };
      }
    } catch (e) {
      return { error: "Đã xảy ra lỗi hệ thống khi kết nối cơ sở dữ liệu." };
    }
  }

  // Revalidate cache các trang liên quan để dữ liệu mới cập nhật tức thì
  revalidatePath("/creator");
  revalidatePath("/creator/jobs");
  
  return { success: true };
}
