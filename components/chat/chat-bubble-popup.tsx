"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { gsap } from "gsap";
import { 
  MessageSquare, 
  Send, 
  X, 
  Minimize2, 
  Maximize2, 
  ExternalLink, 
  Circle,
  Clock,
  Check
} from "lucide-react";
import { 
  getMessagesAction, 
  sendMessageAction, 
  markMessagesAsReadAction, 
  getUnreadMessagesAction,
  Message,
  ChatPartner
} from "@/app/api/chat/actions";
import { getSupabaseClient } from "@/lib/supabase/client";

interface UserSession {
  email: string;
  role: "creator" | "freelancer";
  fullName: string;
}

export default function ChatBubblePopup() {
  const pathname = usePathname();
  const router = useRouter();

  const [session, setSession] = useState<UserSession | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activePartner, setActivePartner] = useState<ChatPartner | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessageText, setNewMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [lastMessageCount, setLastMessageCount] = useState(0);

  const bubbleRef = useRef<HTMLButtonElement>(null);
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Vô hiệu hóa widget bong bóng chat khi đang ở trang Hộp thư đầy đủ /chat
  const isChatPage = pathname === "/chat";

  // Hàm phát âm thanh chime thông báo bằng Web Audio API (không cần tải asset file)
  const playNotificationSound = () => {
    if (typeof window === "undefined") return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);
        
        gain.gain.setValueAtTime(0.08, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(start);
        osc.stop(start + duration);
      };
      
      const now = ctx.currentTime;
      // Chime kép trong trẻo (Đô 5 -> Mi 5)
      playTone(523.25, now, 0.15); // C5
      playTone(659.25, now + 0.07, 0.25); // E5
    } catch (e) {
      console.warn("Không phát được âm thanh thông báo:", e);
    }
  };

  // Đọc session
  useEffect(() => {
    if (isChatPage) return;

    const fetchSession = async () => {
      const getCookie = (name: string): string | null => {
        if (typeof document === "undefined") return null;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
        return null;
      };

      const mockSessionCookie = getCookie("mock-session");
      if (mockSessionCookie) {
        try {
          const parsed = JSON.parse(decodeURIComponent(mockSessionCookie));
          setSession(parsed);
          return;
        } catch (e) {}
      }

      try {
        const supabase = await getSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setSession({
            email: user.email || "",
            role: user.user_metadata?.role || "creator",
            fullName: user.user_metadata?.full_name || "Thành viên",
          });
        }
      } catch (err) {}
    };

    fetchSession();
  }, [pathname, isChatPage]);

  // Polling lấy tin nhắn chưa đọc
  useEffect(() => {
    if (isChatPage || !session) return;

    const checkNewMessages = async () => {
      try {
        const res = await getUnreadMessagesAction();
        if (res.success && res.data && res.data.length > 0) {
          const unreadMsgs = res.data as Message[];
          const lastMsg = unreadMsgs[unreadMsgs.length - 1];
          
          // Phát hiện có thêm tin nhắn chưa đọc mới
          if (unreadMsgs.length > lastMessageCount) {
            setLastMessageCount(unreadMsgs.length);
            
            // Lấy thông tin đối tác từ tin nhắn cuối
            const isCreatorPartner = lastMsg.sender_id === "mock-creator-id";
            const newPartner: ChatPartner = {
              id: lastMsg.sender_id,
              fullName: lastMsg.sender_name,
              role: isCreatorPartner ? "creator" : "freelancer",
              avatarUrl: null
            };

            // Thiết lập đối tác active & mở khung chat nổi
            setActivePartner(newPartner);
            setIsOpen(true);
            
            // Phát âm thanh
            playNotificationSound();
            
            // Hiệu ứng GSAP nảy nhẹ cho bong bóng chat nổi
            if (bubbleRef.current) {
              gsap.fromTo(
                bubbleRef.current,
                { y: 15, scale: 0.8 },
                { y: 0, scale: 1, duration: 0.5, ease: "elastic.out(1.2, 0.4)" }
              );
            }
          }
        } else if (res.success && (!res.data || res.data.length === 0)) {
          setLastMessageCount(0);
        }
      } catch (e) {}
    };

    // Chạy kiểm tra lập tức
    checkNewMessages();

    // Polling mỗi 3.5 giây để cập nhật tin nhắn đến
    const interval = setInterval(checkNewMessages, 3500);
    return () => clearInterval(interval);
  }, [session, isChatPage, lastMessageCount]);

  // Load hội thoại của active partner trong popup
  useEffect(() => {
    if (isChatPage || !activePartner || !isOpen) return;

    const loadPopupMessages = async () => {
      try {
        const res = await getMessagesAction(activePartner.id);
        if (res.success && res.data) {
          setMessages(res.data);
        }
      } catch (e) {}
    };

    loadPopupMessages();

    // Polling hội thoại mỗi 2.5 giây khi popup đang mở
    const interval = setInterval(loadPopupMessages, 2500);
    return () => clearInterval(interval);
  }, [activePartner, isOpen, isChatPage]);

  // Tự động cuộn xuống cuối khi tin nhắn thay đổi
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Hiệu ứng GSAP co giãn khi mở/đóng cửa sổ chat nổi
  useEffect(() => {
    if (isChatPage) return;
    if (isOpen && chatBoxRef.current) {
      gsap.fromTo(
        chatBoxRef.current,
        { scale: 0.85, opacity: 0, y: 30 },
        { scale: 1, opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.5)" }
      );
      
      // Đánh dấu đã đọc khi mở popup
      if (activePartner) {
        markMessagesAsReadAction(activePartner.id).then(() => {
          // Reset đếm tin nhắn
          setLastMessageCount(0);
        });
      }
    }
  }, [isOpen, activePartner?.id, isChatPage]);

  // Xử lý gửi tin nhắn nhanh
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !activePartner || sending) return;

    const text = newMessageText.trim();
    setNewMessageText("");
    setSending(true);

    try {
      const res = await sendMessageAction("mock-job-general", activePartner.id, text);
      if (res.success && res.data) {
        setMessages((prev) => [...prev, res.data]);

        // Giả lập auto-reply trong Mock Mode
        const isMockMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || document.cookie.includes("mock-session=");
        if (isMockMode) {
          setTimeout(() => {
            const replies = [
              "Vâng ạ! Mình đã nhận được tin nhắn nổi.",
              "Cảm ơn bạn nhé! Mình sẽ kiểm tra và phản hồi lại sớm nhất.",
              "Vâng, bạn thấy bản demo/dự án của mình cần điều chỉnh gì thêm không?",
              "Okay bạn, để mình cập nhật lại ngay ạ!"
            ];
            const randomReply = replies[Math.floor(Math.random() * replies.length)];

            const getCookie = (name: string): string | null => {
              if (typeof document === "undefined") return null;
              const value = `; ${document.cookie}`;
              const parts = value.split(`; ${name}=`);
              if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
              return null;
            };

            const mockMessagesCookie = getCookie("mock-messages");
            let currentMessages: Message[] = [];
            if (mockMessagesCookie) {
              try {
                currentMessages = JSON.parse(decodeURIComponent(mockMessagesCookie));
              } catch (e) {}
            }

            const autoMsg: Message = {
              id: `mock-msg-popup-reply-${Date.now()}`,
              job_id: "mock-job-general",
              sender_id: activePartner.id,
              sender_name: activePartner.fullName,
              receiver_id: session?.role === "creator" ? "mock-creator-id" : "fl-1",
              content: randomReply,
              is_read: false,
              created_at: new Date().toISOString()
            };

            currentMessages.push(autoMsg);
            document.cookie = `mock-messages=${encodeURIComponent(JSON.stringify(currentMessages))}; path=/; max-age=2592000`;
            
            setMessages((prev) => [...prev, autoMsg]);
            playNotificationSound();
          }, 1500);
        }
      }
    } catch (e) {
      console.error("Lỗi gửi tin nhắn nổi:", e);
    } finally {
      setSending(false);
    }
  };

  if (isChatPage || !session) return null;

  return (
    <div className="fixed bottom-6 right-24 z-[9998] font-sans flex flex-col items-end">
      {/* 1. Cửa sổ chat nổi Messenger-style */}
      {isOpen && activePartner && (
        <div 
          ref={chatBoxRef}
          className="w-80 h-96 bg-canvas border border-hairline rounded-2xl shadow-2xl overflow-hidden flex flex-col mb-4 bg-white/95 backdrop-blur-md"
          style={{ transformOrigin: "bottom right" }}
        >
          {/* Header */}
          <div className="h-12 bg-canvas-dark text-on-dark px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-green shrink-0 animate-pulse"></span>
              <div className="overflow-hidden">
                <h4 className="text-xs font-bold text-on-dark truncate max-w-[150px]">
                  {activePartner.fullName}
                </h4>
                <p className="text-[8px] text-on-dark-muted uppercase font-mono tracking-widest leading-none mt-0.5">
                  {activePartner.role === "creator" ? "Creator" : "Freelancer"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-on-dark-muted">
              {/* Fullscreen Button */}
              <Link 
                href={`/chat?u=${activePartner.id}`}
                onClick={() => setIsOpen(false)}
                className="p-1 hover:text-on-dark transition-colors rounded hover:bg-white/10"
                title="Mở hộp thư đầy đủ"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              {/* Minimize Button */}
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:text-on-dark transition-colors rounded hover:bg-white/10 cursor-pointer"
                title="Thu nhỏ"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Khung tin nhắn */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30 scrollbar-custom">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-stone space-y-2">
                <MessageSquare className="w-6 h-6 text-hairline" />
                <p className="text-[10px] font-semibold">Chưa có tin nhắn</p>
                <p className="text-[9px] text-slate/70 leading-normal">
                  Gửi lời chào đầu tiên để trao đổi về dự án nhé!
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isOwn = msg.sender_id === (session.role === "creator" ? "mock-creator-id" : "fl-1");
                return (
                  <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                    <div className={`flex gap-1.5 max-w-[85%] items-end ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                      {!isOwn && (
                        <div className="w-6 h-6 rounded-full bg-charcoal text-on-dark flex items-center justify-center font-bold text-[8px] shrink-0 border border-hairline-dark">
                          {msg.sender_name.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      
                      <div className="space-y-0.5">
                        <div className={`p-2.5 text-[11px] leading-relaxed rounded-xl shadow-sm ${
                          isOwn 
                            ? "bg-ink text-on-dark rounded-br-none" 
                            : "bg-surface text-charcoal rounded-bl-none border border-hairline-soft"
                        }`}>
                          {msg.content}
                        </div>
                        <span className="text-[7px] text-stone block px-1 text-right">
                          {new Date(msg.created_at).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form input */}
          <form 
            onSubmit={handleSendMessage}
            className="p-3 border-t border-hairline bg-surface/30 flex gap-2 shrink-0"
          >
            <input 
              type="text" 
              placeholder="Nhập nội dung tin nhắn..."
              value={newMessageText}
              onChange={(e) => setNewMessageText(e.target.value)}
              className="flex-1 h-8 px-3 bg-canvas border border-hairline rounded-full text-[11px] text-charcoal focus:border-brand-green focus:outline-none transition-colors"
              disabled={sending}
              required
            />
            <button 
              type="submit"
              disabled={sending || !newMessageText.trim()}
              className="w-8 h-8 bg-ink text-on-dark hover:bg-brand-green hover:text-canvas rounded-full flex items-center justify-center shrink-0 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* 2. Bong bóng nổi Chat Bubble Icon */}
      <button 
        ref={bubbleRef}
        onClick={() => {
          if (!isOpen && !activePartner && session) {
            // Khi chưa có ai nhắn, click vào bong bóng sẽ gợi ý mở chat page hoặc mở người chat gần nhất
            router.push("/chat");
          } else {
            setIsOpen(!isOpen);
          }
        }}
        className="w-12 h-12 bg-brand-green text-canvas rounded-full shadow-lg hover:shadow-xl flex items-center justify-center border border-brand-green-soft hover:scale-105 active:scale-95 transition-all cursor-pointer relative"
        title="Trò chuyện trực tuyến"
      >
        <MessageSquare className="w-5 h-5 text-ink font-bold" />
        {lastMessageCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-error text-canvas text-[10px] font-bold rounded-full flex items-center justify-center border border-canvas animate-pulse scale-105">
            {lastMessageCount}
          </span>
        )}
      </button>
    </div>
  );
}
