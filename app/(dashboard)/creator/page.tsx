// app/(dashboard)/creator/page.tsx
// Server Component cho trang Tổng quan Dashboard Creator

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import CreatorOverview from "@/components/dashboard/creator-overview";

export default async function CreatorDashboard() {
  const supabase = await getSupabaseServerClient();
  
  // 1. Kiểm tra session
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || "mock-user-123";

  // Check if we are running in Mock Mode
  const cookieStore = await cookies();
  const mockSession = cookieStore.get("mock-session");
  const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || (mockSession && mockSession.value);

  let dbJobs: any[] = [];
  let dbProposals: any[] = [];
  let stats = {
    totalJobs: 0,
    pendingProposals: 0,
    escrowAmount: 0,
    activeContracts: 0,
  };

  if (isMock) {
    // ----------------------------------------------------
    // CHẾ ĐỘ GIẢ LẬP (OFFLINE MOCK DATA)
    // ----------------------------------------------------
    let customJobs: any[] = [];
    try {
      const cookieStore = await cookies();
      const mockJobsCookie = cookieStore.get("mock-jobs");
      if (mockJobsCookie && mockJobsCookie.value) {
        customJobs = JSON.parse(mockJobsCookie.value);
      }
    } catch (e) {
      console.warn("Không đọc được mock-jobs cookie", e);
    }

    const defaultJobs = [
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

    if (customJobs.length > 0) {
      dbJobs = customJobs;
    } else {
      dbJobs = defaultJobs;
    }

    try {
      const cookieStore = await cookies();
      const mockPropsCookie = cookieStore.get("mock-proposals");
      if (mockPropsCookie && mockPropsCookie.value) {
        dbProposals = JSON.parse(mockPropsCookie.value);
      } else {
        dbProposals = [
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
    } catch (e) {
      console.warn("Không đọc được mock-proposals cookie", e);
    }

    const openJobs = dbJobs.filter(j => j.status === "open");
    const activeJobs = dbJobs.filter(j => j.status === "in-progress");
    const pendingProps = dbProposals.filter((p: any) => p.status === "pending");

    // Lọc chỉ hiển thị các báo giá đang pending lên dashboard chính
    dbProposals = pendingProps;

    stats = {
      totalJobs: openJobs.length,
      pendingProposals: pendingProps.length,
      escrowAmount: activeJobs.reduce((acc, curr) => acc + Number(curr.budget_amount), 0),
      activeContracts: activeJobs.length,
    };
  } else {
    // ----------------------------------------------------
    // CHẾ ĐỘ KẾT NỐI DATABASE THỰC TẾ (SUPABASE)
    // ----------------------------------------------------
    try {
      // Lấy toàn bộ Jobs của Creator này
      const { data: jobs, error: jobsError } = await supabase
        .from("jobs")
        .select("*")
        .eq("creator_id", userId)
        .order("created_at", { ascending: false });

      if (jobs && !jobsError) {
        // Lấy số lượng proposals cho mỗi Job
        const jobsList = await Promise.all(
          jobs.map(async (job: any) => {
            const { count } = await supabase
              .from("proposals")
              .select("*", { count: "exact", head: true })
              .eq("job_id", job.id);
            return {
              ...job,
              proposals_count: count || 0,
            };
          })
        );
        dbJobs = jobsList;

        // Tính toán các chỉ số thống kê
        const openJobs = dbJobs.filter((j: any) => j.status === "open");
        const activeJobs = dbJobs.filter((j: any) => j.status === "in-progress");
        
        stats.totalJobs = openJobs.length;
        stats.activeContracts = activeJobs.length;
        
        // Ngân sách tạm giữ (Escrow) = Tổng ngân sách của các Job đang in-progress
        stats.escrowAmount = activeJobs.reduce((acc: number, curr: any) => acc + Number(curr.budget_amount), 0);

        // Lấy các Proposals ứng tuyển vào các Job của Creator này
        const jobIds = dbJobs.map((j: any) => j.id);
        if (jobIds.length > 0) {
          const { data: proposals, error: propError } = await supabase
            .from("proposals")
            .select(`
              id,
              cover_letter,
              bid_amount,
              status,
              created_at,
              freelancer_id,
              job_id
            `)
            .in("job_id", jobIds)
            .order("created_at", { ascending: false });

          if (proposals && !propError) {
            // Lấy thông tin Freelancer Profile của mỗi Proposal
            const enrichedProps = await Promise.all(
              proposals.map(async (prop: any) => {
                const { data: profile } = await supabase
                  .from("profiles")
                  .select("full_name")
                  .eq("id", prop.freelancer_id)
                  .single();

                const job = dbJobs.find((j: any) => j.id === prop.job_id);

                return {
                  id: prop.id,
                  job_title: job ? job.title : "Dự án ẩn",
                  freelancer_name: profile ? profile.full_name : "Freelancer ẩn",
                  bid_amount: Number(prop.bid_amount),
                  cover_letter: prop.cover_letter,
                  status: prop.status,
                  created_at: new Date(prop.created_at).toLocaleDateString("vi-VN"),
                };
              })
            );

            // Chỉ hiển thị báo giá đang chờ duyệt lên màn hình dashboard chính
            dbProposals = enrichedProps.filter((p: any) => p.status === "pending");
            stats.pendingProposals = enrichedProps.filter((p: any) => p.status === "pending").length;
          }
        }
      }
    } catch (e) {
      console.error("Lỗi truy vấn dữ liệu từ Supabase:", e);
    }
  }

  return (
    <CreatorOverview
      jobs={dbJobs}
      proposals={dbProposals}
      stats={stats}
    />
  );
}
