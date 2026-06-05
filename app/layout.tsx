import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import MockTestPanel from "@/components/mock-test-panel";
import ChatBubblePopup from "@/components/chat/chat-bubble-popup";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CreatorHire - Nền tảng thuê Freelancer cho Nhà sáng tạo",
  description: "Nơi kết nối các Creator với Video Editor, Scriptwriter và Thumbnail Designer chuyên nghiệp hàng đầu Việt Nam.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans bg-canvas text-charcoal" suppressHydrationWarning>
        {children}
        <ChatBubblePopup />
        <MockTestPanel />
      </body>
    </html>
  );
}

