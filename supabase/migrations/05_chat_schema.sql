-- supabase/migrations/05_chat_schema.sql
-- Khởi tạo bảng Messages cho hệ thống Chat trực tuyến

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Bật Row Level Security (RLS)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 1. Cho phép người dùng đọc tin nhắn gửi hoặc nhận bởi chính họ
CREATE POLICY "Cho phép người dùng đọc tin nhắn của chính mình" ON public.messages
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- 2. Cho phép gửi tin nhắn nếu là người gửi hợp lệ và có liên quan đến dự án/báo giá
CREATE POLICY "Cho phép gửi tin nhắn hợp lệ" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id
    );

-- 3. Cho phép cập nhật trạng thái đã đọc (is_read) bởi người nhận
CREATE POLICY "Cho phép người nhận đánh dấu đã đọc" ON public.messages
    FOR UPDATE USING (auth.uid() = receiver_id) WITH CHECK (auth.uid() = receiver_id);
