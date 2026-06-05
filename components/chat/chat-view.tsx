"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { gsap } from "gsap";
import { 
  Send, 
  MessageSquare, 
  Search, 
  User as UserIcon, 
  Check, 
  Clock, 
  ArrowLeft,
  Circle,
  ExternalLink,
  Laptop
} from "lucide-react";
import { 
  sendMessageAction, 
  getMessagesAction, 
  getChatPartnersAction, 
  markMessagesAsReadAction,
  Message,
  ChatPartner 
} from "@/app/api/chat/actions";
import { getSupabaseClient } from "@/lib/supabase/client";

interface UserSession {
  email: string;
  role: "creator" | "freelancer";
  fullName: string;
}

export default function ChatView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const partnerParam = searchParams.get("u"); // query parameter để mở chat trực tiếp với ai đó
  const jobParam = searchParams.get("j");

  const [session, setSession] = useState<UserSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  
  const [partners, setPartners] = useState<ChatPartner[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [activePartner, setActivePartner] = useState<ChatPartner | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessageText, setNewMessageText] = useState("");
  const [sending, setSending] = useState(false);

  const [isPending, startTransition] = useTransition();

  // Refs cho hiệu ứng GSAP
  const chatListRef = useRef<HTMLDivElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const listItemsRef = useRef<(HTMLDivElement | null)[]>([]);

  // Đọc session người dùng
  useEffect(() => {
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
          setLoadingSession(false);
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
      } catch (err) {
        console.error("Lỗi lấy session chat:", err);
      } finally {
        setLoadingSession(false);
      }
    };
    fetchSession();
  }, []);

  // Lấy danh sách các đối tác đã chat
  const fetchPartnersList = async (selectIdAfterLoad?: string) => {
    try {
      const res = await getChatPartnersAction();
      if (res.success && res.data) {
        setPartners(res.data);
        
        // Nếu có param mở chat trực tiếp, hoặc có đối tác mới được yêu cầu chọn
        const selectId = selectIdAfterLoad || partnerParam;
        if (selectId) {
          const found = (res.data as ChatPartner[]).find((p: ChatPartner) => p.id === selectId);
          if (found) {
            setActivePartner(found);
          } else {
            // Trường hợp chưa từng chat nhưng được gọi trực tiếp qua query params u=
            // Cần tạo một đối tác giả định tạm thời
            const mockName = selectId === "mock-creator-id" ? "Huy Nguyễn (Creator)" : 
                             selectId === "fl-1" ? "Hoàng Minh (Editor)" : "Thành viên mới";
            const mockRole = selectId === "mock-creator-id" ? "creator" : "freelancer";
            
            const tempPartner: ChatPartner = {
              id: selectId,
              fullName: mockName,
              role: mockRole,
              avatarUrl: null
            };
            setActivePartner(tempPartner);
          }
        }
      }
    } catch (e) {
      console.error("Lỗi tải đối tác chat:", e);
    } finally {
      setLoadingPartners(false);
    }
  };

  useEffect(() => {
    if (!loadingSession) {
      fetchPartnersList();
    }
  }, [loadingSession, partnerParam]);

  // Entrance animations cho danh sách chat
  useEffect(() => {
    if (!loadingPartners && partners.length > 0) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          listItemsRef.current.filter(Boolean),
          { opacity: 0, x: -20 },
          { opacity: 1, x: 0, duration: 0.4, stagger: 0.05, ease: "power2.out" }
        );
      }, chatListRef);
      return () => ctx.revert();
    }
  }, [loadingPartners, partners.length]);

  // Load tin nhắn của cuộc trò chuyện đang active
  useEffect(() => {
    if (!activePartner) return;
    
    const loadMessages = async () => {
      setLoadingMessages(true);
      try {
        const res = await getMessagesAction(activePartner.id, jobParam || undefined);
        if (res.success && res.data) {
          setMessages(res.data);
          // Đánh dấu đã đọc
          await markMessagesAsReadAction(activePartner.id);
        }
      } catch (e) {
        console.error("Lỗi tải tin nhắn:", e);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();

    // Thiết lập polling 2.5 giây để giả lập real-time trong mock/offline mode
    const interval = setInterval(async () => {
      try {
        const res = await getMessagesAction(activePartner.id, jobParam || undefined);
        if (res.success && res.data && res.data.length !== messages.length) {
          setMessages(res.data);
        }
      } catch (e) {}
    }, 2500);

    return () => clearInterval(interval);
  }, [activePartner, jobParam, messages.length]);

  // GSAP animation khi mở một box chat mới
  useEffect(() => {
    if (activePartner && chatAreaRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          chatAreaRef.current,
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
        );
      }, chatAreaRef);
      return () => ctx.revert();
    }
  }, [activePartner?.id]);

  // Tự động cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loadingMessages]);

  // Xử lý gửi tin nhắn
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !activePartner || sending) return;

    const text = newMessageText.trim();
    setNewMessageText("");
    setSending(true);

    try {
      const res = await sendMessageAction(jobParam || "mock-job-general", activePartner.id, text);
      if (res.success && res.data) {
        // Cập nhật state tin nhắn lập tức
        setMessages((prev) => [...prev, res.data]);
        
        // Trigger auto-reply giả lập trong Mock mode sau 1.5s
        const isMockMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || document.cookie.includes("mock-session=");
        if (isMockMode) {
          setTimeout(async () => {
            const replies = [
              "Vâng ạ! Mình đã nhận được thông tin. Mình sẽ kiểm tra lại ngay.",
              "Cảm ơn bạn nhé! Để mình chỉnh sửa lại phần này rồi gửi file nháp mới cho bạn xem thử.",
              "Thật tuyệt! Mình thấy kịch bản/video này ổn rồi đó. Bạn thấy có cần sửa đổi gì thêm không?",
              "Mình hiểu rồi, mình đang chuẩn bị các asset và bắt đầu dựng luôn đây ạ.",
              "Báo giá/Công việc đã được xác nhận. Rất vui được hợp tác cùng bạn!",
              "Okay bạn nhé, có gì cứ nhắn mình tại đây nhé!"
            ];
            const randomReply = replies[Math.floor(Math.random() * replies.length)];
            
            // Đọc mock-session để lấy vai trò của partner (ngược lại với sender)
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
              id: `mock-msg-reply-${Date.now()}`,
              job_id: jobParam || "mock-job-general",
              sender_id: activePartner.id,
              sender_name: activePartner.fullName,
              receiver_id: session?.role === "creator" ? "mock-creator-id" : "fl-1",
              content: randomReply,
              is_read: false,
              created_at: new Date().toISOString()
            };

            currentMessages.push(autoMsg);
            document.cookie = `mock-messages=${encodeURIComponent(JSON.stringify(currentMessages))}; path=/; max-age=2592000`;
            
            // Reload tin nhắn từ cookie
            setMessages((prev) => [...prev, autoMsg]);
          }, 1500);
        }

        // Tải lại danh sách đối tác để cập nhật cuộc trò chuyện mới nhất lên đầu
        fetchPartnersList(activePartner.id);
      }
    } catch (err) {
      console.error("Lỗi gửi tin nhắn:", err);
    } finally {
      setSending(false);
    }
  };

  const filteredPartners = partners.filter((p) =>
    p.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] flex bg-canvas text-ink font-sans">
      {/* 1. Sidebar bên trái: Danh sách cuộc trò chuyện */}
      <div 
        ref={chatListRef}
        className={`w-full md:w-80 border-r border-hairline-soft flex flex-col shrink-0 bg-surface/30 ${
          activePartner ? "hidden md:flex" : "flex"
        }`}
      >
        {/* Tiêu đề & Ô tìm kiếm */}
        <div className="p-5 border-b border-hairline-soft space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-sm font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-brand-green" /> Tin nhắn trực tuyến
            </h1>
            <span className="text-[10px] font-mono text-steel bg-surface px-2 py-0.5 rounded border border-hairline-soft">
              {filteredPartners.length} liên hệ
            </span>
          </div>

          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-stone" />
            <input
              type="text"
              placeholder="Tìm đối tác..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 py-1.5 bg-surface text-xs text-charcoal border border-hairline rounded-md focus:border-brand-green focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Danh sách người chat */}
        <div className="flex-1 overflow-y-auto divide-y divide-hairline-soft/40 scrollbar-custom">
          {loadingPartners ? (
            <div className="p-8 text-center text-xs text-stone flex flex-col items-center justify-center gap-2">
              <span className="animate-spin inline-block w-4 h-4 border-2 border-brand-green border-t-transparent rounded-full" />
              Đang tải danh sách...
            </div>
          ) : filteredPartners.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone border border-dashed border-hairline-soft m-4 rounded-md bg-surface/10">
              Chưa có cuộc hội thoại nào.
              <p className="text-[10px] text-slate mt-1">
                Hãy ghé qua trang việc làm hoặc hồ sơ Freelancer để bắt đầu gửi lời mời và chat nhé!
              </p>
            </div>
          ) : (
            filteredPartners.map((partner, index) => {
              const isActive = activePartner?.id === partner.id;
              return (
                <div
                  key={partner.id}
                  ref={(el) => { listItemsRef.current[index] = el; }}
                  onClick={() => setActivePartner(partner)}
                  className={`p-4 flex items-center gap-3 cursor-pointer transition-all hover:bg-surface/50 border-l-2 ${
                    isActive 
                      ? "bg-surface border-brand-green font-medium" 
                      : "border-transparent"
                  }`}
                >
                  {/* Avatar hoặc Chữ cái đầu */}
                  <div className="w-10 h-10 rounded-full bg-charcoal text-on-dark flex items-center justify-center font-bold text-xs shrink-0 border border-hairline-dark relative">
                    {partner.fullName.slice(0, 1).toUpperCase()}
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-brand-green rounded-full border-2 border-canvas"></span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-ink truncate max-w-[120px]">
                        {partner.fullName}
                      </h4>
                      <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded font-mono bg-canvas border border-hairline text-steel">
                        {partner.role === "creator" ? "Creator" : "Editor"}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate truncate mt-0.5">
                      Bấm vào để xem tin nhắn gần đây...
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Panel bên phải: Khu vực hiển thị tin nhắn chat */}
      <div className="flex-1 flex flex-col bg-canvas">
        {activePartner ? (
          <div ref={chatAreaRef} className="flex-1 flex flex-col h-full" style={{ opacity: 0 }}>
            {/* Header Box Chat */}
            <div className="h-16 border-b border-hairline-soft px-5 flex items-center justify-between bg-surface/20 shrink-0">
              <div className="flex items-center gap-3">
                {/* Back button trên Mobile */}
                <button
                  onClick={() => setActivePartner(null)}
                  className="md:hidden p-1.5 rounded-full hover:bg-surface text-stone cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <div className="w-9 h-9 rounded-full bg-charcoal text-on-dark flex items-center justify-center font-bold text-xs border border-hairline-dark">
                  {activePartner.fullName.slice(0, 1).toUpperCase()}
                </div>

                <div>
                  <h3 className="text-xs font-bold text-ink flex items-center gap-1.5">
                    {activePartner.fullName}
                    <Circle className="w-2 h-2 fill-brand-green text-brand-green" />
                  </h3>
                  <p className="text-[9px] text-stone font-semibold uppercase font-mono tracking-wider">
                    {activePartner.role === "creator" ? "Nhà sáng tạo (Creator)" : "Biên tập viên (Freelancer)"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {activePartner.role === "freelancer" && (
                  <button
                    onClick={() => router.push(`/freelancers/${activePartner.id}`)}
                    className="flex items-center gap-1 px-3 py-1 bg-surface border border-hairline hover:bg-canvas text-[10px] font-semibold rounded-md text-charcoal transition-colors cursor-pointer"
                  >
                    Hồ sơ chi tiết <ExternalLink className="w-2.5 h-2.5" />
                  </button>
                )}
                {jobParam && (
                  <span className="text-[9px] font-mono font-bold text-brand-green bg-brand-green/10 border border-brand-green/20 px-2.5 py-0.5 rounded-full">
                    💼 Dự án: {jobParam}
                  </span>
                )}
              </div>
            </div>

            {/* Khung chat hiển thị hội thoại */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-custom bg-canvas-light/20">
              {loadingMessages ? (
                <div className="h-full flex items-center justify-center text-xs text-stone gap-2">
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-brand-green border-t-transparent rounded-full" />
                  Đang tải tin nhắn...
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-stone space-y-3 p-8 border border-dashed border-hairline-soft/70 m-4 rounded-xl bg-surface/5">
                  <MessageSquare className="w-8 h-8 text-hairline" />
                  <p className="text-xs font-semibold">Chưa có tin nhắn nào</p>
                  <p className="text-[10px] text-slate text-center max-w-xs leading-relaxed">
                    Hãy gửi lời chào đầu tiên để bắt đầu trao đổi chi tiết về công việc, chi phí, và định hướng dự án nhé.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const isOwnMessage = msg.sender_id === (session?.role === "creator" ? "mock-creator-id" : "fl-1");
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`flex gap-2.5 max-w-[75%] ${isOwnMessage ? "flex-row-reverse" : "flex-row"}`}>
                          {/* Avatar người gửi (chỉ hiển thị cho tin nhắn nhận) */}
                          {!isOwnMessage && (
                            <div className="w-7 h-7 rounded-full bg-charcoal text-on-dark flex items-center justify-center font-bold text-[10px] border border-hairline-dark shrink-0">
                              {msg.sender_name.slice(0, 1).toUpperCase()}
                            </div>
                          )}
                          
                          <div className="space-y-1">
                            {/* Tên & Thời gian gửi */}
                            <div className={`flex items-center gap-1.5 ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                              <span className="text-[8px] font-bold text-steel">
                                {isOwnMessage ? "Bạn" : msg.sender_name}
                              </span>
                              <span className="text-[8px] text-stone">
                                {new Date(msg.created_at).toLocaleTimeString("vi-VN", {
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </span>
                            </div>

                            {/* Bubble tin nhắn */}
                            <div
                              className={`p-3 text-xs leading-relaxed rounded-2xl shadow-sm ${
                                isOwnMessage
                                  ? "bg-ink text-on-dark rounded-tr-none border border-hairline-dark"
                                  : "bg-surface text-charcoal rounded-tl-none border border-hairline-soft"
                              }`}
                            >
                              <p className="whitespace-pre-line">{msg.content}</p>
                            </div>

                            {/* Trạng thái đã đọc (chỉ cho own message ở góc dưới cùng) */}
                            {isOwnMessage && (
                              <div className="flex justify-end items-center gap-0.5 text-[8px] text-stone">
                                {msg.is_read ? (
                                  <span className="text-brand-green font-semibold flex items-center gap-0.5">
                                    <Check className="w-2.5 h-2.5" /> Đã xem
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-0.5 text-stone/70">
                                    <Clock className="w-2.5 h-2.5" /> Đã gửi
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input bar ở cuối */}
            <div className="p-4 border-t border-hairline-soft bg-surface/10 shrink-0">
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <input
                  type="text"
                  placeholder={`Gửi tin nhắn cho ${activePartner.fullName}...`}
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  className="flex-1 h-10 px-4 bg-surface text-xs text-charcoal border border-hairline rounded-full focus:border-brand-green focus:outline-none transition-colors"
                  disabled={sending}
                  required
                />
                
                <button
                  type="submit"
                  disabled={sending || !newMessageText.trim()}
                  className="w-10 h-10 rounded-full bg-ink text-on-dark hover:bg-brand-green hover:text-canvas transition-all flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-50 disabled:hover:bg-ink disabled:hover:text-on-dark"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Splash Screen chưa chọn cuộc trò chuyện */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 bg-canvas-light/10">
            <div className="w-16 h-16 bg-surface/50 border border-hairline rounded-full flex items-center justify-center text-brand-green/30 animate-pulse">
              <MessageSquare className="w-8 h-8 text-brand-green" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink uppercase tracking-wider">Hộp thư trao đổi công việc</h3>
              <p className="text-xs text-slate mt-1 max-w-sm leading-relaxed">
                Chọn một liên hệ từ danh sách bên trái để bắt đầu cuộc trò chuyện. Bạn có thể thảo luận kịch bản, đàm phán báo giá, và duyệt sản phẩm video/shorts trực tiếp.
              </p>
            </div>
            
            <div className="pt-6 border-t border-hairline-soft w-64 text-[10px] text-stone leading-relaxed flex items-center gap-1.5 justify-center">
              <Clock className="w-3.5 h-3.5" /> Đồng bộ & kiểm thử mượt mà 60fps
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
