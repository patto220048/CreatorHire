"use client";

import { useState } from "react";
import Link from "next/link";
import { formatVND, formatRelativeTime } from "@/lib/utils";

interface Job {
  id: string;
  title: string;
  creatorName: string;
  creatorAvatar: string;
  category: "video-edit" | "script" | "thumbnail" | "other";
  budgetType: "fixed" | "hourly";
  budgetAmount: number;
  description: string;
  skillsRequired: string[];
  createdAt: string;
  proposalsCount: number;
}

const mockJobs: Job[] = [
  {
    id: "job-1",
    title: "Cần tìm Video Editor dựng Reels/TikTok Shorts thời lượng 30s-60s",
    creatorName: "Kênh Youtube MixiTech",
    creatorAvatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80",
    category: "video-edit",
    budgetType: "fixed",
    budgetAmount: 300000,
    description: "Cần tìm editor lâu dài dựng các video ngắn công nghệ dạng tin tức ngắn. Phong cách dựng nhanh, cuốn hút, chèn hiệu ứng âm thanh sống động, vietsub đầy đủ. Mỗi tuần 5-7 video.",
    skillsRequired: ["Premiere Pro", "CapCut", "Video Shorts", "Sound Design"],
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(), // 3 hours ago
    proposalsCount: 8,
  },
  {
    id: "job-2",
    title: "Tuyển người viết kịch bản phim tài liệu lịch sử ngắn (10 phút)",
    creatorName: "Sử Việt Channel",
    creatorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80",
    category: "script",
    budgetType: "fixed",
    budgetAmount: 1500000,
    description: "Cần biên kịch có khả năng nghiên cứu lịch sử tốt, hành văn kể chuyện hấp dẫn, kịch tính để viết kịch bản phân cảnh cho video tài liệu 10 phút. Đề tài: Trận Bạch Đằng năm 938.",
    skillsRequired: ["Storytelling", "Research", "Historical Script", "Scriptwriting"],
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(), // 8 hours ago
    proposalsCount: 4,
  },
  {
    id: "job-3",
    title: "Thiết kế Thumbnail YouTube phong cách 3D/Gaming độc đáo",
    creatorName: "Lân Gaming Vlog",
    creatorAvatar: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=100&auto=format&fit=crop&q=80",
    category: "thumbnail",
    budgetType: "fixed",
    budgetAmount: 250000,
    description: "Cần tìm designer vẽ/thiết kế thumbnail cho chuỗi video Minecraft sinh tồn mới. Yêu cầu phối màu nổi bật, bố cục tốt để đẩy CTR click. Có file PSD gốc để kiểm tra.",
    skillsRequired: ["Photoshop", "3D Render", "YouTube Thumbnail"],
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
    proposalsCount: 15,
  },
  {
    id: "job-4",
    title: "Edit Video Vlog Du Lịch trải nghiệm 4K (Thực hiện trong 3 ngày)",
    creatorName: "Hằng Đi Muôn Nơi",
    creatorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
    category: "video-edit",
    budgetType: "fixed",
    budgetAmount: 2500000,
    description: "Yêu cầu editor có kinh nghiệm dựng vlog, xử lý màu Log mượt mà, chuyển cảnh nghệ thuật (cinematic). Source quay bằng Sony A7SIII. Thời lượng sản phẩm cuối tầm 8 phút.",
    skillsRequired: ["DaVinci Resolve", "Color Grading", "Cinematic Transitions"],
    createdAt: new Date(Date.now() - 3600000 * 30).toISOString(),
    proposalsCount: 6,
  }
];

