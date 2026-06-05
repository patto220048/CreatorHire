"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { gsap } from "gsap";
import { 
  MessageSquare, 
  Send, 
  X, 
  Minus,
  Phone,
  Video,
  Plus,
  Image as ImageIcon,
  Smile,
  ExternalLink,
  ChevronDown
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

  // Xử lý gửi nhanh Emoji (bóng đá, like)
  const handleSendEmoji = async (emoji: string) => {
    if (!activePartner || sending) return;
    setSending(true);
    try {
      const res = await sendMessageAction("mock-job-general", activePartner.id, emoji);
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
          className="w-[328px] h-[450px] bg-[#242526] border border-[#393a3b] rounded-2xl shadow-2xl overflow-hidden flex flex-col mb-4 select-none"
          style={{ transformOrigin: "bottom right" }}
        >
          {/* Header */}
          <div className="h-14 bg-[#242526] border-b border-[#393a3b] px-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 overflow-hidden cursor-pointer" onClick={() => router.push(`/chat?u=${activePartner.id}`)}>
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-green to-emerald-500 text-white flex items-center justify-center font-bold text-sm border border-[#393a3b]">
                  {activePartner.fullName.slice(0, 1).toUpperCase()}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#31a24c] border-2 border-[#242526] shrink-0"></span>
              </div>
              <div className="overflow-hidden">
                <div className="flex items-center gap-1">
                  <h4 className="text-xs font-bold text-[#e4e6eb] truncate max-w-[130px]">
                    {activePartner.fullName}
                  </h4>
                  <ChevronDown className="w-3.5 h-3.5 text-[#b0b3b8] shrink-0" />
                </div>
                <p className="text-[9px] text-[#b0b3b8] font-medium leading-none mt-0.5">
                  Đang hoạt động
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Phone Call */}
              <button 
                type="button"
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#a200ff] hover:bg-[#3a3b3c] transition-colors cursor-pointer"
                title="Bắt đầu cuộc gọi thoại"
              >
                <Phone className="w-4 h-4" />
              </button>
              {/* Video Call */}
              <button 
                type="button"
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#a200ff] hover:bg-[#3a3b3c] transition-colors cursor-pointer"
                title="Bắt đầu cuộc gọi video"
              >
                <Video className="w-4 h-4" />
              </button>
              {/* Minimize Button */}
              <button 
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#b0b3b8] hover:bg-[#3a3b3c] hover:text-[#e4e6eb] transition-colors cursor-pointer"
                title="Thu nhỏ"
              >
                <Minus className="w-4 h-4" />
              </button>
              {/* Close Button */}
              <button 
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setActivePartner(null);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#b0b3b8] hover:bg-[#3a3b3c] hover:text-[#e4e6eb] transition-colors cursor-pointer"
                title="Đóng chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Khung tin nhắn */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-4 bg-[#18191a] scrollbar-custom flex flex-col">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-[#b0b3b8] space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#242526] flex items-center justify-center border border-[#393a3b]">
                  <MessageSquare className="w-5 h-5 text-[#a200ff]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#e4e6eb]">Chưa có tin nhắn</p>
                  <p className="text-[10px] text-[#b0b3b8] mt-1 leading-normal max-w-[180px] mx-auto">
                    Bắt đầu cuộc trò chuyện với {activePartner.fullName} ngay bây giờ.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isOwn = msg.sender_id === (session.role === "creator" ? "mock-creator-id" : "fl-1");
                const nextMsg = messages[index + 1];
                const prevMsg = messages[index - 1];
                
                // Show name above bubble if incoming, and first in group
                const showSenderName = !isOwn && (!prevMsg || prevMsg.sender_id !== msg.sender_id);
                
                return (
                  <div key={msg.id} className="space-y-1">
                    {showSenderName && (
                      <span className="text-[9px] text-[#b0b3b8] px-9 block font-bold">
                        {msg.sender_name}
                      </span>
                    )}
                    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} items-end gap-2`}>
                      {!isOwn && (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-brand-green to-emerald-500 text-white flex items-center justify-center font-bold text-[9px] shrink-0 border border-[#393a3b]">
                          {msg.sender_name.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      
                      <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"} max-w-[70%]`}>
                        <div 
                          className={`px-3 py-2 text-[13px] leading-snug shadow-sm select-text ${
                            isOwn 
                              ? "bg-[#a200ff] text-white rounded-[18px] rounded-br-[4px]" 
                              : "bg-[#3a3b3c] text-[#e4e6eb] rounded-[18px] rounded-bl-[4px]"
                          }`}
                        >
                          {msg.content}
                        </div>
                        
                        {(!nextMsg || new Date(nextMsg.created_at).getTime() - new Date(msg.created_at).getTime() > 300000) && (
                          <span className="text-[8px] text-[#b0b3b8] block mt-1 px-1">
                            {new Date(msg.created_at).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        )}
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
            className="p-2.5 bg-[#242526] border-t border-[#393a3b] flex items-center gap-2 shrink-0"
          >
            {/* Left actions */}
            <div className="flex items-center gap-1.5 text-[#a200ff]">
              <button 
                type="button"
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[#3a3b3c] transition-colors cursor-pointer"
                title="Mở rộng công cụ"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button 
                type="button"
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[#3a3b3c] transition-colors cursor-pointer"
                title="Gửi hình ảnh"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
              <button 
                type="button"
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[#3a3b3c] transition-colors cursor-pointer"
                title="Gửi nhãn dán"
              >
                <Smile className="w-4 h-4" />
              </button>
              <button 
                type="button"
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[#3a3b3c] transition-colors cursor-pointer text-[9px] font-black font-mono border-2 border-[#a200ff] leading-none flex items-center justify-center"
                style={{ height: '24px', width: '28px' }}
                title="Gửi ảnh GIF"
              >
                GIF
              </button>
            </div>

            {/* Text input container */}
            <div className="relative flex-1 flex items-center">
              <input 
                type="text" 
                placeholder="Aa"
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                className="w-full h-9 pl-4 pr-10 bg-[#3a3b3c] border-none rounded-full text-[13px] text-[#e4e6eb] placeholder-[#b0b3b8] focus:outline-none focus:bg-[#4e4f50] transition-colors"
                disabled={sending}
                required
              />
              <button
                type="button"
                className="absolute right-2.5 text-[#a200ff] hover:text-[#b27ef3] cursor-pointer"
                title="Chèn biểu tượng cảm xúc"
              >
                <Smile className="w-4 h-4" />
              </button>
            </div>

            {/* Fast Send (Thumbs up or Football emoji if empty, Send icon if not empty) */}
            {newMessageText.trim() ? (
              <button 
                type="submit"
                disabled={sending}
                className="w-9 h-9 text-[#a200ff] hover:bg-[#3a3b3c] rounded-full flex items-center justify-center shrink-0 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleSendEmoji("⚽")}
                  className="w-8 h-8 hover:bg-[#3a3b3c] rounded-full flex items-center justify-center text-lg transition-transform hover:scale-125 cursor-pointer"
                  title="Gửi nhanh quả bóng"
                >
                  ⚽
                </button>
                <button
                  type="button"
                  onClick={() => handleSendEmoji("👍")}
                  className="w-8 h-8 hover:bg-[#3a3b3c] rounded-full flex items-center justify-center text-lg transition-transform hover:scale-125 cursor-pointer"
                  title="Gửi nhanh lượt thích"
                >
                  👍
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* 2. Bong bóng nổi Chat Bubble Icon */}
      <button 
        ref={bubbleRef}
        onClick={() => {
          if (!isOpen && !activePartner && session) {
            router.push("/chat");
          } else {
            setIsOpen(!isOpen);
          }
        }}
        className="w-14 h-14 bg-gradient-to-tr from-[#a200ff] to-[#0084ff] text-white rounded-full shadow-2xl hover:shadow-purple-500/20 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer relative border border-white/10"
        title="Trò chuyện trực tuyến"
      >
        <svg className="w-6 h-6 fill-current text-white" viewBox="0 0 24 24">
          <path d="M12 2C6.36 2 2 6.13 2 11.7c0 3.22 1.45 6.06 3.75 7.9v3.7c0 .4.46.66.8.45l4.08-2.5c.44.08.9.15 1.37.15 5.64 0 10-4.13 10-9.7S17.64 2 12 2zm1.2 12.18l-2.4-2.55-4.7 2.55 5.17-5.5 2.43 2.55 4.67-2.55-5.17 5.5z"/>
        </svg>
        {lastMessageCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] bg-[#f02849] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[#18191a] px-1 scale-110 animate-bounce-short">
            {lastMessageCount}
          </span>
        )}
      </button>
    </div>
  );
}
