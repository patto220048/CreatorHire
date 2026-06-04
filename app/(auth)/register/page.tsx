"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"creator" | "freelancer">("creator");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!fullName || !email || !password) {
      setError("Vui lòng điền đầy đủ tất cả các trường.");
      setLoading(false);
      return;
    }

    try {
      const supabase = await getSupabaseClient();
      
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      }
    } catch (err: any) {
      setError("Đã xảy ra lỗi ngoài ý muốn. Vui lòng thử lại.");
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
            Đã có tài khoản?{" "}
            <Link href="/login" className="text-ink font-semibold hover:underline">
              Đăng nhập
            </Link>
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md bg-canvas border border-hairline p-8 rounded-lg shadow-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-ink mb-2">Đăng ký tài khoản</h1>
            <p className="text-xs text-steel">
              Bắt đầu kết nối và thực hiện các dự án nội dung chất lượng cao.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-md bg-brand-error/10 border border-brand-error/20 text-xs text-brand-error text-center font-medium">
              ⚠️ {error}
            </div>
          )}

          {success ? (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-green/10 text-brand-green text-xl mb-4">
                ✔
              </div>
              <h2 className="text-lg font-semibold text-ink mb-2">Đăng ký thành công!</h2>
              <p className="text-xs text-slate mb-4">
                Đang chuyển hướng sang trang đăng nhập...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Role selector */}
              <div>
                <label className="block text-xs font-semibold text-steel uppercase tracking-wider mb-2.5">
                  Bạn tham gia với tư cách nào?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("creator")}
                    className={`py-3 px-4 text-xs font-semibold rounded-md border text-center transition-all ${
                      role === "creator"
                        ? "bg-ink text-on-dark border-ink"
                        : "bg-canvas text-steel border-hairline hover:border-steel"
                    }`}
                  >
                    🎬 Nhà sáng tạo (Creator)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("freelancer")}
                    className={`py-3 px-4 text-xs font-semibold rounded-md border text-center transition-all ${
                      role === "freelancer"
                        ? "bg-ink text-on-dark border-ink"
                        : "bg-canvas text-steel border-hairline hover:border-steel"
                    }`}
                  >
                    💻 Freelancer (Editor/Writer)
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-steel uppercase tracking-wider mb-2">
                  Họ và tên
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="w-full h-10 px-3 py-2 bg-canvas text-charcoal border border-hairline rounded-md text-xs focus:border-brand-green focus:outline-none transition-colors"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                />
              </div>

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
                <label className="block text-xs font-semibold text-steel uppercase tracking-wider mb-2">
                  Mật khẩu
                </label>
                <input
                  type="password"
                  placeholder="Tối thiểu 6 ký tự"
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
                {loading ? "Đang xử lý..." : "Đăng Ký Tài Khoản"}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
