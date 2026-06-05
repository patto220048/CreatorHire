// app/api/notifications/actions.ts
// Server Actions quản lý thông báo người dùng

"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  content: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

// Lấy danh sách thông báo của người dùng hiện tại
export async function getNotificationsAction() {
  const cookieStore = await cookies();
  const mockSession = cookieStore.get("mock-session");
  const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                 !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                 (mockSession && mockSession.value);

  if (isMock) {
    try {
      if (!mockSession || !mockSession.value) {
        return { success: true, data: [] };
      }

      const sessionData = JSON.parse(decodeURIComponent(mockSession.value));
      const currentUserId = sessionData.role === "creator" ? "mock-creator-id" : "fl-1";

      const mockNotifsCookie = cookieStore.get("mock-notifications");
      let notifications: Notification[] = [];

      if (mockNotifsCookie && mockNotifsCookie.value) {
        try {
          notifications = JSON.parse(decodeURIComponent(mockNotifsCookie.value));
        } catch (e) {}
      } else {
        // Tạo dữ liệu thông báo mặc định nếu chưa có
        const defaultNotifs: Notification[] = [
          {
            id: "mock-notif-1",
            user_id: "mock-creator-id",
            title: "Ứng tuyển mới cho dự án",
            content: "Hoàng Minh (Editor) đã gửi báo giá cho dự án Shorts Công nghệ của bạn.",
            link: "/creator",
            is_read: false,
            created_at: new Date(Date.now() - 3600000).toISOString(), // 1 giờ trước
          },
          {
            id: "mock-notif-2",
            user_id: "mock-creator-id",
            title: "Bản thảo video nháp đã đăng tải",
            content: "Hoàng Minh (Editor) đã cập nhật phiên bản nháp V1. Vui lòng xem và duyệt.",
            link: "/creator",
            is_read: false,
            created_at: new Date(Date.now() - 10800000).toISOString(), // 3 giờ trước
          },
          {
            id: "mock-notif-3",
            user_id: "fl-1",
            title: "Ký quỹ đã được kích hoạt",
            content: "Huy Nguyễn (Creator) đã ký quỹ thành công 3,500,000 VND cho dự án viết kịch bản hoạt hình.",
            link: "/freelancer",
            is_read: false,
            created_at: new Date(Date.now() - 7200000).toISOString(), // 2 giờ trước
          },
          {
            id: "mock-notif-4",
            user_id: "fl-1",
            title: "Giải ngân Escrow thành công",
            content: "Creator đã đồng ý phê duyệt sản phẩm và giải ngân 3,500,000 VND về ví của bạn.",
            link: "/freelancer",
            is_read: true,
            created_at: new Date(Date.now() - 86400000).toISOString(), // 1 ngày trước
          }
        ];
        
        cookieStore.set("mock-notifications", JSON.stringify(defaultNotifs), {
          path: "/",
          maxAge: 86400 * 30,
        });
        notifications = defaultNotifs;
      }

      // Lọc thông báo cho user hiện tại
      const userNotifs = notifications
        .filter((n) => n.user_id === currentUserId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return { success: true, data: userNotifs };
    } catch (e) {
      return { error: "Lỗi tải thông báo giả lập." };
    }
  } else {
    try {
      const supabase = await getSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { error: "Bạn chưa đăng nhập." };
      }

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        return { error: `Lỗi tải thông báo: ${error.message}` };
      }

      const formatted: Notification[] = (data || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        title: item.title,
        content: item.content,
        link: item.link,
        is_read: item.is_read,
        created_at: new Date(item.created_at).toISOString(),
      }));

      return { success: true, data: formatted };
    } catch (e) {
      return { error: "Lỗi kết nối cơ sở dữ liệu." };
    }
  }
}

// Tạo thông báo mới
export async function createNotificationAction(
  userId: string,
  title: string,
  content: string,
  link?: string
) {
  const cookieStore = await cookies();
  const mockSession = cookieStore.get("mock-session");
  const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                 !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                 (mockSession && mockSession.value);

  if (isMock) {
    try {
      const mockNotifsCookie = cookieStore.get("mock-notifications");
      let currentNotifs: Notification[] = [];
      if (mockNotifsCookie && mockNotifsCookie.value) {
        try {
          currentNotifs = JSON.parse(decodeURIComponent(mockNotifsCookie.value));
        } catch (e) {}
      }

      const newNotif: Notification = {
        id: `mock-notif-${Date.now()}`,
        user_id: userId,
        title,
        content,
        link: link || null,
        is_read: false,
        created_at: new Date().toISOString(),
      };

      currentNotifs.push(newNotif);

      cookieStore.set("mock-notifications", JSON.stringify(currentNotifs), {
        path: "/",
        maxAge: 86400 * 30,
      });

      return { success: true, data: newNotif };
    } catch (e) {
      return { error: "Lỗi tạo thông báo giả lập." };
    }
  } else {
    try {
      const supabase = await getSupabaseServerClient();
      const { data, error } = await supabase
        .from("notifications")
        .insert({
          user_id: userId,
          title,
          content,
          link: link || null,
        })
        .select()
        .single();

      if (error) {
        return { error: `Lỗi tạo thông báo: ${error.message}` };
      }

      return { success: true, data };
    } catch (e) {
      return { error: "Lỗi kết nối." };
    }
  }
}

// Đánh dấu đã đọc một thông báo
export async function markNotificationAsReadAction(notificationId: string) {
  const cookieStore = await cookies();
  const mockSession = cookieStore.get("mock-session");
  const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                 !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                 notificationId.startsWith("mock-") ||
                 (mockSession && mockSession.value);

  if (isMock) {
    try {
      const mockNotifsCookie = cookieStore.get("mock-notifications");
      if (mockNotifsCookie && mockNotifsCookie.value) {
        const currentNotifs: Notification[] = JSON.parse(decodeURIComponent(mockNotifsCookie.value));
        const updated = currentNotifs.map((n) => {
          if (n.id === notificationId) {
            return { ...n, is_read: true };
          }
          return n;
        });

        cookieStore.set("mock-notifications", JSON.stringify(updated), {
          path: "/",
          maxAge: 86400 * 30,
        });
      }
      return { success: true };
    } catch (e) {
      return { error: "Lỗi cập nhật thông báo giả lập." };
    }
  } else {
    try {
      const supabase = await getSupabaseServerClient();
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      if (error) {
        return { error: `Lỗi cập nhật thông báo: ${error.message}` };
      }

      return { success: true };
    } catch (e) {
      return { error: "Lỗi kết nối." };
    }
  }
}

// Đánh dấu đã đọc tất cả thông báo
export async function markAllNotificationsAsReadAction() {
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

      const mockNotifsCookie = cookieStore.get("mock-notifications");
      if (mockNotifsCookie && mockNotifsCookie.value) {
        const currentNotifs: Notification[] = JSON.parse(decodeURIComponent(mockNotifsCookie.value));
        const updated = currentNotifs.map((n) => {
          if (n.user_id === currentUserId) {
            return { ...n, is_read: true };
          }
          return n;
        });

        cookieStore.set("mock-notifications", JSON.stringify(updated), {
          path: "/",
          maxAge: 86400 * 30,
        });
      }
      return { success: true };
    } catch (e) {
      return { error: "Lỗi cập nhật thông báo giả lập." };
    }
  } else {
    try {
      const supabase = await getSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { error: "Bạn chưa đăng nhập." };
      }

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id);

      if (error) {
        return { error: `Lỗi cập nhật thông báo: ${error.message}` };
      }

      return { success: true };
    } catch (e) {
      return { error: "Lỗi kết nối." };
    }
  }
}
