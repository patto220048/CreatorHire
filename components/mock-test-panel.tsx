"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { gsap } from "gsap";
import { 
  Settings, 
  User, 
  Database, 
  RefreshCw, 
  LogOut, 
  Briefcase, 
  X, 
  Check, 
  AlertCircle,
  HelpCircle
} from "lucide-react";

interface MockSession {
  email: string;
  role: string;
  fullName: string;
}

export default function MockTestPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<MockSession | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);

  // Helper đọc cookie
  const getCookie = (name: string): string | null => {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
    return null;
  };

  // Helper ghi cookie
  const setCookie = (name: string, value: string, days = 1) => {
    if (typeof document === "undefined") return;
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = `; expires=${date.toUTCString()}`;
    document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/`;
  };

  // Helper xóa cookie
  const deleteCookie = (name: string) => {
    if (typeof document === "undefined") return;
    document.cookie = `${name}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  };

  // Tải trạng thái session hiện tại từ cookie
  useEffect(() => {
    const rawSession = getCookie("mock-session");
    if (rawSession) {
      try {
        const parsed = JSON.parse(decodeURIComponent(rawSession));
        setSession(parsed);
      } catch (e) {
        setSession(null);
      }
    } else {
      setSession(null);
    }
  }, [pathname]);

  // GSAP animation cho mở/đóng panel
  useEffect(() => {
    if (isOpen) {
      gsap.fromTo(
        panelRef.current,
        { scale: 0.85, opacity: 0, y: 30 },
        { scale: 1, opacity: 1, y: 0, duration: 0.35, ease: "back.out(1.5)" }
      );
    }
  }, [isOpen]);

  const handleLogin = (role: "freelancer" | "creator") => {
    const sessionData: MockSession = {
      email: role === "freelancer" ? "mock-freelancer@creatorhire.vn" : "mock-creator@creatorhire.vn",
      role: role,
      fullName: role === "freelancer" ? "Hoàng Minh (Editor)" : "Huy Nguyễn (Creator)"
    };
    
    setCookie("mock-session", JSON.stringify(sessionData));
    setSession(sessionData);
    
    // Đảm bảo có sẵn các dữ liệu mock ban đầu khi đăng nhập
    initializeDefaultData(false);

    setCopiedText(`Đã đăng nhập: ${sessionData.fullName}`);
    setTimeout(() => {
      setCopiedText(null);
      setIsOpen(false);
      
      // Redirect về dashboard tương ứng để test
      if (role === "freelancer") {
        router.push("/freelancer");
      } else {
        router.push("/creator");
      }
      router.refresh();
      // Đợi chút rồi reload hoàn toàn để cập nhật trạng thái middleware/session
      setTimeout(() => window.location.reload(), 150);
    }, 1200);
  };

  const handleLogout = () => {
    deleteCookie("mock-session");
    setSession(null);
    setCopiedText("Đã đăng xuất");
    setTimeout(() => {
      setCopiedText(null);
      setIsOpen(false);
      router.push("/");
      router.refresh();
      setTimeout(() => window.location.reload(), 150);
    }, 1200);
  };

  const initializeDefaultData = (forceReset = true) => {
    // 1. Tạo mock-jobs nếu chưa có hoặc khi forceReset
    const existingJobs = getCookie("mock-jobs");
    if (forceReset || !existingJobs) {
      const defaultJobs = [
        {
          id: "mock-job-1",
          title: "Cần Video Editor dựng Video Shorts công nghệ",
          category: "video-edit",
          budget_amount: 1500000,
          budget_type: "fixed",
          description: "Dự án dựng video shorts review iPhone 15 Pro Max thời lượng 45 giây. Yêu cầu phong cách nhanh, dồn dập (style Alex Hormozi), chèn sound effects công nghệ chân thực, zoom chuyển cảnh giật gân. Cần hoàn thành trước ngày thứ Hai tới. Đã có sẵn file lồng tiếng (Voiceover) chất lượng cao.",
          status: "open",
          created_at: "2 giờ trước",
          proposals_count: 2
        },
        {
          id: "mock-job-2",
          title: "Viết kịch bản phim hoạt hình ngắn 2D (Thời lượng 5 phút)",
          category: "script",
          budget_amount: 3500000,
          budget_type: "fixed",
          description: "Cần tìm biên kịch sáng tạo kịch bản 2D câu chuyện gia đình cảm động. Yêu cầu kịch bản phân cảnh chi tiết, có hội thoại tự nhiên, có thông điệp sâu sắc.",
          status: "in-progress",
          created_at: "1 ngày trước",
          proposals_count: 1
        },
        {
          id: "mock-job-3",
          title: "Thiết kế bộ Thumbnail bắt mắt cho kênh Vlog ẩm thực du lịch",
          category: "thumbnail",
          budget_amount: 1200000,
          budget_type: "fixed",
          description: "Cần thiết kế 3 thumbnail cho các vlog ẩm thực tại TP.HCM. Yêu cầu ảnh ghép biểu cảm ngạc nhiên rõ nét, chữ tiêu đề ngắn gọn (khoảng 3 từ), màu sắc rực rỡ thu hút click chuột.",
          status: "completed",
          created_at: "5 ngày trước",
          proposals_count: 3
        }
      ];
      setCookie("mock-jobs", JSON.stringify(defaultJobs));
    }

    // 2. Tạo mock-proposals nếu chưa có hoặc khi forceReset
    const existingProps = getCookie("mock-proposals");
    if (forceReset || !existingProps) {
      const defaultProps = [
        {
          id: "mock-prop-1",
          job_id: "mock-job-1",
          job_title: "Cần Video Editor chuyên nghiệp dựng Video Shorts công nghệ",
          freelancer_name: "Hoàng Minh (Editor)",
          bid_amount: 1400000,
          cover_letter: "Mình có 2 năm kinh nghiệm dựng shorts, đã edit cho 3 kênh công nghệ đạt 100k sub. Mình dùng Premiere Pro và After Effects, cam kết bàn giao đúng hạn.",
          status: "pending",
          created_at: "1 giờ trước"
        },
        {
          id: "mock-prop-2",
          job_id: "mock-job-1",
          job_title: "Cần Video Editor chuyên nghiệp dựng Video Shorts công nghệ",
          freelancer_name: "Nguyễn Thảo (Editor)",
          bid_amount: 1500000,
          cover_letter: "Hi, mình có sẵn kho template chuyển cảnh công nghệ cao cấp. Mình sẽ dựng thử 1 video ngắn 15 giây đầu tiên miễn phí để bạn kiểm định chất lượng nhé!",
          status: "pending",
          created_at: "3 giờ trước"
        }
      ];
      setCookie("mock-proposals", JSON.stringify(defaultProps));
    }

    // 3. Tạo mock-escrows nếu chưa có hoặc khi forceReset
    const existingEscrows = getCookie("mock-escrows");
    if (forceReset || !existingEscrows) {
      const defaultEscrows = [
        {
          id: "mock-escrow-1",
          job_id: "mock-job-2",
          job_title: "Viết kịch bản phim hoạt hình ngắn 2D (Thời lượng 5 phút)",
          freelancer_id: "mock-user-123",
          freelancer_name: "Hoàng Minh (Editor)",
          amount: 3500000,
          status: "holding",
          delivery_link: null,
          delivery_note: null
        }
      ];
      setCookie("mock-escrows", JSON.stringify(defaultEscrows));
    }

    if (forceReset) {
      setCopiedText("Đã hoàn tác/Đặt lại dữ liệu");
      setTimeout(() => {
        setCopiedText(null);
        setIsOpen(false);
        router.refresh();
        setTimeout(() => window.location.reload(), 150);
      }, 1200);
    }
  };

  const handleClearAll = () => {
    deleteCookie("mock-session");
    deleteCookie("mock-jobs");
    deleteCookie("mock-proposals");
    deleteCookie("mock-escrows");
    setSession(null);
    setCopiedText("Đã xóa sạch cookie mock");
    setTimeout(() => {
      setCopiedText(null);
      setIsOpen(false);
      router.push("/");
      router.refresh();
      setTimeout(() => window.location.reload(), 150);
    }, 1200);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans">
      {/* Nút bật/tắt Panel */}
      <button
        ref={toggleBtnRef}
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 bg-ink text-on-dark rounded-full shadow-lg hover:shadow-xl flex items-center justify-center border border-hairline-dark hover:bg-charcoal transition-all hover:scale-105 active:scale-95"
        title="Trình điều khiển Mock Test"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Settings className="w-5 h-5 animate-spin-slow" />}
      </button>

      {/* Panel Trình Điều Khiển */}
      {isOpen && (
        <div
          ref={panelRef}
          className="absolute bottom-16 right-0 w-80 bg-canvas-dark/95 backdrop-blur-md border border-hairline-dark rounded-xl shadow-2xl p-5 text-on-dark overflow-hidden transition-all duration-300"
          style={{ transformOrigin: "bottom right" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-hairline-dark pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse"></span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-on-dark">🛠️ Chế độ Test Mock</h3>
            </div>
            <span className="text-[9px] font-mono px-2 py-0.5 bg-brand-green/20 text-brand-green border border-brand-green/30 rounded-full">
              Offline Mode
            </span>
          </div>

          {/* Toast Notification trong Panel */}
          {copiedText && (
            <div className="mb-4 py-2 px-3 bg-brand-green/20 border border-brand-green/30 text-[11px] text-brand-green font-semibold rounded flex items-center gap-1.5 animate-pulse">
              <Check className="w-3.5 h-3.5" /> {copiedText}
            </div>
          )}

          {/* Status Section */}
          <div className="bg-black/30 rounded-lg p-3 border border-hairline-dark/40 mb-4 text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-on-dark-muted text-[10px]">Tài khoản:</span>
              <span className={`font-semibold ${session ? "text-brand-green" : "text-stone"}`}>
                {session ? session.fullName : "Chưa đăng nhập"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-on-dark-muted text-[10px]">Vai trò (Role):</span>
              <span className={`font-semibold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-full ${
                session?.role === "freelancer" 
                  ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" 
                  : session?.role === "creator"
                  ? "bg-brand-green/20 text-brand-green border border-brand-green/30"
                  : "bg-stone/20 text-stone border border-stone/30"
              }`}>
                {session ? session.role : "GUEST"}
              </span>
            </div>
            {session && (
              <div className="flex justify-between items-center text-[10px] text-on-dark-muted font-mono truncate">
                <span>Email:</span>
                <span className="truncate max-w-[150px]">{session.email}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5">
            <p className="text-[10px] font-bold text-on-dark-muted uppercase tracking-wider mb-1">Đăng nhập nhanh</p>
            
            {/* Quick Login Freelancer */}
            <button
              onClick={() => handleLogin("freelancer")}
              className="w-full py-2 px-3 text-xs bg-canvas text-charcoal hover:bg-surface rounded-lg font-semibold flex items-center gap-2 border border-hairline transition-all active:scale-95 text-left"
            >
              <User className="w-4 h-4 text-indigo-500" />
              <div className="flex-1">
                <div className="text-[11px] font-bold text-ink">Làm Freelancer (Editor)</div>
                <div className="text-[9px] text-steel font-normal">Nộp báo giá, gửi sản phẩm video</div>
              </div>
            </button>

            {/* Quick Login Creator */}
            <button
              onClick={() => handleLogin("creator")}
              className="w-full py-2 px-3 text-xs bg-canvas text-charcoal hover:bg-surface rounded-lg font-semibold flex items-center gap-2 border border-hairline transition-all active:scale-95 text-left"
            >
              <User className="w-4 h-4 text-brand-green" />
              <div className="flex-1">
                <div className="text-[11px] font-bold text-ink">Làm Nhà sáng tạo (Creator)</div>
                <div className="text-[9px] text-steel font-normal">Đăng job, nạp cọc PayOS, giải ngân</div>
              </div>
            </button>

            <p className="text-[10px] font-bold text-on-dark-muted uppercase tracking-wider pt-2 mb-1">Dữ liệu & Cấu hình</p>

            <div className="grid grid-cols-2 gap-2">
              {/* Reset Data */}
              <button
                onClick={() => initializeDefaultData(true)}
                className="py-2 px-2.5 bg-[#1a3d4a] hover:bg-[#204a5a] text-on-dark rounded text-[10px] font-semibold border border-brand-green/30 flex items-center justify-center gap-1.5 transition-all"
                title="Khởi tạo hoặc đặt lại các công việc & báo giá mẫu"
              >
                <RefreshCw className="w-3.5 h-3.5 text-brand-green" /> Reset Data
              </button>

              {/* Clear Cookies */}
              <button
                onClick={handleClearAll}
                className="py-2 px-2.5 bg-red-950/40 hover:bg-red-950/60 text-red-400 rounded text-[10px] font-semibold border border-red-500/20 flex items-center justify-center gap-1.5 transition-all"
                title="Xóa toàn bộ session & data trong cookies"
              >
                <Database className="w-3.5 h-3.5 text-red-500" /> Clear Mock
              </button>
            </div>

            {session && (
              <button
                onClick={handleLogout}
                className="w-full py-2 bg-transparent hover:bg-white/5 border border-hairline-dark rounded text-xs text-on-dark-muted hover:text-on-dark flex items-center justify-center gap-1.5 transition-all mt-2"
              >
                <LogOut className="w-3.5 h-3.5" /> Đăng xuất khỏi Mock Session
              </button>
            )}
          </div>

          {/* Quick Help Footer */}
          <div className="mt-4 pt-3 border-t border-hairline-dark/60 flex items-start gap-1.5 text-[9px] text-on-dark-muted leading-normal">
            <HelpCircle className="w-3.5 h-3.5 text-brand-green shrink-0 mt-0.5" />
            <p>
              Gợi ý test: Đăng nhập Creator để xem/duyệt dự án. Đăng nhập Freelancer để nộp báo giá tại các trang chi tiết dự án.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
