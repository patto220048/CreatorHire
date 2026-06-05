// components/dashboard/review-modal.tsx
// Modal đánh giá đối tác (Creator <-> Freelancer) tích hợp hiệu ứng mượt mà với GSAP

"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { Star, X, AlertCircle, CheckCircle } from "lucide-react";
import { submitReviewAction } from "@/app/api/reviews/actions";
import gsap from "gsap";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
  revieweeId: string;
  revieweeName: string;
  onSubmitSuccess?: () => void;
}

export default function ReviewModal({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  revieweeId,
  revieweeName,
  onSubmitSuccess,
}: ReviewModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  const [isPending, startTransition] = useTransition();

  const backdropRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const starsContainerRef = useRef<HTMLDivElement>(null);

  // GSAP animation khi mở modal
  useEffect(() => {
    if (isOpen) {
      // Đặt lại các trạng thái ban đầu
      setRating(0);
      setComment("");
      setErrorMsg(null);
      setSuccessMsg(null);

      const ctx = gsap.context(() => {
        // Fade in background
        gsap.fromTo(
          backdropRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.3, ease: "power2.out" }
        );

        // Bouncy drop-in cho modal box
        gsap.fromTo(
          modalRef.current,
          { scale: 0.85, y: 30, opacity: 0 },
          { scale: 1, y: 0, opacity: 1, duration: 0.45, ease: "back.out(1.5)", delay: 0.05 }
        );

        // Stagger fade-in cho các ngôi sao đánh giá
        gsap.fromTo(
          ".star-btn",
          { scale: 0, opacity: 0, rotation: -15 },
          { scale: 1, opacity: 1, rotation: 0, duration: 0.4, stagger: 0.05, ease: "back.out(2.5)", delay: 0.2 }
        );
      });

      return () => ctx.revert();
    }
  }, [isOpen]);

  const handleClose = () => {
    // Animation đóng trước khi trigger onClose của parent
    gsap.to(modalRef.current, {
      scale: 0.9,
      y: 20,
      opacity: 0,
      duration: 0.25,
      ease: "power2.in",
    });

    gsap.to(backdropRef.current, {
      opacity: 0,
      duration: 0.25,
      ease: "power2.in",
      onComplete: () => {
        onClose();
      },
    });
  };

  const handleStarClick = (idx: number) => {
    setRating(idx);
    
    // Tạo hiệu ứng scale nảy cho ngôi sao vừa được bấm
    const starBtn = starsContainerRef.current?.querySelector(`.star-btn:nth-child(${idx})`);
    if (starBtn) {
      gsap.fromTo(
        starBtn,
        { scale: 0.8 },
        { scale: 1.35, duration: 0.15, yoyo: true, repeat: 1, ease: "power2.out" }
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setErrorMsg("Vui lòng chọn số sao đánh giá (từ 1 - 5).");
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      try {
        const res = await submitReviewAction(jobId, revieweeId, rating, comment);
        
        if (res.success) {
          setSuccessMsg("Gửi đánh giá thành công! Đang lưu thông tin...");
          
          // Tạo hiệu ứng nổ nhẹ cho icon thành công
          gsap.fromTo(
            ".success-badge",
            { scale: 0.5, rotation: -90 },
            { scale: 1, rotation: 0, duration: 0.5, ease: "elastic.out(1, 0.5)" }
          );

          setTimeout(() => {
            if (onSubmitSuccess) {
              onSubmitSuccess();
            }
            handleClose();
          }, 1500);
        } else {
          setErrorMsg(res.error || "Có lỗi xảy ra khi gửi đánh giá.");
        }
      } catch (err) {
        setErrorMsg("Lỗi hệ thống. Vui lòng kiểm tra lại kết nối.");
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div
        ref={modalRef}
        className="bg-canvas border border-hairline w-full max-w-md rounded-xl shadow-2xl overflow-hidden flex flex-col p-6 text-left relative"
        style={{ opacity: 0 }}
      >
        {/* Nút Đóng */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 h-8 w-8 rounded-full border border-hairline bg-surface hover:bg-canvas text-stone hover:text-ink transition-all flex items-center justify-center cursor-pointer active:scale-90"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="space-y-1 mb-5 pr-8">
          <h3 className="text-base font-bold text-ink uppercase tracking-wider">
            ⭐ Đánh Giá Đối Tác
          </h3>
          <p className="text-xs text-steel">
            Dự án: <strong className="text-charcoal">{jobTitle}</strong>
          </p>
          <p className="text-xs text-steel">
            Đánh giá người nhận: <strong className="text-brand-green">{revieweeName}</strong>
          </p>
        </div>

        {/* Thông báo trạng thái */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-brand-error/10 border border-brand-error/20 text-xs text-brand-error font-medium rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-brand-green/10 border border-brand-green/20 text-xs text-brand-green font-medium rounded-lg flex items-center gap-2 success-badge">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Lựa chọn số sao */}
          <div className="text-center space-y-2">
            <label className="block text-[10px] font-bold text-steel uppercase tracking-widest text-center">
              Chọn số sao chất lượng
            </label>
            <div
              ref={starsContainerRef}
              className="flex justify-center gap-2.5 py-2"
            >
              {[1, 2, 3, 4, 5].map((idx) => {
                const isLit = hoverRating >= idx || (!hoverRating && rating >= idx);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleStarClick(idx)}
                    onMouseEnter={() => setHoverRating(idx)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="star-btn cursor-pointer transition-colors outline-none focus:outline-none"
                    disabled={isPending}
                    style={{ transformOrigin: "center" }}
                  >
                    <Star
                      className={`w-9 h-9 transition-colors ${
                        isLit
                          ? "fill-yellow-500 text-yellow-500"
                          : "text-hairline hover:text-stone"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            {rating > 0 && (
              <span className="text-xs font-mono font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20 inline-block animate-pulse">
                {rating} / 5 Sao
              </span>
            )}
          </div>

          {/* Nhận xét viết tay */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-steel uppercase tracking-widest">
              Nhận xét của bạn
            </label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ trải nghiệm hợp tác của bạn (độ trễ, giao tiếp, chất lượng sản phẩm)..."
              className="w-full p-3 bg-surface text-charcoal border border-hairline rounded-lg text-xs focus:border-brand-green focus:outline-none transition-colors leading-relaxed"
              disabled={isPending}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 border border-hairline text-stone hover:text-ink rounded-full text-xs font-bold transition-colors cursor-pointer text-center"
              disabled={isPending}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-ink text-on-dark hover:bg-brand-green hover:text-canvas rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center shadow-md active:scale-95"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <span className="animate-spin inline-block w-3 h-3 border border-on-dark border-t-transparent rounded-full" />
                  Đang gửi...
                </>
              ) : (
                "Gửi Đánh Giá"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
