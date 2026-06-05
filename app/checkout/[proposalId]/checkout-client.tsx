// app/checkout/[proposalId]/checkout-client.tsx
// Client Component xử lý giao diện thanh toán Ký quỹ (Escrow) bằng GSAP

"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import gsap from "gsap";
import { confirmMockPaymentAction } from "./actions";
import { 
  Check, 
  ArrowLeft, 
  AlertCircle, 
  ShieldCheck, 
  QrCode, 
  CreditCard,
  DollarSign
} from "lucide-react";

interface CheckoutClientProps {
  proposalId: string;
  initialPaymentData: {
    success?: boolean;
    isMock?: boolean;
    orderCode?: number;
    amount?: number;
    description?: string;
    jobTitle?: string;
    freelancerName?: string;
    checkoutUrl?: string;
    qrCode?: string;
    error?: string;
  };
}

export default function CheckoutClient({ proposalId, initialPaymentData }: CheckoutClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(initialPaymentData.error || null);
  const [success, setSuccess] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const qrBoxRef = useRef<HTMLDivElement>(null);

  // 1. Panel entry animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      const panels = containerRef.current?.querySelectorAll(".checkout-panel");
      if (panels && panels.length > 0) {
        gsap.fromTo(
          panels,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power3.out" }
        );
      }

      // QR pulse loop
      if (qrBoxRef.current) {
        gsap.fromTo(
          qrBoxRef.current,
          { scale: 0.98, borderColor: "rgba(0, 212, 164, 0.3)" },
          { 
            scale: 1.02, 
            borderColor: "rgba(0, 212, 164, 0.8)", 
            duration: 1.5, 
            repeat: -1, 
            yoyo: true, 
            ease: "sine.inOut" 
          }
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // 2. Success dialog animation
  useEffect(() => {
    if (success) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          successRef.current,
          { scale: 0.8, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" }
        );

        const circle = successRef.current?.querySelector(".success-circle");
        if (circle) {
          gsap.fromTo(
            circle,
            { scale: 0 },
            { scale: 1, duration: 0.6, delay: 0.2, ease: "elastic.out(1, 0.5)" }
          );
        }
      }, successRef);

      const timer = setTimeout(() => {
        router.push("/creator/jobs");
        router.refresh();
      }, 2200);

      return () => {
        clearTimeout(timer);
        ctx.revert();
      };
    }
  }, [success, router]);

  // Giả lập thanh toán thành công
  const handleConfirmMockPayment = () => {
    setError(null);
    const orderCode = initialPaymentData.orderCode || Date.now();

    startTransition(async () => {
      try {
        const result = await confirmMockPaymentAction(proposalId, orderCode);
        if (result && result.error) {
          setError(result.error);
        } else if (result && result.success) {
          setSuccess(true);
        }
      } catch (err) {
        setError("Lỗi kết nối giả lập thanh toán.");
      }
    });
  };

  const amount = initialPaymentData.amount || 0;
  const orderCode = initialPaymentData.orderCode || 0;

  if (success) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div
          ref={successRef}
          className="max-w-md w-full bg-canvas border border-hairline p-8 rounded-lg shadow-sm text-center py-16 flex flex-col items-center justify-center space-y-6"
          style={{ opacity: 0 }}
        >
          <div className="success-circle w-20 h-20 bg-brand-green/10 text-brand-green rounded-full flex items-center justify-center shadow-inner border border-brand-green/30">
            <Check className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-ink">Ký quỹ thành công!</h2>
            <p className="text-xs text-steel leading-relaxed">
              Số tiền <span className="font-mono font-bold text-ink">{amount.toLocaleString("vi-VN")} ₫</span> đã được hệ thống CreatorHire ký quỹ an toàn. Dự án đã bắt đầu hoạt động!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-surface font-sans flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-hairline py-4 px-6 bg-canvas/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-wider text-ink">
            creator<span className="text-brand-green">hire.</span>
          </Link>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs text-steel hover:text-ink font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-4xl w-full mx-auto py-12 px-6 flex-1 flex flex-col justify-center items-center">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 w-full items-start">
          {/* Cột trái: Tóm tắt đơn hàng & Bảo mật */}
          <div className="checkout-panel md:col-span-7 bg-canvas border border-hairline rounded-lg p-6 space-y-6 shadow-sm" style={{ opacity: 0 }}>
            <div>
              <span className="px-2.5 py-0.5 bg-brand-green/10 text-brand-green border border-brand-green/20 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Thanh toán đảm bảo (Escrow)
              </span>
              <h2 className="text-lg font-bold text-ink mt-3">Ký quỹ Dự án Tuyển dụng</h2>
              <p className="text-xs text-steel mt-1">
                Tiền của bạn sẽ được lưu giữ an toàn bởi CreatorHire và chỉ giải ngân cho Freelancer khi bạn hoàn toàn đồng ý bàn giao.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-brand-error/10 border border-brand-error/20 text-xs text-brand-error font-medium rounded-md flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            <div className="border-t border-hairline pt-4 space-y-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-steel block">Dự án công việc:</span>
                <span className="text-xs font-bold text-ink">{initialPaymentData.jobTitle || "Cần video editor chuyên nghiệp"}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-steel block">Freelancer nhận việc:</span>
                  <span className="text-xs font-bold text-ink">{initialPaymentData.freelancerName || "Nguyễn Văn Editor"}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-steel block">Mã đơn hàng:</span>
                  <span className="text-xs font-mono text-steel">#{orderCode}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-hairline pt-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-steel font-medium">Tổng tiền ký quỹ:</span>
                <span className="text-xl font-black font-mono text-brand-green block mt-1">
                  {amount.toLocaleString("vi-VN")} ₫
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-stone font-semibold">
                <ShieldCheck className="w-4 h-4 text-brand-green" /> Bảo mật 256-bit SSL
              </div>
            </div>
          </div>

          {/* Cột phải: Mã QR thanh toán */}
          <div className="checkout-panel md:col-span-5 bg-canvas border border-hairline rounded-lg p-6 shadow-sm flex flex-col items-center justify-center space-y-6" style={{ opacity: 0 }}>
            <div className="text-center w-full">
              <span className="text-xs font-bold text-ink flex items-center justify-center gap-1">
                <QrCode className="w-4 h-4 text-brand-green" /> Quét mã để ký quỹ
              </span>
              <p className="text-[10px] text-steel mt-1">Hỗ trợ mọi ứng dụng Ngân hàng Việt Nam qua VietQR</p>
            </div>

            {/* Khung QR code */}
            <div 
              ref={qrBoxRef}
              className="border-2 border-hairline p-4 rounded-lg bg-surface flex items-center justify-center aspect-square w-48 relative overflow-hidden"
            >
              {initialPaymentData.qrCode ? (
                <img 
                  src={initialPaymentData.qrCode} 
                  alt="VietQR code" 
                  className="w-full h-full object-contain"
                />
              ) : (
                /* Mock QR Code */
                <div className="flex flex-col items-center justify-center text-center space-y-2">
                  <div className="bg-canvas border border-hairline rounded p-2">
                    <svg className="w-24 h-24 text-charcoal" viewBox="0 0 100 100">
                      <rect x="10" y="10" width="20" height="20" fill="currentColor"/>
                      <rect x="70" y="10" width="20" height="20" fill="currentColor"/>
                      <rect x="10" y="70" width="20" height="20" fill="currentColor"/>
                      <rect x="40" y="40" width="20" height="20" fill="currentColor"/>
                      <rect x="70" y="70" width="10" height="10" fill="currentColor"/>
                      <rect x="80" y="80" width="10" height="10" fill="currentColor"/>
                      <rect x="55" y="75" width="10" height="15" fill="currentColor"/>
                    </svg>
                  </div>
                  <span className="text-[9px] uppercase tracking-widest text-brand-green font-bold font-mono">MOCK QR PAYOS</span>
                </div>
              )}
            </div>

            {/* Hướng dẫn giả lập chuyển khoản hoặc thông tin chuyển khoản */}
            <div className="w-full text-center space-y-4">
              <div className="bg-surface p-3.5 rounded border border-hairline-soft text-left space-y-1.5">
                <span className="text-[9px] uppercase font-bold text-steel flex items-center gap-1">
                  <CreditCard className="w-3 h-3" /> Thông tin thanh toán giả định:
                </span>
                <p className="text-[10px] text-charcoal font-semibold">Tên TK: <span className="font-mono">CREATORHIRE ESCROW</span></p>
                <p className="text-[10px] text-charcoal font-semibold">Nội dung: <span className="font-mono text-brand-green">CK {orderCode}</span></p>
              </div>

              {initialPaymentData.isMock ? (
                <button
                  type="button"
                  onClick={handleConfirmMockPayment}
                  className="w-full h-10 bg-brand-green text-canvas hover:bg-brand-green-deep text-xs font-semibold rounded-full transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 font-bold shadow-md"
                  disabled={isPending}
                >
                  {isPending ? (
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-canvas border-t-transparent rounded-full" />
                  ) : (
                    "Xác nhận giả lập thanh toán ✔"
                  )}
                </button>
              ) : (
                <a
                  href={initialPaymentData.checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-10 bg-ink text-on-dark hover:bg-charcoal text-xs font-semibold rounded-full transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5 font-bold"
                >
                  Mở trang thanh toán PayOS →
                </a>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="border-t border-hairline py-6 bg-canvas text-center text-[10px] text-steel">
        <p>© {new Date().getFullYear()} CreatorHire. Bảo lưu quyền ký quỹ và giải ngân theo điều khoản.</p>
      </footer>
    </div>
  );
}
