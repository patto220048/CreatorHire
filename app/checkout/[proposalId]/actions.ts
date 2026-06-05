// app/checkout/[proposalId]/actions.ts
// Server Actions xử lý thanh toán ký quỹ qua PayOS và giả lập Offline

"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import crypto from "crypto";

interface PayOSConfig {
  clientId: string;
  apiKey: string;
  checksumKey: string;
}

const getPayOSConfig = (): PayOSConfig | null => {
  const clientId = process.env.PAYOS_CLIENT_ID;
  const apiKey = process.env.PAYOS_API_KEY;
  const checksumKey = process.env.PAYOS_CHECKSUM_KEY;

  if (!clientId || !apiKey || !checksumKey) {
    return null;
  }
  return { clientId, apiKey, checksumKey };
};

// Helper tạo signature HMAC SHA256 cho PayOS
function signPayOSData(data: Record<string, any>, key: string): string {
  const sortedKeys = Object.keys(data).sort();
  const queryStr = sortedKeys
    .map((k) => `${k}=${data[k]}`)
    .join("&");
  return crypto.createHmac("sha256", key).update(queryStr).digest("hex");
}

export async function createPaymentLinkAction(proposalId: string) {
  const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || proposalId.startsWith("mock-");
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";

  let proposal: any = null;
  let job: any = null;

  if (isMock) {
    // ----------------------------------------------------
    // CHẾ ĐỘ MOCK: ĐỌC DỮ LIỆU TỪ COOKIES
    // ----------------------------------------------------
    try {
      const cookieStore = await cookies();
      const mockProps = cookieStore.get("mock-proposals");
      if (mockProps && mockProps.value) {
        const props = JSON.parse(mockProps.value);
        proposal = props.find((p: any) => p.id === proposalId);
      }

      if (proposal) {
        const mockJobs = cookieStore.get("mock-jobs");
        if (mockJobs && mockJobs.value) {
          const jobs = JSON.parse(mockJobs.value);
          job = jobs.find((j: any) => j.id === proposal.job_id);
        }
      }
    } catch (e) {
      return { error: "Không thể đọc dữ liệu giả lập." };
    }
  } else {
    // ----------------------------------------------------
    // CHẾ ĐỘ THỰC TẾ: ĐỌC DỮ LIỆU TỪ SUPABASE
    // ----------------------------------------------------
    try {
      const supabase = await getSupabaseServerClient();
      const { data: propData, error: propError } = await supabase
        .from("proposals")
        .select("*")
        .eq("id", proposalId)
        .single();

      if (propData && !propError) {
        proposal = propData;
        const { data: jobData } = await supabase
          .from("jobs")
          .select("*")
          .eq("id", proposal.job_id)
          .single();
        job = jobData;
      }
    } catch (e) {
      return { error: "Lỗi kết nối cơ sở dữ liệu." };
    }
  }

  if (!proposal || !job) {
    return { error: "Không tìm thấy thông tin đề xuất hoặc tin tuyển dụng tương ứng." };
  }

  const orderCode = Date.now();
  const amount = Number(proposal.bid_amount || proposal.amount);
  const description = `Ky quy ${proposalId.substring(0, 8)}`; // Giới hạn 25 ký tự

  // 1. Tạo link thanh toán
  const payOSConfig = getPayOSConfig();
  if (!payOSConfig || isMock) {
    // Trả về dữ liệu giả lập nếu thiếu config hoặc đang ở Mock mode
    return {
      success: true,
      isMock: true,
      orderCode,
      amount,
      description,
      jobTitle: job.title,
      freelancerName: proposal.freelancer_name || "Trần Tuấn (Editor)",
      checkoutUrl: `${baseUrl}/checkout/${proposalId}?mock=true`,
    };
  }

  // Gửi request thật tới PayOS
  try {
    const returnUrl = `${baseUrl}/creator/jobs?payment=success&proposalId=${proposalId}`;
    const cancelUrl = `${baseUrl}/creator/jobs?payment=cancel`;

    const requestData = {
      amount,
      cancelUrl,
      description,
      orderCode,
      returnUrl,
    };

    const signature = signPayOSData(requestData, payOSConfig.checksumKey);

    const response = await fetch("https://api-merchant.payos.vn/v2/payment-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": payOSConfig.clientId,
        "x-api-key": payOSConfig.apiKey,
      },
      body: JSON.stringify({
        ...requestData,
        signature,
      }),
    });

    const result = await response.json();
    if (result.code === "00" && result.data) {
      // Lưu giao dịch ký quỹ trạng thái pending vào DB
      const supabase = await getSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from("escrows").insert({
        job_id: job.id,
        proposal_id: proposal.id,
        creator_id: user?.id,
        freelancer_id: proposal.freelancer_id,
        amount,
        order_code: orderCode,
        status: "pending",
      });

      return {
        success: true,
        isMock: false,
        orderCode,
        amount,
        checkoutUrl: result.data.checkoutUrl,
        qrCode: result.data.qrCode,
      };
    } else {
      return { error: result.desc || "Không thể khởi tạo link thanh toán từ PayOS." };
    }
  } catch (err) {
    return { error: "Lỗi kết nối API PayOS." };
  }
}

