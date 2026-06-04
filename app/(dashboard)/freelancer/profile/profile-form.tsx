// app/(dashboard)/freelancer/profile/profile-form.tsx
// Client Component form chỉnh sửa hồ sơ Freelancer với GSAP animations

"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { updateFreelancerProfileAction } from "./actions";
import { 
  User, 
  FileText, 
  Tag, 
  Video, 
  Check, 
  Plus, 
  X, 
  AlertCircle, 
  Sparkles, 
  Eye
} from "lucide-react";

interface ProfileFormProps {
  initialData: {
    fullName: string;
    bio: string;
    skills: string[];
    portfolioVideoUrl: string;
    email: string;
  };
}

export default function ProfileForm({ initialData }: ProfileFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form states
  const [fullName, setFullName] = useState(initialData.fullName);
  const [bio, setBio] = useState(initialData.bio);
  const [skills, setSkills] = useState<string[]>(initialData.skills);
  const [tagInput, setTagInput] = useState("");
  const [portfolioVideoUrl, setPortfolioVideoUrl] = useState(initialData.portfolioVideoUrl);

  // Refs for animations
  const formRef = useRef<HTMLDivElement>(null);
  const videoPreviewRef = useRef<HTMLDivElement>(null);
  const successModalRef = useRef<HTMLDivElement>(null);

  // 1. Initial page slide-in
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        formRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
      );
    }, formRef);

    return () => ctx.revert();
  }, []);

  // 2. Success Modal Animation
  useEffect(() => {
    if (success) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          successModalRef.current,
          { scale: 0.8, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" }
        );

        const checkCircle = successModalRef.current?.querySelector(".success-circle");
        if (checkCircle) {
          gsap.fromTo(
            checkCircle,
            { scale: 0 },
            { scale: 1, duration: 0.6, delay: 0.2, ease: "elastic.out(1, 0.5)" }
          );
        }
      }, successModalRef);

      const timer = setTimeout(() => {
        setSuccess(false);
        router.refresh();
      }, 2000);

      return () => {
        clearTimeout(timer);
        ctx.revert();
      };
    }
  }, [success, router]);

  // Video URL embed logic
  const getEmbedData = (urlStr: string) => {
    if (!urlStr) return null;
    try {
      const url = new URL(urlStr);
      // Youtube
      if (url.hostname.includes("youtube.com") || url.hostname.includes("youtu.be")) {
        let videoId = "";
        if (url.hostname.includes("youtu.be")) {
          videoId = url.pathname.slice(1);
        } else {
          if (url.pathname.startsWith("/embed/")) {
            videoId = url.pathname.split("/")[2];
          } else {
            videoId = url.searchParams.get("v") || "";
          }
        }
        if (videoId.includes("&")) {
          videoId = videoId.split("&")[0];
        }
        if (videoId) {
          return {
            type: "youtube",
            embedUrl: `https://www.youtube.com/embed/${videoId}`,
          };
        }
      }
      // Vimeo
      if (url.hostname.includes("vimeo.com")) {
        const segments = url.pathname.split("/").filter(Boolean);
        const videoId = segments[segments.length - 1];
        if (videoId && /^\d+$/.test(videoId)) {
          return {
            type: "vimeo",
            embedUrl: `https://player.vimeo.com/video/${videoId}?h=0`,
          };
        }
      }
    } catch (e) {}
    return null;
  };

  const embedData = getEmbedData(portfolioVideoUrl);

  // Animate video box appearance on change
  useEffect(() => {
    if (embedData && videoPreviewRef.current) {
      gsap.fromTo(
        videoPreviewRef.current,
        { scale: 0.95, opacity: 0, height: 0 },
        { scale: 1, opacity: 1, height: "auto", duration: 0.4, ease: "power2.out" }
      );
    }
  }, [portfolioVideoUrl, embedData]);

  // Handling dynamic skill tags
  const handleAddTag = (e: React.MouseEvent | React.KeyboardEvent) => {
    if (e.type === "keydown" && (e as React.KeyboardEvent).key !== "Enter") {
      return;
    }
    
    // Prevent default form submission when Enter is pressed in text field
    if (e.type === "keydown" && (e as React.KeyboardEvent).key === "Enter") {
      e.preventDefault();
    }

    const trimmed = tagInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      const newSkills = [...skills, trimmed];
      setSkills(newSkills);
      setTagInput("");

      // Bounce-in the newly added tag
      setTimeout(() => {
        const tags = formRef.current?.querySelectorAll(".skill-tag");
        if (tags && tags.length > 0) {
          const lastTag = tags[tags.length - 1];
          gsap.fromTo(
            lastTag,
            { scale: 0, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(1.5)" }
          );
        }
      }, 10);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const targetTag = formRef.current?.querySelector(`[data-tag-name="${tagToRemove}"]`);
    if (targetTag) {
      gsap.to(targetTag, {
        scale: 0.2,
        opacity: 0,
        duration: 0.25,
        ease: "power2.in",
        onComplete: () => {
          setSkills(skills.filter((s) => s !== tagToRemove));
        }
      });
    } else {
      setSkills(skills.filter((s) => s !== tagToRemove));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.append("full_name", fullName);
    formData.append("bio", bio);
    formData.append("skills", skills.join(","));
    formData.append("portfolio_video_url", portfolioVideoUrl);

    startTransition(async () => {
      try {
        const result = await updateFreelancerProfileAction(null, formData);
        if (result && result.error) {
          setError(result.error);
        } else if (result && result.success) {
          setSuccess(true);
        }
      } catch (err) {
        setError("Đã xảy ra lỗi kết nối. Vui lòng thử lại.");
      }
    });
  };

  return (
    <div ref={formRef} className="space-y-6" style={{ opacity: 0 }}>
      {success && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            ref={successModalRef}
            className="max-w-sm w-full bg-canvas border border-hairline p-8 rounded-lg shadow-lg text-center flex flex-col items-center justify-center space-y-4"
            style={{ opacity: 0 }}
          >
            <div className="success-circle w-16 h-16 bg-brand-green/10 text-brand-green rounded-full flex items-center justify-center border border-brand-green/20">
              <Check className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-ink">Cập nhật thành công!</h3>
              <p className="text-[11px] text-steel">
                Hồ sơ năng lực của bạn đã được cập nhật thành công trên hệ thống.
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Cột trái: Form thông tin */}
        <div className="lg:col-span-7 bg-canvas border border-hairline rounded-lg p-6 space-y-6 shadow-sm">
          <div className="border-b border-hairline-soft pb-4 flex items-center justify-between">
            <h3 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-brand-green" /> Thông tin cá nhân
            </h3>
            <span className="text-[10px] text-stone font-mono">{initialData.email}</span>
          </div>

          {error && (
            <div className="p-3.5 bg-brand-error/10 border border-brand-error/20 text-xs text-brand-error font-medium rounded-md flex items-center gap-1.5 animate-pulse">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Họ và tên */}
            <div>
              <label className="block text-xs font-semibold text-steel uppercase tracking-wider mb-2">
                Họ và Tên
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full h-10 px-3 py-2 bg-canvas text-charcoal border border-hairline rounded-md text-xs focus:border-brand-green focus:outline-none transition-all duration-300"
                placeholder="Nhập họ và tên đầy đủ"
                disabled={isPending}
              />
            </div>

            {/* Tiểu sử */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-steel uppercase tracking-wider">
                  Tiểu sử / Kinh nghiệm (Bio)
                </label>
                <span className="text-[10px] text-stone font-mono">{bio.length}/500</span>
              </div>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 500))}
                rows={5}
                className="w-full p-3.5 bg-canvas text-charcoal border border-hairline rounded-md text-xs focus:border-brand-green focus:outline-none transition-all duration-300 leading-relaxed"
                placeholder="Mô tả kỹ năng, số năm kinh nghiệm, các loại phần mềm bạn hay dùng và những định dạng video/kịch bản bạn có thế mạnh nhất..."
                disabled={isPending}
              />
            </div>

            {/* Skill tags */}
            <div>
              <label className="block text-xs font-semibold text-steel uppercase tracking-wider mb-2">
                Thẻ kỹ năng (Skills)
              </label>
              
              <div className="flex gap-2 mb-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    className="w-full h-10 pl-3 pr-10 py-2 bg-canvas text-charcoal border border-hairline rounded-md text-xs focus:border-brand-green focus:outline-none transition-all duration-300"
                    placeholder="Nhập kỹ năng rồi bấm Enter (VD: CapCut, Premiere, After Effects)"
                    disabled={isPending}
                  />
                  <Tag className="w-3.5 h-3.5 text-stone absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="h-10 px-4 bg-ink text-on-dark hover:bg-brand-green hover:text-canvas rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1 shrink-0"
                  disabled={isPending}
                >
                  <Plus className="w-4 h-4" /> Thêm
                </button>
              </div>

              {/* Tags Container */}
              <div className="flex flex-wrap gap-2 p-3 bg-surface rounded-md border border-hairline-soft min-h-[50px]">
                {skills.length === 0 ? (
                  <span className="text-[10px] text-stone italic flex items-center gap-1 self-center">
                    <Sparkles className="w-3 h-3" /> Chưa thêm thẻ kỹ năng nào.
                  </span>
                ) : (
                  skills.map((skill) => (
                    <span
                      key={skill}
                      data-tag-name={skill}
                      className="skill-tag bg-canvas text-charcoal text-[10px] font-semibold px-3 py-1.5 rounded-full border border-hairline flex items-center gap-1.5 shadow-sm group hover:border-brand-green/40 hover:text-brand-green transition-all"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(skill)}
                        className="text-stone hover:text-brand-error focus:outline-none transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cột phải: Link video portfolio & Dynamic Preview */}
        <div className="lg:col-span-5 bg-canvas border border-hairline rounded-lg p-6 space-y-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-5">
            <div className="border-b border-hairline-soft pb-4">
              <h3 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                <Video className="w-4 h-4 text-brand-green" /> Portfolio Video
              </h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-steel uppercase tracking-wider mb-2">
                Đường dẫn Video Portfolio (YouTube/Vimeo)
              </label>
              <input
                type="url"
                value={portfolioVideoUrl}
                onChange={(e) => setPortfolioVideoUrl(e.target.value)}
                className="w-full h-10 px-3 py-2 bg-canvas text-charcoal border border-hairline rounded-md text-xs focus:border-brand-green focus:outline-none transition-all duration-300"
                placeholder="https://www.youtube.com/watch?v=..."
                disabled={isPending}
              />
              <span className="text-[9px] text-stone mt-1.5 block leading-relaxed">
                * Dán link video Youtube hoặc Vimeo của dự án bạn từng làm tốt nhất. Hệ thống sẽ tự động hiển thị trình phát video.
              </span>
            </div>

            {/* Video preview render box */}
            {embedData ? (
              <div 
                ref={videoPreviewRef} 
                className="video-preview-box overflow-hidden rounded-lg border border-hairline bg-canvas-dark relative group aspect-video shadow-md"
              >
                <iframe
                  src={embedData.embedUrl}
                  title="Portfolio video preview"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full absolute inset-0"
                />
              </div>
            ) : (
              <div className="border border-dashed border-hairline bg-surface rounded-lg p-8 text-center flex flex-col items-center justify-center space-y-3 aspect-video">
                <div className="w-10 h-10 rounded-full bg-stone/15 flex items-center justify-center text-stone">
                  <Eye className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-ink">Xem trước Video Portfolio</p>
                  <p className="text-[9px] text-stone max-w-[200px] mx-auto">
                    Trình phát video sẽ xuất hiện tại đây khi bạn nhập một URL hợp lệ.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-hairline-soft/80">
            <button
              type="submit"
              className="w-full h-10 bg-ink text-on-dark text-xs font-semibold rounded-full hover:bg-brand-green hover:text-canvas transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm font-bold"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-on-dark border-t-transparent rounded-full" />
                  Đang lưu thay đổi...
                </>
              ) : (
                "Lưu hồ sơ năng lực"
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
