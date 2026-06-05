// app/api/webhook/payos/route.ts
// API Webhook tiếp nhận thanh toán thành công tự động từ PayOS

import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

// Helper tạo signature HMAC SHA256 cho PayOS
function signPayOSData(data: Record<string, any>, key: string): string {
  const sortedKeys = Object.keys(data).sort();
  const queryStr = sortedKeys
    .map((k) => `${k}=${data[k]}`)
    .join("&");
  return crypto.createHmac("sha256", key).update(queryStr).digest("hex");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Kiểm tra cấu trúc dữ liệu PayOS
    if (!body || body.code !== "00" || !body.data) {
      return NextResponse.json({ error: "Dữ liệu webhook không hợp lệ." }, { status: 400 });
    }

    const transactionData = body.data;
    const orderCode = Number(transactionData.orderCode);
    const checksumKey = process.env.PAYOS_CHECKSUM_KEY;

    // Xác thực chữ ký số từ PayOS nếu cấu hình đầy đủ
    if (checksumKey) {
      const verifyData = {
        amount: transactionData.amount,
        description: transactionData.description,
        orderCode: transactionData.orderCode,
        paymentLinkId: transactionData.paymentLinkId,
        reference: transactionData.reference,
        transactionDateTime: transactionData.transactionDateTime,
      };

      const computedSignature = signPayOSData(verifyData, checksumKey);
      
      if (computedSignature !== transactionData.signature) {
        return NextResponse.json({ error: "Chữ ký thanh toán không hợp lệ." }, { status: 401 });
      }
    }

    // ----------------------------------------------------
    // CẬP NHẬT TRẠNG THÁI DỰ ÁN & ĐỀ XUẤT TRONG SUPABASE
    // ----------------------------------------------------
    const supabase = await getSupabaseServerClient();

    // 1. Tìm bản ghi escrow tương ứng qua order_code
    const { data: escrow, error: escrowFindError } = await supabase
      .from("escrows")
      .select("*")
      .eq("order_code", orderCode)
      .maybeSingle();

    if (escrowFindError || !escrow) {
      console.warn(`Không tìm thấy bản ghi ký quỹ cho mã đơn hàng: ${orderCode}`);
      return NextResponse.json({ success: false, message: "Không tìm thấy giao dịch ký quỹ." }, { status: 404 });
    }

    // Nếu đã ở trạng thái holding hoặc released, bỏ qua
    if (escrow.status !== "pending") {
      return NextResponse.json({ success: true, message: "Giao dịch đã được xử lý trước đó." });
    }

    // 2. Cập nhật Escrow sang holding (tạm giữ tiền)
    const { error: escrowUpdateError } = await supabase
      .from("escrows")
      .update({ status: "holding" })
      .eq("id", escrow.id);

    if (escrowUpdateError) {
      throw new Error(`Lỗi cập nhật trạng thái escrow: ${escrowUpdateError.message}`);
    }

    // 3. Cập nhật Job sang in-progress
    const { error: jobUpdateError } = await supabase
      .from("jobs")
      .update({ status: "in-progress" })
      .eq("id", escrow.job_id);

    if (jobUpdateError) {
      throw new Error(`Lỗi cập nhật trạng thái job: ${jobUpdateError.message}`);
    }

    // 4. Chấp nhận proposal được chọn
    const { error: propUpdateError } = await supabase
      .from("proposals")
      .update({ status: "accepted" })
      .eq("id", escrow.proposal_id);

    if (propUpdateError) {
      throw new Error(`Lỗi cập nhật đề xuất trúng tuyển: ${propUpdateError.message}`);
    }

    // 5. Từ chối các proposal còn lại của dự án đó
    await supabase
      .from("proposals")
      .update({ status: "rejected" })
      .eq("job_id", escrow.job_id)
      .neq("id", escrow.proposal_id)
      .eq("status", "pending");

    // Clear caches
    revalidatePath("/creator");
    revalidatePath("/creator/jobs");
    revalidatePath("/freelancer");
    revalidatePath(`/jobs/${escrow.job_id}`);

    return NextResponse.json({ success: true, message: "Ký quỹ hoàn tất thành công." });
  } catch (err: any) {
    console.error("Lỗi Webhook PayOS:", err);
    return NextResponse.json({ error: err.message || "Lỗi xử lý webhook." }, { status: 500 });
  }
}
