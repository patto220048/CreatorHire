// lib/supabase/client.ts
// Stub helper for Supabase. Chứa kết nối thực tế và dữ liệu mẫu để chạy demo offline.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-url.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

// Bạn có thể cài đặt `@supabase/supabase-js` bằng lệnh: `npm install @supabase/supabase-js`
// Dưới đây là bộ khung kết nối Supabase, tự động chuyển đổi giữa offline demo và kết nối thực tế.
export const getSupabaseClient = async () => {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    return createClient(supabaseUrl, supabaseAnonKey);
  } catch (e) {
    console.warn("Supabase SDK chưa được cài đặt. Hệ thống đang sử dụng Offline Mock Mode.");
    return {
      auth: {
        signUp: async (data: any) => ({ data: { user: { id: "mock-user-123", ...data } }, error: null }),
        signInWithPassword: async (data: any) => ({ data: { user: { id: "mock-user-123", ...data } }, error: null }),
        signOut: async () => ({ error: null }),
        getUser: async () => ({ data: { user: { id: "mock-user-123", email: "demo@creatorhire.vn" } }, error: null }),
      },
      from: (table: string) => ({
        select: () => ({
          eq: () => ({ data: [], error: null }),
          order: () => ({ data: [], error: null }),
        }),
        insert: () => ({ data: [], error: null }),
        update: () => ({ data: [], error: null }),
      }),
    };
  }
};
