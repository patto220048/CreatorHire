// lib/utils.ts

/**
 * Ghép các class CSS có điều kiện.
 */
export function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}

/**
 * Định dạng tiền tệ sang VND (Ví dụ: 1000000 -> 1.000.000 đ)
 */
export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

/**
 * Tính thời gian đã trôi qua từ mốc ngày/giờ (Ví dụ: 2 giờ trước)
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Vừa xong";
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} giờ trước`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} ngày trước`;
}
