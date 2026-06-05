// app/api/reviews/actions.ts
// Server Actions quản lý đánh giá và nhận xét chất lượng dự án

"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export interface Review {
  id: string;
  job_id: string;
  reviewer_id: string;
  reviewer_name: string;
  reviewee_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

// Gửi đánh giá mới
export async function submitReviewAction(
  jobId: string,
  revieweeId: string,
  rating: number,
  comment: string
) {
  const cookieStore = await cookies();
  const mockSession = cookieStore.get("mock-session");
  const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                 !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                 jobId.startsWith("mock-") || 
                 (mockSession && mockSession.value);

  if (isMock) {
    try {
      if (!mockSession || !mockSession.value) {
        return { error: "Bạn cần đăng nhập để đánh giá." };
      }

      const sessionData = JSON.parse(decodeURIComponent(mockSession.value));
      const reviewerId = "mock-user-123"; // ID mặc định của mock session
      const reviewerName = sessionData.fullName || "Người dùng ẩn danh";

      // Đọc các reviews giả lập hiện tại
      const mockReviewsCookie = cookieStore.get("mock-reviews");
      let currentReviews: Review[] = [];
      if (mockReviewsCookie && mockReviewsCookie.value) {
        try {
          currentReviews = JSON.parse(decodeURIComponent(mockReviewsCookie.value));
        } catch (e) {}
      }

      // Kiểm tra trùng lặp
      const hasReviewed = currentReviews.some(
        (r) => r.job_id === jobId && r.reviewer_id === reviewerId
      );
      if (hasReviewed) {
        return { error: "Bạn đã đánh giá dự án này rồi." };
      }

      const newReview: Review = {
        id: `mock-review-${Date.now()}`,
        job_id: jobId,
        reviewer_id: reviewerId,
        reviewer_name: reviewerName,
        reviewee_id: revieweeId,
        rating: Number(rating),
        comment: comment || "",
        created_at: new Date().toISOString(),
      };

      currentReviews.push(newReview);

      cookieStore.set("mock-reviews", JSON.stringify(currentReviews), {
        path: "/",
        maxAge: 86400 * 30, // 30 ngày
      });

      // Cập nhật lại trạng thái job/escrow trong mock-jobs / mock-escrows nếu cần
      // (Ví dụ: Đánh dấu đã đánh giá)
      
      revalidatePath(`/freelancers/${revieweeId}`);
      revalidatePath("/creator");
      revalidatePath("/freelancer");

      return { success: true, data: newReview };
    } catch (e) {
      return { error: "Lỗi ghi nhận đánh giá giả lập vào cookie." };
    }
  } else {
    try {
      const supabase = await getSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { error: "Bạn chưa đăng nhập." };
      }

      // Thêm đánh giá vào database
      const { data, error } = await supabase
        .from("reviews")
        .insert({
          job_id: jobId,
          reviewer_id: user.id,
          reviewee_id: revieweeId,
          rating: rating,
          comment: comment || "",
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") { // Unique constraint violation
          return { error: "Bạn đã gửi đánh giá cho dự án này trước đó." };
        }
        return { error: `Lỗi lưu đánh giá: ${error.message}` };
      }

      // Lấy tên reviewer để cập nhật UI ngay lập tức
      const reviewerName = user.user_metadata?.full_name || "Thành viên CreatorHire";

      const formattedReview: Review = {
        id: data.id,
        job_id: data.job_id,
        reviewer_id: data.reviewer_id,
        reviewer_name: reviewerName,
        reviewee_id: data.reviewee_id,
        rating: data.rating,
        comment: data.comment,
        created_at: new Date(data.created_at).toISOString(),
      };

      revalidatePath(`/freelancers/${revieweeId}`);
      revalidatePath("/creator");
      revalidatePath("/freelancer");

      return { success: true, data: formattedReview };
    } catch (e) {
      return { error: "Lỗi kết nối cơ sở dữ liệu." };
    }
  }
}

// Lấy danh sách đánh giá của một người dùng
export async function getReviewsForUserAction(userId: string) {
  const cookieStore = await cookies();
  const mockSession = cookieStore.get("mock-session");
  const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                 !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                 userId.startsWith("mock-") || 
                 (mockSession && mockSession.value);

  if (isMock) {
    try {
      const mockReviewsCookie = cookieStore.get("mock-reviews");
      if (mockReviewsCookie && mockReviewsCookie.value) {
        const allReviews: Review[] = JSON.parse(decodeURIComponent(mockReviewsCookie.value));
        const userReviews = allReviews.filter((r) => r.reviewee_id === userId);
        return { success: true, data: userReviews };
      }
      return { success: true, data: [] };
    } catch (e) {
      return { error: "Lỗi đọc danh sách đánh giá giả lập." };
    }
  } else {
    try {
      const supabase = await getSupabaseServerClient();
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          id,
          job_id,
          reviewer_id,
          reviewee_id,
          rating,
          comment,
          created_at,
          profiles!reviews_reviewer_id_fkey (full_name)
        `)
        .eq("reviewee_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        return { error: `Lỗi truy vấn đánh giá: ${error.message}` };
      }

      const formattedReviews: Review[] = (data || []).map((item: any) => ({
        id: item.id,
        job_id: item.job_id,
        reviewer_id: item.reviewer_id,
        reviewer_name: item.profiles?.full_name || "Người dùng ẩn danh",
        reviewee_id: item.reviewee_id,
        rating: item.rating,
        comment: item.comment,
        created_at: new Date(item.created_at).toISOString(),
      }));

      return { success: true, data: formattedReviews };
    } catch (e) {
      return { error: "Lỗi kết nối cơ sở dữ liệu." };
    }
  }
}
