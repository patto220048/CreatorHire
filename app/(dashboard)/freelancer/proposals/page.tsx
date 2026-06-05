// app/(dashboard)/freelancer/proposals/page.tsx
// Server Page hiển thị danh sách báo giá của Freelancer

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import FreelancerProposals from "@/components/dashboard/freelancer-proposals";

export default async function FreelancerProposalsPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || "mock-user-123";

  // Check if we are running in Mock Mode
  const cookieStore = await cookies();
  const mockSession = cookieStore.get("mock-session");
  const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || (mockSession && mockSession.value);

  let dbProposals: any[] = [];

  if (isMock) {
    // ----------------------------------------------------
    // CHẾ ĐỘ GIẢ LẬP (OFFLINE MOCK DATA)
    // ----------------------------------------------------
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
            bid_amount: 1400000,
            cover_letter: "Mình có 2 năm kinh nghiệm dựng shorts, đã edit cho 3 kênh công nghệ đạt 100k sub. Mình dùng Premiere Pro và After Effects, cam kết bàn giao đúng hạn. Có thể tinh chỉnh edit nhịp nhàng theo ý bạn mong muốn.",
            status: "pending",
            created_at: "1 giờ trước",
          },
          {
            id: "mock-prop-2",
            job_id: "mock-job-1",
            job_title: "Cần Video Editor chuyên nghiệp dựng Video Shorts công nghệ",
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
      const { data: proposals, error: propError } = await supabase
        .from("proposals")
        .select("*")
        .eq("freelancer_id", userId)
        .order("created_at", { ascending: false });

      if (proposals && !propError) {
        const enrichedProps = await Promise.all(
          proposals.map(async (prop: any) => {
            const { data: job } = await supabase
              .from("jobs")
              .select("title")
              .eq("id", prop.job_id)
              .single();

            return {
              id: prop.id,
              job_id: prop.job_id,
              job_title: job ? job.title : "Dự án ẩn",
              bid_amount: Number(prop.bid_amount),
              cover_letter: prop.cover_letter,
              status: prop.status,
              created_at: new Date(prop.created_at).toLocaleDateString("vi-VN"),
            };
          })
        );
        dbProposals = enrichedProps;
      }
    } catch (e) {
      console.error("Lỗi truy vấn dữ liệu từ Supabase:", e);
    }
  }

  return <FreelancerProposals proposals={dbProposals} />;
}
