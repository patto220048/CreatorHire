// app/(dashboard)/creator/jobs/page.tsx
// Server Page hiển thị danh sách dự án và duyệt các báo giá cho Creator

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import CreatorJobsList from "@/components/dashboard/creator-jobs-list";

export default async function CreatorJobsPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || "mock-user-123";

  // Check if we are running in Mock Mode
  const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let dbJobs: any[] = [];
  let dbProposals: any[] = [];

  if (isMock) {
    // ----------------------------------------------------
    // CHẾ ĐỘ GIẢ LẬP (OFFLINE MOCK DATA)
    // ----------------------------------------------------
    try {
      const cookieStore = await cookies();
      
      // Đọc các Job giả lập từ cookie, nếu chưa có thì nạp mặc định
      const mockJobsCookie = cookieStore.get("mock-jobs");
      if (mockJobsCookie && mockJobsCookie.value) {
        dbJobs = JSON.parse(mockJobsCookie.value);
      } else {
        dbJobs = [
          {
            id: "mock-job-1",
            title: "Cần Video Editor chuyên nghiệp dựng Video Shorts công nghệ",
            category: "video-edit",
            budget_amount: 1500000,
            budget_type: "fixed",
            status: "open",
            created_at: "2 giờ trước",
          },
          {
            id: "mock-job-2",
            title: "Viết kịch bản phim hoạt hình ngắn 2D (Thời lượng 5 phút)",
            category: "script",
            budget_amount: 3500000,
            budget_type: "fixed",
            status: "in-progress",
            created_at: "1 ngày trước",
          },
          {
            id: "mock-job-3",
            title: "Thiết kế bộ Thumbnail bắt mắt cho kênh Vlog ẩm thực du lịch",
            category: "thumbnail",
            budget_amount: 1200000,
            budget_type: "fixed",
            status: "completed",
            created_at: "5 ngày trước",
          },
        ];
      }

      // Đọc các Proposal giả lập từ cookie, nếu chưa có thì nạp mặc định
      const mockPropsCookie = cookieStore.get("mock-proposals");
      if (mockPropsCookie && mockPropsCookie.value) {
        dbProposals = JSON.parse(mockPropsCookie.value);
      } else {
        dbProposals = [
          {
            id: "mock-prop-1",
            job_id: "mock-job-1",
            freelancer_name: "Hoàng Minh (Editor)",
            bid_amount: 1400000,
            cover_letter: "Mình có 2 năm kinh nghiệm dựng shorts, đã edit cho 3 kênh công nghệ đạt 100k sub. Mình dùng Premiere Pro và After Effects, cam kết bàn giao đúng hạn. Có thể tinh chỉnh edit nhịp nhàng theo ý bạn mong muốn.",
            status: "pending",
            created_at: "1 giờ trước",
          },
          {
            id: "mock-prop-2",
            job_id: "mock-job-1",
            freelancer_name: "Nguyễn Thảo (Editor)",
            bid_amount: 1500000,
            cover_letter: "Hi, mình có sẵn kho template chuyển cảnh công nghệ cao cấp. Mình sẽ dựng thử 1 video ngắn 15 giây đầu tiên miễn phí để bạn kiểm định chất lượng nhé! Mình có kỹ năng làm audio SFX công nghệ cực kỳ chân thực.",
            status: "pending",
            created_at: "3 giờ trước",
          },
        ];
      }
    } catch (e) {
      console.error("Lỗi đọc cookie giả lập", e);
    }
  } else {
    // ----------------------------------------------------
    // CHẾ ĐỘ DATABASE THỰC TẾ (SUPABASE)
    // ----------------------------------------------------
    try {
      // 1. Lấy toàn bộ công việc của Creator này
      const { data: jobs, error: jobsError } = await supabase
        .from("jobs")
        .select("*")
        .eq("creator_id", userId)
        .order("created_at", { ascending: false });

      if (jobs && !jobsError) {
        dbJobs = jobs;

        // 2. Lấy toàn bộ báo giá ứng tuyển vào các công việc này
        const jobIds = jobs.map((j: any) => j.id);
        if (jobIds.length > 0) {
          const { data: proposals, error: propError } = await supabase
            .from("proposals")
            .select("*")
            .in("job_id", jobIds)
            .order("created_at", { ascending: false });

          if (proposals && !propError) {
            // Làm giàu (enrich) thông tin tên Freelancer từ bảng profiles
            const enrichedProps = await Promise.all(
              proposals.map(async (prop: any) => {
                const { data: profile } = await supabase
                  .from("profiles")
                  .select("full_name")
                  .eq("id", prop.freelancer_id)
                  .single();

                return {
                  id: prop.id,
                  job_id: prop.job_id,
                  freelancer_name: profile ? profile.full_name : "Freelancer ẩn",
                  bid_amount: Number(prop.bid_amount),
                  cover_letter: prop.cover_letter,
                  status: prop.status,
                  created_at: new Date(prop.created_at).toLocaleDateString("vi-VN"),
                };
              })
            );
            dbProposals = enrichedProps;
          }
        }
      }
    } catch (e) {
      console.error("Lỗi truy vấn dữ liệu từ Supabase:", e);
    }
  }

  return <CreatorJobsList jobs={dbJobs} proposals={dbProposals} />;
}
