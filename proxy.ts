// middleware.ts
// Next.js 16 Middleware để gia hạn session cookie, bảo vệ các tuyến đường riêng tư và phân quyền Role

import { type NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const { supabase, response } = await createMiddlewareClient(request);
  
  // Lấy thông tin user hiện tại từ session
  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  console.log(`[Proxy Debug] Path: "${path}" | User: "${user?.email || "Guest"}" | Role: "${user?.user_metadata?.role || "None"}"`);

  // Định nghĩa các vùng truy cập
  const isCreatorRoute = path === "/creator" || path.startsWith("/creator/");
  const isFreelancerRoute = path === "/freelancer" || path.startsWith("/freelancer/");
  const isAuthRoute = path.startsWith("/login") || path.startsWith("/register");

  // Helper để redirect không bị cache bởi trình duyệt
  const redirectNoCache = (url: URL | string) => {
    const res = NextResponse.redirect(typeof url === "string" ? new URL(url, request.url) : url);
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.headers.set("Pragma", "no-cache");
    res.headers.set("Expires", "0");
    return res;
  };

  // 1. Kiểm tra nếu truy cập vào các tuyến đường cần đăng nhập
  if (isCreatorRoute || isFreelancerRoute) {
    if (!user) {
      // Chưa đăng nhập -> Redirect về trang Login
      const redirectUrl = new URL("/login", request.url);
      // Lưu lại trang đích để sau khi đăng nhập thành công có thể quay lại
      redirectUrl.searchParams.set("redirect", path);
      return redirectNoCache(redirectUrl);
    }

    // Đã đăng nhập -> Kiểm tra vai trò (Role)
    const role = user.user_metadata?.role;

    if (isCreatorRoute && role !== "creator") {
      // Là Freelancer nhưng cố truy cập Creator Dashboard -> Redirect về Freelancer Dashboard
      return redirectNoCache(new URL("/freelancer", request.url));
    }

    if (isFreelancerRoute && role !== "freelancer") {
      // Là Creator nhưng cố truy cập Freelancer Dashboard -> Redirect về Creator Dashboard
      return redirectNoCache(new URL("/creator", request.url));
    }
  }

  // 2. Nếu đã đăng nhập mà cố tình truy cập trang Login/Register -> Redirect về Dashboard tương ứng
  if (isAuthRoute && user) {
    const role = user.user_metadata?.role || "creator";
    const dashboardPath = role === "freelancer" ? "/freelancer" : "/creator";
    return redirectNoCache(new URL(dashboardPath, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Áp dụng middleware cho mọi request ngoại trừ:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Các định dạng ảnh tĩnh phổ biến
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
