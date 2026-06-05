-- supabase/migrations/07_wallet_schema.sql
-- Khởi tạo bảng Wallets và Withdrawal Requests cho quản lý tài chính freelancer

-- 1. Bảng Ví của Freelancer
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    balance NUMERIC DEFAULT 0.0 NOT NULL CHECK (balance >= 0),
    pending_balance NUMERIC DEFAULT 0.0 NOT NULL CHECK (pending_balance >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Bảng Yêu cầu Rút tiền
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_name TEXT NOT NULL,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Bật Row Level Security (RLS)
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Chính sách RLS cho Ví
CREATE POLICY "Cho phép đọc ví của chính mình" ON public.wallets
    FOR SELECT USING (auth.uid() = user_id);

-- Chính sách RLS cho Yêu cầu Rút tiền
CREATE POLICY "Cho phép đọc yêu cầu rút tiền của mình" ON public.withdrawal_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Cho phép gửi yêu cầu rút tiền mới" ON public.withdrawal_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Hàm tự động tạo ví mới khi người dùng đăng ký hồ sơ mới
CREATE OR REPLACE FUNCTION public.handle_new_wallet()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.wallets (user_id, balance, pending_balance)
    VALUES (new.id, 0.0, 0.0)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_profile_created_create_wallet
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_wallet();
