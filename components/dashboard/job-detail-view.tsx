"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import gsap from "gsap";
import { submitProposalAction } from "@/app/jobs/[id]/actions";
import { Video, FileText, Image, Settings, Check, AlertCircle, ArrowLeft, Clock, DollarSign } from "lucide-react";

interface Job {
  id: string;
  title: string;
  category: string;
  budget_amount: number;
  budget_type: string;
  description: string;
  status: string;
  created_at: string;
}

interface Proposal {
  id: string;
  bid_amount: number;
  cover_letter: string;
  status: string;
}

interface JobDetailProps {
  job: Job;
  userRole: string | null;
  existingProposal: Proposal | null;
}

export default function JobDetailView({ job, userRole, existingProposal }: JobDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const detailColRef = useRef<HTMLDivElement>(null);
  const formColRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Details column slides in from left
      if (detailColRef.current) {
        gsap.fromTo(
          detailColRef.current,
          { x: -50, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.7, ease: "power3.out" }
        );
      }

      // 2. Form column slides in from right with elastic feel
      if (formColRef.current) {
        gsap.fromTo(
          formColRef.current,
          { x: 50, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.8, delay: 0.1, ease: "power3.out" }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (success) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          successRef.current,
          { scale: 0.8, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" }
        );

        const check = successRef.current?.querySelector(".success-checkmark");
        if (check) {
          gsap.fromTo(
            check,
            { scale: 0 },
            { scale: 1, duration: 0.6, delay: 0.2, ease: "elastic.out(1, 0.5)" }
          );
        }
      }, successRef);

      const timer = setTimeout(() => {
        router.push("/freelancer/proposals");
        router.refresh();
      }, 2200);

      return () => {
        clearTimeout(timer);
        ctx.revert();
      };
    }
  }, [success, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.append("job_id", job.id);

    startTransition(async () => {
      try {
        const result = await submitProposalAction(null, formData);
        if (result && result.error) {
          setError(result.error);
        } else if (result && result.success) {
          setSuccess(true);
        }
      } catch (err) {
        setError("Đã xảy ra lỗi kết nối. Vui lòng thử lại.");
      }
    });
  };

  const renderCategoryBadge = (cat: string) => {
    switch (cat) {
      case "video-edit":
        return (
          <span className="px-3 py-1 bg-brand-green/10 text-brand-green border border-brand-green/20 rounded-full text-xs font-semibold inline-flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5" /> Dựng video (Video Editing)
          </span>
        );
      case "script":
        return (
          <span className="px-3 py-1 bg-brand-tag/10 text-brand-tag border border-brand-tag/20 rounded-full text-xs font-semibold inline-flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Viết kịch bản (Scriptwriting)
          </span>
        );
      case "thumbnail":
        return (
          <span className="px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-xs font-semibold inline-flex items-center gap-1.5">
            <Image className="w-3.5 h-3.5" /> Thiết kế Thumbnail
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-stone/10 text-stone border border-stone/20 rounded-full text-xs font-semibold inline-flex items-center gap-1.5">
            <Settings className="w-3.5 h-3.5" /> Khác
          </span>
        );
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
          <div className="success-checkmark w-20 h-20 bg-brand-green/10 text-brand-green rounded-full flex items-center justify-center shadow-inner border border-brand-green/30">
            <Check className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-ink">Gửi đề xuất thành công!</h2>
            <p className="text-xs text-steel">
              Báo giá ứng tuyển của bạn đã được chuyển tới Creator. Đang chuyển hướng về trang đề xuất của bạn...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface font-sans">
      {/* Header */}
      <header className="border-b border-hairline py-4 px-6 bg-canvas/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-wider text-ink">
            creator<span className="text-brand-green">hire.</span>
          </Link>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs text-steel hover:text-ink font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto py-12 px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Cột trái: Chi tiết dự án */}
          <div ref={detailColRef} className="lg:col-span-7 bg-canvas border border-hairline rounded-lg p-8 space-y-6" style={{ opacity: 0 }}>
            <div className="space-y-3">
              {renderCategoryBadge(job.category)}
              <h2 className="text-lg font-bold text-ink leading-snug md:text-xl">{job.title}</h2>
              <div className="flex flex-wrap items-center gap-4 text-xs text-steel border-y border-hairline-soft py-3">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" /> {job.created_at}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-semibold text-charcoal font-mono">
                  <DollarSign className="w-4 h-4" /> {job.budget_amount.toLocaleString("vi-VN")} ₫ ({job.budget_type === "fixed" ? "Trọn gói" : "Theo giờ"})
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink border-l-2 border-brand-green pl-2">Mô tả công việc</h3>
              <p className="text-xs text-charcoal leading-relaxed whitespace-pre-line bg-surface/50 p-4 rounded-md border border-hairline-soft">
                {job.description}
              </p>
            </div>
          </div>

          {/* Cột phải: Form gửi báo giá hoặc trạng thái đã nộp */}
          <div ref={formColRef} className="lg:col-span-5" style={{ opacity: 0 }}>
            {existingProposal ? (
              /* Đã nộp báo giá rồi */
              <div className="bg-canvas border border-brand-green/30 rounded-lg p-8 shadow-sm space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-green/10 text-brand-green rounded-full flex items-center justify-center border border-brand-green/20">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-ink">Bạn đã ứng tuyển dự án này</h3>
                    <p className="text-[10px] text-steel">Đề xuất đã được lưu lại trên hệ thống</p>
                  </div>
                </div>

                <div className="space-y-4 border-t border-hairline pt-4">
                  <div>
                    <span className="text-[9px] uppercase font-semibold text-steel block">Mức giá đề xuất:</span>
                    <span className="text-sm font-bold font-mono text-brand-green">{existingProposal.bid_amount.toLocaleString("vi-VN")} ₫</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-semibold text-steel block">Trạng thái:</span>
                    <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 mt-1 rounded-full ${
                      existingProposal.status === "accepted"
                        ? "bg-brand-green/10 text-brand-green border border-brand-green/20"
                        : existingProposal.status === "rejected"
                        ? "bg-brand-error/10 text-brand-error border border-brand-error/20"
                        : "bg-stone/10 text-stone border border-stone/20"
                    }`}>
                      {existingProposal.status === "accepted" ? "Được nhận" : existingProposal.status === "rejected" ? "Từ chối" : "Đang chờ duyệt"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-semibold text-steel block">Thư giới thiệu của bạn:</span>
                    <p className="text-xs text-charcoal leading-relaxed italic bg-surface p-3 rounded border border-hairline-soft mt-1">
                      "{existingProposal.cover_letter}"
                    </p>
                  </div>
                </div>
              </div>
            ) : userRole === "creator" ? (
              /* Đăng nhập bằng tài khoản Creator -> Không được ứng tuyển */
              <div className="bg-canvas border border-hairline rounded-lg p-6 text-center text-xs text-steel">
                🔒 Bạn đang đăng nhập bằng tài khoản **Nhà sáng tạo**. Chỉ tài khoản **Freelancer** mới được nộp báo giá ứng tuyển.
              </div>
            ) : !userRole ? (
              /* Chưa đăng nhập */
              <div className="bg-canvas border border-hairline rounded-lg p-8 text-center space-y-4">
                <p className="text-xs text-steel">Đăng nhập bằng tài khoản Freelancer để gửi báo giá ứng tuyển dự án này.</p>
                <Link
                  href={`/login?redirect=/jobs/${job.id}`}
                  className="w-full h-10 bg-ink text-on-dark text-xs font-semibold rounded-full hover:bg-charcoal transition-colors flex items-center justify-center"
                >
                  Đăng nhập ngay
                </Link>
              </div>
            ) : (
              /* Tài khoản Freelancer hợp lệ -> Render Form nộp báo giá */
              <div className="bg-canvas border border-hairline rounded-lg p-8 shadow-sm space-y-6">
                <div className="border-b border-hairline pb-3">
                  <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Gửi Báo Giá Ứng Tuyển</h3>
                  <p className="text-[10px] text-steel">Cạnh tranh bằng chất lượng và giá cả hợp lý</p>
                </div>

                {error && (
                  <div className="p-3 bg-brand-error/10 border border-brand-error/20 text-xs text-brand-error font-medium rounded-md flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Mức giá đề xuất */}
                  <div>
                    <label className="block text-xs font-semibold text-steel uppercase tracking-wider mb-2">
                      Chi phí đề xuất (VND)
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        name="bid_amount"
                        required
                        min="10000"
                        step="10000"
                        defaultValue={job.budget_amount}
                        className="w-full h-10 pl-3 pr-12 py-2 bg-canvas text-charcoal border border-hairline rounded-md text-xs focus:border-brand-green focus:outline-none transition-colors font-mono font-bold"
                        disabled={isPending}
                      />
                      <span className="absolute right-3 text-xs font-bold text-stone">VND</span>
                    </div>
                  </div>

                  {/* Thư giới thiệu */}
                  <div>
                    <label className="block text-xs font-semibold text-steel uppercase tracking-wider mb-2">
                      Thư giới thiệu / Đề xuất giải pháp
                    </label>
                    <textarea
                      name="cover_letter"
                      required
                      rows={5}
                      placeholder="Mô tả ngắn gọn kinh nghiệm dựng/viết của bạn liên quan đến job này. Bạn có giải pháp gì đặc biệt? Đính kèm link sample tốt nhất..."
                      className="w-full p-3 bg-canvas text-charcoal border border-hairline rounded-md text-xs focus:border-brand-green focus:outline-none transition-colors leading-relaxed"
                      disabled={isPending}
                    />
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    className="w-full h-10 bg-ink text-on-dark text-xs font-semibold rounded-full hover:bg-brand-green hover:text-canvas transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                    disabled={isPending}
                  >
                    {isPending ? (
                      <>
                        <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-on-dark border-t-transparent rounded-full" />
                        Đang nộp đề xuất...
                      </>
                    ) : (
                      "Nộp Báo Giá Ứng Tuyển"
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
