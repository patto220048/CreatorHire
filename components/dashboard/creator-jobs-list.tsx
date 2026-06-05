"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { updateProposalStatusAction, releaseEscrowAction } from "@/app/(dashboard)/creator/jobs/actions";
import { getSupabaseClient } from "@/lib/supabase/client";
import VideoReviewTool from "@/components/dashboard/video-review-tool";
import { 
  Video, 
  FileText, 
  Image, 
  Settings, 
  Play, 
  Radio, 
  CheckCircle2,
  ExternalLink,
  Coins,
  Clock
} from "lucide-react";

interface Job {
  id: string;
  title: string;
  category: string;
  budget_amount: number;
  budget_type: string;
  status: string;
  created_at: string;
  delivery_link?: string | null;
  delivery_note?: string | null;
}

interface Proposal {
  id: string;
  job_id: string;
  freelancer_name: string;
  bid_amount: number;
  cover_letter: string;
  status: string;
  created_at: string;
}

interface JobsListProps {
  jobs: Job[];
  proposals: Proposal[];
}

export default function CreatorJobsList({ jobs, proposals }: JobsListProps) {
  const router = useRouter();
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ fullName: string; role: "creator" | "freelancer" } | null>(null);
  const [activeReviewJobId, setActiveReviewJobId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = await getSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUser({
            fullName: user.user_metadata?.full_name || "Nhà sáng tạo",
            role: user.user_metadata?.role || "creator",
          });
        }
      } catch (e) {}
    };
    fetchUser();
  }, []);

  const handleReleaseEscrow = (jobId: string) => {
    setActionError(null);
    const cardEl = document.getElementById(`in-progress-card-${jobId}`);

    startTransition(async () => {
      try {
        const res = await releaseEscrowAction(jobId);
        if (res && res.error) {
          setActionError(res.error);
        } else if (res && res.success) {
          if (cardEl) {
            // Flash color
            gsap.to(cardEl, {
              backgroundColor: "rgba(0, 212, 164, 0.1)",
              borderColor: "#00d4a4",
              duration: 0.3
            });
            // Slide up and shrink
            gsap.to(cardEl, {
              y: -30,
              opacity: 0,
              scale: 0.95,
              height: 0,
              padding: 0,
              marginTop: 0,
              marginBottom: 0,
              duration: 0.5,
              delay: 0.3,
              ease: "power2.inOut",
              onComplete: () => {
                setSuccessMessage("Giải ngân ký quỹ thành công! Dự án đã hoàn tất.");
                router.refresh();
                setTimeout(() => setSuccessMessage(null), 3000);
              }
            });
          } else {
            setSuccessMessage("Giải ngân ký quỹ thành công! Dự án đã hoàn tất.");
            router.refresh();
            setTimeout(() => setSuccessMessage(null), 3000);
          }
        }
      } catch (err) {
        setActionError("Lỗi kết nối giải ngân.");
      }
    });
  };

  const listRef = useRef<HTMLDivElement>(null);
  const detailsRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    // 1. Entrance animation cho các thẻ job
    const ctx = gsap.context(() => {
      const cards = listRef.current?.querySelectorAll(".job-card");
      if (cards && cards.length > 0) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 25 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power3.out" }
        );
      }
    }, listRef);

    return () => ctx.revert();
  }, []);

  // Điều khiển đóng/mở rộng danh sách proposals của Job
  const toggleExpand = (jobId: string) => {
    const el = detailsRefs.current[jobId];
    if (!el) return;

    if (expandedJobId === jobId) {
      // Đang mở -> Đóng lại
      gsap.to(el, {
        height: 0,
        opacity: 0,
        duration: 0.4,
        ease: "power2.inOut",
        onComplete: () => setExpandedJobId(null),
      });
    } else {
      // Đang đóng hoặc đang mở job khác -> Đóng job cũ nếu có
      if (expandedJobId && detailsRefs.current[expandedJobId]) {
        gsap.to(detailsRefs.current[expandedJobId]!, {
          height: 0,
          opacity: 0,
          duration: 0.3,
          ease: "power2.inOut",
        });
      }

      setExpandedJobId(jobId);
      // Mở rộng job mới
      gsap.fromTo(
        el,
        { height: 0, opacity: 0 },
        { height: "auto", opacity: 1, duration: 0.5, ease: "power3.out" }
      );
    }
  };

  const handleProposalAction = (
    proposalId: string,
    jobId: string,
    action: "accepted" | "rejected"
  ) => {
    setActionError(null);
    const itemEl = document.getElementById(`proposal-card-${proposalId}`);

    if (action === "accepted") {
      // Chuyển hướng sang trang checkout ký quỹ
      router.push(`/checkout/${proposalId}`);
      return;
    }

    startTransition(async () => {
      // Chạy hiệu ứng mờ đi trước khi gọi API
      if (itemEl) {
        gsap.to(itemEl, { opacity: 0.5, scale: 0.98, duration: 0.2 });
      }

      const result = await updateProposalStatusAction(proposalId, jobId, action);
      
      if (result && result.error) {
        setActionError(result.error);
        if (itemEl) {
          gsap.to(itemEl, { opacity: 1, scale: 1, duration: 0.2 });
        }
      } else {
        // Hiệu ứng hoàn thành thành công
        if (itemEl) {
          // Bay sang phải và biến mất (đối với proposal bị từ chối)
          gsap.to(itemEl, {
            x: 100,
            opacity: 0,
            height: 0,
            padding: 0,
            marginTop: 0,
            marginBottom: 0,
            duration: 0.4,
            ease: "power3.in",
          });
        }
      }
    });
  };

  // Nhóm các công việc theo trạng thái
  const openJobs = jobs.filter((j) => j.status === "open");
  const inProgressJobs = jobs.filter((j) => j.status === "in-progress");
  const completedJobs = jobs.filter((j) => j.status === "completed");

  const renderJobCategory = (cat: string) => {
    switch (cat) {
      case "video-edit":
        return (
          <span className="inline-flex items-center gap-1">
            <Video className="w-3 h-3 text-brand-green" /> Dựng video
          </span>
        );
      case "script":
        return (
          <span className="inline-flex items-center gap-1">
            <FileText className="w-3 h-3 text-brand-tag" /> Kịch bản
          </span>
        );
      case "thumbnail":
        return (
          <span className="inline-flex items-center gap-1">
            <Image className="w-3 h-3 text-amber-500" /> Thumbnail
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1">
            <Settings className="w-3 h-3 text-stone" /> Khác
          </span>
        );
    }
  };

  return (
    <div ref={listRef} className="space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-ink">Dự án của bạn</h2>
          <p className="text-xs text-steel">
            Xem, quản lý trạng thái dự án và duyệt các đề xuất từ đối tác.
          </p>
        </div>
      </div>

      {actionError && (
        <div className="p-4 bg-brand-error/10 border border-brand-error/20 text-xs text-brand-error font-medium rounded-md">
          ⚠️ {actionError}
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-brand-green/10 border border-brand-green/20 text-xs text-brand-green font-medium rounded-md">
          ✔ {successMessage}
        </div>
      )}

      {/* Grid danh sách */}
      <div className="space-y-8">
        {/* Phần 1: Dự án đang thực hiện (In-progress) */}
        {inProgressJobs.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-tag flex items-center gap-2">
              <Play className="w-3.5 h-3.5 fill-brand-tag text-brand-tag" /> Đang thực hiện ({inProgressJobs.length})
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {inProgressJobs.map((job) => {
                const hasDeliverable = !!job.delivery_link;

                return (
                  <div
                    key={job.id}
                    id={`in-progress-card-${job.id}`}
                    className="job-card bg-canvas border border-hairline p-6 rounded-lg shadow-sm space-y-4"
                    style={{ opacity: 0 }}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-hairline-soft pb-4">
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-ink">{job.title}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-steel">
                          <span className="font-semibold text-charcoal">{renderJobCategory(job.category)}</span>
                          <span>•</span>
                          <span className="font-mono">{job.budget_amount.toLocaleString("vi-VN")} ₫ ({job.budget_type === "fixed" ? "Trọn gói" : "Theo giờ"})</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-brand-tag font-semibold bg-brand-tag/10 border border-brand-tag/20 px-3 py-1 rounded-full uppercase tracking-wider">
                          Đang làm việc
                        </span>
                      </div>
                    </div>

                    {/* Delivery & Release Block */}
                    {hasDeliverable ? (
                      <div className="space-y-4">
                        <div className="bg-brand-green/5 border border-brand-green/10 rounded-md p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <span className="text-[9px] font-black text-brand-green uppercase tracking-wider block">
                              Freelancer đã nộp sản phẩm bàn giao:
                            </span>
                            <a
                              href={job.delivery_link || "#"}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-mono font-semibold text-ink hover:underline flex items-center gap-1 truncate"
                            >
                              {job.delivery_link} <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                            </a>
                            {job.delivery_note && (
                              <p className="text-[11px] text-steel italic">
                                "{job.delivery_note}"
                              </p>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 shrink-0">
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
                              className={`h-9 px-4 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                                activeReviewJobId === job.id
                                  ? "bg-charcoal text-on-dark border-charcoal"
                                  : "bg-surface text-charcoal border-hairline hover:bg-canvas"
                              }`}
                            >
                              <Video className="w-3.5 h-3.5" /> 
                              {activeReviewJobId === job.id ? "Đóng phản hồi" : "Duyệt video & sửa nháp (Timestamp)"}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleReleaseEscrow(job.id)}
                              className="h-9 px-5 bg-brand-green text-canvas hover:bg-brand-green-deep rounded-full text-xs font-bold transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-1 cursor-pointer shrink-0"
                              disabled={isPending}
                            >
                              <Coins className="w-4 h-4" /> Giải ngân ký quỹ
                            </button>
                          </div>
                        </div>

                        {/* Video Review Tool Panel */}
                        {activeReviewJobId === job.id && (
                          <div 
                            id={`video-review-${job.id}`}
                            className="overflow-hidden border-t border-hairline-soft pt-4"
                            style={{ height: 0, opacity: 0 }}
                          >
                            <VideoReviewTool
                              jobId={job.id}
                              deliveryLink={job.delivery_link || ""}
                              currentUserRole="creator"
                              currentUserName={currentUser?.fullName || "Huy Nguyễn (Creator)"}
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-surface p-4 rounded border border-hairline-soft text-center text-xs text-stone flex items-center justify-center gap-2">
                        <Clock className="w-4 h-4 text-stone animate-spin" /> Chờ Freelancer nộp sản phẩm bàn giao để tiến hành giải ngân.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Phần 2: Dự án đang tuyển dụng (Open) */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-brand-green animate-pulse" /> Đang tuyển dụng ({openJobs.length})
          </h3>
          {openJobs.length === 0 ? (
            <div className="text-center py-8 bg-canvas/50 border border-dashed border-hairline rounded-lg text-xs text-stone">
              Không có dự án nào đang tuyển dụng.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {openJobs.map((job) => {
                const jobProposals = proposals.filter((p) => p.job_id === job.id);
                const isExpanded = expandedJobId === job.id;

                return (
                  <div
                    key={job.id}
                    className={`job-card bg-canvas border rounded-lg shadow-sm transition-all duration-300 ${
                      isExpanded ? "border-brand-green/30 ring-1 ring-brand-green/5" : "border-hairline"
                    }`}
                    style={{ opacity: 0 }}
                  >
                    {/* Header Thẻ Job */}
                    <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-hairline-soft/30">
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-ink">{job.title}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-steel">
                          <span className="font-semibold text-charcoal">{renderJobCategory(job.category)}</span>
                          <span>•</span>
                          <span className="font-mono">{job.budget_amount.toLocaleString("vi-VN")} ₫</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleExpand(job.id)}
                          className={`h-8 px-4 rounded-full text-[10px] font-bold border transition-colors ${
                            isExpanded
                              ? "bg-brand-green/10 text-brand-green border-brand-green/30"
                              : "bg-canvas text-steel border-hairline hover:border-steel"
                          }`}
                        >
                          {jobProposals.length} báo giá {isExpanded ? "▲" : "▼"}
                        </button>
                      </div>
                    </div>

                    {/* Khung chứa danh sách Proposals dưới dạng trượt xuống */}
                    <div
                      ref={(el) => {
                        detailsRefs.current[job.id] = el;
                      }}
                      className="overflow-hidden"
                      style={{ height: 0, opacity: 0 }}
                    >
                      <div className="p-6 bg-surface/50 border-t border-hairline-soft space-y-4">
                        <h5 className="text-[10px] font-bold uppercase tracking-wider text-steel mb-2">
                          Danh sách ứng viên nộp đề xuất ({jobProposals.length})
                        </h5>

                        {jobProposals.length === 0 ? (
                          <div className="text-center py-6 text-xs text-stone">
                            Chưa có freelancer nào gửi đề xuất cho công việc này.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {jobProposals.map((proposal) => (
                              <div
                                key={proposal.id}
                                id={`proposal-card-${proposal.id}`}
                                className="bg-canvas border border-hairline rounded-lg p-5 flex flex-col gap-3 hover:shadow-sm transition-all"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-hairline-soft pb-3">
                                  <div>
                                    <h6 className="text-xs font-bold text-ink">
                                      {proposal.freelancer_name}
                                    </h6>
                                    <span className="text-[9px] text-stone font-mono">
                                      Nộp ngày {proposal.created_at}
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-xs font-mono font-bold text-brand-green block">
                                      {proposal.bid_amount.toLocaleString("vi-VN")} ₫
                                    </span>
                                    <span className="text-[9px] text-stone">Chi phí đề xuất</span>
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <span className="text-[9px] uppercase tracking-wider font-semibold text-steel block">
                                    Thư giới thiệu:
                                  </span>
                                  <p className="text-[10px] text-charcoal leading-relaxed whitespace-pre-line italic">
                                    "{proposal.cover_letter}"
                                  </p>
                                </div>

                                {/* Hàng nút phê duyệt */}
                                {proposal.status === "pending" && (
                                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-hairline-soft/50">
                                    <button
                                      onClick={() =>
                                        handleProposalAction(proposal.id, job.id, "rejected")
                                      }
                                      className="h-8 px-4 rounded-full border border-hairline text-stone hover:text-brand-error hover:border-brand-error/30 hover:bg-brand-error/5 text-[10px] font-semibold transition-colors"
                                      disabled={isPending}
                                    >
                                      Từ chối
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleProposalAction(proposal.id, job.id, "accepted")
                                      }
                                      className="h-8 px-5 bg-ink text-on-dark rounded-full hover:bg-brand-green hover:text-canvas text-[10px] font-semibold transition-all hover:scale-105"
                                      disabled={isPending}
                                    >
                                      Chấp nhận & Ký Hợp đồng
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Phần 3: Dự án đã hoàn thành (Completed) */}
        {completedJobs.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-stone" /> Đã hoàn thành ({completedJobs.length})
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {completedJobs.map((job) => (
                <div key={job.id} className="job-card bg-canvas border border-hairline p-6 rounded-lg shadow-sm grayscale opacity-75" style={{ opacity: 0 }}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-ink line-through">{job.title}</h4>
                      <div className="flex items-center gap-2 text-[10px] text-steel">
                        <span className="font-semibold text-charcoal">{renderJobCategory(job.category)}</span>
                        <span>•</span>
                        <span className="font-mono">{job.budget_amount.toLocaleString("vi-VN")} ₫</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-stone font-semibold bg-stone/10 border border-stone/20 px-3 py-1 rounded-full uppercase tracking-wider">
                        Đã đóng dự án
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