export async function confirmMockPaymentAction(proposalId: string, orderCode: number) {
  try {
    const cookieStore = await cookies();

    // 1. Đọc và cập nhật Proposals
    const mockPropsCookie = cookieStore.get("mock-proposals");
    let proposals: any[] = [];
    if (mockPropsCookie && mockPropsCookie.value) {
      proposals = JSON.parse(mockPropsCookie.value);
    }

    const targetProposalIndex = proposals.findIndex((p) => p.id === proposalId);
    if (targetProposalIndex === -1) {
      return { error: "Không tìm thấy đề xuất." };
    }

    const jobId = proposals[targetProposalIndex].job_id;

    // Chuyển proposal này thành accepted, các proposal khác cùng job thành rejected
    proposals = proposals.map((p) => {
      if (p.job_id === jobId) {
        return { ...p, status: p.id === proposalId ? "accepted" : "rejected" };
      }
      return p;
    });

    cookieStore.set("mock-proposals", JSON.stringify(proposals), { path: "/", maxAge: 86400 });

    // 2. Đọc và cập nhật Jobs
    const mockJobsCookie = cookieStore.get("mock-jobs");
    let jobs: any[] = [];
    if (mockJobsCookie && mockJobsCookie.value) {
      jobs = JSON.parse(mockJobsCookie.value);
    }

    const targetJobIndex = jobs.findIndex((j) => j.id === jobId);
    if (targetJobIndex !== -1) {
      jobs[targetJobIndex].status = "in-progress";
      cookieStore.set("mock-jobs", JSON.stringify(jobs), { path: "/", maxAge: 86400 });
    }

    // 3. Đọc và cập nhật Escrows
    const mockEscrowsCookie = cookieStore.get("mock-escrows");
    let escrows: any[] = [];
    if (mockEscrowsCookie && mockEscrowsCookie.value) {
      try {
        escrows = JSON.parse(mockEscrowsCookie.value);
      } catch (e) {}
    }

    const newEscrow = {
      id: `mock-escrow-${Date.now()}`,
      job_id: jobId,
      proposal_id: proposalId,
      creator_id: "mock-user-123", // Current mock creator
      freelancer_id: proposals[targetProposalIndex].freelancer_id || "fl-1",
      amount: proposals[targetProposalIndex].bid_amount,
      order_code: orderCode,
      status: "holding",
      delivery_link: null,
      delivery_note: null,
      created_at: new Date().toISOString(),
    };

    escrows = [newEscrow, ...escrows];
    cookieStore.set("mock-escrows", JSON.stringify(escrows), { path: "/", maxAge: 86400 });

    // Revalidate paths
    revalidatePath("/creator");
    revalidatePath("/creator/jobs");
    revalidatePath("/freelancer");
    revalidatePath(`/jobs/${jobId}`);

    return { success: true };
  } catch (e) {
    return { error: "Lỗi hệ thống khi xác nhận ký quỹ." };
  }
}
