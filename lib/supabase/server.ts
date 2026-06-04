// lib/supabase/server.ts
// Supabase Server client helper để truy vấn DB trực tiếp trên Server (React Server Components, API Routes)

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Hỗ trợ chế độ Mock Offline nếu không có biến môi trường
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Chưa cấu hình biến môi trường Supabase. Server client đang chạy ở chế độ giả lập.");
    return {
      auth: {
        getUser: async () => ({ 
          data: { 
            user: { 
              id: "mock-user-123", 
              email: "demo@creatorhire.vn", 
              user_metadata: { role: "creator", full_name: "Demo Creator" } 
            } 
          }, 
          error: null 
        }),
      },
      from: (table: string) => ({
        select: () => ({
          eq: () => ({ data: [], error: null }),
          order: () => ({ data: [], error: null }),
        }),
      }),
    } as any;
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch (error) {
          // Lỗi này có thể xảy ra khi set cookie từ Server Component (Next.js không cho phép sửa cookie ở SC).
          // Điều này là bình thường và có thể bỏ qua vì Middleware sẽ thực hiện refresh session.
        }
      },
    },
  });
}
