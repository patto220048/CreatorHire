"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { gsap } from "gsap";
import Navbar from "@/components/navbar";
import { 
  ArrowLeft, 
  Video, 
  FileText, 
  Image, 
  Settings, 
  Star, 
  Award, 
  Send, 
  Briefcase, 
  Check, 
  AlertCircle 
} from "lucide-react";

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

interface CreatorJob {
  id: string;
  title: string;
  budget_amount: number;
}

interface FreelancerDetailProps {
  freelancer: Freelancer;
  creatorJobs: CreatorJob[];
  currentRole: string | null;
}

export default function FreelancerDetailView({ freelancer, creatorJobs, currentRole }: FreelancerDetailProps) {
  const router = useRouter();
  const [selectedJobId, setSelectedJobId] = useState(creatorJobs[0]?.id || "");
  const [inviteMessage, setInviteMessage] = useState(`Chào ${freelancer.name}, mình đã xem portfolio của bạn và rất ấn tượng. Mình muốn mời bạn tham gia dự án này.`);
  const [customBid, setCustomBid] = useState<number | "">("");
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const profileColRef = useRef<HTMLDivElement>(null);
  const hireColRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  // Entrance animations using GSAP
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (profileColRef.current) {
        gsap.fromTo(
          profileColRef.current,
          { x: -40, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.6, ease: "power3.out" }
        );
      }
      if (hireColRef.current) {
        gsap.fromTo(
          hireColRef.current,
          { x: 40, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.6, delay: 0.1, ease: "power3.out" }
        );
      }
    });
    return () => ctx.revert();
  }, []);

  // Success animations
  useEffect(() => {
    if (success) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          successRef.current,
          { scale: 0.85, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" }
        );
      }, successRef);

      const timer = setTimeout(() => {
        router.push("/creator");
        router.refresh();
      }, 2500);

      return () => {
        clearTimeout(timer);
        ctx.revert();
      };
    }
  }, [success, router]);

  // Helper đọc/ghi cookies client-side
  const getCookie = (name: string): string | null => {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
    return null;
  };

  const setCookie = (name: string, value: string, days = 1) => {
    if (typeof document === "undefined") return;
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = `; expires=${date.toUTCString()}`;
    document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/`;
  };

  const handleHireSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedJobId) {
      setError("Vui lòng chọn hoặc đăng một dự án để gửi lời mời.");
      return;
    }

    startTransition(() => {
      try {
        const selectedJob = creatorJobs.find(j => j.id === selectedJobId);
        if (!selectedJob) {
          setError("Dự án được chọn không hợp lệ.");
          return;
        }

        const bidAmount = customBid !== "" ? Number(customBid) : selectedJob.budget_amount;

        // Đọc proposals cũ
        const rawProps = getCookie("mock-proposals");
        let proposals: any[] = [];
        if (rawProps) {
          try {
            proposals = JSON.parse(decodeURIComponent(rawProps));
          } catch (e) {}
        }

        // Tạo proposal mời làm việc mới
        const newProposal = {
          id: `mock-prop-${Date.now()}`,
          job_id: selectedJob.id,
          job_title: selectedJob.title,
          freelancer_name: freelancer.name,
          bid_amount: bidAmount,
          cover_letter: inviteMessage,
          status: "pending", // chờ duyệt từ creator hoặc coi như freelancer nộp
          created_at: "Vừa xong",
        };

        setCookie("mock-proposals", JSON.stringify([newProposal, ...proposals]));
        setSuccess(true);
      } catch (err) {
        setError("Lỗi xử lý dữ liệu giả lập.");
      }
    });
  };

  const handleQuickCreatorLogin = () => {
    const sessionData = {
      email: "mock-creator@creatorhire.vn",
      role: "creator",
      fullName: "Huy Nguyễn (Creator)"
    };
    setCookie("mock-session", JSON.stringify(sessionData));
    
    // Đảm bảo khởi tạo dữ liệu mock để creator có job chọn
    const existingJobs = getCookie("mock-jobs");
    if (!existingJobs) {
      const defaultJobs = [
        {
          id: "mock-job-1",
          title: "Cần Video Editor chuyên nghiệp dựng Video Shorts công nghệ",
          category: "video-edit",
          budget_amount: 1500000,
          budget_type: "fixed",
          description: "Dự án dựng video shorts review iPhone 15 Pro Max thời lượng 45 giây. Yêu cầu dựng style Alex Hormozi.",
          status: "open",
          created_at: "2 giờ trước",
          proposals_count: 0
        }
      ];
      setCookie("mock-jobs", JSON.stringify(defaultJobs));
    }
    
    window.location.reload();
  };

  const renderRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case "video editor":
        return <Video className="w-4 h-4 text-brand-green" />;
      case "scriptwriter":
        return <FileText className="w-4 h-4 text-brand-tag" />;
      case "thumbnail designer":
        return <Image className="w-4 h-4 text-amber-500" />;
      default:
        return <Settings className="w-4 h-4 text-steel" />;
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div
          ref={successRef}
          className="max-w-md w-full bg-canvas border border-hairline p-8 rounded-lg shadow-sm text-center py-16 flex flex-col items-center justify-center space-y-6"
          style={{ opacity: 0 }}
        >
          <div className="w-20 h-20 bg-brand-green/10 text-brand-green rounded-full flex items-center justify-center border border-brand-green/30">
            <Check className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-ink">Gửi lời mời & Báo giá thành công!</h2>
            <p className="text-xs text-steel">
              Đề xuất hợp tác với {freelancer.name} đã được khởi tạo trong danh sách báo giá của bạn. Đang chuyển hướng về Dashboard Creator...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface font-sans">
      {/* Header */}
      <Navbar />

      {/* Main Container */}
      <main className="max-w-6xl mx-auto py-8 px-6 space-y-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs text-steel hover:text-ink font-semibold cursor-pointer mb-2"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Cột trái: Thông tin cá nhân Freelancer */}
          <div ref={profileColRef} className="lg:col-span-7 bg-canvas border border-hairline rounded-lg p-8 space-y-6" style={{ opacity: 0 }}>
            <div className="flex flex-col sm:flex-row items-center gap-5 border-b border-hairline-soft pb-6">
              <img
                src={freelancer.avatar}
                alt={freelancer.name}
                className="w-24 h-24 rounded-xl object-cover border-2 border-hairline shadow-sm"
              />
              <div className="text-center sm:text-left space-y-1.5">
                <h1 className="text-xl font-bold text-ink">{freelancer.name}</h1>
                <p className="text-xs text-steel font-medium flex items-center justify-center sm:justify-start gap-1.5">
                  {renderRoleIcon(freelancer.role)} {freelancer.role}
                </p>
                <div className="flex items-center justify-center sm:justify-start gap-3 mt-2 text-xs">
                  <span className="flex items-center gap-1 text-yellow-500 font-bold">
                    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" /> {freelancer.rating.toFixed(1)}
                  </span>
                  <span className="text-stone">•</span>
                  <span className="text-slate font-medium">{freelancer.completedJobs} dự án đã xong</span>
                  <span className="text-stone">•</span>
                  <span className="bg-surface text-steel text-[10px] px-2.5 py-0.5 rounded font-mono border border-hairline-soft">
                    {freelancer.experience}
                  </span>
                </div>
              </div>
            </div>

            {/* Giới thiệu bản thân */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink border-l-2 border-brand-green pl-2">Giới thiệu bản thân</h3>
              <p className="text-xs text-charcoal leading-relaxed whitespace-pre-line bg-surface/50 p-4 rounded-md border border-hairline-soft">
                {freelancer.bio}
              </p>
            </div>

            {/* Kỹ năng chuyên môn */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink border-l-2 border-brand-green pl-2">Kỹ năng & Công cụ</h3>
              <div className="flex flex-wrap gap-2">
                {freelancer.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="bg-surface text-steel text-xs font-mono px-3 py-1 rounded-sm border border-hairline-soft"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Portfolio tiêu biểu */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink border-l-2 border-brand-green pl-2">Portfolio mẫu</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-hairline-soft rounded-md overflow-hidden bg-surface flex flex-col justify-between p-4 space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-ink">Project Vlog Du lịch Đà Lạt</h4>
                    <p className="text-[10px] text-slate mt-1">Sử dụng Premiere Pro & DaVinci Resolve để phân loại màu sắc cinematic, lồng âm sound design sống động.</p>
                  </div>
                  <span className="text-[10px] text-brand-green font-semibold">▶ Xem mẫu video</span>
                </div>
                <div className="border border-hairline-soft rounded-md overflow-hidden bg-surface flex flex-col justify-between p-4 space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-ink">TikTok Shorts Review Công nghệ</h4>
                    <p className="text-[10px] text-slate mt-1">Dựng video ngắn cuốn hút 45s dạng tin tức nhanh, chèn sound effects công nghệ giật gân, vietsub đầy đủ.</p>
                  </div>
                  <span className="text-[10px] text-brand-green font-semibold">▶ Xem mẫu video</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cột phải: Form mời nhận việc (Hiring) */}
          <div ref={hireColRef} className="lg:col-span-5" style={{ opacity: 0 }}>
            {currentRole === "creator" ? (
              /* Đã đăng nhập làm Creator -> Render Form gửi lời mời nhận việc */
              <div className="bg-canvas border border-hairline rounded-lg p-8 shadow-sm space-y-6">
                <div className="border-b border-hairline pb-3">
                  <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Mời {freelancer.name} Nhận Việc</h3>
                  <p className="text-[10px] text-steel">Chọn một dự án hiện tại của bạn để gửi đề xuất</p>
                </div>

                {error && (
                  <div className="p-3 bg-brand-error/10 border border-brand-error/20 text-xs text-brand-error font-medium rounded-md flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                  </div>
                )}

                <form onSubmit={handleHireSubmit} className="space-y-5">
                  {/* Dropdown danh sách Job */}
                  <div>
                    <label className="block text-xs font-semibold text-steel uppercase tracking-wider mb-2">
                      Chọn công việc đang tuyển
                    </label>
                    {creatorJobs.length > 0 ? (
                      <select
                        value={selectedJobId}
                        onChange={(e) => setSelectedJobId(e.target.value)}
                        className="w-full h-10 px-3 py-2 bg-canvas text-charcoal border border-hairline rounded-md text-xs focus:border-brand-green focus:outline-none transition-colors font-medium"
                      >
                        {creatorJobs.map((job) => (
                          <option key={job.id} value={job.id}>
                            {job.title} (Ngân sách: {job.budget_amount.toLocaleString("vi-VN")} ₫)
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 rounded-md">
                        Bạn chưa đăng dự án công khai nào. Vui lòng đăng dự án trước.
                      </div>
                    )}
                  </div>

                  {/* Giá đề xuất tùy chỉnh (nếu muốn thương lượng khác budget gốc) */}
                  <div>
                    <label className="block text-xs font-semibold text-steel uppercase tracking-wider mb-2">
                      Chi phí đề xuất riêng (VND - Tùy chọn)
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        placeholder="Mặc định sử dụng ngân sách của dự án"
                        value={customBid}
                        onChange={(e) => setCustomBid(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full h-10 pl-3 pr-12 py-2 bg-canvas text-charcoal border border-hairline rounded-md text-xs focus:border-brand-green focus:outline-none transition-colors font-mono font-bold"
                      />
                      <span className="absolute right-3 text-xs font-bold text-stone">VND</span>
                    </div>
                  </div>

                  {/* Lời nhắn / Thư mời */}
                  <div>
                    <label className="block text-xs font-semibold text-steel uppercase tracking-wider mb-2">
                      Lời nhắn gửi Freelancer
                    </label>
                    <textarea
                      value={inviteMessage}
                      onChange={(e) => setInviteMessage(e.target.value)}
                      required
                      rows={4}
                      className="w-full p-3 bg-canvas text-charcoal border border-hairline rounded-md text-xs focus:border-brand-green focus:outline-none transition-colors leading-relaxed"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isPending || creatorJobs.length === 0}
                    className="w-full h-10 bg-ink text-on-dark text-xs font-semibold rounded-full hover:bg-brand-green hover:text-canvas transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" /> Gửi Lời Mời & Thỏa thuận Báo giá
                  </button>
                </form>
              </div>
            ) : currentRole === "freelancer" ? (
              /* Đang đăng nhập bằng tài khoản Freelancer */
              <div className="bg-canvas border border-hairline rounded-lg p-8 text-center space-y-4 shadow-sm">
                <p className="text-xs text-steel">
                  🔒 Bạn đang đăng nhập bằng tài khoản **Freelancer**. Chỉ tài khoản **Nhà sáng tạo (Creator)** mới có quyền gửi lời mời nhận việc cho Freelancer khác.
                </p>
                <button
                  onClick={handleQuickCreatorLogin}
                  className="w-full h-10 bg-brand-green/15 text-brand-green hover:bg-brand-green/25 text-xs font-semibold rounded-full border border-brand-green/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  ⚡ Đổi nhanh sang Creator để test
                </button>
              </div>
            ) : (
              /* Chưa đăng nhập */
              <div className="bg-canvas border border-hairline rounded-lg p-8 text-center space-y-4 shadow-sm">
                <p className="text-xs text-steel">
                  Đăng nhập bằng tài khoản Nhà sáng tạo để gửi lời mời nhận việc cho {freelancer.name}.
                </p>
                <Link
                  href={`/login?redirect=/freelancers/${freelancer.id}`}
                  className="w-full h-10 bg-ink text-on-dark text-xs font-semibold rounded-full hover:bg-charcoal transition-colors flex items-center justify-center shadow-sm"
                >
                  Đăng nhập ngay
                </Link>
                
                <div className="border-t border-hairline-soft pt-4 mt-2">
                  <p className="text-[10px] text-slate mb-2">Chế độ kiểm thử nhanh:</p>
                  <button
                    onClick={handleQuickCreatorLogin}
                    className="w-full h-10 bg-brand-green/10 text-brand-green hover:bg-brand-green/20 text-xs font-semibold rounded-full border border-brand-green/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    ⚡ Đăng nhập Creator (Test)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
