// app/(dashboard)/freelancer/page.tsx
// Server Page hiển thị Bảng điều khiển Tổng quan dành cho Freelancer

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import FreelancerOverview from "@/components/dashboard/freelancer-overview";

export default async function FreelancerDashboard() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || "mock-user-123";

  // Check if we are running in Mock Mode
  const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let activeJobs: any[] = [];
  let freelancerProps: any[] = [];
  let stats = {
    activeJobsCount: 0,
    totalEarnings: 0,
    proposalsSent: 0,
    pendingProposals: 0,
  };

  if (isMock) {
    // ----------------------------------------------------
    // CHẾ ĐỘ GIẢ LẬP (OFFLINE MOCK DATA)
    // ----------------------------------------------------
    try {
      const cookieStore = await cookies();
      
      // 1. Đọc các Proposal giả lập từ cookie, nếu chưa có thì nạp mặc định
      const mockPropsCookie = cookieStore.get("mock-proposals");
      let allProps: any[] = [];
      if (mockPropsCookie && mockPropsCookie.value) {
        allProps = JSON.parse(mockPropsCookie.value);
      } else {
        allProps = [
          {
            id: "mock-prop-1",
            job_id: "mock-job-1",
            job_title: "Cần Video Editor chuyên nghiệp dựng Video Shorts công nghệ",
            freelancer_name: "Hoàng Minh (Editor)",
            bid_amount: 1400000,
            cover_letter: "Mình có 2 năm kinh nghiệm dựng shorts, đã edit cho 3 kênh công nghệ đạt 100k sub...",
            status: "pending",
            created_at: "1 giờ trước",
          },
          {
            id: "mock-prop-2",
            job_id: "mock-job-1",
            freelancer_name: "Nguyễn Thảo (Editor)",
            bid_amount: 1500000,
            cover_letter: "Hi, mình có sẵn kho template chuyển cảnh công nghệ cao cấp...",
            status: "pending",
            created_at: "3 giờ trước",
          },
        ];
      }

      // Giả lập rằng toàn bộ các proposal trong cookie là của freelancer hiện tại đang đăng nhập
      freelancerProps = allProps;

      // 2. Đọc các Job giả lập từ cookie
      const mockJobsCookie = cookieStore.get("mock-jobs");
      let allJobs: any[] = [];
      if (mockJobsCookie && mockJobsCookie.value) {
        allJobs = JSON.parse(mockJobsCookie.value);
      } else {
        allJobs = [
          {
            id: "mock-job-1",
            title: "Cần Video Editor chuyên nghiệp dựng Video Shorts công nghệ",
            category: "video-edit",
            budget_amount: 1500000,
            status: "open",
            created_at: "2 giờ trước",
          },
          {
            id: "mock-job-2",
            title: "Viết kịch bản phim hoạt hình ngắn 2D (Thời lượng 5 phút)",
            category: "script",
            budget_amount: 3500000,
            status: "in-progress",
            created_at: "1 ngày trước",
          },
          {
            id: "mock-job-3",
            title: "Thiết kế bộ Thumbnail bắt mắt cho kênh Vlog ẩm thực du lịch",
            category: "thumbnail",
            budget_amount: 1200000,
            status: "completed",
            created_at: "5 ngày trước",
          },
        ];
      }

      // Lọc các job đang làm việc (status = in-progress) và mình đã ứng tuyển được nhận (accepted)
      // Trong mock mode, ta coi job-2 đã được freelancer này nhận
      activeJobs = allJobs.filter((job) => job.status === "in-progress");
      
      const acceptedProps = freelancerProps.filter((p) => p.status === "accepted");
      const pendingProps = freelancerProps.filter((p) => p.status === "pending");

      stats = {
        activeJobsCount: activeJobs.length,
        // Thu nhập tích lũy = Tổng tiền các proposal đã được duyệt
        totalEarnings: acceptedProps.reduce((acc, curr) => acc + Number(curr.bid_amount), 0) + (activeJobs.length > 0 ? 3500000 : 0),
        proposalsSent: freelancerProps.length,
        pendingProposals: pendingProps.length,
      };

    } catch (e) {
      console.error("Lỗi đọc cookie giả lập", e);
    }
  } else {
    // ----------------------------------------------------
    // CHẾ ĐỘ DATABASE THỰC TẾ (SUPABASE)
    // ----------------------------------------------------
    try {
      // 1. Lấy toàn bộ Proposals của Freelancer này
      const { data: proposals, error: propError } = await supabase
        .from("proposals")
        .select("*")
        .eq("freelancer_id", userId)
        .order("created_at", { ascending: false });

      if (proposals && !propError) {
        // Làm giàu thông tin Job Title cho mỗi Proposal
        const enrichedProps = await Promise.all(
          proposals.map(async (prop: any) => {
            const { data: job } = await supabase
              .from("jobs")
              .select("title")
              .eq("id", prop.job_id)
              .single();

            return {
              id: prop.id,
              job_title: job ? job.title : "Dự án ẩn",
              bid_amount: Number(prop.bid_amount),
              status: prop.status,
              created_at: new Date(prop.created_at).toLocaleDateString("vi-VN"),
            };
          })
        );
        freelancerProps = enrichedProps;

        // 2. Lấy các Job mà mình đã ứng tuyển thành công (proposal status = 'accepted' và job status = 'in-progress')
        const acceptedJobIds = proposals
          .filter((p: any) => p.status === "accepted")
          .map((p: any) => p.job_id);

        if (acceptedJobIds.length > 0) {
          const { data: jobs, error: jobsError } = await supabase
            .from("jobs")
            .select("*")
            .in("id", acceptedJobIds)
            .eq("status", "in-progress");

          if (jobs && !jobsError) {
            activeJobs = jobs;
          }
        }

        // Tính toán các chỉ số thống kê
        const accepted = proposals.filter((p: any) => p.status === "accepted");
        const pending = proposals.filter((p: any) => p.status === "pending");

        stats = {
          activeJobsCount: activeJobs.length,
          totalEarnings: accepted.reduce((acc: number, curr: any) => acc + Number(curr.bid_amount), 0),
          proposalsSent: proposals.length,
          pendingProposals: pending.length,
        };
      }
    } catch (e) {
      console.error("Lỗi kết nối Supabase:", e);
    }
  }

  return (
    <FreelancerOverview
      activeJobs={activeJobs}
      proposals={freelancerProps}
      stats={stats}
    />
  );
}
