"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import Navbar from "@/components/navbar";

interface Freelancer {
  id: string;
  name: string;
  role: string;
  avatar: string;
  rating: number;
  completedJobs: number;
  skills: string[];
  bio: string;
  experience: string;
}

const mockFreelancers: Freelancer[] = [
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

export default function FreelancersPage() {
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [freelancers, setFreelancers] = useState<Freelancer[]>(mockFreelancers);
  const containerRef = useRef<HTMLDivElement>(null);

  // Helper đọc cookie ở client-side
  const getCookie = (name: string) => {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift();
    return null;
  };

  useEffect(() => {
    const profileCookie = getCookie("mock-profile");
    if (profileCookie) {
      try {
        const parsed = JSON.parse(decodeURIComponent(profileCookie));
        const mergedList = [
          {
            id: parsed.id || "mock-user-123",
            name: parsed.name || "Hoàng Minh",
            role: parsed.role || "Video Editor",
            avatar: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%2300d4a4'/><text x='50' y='58' font-family='sans-serif' font-size='32' font-weight='bold' fill='%230a0a0a' text-anchor='middle'>HM</text></svg>",
            rating: 5.0,
            completedJobs: 4,
            skills: parsed.skills || [],
            bio: parsed.bio || "",
            experience: parsed.experience || "3 năm kinh nghiệm",
          },
          ...mockFreelancers.filter((fl) => fl.id !== (parsed.id || "mock-user-123")),
        ];
        setFreelancers(mergedList);
      } catch (e) {
        console.error("Lỗi parse cookie profile:", e);
      }
    }
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const items = containerRef.current?.querySelectorAll(".freelancer-card");
      if (items && items.length > 0) {
        gsap.fromTo(
          items,
          { opacity: 0, y: 25 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: "power3.out" }
        );
      }
    }, containerRef);
    return () => ctx.revert();
  }, [freelancers]);

  const filteredFreelancers = freelancers.filter((fl) => {
    const matchesRole = selectedRole === "all" || fl.role.toLowerCase() === selectedRole.toLowerCase();
    const matchesSearch = fl.name.toLowerCase().includes(search.toLowerCase()) ||
                          fl.bio.toLowerCase().includes(search.toLowerCase()) ||
                          fl.skills.some(s => s.toLowerCase().includes(search.toLowerCase()));
    return matchesRole && matchesSearch;
  });

  return (
    <div className="flex flex-col min-h-screen bg-canvas font-sans">
      {/* Navigation */}
      <Navbar />

      {/* Hero Search Header */}
      <section className="bg-surface py-12 border-b border-hairline">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl font-semibold text-ink mb-3" style={{ letterSpacing: "-0.5px" }}>
            Tìm kiếm Freelancer chuyên nghiệp
          </h1>
          <p className="text-sm text-slate mb-8">
            Hợp tác cùng những tài năng hàng đầu để nâng tầm sản phẩm video, hình ảnh và kịch bản kênh của bạn.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Tìm theo kỹ năng, công cụ (After Effects, Storytelling...)"
              className="flex-1 h-10 px-4 py-2 bg-canvas border border-hairline rounded-md text-sm focus:border-brand-green focus:outline-none transition-colors"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="h-10 px-3 bg-canvas border border-hairline rounded-md text-sm focus:border-brand-green focus:outline-none text-steel"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="all">Tất cả vai trò</option>
              <option value="video editor">🎥 Video Editor</option>
              <option value="scriptwriter">✍️ Scriptwriter</option>
              <option value="thumbnail designer">🖼️ Thumbnail Designer</option>
              <option value="motion designer">💫 Motion Designer</option>
            </select>
          </div>
        </div>
      </section>

      {/* Directory Listings */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex-1 w-full">
        <div ref={containerRef} className="space-y-6">
          {filteredFreelancers.length > 0 ? (
            filteredFreelancers.map((fl) => (
              <div
                key={fl.id}
                className="freelancer-card bg-canvas border border-hairline rounded-lg p-6 shadow-sm hover:shadow-md hover:border-hairline transition-all flex flex-col md:flex-row gap-6 items-start"
                style={{ opacity: 0 }}
              >
                <img
                  src={fl.avatar}
                  alt={fl.name}
                  className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                />

                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div>
                      <h2 className="text-lg font-semibold text-ink">{fl.name}</h2>
                      <p className="text-xs text-steel">{fl.role} • <span className="font-mono">{fl.experience}</span></p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-yellow-500 text-sm">⭐ {fl.rating.toFixed(1)}</span>
                      <span className="text-xs text-slate">({fl.completedJobs} dự án hoàn thành)</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate mb-4 leading-relaxed">
                    {fl.bio}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {fl.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="bg-surface text-steel text-[10px] font-mono px-2 py-0.5 rounded-sm border border-hairline-soft"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="w-full md:w-auto md:self-stretch flex md:flex-col justify-end min-w-[120px] border-t md:border-t-0 md:border-l border-hairline pt-4 md:pt-0 md:pl-6">
                  <Link
                    href={`/freelancers/${fl.id}`}
                    className="w-full text-center px-4 py-2 text-xs font-semibold bg-ink text-on-dark rounded-full hover:bg-charcoal transition-colors"
                  >
                    Xem Chi Tiết
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 bg-surface border border-hairline rounded-lg">
              <p className="text-sm text-steel">Không tìm thấy freelancer nào.</p>
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
