"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { createJobAction } from "@/app/(dashboard)/creator/jobs/new/actions";
import { Check, AlertCircle } from "lucide-react";

export default function NewJobForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Entrance animation cho các trường form
      const elements = containerRef.current?.querySelectorAll(".form-element");
      if (elements && elements.length > 0) {
        gsap.fromTo(
          elements,
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: "power2.out" }
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (success) {
      const ctx = gsap.context(() => {
        // Animate success screen
        gsap.fromTo(
          successRef.current,
          { scale: 0.8, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" }
        );

        // Bouncing checkmark
        const check = successRef.current?.querySelector(".success-checkmark");
        if (check) {
          gsap.fromTo(
            check,
            { scale: 0 },
            { scale: 1, duration: 0.6, delay: 0.2, ease: "elastic.out(1, 0.5)" }
          );
        }
      }, successRef);

      // Chuyển hướng sau 2.2 giây
      const timer = setTimeout(() => {
        router.push("/creator");
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

    startTransition(async () => {
      try {
        const result = await createJobAction(null, formData);
        if (result && result.error) {
          setError(result.error);
        } else if (result && result.success) {
          setSuccess(true);
        }
      } catch (err) {
        setError("Đã xảy ra lỗi ngoài ý muốn. Vui lòng thử lại.");
      }
    });
  };

  if (success) {
    return (
      <div
        ref={successRef}
        className="max-w-md mx-auto bg-canvas border border-hairline p-8 rounded-lg shadow-sm text-center py-16 flex flex-col items-center justify-center space-y-6"
        style={{ opacity: 0 }}
      >
        <div className="success-checkmark w-20 h-20 bg-brand-green/10 text-brand-green rounded-full flex items-center justify-center shadow-inner border border-brand-green/30">
          <Check className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-ink">Đăng dự án thành công!</h2>
          <p className="text-xs text-steel">
            Dự án của bạn đã được xuất bản công khai. Đang chuyển hướng về trang chủ Dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="max-w-2xl mx-auto bg-canvas border border-hairline p-8 rounded-lg shadow-sm">
      <div className="form-element mb-8 border-b border-hairline pb-4">
        <h2 className="text-base font-bold text-ink mb-1">Đăng dự án mới</h2>
        <p className="text-xs text-steel">
          Mô tả chi tiết nhu cầu tìm kiếm Video Editor, Scriptwriter hoặc Thumbnail Designer của bạn.
        </p>
      </div>

      {error && (
        <div className="form-element mb-6 p-4 bg-brand-error/10 border border-brand-error/20 text-xs text-brand-error font-medium rounded-md flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tiêu đề dự án */}
        <div className="form-element">
          <label className="block text-xs font-semibold text-steel uppercase tracking-wider mb-2">
            Tiêu đề dự án
          </label>
          <input
            type="text"
            name="title"
            required
            placeholder="Ví dụ: Cần Editor dựng video TikTok review công nghệ (dưới 1 phút)"
            className="w-full h-10 px-3 py-2 bg-canvas text-charcoal border border-hairline rounded-md text-xs focus:border-brand-green focus:outline-none transition-colors font-medium"
            disabled={isPending}
          />
        </div>

        {/* Lĩnh vực & Loại ngân sách */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Lĩnh vực */}
          <div className="form-element">
            <label className="block text-xs font-semibold text-steel uppercase tracking-wider mb-2">
              Lĩnh vực yêu cầu
            </label>
            <select
              name="category"
              required
              className="w-full h-10 px-3 py-2 bg-canvas text-charcoal border border-hairline rounded-md text-xs focus:border-brand-green focus:outline-none transition-colors font-medium"
              disabled={isPending}
            >
              <option value="video-edit">🎬 Dựng video (Video Editing)</option>
              <option value="script">📝 Viết kịch bản (Scriptwriting)</option>
              <option value="thumbnail">🖼️ Thiết kế Thumbnail</option>
              <option value="other">⚙️ Khác</option>
            </select>
          </div>

          {/* Loại ngân sách */}
          <div className="form-element">
            <label className="block text-xs font-semibold text-steel uppercase tracking-wider mb-2">
              Hình thức ngân sách
            </label>
            <select
              name="budget_type"
              required
              className="w-full h-10 px-3 py-2 bg-canvas text-charcoal border border-hairline rounded-md text-xs focus:border-brand-green focus:outline-none transition-colors font-medium"
              disabled={isPending}
            >
              <option value="fixed">💰 Trọn gói (Fixed Price)</option>
              <option value="hourly">⏱️ Theo giờ (Hourly Rate)</option>
            </select>
          </div>
        </div>

        {/* Mức ngân sách */}
        <div className="form-element">
          <label className="block text-xs font-semibold text-steel uppercase tracking-wider mb-2">
            Mức ngân sách (VND)
          </label>
          <div className="relative flex items-center">
            <input
              type="number"
              name="budget_amount"
              required
              min="10000"
              step="10000"
              placeholder="Nhập số tiền ngân sách tối đa"
              className="w-full h-10 pl-3 pr-12 py-2 bg-canvas text-charcoal border border-hairline rounded-md text-xs focus:border-brand-green focus:outline-none transition-colors font-mono font-bold"
              disabled={isPending}
            />
            <span className="absolute right-3 text-xs font-bold text-stone">VND</span>
          </div>
          <span className="text-[10px] text-stone mt-1.5 block">
            * Khuyến nghị đặt giá cạnh tranh để nhận được nhiều đề xuất chất lượng cao từ Freelancer.
          </span>
        </div>

        {/* Mô tả chi tiết */}
        <div className="form-element">
          <label className="block text-xs font-semibold text-steel uppercase tracking-wider mb-2">
            Mô tả công việc & Yêu cầu chi tiết
          </label>
          <textarea
            name="description"
            required
            rows={6}
            placeholder="Hãy viết mô tả chi tiết: thời lượng video, phong cách dựng (ví dụ: MrBeast, Alex Hormozi), yêu cầu âm thanh, phụ đề, deadline bàn giao..."
            className="w-full p-3 bg-canvas text-charcoal border border-hairline rounded-md text-xs focus:border-brand-green focus:outline-none transition-colors leading-relaxed"
            disabled={isPending}
          />
        </div>

        {/* Action buttons */}
        <div className="form-element pt-4 border-t border-hairline flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="h-10 px-6 border border-hairline text-stone text-xs font-semibold rounded-full hover:bg-surface hover:text-charcoal transition-colors"
            disabled={isPending}
          >
            Hủy bỏ
          </button>
          
          <button
            type="submit"
            className="h-10 px-8 bg-ink text-on-dark text-xs font-semibold rounded-full hover:bg-charcoal transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-on-dark border-t-transparent rounded-full" />
                Đang xuất bản...
              </>
            ) : (
              "Xuất bản Dự án"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
