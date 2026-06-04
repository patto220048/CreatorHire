// lib/supabase/client.ts
// Supabase Client helper cho Client Components (Cookie-based sử dụng @supabase/ssr)

import { createBrowserClient } from "@supabase/ssr";

let supabaseInstance: any = null;

export const getSupabaseClient = async () => {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Hỗ trợ chế độ Mock Offline nếu không có biến môi trường
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase URL hoặc Anon Key chưa cấu hình. Hệ thống đang sử dụng Mock Mode.");
    supabaseInstance = {
      auth: {
        signUp: async (data: any) => {
          const role = data.options?.data?.role || "creator";
          const fullName = data.options?.data?.full_name || "Người dùng mới";
          
          if (typeof document !== "undefined") {
            const mockSessionVal = { email: data.email, role, fullName };
            document.cookie = `mock-session=${encodeURIComponent(JSON.stringify(mockSessionVal))}; path=/; max-age=86400`;
          }

          return { 
            data: { 
              user: { 
                id: "mock-user-123", 
                email: data.email, 
                user_metadata: { role, full_name: fullName } 
              } 
            }, 
            error: null 
          };
        },
        signInWithPassword: async (data: any) => {
          // Trả về mock user dựa trên email nhập vào để dễ test (nếu email chứa 'freelancer' thì có role freelancer)
          const role = data.email.includes("freelancer") ? "freelancer" : "creator";
          const fullName = role === "freelancer" ? "Mock Freelancer" : "Mock Creator";
          
          if (typeof document !== "undefined") {
            const mockSessionVal = { email: data.email, role, fullName };
            document.cookie = `mock-session=${encodeURIComponent(JSON.stringify(mockSessionVal))}; path=/; max-age=86400`;
          }

          return { 
            data: { 
              user: { 
                id: "mock-user-123", 
                email: data.email, 
                user_metadata: { role, full_name: fullName } 
              } 
            }, 
            error: null 
          };
        },
        signOut: async () => {
          if (typeof document !== "undefined") {
            // Xóa cookie mock-session bằng cách đặt max-age = 0
            document.cookie = "mock-session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          }
          return { error: null };
        },
        getUser: async () => {
          // Trích xuất từ cookie ở phía Client nếu có
          if (typeof document !== "undefined") {
            const cookies = document.cookie.split(";");
            const sessionCookie = cookies.find(c => c.trim().startsWith("mock-session="));
            if (sessionCookie) {
              try {
                const val = decodeURIComponent(sessionCookie.split("=")[1]);
                const sessionData = JSON.parse(val);
                return { 
                  data: { 
                    user: { 
                      id: "mock-user-123", 
                      email: sessionData.email, 
                      user_metadata: { role: sessionData.role, full_name: sessionData.fullName } 
                    } 
                  }, 
                  error: null 
                };
              } catch (e) {
                // Lỗi parse -> Trả về null
              }
            }
          }
          return { data: { user: null }, error: null };
        },
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
    return supabaseInstance;
  }

  supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
};
