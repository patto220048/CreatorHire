-- supabase/migrations/06_notifications_schema.sql
-- Khởi tạo bảng Notifications cho hệ thống Thông báo người dùng

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Bật Row Level Security (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 1. Cho phép người dùng đọc thông báo của chính mình
CREATE POLICY "Cho phép người dùng đọc thông báo của chính mình" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

-- 2. Cho phép người dùng cập nhật trạng thái thông báo (ví dụ: đánh dấu đã đọc)
CREATE POLICY "Cho phép người dùng cập nhật thông báo của chính mình" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. Cho phép hệ thống hoặc các trigger thêm thông báo (INSERT)
CREATE POLICY "Cho phép hệ thống thêm thông báo" ON public.notifications
    FOR INSERT WITH CHECK (true);
