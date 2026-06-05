// app/(dashboard)/freelancer/actions.ts
// Server Actions xử lý hoạt động nộp sản phẩm bàn giao từ Freelancer

"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function submitDeliverableAction(prevState: any, formData: FormData) {
  const jobId = formData.get("job_id")?.toString();
  const deliveryLink = formData.get("delivery_link")?.toString().trim();
  const deliveryNote = formData.get("delivery_note")?.toString().trim() || "";

  if (!jobId || !deliveryLink) {
    return { error: "Vui lòng nhập đường dẫn liên kết sản phẩm bàn giao." };
  }

  // Kiểm tra tính hợp lệ sơ bộ của URL
  try {
    new URL(deliveryLink);
  } catch (e) {
    return { error: "Đường dẫn sản phẩm bàn giao không hợp lệ (phải bắt đầu bằng http:// hoặc https://)." };
  }

  const cookieStore = await cookies();
  const mockSession = cookieStore.get("mock-session");
  const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || (mockSession && mockSession.value);

  if (isMock) {
    try {
      const cookieStore = await cookies();
      
      // Đọc và cập nhật Escrows cookie
      const mockEscrowsCookie = cookieStore.get("mock-escrows");
      let escrows: any[] = [];
      if (mockEscrowsCookie && mockEscrowsCookie.value) {
        escrows = JSON.parse(mockEscrowsCookie.value);
      }

      const escrowIndex = escrows.findIndex((e) => e.job_id === jobId);
      if (escrowIndex === -1) {
        return { error: "Không tìm thấy giao dịch ký quỹ của dự án này. Hãy đảm bảo dự án đã được ký quỹ." };
      }

      escrows[escrowIndex].delivery_link = deliveryLink;
      escrows[escrowIndex].delivery_note = deliveryNote;

      cookieStore.set("mock-escrows", JSON.stringify(escrows), { path: "/", maxAge: 86400 });

    } catch (e) {
      return { error: "Lỗi lưu sản phẩm bàn giao giả lập." };
    }
  } else {
    try {
      const supabase = await getSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { error: "Phiên làm việc hết hạn. Vui lòng đăng nhập lại." };
      }

      // Cập nhật link bàn giao vào bảng escrows
      const { error: updateError } = await supabase
        .from("escrows")
        .update({
          delivery_link: deliveryLink,
          delivery_note: deliveryNote,
        })
        .eq("job_id", jobId)
        .eq("freelancer_id", user.id);

      if (updateError) {
        return { error: `Không thể nộp sản phẩm bàn giao: ${updateError.message}` };
      }
    } catch (e) {
      return { error: "Lỗi kết nối cơ sở dữ liệu." };
    }
  }

  // Revalidate cache
  revalidatePath("/freelancer");
  revalidatePath("/creator");
  revalidatePath("/creator/jobs");

  return { success: true };
}
