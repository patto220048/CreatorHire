// app/api/comments/actions.ts
// Server Actions quản lý bình luận theo mốc thời gian và nét vẽ Canvas

"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export interface VideoComment {
  id: string;
  job_id: string;
  timestamp: number;
  author_name: string;
  author_role: "creator" | "freelancer";
  content: string;
  drawing_data?: string | null;
  created_at: string;
}

// Lấy danh sách bình luận của video nháp
export async function getVideoCommentsAction(jobId: string) {
  const cookieStore = await cookies();
  const mockSession = cookieStore.get("mock-session");
  const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || jobId.startsWith("mock-") || (mockSession && mockSession.value);

  if (isMock) {
    try {
      const mockCommentsCookie = cookieStore.get(`mock-comments-${jobId}`);
      if (mockCommentsCookie && mockCommentsCookie.value) {
        const decoded = decodeURIComponent(mockCommentsCookie.value);
        return { success: true, data: JSON.parse(decoded) as VideoComment[] };
      }
      return { success: true, data: [] as VideoComment[] };
    } catch (e) {
      return { error: "Không thể đọc bình luận giả lập từ cookie." };
    }
  } else {
    try {
      const supabase = await getSupabaseServerClient();
      const { data, error } = await supabase
        .from("video_comments")
        .select("*")
        .eq("job_id", jobId)
        .order("timestamp", { ascending: true });

      if (error) {
        return { error: `Lỗi đọc bình luận từ cơ sở dữ liệu: ${error.message}` };
      }
      
      const formattedData: VideoComment[] = (data || []).map((item: any) => ({
        id: item.id,
        job_id: item.job_id,
        timestamp: Number(item.timestamp),
        author_name: item.author_name,
        author_role: item.author_role,
        content: item.content,
        drawing_data: item.drawing_data,
        created_at: new Date(item.created_at).toLocaleString("vi-VN"),
      }));

      return { success: true, data: formattedData };
    } catch (e) {
      return { error: "Lỗi kết nối cơ sở dữ liệu khi đọc bình luận." };
    }
  }
}

// Thêm bình luận mới kèm mốc thời gian và nét vẽ Canvas
export async function addVideoCommentAction(
  jobId: string,
  timestamp: number,
  content: string,
  authorName: string,
  authorRole: "creator" | "freelancer",
  drawingData?: string | null
) {
  const cookieStore = await cookies();
  const mockSession = cookieStore.get("mock-session");
  const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || jobId.startsWith("mock-") || (mockSession && mockSession.value);

  if (isMock) {
    try {
      const mockCommentsCookie = cookieStore.get(`mock-comments-${jobId}`);
      let currentComments: VideoComment[] = [];
      
      if (mockCommentsCookie && mockCommentsCookie.value) {
        try {
          const decoded = decodeURIComponent(mockCommentsCookie.value);
          currentComments = JSON.parse(decoded);
        } catch (e) {}
      }

      const newComment: VideoComment = {
        id: `mock-comment-${Date.now()}`,
        job_id: jobId,
        timestamp,
        author_name: authorName,
        author_role: authorRole,
        content,
        drawing_data: drawingData || null,
        created_at: new Date().toLocaleString("vi-VN"),
      };

      currentComments.push(newComment);
      // Sắp xếp comment theo thời gian tăng dần
      currentComments.sort((a, b) => a.timestamp - b.timestamp);

      cookieStore.set(`mock-comments-${jobId}`, JSON.stringify(currentComments), {
        path: "/",
        maxAge: 86400 * 7, // Giữ trong 7 ngày để test thoải mái
      });

      return { success: true, data: newComment };
    } catch (e) {
      return { error: "Không thể lưu bình luận giả lập vào cookie." };
    }
  } else {
    try {
      const supabase = await getSupabaseServerClient();
      const { data, error } = await supabase
        .from("video_comments")
        .insert({
          job_id: jobId,
          timestamp,
          content,
          author_name: authorName,
          author_role: authorRole,
          drawing_data: drawingData || null,
        })
        .select()
        .single();

      if (error) {
        return { error: `Lỗi chèn bình luận vào database: ${error.message}` };
      }

      const formattedComment: VideoComment = {
        id: data.id,
        job_id: data.job_id,
        timestamp: Number(data.timestamp),
        author_name: data.author_name,
        author_role: data.author_role,
        content: data.content,
        drawing_data: data.drawing_data,
        created_at: new Date(data.created_at).toLocaleString("vi-VN"),
      };

      return { success: true, data: formattedComment };
    } catch (e) {
      return { error: "Lỗi kết nối cơ sở dữ liệu khi lưu bình luận." };
    }
  }
}
