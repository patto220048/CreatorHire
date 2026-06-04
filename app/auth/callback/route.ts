// app/auth/callback/route.ts
// Route Handler xử lý việc trao đổi Auth Code lấy Session Cookie sau khi xác thực email hoặc OAuth

import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await getSupabaseServerClient();
    
    // Trao đổi mã code lấy session
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host"); // Origin gốc trước load balancer
      const isLocalEnv = process.env.NODE_ENV === "development";
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    } else {
      console.error("Lỗi trao đổi mã Code lấy Session:", error.message);
    }
  }

  // Chuyển hướng về trang lỗi nếu xác thực thất bại
  return NextResponse.redirect(`${origin}/login?error=auth-code-error`);
}
