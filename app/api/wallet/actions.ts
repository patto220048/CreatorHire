// app/api/wallet/actions.ts
// Server Actions quản lý ví, thu nhập và yêu cầu rút tiền của Freelancer

"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export interface Wallet {
  balance: number;
  pending_balance: number;
}

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

// Lấy thông tin ví hiện tại
export async function getWalletAction() {
  const cookieStore = await cookies();
  const mockSession = cookieStore.get("mock-session");
  const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                 !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                 (mockSession && mockSession.value);

  if (isMock) {
    try {
      if (!mockSession || !mockSession.value) {
        return { success: true, data: { balance: 0, pending_balance: 0 } };
      }

      // Đọc hoặc khởi tạo số dư ví mock từ cookie
      const balanceCookie = cookieStore.get("mock-wallet-balance");
      const pendingCookie = cookieStore.get("mock-wallet-pending");

      let balance = 5000000; // Số dư mặc định: 5.000.000 VND để test
      let pendingBalance = 3500000; // Số dư đang tạm giữ mặc định

      if (balanceCookie && balanceCookie.value !== undefined) {
        balance = Number(balanceCookie.value);
      } else {
        cookieStore.set("mock-wallet-balance", String(balance), { path: "/" });
      }

      if (pendingCookie && pendingCookie.value !== undefined) {
        pendingBalance = Number(pendingCookie.value);
      } else {
        cookieStore.set("mock-wallet-pending", String(pendingBalance), { path: "/" });
      }

      return { success: true, data: { balance, pending_balance: pendingBalance } as Wallet };
    } catch (e) {
      return { error: "Lỗi tải thông tin ví giả lập." };
    }
  } else {
    try {
      const supabase = await getSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { error: "Bạn chưa đăng nhập." };
      }

      let { data, error } = await supabase
        .from("wallets")
        .select("balance, pending_balance")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        return { error: `Lỗi truy vấn ví: ${error.message}` };
      }

      if (!data) {
        // Tự động tạo ví nếu chưa tồn tại
        const { data: newWallet, error: insertError } = await supabase
          .from("wallets")
          .insert({ user_id: user.id, balance: 0, pending_balance: 0 })
          .select("balance, pending_balance")
          .single();
        
        if (insertError) {
          return { error: `Lỗi khởi tạo ví mới: ${insertError.message}` };
        }
        data = newWallet;
      }

      return { 
        success: true, 
        data: {
          balance: Number(data.balance),
          pending_balance: Number(data.pending_balance),
        } as Wallet
      };
    } catch (e) {
      return { error: "Lỗi kết nối cơ sở dữ liệu." };
    }
  }
}

// Lấy danh sách yêu cầu rút tiền
export async function getWithdrawalRequestsAction() {
  const cookieStore = await cookies();
  const mockSession = cookieStore.get("mock-session");
  const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                 !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                 (mockSession && mockSession.value);

  if (isMock) {
    try {
      if (!mockSession || !mockSession.value) {
        return { success: true, data: [] };
      }

      const mockWithdrawalsCookie = cookieStore.get("mock-withdrawals");
      let requests: WithdrawalRequest[] = [];

      if (mockWithdrawalsCookie && mockWithdrawalsCookie.value) {
        try {
          requests = JSON.parse(decodeURIComponent(mockWithdrawalsCookie.value));
        } catch (e) {}
      } else {
        // Seed dữ liệu rút tiền mặc định
        const defaultRequests: WithdrawalRequest[] = [
          {
            id: "mock-with-1",
            user_id: "fl-1",
            amount: 2000000,
            bank_name: "Vietcombank",
            account_number: "1023456789",
            account_name: "HOANG MINH",
            status: "approved",
            created_at: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 ngày trước
          },
          {
            id: "mock-with-2",
            user_id: "fl-1",
            amount: 1500000,
            bank_name: "MB Bank",
            account_number: "0999888777666",
            account_name: "HOANG MINH",
            status: "pending",
            created_at: new Date(Date.now() - 3600000 * 4).toISOString(), // 4 giờ trước
          }
        ];
        cookieStore.set("mock-withdrawals", JSON.stringify(defaultRequests), {
          path: "/",
          maxAge: 86400 * 30,
        });
        requests = defaultRequests;
      }

      const userRequests = requests
        .filter((r) => r.user_id === "fl-1")
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return { success: true, data: userRequests };
    } catch (e) {
      return { error: "Lỗi tải lịch sử rút tiền giả lập." };
    }
  } else {
    try {
      const supabase = await getSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { error: "Bạn chưa đăng nhập." };
      }

      const { data, error } = await supabase
        .from("withdrawal_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        return { error: `Lỗi truy vấn lịch sử rút tiền: ${error.message}` };
      }

      const formatted: WithdrawalRequest[] = (data || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        amount: Number(item.amount),
        bank_name: item.bank_name,
        account_number: item.account_number,
        account_name: item.account_name,
        status: item.status,
        created_at: new Date(item.created_at).toISOString(),
      }));

      return { success: true, data: formatted };
    } catch (e) {
      return { error: "Lỗi kết nối cơ sở dữ liệu." };
    }
  }
}