export default function JobsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  const filteredJobs = mockJobs.filter((job) => {
    const matchesCat = selectedCategory === "all" || job.category === selectedCategory;
    const matchesSearch = job.title.toLowerCase().includes(search.toLowerCase()) ||
                          job.description.toLowerCase().includes(search.toLowerCase()) ||
                          job.skillsRequired.some(s => s.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="flex flex-col min-h-screen bg-canvas font-sans">
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-canvas/85 backdrop-blur-md border-b border-hairline-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold tracking-wider text-ink">
              creator<span className="text-brand-green">hire.</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/jobs" className="text-sm font-semibold text-ink">
                Tìm công việc
              </Link>
              <Link href="/freelancers" className="text-sm font-medium text-steel hover:text-ink transition-colors">
                Tìm Freelancer
              </Link>
              <Link href="/pricing" className="text-sm font-medium text-steel hover:text-ink transition-colors">
                Bảng giá
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-sm font-medium text-charcoal hover:bg-surface rounded-full transition-colors">
              Đăng nhập
            </Link>
            <Link href="/register" className="px-4 py-2 text-sm font-medium bg-ink text-on-dark rounded-full hover:bg-charcoal transition-colors">
              Đăng ký
            </Link>
          </div>
        </div>
      </header>

      {/* Title & Filter Header */}
      <section className="bg-surface py-12 border-b border-hairline">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl font-semibold text-ink mb-3" style={{ letterSpacing: "-0.5px" }}>
            Danh sách công việc đang tuyển dụng
          </h1>
          <p className="text-sm text-slate mb-8">
            Tìm kiếm dự án phù hợp với năng lực biên kịch, dựng phim và thiết kế của bạn. Nhận thanh toán an toàn.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Tìm theo từ khóa (Premiere, Vlog, Shorts...)"
              className="flex-1 h-10 px-4 py-2 bg-canvas border border-hairline rounded-md text-sm focus:border-brand-green focus:outline-none transition-colors"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="h-10 px-3 bg-canvas border border-hairline rounded-md text-sm focus:border-brand-green focus:outline-none text-steel"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">Tất cả chuyên mục</option>
              <option value="video-edit">🎥 Video Editing / Motion</option>
              <option value="script">✍️ Biên kịch / Viết kịch bản</option>
              <option value="thumbnail">🖼️ Thiết kế Thumbnail</option>
            </select>
          </div>
        </div>
      </section>

      {/* Jobs Listing */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex-1 w-full">
        <div className="space-y-6">
          {filteredJobs.length > 0 ? (
            filteredJobs.map((job) => (
              <div
                key={job.id}
                className="bg-canvas border border-hairline rounded-lg p-6 shadow-sm hover:shadow-md hover:border-hairline transition-all flex flex-col md:flex-row justify-between gap-6"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={job.creatorAvatar}
                      alt={job.creatorName}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                    <span className="text-xs text-steel font-medium">{job.creatorName}</span>
                    <span className="text-[10px] text-stone">•</span>
                    <span className="text-[11px] text-stone font-mono">{formatRelativeTime(job.createdAt)}</span>
                  </div>

                  <h2 className="text-lg font-semibold text-ink mb-2 hover:text-brand-green transition-colors">
                    <Link href={`/jobs/${job.id}`}>{job.title}</Link>
                  </h2>

                  <p className="text-xs text-slate line-clamp-3 mb-4 leading-relaxed">
                    {job.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {job.skillsRequired.map((skill, idx) => (
                      <span
                        key={idx}
                        className="bg-surface text-steel text-[10px] font-mono px-2 py-0.5 rounded-sm border border-hairline-soft"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Left Side Budget and Apply CTA */}
                <div className="flex flex-col justify-between items-start md:items-end min-w-[160px] border-t md:border-t-0 md:border-l border-hairline pt-4 md:pt-0 md:pl-6">
                  <div className="mb-4 md:text-right">
                    <p className="text-xs text-steel">Ngân sách dự kiến</p>
                    <p className="text-base font-bold text-ink">{formatVND(job.budgetAmount)}</p>
                    <p className="text-[10px] text-stone mt-1">{job.proposalsCount} báo giá đã nhận</p>
                  </div>

                  <Link
                    href={`/jobs/${job.id}`}
                    className="w-full md:w-auto px-5 py-2 text-center text-xs font-semibold bg-ink text-on-dark rounded-full hover:bg-charcoal transition-colors whitespace-nowrap"
                  >
                    Gửi Báo Giá
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 bg-surface border border-hairline rounded-lg">
              <p className="text-sm text-steel">Không tìm thấy tin tuyển dụng nào phù hợp.</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-canvas border-t border-hairline py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-steel">
          <p>© {new Date().getFullYear()} CreatorHire. Phát triển và tối ưu cho Creator Việt Nam.</p>
        </div>
      </footer>
    </div>
  );
}
