// app/jobs/[id]/actions.ts
// Server Action gửi báo giá ứng tuyển (Proposal) cho Freelancer

"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function submitProposalAction(prevState: any, formData: FormData) {
  const jobId = formData.get("job_id")?.toString();
  const bidAmountStr = formData.get("bid_amount")?.toString();
  const coverLetter = formData.get("cover_letter")?.toString().trim();

  // Validate các trường bắt buộc
  if (!jobId || !bidAmountStr || !coverLetter) {
    return { error: "Vui lòng nhập đầy đủ tất cả các trường." };
  }

  const bidAmount = parseFloat(bidAmountStr);
  if (isNaN(bidAmount) || bidAmount <= 0) {
    return { error: "Mức giá đề xuất phải là một số lớn hơn 0." };
  }

  const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || (jobId && jobId.startsWith("mock-"));

  if (isMock) {
    // ----------------------------------------------------
    // CHẾ ĐỘ GIẢ LẬP: LƯU VÀO COOKIE MOCK-PROPOSALS
    // ----------------------------------------------------
    try {
      const cookieStore = await cookies();
      
      // Đọc danh sách proposals hiện tại
      const mockPropsCookie = cookieStore.get("mock-proposals");
      let currentProps: any[] = [];
      if (mockPropsCookie && mockPropsCookie.value) {
        try {
          currentProps = JSON.parse(mockPropsCookie.value);
        } catch (e) {}
      }

      // Kiểm tra xem đã ứng tuyển chưa
      const alreadyApplied = currentProps.some(
        (p: any) => p.job_id === jobId
      );
      if (alreadyApplied) {
        return { error: "Bạn đã nộp báo giá cho dự án này rồi." };
      }

      // Đọc thông tin công việc để lấy tiêu đề
      const mockJobsCookie = cookieStore.get("mock-jobs");
      let allJobs = [];
      if (mockJobsCookie && mockJobsCookie.value) {
        allJobs = JSON.parse(mockJobsCookie.value);
      } else {
        allJobs = [
          { id: "mock-job-1", title: "Cần Video Editor chuyên nghiệp dựng Video Shorts công nghệ" },
          { id: "mock-job-2", title: "Viết kịch bản phim hoạt hình ngắn 2D (Thời lượng 5 phút)" },
          { id: "mock-job-3", title: "Thiết kế bộ Thumbnail bắt mắt cho kênh Vlog ẩm thực du lịch" },
        ];
      }

      const targetJob = allJobs.find((j: any) => j.id === jobId) || { title: "Dự án giả lập" };

      const newProposal = {
        id: `mock-prop-${Date.now()}`,
        job_id: jobId,
        job_title: targetJob.title,
        freelancer_name: "Hoàng Minh (Editor)",
        bid_amount: bidAmount,
        cover_letter: coverLetter,
        status: "pending",
        created_at: "Vừa xong",
      };

      cookieStore.set("mock-proposals", JSON.stringify([newProposal, ...currentProps]), {
        path: "/",
        maxAge: 86400,
      });

    } catch (e) {
      return { error: "Lỗi lưu cookie đề xuất giả lập." };
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

      // 1. Kiểm tra xem người dùng đã nộp proposal chưa
      const { data: existing, error: checkError } = await supabase
        .from("proposals")
        .select("id")
        .eq("job_id", jobId)
        .eq("freelancer_id", user.id)
        .maybeSingle();

      if (checkError) {
        return { error: `Lỗi kết nối cơ sở dữ liệu: ${checkError.message}` };
      }

      if (existing) {
        return { error: "Bạn đã nộp báo giá cho dự án này rồi." };
      }

      // 2. Insert báo giá mới
      const { error: insertError } = await supabase.from("proposals").insert({
        job_id: jobId,
        freelancer_id: user.id,
        cover_letter: coverLetter,
        bid_amount: bidAmount,
        status: "pending",
      });

      if (insertError) {
        return { error: `Không thể gửi báo giá: ${insertError.message}` };
      }

    } catch (e) {
      return { error: "Đã xảy ra lỗi khi gửi dữ liệu lên máy chủ." };
    }
  }

  // Làm mới cache các trang liên quan
  revalidatePath("/freelancer");
  revalidatePath("/freelancer/proposals");
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/creator");
  revalidatePath("/creator/jobs");

  return { success: true };
}
