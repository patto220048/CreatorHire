// lib/supabase/middleware.ts
// Helper tạo client Supabase dành riêng cho Next.js Middleware để gia hạn session cookie

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function createMiddlewareClient(request: NextRequest) {
  // Khởi tạo response ban đầu
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Hỗ trợ chế độ Mock Offline nếu thiếu biến môi trường
  if (!supabaseUrl || !supabaseAnonKey) {
    // Trả về Mock Client có khả năng đọc "mock-session" từ cookies để kiểm tra chuyển hướng
    const mockSession = request.cookies.get("mock-session");
    
    const mockSupabase = {
      auth: {
        getUser: async () => {
          if (mockSession && mockSession.value) {
            try {
              const sessionData = JSON.parse(mockSession.value);
              return { 
                data: { 
                  user: { 
                    id: "mock-user-123", 
                    email: sessionData.email,
                    user_metadata: { 
                      role: sessionData.role, 
                      full_name: sessionData.fullName 
                    } 
                  } 
                }, 
                error: null 
              };
            } catch (e) {
              return { data: { user: null }, error: null };
            }
          }
          return { data: { user: null }, error: null };
        }
      }
    } as any;

    return { supabase: mockSupabase, response };
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  return { supabase, response };
}
