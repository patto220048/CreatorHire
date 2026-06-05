-- supabase/migrations/04_reviews_schema.sql
-- Khởi tạo bảng Reviews để đánh giá chất lượng dự án

CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
    reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    reviewee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(job_id, reviewer_id)
);

-- Đảm bảo cột rating tồn tại trên bảng profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 0.0;

-- Kích hoạt RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Chính sách RLS
CREATE POLICY "Cho phép đọc đánh giá công khai" ON public.reviews
    FOR SELECT USING (true);

CREATE POLICY "Cho phép người tham gia dự án tạo đánh giá" ON public.reviews
    FOR INSERT WITH CHECK (
        auth.uid() = reviewer_id AND (
            EXISTS (
                SELECT 1 FROM public.escrows 
                WHERE job_id = reviews.job_id AND (creator_id = auth.uid() OR freelancer_id = auth.uid())
            )
        )
    );

-- Hàm tự động cập nhật số sao trung bình (rating) vào bảng profiles khi có đánh giá mới
CREATE OR REPLACE FUNCTION public.update_profile_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET rating = (
        SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0.0)
        FROM public.reviews
        WHERE reviewee_id = NEW.reviewee_id
    )
    WHERE id = NEW.reviewee_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_review_inserted
    AFTER INSERT ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION public.update_profile_rating();