// Gửi yêu cầu rút tiền mới
export async function submitWithdrawalRequestAction(
  amount: number,
  bankName: string,
  accountNumber: string,
  accountName: string
) {
  const cookieStore = await cookies();
  const mockSession = cookieStore.get("mock-session");
  const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                 !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                 (mockSession && mockSession.value);

  if (isMock) {
    try {
      if (!mockSession || !mockSession.value) {
        return { error: "Bạn chưa đăng nhập." };
      }

      // Đọc số dư hiện tại
      const balanceCookie = cookieStore.get("mock-wallet-balance");
      let currentBalance = balanceCookie ? Number(balanceCookie.value) : 5000000;

      if (currentBalance < amount) {
        return { error: "Số dư khả dụng không đủ để thực hiện giao dịch rút tiền." };
      }

      // Trừ tiền khỏi ví khả dụng
      const newBalance = currentBalance - amount;
      cookieStore.set("mock-wallet-balance", String(newBalance), { path: "/" });

      // Lưu giao dịch rút tiền mới
      const mockWithdrawalsCookie = cookieStore.get("mock-withdrawals");
      let currentRequests: WithdrawalRequest[] = [];

      if (mockWithdrawalsCookie && mockWithdrawalsCookie.value) {
        try {
          currentRequests = JSON.parse(decodeURIComponent(mockWithdrawalsCookie.value));
        } catch (e) {}
      }

      const newRequest: WithdrawalRequest = {
        id: `mock-with-${Date.now()}`,
        user_id: "fl-1",
        amount,
        bank_name: bankName,
        account_number: accountNumber,
        account_name: accountName.toUpperCase(),
        status: "pending",
        created_at: new Date().toISOString(),
      };

      currentRequests.push(newRequest);
      cookieStore.set("mock-withdrawals", JSON.stringify(currentRequests), {
        path: "/",
        maxAge: 86400 * 30,
      });

      // Tạo thông báo cho người dùng
      const mockNotifsCookie = cookieStore.get("mock-notifications");
      if (mockNotifsCookie && mockNotifsCookie.value) {
        try {
          const currentNotifs = JSON.parse(decodeURIComponent(mockNotifsCookie.value));
          currentNotifs.push({
            id: `mock-notif-${Date.now()}`,
            user_id: "fl-1",
            title: "Yêu cầu rút tiền đang chờ xử lý",
            content: `Hệ thống đã nhận yêu cầu rút ${amount.toLocaleString("vi-VN")} VND về tài khoản ${bankName}.`,
            link: "/freelancer",
            is_read: false,
            created_at: new Date().toISOString(),
          });
          cookieStore.set("mock-notifications", JSON.stringify(currentNotifs), { path: "/" });
        } catch (e) {}
      }

      revalidatePath("/freelancer");
      return { success: true, data: newRequest };
    } catch (e) {
      return { error: "Lỗi xử lý yêu cầu rút tiền giả lập." };
    }
  } else {
    try {
      const supabase = await getSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { error: "Bạn chưa đăng nhập." };
      }

      // 1. Kiểm tra số dư ví trong DB
      const { data: wallet, error: walletError } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", user.id)
        .single();

      if (walletError || !wallet) {
        return { error: "Không tìm thấy ví của tài khoản." };
      }

      if (Number(wallet.balance) < amount) {
        return { error: "Số dư ví không đủ để rút số tiền này." };
      }

      // 2. Thực hiện trừ tiền ví và tạo yêu cầu rút tiền (giao dịch an toàn)
      const { data: request, error: insertError } = await supabase
        .from("withdrawal_requests")
        .insert({
          user_id: user.id,
          amount,
          bank_name: bankName,
          account_number: accountNumber,
          account_name: accountName.toUpperCase(),
        })
        .select()
        .single();

      if (insertError) {
        return { error: `Lỗi tạo yêu cầu rút tiền: ${insertError.message}` };
      }

      // Cập nhật số dư ví mới
      const { error: updateError } = await supabase
        .from("wallets")
        .update({ balance: Number(wallet.balance) - amount })
        .eq("user_id", user.id);

      if (updateError) {
        return { error: `Lỗi trừ tiền ví: ${updateError.message}` };
      }

      // 3. Tạo thông báo trong DB
      await supabase
        .from("notifications")
        .insert({
          user_id: user.id,
          title: "Yêu cầu rút tiền đang chờ xử lý",
          content: `Hệ thống đang đối soát và chuyển khoản số tiền ${amount.toLocaleString("vi-VN")} VND tới ngân hàng ${bankName}.`,
          link: "/freelancer",
        });

      revalidatePath("/freelancer");
      return { success: true, data: request };
    } catch (e) {
      return { error: "Lỗi xử lý cơ sở dữ liệu." };
    }
  }
}
