// app/api/chat/actions.ts
// Server Actions quản lý tin nhắn chat trực tuyến

"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export interface Message {
  id: string;
  job_id: string | null;
  sender_id: string;
  sender_name: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface ChatPartner {
  id: string;
  fullName: string;
  role: "creator" | "freelancer";
  avatarUrl: string | null;
}

// Gửi tin nhắn mới
export async function sendMessageAction(
  jobId: string | null,
  receiverId: string,
  content: string
) {
  const cookieStore = await cookies();
  const mockSession = cookieStore.get("mock-session");
  const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                 !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                 (jobId && jobId.startsWith("mock-")) || 
                 (mockSession && mockSession.value);

  if (isMock) {
    try {
      if (!mockSession || !mockSession.value) {
        return { error: "Bạn cần đăng nhập để gửi tin nhắn." };
      }

      const sessionData = JSON.parse(decodeURIComponent(mockSession.value));
      const senderId = sessionData.role === "creator" ? "mock-creator-id" : "fl-1";
      const senderName = sessionData.fullName || "Người dùng";

      // Đọc tin nhắn hiện tại từ cookie
      const mockMessagesCookie = cookieStore.get("mock-messages");
      let currentMessages: Message[] = [];
      if (mockMessagesCookie && mockMessagesCookie.value) {
        try {
          currentMessages = JSON.parse(decodeURIComponent(mockMessagesCookie.value));
        } catch (e) {}
      }

      const newMessage: Message = {
        id: `mock-msg-${Date.now()}`,
        job_id: jobId,
        sender_id: senderId,
        sender_name: senderName,
        receiver_id: receiverId,
        content: content,
        is_read: false,
        created_at: new Date().toISOString(),
      };

      currentMessages.push(newMessage);

      cookieStore.set("mock-messages", JSON.stringify(currentMessages), {
        path: "/",
        maxAge: 86400 * 30, // 30 ngày
      });

      revalidatePath("/chat");
      return { success: true, data: newMessage };
    } catch (e) {
      return { error: "Lỗi lưu tin nhắn giả lập." };
    }
  } else {
    try {
      const supabase = await getSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { error: "Bạn chưa đăng nhập." };
      }

      const { data, error } = await supabase
        .from("messages")
        .insert({
          job_id: jobId,
          sender_id: user.id,
          receiver_id: receiverId,
          content: content,
        })
        .select()
        .single();

      if (error) {
        return { error: `Lỗi gửi tin nhắn: ${error.message}` };
      }

      const senderName = user.user_metadata?.full_name || "Thành viên";
      const formattedMessage: Message = {
        id: data.id,
        job_id: data.job_id,
        sender_id: data.sender_id,
        sender_name: senderName,
        receiver_id: data.receiver_id,
        content: data.content,
        is_read: data.is_read,
        created_at: new Date(data.created_at).toISOString(),
      };

      revalidatePath("/chat");
      return { success: true, data: formattedMessage };
    } catch (e) {
      return { error: "Lỗi kết nối cơ sở dữ liệu." };
    }
  }
}

