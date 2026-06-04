"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { Rocket, Video, FileText, Image, Settings } from "lucide-react";

interface Job {
  id: string;
  title: string;
  category: string;
  budget_amount: number;
  status: string;
  created_at: string;
  proposals_count: number;
}

interface Proposal {
  id: string;
  job_title: string;
  freelancer_name: string;
  bid_amount: number;
  cover_letter: string;
  status: string;
  created_at: string;
}

interface OverviewProps {
  jobs: Job[];
  proposals: Proposal[];
  stats: {
    totalJobs: number;
    pendingProposals: number;
    escrowAmount: number;
    activeContracts: number;
  };
}

export default function CreatorOverview({ jobs, proposals, stats }: OverviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Animate metrics cards (Stagger & Count up)
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

  return (
    <div ref={containerRef} className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-canvas-dark text-on-dark p-8 rounded-lg relative overflow-hidden flex items-center justify-between border border-stone/10 shadow-sm">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#00d4a4_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="relative z-10 space-y-2">
          <h2 className="text-xl font-bold tracking-tight md:text-2xl flex items-center gap-2">
            Tải lên dự án của bạn ngay hôm nay <Rocket className="w-5 h-5 text-brand-green inline-block" />
          </h2>
          <p className="text-xs text-on-dark-muted max-w-lg">
            Tìm kiếm Editor chuyên nghiệp nhất, thanh toán an toàn qua cơ chế Tạm giữ (Escrow) và phản hồi kịch bản trực tiếp trên timeline.
          </p>
        </div>
        
        <div className="relative z-10 shrink-0">
          <Link
            href="/creator/jobs/new"
            className="inline-flex h-10 items-center justify-center bg-brand-green text-canvas text-xs font-semibold px-6 rounded-full hover:bg-brand-green-deep transition-all hover:scale-105 active:scale-95 shadow-md"
          >
            Đăng tin tuyển dụng mới
          </Link>
        </div>
      </div>

      {/* Grid Chỉ Số (Metrics Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1 */}
        <div className="stat-card bg-canvas border border-hairline p-6 rounded-lg shadow-sm flex flex-col justify-between" style={{ opacity: 0 }}>
          <span className="text-[10px] font-semibold text-steel uppercase tracking-widest">Dự án đang tuyển</span>
          <h3 className="count-number text-2xl font-bold text-ink mt-3 font-mono" data-target={stats.totalJobs}>0</h3>
          <span className="text-[10px] text-stone mt-2 block">Dự án công khai nhận báo giá</span>
        </div>

        {/* Card 2 */}
        <div className="stat-card bg-canvas border border-hairline p-6 rounded-lg shadow-sm flex flex-col justify-between" style={{ opacity: 0 }}>
          <span className="text-[10px] font-semibold text-steel uppercase tracking-widest">Báo giá chờ duyệt</span>
          <h3 className="count-number text-2xl font-bold text-ink mt-3 font-mono" data-target={stats.pendingProposals}>0</h3>
          <span className="text-[10px] text-brand-green font-semibold mt-2 block">Cơ hội làm việc sắp tới</span>
        </div>

        {/* Card 3 */}
        <div className="stat-card bg-canvas border border-hairline p-6 rounded-lg shadow-sm flex flex-col justify-between" style={{ opacity: 0 }}>
          <span className="text-[10px] font-semibold text-steel uppercase tracking-widest">Ví tạm giữ (Escrow)</span>
          <h3 className="count-number currency text-2xl font-bold text-ink mt-3 font-mono" data-target={stats.escrowAmount}>0</h3>
          <span className="text-[10px] text-stone mt-2 block">Tiền được bảo hiểm an toàn</span>
        </div>

        {/* Card 4 */}
        <div className="stat-card bg-canvas border border-hairline p-6 rounded-lg shadow-sm flex flex-col justify-between" style={{ opacity: 0 }}>
          <span className="text-[10px] font-semibold text-steel uppercase tracking-widest">Hợp đồng đang chạy</span>
          <h3 className="count-number text-2xl font-bold text-ink mt-3 font-mono" data-target={stats.activeContracts}>0</h3>
          <span className="text-[10px] text-stone mt-2 block">Freelancer đang tiến hành làm</span>
        </div>
      </div>

      {/* Grid Nội dung chính */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Cột trái: Dự án gần đây */}
        <div className="overview-grid bg-canvas border border-hairline rounded-lg shadow-sm p-6 lg:col-span-7 flex flex-col" style={{ opacity: 0 }}>
          <div className="flex items-center justify-between mb-6 border-b border-hairline-soft pb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink">Dự án đã đăng</h3>
            <Link href="/creator/jobs" className="text-[11px] text-steel hover:text-brand-green font-semibold hover:underline">
              Tất cả dự án →
            </Link>
          </div>

          <div className="flex-1 space-y-4">
            {jobs.length === 0 ? (
              <div className="text-center py-12 text-xs text-stone">
                Bạn chưa đăng dự án nào. Hãy bấm nút Đăng tin mới!
              </div>
            ) : (
              jobs.map((job) => (
                <div
                  key={job.id}
                  className="p-4 border border-hairline-soft rounded-lg hover:border-brand-green/30 transition-colors flex items-center justify-between gap-4 group"
                >
                  <div className="space-y-1 overflow-hidden">
                    <h4 className="text-xs font-bold text-ink group-hover:text-brand-green transition-colors truncate">
                      {job.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] text-steel">
                      <span className="px-2 py-0.5 bg-surface text-stone border border-hairline rounded font-mono text-[9px] inline-flex items-center gap-1">
                        {job.category === "video-edit" ? (
                          <>
                            <Video className="w-2.5 h-2.5 text-brand-green" /> Dựng video
                          </>
                        ) : job.category === "script" ? (
                          <>
                            <FileText className="w-2.5 h-2.5 text-brand-tag" /> Kịch bản
                          </>
                        ) : job.category === "thumbnail" ? (
                          <>
                            <Image className="w-2.5 h-2.5 text-amber-500" /> Thumbnail
                          </>
                        ) : (
                          <>
                            <Settings className="w-2.5 h-2.5 text-stone" /> Khác
                          </>
                        )}
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-charcoal">
                        {job.budget_amount.toLocaleString("vi-VN")} ₫
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-3">
                    <span className="text-[10px] font-mono text-stone">
                      {job.proposals_count} báo giá
                    </span>
                    <span
                      className={`text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full ${
                        job.status === "open"
                          ? "bg-brand-green/10 text-brand-green border border-brand-green/20"
                          : job.status === "in-progress"
                          ? "bg-brand-tag/10 text-brand-tag border border-brand-tag/20"
                          : "bg-stone/10 text-stone border border-stone/20"
                      }`}
                    >
                      {job.status === "open"
                        ? "Đang tuyển"
                        : job.status === "in-progress"
                        ? "Đang làm"
                        : "Xong"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cột phải: Báo giá mới nhận */}
        <div className="overview-grid bg-canvas border border-hairline rounded-lg shadow-sm p-6 lg:col-span-5 flex flex-col" style={{ opacity: 0 }}>
          <div className="flex items-center justify-between mb-6 border-b border-hairline-soft pb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink">Báo giá mới nhận</h3>
            <span className="text-[10px] text-stone bg-surface px-2 py-0.5 border border-hairline rounded">Mới</span>
          </div>

          <div className="flex-1 space-y-4">
            {proposals.length === 0 ? (
              <div className="text-center py-12 text-xs text-stone">
                Chưa nhận được báo giá nào từ Freelancers.
              </div>
            ) : (
              proposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className="p-4 border border-hairline-soft rounded-lg flex flex-col gap-2 hover:border-brand-green-soft transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-ink">{proposal.freelancer_name}</h4>
                      <p className="text-[9px] text-stone truncate max-w-[200px]">
                        nộp cho: {proposal.job_title}
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-brand-green">
                      {proposal.bid_amount.toLocaleString("vi-VN")} ₫
                    </span>
                  </div>
                  <p className="text-[10px] text-slate line-clamp-2 italic bg-surface/50 p-2 rounded border border-hairline-soft">
                    "{proposal.cover_letter}"
                  </p>
                  <div className="flex justify-end gap-2 mt-1">
                    <Link
                      href="/creator/jobs"
                      className="text-[9px] font-bold text-canvas bg-ink px-3 py-1 rounded-full hover:bg-charcoal transition-colors"
                    >
                      Duyệt báo giá
                    </Link>
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
