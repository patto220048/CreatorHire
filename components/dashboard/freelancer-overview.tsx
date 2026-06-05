// components/dashboard/freelancer-overview.tsx
// Client Component hiển thị Tổng quan Bảng điều khiển Freelancer và form nộp sản phẩm

"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { submitDeliverableAction } from "@/app/(dashboard)/freelancer/actions";
import { getSupabaseClient } from "@/lib/supabase/client";
import VideoReviewTool from "@/components/dashboard/video-review-tool";
import { 
  Search, 
  Play, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  ArrowUpRight, 
  UploadCloud, 
  AlertCircle, 
  Link2, 
  Check,
  Video
} from "lucide-react";

interface Job {
  id: string;
  title: string;
  category: string;
  budget_amount: number;
  status: string;
  delivery_link?: string | null;
  delivery_note?: string | null;
}

interface Proposal {
  id: string;
  job_title: string;
  bid_amount: number;
  status: string;
  created_at: string;
}

interface OverviewProps {
  activeJobs: Job[];
  proposals: Proposal[];
  stats: {
    activeJobsCount: number;
    totalEarnings: number;
    proposalsSent: number;
    pendingProposals: number;
  };
}

export default function FreelancerOverview({ activeJobs, proposals, stats }: OverviewProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [formLink, setFormLink] = useState("");
  const [formNote, setFormNote] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitPending, startSubmitTransition] = useTransition();
  const [currentUser, setCurrentUser] = useState<{ fullName: string; role: "creator" | "freelancer" } | null>(null);
  const [activeReviewJobId, setActiveReviewJobId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = await getSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUser({
            fullName: user.user_metadata?.full_name || "Freelancer",
            role: user.user_metadata?.role || "freelancer",
          });
        }
      } catch (e) {}
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Animate metrics cards
      const cards = containerRef.current?.querySelectorAll(".stat-card");
      if (cards && cards.length > 0) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 30, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1, ease: "back.out(1.2)" }
        );
      }

      // Count-up animation for metrics
      const numberElements = containerRef.current?.querySelectorAll(".count-number");
      numberElements?.forEach((el) => {
        const targetVal = parseFloat(el.getAttribute("data-target") || "0");
        const isCurrency = el.classList.contains("currency");
        const currentObj = { val: 0 };

        gsap.to(currentObj, {
          val: targetVal,
          duration: 1.5,
          ease: "power2.out",
          delay: 0.2,
          onUpdate: () => {
            if (isCurrency) {
              el.textContent = Math.floor(currentObj.val).toLocaleString("vi-VN") + " ₫";
            } else {
              el.textContent = Math.floor(currentObj.val).toString();
            }
          },
        });
      });

      // 2. Animate main grids
      const grids = containerRef.current?.querySelectorAll(".overview-grid");
      if (grids && grids.length > 0) {
        gsap.fromTo(
          grids,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.8, delay: 0.4, stagger: 0.15, ease: "power3.out" }
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const toggleExpand = (jobId: string) => {
    if (expandedJobId === jobId) {
      // Collapse animation
      const formEl = document.getElementById(`delivery-form-${jobId}`);
      if (formEl) {
        gsap.to(formEl, {
          height: 0,
          opacity: 0,
          duration: 0.3,
          ease: "power2.inOut",
          onComplete: () => {
            setExpandedJobId(null);
            setSubmitError(null);
          }
        });
      } else {
        setExpandedJobId(null);
      }
    } else {
      // Set value of link and note if edit mode
      const job = activeJobs.find((j) => j.id === jobId);
      if (job) {
        setFormLink(job.delivery_link || "");
        setFormNote(job.delivery_note || "");
      }

      setExpandedJobId(jobId);
      setSubmitError(null);

      // Expand animation after state sets and renders
      setTimeout(() => {
        const formEl = document.getElementById(`delivery-form-${jobId}`);
        if (formEl) {
          gsap.fromTo(
            formEl,
            { height: 0, opacity: 0 },
            { height: "auto", opacity: 1, duration: 0.4, ease: "power2.out" }
          );
        }
      }, 50);
    }
  };

  const handleDeliverableSubmit = async (e: React.FormEvent<HTMLFormElement>, jobId: string) => {
    e.preventDefault();
    setSubmitError(null);

    const formData = new FormData();
    formData.append("job_id", jobId);
    formData.append("delivery_link", formLink);
    formData.append("delivery_note", formNote);

    startSubmitTransition(async () => {
      try {
        const res = await submitDeliverableAction(null, formData);
        if (res && res.error) {
          setSubmitError(res.error);
        } else if (res && res.success) {
          // Collapse form
          const formEl = document.getElementById(`delivery-form-${jobId}`);
          if (formEl) {
            gsap.to(formEl, {
              height: 0,
              opacity: 0,
              duration: 0.35,
              ease: "power2.inOut",
              onComplete: () => {
                setExpandedJobId(null);
                setFormLink("");
                setFormNote("");
                router.refresh();
              }
            });
          } else {
            setExpandedJobId(null);
            router.refresh();
          }
        }
      } catch (err) {
        setSubmitError("Đã xảy ra lỗi kết nối. Vui lòng thử lại.");
      }
    });
  };

  const renderCategoryIcon = (category: string) => {
    switch (category) {
      case "video-edit":
        return "🎬 Dựng video";
      case "script":
        return "📝 Kịch bản";
      case "thumbnail":
        return "🖼️ Thumbnail";
      default:
        return "⚙️ Khác";
    }
  };

  return (
    <div ref={containerRef} className="space-y-8">
      {/* Search Banner */}
      <div className="bg-canvas-dark text-on-dark p-8 rounded-lg relative overflow-hidden flex items-center justify-between border border-stone/10 shadow-sm">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#00d4a4_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="relative z-10 space-y-2">
          <h2 className="text-xl font-bold tracking-tight md:text-2xl">
            Tìm kiếm cơ hội việc làm mới ngay hôm nay 💼
          </h2>
          <p className="text-xs text-on-dark-muted max-w-lg">
            Hàng trăm tin tuyển dụng từ các Content Creator chất lượng cao đang tìm kiếm Editor, Writer và Designer. Đăng ký nhận việc làm ngay.
          </p>
        </div>
        
        <div className="relative z-10 shrink-0">
          <Link
            href="/jobs"
            className="inline-flex h-10 items-center justify-center bg-brand-green text-canvas text-xs font-semibold px-6 rounded-full hover:bg-brand-green-deep transition-all hover:scale-105 active:scale-95 shadow-md gap-2"
          >
            <Search className="w-4 h-4" /> Khám phá dự án
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1 */}
        <div className="stat-card bg-canvas border border-hairline p-6 rounded-lg shadow-sm flex flex-col justify-between" style={{ opacity: 0 }}>
          <span className="text-[10px] font-semibold text-steel uppercase tracking-widest">Dự án đang làm</span>
          <h3 className="count-number text-2xl font-bold text-ink mt-3 font-mono" data-target={stats.activeJobsCount}>0</h3>
          <span className="text-[10px] text-stone mt-2 block">Dự án đang tiến hành dựng/viết</span>
        </div>

        {/* Card 2 */}
        <div className="stat-card bg-canvas border border-hairline p-6 rounded-lg shadow-sm flex flex-col justify-between" style={{ opacity: 0 }}>
          <span className="text-[10px] font-semibold text-steel uppercase tracking-widest">Thu nhập tích lũy</span>
          <h3 className="count-number currency text-2xl font-bold text-ink mt-3 font-mono" data-target={stats.totalEarnings}>0</h3>
          <span className="text-[10px] text-brand-green font-semibold mt-2 block">Đã giải ngân hoặc tạm giữ</span>
        </div>

        {/* Card 3 */}
        <div className="stat-card bg-canvas border border-hairline p-6 rounded-lg shadow-sm flex flex-col justify-between" style={{ opacity: 0 }}>
          <span className="text-[10px] font-semibold text-steel uppercase tracking-widest">Báo giá đã nộp</span>
          <h3 className="count-number text-2xl font-bold text-ink mt-3 font-mono" data-target={stats.proposalsSent}>0</h3>
          <span className="text-[10px] text-stone mt-2 block">Tổng số lượng đề xuất đã gửi đi</span>
        </div>

        {/* Card 4 */}
        <div className="stat-card bg-canvas border border-hairline p-6 rounded-lg shadow-sm flex flex-col justify-between" style={{ opacity: 0 }}>
          <span className="text-[10px] font-semibold text-steel uppercase tracking-widest">Báo giá chờ duyệt</span>
          <h3 className="count-number text-2xl font-bold text-ink mt-3 font-mono" data-target={stats.pendingProposals}>0</h3>
          <span className="text-[10px] text-stone mt-2 block">Đề xuất đang đợi Creator phê duyệt</span>
        </div>
      </div>

      {/* Main grids */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column: Active Jobs */}
        <div className="overview-grid bg-canvas border border-hairline rounded-lg shadow-sm p-6 lg:col-span-7 flex flex-col" style={{ opacity: 0 }}>
          <div className="flex items-center justify-between mb-6 border-b border-hairline-soft pb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-2">
              <Play className="w-3.5 h-3.5 text-brand-tag fill-brand-tag" /> Công việc đang làm
            </h3>
            <span className="text-[10px] font-semibold text-stone bg-surface px-2 py-0.5 border border-hairline rounded">Active</span>
          </div>

          <div className="flex-1 space-y-4">
            {activeJobs.length === 0 ? (
              <div className="text-center py-12 text-xs text-stone">
                Bạn chưa tham gia dự án nào. Hãy vào mục "Tìm dự án" để ứng tuyển!
              </div>
            ) : (
              activeJobs.map((job) => {
                const isExpanded = expandedJobId === job.id;
                const isDelivered = !!job.delivery_link;

                return (
                  <div
                    key={job.id}
                    className="p-4 border border-hairline rounded-lg hover:border-brand-green/20 transition-all flex flex-col gap-3 bg-surface-soft"
                  >
                    <div className="flex items-center justify-between gap-4 w-full">
                      <div className="space-y-1 overflow-hidden flex-1">
                        <h4 className="text-xs font-bold text-ink truncate">
                          {job.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-steel">
                          <span className="px-2 py-0.5 bg-canvas text-stone border border-hairline rounded font-mono text-[9px]">
                            {renderCategoryIcon(job.category)}
                          </span>
                          <span>•</span>
                          <span className="font-semibold text-charcoal">
                            Ngân sách: {job.budget_amount.toLocaleString("vi-VN")} ₫
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                        {isDelivered && (
                          <>
                            <span className="text-[9px] font-bold text-brand-green bg-brand-green/10 border border-brand-green/20 px-2 py-0.5 rounded flex items-center gap-0.5">
                              <Check className="w-3 h-3" /> Đã nộp sản phẩm
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const isOpening = activeReviewJobId !== job.id;
                                setActiveReviewJobId(isOpening ? job.id : null);
                                if (isOpening) {
                                  setTimeout(() => {
                                    const toolEl = document.getElementById(`video-review-${job.id}`);
                                    if (toolEl) {
                                      gsap.fromTo(
                                        toolEl,
                                        { height: 0, opacity: 0 },
                                        { height: "auto", opacity: 1, duration: 0.4, ease: "power2.out" }
                                      );
                                    }
                                  }, 50);
                                }
                              }}
                              className={`h-8 px-3.5 border rounded-full text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                activeReviewJobId === job.id
                                  ? "bg-charcoal text-on-dark border-charcoal"
                                  : "bg-surface border-hairline text-charcoal hover:bg-canvas"
                              }`}
                            >
                              <Video className="w-3.5 h-3.5" />
                              {activeReviewJobId === job.id ? "Đóng phản hồi" : "Xem phản hồi (Timestamp)"}
                            </button>
                          </>
                        )}
                        
                        <button
                          onClick={() => toggleExpand(job.id)}
                          className={`h-8 px-4 border rounded-full text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                            isDelivered
                              ? "border-hairline text-stone hover:text-ink hover:border-steel bg-canvas"
                              : "border-brand-green/30 text-brand-green bg-brand-green/5 hover:bg-brand-green/10"
                          }`}
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          {isDelivered ? "Cập nhật sản phẩm" : "Nộp sản phẩm"}
                        </button>
                      </div>
                    </div>

                    {/* GSAP Expandable Drawer */}
                    {isExpanded && (
                      <div
                        id={`delivery-form-${job.id}`}
                        className="overflow-hidden border-t border-hairline-soft pt-4 space-y-4"
                        style={{ height: 0, opacity: 0 }}
                      >
                        <form onSubmit={(e) => handleDeliverableSubmit(e, job.id)} className="space-y-4">
                          {submitError && (
                            <div className="p-3 bg-brand-error/10 border border-brand-error/20 text-[10px] text-brand-error font-medium rounded flex items-center gap-1.5">
                              <AlertCircle className="w-4 h-4 shrink-0" /> {submitError}
                            </div>
                          )}

                          {isDelivered && (
                            <div className="p-3 bg-brand-green/5 border border-brand-green/15 text-[10px] text-brand-green rounded space-y-1">
                              <p className="font-bold flex items-center gap-1">
                                <Link2 className="w-3.5 h-3.5" /> Đường dẫn đã nộp trước đó:
                              </p>
                              <a
                                href={job.delivery_link || "#"}
                                target="_blank"
                                rel="noreferrer"
                                className="underline font-mono truncate block text-[10px] hover:text-brand-green-deep"
                              >
                                {job.delivery_link}
                              </a>
                            </div>
                          )}

                          <div>
                            <label className="block text-[9px] font-bold text-steel uppercase tracking-wider mb-1.5">
                              Đường dẫn sản phẩm (Google Drive, Youtube nháp, Dropbox...)
                            </label>
                            <input
                              type="url"
                              required
                              value={formLink}
                              onChange={(e) => setFormLink(e.target.value)}
                              placeholder="https://drive.google.com/file/d/..."
                              className="w-full h-9 px-3 bg-canvas text-charcoal border border-hairline rounded text-xs focus:border-brand-green focus:outline-none transition-colors"
                              disabled={isSubmitPending}
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] font-bold text-steel uppercase tracking-wider mb-1.5">
                              Ghi chú nghiệm thu gửi Nhà sáng tạo (không bắt buộc)
                            </label>
                            <textarea
                              rows={3}
                              value={formNote}
                              onChange={(e) => setFormNote(e.target.value)}
                              placeholder="Mô tả các chỉnh sửa chính, pass giải nén file hoặc ghi chú feedback..."
                              className="w-full p-2.5 bg-canvas text-charcoal border border-hairline rounded text-xs focus:border-brand-green focus:outline-none transition-colors leading-relaxed"
                              disabled={isSubmitPending}
                            />
                          </div>

                          <div className="flex justify-end gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => toggleExpand(job.id)}
                              className="h-8 px-4 border border-hairline text-stone hover:text-ink rounded-full text-[10px] font-bold transition-colors cursor-pointer"
                              disabled={isSubmitPending}
                            >
                              Hủy bỏ
                            </button>
                            <button
                              type="submit"
                              className="h-8 px-5 bg-ink text-on-dark hover:bg-brand-green hover:text-canvas rounded-full text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                              disabled={isSubmitPending}
                            >
                              {isSubmitPending ? (
                                <>
                                  <span className="animate-spin inline-block w-3 h-3 border border-on-dark border-t-transparent rounded-full" />
                                  Đang gửi...
                                </>
                              ) : (
                                "Nộp sản phẩm bàn giao"
                              )}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                    {/* Video Review Tool Panel */}
                    {activeReviewJobId === job.id && (
                      <div 
                        id={`video-review-${job.id}`}
                        className="overflow-hidden border-t border-hairline-soft pt-3"
                        style={{ height: 0, opacity: 0 }}
                      >
                        <VideoReviewTool
                          jobId={job.id}
                          deliveryLink={job.delivery_link || ""}
                          currentUserRole="freelancer"
                          currentUserName={currentUser?.fullName || "Hoàng Minh (Editor)"}
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: Recent Proposals */}
        <div className="overview-grid bg-canvas border border-hairline rounded-lg shadow-sm p-6 lg:col-span-5 flex flex-col" style={{ opacity: 0 }}>
          <div className="flex items-center justify-between mb-6 border-b border-hairline-soft pb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-steel" /> Đề xuất gần đây
            </h3>
            <Link
              href="/freelancer/proposals"
              className="text-[11px] text-steel hover:text-brand-green font-semibold hover:underline"
            >
              Xem tất cả →
            </Link>
          </div>

          <div className="flex-1 space-y-4">
            {proposals.length === 0 ? (
              <div className="text-center py-12 text-xs text-stone">
                Bạn chưa gửi báo giá ứng tuyển nào.
              </div>
            ) : (
              proposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className="p-4 border border-hairline-soft rounded-lg flex flex-col gap-2 hover:border-brand-green-soft transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-ink truncate max-w-[180px]">{proposal.job_title}</h4>
                    <span className="text-xs font-mono font-bold text-brand-green shrink-0">
                      {proposal.bid_amount.toLocaleString("vi-VN")} ₫
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-hairline-soft/50">
                    <span className="text-[9px] text-stone">Nộp ngày: {proposal.created_at}</span>
                    <span
                      className={`text-[9px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                        proposal.status === "accepted"
                          ? "bg-brand-green/10 text-brand-green border border-brand-green/20"
                          : proposal.status === "rejected"
                          ? "bg-brand-error/10 text-brand-error border border-brand-error/20"
                          : "bg-stone/10 text-stone border border-stone/20"
                      }`}
                    >
                      {proposal.status === "accepted" ? (
                        <>
                          <CheckCircle2 className="w-2.5 h-2.5" /> Được nhận
                        </>
                      ) : proposal.status === "rejected" ? (
                        <>
                          <XCircle className="w-2.5 h-2.5" /> Từ chối
                        </>
                      ) : (
                        "Đang duyệt"
                      )}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