// Lấy danh sách tin nhắn giữa current user và otherUserId
export async function getMessagesAction(otherUserId: string, jobId?: string) {
  const cookieStore = await cookies();
  const mockSession = cookieStore.get("mock-session");
  const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                 !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                 (jobId && jobId.startsWith("mock-")) || 
                 (mockSession && mockSession.value);

  if (isMock) {
    try {
      if (!mockSession || !mockSession.value) {
        return { success: true, data: [] };
      }

      const sessionData = JSON.parse(decodeURIComponent(mockSession.value));
      const currentUserId = sessionData.role === "creator" ? "mock-creator-id" : "fl-1";

      const mockMessagesCookie = cookieStore.get("mock-messages");
      if (mockMessagesCookie && mockMessagesCookie.value) {
        const allMessages: Message[] = JSON.parse(decodeURIComponent(mockMessagesCookie.value));
        const filtered = allMessages.filter(
          (m) =>
            ((m.sender_id === currentUserId && m.receiver_id === otherUserId) ||
              (m.sender_id === otherUserId && m.receiver_id === currentUserId)) &&
            (!jobId || m.job_id === jobId)
        );
        return { success: true, data: filtered };
      }
      return { success: true, data: [] };
    } catch (e) {
      return { error: "Lỗi đọc tin nhắn giả lập." };
    }
  } else {
    try {
      const supabase = await getSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { error: "Bạn chưa đăng nhập." };
      }

      let query = supabase
        .from("messages")
        .select(`
          id,
          job_id,
          sender_id,
          receiver_id,
          content,
          is_read,
          created_at,
          profiles!messages_sender_id_fkey (full_name)
        `)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`);

      if (jobId) {
        query = query.eq("job_id", jobId);
      }

      const { data, error } = await query.order("created_at", { ascending: true });

      if (error) {
        return { error: `Lỗi tải tin nhắn: ${error.message}` };
      }

      const formatted: Message[] = (data || []).map((m: any) => ({
        id: m.id,
        job_id: m.job_id,
        sender_id: m.sender_id,
        sender_name: m.profiles?.full_name || "Thành viên",
        receiver_id: m.receiver_id,
        content: m.content,
        is_read: m.is_read,
        created_at: new Date(m.created_at).toISOString(),
      }));

      return { success: true, data: formatted };
    } catch (e) {
      return { error: "Lỗi kết nối cơ sở dữ liệu." };
    }
  }
}

// Đánh dấu đã đọc
export async function markMessagesAsReadAction(senderId: string) {
  const cookieStore = await cookies();
  const mockSession = cookieStore.get("mock-session");
  const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                 !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                 (mockSession && mockSession.value);

  if (isMock) {
    try {
      if (!mockSession || !mockSession.value) return { success: true };
      const sessionData = JSON.parse(decodeURIComponent(mockSession.value));
      const currentUserId = sessionData.role === "creator" ? "mock-creator-id" : "fl-1";

      const mockMessagesCookie = cookieStore.get("mock-messages");
      if (mockMessagesCookie && mockMessagesCookie.value) {
        const allMessages: Message[] = JSON.parse(decodeURIComponent(mockMessagesCookie.value));
        const updated = allMessages.map((m) => {
          if (m.sender_id === senderId && m.receiver_id === currentUserId) {
            return { ...m, is_read: true };
          }
          return m;
        });

        cookieStore.set("mock-messages", JSON.stringify(updated), {
          path: "/",
          maxAge: 86400 * 30,
        });
      }
      return { success: true };
    } catch (e) {
      return { error: "Lỗi cập nhật tin nhắn giả lập." };
    }
  } else {
    try {
      const supabase = await getSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { error: "Bạn chưa đăng nhập." };
      }

      const { error } = await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("sender_id", senderId)
        .eq("receiver_id", user.id);

      if (error) {
        return { error: `Lỗi cập nhật tin nhắn: ${error.message}` };
      }

      return { success: true };
    } catch (e) {
      return { error: "Lỗi kết nối." };
    }
  }
}

// Lấy danh sách những người đã từng chat
export async function getChatPartnersAction() {
  const cookieStore = await cookies();
  const mockSession = cookieStore.get("mock-session");
  const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                 !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                 (mockSession && mockSession.value);

  if (isMock) {
    try {
      if (!mockSession || !mockSession.value) return { success: true, data: [] };
      const sessionData = JSON.parse(decodeURIComponent(mockSession.value));
      const currentUserId = sessionData.role === "creator" ? "mock-creator-id" : "fl-1";

      const mockMessagesCookie = cookieStore.get("mock-messages");
      if (mockMessagesCookie && mockMessagesCookie.value) {
        const allMessages: Message[] = JSON.parse(decodeURIComponent(mockMessagesCookie.value));
        const partnerIds = new Set<string>();
        allMessages.forEach((m) => {
          if (m.sender_id === currentUserId) partnerIds.add(m.receiver_id);
          if (m.receiver_id === currentUserId) partnerIds.add(m.sender_id);
        });

        const partners = Array.from(partnerIds).map((id) => {
          const isCreatorPartner = id === "mock-creator-id";
          return {
            id,
            fullName: isCreatorPartner ? "Huy Nguyễn (Creator)" : "Hoàng Minh (Editor)",
            role: isCreatorPartner ? "creator" : "freelancer",
            avatarUrl: null,
          } as ChatPartner;
        });

        return { success: true, data: partners };
      }
      return { success: true, data: [] };
    } catch (e) {
      return { error: "Lỗi đọc đối tác chat giả lập." };
    }
  } else {
    try {
      const supabase = await getSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { error: "Bạn chưa đăng nhập." };
      }

      const { data, error } = await supabase
        .from("messages")
        .select(`
          sender_id,
          receiver_id
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

      if (error) {
        return { error: `Lỗi truy vấn đối tác chat: ${error.message}` };
      }

      const partnerIds = new Set<string>();
      (data || []).forEach((m: any) => {
        if (m.sender_id !== user.id) partnerIds.add(m.sender_id);
        if (m.receiver_id !== user.id) partnerIds.add(m.receiver_id);
      });

      if (partnerIds.size === 0) return { success: true, data: [] };

      const { data: profiles, error: profError } = await supabase
        .from("profiles")
        .select("id, full_name, role, avatar_url")
        .in("id", Array.from(partnerIds));

      if (profError) {
        return { error: `Lỗi tải hồ sơ đối tác chat: ${profError.message}` };
      }

      const formattedPartners = (profiles || []).map((p: any) => ({
        id: p.id,
        fullName: p.full_name,
        role: p.role as "creator" | "freelancer",
        avatarUrl: p.avatar_url,
      }));

      return { success: true, data: formattedPartners };
    } catch (e) {
      return { error: "Lỗi kết nối." };
    }
  }
}

