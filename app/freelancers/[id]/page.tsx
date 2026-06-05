// app/freelancers/[id]/page.tsx
// Client/Server Page hiển thị chi tiết hồ sơ Freelancer và gửi yêu cầu báo giá/hợp tác (Mock)

import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import FreelancerDetailView from "./freelancer-detail-view";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

const mockFreelancers = [
  {
    id: "fl-1",
    name: "Trần Minh Tuấn",
    role: "Video Editor",
    avatar: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%2300d4a4'/><text x='50' y='58' font-family='sans-serif' font-size='32' font-weight='bold' fill='%230a0a0a' text-anchor='middle'>MT</text></svg>",
    rating: 4.9,
    completedJobs: 84,
    skills: ["Premiere Pro", "After Effects", "Color Grading", "Gaming Video", "Vlog Edit"],
    bio: "Chuyên edit video YouTube, TikTok phong cách vlog năng động và gaming chuyên nghiệp. Đã làm việc với nhiều YouTuber trên 1M subscribers.",
    experience: "3 năm kinh nghiệm",
  },
  {
    id: "fl-2",
    name: "Lê Nguyễn Lan Anh",
    role: "Scriptwriter",
    avatar: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%233772cf'/><text x='50' y='58' font-family='sans-serif' font-size='32' font-weight='bold' fill='%23ffffff' text-anchor='middle'>LA</text></svg>",
    rating: 5.0,
    completedJobs: 52,
    skills: ["Storytelling", "Short-form Script", "Review Script", "SEO Content", "Comedy Script"],
    bio: "Viết kịch bản phóng sự, review sản phẩm và kịch bản TikTok Shorts triệu view. Tư vấn định hình hướng đi kênh thương hiệu cá nhân.",
    experience: "2 năm kinh nghiệm",
  },
  {
    id: "fl-3",
    name: "Hoàng Quốc Bảo",
    role: "Thumbnail Designer",
    avatar: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23f55a3c'/><text x='50' y='58' font-family='sans-serif' font-size='32' font-weight='bold' fill='%23ffffff' text-anchor='middle'>QB</text></svg>",
    rating: 4.8,
    completedJobs: 110,
    skills: ["Photoshop", "AI Gen Art", "3D Thumbnail", "CTR Optimization", "Illustrator"],
    bio: "Thiết kế thumbnail thu hút click (CTR cao) cho YouTube. Cam kết tăng tỷ lệ click-through rate ít nhất 5% sau khi thay đổi.",
    experience: "4 năm kinh nghiệm",
  },
  {
    id: "fl-4",
    name: "Phạm Hiếu Nghĩa",
    role: "Motion Designer",
    avatar: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%233a3a3c'/><text x='50' y='58' font-family='sans-serif' font-size='32' font-weight='bold' fill='%23ffffff' text-anchor='middle'>HN</text></svg>",
    rating: 4.9,
    completedJobs: 37,
    skills: ["After Effects", "Spline 3D", "Lottie Animation", "2D Animation", "Logo Intro"],
    bio: "Thiết kế Intro, Outro và hiệu ứng chuyển cảnh độc quyền cho các kênh YouTube công nghệ và tài chính.",
    experience: "2 năm kinh nghiệm",
  }
];

export default async function FreelancerDetailPage({ params }: PageProps) {
  const { id } = await params;
  const cookieStore = await cookies();

  // Đọc danh sách freelancers đã mở rộng (có cả mock profile tùy chỉnh nếu có)
  let freelancersList = [...mockFreelancers];
  const customProfileCookie = cookieStore.get("mock-profile");
  if (customProfileCookie && customProfileCookie.value) {
    try {
      const parsed = JSON.parse(decodeURIComponent(customProfileCookie.value));
      const idx = freelancersList.findIndex((f) => f.id === parsed.id);
      const mergedCustom = {
        id: parsed.id || "mock-user-123",
        name: parsed.name || "Hoàng Minh",
        role: parsed.role || "Video Editor",
        avatar: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%2300d4a4'/><text x='50' y='58' font-family='sans-serif' font-size='32' font-weight='bold' fill='%230a0a0a' text-anchor='middle'>HM</text></svg>",
        rating: 5.0,
        completedJobs: 4,
        skills: parsed.skills || [],
        bio: parsed.bio || "",
        experience: parsed.experience || "3 năm kinh nghiệm",
      };
      if (idx !== -1) {
        freelancersList[idx] = mergedCustom;
      } else {
        freelancersList = [mergedCustom, ...freelancersList];
      }
    } catch (e) {}
  }

  const freelancer = freelancersList.find((f) => f.id === id);
  if (!freelancer) {
    notFound();
  }

  // Đọc mock jobs của Creator để cho phép gửi lời mời nhận việc
  let creatorJobs: any[] = [];
  const mockJobsCookie = cookieStore.get("mock-jobs");
  if (mockJobsCookie && mockJobsCookie.value) {
    try {
      const allJobs = JSON.parse(mockJobsCookie.value);
      // Lọc các job đang ở trạng thái open của creator
      creatorJobs = allJobs.filter((j: any) => j.status === "open");
    } catch (e) {}
  } else {
    // Dự án mẫu mặc định
    creatorJobs = [
      { id: "mock-job-1", title: "Cần Video Editor chuyên nghiệp dựng Video Shorts công nghệ", budget_amount: 1500000 },
      { id: "mock-job-2", title: "Viết kịch bản phim hoạt hình ngắn 2D (Thời lượng 5 phút)", budget_amount: 3500000 },
    ];
  }

  // Đọc thông tin session hiện tại
  let currentRole: string | null = null;
  const mockSession = cookieStore.get("mock-session");
  if (mockSession && mockSession.value) {
    try {
      const sessionData = JSON.parse(decodeURIComponent(mockSession.value));
      currentRole = sessionData.role;
    } catch (e) {}
  }

  return (
    <FreelancerDetailView 
      freelancer={freelancer} 
      creatorJobs={creatorJobs} 
      currentRole={currentRole} 
    />
  );
}
