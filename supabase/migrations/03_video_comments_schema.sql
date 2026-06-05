-- supabase/migrations/03_video_comments_schema.sql
-- Bảng lưu trữ bình luận/góp ý video nháp kèm mốc thời gian và nét vẽ Canvas của CreatorHire

CREATE TABLE IF NOT EXISTS public.video_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    timestamp INTEGER NOT NULL, -- Mốc thời gian tính bằng giây
    author_name TEXT NOT NULL,
    author_role TEXT NOT NULL CHECK (author_role IN ('creator', 'freelancer')),
    content TEXT NOT NULL,
    drawing_data TEXT, -- Chuỗi chứa tọa độ nét vẽ hoặc ảnh Base64 trong suốt của nét vẽ Canvas
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Bật Row Level Security
ALTER TABLE public.video_comments ENABLE ROW LEVEL SECURITY;

-- Tạo chính sách (Policies) cho phép mọi người dùng đã đăng nhập đọc bình luận của job tương ứng
CREATE POLICY "Cho phép người dùng đã đăng nhập xem bình luận video"
    ON public.video_comments
    FOR SELECT
    TO authenticated
    USING (true);

-- Tạo chính sách cho phép người dùng đã đăng nhập tạo bình luận
CREATE POLICY "Cho phép người dùng đã đăng nhập tạo bình luận video"
    ON public.video_comments
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Bật Realtime cho bảng video_comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_comments;
