"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email || !password) {
      setError("Vui lòng nhập đầy đủ Email và Mật khẩu.");
      setLoading(false);
      return;
    }

    try {
      const supabase = await getSupabaseClient();
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
      } else {
        // Lấy thông tin user metadata (role) để chuyển hướng về Dashboard tương ứng
        const role = data.user?.user_metadata?.role || "creator";
        
        if (role === "freelancer") {
          router.push("/freelancer");
        } else {
          router.push("/creator");
        }
      }
    } catch (err: any) {
      setError("Đã xảy ra lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-canvas font-sans">
      {/* Header */}
      <header className="border-b border-hairline-soft py-4 px-6 bg-canvas/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-wider text-ink">
            creator<span className="text-brand-green">hire.</span>
          </Link>
          <span className="text-xs text-steel">
            Chưa có tài khoản?{" "}
            <Link href="/register" className="text-ink font-semibold hover:underline">
              Đăng ký ngay
            </Link>
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md bg-canvas border border-hairline p-8 rounded-lg shadow-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-ink mb-2">Chào mừng trở lại</h1>
            <p className="text-xs text-steel">
              Đăng nhập vào hệ thống để tiếp tục công việc của bạn.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-md bg-brand-error/10 border border-brand-error/20 text-xs text-brand-error text-center font-medium">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-steel uppercase tracking-wider mb-2">
                Địa chỉ Email
              </label>
              <input
                type="email"
                placeholder="name@example.com"
                className="w-full h-10 px-3 py-2 bg-canvas text-charcoal border border-hairline rounded-md text-xs focus:border-brand-green focus:outline-none transition-colors"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-steel uppercase tracking-wider">
                  Mật khẩu
                </label>
                <Link href="/forgot-password" className="text-[11px] text-steel hover:text-ink font-medium">
                  Quên mật khẩu?
                </Link>
              </div>
              <input
                type="password"
                placeholder="Nhập mật khẩu của bạn"
                className="w-full h-10 px-3 py-2 bg-canvas text-charcoal border border-hairline rounded-md text-xs focus:border-brand-green focus:outline-none transition-colors"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full h-10 bg-ink text-on-dark text-xs font-semibold rounded-full hover:bg-charcoal transition-colors disabled:opacity-50 flex items-center justify-center"
              disabled={loading}
            >
              {loading ? "Đang xử lý..." : "Đăng Nhập"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
