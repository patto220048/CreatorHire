// app/(dashboard)/creator/jobs/actions.ts
// Server Actions để xử lý cập nhật trạng thái Báo giá (Chấp nhận/Từ chối) và Trạng thái Công việc

"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function updateProposalStatusAction(
  proposalId: string,
  jobId: string,
  newStatus: "accepted" | "rejected"
) {
  const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (isMock) {
    // ----------------------------------------------------
    // CHẾ ĐỘ GIẢ LẬP: CẬP NHẬT TRONG COOKIES MOCK-JOBS & MOCK-PROPOSALS
    // ----------------------------------------------------
    try {
      const cookieStore = await cookies();
      
      // 1. Cập nhật trạng thái Proposal
      const mockPropsCookie = cookieStore.get("mock-proposals");
      let currentProps = [];
      
      if (mockPropsCookie && mockPropsCookie.value) {
        currentProps = JSON.parse(mockPropsCookie.value);
      } else {
        // Giá trị mặc định ban đầu
        currentProps = [
          {
            id: "mock-prop-1",
            job_id: "mock-job-1",
            job_title: "Cần Video Editor chuyên nghiệp dựng Video Shorts công nghệ",
            freelancer_name: "Hoàng Minh (Editor)",
            bid_amount: 1400000,
            cover_letter: "Mình có 2 năm kinh nghiệm dựng shorts, đã edit cho 3 kênh công nghệ đạt 100k sub. Mình dùng Premiere Pro và After Effects, cam kết bàn giao đúng hạn.",
            status: "pending",
            created_at: "1 giờ trước",
          },
          {
            id: "mock-prop-2",
            job_id: "mock-job-1",
            job_title: "Cần Video Editor chuyên nghiệp dựng Video Shorts công nghệ",
            freelancer_name: "Nguyễn Thảo (Editor)",
            bid_amount: 1500000,
            cover_letter: "Hi, mình có sẵn kho template chuyển cảnh công nghệ cao cấp. Mình sẽ dựng thử 1 video ngắn 15 giây đầu tiên miễn phí để bạn kiểm định chất lượng nhé!",
            status: "pending",
            created_at: "3 giờ trước",
          },
        ];
      }

      // Cập nhật proposal được chọn
      currentProps = currentProps.map((p: any) => 
        p.id === proposalId ? { ...p, status: newStatus } : p
      );
      
      cookieStore.set("mock-proposals", JSON.stringify(currentProps), {
        path: "/",
        maxAge: 86400,
      });

      // 2. Nếu chấp nhận báo giá -> Chuyển trạng thái của Job tương ứng sang in-progress
      if (newStatus === "accepted") {
        const mockJobsCookie = cookieStore.get("mock-jobs");
        let currentJobs = [];
        
        if (mockJobsCookie && mockJobsCookie.value) {
          currentJobs = JSON.parse(mockJobsCookie.value);
        } else {
          // Khởi tạo danh sách mặc định nếu chưa có
          currentJobs = [
            {
              id: "mock-job-1",
              title: "Cần Video Editor chuyên nghiệp dựng Video Shorts công nghệ",
              category: "video-edit",
              budget_amount: 1500000,
              status: "open",
              created_at: "2 giờ trước",
              proposals_count: 2,
            },
            {
              id: "mock-job-2",
              title: "Viết kịch bản phim hoạt hình ngắn 2D (Thời lượng 5 phút)",
              category: "script",
              budget_amount: 3500000,
              status: "in-progress",
              created_at: "1 ngày trước",
              proposals_count: 1,
            },
            {
              id: "mock-job-3",
              title: "Thiết kế bộ Thumbnail bắt mắt cho kênh Vlog ẩm thực du lịch",
              category: "thumbnail",
              budget_amount: 1200000,
              status: "completed",
              created_at: "5 ngày trước",
              proposals_count: 3,
            },
          ];
        }

        currentJobs = currentJobs.map((j: any) => 
          j.id === jobId ? { ...j, status: "in-progress" } : j
        );

        cookieStore.set("mock-jobs", JSON.stringify(currentJobs), {
          path: "/",
          maxAge: 86400,
        });
      }
    } catch (e) {
      return { error: "Không thể lưu trạng thái giả lập." };
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

      // 1. Cập nhật trạng thái Proposal
      const { error: propError } = await supabase
        .from("proposals")
        .update({ status: newStatus })
        .eq("id", proposalId);

      if (propError) {
        return { error: `Không thể cập nhật báo giá: ${propError.message}` };
      }

      // 2. Nếu chấp nhận -> Cập nhật trạng thái Job sang 'in-progress'
      if (newStatus === "accepted") {
        const { error: jobError } = await supabase
          .from("jobs")
          .update({ status: "in-progress" })
          .eq("id", jobId);

        if (jobError) {
          return { error: `Đã chấp nhận báo giá nhưng lỗi cập nhật trạng thái dự án: ${jobError.message}` };
        }

        // Tự động từ chối (reject) tất cả các báo giá còn lại cho công việc này
        await supabase
          .from("proposals")
          .update({ status: "rejected" })
          .eq("job_id", jobId)
          .neq("id", proposalId)
          .eq("status", "pending");
      }
    } catch (e) {
      return { error: "Lỗi kết nối máy chủ Supabase." };
    }
  }

  // Làm mới cache các route
  revalidatePath("/creator");
  revalidatePath("/creator/jobs");

  return { success: true };
}
