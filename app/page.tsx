"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";

interface Freelancer {
  id: string;
  name: string;
  role: string;
  avatar: string;
  rating: number;
  completedJobs: number;
  skills: string[];
  bio: string;
  videoCount?: number;
  highlightVideo?: string;
}

const mockFreelancers: Freelancer[] = [
  {
    id: "fl-1",
    name: "Trần Minh Tuấn",
    role: "Video Editor",
    avatar: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%2300d4a4'/><text x='50' y='58' font-family='sans-serif' font-size='32' font-weight='bold' fill='%230a0a0a' text-anchor='middle'>MT</text></svg>",
    rating: 4.9,
    completedJobs: 84,
    skills: ["Premiere Pro", "After Effects", "Color Grading", "Gaming Video"],
    bio: "Chuyên edit video YouTube, TikTok phong cách vlog năng động và gaming chuyên nghiệp. Đã làm việc với nhiều YouTuber trên 1M subscribers.",
    videoCount: 15,
  },
  {
    id: "fl-2",
    name: "Lê Nguyễn Lan Anh",
    role: "Scriptwriter",
    avatar: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%233772cf'/><text x='50' y='58' font-family='sans-serif' font-size='32' font-weight='bold' fill='%23ffffff' text-anchor='middle'>LA</text></svg>",
    rating: 5.0,
    completedJobs: 52,
    skills: ["Storytelling", "Short-form Script", "Review Script", "SEO Content"],
    bio: "Viết kịch bản phóng sự, review sản phẩm và kịch bản TikTok Shorts triệu view. Tư vấn định hình hướng đi kênh thương hiệu cá nhân.",
    videoCount: 0,
  },
  {
    id: "fl-3",
    name: "Hoàng Quốc Bảo",
    role: "Thumbnail Designer",
    avatar: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23f55a3c'/><text x='50' y='58' font-family='sans-serif' font-size='32' font-weight='bold' fill='%23ffffff' text-anchor='middle'>QB</text></svg>",
    rating: 4.8,
    completedJobs: 110,
    skills: ["Photoshop", "AI Gen Art", "3D Thumbnail", "CTR Optimization"],
    bio: "Thiết kế thumbnail thu hút click (CTR cao) cho YouTube. Cam kết tăng tỷ lệ click-through rate ít nhất 5% sau khi thay đổi.",
    videoCount: 8,
  },
  {
    id: "fl-4",
    name: "Phạm Hiếu Nghĩa",
    role: "Motion Designer",
    avatar: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%233a3a3c'/><text x='50' y='58' font-family='sans-serif' font-size='32' font-weight='bold' fill='%23ffffff' text-anchor='middle'>HN</text></svg>",
    rating: 4.9,
    completedJobs: 37,
    skills: ["After Effects", "Spline 3D", "Lottie Animation", "2D Animation"],
    bio: "Thiết kế Intro, Outro và hiệu ứng chuyển cảnh độc quyền cho các kênh YouTube công nghệ và tài chính.",
    videoCount: 22,
  }
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>("video-edit");
  const [searchText, setSearchText] = useState<string>("");

  const heroRef = useRef<HTMLDivElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);

  // Hero and mock UI load-in animations using GSAP Context
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Stagger fade-in and slide-up for hero contents
      gsap.from(".hero-animate", {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.15,
        ease: "power3.out",
      });

      // Bouncy slide-in for timeline video mockup preview
      gsap.from(".mock-ui-animate", {
        scale: 0.92,
        opacity: 0,
        x: 40,
        duration: 1.2,
        delay: 0.6,
        ease: "back.out(1.2)",
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  // Card grid stagger fade-in when active tab or search value changes
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(".freelancer-card", { opacity: 0, y: 20 });
      gsap.to(".freelancer-card", {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.08,
        ease: "power2.out",
        overwrite: "auto",
      });
    }, cardsContainerRef);

    return () => ctx.revert();
  }, [activeTab, searchText]);

  const filteredFreelancers = mockFreelancers.filter((fl) => {
    const matchesTab = 
      (activeTab === "video-edit" && (fl.role === "Video Editor" || fl.role === "Motion Designer")) ||
      (activeTab === "script" && fl.role === "Scriptwriter") ||
      (activeTab === "thumbnail" && fl.role === "Thumbnail Designer");
    
    const matchesSearch = fl.name.toLowerCase().includes(searchText.toLowerCase()) || 
                          fl.skills.some(s => s.toLowerCase().includes(searchText.toLowerCase()));
    
    return matchesTab && matchesSearch;
  });

  return (
    <div className="flex flex-col min-h-screen bg-canvas font-sans">
      {/* Promo Banner */}
      <div className="w-full bg-canvas-dark text-on-dark py-2.5 px-4 text-center text-xs font-medium border-b border-hairline-dark">
        🚀 Ra mắt phiên bản CreatorHire v1.0 - Sàn giao dịch bảo mật dành riêng cho Content Creator Việt Nam.
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-canvas/85 backdrop-blur-md border-b border-hairline-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold tracking-wider text-ink flex items-center gap-1.5" style={{ fontFamily: "var(--font-sans)" }}>
              creator<span className="text-brand-green">hire.</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/jobs" className="text-sm font-medium text-steel hover:text-ink transition-colors">
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
              Đăng ký miễn phí
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1a3d4a] via-[#102a35] to-[#0a0a0a] text-on-dark py-20 lg:py-28">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-green via-transparent to-transparent"></div>
        <div ref={heroRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <span className="hero-animate opacity-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-green/10 text-brand-green border border-brand-green/20 mb-6">
              ✦ GIẢI PHÁP TÌM NHÂN SỰ TOÀN DIỆN
            </span>
            <h1 className="hero-animate opacity-0 text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.1] mb-6" style={{ letterSpacing: "-1.5px" }}>
              Thuê nhân sự Creative <br className="hidden sm:inline" />
              chất lượng cao nhanh hơn
            </h1>
            <p className="hero-animate opacity-0 text-lg sm:text-xl text-on-dark-muted font-light mb-8 max-w-2xl mx-auto leading-relaxed">
              CreatorHire kết nối các nhà sáng tạo nội dung triệu view với đội ngũ Video Editor, Scriptwriter và Thumbnail Designer hàng đầu. Đảm bảo an toàn 100% nhờ hệ thống Escrow.
            </p>
            <div className="hero-animate opacity-0 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register?role=creator" className="w-full sm:w-auto px-6 py-3 text-base font-semibold bg-brand-green text-ink rounded-full hover:bg-brand-green-deep transition-all shadow-[0_4px_20px_rgba(0,212,164,0.15)] text-center">
                Tôi muốn thuê Freelancer
              </Link>
              <Link href="/register?role=freelancer" className="w-full sm:w-auto px-6 py-3 text-base font-medium bg-transparent text-on-dark border border-hairline-dark rounded-full hover:bg-white/10 transition-colors text-center">
                Tôi muốn nhận dự án
              </Link>
            </div>
          </div>
        </div>
      </section>


      {/* Search & Directory Section */}
      <section className="py-16 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-semibold text-ink mb-4">
              Khám phá đội ngũ tài năng hàng đầu
            </h2>
            <p className="text-slate max-w-lg mx-auto">
              Lọc nhanh theo chuyên mục và tìm kiếm kỹ năng để thấy hồ sơ các freelancer sẵn sàng làm việc ngay lập tức.
            </p>
          </div>

          {/* Search bar & Tabs */}
          <div className="max-w-3xl mx-auto mb-10">
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Tìm theo tên freelancer hoặc kỹ năng (Premiere, Storytelling, Photoshop...)"
                  className="w-full h-11 px-4 py-2 bg-canvas text-charcoal border border-hairline rounded-md focus:border-brand-green focus:outline-none transition-colors text-sm"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
            </div>

            {/* Mintlify Pill Tabs */}
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setActiveTab("video-edit")}
                className={`px-5 py-2 text-xs font-semibold rounded-full transition-all border ${
                  activeTab === "video-edit"
                    ? "bg-ink text-on-dark border-ink"
                    : "bg-canvas text-steel border-hairline hover:border-steel"
                }`}
              >
                🎥 Video Editor & Animation
              </button>
              <button
                onClick={() => setActiveTab("script")}
                className={`px-5 py-2 text-xs font-semibold rounded-full transition-all border ${
                  activeTab === "script"
                    ? "bg-ink text-on-dark border-ink"
                    : "bg-canvas text-steel border-hairline hover:border-steel"
                }`}
              >
                ✍️ Biên kịch / Scriptwriter
              </button>
              <button
                onClick={() => setActiveTab("thumbnail")}
                className={`px-5 py-2 text-xs font-semibold rounded-full transition-all border ${
                  activeTab === "thumbnail"
                    ? "bg-ink text-on-dark border-ink"
                    : "bg-canvas text-steel border-hairline hover:border-steel"
                }`}
              >
                🖼️ Thiết kế Thumbnail
              </button>
            </div>
          </div>

          {/* Freelancers Cards Grid */}
          <div ref={cardsContainerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {filteredFreelancers.length > 0 ? (
              filteredFreelancers.map((fl) => (
                <div
                  key={fl.id}
                  className="freelancer-card opacity-0 bg-canvas border border-hairline rounded-lg p-6 shadow-sm hover:shadow-md hover:border-hairline transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      <img
                        src={fl.avatar}
                        alt={fl.name}
                        className="w-12 h-12 rounded-md object-cover"
                      />
                      <div>
                        <h3 className="text-base font-semibold text-ink">{fl.name}</h3>
                        <p className="text-xs text-steel">{fl.role}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-yellow-500 text-xs">⭐ {fl.rating.toFixed(1)}</span>
                      <span className="text-slate text-xs">({fl.completedJobs} dự án)</span>
                    </div>

                    <p className="text-xs text-slate line-clamp-3 mb-4 leading-relaxed">
                      {fl.bio}
                    </p>
                  </div>

                  <div>
                    {/* Skills Tag block */}
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {fl.skills.slice(0, 3).map((skill, idx) => (
                        <span
                          key={idx}
                          className="bg-surface text-steel text-[10px] font-mono px-2 py-0.5 rounded-sm border border-hairline-soft"
                        >
                          {skill}
                        </span>
                      ))}
                      {fl.skills.length > 3 && (
                        <span className="bg-surface text-steel text-[10px] px-2 py-0.5 rounded-sm">
                          +{fl.skills.length - 3}
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/freelancers/${fl.id}`}
                      className="block w-full py-2 text-center text-xs font-semibold text-ink border border-hairline rounded-full hover:bg-surface transition-colors"
                    >
                      Xem Hồ Sơ & Portfolio
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-10 bg-canvas border border-hairline rounded-lg">
                <p className="text-sm text-steel">Không tìm thấy freelancer nào khớp với mô tả.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Killer Feature Highlight - Timeline Feedback */}
      <section className="py-20 bg-canvas">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-green">
                TÍNH NĂNG ĐỘC QUYỀN
              </span>
              <h2 className="text-3xl sm:text-4xl font-semibold text-ink mt-3 mb-6 leading-tight">
                Duyệt video bằng comment mốc thời gian (Timestamp)
              </h2>
              <p className="text-slate mb-6 leading-relaxed">
                Không còn cảnh nhắn tin lằng nhằng qua Zalo hay Messenger mô tả lỗi edit. Với CreatorHire, bạn chỉ cần mở video nháp, click vào mốc giây bị lỗi và nhập nội dung sửa đổi. Editor sẽ thấy ngay vị trí cần chỉnh sửa.
              </p>

              {/* Bullet points */}
              <ul className="space-y-3.5 mb-8">
                <li className="flex items-start gap-2.5 text-sm text-charcoal">
                  <span className="text-brand-green mt-0.5">✔</span>
                  <span>Đồng bộ mốc thời gian của comment với trình phát video.</span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-charcoal">
                  <span className="text-brand-green mt-0.5">✔</span>
                  <span>Freelancer xuất file sửa nhanh chóng hơn 50%.</span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-charcoal">
                  <span className="text-brand-green mt-0.5">✔</span>
                  <span>Lưu trữ lịch sử sửa đổi của các phiên bản video rõ ràng.</span>
                </li>
              </ul>
            </div>

            {/* Visual simulation of timestamp feature */}
            <div className="mock-ui-animate opacity-0 bg-surface-code rounded-lg border border-hairline-dark p-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-hairline-dark pb-3 mb-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500"></span>
                  <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                </div>
                <span className="text-xs text-on-dark-muted font-mono">Duyệt_Video_Nháp_v2.mp4</span>
                <span className="text-xs text-brand-green font-semibold">01:45 / 03:20</span>
              </div>
              <div className="relative aspect-video bg-black rounded border border-hairline-dark flex items-center justify-center mb-4 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="w-14 h-14 rounded-full bg-brand-green flex items-center justify-center cursor-pointer hover:scale-105 transition-transform z-10 shadow-lg">
                  <span className="text-ink ml-1 text-xl">▶</span>
                </div>
                {/* Mock comments floating */}
                <div className="absolute bottom-4 left-4 right-4 bg-canvas-dark/95 border border-hairline-dark p-2.5 rounded text-xs text-on-dark flex items-center gap-2 shadow-lg">
                  <span className="bg-brand-green text-ink px-1.5 py-0.5 rounded font-mono font-bold">01:45</span>
                  <span className="flex-1 truncate">"Đoạn này phóng to (zoom in) mặt MC và chèn âm thanh meme bất ngờ."</span>
                  <span className="text-brand-green">✔ Đã sửa</span>
                </div>
              </div>
              {/* Comment Thread Mock */}
              <div className="space-y-2">
                <div className="bg-black/30 p-2.5 rounded border border-hairline-dark/40 flex items-start gap-2.5 text-xs">
                  <span className="font-bold text-on-dark">Huy Nguyễn (Creator):</span>
                  <p className="text-on-dark-muted flex-1">{"Bấm 00:23 bỏ vietsub bị sai chính tả: 'kiến trúc' -> 'kiếm trúc'."}</p>
                  <span className="text-brand-tag font-mono">00:23</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Escrow and Safety Section */}
      <section className="py-20 bg-surface border-y border-hairline">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-bold text-brand-green tracking-wider uppercase">
            GIAO DỊCH AN TOÀN 100%
          </span>
          <h2 className="text-3xl sm:text-4xl font-semibold text-ink mt-3 mb-6">
            Không lo bị bùng tiền hay chậm file
          </h2>
          <p className="text-slate max-w-2xl mx-auto mb-12">
            Hệ thống cổng thanh toán liên kết PayOS (VietQR) tự động tạo giao dịch đặt cọc (Escrow). Tiền của khách hàng chỉ được chuyển cho Freelancer khi dự án được Creator xác nhận hoàn thành hoặc không có tranh chấp.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="bg-canvas border border-hairline p-8 rounded-lg shadow-sm">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-surface text-ink font-mono font-bold mb-4">
                01
              </span>
              <h3 className="text-base font-semibold text-ink mb-2">Đăng tin & Cọc tiền</h3>
              <p className="text-xs text-slate leading-relaxed">
                Creator chọn freelancer và nạp tiền đặt cọc tương ứng với milestone vào ví giữ hộ của sàn giao dịch.
              </p>
            </div>
            <div className="bg-canvas border border-hairline p-8 rounded-lg shadow-sm">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-surface text-ink font-mono font-bold mb-4">
                02
              </span>
              <h3 className="text-base font-semibold text-ink mb-2">Edit & Sửa đổi</h3>
              <p className="text-xs text-slate leading-relaxed">
                Freelancer tiến hành edit video, viết kịch bản, trao đổi và sửa đổi dự án thông qua nền tảng CreatorHire.
              </p>
            </div>
            <div className="bg-canvas border border-hairline p-8 rounded-lg shadow-sm">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-surface text-ink font-mono font-bold mb-4">
                03
              </span>
              <h3 className="text-base font-semibold text-ink mb-2">Duyệt & Giải ngân</h3>
              <p className="text-xs text-slate leading-relaxed">
                Sau khi sản phẩm cuối được phê duyệt, Creator bấm đồng ý giải ngân và tiền lập tức về tài khoản Freelancer.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-canvas border-t border-hairline py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="text-sm font-semibold text-ink mb-4">Về CreatorHire</h3>
              <ul className="space-y-2 text-xs text-steel">
                <li><Link href="/about" className="hover:text-ink">Về chúng tôi</Link></li>
                <li><Link href="/careers" className="hover:text-ink">Tuyển dụng</Link></li>
                <li><Link href="/blog" className="hover:text-ink">Blog tin tức</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink mb-4">Cho Nhà sáng tạo</h3>
              <ul className="space-y-2 text-xs text-steel">
                <li><Link href="/freelancers" className="hover:text-ink">Tìm Video Editor</Link></li>
                <li><Link href="/freelancers" className="hover:text-ink">Tìm Scriptwriter</Link></li>
                <li><Link href="/freelancers" className="hover:text-ink">Tìm Thumbnail Designer</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink mb-4">Cho Freelancer</h3>
              <ul className="space-y-2 text-xs text-steel">
                <li><Link href="/jobs" className="hover:text-ink">Xem dự án mới</Link></li>
                <li><Link href="/guide" className="hover:text-ink">Hướng dẫn sử dụng</Link></li>
                <li><Link href="/escrow" className="hover:text-ink">Hệ thống Escrow</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink mb-4">Hỗ trợ</h3>
              <ul className="space-y-2 text-xs text-steel">
                <li><Link href="/help" className="hover:text-ink">Trung tâm trợ giúp</Link></li>
                <li><Link href="/terms" className="hover:text-ink">Điều khoản dịch vụ</Link></li>
                <li><Link href="/privacy" className="hover:text-ink">Chính sách bảo mật</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-hairline-soft pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-steel">
            <p>© {new Date().getFullYear()} CreatorHire. Phát triển và tối ưu cho Creator Việt Nam.</p>
            <div className="flex items-center gap-2">
              <span>Được xây dựng trên tiêu chuẩn</span>
              <span className="font-bold text-ink">getdesign.md</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