// Lấy số lượng tin nhắn chưa đọc
export async function getUnreadMessageCountAction() {
  const cookieStore = await cookies();
  const mockSession = cookieStore.get("mock-session");
  const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                 !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                 (mockSession && mockSession.value);

  if (isMock) {
    try {
      if (!mockSession || !mockSession.value) return { success: true, count: 0 };
      const sessionData = JSON.parse(decodeURIComponent(mockSession.value));
      const currentUserId = sessionData.role === "creator" ? "mock-creator-id" : "fl-1";

      const mockMessagesCookie = cookieStore.get("mock-messages");
      if (mockMessagesCookie && mockMessagesCookie.value) {
        const allMessages: Message[] = JSON.parse(decodeURIComponent(mockMessagesCookie.value));
        const unreadCount = allMessages.filter(
          (m) => m.receiver_id === currentUserId && !m.is_read
        ).length;
        return { success: true, count: unreadCount };
      }
      return { success: true, count: 0 };
    } catch (e) {
      return { success: true, count: 0 };
    }
  } else {
    try {
      const supabase = await getSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: true, count: 0 };

      const { count, error } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("is_read", false);

      if (error) return { error: error.message };
      return { success: true, count: count || 0 };
    } catch (e) {
      return { success: true, count: 0 };
    }
  }
}

// Lấy chi tiết các tin nhắn chưa đọc
export async function getUnreadMessagesAction() {
  const cookieStore = await cookies();
  const mockSession = cookieStore.get("mock-session");
  const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                 !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                 (mockSession && mockSession.value);

  if (isMock) {
    try {
      if (!mockSession || !mockSession.value) return { success: true, data: [] };
      const sessionData = JSON.parse(decodeURIComponent(mockSession.value));
      const currentUserId = sessionData.role === "creator" ? "mock-creator-id" : "fl-1";

      const mockMessagesCookie = cookieStore.get("mock-messages");
      if (mockMessagesCookie && mockMessagesCookie.value) {
        const allMessages: Message[] = JSON.parse(decodeURIComponent(mockMessagesCookie.value));
        const unread = allMessages.filter(
          (m) => m.receiver_id === currentUserId && !m.is_read
        );
        return { success: true, data: unread };
      }
      return { success: true, data: [] };
    } catch (e) {
      return { error: "Lỗi đọc tin nhắn giả lập." };
    }
  } else {
    try {
      const supabase = await getSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: true, data: [] };

      const { data, error } = await supabase
        .from("messages")
        .select(`
          id,
          job_id,
          sender_id,
          receiver_id,
          content,
          is_read,
          created_at,
          profiles!messages_sender_id_fkey (full_name, role)
        `)
        .eq("receiver_id", user.id)
        .eq("is_read", false)
        .order("created_at", { ascending: true });

      if (error) return { error: error.message };

      const formatted: Message[] = (data || []).map((m: any) => ({
        id: m.id,
        job_id: m.job_id,
        sender_id: m.sender_id,
        sender_name: m.profiles?.full_name || "Thành viên",
        receiver_id: m.receiver_id,
        content: m.content,
        is_read: m.is_read,
        created_at: new Date(m.created_at).toISOString(),
      }));

      return { success: true, data: formatted };
    } catch (e) {
      return { error: "Lỗi kết nối cơ sở dữ liệu." };
    }
  }
}
