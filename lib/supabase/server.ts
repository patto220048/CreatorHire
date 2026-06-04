// lib/supabase/server.ts
// Supabase Server client helper để truy vấn DB trực tiếp trên Server (React Server Components, API Routes)

import { createClient } from "@supabase/supabase-js";


export function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Chưa cấu hình biến môi trường Supabase URL hoặc Anon Key. Server client đang chạy ở chế độ giả lập.");
    
    // Trả về mock client tương tự bên client-side để tránh crash app khi chạy thử offline
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
      },
      from: (table: string) => ({
        select: () => ({
          eq: () => ({ data: [], error: null }),
          order: () => ({ data: [], error: null }),
        }),
      }),
    } as any;
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}
