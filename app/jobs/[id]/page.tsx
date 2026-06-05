// app/jobs/[id]/page.tsx
// Server Page hiển thị chi tiết dự án tuyển dụng và cho phép gửi báo giá ứng tuyển

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import JobDetailView from "@/components/dashboard/job-detail-view";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function JobDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();
  
  // 1. Kiểm tra session và vai trò người dùng
  const { data: { user } } = await supabase.auth.getUser();
  
  const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || id.startsWith("mock-");

  let jobData: any = null;
  let userRole: string | null = null;
  let existingProposal: any = null;

  if (isMock) {
    // ----------------------------------------------------
    // CHẾ ĐỘ GIẢ LẬP (OFFLINE MOCK DATA)
    // ----------------------------------------------------
    try {
      const cookieStore = await cookies();
      
      // Đọc vai trò người dùng giả lập
      const mockSession = cookieStore.get("mock-session");
      if (mockSession && mockSession.value) {
        try {
          const sessionData = JSON.parse(mockSession.value);
          userRole = sessionData.role;
        } catch (e) {}
      }

      // Đọc công việc từ mock-jobs cookie
      const mockJobsCookie = cookieStore.get("mock-jobs");
      let allJobs = [];
      if (mockJobsCookie && mockJobsCookie.value) {
        allJobs = JSON.parse(mockJobsCookie.value);
      } else {
        allJobs = [
          {
            id: "mock-job-1",
            title: "Cần Video Editor chuyên nghiệp dựng Video Shorts công nghệ",
            category: "video-edit",
            budget_amount: 1500000,
            budget_type: "fixed",
            description: "Dự án dựng video shorts review iPhone 15 Pro Max thời lượng 45 giây. Yêu cầu phong cách nhanh, dồn dập (style Alex Hormozi), chèn sound effects công nghệ chân thực, zoom chuyển cảnh giật gân. Cần hoàn thành trước ngày thứ Hai tới. Đã có sẵn file lồng tiếng (Voiceover) chất lượng cao.",
            status: "open",
            created_at: "2 giờ trước",
          },
          {
            id: "mock-job-2",
            title: "Viết kịch bản phim hoạt hình ngắn 2D (Thời lượng 5 phút)",
            category: "script",
            budget_amount: 3500000,
            budget_type: "fixed",
            description: "Cần tìm biên kịch sáng tạo kịch bản 2D câu chuyện gia đình cảm động. Yêu cầu kịch bản phân cảnh chi tiết, có hội thoại tự nhiên, có thông điệp sâu sắc.",
            status: "in-progress",
            created_at: "1 ngày trước",
          },
          {
            id: "mock-job-3",
            title: "Thiết kế bộ Thumbnail bắt mắt cho kênh Vlog ẩm thực du lịch",
            category: "thumbnail",
            budget_amount: 1200000,
            budget_type: "fixed",
            description: "Cần thiết kế 3 thumbnail cho các vlog ẩm thực tại TP.HCM. Yêu cầu ảnh ghép biểu cảm ngạc nhiên rõ nét, chữ tiêu đề ngắn gọn (khoảng 3 từ), màu sắc rực rỡ thu hút click chuột.",
            status: "completed",
            created_at: "5 ngày trước",
          },
        ];
      }

      jobData = allJobs.find((j: any) => j.id === id);

      if (!jobData) {
        notFound();
      }

      // Đọc báo giá xem freelancer đã ứng tuyển chưa
      const mockPropsCookie = cookieStore.get("mock-proposals");
      if (mockPropsCookie && mockPropsCookie.value) {
        try {
          const allProps = JSON.parse(mockPropsCookie.value);
          const found = allProps.find((p: any) => p.job_id === id);
          if (found) {
            existingProposal = {
              id: found.id,
              bid_amount: Number(found.bid_amount),
              cover_letter: found.cover_letter,
              status: found.status,
            };
          }
        } catch (e) {}
      }

    } catch (e) {
      console.error("Lỗi mock data", e);
    }
  } else {
    // ----------------------------------------------------
    // CHẾ ĐỘ DATABASE THỰC TẾ (SUPABASE)
    // ----------------------------------------------------
    try {
      // 1. Lấy vai trò user thực tế
      if (user) {
        userRole = user.user_metadata?.role || "creator";
      }

      // 2. Lấy thông tin công việc tuyển dụng
      const { data: job, error: jobError } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", id)
        .single();

      if (jobError || !job) {
        notFound();
      }

      jobData = {
        id: job.id,
        title: job.title,
        category: job.category,
        budget_amount: Number(job.budget_amount),
        budget_type: job.budget_type,
        description: job.description,
        status: job.status,
        created_at: new Date(job.created_at).toLocaleDateString("vi-VN"),
      };

      // 3. Nếu là Freelancer đã đăng nhập, kiểm tra xem đã ứng tuyển dự án này chưa
      if (user && userRole === "freelancer") {
        const { data: proposal } = await supabase
          .from("proposals")
          .select("id, bid_amount, cover_letter, status")
          .eq("job_id", id)
          .eq("freelancer_id", user.id)
          .maybeSingle();

        if (proposal) {
          existingProposal = {
            id: proposal.id,
            bid_amount: Number(proposal.bid_amount),
            cover_letter: proposal.cover_letter,
            status: proposal.status,
          };
        }
      }
    } catch (e) {
      console.error("Lỗi kết nối Supabase:", e);
      notFound();
    }
  }

  return (
    <JobDetailView
      job={jobData}
      userRole={userRole}
      existingProposal={existingProposal}
    />
  );
}
