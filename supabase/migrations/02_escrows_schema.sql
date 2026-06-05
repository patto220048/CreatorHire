-- supabase/migrations/02_escrows_schema.sql
-- Khởi tạo bảng Escrows để quản lý thanh toán ký quỹ và giải ngân

CREATE TABLE IF NOT EXISTS public.escrows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
    proposal_id UUID REFERENCES public.proposals(id) ON DELETE CASCADE NOT NULL,
    creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    freelancer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC NOT NULL,
    order_code BIGINT UNIQUE NOT NULL, -- Mã đơn hàng của PayOS
    status TEXT CHECK (status IN ('pending', 'holding', 'released', 'refunded')) DEFAULT 'holding' NOT NULL,
    delivery_link TEXT, -- Link sản phẩm bàn giao từ Freelancer
    delivery_note TEXT, -- Ghi chú bàn giao sản phẩm
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(job_id, proposal_id)
);

-- Kích hoạt RLS cho bảng escrows
ALTER TABLE public.escrows ENABLE ROW LEVEL SECURITY;

-- Chính sách RLS cho bảng escrows
-- Cả Creator đăng job và Freelancer thực hiện đều có quyền xem giao dịch ký quỹ này
CREATE POLICY "Cho phép đọc giao dịch ký quỹ của chính mình hoặc dự án của mình" ON public.escrows
    FOR SELECT USING (
        auth.uid() = freelancer_id OR 
        auth.uid() = creator_id
    );

-- Creator hoặc Freelancer có quyền update (ví dụ Freelancer nộp link, Creator bấm giải ngân)
CREATE POLICY "Cho phép Creator hoặc Freelancer cập nhật thông tin giao dịch" ON public.escrows
    FOR UPDATE USING (
        auth.uid() = freelancer_id OR 
        auth.uid() = creator_id
    );
