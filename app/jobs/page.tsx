"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatVND, formatRelativeTime } from "@/lib/utils";
import Navbar from "@/components/navbar";

interface Job {
  id: string;
  title: string;
  creatorName?: string;
  creator_name?: string;
  creatorAvatar?: string;
  creator_avatar?: string;
  category: "video-edit" | "script" | "thumbnail" | "other" | string;
  budgetType?: "fixed" | "hourly" | string;
  budget_type?: string;
  budgetAmount?: number;
  budget_amount?: number;
  description: string;
  skillsRequired?: string[];
  skills_required?: string[];
  createdAt?: string;
  created_at?: string;
  proposalsCount?: number;
  proposals_count?: number;
}

const defaultJobs: Job[] = [
  {
    id: "mock-job-1",
    title: "Cần Video Editor chuyên nghiệp dựng Video Shorts công nghệ",
    creatorName: "Kênh Youtube MixiTech",
    creator_name: "Kênh Youtube MixiTech",
    creatorAvatar: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%2300d4a4'/><text x='50' y='58' font-family='sans-serif' font-size='32' font-weight='bold' fill='%230a0a0a' text-anchor='middle'>MT</text></svg>",
    creator_avatar: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%2300d4a4'/><text x='50' y='58' font-family='sans-serif' font-size='32' font-weight='bold' fill='%230a0a0a' text-anchor='middle'>MT</text></svg>",
    category: "video-edit",
    budgetType: "fixed",
    budget_type: "fixed",
    budgetAmount: 1500000,
    budget_amount: 1500000,
    description: "Dự án dựng video shorts review iPhone 15 Pro Max thời lượng 45 giây. Yêu cầu phong cách nhanh, dồn dập (style Alex Hormozi), chèn sound effects công nghệ chân thực, zoom chuyển cảnh giật gân. Cần hoàn thành trước ngày thứ Hai tới. Đã có sẵn file lồng tiếng (Voiceover) chất lượng cao.",
    skillsRequired: ["Premiere Pro", "CapCut", "Video Shorts", "Sound Design"],
    skills_required: ["Premiere Pro", "CapCut", "Video Shorts", "Sound Design"],
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    proposalsCount: 2,
    proposals_count: 2,
  },
  {
    id: "mock-job-2",
    title: "Viết kịch bản phim hoạt hình ngắn 2D (Thời lượng 5 phút)",
    creatorName: "Sử Việt Channel",
    creator_name: "Sử Việt Channel",
    creatorAvatar: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%233772cf'/><text x='50' y='58' font-family='sans-serif' font-size='32' font-weight='bold' fill='%23ffffff' text-anchor='middle'>SV</text></svg>",
    creator_avatar: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%233772cf'/><text x='50' y='58' font-family='sans-serif' font-size='32' font-weight='bold' fill='%23ffffff' text-anchor='middle'>SV</text></svg>",
    category: "script",
    budgetType: "fixed",
    budget_type: "fixed",
    budgetAmount: 3500000,
    budget_amount: 3500000,
    description: "Cần tìm biên kịch sáng tạo kịch bản 2D câu chuyện gia đình cảm động. Yêu cầu kịch bản phân cảnh chi tiết, có hội thoại tự nhiên, có thông điệp sâu sắc.",
    skillsRequired: ["Storytelling", "Research", "Historical Script", "Scriptwriting"],
    skills_required: ["Storytelling", "Research", "Historical Script", "Scriptwriting"],
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    proposalsCount: 1,
    proposals_count: 1,
  },
  {
    id: "mock-job-3",
    title: "Thiết kế bộ Thumbnail bắt mắt cho kênh Vlog ẩm thực du lịch",
    creatorName: "Lân Gaming Vlog",
    creator_name: "Lân Gaming Vlog",
    creatorAvatar: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23f55a3c'/><text x='50' y='58' font-family='sans-serif' font-size='32' font-weight='bold' fill='%23ffffff' text-anchor='middle'>LG</text></svg>",
    creator_avatar: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23f55a3c'/><text x='50' y='58' font-family='sans-serif' font-size='32' font-weight='bold' fill='%23ffffff' text-anchor='middle'>LG</text></svg>",
    category: "thumbnail",
    budgetType: "fixed",
    budget_type: "fixed",
    budgetAmount: 1200000,
    budget_amount: 1200000,
    description: "Cần thiết kế 3 thumbnail cho các vlog ẩm thực tại TP.HCM. Yêu cầu ảnh ghép biểu cảm ngạc nhiên rõ nét, chữ tiêu đề ngắn gọn (khoảng 3 từ), màu sắc rực rỡ thu hút click chuột.",
    skillsRequired: ["Photoshop", "3D Render", "YouTube Thumbnail"],
    skills_required: ["Photoshop", "3D Render", "YouTube Thumbnail"],
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    proposalsCount: 3,
    proposals_count: 3,
  }
];

export default function JobsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    const getCookie = (name: string) => {
      if (typeof document === "undefined") return null;
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
      return null;
    };

    const mockJobsCookie = getCookie("mock-jobs");
    if (mockJobsCookie) {
      try {
        setJobs(JSON.parse(decodeURIComponent(mockJobsCookie)));
      } catch (e) {
        setJobs(defaultJobs);
      }
    } else {
      setJobs(defaultJobs);
    }
  }, []);

  const filteredJobs = jobs.filter((job) => {
    const matchesCat = selectedCategory === "all" || job.category === selectedCategory;
    const matchesSearch = job.title.toLowerCase().includes(search.toLowerCase()) ||
                          (job.description || "").toLowerCase().includes(search.toLowerCase()) ||
                          (job.skillsRequired || job.skills_required || []).some(s => s.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="flex flex-col min-h-screen bg-canvas font-sans">
      {/* Navigation */}
      <Navbar />

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
                      src={job.creatorAvatar || job.creator_avatar || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%2300d4a4'/><text x='50' y='58' font-family='sans-serif' font-size='32' font-weight='bold' fill='%230a0a0a' text-anchor='middle'>MT</text></svg>"}
                      alt={job.creatorName || job.creator_name || "Nhà sáng tạo"}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                    <span className="text-xs text-steel font-medium">{job.creatorName || job.creator_name || "Nhà sáng tạo"}</span>
                    <span className="text-[10px] text-stone">•</span>
                    <span className="text-[11px] text-stone font-mono">{formatRelativeTime(job.createdAt || job.created_at || "")}</span>
                  </div>

                  <h2 className="text-lg font-semibold text-ink mb-2 hover:text-brand-green transition-colors">
                    <Link href={`/jobs/${job.id}`}>{job.title}</Link>
                  </h2>

                  <p className="text-xs text-slate line-clamp-3 mb-4 leading-relaxed">
                    {job.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {(job.skillsRequired || job.skills_required || []).map((skill, idx) => (
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
                    <p className="text-base font-bold text-ink">{formatVND(job.budgetAmount || job.budget_amount || 0)}</p>
                    <p className="text-[10px] text-stone mt-1">{(job.proposalsCount !== undefined ? job.proposalsCount : job.proposals_count) || 0} báo giá đã nhận</p>
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

