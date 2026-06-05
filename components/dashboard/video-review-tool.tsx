// components/dashboard/video-review-tool.tsx
// Trình duyệt video nháp online và góp ý mốc thời gian kèm bảng vẽ tay Canvas (tương tự Frame.io)

"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Edit2, 
  Eraser, 
  Check, 
  Trash2, 
  Clock, 
  Volume2, 
  VolumeX,
  ExternalLink,
  MessageSquare,
  AlertCircle
} from "lucide-react";
import { getVideoCommentsAction, addVideoCommentAction, VideoComment } from "@/app/api/comments/actions";
import { getSupabaseClient } from "@/lib/supabase/client";
import gsap from "gsap";

interface VideoReviewToolProps {
  jobId: string;
  deliveryLink: string;
  currentUserRole: "creator" | "freelancer";
  currentUserName: string;
}

// Helper trích xuất ID YouTube
function getYouTubeId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Helper định dạng giây -> MM:SS
function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function VideoReviewTool({
  jobId,
  deliveryLink,
  currentUserRole,
  currentUserName,
}: VideoReviewToolProps) {
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180); // Độ dài giả định 3 phút nếu là mock
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  
  // Trạng thái load/lưu
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // YouTube references
  const ytId = getYouTubeId(deliveryLink);
  const ytPlayerRef = useRef<any>(null);
  const ytContainerId = `yt-player-${jobId}`;
  
  // Canvas drawing references
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const hasDrawnRef = useRef(false);

  // Mock player timer ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Tải danh sách comments từ server hoặc localStorage
  const loadComments = async () => {
    setErrorMsg(null);
    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                   !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                   jobId.startsWith("mock-") || 
                   (typeof document !== "undefined" && document.cookie.includes("mock-session="));

    if (isMock) {
      try {
        let stored = localStorage.getItem(`mock-comments-${jobId}`);
        if (!stored && typeof document !== "undefined") {
          // Di trú dữ liệu từ Cookie nếu có và localStorage chưa có gì
          const match = document.cookie.match(new RegExp('(^| )' + `mock-comments-${jobId}` + '=([^;]+)'));
          if (match) {
            try {
              const decoded = decodeURIComponent(match[2]);
              localStorage.setItem(`mock-comments-${jobId}`, decoded);
              stored = decoded;
              // Xóa cookie cũ để dọn dẹp dung lượng header
              document.cookie = `mock-comments-${jobId}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
            } catch (e) {
              console.error("Migration cookie error:", e);
            }
          }
        }
        
        if (stored) {
          setComments(JSON.parse(stored) as VideoComment[]);
        } else {
          setComments([]);
        }
      } catch (err) {
        setErrorMsg("Không thể tải danh sách bình luận giả lập.");
      }
    } else {
      try {
        const res = await getVideoCommentsAction(jobId);
        if (res.success && res.data) {
          setComments(res.data);
        } else if (res.error) {
          setErrorMsg(res.error);
        }
      } catch (err) {
        setErrorMsg("Không thể tải danh sách bình luận.");
      }
    }
  };

  useEffect(() => {
    loadComments();
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [jobId]);

  // 8. Tích hợp Real-time đồng bộ bình luận (Supabase Realtime cho prod, polling/storage event cho mock)
  useEffect(() => {
    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                   !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                   jobId.startsWith("mock-") || 
                   (typeof document !== "undefined" && document.cookie.includes("mock-session="));

    let active = true;

    if (isMock) {
      // a. Đồng bộ qua sự kiện storage (khi các tab cùng trình duyệt thay đổi localStorage)
      const handleStorageChange = (e?: StorageEvent) => {
        if (!active) return;
        if (e && e.key && e.key !== `mock-comments-${jobId}`) return;
        
        try {
          const stored = localStorage.getItem(`mock-comments-${jobId}`);
          if (stored) {
            setComments(JSON.parse(stored) as VideoComment[]);
          } else {
            setComments([]);
          }
        } catch (err) {}
      };

      window.addEventListener("storage", handleStorageChange);

      // b. Polling dự phòng mỗi 3 giây để cập nhật realtime cho mock mode
      const interval = setInterval(() => {
        handleStorageChange();
      }, 3000);

      return () => {
        active = false;
        window.removeEventListener("storage", handleStorageChange);
        clearInterval(interval);
      };
    } else {
      // Production Mode: Đăng ký Supabase Realtime Channel
      let subscription: any = null;

      const setupRealtime = async () => {
        try {
          const supabase = await getSupabaseClient();
          
          subscription = supabase
            .channel(`video-comments-${jobId}`)
            .on(
              "postgres_changes",
              {
                event: "*",
                schema: "public",
                table: "video_comments",
                filter: `job_id=eq.${jobId}`,
              },
              () => {
                if (active) {
                  loadComments();
                }
              }
            )
            .subscribe();
        } catch (e) {
          console.error("Lỗi thiết lập Supabase Realtime:", e);
        }
      };

      setupRealtime();

      return () => {
        active = false;
        if (subscription) {
          subscription.unsubscribe();
        }
      };
    }
  }, [jobId]);

  // 2. Tải YouTube Iframe Player API nếu là link YouTube
  useEffect(() => {
    if (!ytId) return;

    // Định nghĩa callback khi YouTube API đã sẵn sàng
    // @ts-ignore
    window.onYouTubeIframeAPIReady = () => {
      // @ts-ignore
      ytPlayerRef.current = new window.YT.Player(ytContainerId, {
        videoId: ytId,
        playerVars: {
          controls: 0, // Ẩn control của Youtube để xài custom control của mình
          disablekb: 1,
          fs: 0,
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onReady: (event: any) => {
            setDuration(event.target.getDuration());
          },
          onStateChange: (event: any) => {
            // @ts-ignore
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
            } else {
              setIsPlaying(false);
            }
          }
        }
      });
    };

    // Chèn script vào DOM
    if (!document.getElementById("youtube-iframe-api-script")) {
      const tag = document.createElement("script");
      tag.id = "youtube-iframe-api-script";
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    } else {
      // @ts-ignore
      if (window.YT && window.YT.Player) {
        // @ts-ignore
        window.onYouTubeIframeAPIReady();
      }
    }
  }, [ytId]);

  // 3. Đồng bộ hóa thời gian phát
  useEffect(() => {
    if (isPlaying) {
      // Clear canvas drawing khi tiếp tục phát
      clearCanvas();
      
      timerRef.current = setInterval(() => {
        if (ytPlayerRef.current && ytPlayerRef.current.getCurrentTime) {
          setCurrentTime(ytPlayerRef.current.getCurrentTime());
        } else {
          // Mock timer
          setCurrentTime((prev) => {
            if (prev >= duration) {
              setIsPlaying(false);
              return 0;
            }
            return prev + 0.25; // Gia tăng mỗi 250ms
          });
        }
      }, 250);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, duration]);

  // 4. Các nút điều khiển Player
  const togglePlay = () => {
    // Nếu chuyển sang Play -> Tự động tắt vẽ nét
    if (!isPlaying) {
      setIsDrawingMode(false);
    }

    if (ytPlayerRef.current) {
      if (isPlaying) {
        ytPlayerRef.current.pauseVideo();
      } else {
        ytPlayerRef.current.playVideo();
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (ytPlayerRef.current) {
      if (isMuted) {
        ytPlayerRef.current.unMute();
      } else {
        ytPlayerRef.current.mute();
      }
    }
    setIsMuted(!isMuted);
  };

  const seekTo = (seconds: number) => {
    // Xóa nét vẽ cũ trên canvas
    clearCanvas();
    setActiveCommentId(null);
    setCurrentTime(seconds);

    if (ytPlayerRef.current && ytPlayerRef.current.seekTo) {
      ytPlayerRef.current.seekTo(seconds, true);
    }
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const targetSeconds = percentage * duration;
    seekTo(targetSeconds);
  };

  // 5. Canvas Drawing Handlers
  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    // Đồng bộ độ phân giải thật của canvas với kích thước hiển thị CSS
    canvas.width = rect.width;
    canvas.height = rect.height;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.strokeStyle = "#ef4444"; // Đỏ neon cảnh báo lỗi
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
  };

  useEffect(() => {
    if (isDrawingMode) {
      initCanvas();
    }
  }, [isDrawingMode]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    isDrawingRef.current = true;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    lastPosRef.current = { x, y };
    
    // Bắt đầu vẽ chấm thô nếu click
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y);
    ctx.stroke();
    
    hasDrawnRef.current = true; // Đánh dấu đã vẽ ngay khi click chuột xuống (vẽ chấm tròn)
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();

    lastPosRef.current = { x, y };
    hasDrawnRef.current = true;
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    hasDrawnRef.current = false;
  };

  // 6. Lưu bình luận kèm vẽ Canvas
  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    let drawingDataUrl: string | null = null;
    const canvas = canvasRef.current;
    if (isDrawingMode && canvas && hasDrawnRef.current) {
      drawingDataUrl = canvas.toDataURL("image/png");
    }

    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                   !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                   jobId.startsWith("mock-") || 
                   (typeof document !== "undefined" && document.cookie.includes("mock-session="));

    if (isMock) {
      startTransition(async () => {
        try {
          const stored = localStorage.getItem(`mock-comments-${jobId}`);
          let currentComments: VideoComment[] = [];
          if (stored) {
            try {
              currentComments = JSON.parse(stored);
            } catch (e) {}
          }

          const newComment: VideoComment = {
            id: `mock-comment-${Date.now()}`,
            job_id: jobId,
            timestamp: Math.floor(currentTime),
            author_name: currentUserName,
            author_role: currentUserRole,
            content: commentText.trim(),
            drawing_data: drawingDataUrl || null,
            created_at: new Date().toLocaleString("vi-VN"),
          };

          currentComments.push(newComment);
          currentComments.sort((a, b) => a.timestamp - b.timestamp);
          localStorage.setItem(`mock-comments-${jobId}`, JSON.stringify(currentComments));

          // Kích hoạt sự kiện storage nội bộ để cập nhật realtime tức thì
          window.dispatchEvent(new Event("storage"));

          setCommentText("");
          setIsDrawingMode(false);
          clearCanvas();
          setSuccessMsg("Gửi góp ý thành công!");
          setTimeout(() => setSuccessMsg(null), 2000);
          setComments(currentComments);
        } catch (err) {
          setErrorMsg("Không thể lưu góp ý giả lập.");
        }
      });
    } else {
      startTransition(async () => {
        try {
          const res = await addVideoCommentAction(
            jobId,
            Math.floor(currentTime),
            commentText.trim(),
            currentUserName,
            currentUserRole,
            drawingDataUrl
          );

          if (res.success) {
            setCommentText("");
            setIsDrawingMode(false);
            clearCanvas();
            setSuccessMsg("Gửi góp ý thành công!");
            setTimeout(() => setSuccessMsg(null), 2000);
            loadComments(); // Refresh danh sách bình luận
          } else if (res.error) {
            setErrorMsg(res.error);
          }
        } catch (err) {
          setErrorMsg("Lỗi hệ thống, không thể lưu bình luận.");
        }
      });
    }
  };

  // 7. Click hiển thị hình ảnh nét vẽ đè lên
  const handleCommentSelect = (comment: VideoComment) => {
    seekTo(comment.timestamp);
    setActiveCommentId(comment.id);

    // Tạm dừng video để xem nét vẽ
    if (isPlaying) {
      if (ytPlayerRef.current) ytPlayerRef.current.pauseVideo();
      setIsPlaying(false);
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    clearCanvas();

    if (comment.drawing_data) {
      const img = new Image();
      img.onload = () => {
        // Vẽ ảnh đè lên canvas
        initCanvas();
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = comment.drawing_data;
    }
  };

  return (
    <div ref={containerRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-canvas border border-hairline p-5 rounded-lg shadow-sm font-sans w-full">
      {/* Cột 1 & 2: Trình phát video */}
      <div className="lg:col-span-2 space-y-4">
        {/* Khung phát video với Canvas Overlay */}
        <div className="relative aspect-video w-full bg-black rounded-lg overflow-hidden border border-hairline-dark select-none shadow-md group">
          {ytId ? (
            // YouTube Player
            <div className="w-full h-full pointer-events-none">
              <div id={ytContainerId} className="w-full h-full"></div>
            </div>
          ) : (
            // Mock Video Player hoặc HTML5 video
            <div className="w-full h-full flex flex-col items-center justify-center text-on-dark-muted relative">
              {/* Giả lập sóng âm thanh và hình nền */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/20 to-black flex items-center justify-center opacity-40">
                <div className="flex gap-1.5 items-end h-24">
                  {[40, 60, 20, 80, 50, 90, 30, 70, 60, 80, 40, 20, 50].map((h, i) => (
                    <div 
                      key={i} 
                      className="w-1.5 bg-brand-green rounded-full transition-all duration-300"
                      style={{ 
                        height: isPlaying ? `${Math.sin(currentTime + i) * 35 + 45}%` : `${h}%` 
                      }}
                    ></div>
                  ))}
                </div>
              </div>
              <VideoIcon className="w-12 h-12 text-zinc-700 mb-2 animate-pulse" />
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                Mock Video Draft Review
              </p>
              <p className="text-[10px] text-zinc-700 mt-1 truncate max-w-[280px]" title={deliveryLink}>
                {deliveryLink}
              </p>
            </div>
          )}

          {/* LỚP CANVAS VẼ TAY (Drawing Layer) */}
          <canvas
            ref={canvasRef}
            onMouseDown={isDrawingMode ? startDrawing : undefined}
            onMouseMove={isDrawingMode ? draw : undefined}
            onMouseUp={isDrawingMode ? stopDrawing : undefined}
            onMouseLeave={isDrawingMode ? stopDrawing : undefined}
            className={`absolute inset-0 w-full h-full z-20 ${
              isDrawingMode ? "cursor-crosshair pointer-events-auto" : "pointer-events-none"
            }`}
          />

          {/* overlay khi bật chế độ vẽ để Creator biết */}
          {isDrawingMode && (
            <div className="absolute top-4 left-4 z-30 bg-red-500/20 border border-red-500/30 px-3 py-1 rounded text-[9px] font-bold text-red-400 uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500"></span> Chế độ vẽ lỗi nháp
            </div>
          )}
        </div>

        {/* Bảng điều khiển Trình phát custom */}
        <div className="bg-surface border border-hairline p-3 rounded-lg flex flex-col gap-3">
          {/* Thanh Tiến trình (Timeline Scrubbing) */}
          <div className="space-y-1">
            <div 
              onClick={handleTimelineClick}
              className="h-2 w-full bg-hairline-soft rounded-full cursor-pointer relative overflow-visible hover:h-2.5 transition-all"
            >
              <div 
                className="h-full bg-brand-green rounded-full relative" 
                style={{ width: `${(currentTime / duration) * 100}%` }}
              >
                {/* Đầu phát trượt */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-brand-green border border-canvas rounded-full shadow-md scale-0 group-hover:scale-100 transition-transform"></div>
              </div>
            </div>
            <div className="flex justify-between items-center text-[10px] text-steel font-mono font-semibold">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Các nút bấm Play/Pause, Mute, Vẽ */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={togglePlay}
                className="w-8 h-8 bg-ink text-on-dark rounded-full flex items-center justify-center hover:bg-charcoal transition-all scale-100 active:scale-95 cursor-pointer"
                title={isPlaying ? "Tạm dừng" : "Phát"}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 fill-on-dark" /> : <Play className="w-3.5 h-3.5 fill-on-dark translate-x-[1px]" />}
              </button>

              <button
                type="button"
                onClick={() => seekTo(0)}
                className="p-1.5 text-stone hover:text-ink transition-colors rounded hover:bg-hairline-soft cursor-pointer"
                title="Quay về đầu"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <div className="h-4 w-[1px] bg-hairline"></div>

              {/* Bật tắt chế độ vẽ bút đỏ */}
              <button
                type="button"
                onClick={() => {
                  if (isPlaying) {
                    if (ytPlayerRef.current) ytPlayerRef.current.pauseVideo();
                    setIsPlaying(false);
                  }
                  setIsDrawingMode(!isDrawingMode);
                }}
                className={`h-7 px-3 text-[10px] font-bold rounded-full border transition-all flex items-center gap-1 cursor-pointer ${
                  isDrawingMode 
                    ? "bg-red-500/10 border-red-500/30 text-red-500" 
                    : "bg-surface border-hairline text-charcoal hover:bg-canvas"
                }`}
                title="Bật bảng vẽ tay khoanh tròn chỉ lỗi"
              >
                <Edit2 className="w-3 h-3" /> {isDrawingMode ? "Tắt vẽ nháp" : "Vẽ chỉ lỗi"}
              </button>

              {isDrawingMode && (
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="p-1 text-stone hover:text-red-500 transition-colors rounded cursor-pointer"
                  title="Xóa nét vẽ hiện tại"
                >
                  <Eraser className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleMute}
                className="p-1.5 text-stone hover:text-ink transition-colors rounded hover:bg-hairline-soft cursor-pointer"
                title={isMuted ? "Mở âm thanh" : "Tắt tiếng"}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Biểu mẫu góp ý dưới player */}
        <form onSubmit={handleSubmitComment} className="bg-surface border border-hairline p-4 rounded-lg space-y-3">
          <div className="flex items-center justify-between border-b border-hairline-soft pb-2">
            <span className="text-[11px] font-bold text-ink flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-brand-green" /> Thêm bình luận góp ý tại mốc: 
              <span className="font-mono text-brand-green bg-brand-green/10 border border-brand-green/20 px-2 py-0.5 rounded text-xs font-bold">
                {formatTime(currentTime)}
              </span>
            </span>
            {isDrawingMode && hasDrawnRef.current && (
              <span className="text-[10px] text-red-500 font-bold bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                ✏️ Kèm theo nét vẽ
              </span>
            )}
          </div>

          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Ví dụ: Đoạn này cần cắt ngắn đi 3 giây / Chèn nhạc nền kịch tính hơn ở giây này..."
            className="w-full h-20 p-2.5 bg-canvas border border-hairline rounded text-xs focus:border-brand-green focus:outline-none resize-none text-charcoal"
            disabled={isPending}
          />

          <div className="flex justify-between items-center gap-4">
            <div className="text-[10px] text-steel">
              Mẹo: Nhấn nút <strong>"Vẽ chỉ lỗi"</strong> phía trên trước khi ghi góp ý để khoanh vùng khoảnh khắc bị lỗi.
            </div>
            <button
              type="submit"
              className="h-8 px-4 bg-ink text-on-dark text-[10px] font-black rounded-full hover:bg-charcoal hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 shrink-0"
              disabled={isPending || !commentText.trim()}
            >
              <Check className="w-3.5 h-3.5" /> Gửi góp ý
            </button>
          </div>
        </form>
      </div>

      {/* Cột 3: Danh sách góp ý bên phải */}
      <div className="flex flex-col h-full space-y-3">
        <div className="border-b border-hairline-soft pb-2 flex items-center justify-between">
          <h4 className="text-xs font-black uppercase tracking-wider text-ink flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-brand-green" /> Danh sách góp ý ({comments.length})
          </h4>
        </div>

        {errorMsg && (
          <div className="p-2.5 bg-brand-error/10 border border-brand-error/20 rounded text-[10px] text-brand-error font-medium flex items-start gap-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-2.5 bg-brand-green/10 border border-brand-green/20 rounded text-[10px] text-brand-green font-semibold flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> {successMsg}
          </div>
        )}

        {/* Khung scroll bình luận */}
        <div className="flex-1 overflow-y-auto max-h-[380px] pr-1 space-y-2.5 scrollbar-thin">
          {comments.length === 0 ? (
            <div className="text-center py-12 text-stone text-[11px] border border-dashed border-hairline rounded-lg bg-surface">
              Chưa có góp ý nào cho video này.<br />Phát video và để lại góp ý đầu tiên!
            </div>
          ) : (
            comments.map((comment) => {
              const isActive = activeCommentId === comment.id;
              
              return (
                <div
                  key={comment.id}
                  onClick={() => handleCommentSelect(comment)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer text-left space-y-2 ${
                    isActive 
                      ? "bg-brand-green/10 border-brand-green/30 shadow-sm" 
                      : "bg-surface border-hairline hover:bg-canvas"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-extrabold text-ink block">
                        {comment.author_name}
                      </span>
                      <span className="text-[8px] uppercase tracking-wider font-semibold font-mono text-steel">
                        {comment.author_role === "creator" ? "🎬 Nhà sáng tạo" : "💻 Freelancer"}
                      </span>
                    </div>

                    {/* Mốc thời gian comment */}
                    <button
                      type="button"
                      className="px-2 py-0.5 bg-brand-green/10 border border-brand-green/25 text-brand-green rounded font-mono text-[10px] font-bold flex items-center gap-0.5 hover:bg-brand-green/20 active:scale-95 transition-all"
                    >
                      <Clock className="w-2.5 h-2.5" /> {formatTime(comment.timestamp)}
                    </button>
                  </div>

                  <p className="text-[11px] text-charcoal break-words leading-relaxed">
                    {comment.content}
                  </p>

                  <div className="flex justify-between items-center text-[9px] text-stone">
                    <span>{comment.created_at}</span>
                    {comment.drawing_data && (
                      <span className="text-red-500 font-bold bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/15 flex items-center gap-0.5">
                        ✏️ Có vẽ hình lỗi
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// Icon custom
function VideoIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M23 7a2 2 0 0 0-2.45-1.45L16 7V5a2 2 0 0 0-2-2H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2l5 1.55A2 2 0 0 0 23 17V7Z" />
    </svg>
  );
}
