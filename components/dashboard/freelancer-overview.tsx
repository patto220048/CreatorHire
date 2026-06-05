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
import ReviewModal from "@/components/dashboard/review-modal";
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
  Video,
  Star,
  Wallet
} from "lucide-react";
import { 
  getWalletAction, 
  getWithdrawalRequestsAction, 
  submitWithdrawalRequestAction 
} from "@/app/api/wallet/actions";

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
  const activeReviewJob = activeJobs.find(j => j.id === activeReviewJobId);

  // States cho hệ thống đánh giá
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewJob, setReviewJob] = useState<{ id: string; title: string; targetId: string; targetName: string } | null>(null);
  const [reviewedJobIds, setReviewedJobIds] = useState<string[]>([]);

  // States cho hệ thống ví và rút tiền
  const [wallet, setWallet] = useState<{ balance: number; pending_balance: number } | null>(null);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loadingWallet, setLoadingWallet] = useState(true);
  
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number | "">("");
  const [bankName, setBankName] = useState("Vietcombank");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);

  const fetchWalletData = async () => {
    try {
      const wRes = await getWalletAction();
      if (wRes.success && wRes.data) {
        setWallet(wRes.data);
      }
      const withRes = await getWithdrawalRequestsAction();
      if (withRes.success && withRes.data) {
        setWithdrawals(withRes.data);
      }
    } catch (e) {
      console.error("Lỗi tải ví:", e);
    } finally {
      setLoadingWallet(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  // GSAP animation cho số dư ví
  useEffect(() => {
    if (wallet) {
      const el = document.getElementById("wallet-balance-number");
      if (el) {
        const currentObj = { val: 0 };
        gsap.to(currentObj, {
          val: wallet.balance,
          duration: 1,
          ease: "power2.out",
          onUpdate: () => {
            el.innerText = Math.round(currentObj.val).toLocaleString("vi-VN") + " ₫";
          }
        });
      }
    }
  }, [wallet]);

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || submittingWithdraw || !wallet) return;

    setWithdrawError(null);
    setSubmittingWithdraw(true);

    try {
      const res = await submitWithdrawalRequestAction(
        Number(withdrawAmount),
        bankName,
        accountNumber,
        accountName
      );
      if (res.error) {
        setWithdrawError(res.error);
      } else {
        setWithdrawSuccess(true);
        fetchWalletData(); // Load lại số dư mới
      }
    } catch (err) {
      setWithdrawError("Có lỗi xảy ra khi gửi yêu cầu.");
    } finally {
      setSubmittingWithdraw(false);
    }
  };

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

  // Tải danh sách các dự án đã được đánh giá
  const fetchReviewedJobs = async () => {
    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                   !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                   (typeof document !== "undefined" && document.cookie.includes("mock-session="));
    if (isMock) {
      try {
        const match = document.cookie.match(/(?:^|; )mock-reviews=([^;]*)/);
        if (match) {
          const reviews = JSON.parse(decodeURIComponent(match[1]));
          const reviewerId = "mock-user-123";
          const ids = reviews
            .filter((r: any) => r.reviewer_id === reviewerId)
            .map((r: any) => r.job_id);
          setReviewedJobIds(ids);
        }
      } catch (e) {}
    } else {
      try {
        const supabase = await getSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from("reviews")
            .select("job_id")
            .eq("reviewer_id", user.id);
          if (data) {
            setReviewedJobIds(data.map((r: any) => r.job_id));
          }
        }
      } catch (e) {}
    }
  };

  useEffect(() => {
    fetchReviewedJobs();
  }, [activeJobs]);

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
            {activeJobs.filter(j => j.status === "in-progress").length === 0 ? (
              <div className="text-center py-12 text-xs text-stone">
                Bạn chưa tham gia dự án nào. Hãy vào mục "Tìm dự án" để ứng tuyển!
              </div>
            ) : (
              activeJobs
                .filter(j => j.status === "in-progress")
                .map((job) => {
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
                              onClick={() => setActiveReviewJobId(job.id)}
                              className="h-8 px-3.5 border rounded-full text-[10px] font-bold bg-surface border-hairline text-charcoal hover:bg-canvas cursor-pointer flex items-center gap-1.5"
                            >
                              <Video className="w-3.5 h-3.5" /> Xem phản hồi (Timestamp)
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
                  </div>
                );
              })
            )}
          </div>

          {/* Công việc đã hoàn thành (Completed Jobs) */}
          {activeJobs.filter(j => j.status === "completed").length > 0 && (
            <div className="mt-8 pt-6 border-t border-hairline-soft space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-stone" /> Dự án đã hoàn thành
                </h3>
                <span className="text-[10px] font-semibold text-stone bg-surface px-2 py-0.5 border border-hairline rounded font-mono">Done</span>
              </div>
              <div className="space-y-4">
                {activeJobs
                  .filter(j => j.status === "completed")
                  .map((job) => {
                    const isReviewed = reviewedJobIds.includes(job.id);
                    return (
                      <div
                        key={job.id}
                        className="p-4 border border-hairline rounded-lg hover:border-brand-green/20 transition-all flex flex-col gap-3 bg-surface/30 opacity-90"
                      >
                        <div className="flex items-center justify-between gap-4 w-full">
                          <div className="space-y-1 overflow-hidden flex-1">
                            <h4 className="text-xs font-bold text-ink line-through truncate">
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

                          <div className="flex items-center gap-2.5 shrink-0">
                            {isReviewed ? (
                              <span className="text-[9px] font-bold text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 rounded-full uppercase tracking-wider">
                                ★ Đã đánh giá
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  setReviewJob({
                                    id: job.id,
                                    title: job.title,
                                    targetId: (job as any).creator_id || "mock-creator-123",
                                    targetName: (job as any).creator_name || "Huy Nguyễn (Creator)"
                                  });
                                  setIsReviewOpen(true);
                                }}
                                className="h-8 px-4 bg-brand-green text-canvas hover:bg-brand-green-deep rounded-full text-[10px] font-bold transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                              >
                                ⭐ Đánh giá Creator
                              </button>
                            )}
                            <span className="text-[9px] font-bold text-stone bg-stone/10 border border-stone/20 px-2 py-0.5 rounded">
                              Hoàn tất
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {/* Right column: Recent Proposals & Wallet */}
        <div className="lg:col-span-5 space-y-8 flex flex-col">
          {/* Recent Proposals Card */}
          <div className="stat-card bg-canvas border border-hairline rounded-lg shadow-sm p-6 flex flex-col" style={{ opacity: 0 }}>
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

          {/* Wallet & Withdrawal Card */}
          <div className="stat-card bg-canvas border border-hairline rounded-lg shadow-sm p-6 flex flex-col" style={{ opacity: 0 }}>
            <div className="flex items-center justify-between mb-6 border-b border-hairline-soft pb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-2">
                <Wallet className="w-3.5 h-3.5 text-brand-green" /> Ví & Thu nhập
              </h3>
              <span className="text-[10px] font-mono font-bold text-steel bg-surface border border-hairline px-2 py-0.5 rounded">
                Giao dịch
              </span>
            </div>

            <div className="space-y-5 flex-1">
              {/* Balances Display */}
              <div className="grid grid-cols-2 gap-4 bg-surface/40 p-4 rounded-lg border border-hairline-soft/80">
                <div className="text-left">
                  <span className="text-[9px] font-semibold text-steel uppercase tracking-widest block">Số dư khả dụng</span>
                  <span id="wallet-balance-number" className="text-sm font-bold text-ink block mt-1.5 font-mono">
                    {wallet ? wallet.balance.toLocaleString("vi-VN") : "0"} ₫
                  </span>
                </div>
                <div className="text-left border-l border-hairline-soft/60 pl-4">
                  <span className="text-[9px] font-semibold text-steel uppercase tracking-widest block">Tạm giữ (Escrow)</span>
                  <span className="text-sm font-bold text-slate block mt-1.5 font-mono">
                    {wallet ? wallet.pending_balance.toLocaleString("vi-VN") : "0"} ₫
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => {
                  if (wallet && wallet.balance > 0) {
                    setIsWithdrawOpen(true);
                  }
                }}
                disabled={!wallet || wallet.balance === 0}
                className="w-full h-10 bg-ink hover:bg-brand-green hover:text-canvas text-on-dark text-xs font-semibold rounded-full flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                💸 Yêu cầu Rút tiền về Ngân hàng
              </button>

              {/* Withdrawal Requests Log */}
              <div className="space-y-3 pt-3 border-t border-hairline-soft/50">
                <span className="text-[9px] font-bold text-steel uppercase tracking-wider block text-left">Lịch sử rút tiền</span>
                {withdrawals.length === 0 ? (
                  <div className="text-center py-4 text-[10px] text-stone italic">
                    Chưa có giao dịch rút tiền nào.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-custom">
                    {withdrawals.map((req) => (
                      <div
                        key={req.id}
                        className="p-3 border border-hairline-soft/60 rounded-md bg-surface/20 flex items-center justify-between text-left"
                      >
                        <div className="space-y-1">
                          <h5 className="text-[10px] font-bold text-ink">
                            Rút về {req.bank_name}
                          </h5>
                          <p className="text-[8px] text-stone">
                            STK: {req.account_number} • {new Date(req.created_at).toLocaleDateString("vi-VN")}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <span className="text-[10px] font-mono font-bold text-charcoal block">
                            -{req.amount.toLocaleString("vi-VN")} ₫
                          </span>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full inline-block ${
                            req.status === "approved"
                              ? "bg-brand-green/10 text-brand-green border border-brand-green/20"
                              : req.status === "rejected"
                              ? "bg-brand-error/10 text-brand-error border border-brand-error/20"
                              : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                          }`}>
                            {req.status === "approved" ? "Thành công" : req.status === "rejected" ? "Từ chối" : "Đang chờ"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Popup cho Review Tool */}
      {activeReviewJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-modal-backdrop">
          <div className="bg-canvas border border-hairline w-full max-w-6xl h-[85vh] rounded-xl shadow-2xl overflow-hidden flex flex-col animate-modal-box">
            {/* Header */}
            <div className="bg-surface border-b border-hairline p-4 flex items-center justify-between">
              <div className="space-y-0.5 text-left">
                <h3 className="text-xs font-black text-ink truncate max-w-[70vw] uppercase tracking-wider">
                  {activeReviewJob.delivery_link?.toLowerCase().match(/\.(png|jpg|jpeg|webp|gif|svg)/) || activeReviewJob.delivery_link?.includes("unsplash") || activeReviewJob.delivery_link?.includes("mock-image") 
                    ? "🖼️ Xem bản thảo ảnh & góp ý" 
                    : activeReviewJob.delivery_link?.toLowerCase().match(/\.(pdf)/) || activeReviewJob.delivery_link?.includes("docs.google.com") || activeReviewJob.delivery_link?.includes("drive.google.com") || activeReviewJob.delivery_link?.includes("kich-ban") || activeReviewJob.delivery_link?.includes("script") || activeReviewJob.delivery_link?.includes("mock-doc")
                      ? "📝 Xem kịch bản & phản hồi tài liệu" 
                      : "🎬 Xem video nháp & góp ý mốc thời gian"}
                </h3>
                <p className="text-[10px] text-steel truncate max-w-[70vw]">
                  Dự án: <strong className="text-charcoal">{activeReviewJob.title}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveReviewJobId(null)}
                className="h-8 w-8 rounded-full border border-hairline bg-surface hover:bg-canvas text-stone hover:text-ink transition-all flex items-center justify-center font-bold text-xs cursor-pointer shadow-sm active:scale-95"
              >
                ✕
              </button>
            </div>
            {/* Content */}
            <div className="flex-1 overflow-hidden p-5 bg-surface-soft min-h-0">
              <VideoReviewTool
                jobId={activeReviewJob.id}
                deliveryLink={activeReviewJob.delivery_link || ""}
                currentUserRole="freelancer"
                currentUserName={currentUser?.fullName || "Hoàng Minh (Editor)"}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal Đánh giá Creator */}
      {reviewJob && (
        <ReviewModal
          isOpen={isReviewOpen}
          onClose={() => {
            setIsReviewOpen(false);
            setReviewJob(null);
          }}
          jobId={reviewJob.id}
          jobTitle={reviewJob.title}
          revieweeId={reviewJob.targetId}
          revieweeName={reviewJob.targetName}
          onSubmitSuccess={() => {
            fetchReviewedJobs();
          }}
        />
      )}

      {/* Modal Rút tiền về Ngân hàng */}
      {isWithdrawOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-modal-backdrop">
          <div className="bg-canvas border border-hairline w-full max-w-md rounded-xl shadow-2xl overflow-hidden flex flex-col p-6 animate-modal-box">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-hairline-soft pb-3.5 mb-5">
              <h3 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                💸 Yêu cầu Rút tiền
              </h3>
              <button
                onClick={() => {
                  setIsWithdrawOpen(false);
                  setWithdrawError(null);
                  setWithdrawSuccess(false);
                }}
                className="w-7 h-7 rounded-full border border-hairline bg-surface hover:bg-canvas text-stone hover:text-ink flex items-center justify-center font-bold text-xs cursor-pointer active:scale-90 transition-transform animate-hover"
              >
                ✕
              </button>
            </div>

            {withdrawSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-12 h-12 bg-brand-green/10 text-brand-green rounded-full flex items-center justify-center mx-auto text-xl border border-brand-green/20">
                  ✓
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-ink uppercase tracking-wider">Gửi yêu cầu thành công</h4>
                  <p className="text-[10px] text-slate px-4 leading-relaxed">
                    Hệ thống đã ghi nhận yêu cầu rút {Number(withdrawAmount).toLocaleString("vi-VN")} ₫. Số dư của bạn đã được cập nhật và tiền sẽ được chuyển khoản trong vòng 24 giờ.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsWithdrawOpen(false);
                    setWithdrawSuccess(false);
                    fetchWalletData();
                  }}
                  className="px-6 h-9 bg-ink hover:bg-brand-green hover:text-canvas text-on-dark text-[10px] font-bold rounded-full cursor-pointer transition-colors"
                >
                  Đóng cửa sổ
                </button>
              </div>
            ) : (
              <form onSubmit={handleWithdrawSubmit} className="space-y-4 text-left">
                {withdrawError && (
                  <div className="p-3 bg-brand-error/10 border border-brand-error/20 text-[10px] text-brand-error font-medium rounded flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {withdrawError}
                  </div>
                )}

                {/* Available Balance Info */}
                <div className="p-3 bg-surface rounded border border-hairline flex justify-between items-center">
                  <span className="text-[10px] font-semibold text-steel uppercase tracking-wider">Số dư khả dụng</span>
                  <span className="text-xs font-bold text-brand-green font-mono">
                    {wallet ? wallet.balance.toLocaleString("vi-VN") : "0"} ₫
                  </span>
                </div>

                {/* Bank Select */}
                <div>
                  <label className="block text-[9px] font-bold text-steel uppercase tracking-widest mb-1.5">Ngân hàng nhận tiền</label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full h-9 px-3 py-1.5 bg-surface text-charcoal border border-hairline rounded text-xs focus:border-brand-green focus:outline-none font-medium"
                  >
                    <option value="Vietcombank">Vietcombank (VCB)</option>
                    <option value="Techcombank">Techcombank (TCB)</option>
                    <option value="MB Bank">Military Bank (MB)</option>
                    <option value="VietinBank">VietinBank (CTG)</option>
                    <option value="ACB">ACB Bank (ACB)</option>
                  </select>
                </div>

                {/* Account Number */}
                <div>
                  <label className="block text-[9px] font-bold text-steel uppercase tracking-widest mb-1.5">Số tài khoản</label>
                  <input
                    type="text"
                    required
                    placeholder="Nhập số tài khoản ngân hàng"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full h-9 px-3 py-1.5 bg-surface text-charcoal border border-hairline rounded text-xs focus:border-brand-green focus:outline-none font-mono font-bold"
                  />
                </div>

                {/* Account Name */}
                <div>
                  <label className="block text-[9px] font-bold text-steel uppercase tracking-widest mb-1.5">Tên chủ tài khoản (Không dấu)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: HOANG MINH"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="w-full h-9 px-3 py-1.5 bg-surface text-charcoal border border-hairline rounded text-xs focus:border-brand-green focus:outline-none uppercase font-bold"
                  />
                </div>

                {/* Amount to Withdraw */}
                <div>
                  <label className="block text-[9px] font-bold text-steel uppercase tracking-widest mb-1.5">Số tiền muốn rút (VND)</label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      required
                      min={50000}
                      max={wallet ? wallet.balance : 0}
                      placeholder="Tối thiểu 50,000 ₫"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full h-9 pl-3 pr-12 py-1.5 bg-surface text-charcoal border border-hairline rounded text-xs focus:border-brand-green focus:outline-none font-mono font-bold text-brand-green"
                    />
                    <span className="absolute right-3 text-[10px] font-bold text-stone">VND</span>
                  </div>
                  {/* Quick percentage buttons */}
                  {wallet && wallet.balance > 0 && (
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setWithdrawAmount(Math.floor(wallet.balance * 0.5))}
                        className="px-2 py-0.5 border border-hairline bg-surface hover:bg-canvas rounded text-[8px] font-bold text-steel cursor-pointer"
                      >
                        50% số dư
                      </button>
                      <button
                        type="button"
                        onClick={() => setWithdrawAmount(wallet.balance)}
                        className="px-2 py-0.5 border border-hairline bg-surface hover:bg-canvas rounded text-[8px] font-bold text-steel cursor-pointer"
                      >
                        Rút hết (100%)
                      </button>
                    </div>
                  )}
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submittingWithdraw || !withdrawAmount || Number(withdrawAmount) < 50000 || (wallet ? Number(withdrawAmount) > wallet.balance : false)}
                  className="w-full h-10 bg-ink hover:bg-brand-green hover:text-canvas text-on-dark text-xs font-semibold rounded-full flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
                >
                  {submittingWithdraw ? (
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-canvas border-t-transparent rounded-full" />
                  ) : (
                    "Gửi yêu cầu chuyển khoản"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
