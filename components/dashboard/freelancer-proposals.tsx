"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { FileText, CheckCircle2, XCircle, Clock, DollarSign, ExternalLink } from "lucide-react";

interface Proposal {
  id: string;
  job_id: string;
  job_title: string;
  bid_amount: number;
  cover_letter: string;
  status: string;
  created_at: string;
}

interface ProposalsProps {
  proposals: Proposal[];
}

export default function FreelancerProposals({ proposals }: ProposalsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = containerRef.current?.querySelectorAll(".proposal-card");
      if (cards && cards.length > 0) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 25 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: "power3.out" }
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-ink">Báo giá của bạn</h2>
        <p className="text-xs text-steel">
          Theo dõi trạng thái các báo giá ứng tuyển mà bạn đã gửi cho các Creator.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {proposals.length === 0 ? (
          <div className="text-center py-16 bg-canvas border border-dashed border-hairline rounded-lg text-xs text-stone">
            Bạn chưa gửi báo giá ứng tuyển nào.
            <div className="mt-4">
              <Link
                href="/jobs"
                className="inline-flex h-9 items-center justify-center bg-ink text-on-dark text-xs font-semibold px-5 rounded-full hover:bg-charcoal transition-colors"
              >
                Khám phá công việc
              </Link>
            </div>
          </div>
        ) : (
          proposals.map((proposal) => (
            <div
              key={proposal.id}
              className="proposal-card bg-canvas border border-hairline rounded-lg p-6 shadow-sm hover:border-brand-green/30 transition-all flex flex-col justify-between gap-4"
              style={{ opacity: 0 }}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-hairline-soft pb-4">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-ink flex items-center gap-1.5 hover:text-brand-green transition-colors">
                    {proposal.job_title}
                  </h3>
                  <div className="flex items-center gap-3 text-[10px] text-steel">
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-3.5 h-3.5" /> Nộp ngày {proposal.created_at}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5 text-charcoal font-semibold font-mono">
                      <DollarSign className="w-3.5 h-3.5" /> {proposal.bid_amount.toLocaleString("vi-VN")} ₫
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  <Link
                    href={`/jobs/${proposal.job_id}`}
                    className="h-8 px-4 border border-hairline text-stone hover:text-ink hover:border-steel rounded-full text-[10px] font-bold transition-colors inline-flex items-center gap-1"
                  >
                    Xem dự án <ExternalLink className="w-3 h-3" />
                  </Link>

                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1 ${
                      proposal.status === "accepted"
                        ? "bg-brand-green/10 text-brand-green border border-brand-green/20"
                        : proposal.status === "rejected"
                        ? "bg-brand-error/10 text-brand-error border border-brand-error/20"
                        : "bg-stone/10 text-stone border border-stone/20"
                    }`}
                  >
                    {proposal.status === "accepted" ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" /> Được nhận
                      </>
                    ) : proposal.status === "rejected" ? (
                      <>
                        <XCircle className="w-3 h-3" /> Từ chối
                      </>
                    ) : (
                      "Chờ duyệt"
                    )}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[9px] uppercase font-bold text-steel block">
                  Thư giới thiệu / Đề xuất của bạn:
                </span>
                <p className="text-xs text-charcoal leading-relaxed whitespace-pre-line italic bg-surface p-4 rounded border border-hairline-soft">
                  "{proposal.cover_letter}"
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
