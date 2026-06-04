-- supabase/migrations/01_init_schema.sql
-- Khởi tạo Schema Cơ sở dữ liệu cho CreatorHire

-- 1. Bảng Profiles (Hồ sơ người dùng)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT CHECK (role IN ('creator', 'freelancer')) NOT NULL,
    bio TEXT,
    skills TEXT[], -- Mảng các kỹ năng (Premiere Pro, Storytelling...)
    portfolio_video_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Bật Row Level Security (RLS) cho bảng profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Tạo chính sách (Policies) cho bảng profiles
CREATE POLICY "Cho phép đọc hồ sơ công khai" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Cho phép chính chủ cập nhật hồ sơ" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Trigger tự động đồng bộ tài khoản từ auth.users sang public.profiles khi đăng ký mới
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role, avatar_url)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', 'Người dùng mới'),
        COALESCE(new.raw_user_meta_data->>'role', 'creator'),
        new.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. Bảng Jobs (Tin tuyển dụng dự án)
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT CHECK (category IN ('video-edit', 'script', 'thumbnail', 'other')) NOT NULL,
    budget_type TEXT CHECK (budget_type IN ('fixed', 'hourly')) DEFAULT 'fixed' NOT NULL,
    budget_amount NUMERIC NOT NULL,
    status TEXT CHECK (status IN ('open', 'in-progress', 'completed', 'closed')) DEFAULT 'open' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cho phép đọc danh sách công việc công khai" ON public.jobs
    FOR SELECT USING (true);

CREATE POLICY "Cho phép Creator thêm mới công việc" ON public.jobs
    FOR INSERT WITH CHECK (
        auth.uid() = creator_id AND 
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'creator')
    );

CREATE POLICY "Cho phép Creator quản lý công việc của mình" ON public.jobs
    FOR ALL USING (auth.uid() = creator_id);


-- 3. Bảng Proposals (Báo giá ứng tuyển)
CREATE TABLE IF NOT EXISTS public.proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
    freelancer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    cover_letter TEXT NOT NULL,
    bid_amount NUMERIC NOT NULL,
    status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(job_id, freelancer_id) -- Mỗi freelancer chỉ được nộp 1 báo giá cho 1 công việc
);

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- Chỉ Creator của dự án và chính Freelancer nộp báo giá mới được quyền đọc báo giá đó
CREATE POLICY "Cho phép đọc báo giá của chính mình hoặc dự án của mình" ON public.proposals
    FOR SELECT USING (
        auth.uid() = freelancer_id OR 
        EXISTS (SELECT 1 FROM public.jobs WHERE id = job_id AND creator_id = auth.uid())
    );

-- Cho phép Freelancer ứng tuyển dự án
CREATE POLICY "Cho phép Freelancer gửi báo giá mới" ON public.proposals
    FOR INSERT WITH CHECK (
        auth.uid() = freelancer_id AND 
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'freelancer')
    );

CREATE POLICY "Cho phép chính chủ cập nhật hoặc xóa báo giá khi còn pending" ON public.proposals
    FOR ALL USING (auth.uid() = freelancer_id AND status = 'pending');
