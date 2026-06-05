// app/chat/page.tsx
import Navbar from "@/components/navbar";
import ChatView from "@/components/chat/chat-view";
import { Suspense } from "react";

export const metadata = {
  title: "Hộp thư | CreatorHire",
  description: "Trò chuyện, thương lượng báo giá và trao đổi định hướng video trực tiếp giữa Creator và Freelancer.",
};

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <Navbar />
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center text-xs text-stone gap-2">
          <span className="animate-spin inline-block w-4 h-4 border-2 border-brand-green border-t-transparent rounded-full" />
          Đang tải hộp thư...
        </div>
      }>
        <ChatView />
      </Suspense>
    </div>
  );
}
