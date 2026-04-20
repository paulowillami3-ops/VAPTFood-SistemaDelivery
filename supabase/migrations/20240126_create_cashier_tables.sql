-- Create cashier_sessions table
CREATE TABLE IF NOT EXISTS public.cashier_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    establishment_id UUID REFERENCES public.establishments(id), -- Optional depending on tenancy
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    closed_at TIMESTAMP WITH TIME ZONE,
    initial_balance DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
    final_balance DECIMAL(10, 2),
    final_money_balance DECIMAL(10, 2),
    final_card_balance DECIMAL(10, 2),
    status TEXT CHECK (status IN ('OPEN', 'CLOSED')) DEFAULT 'OPEN' NOT NULL,
    opened_by UUID REFERENCES auth.users(id),
    closed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create cashier_transactions table (for supplies, withdrawals, etc.)
CREATE TABLE IF NOT EXISTS public.cashier_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.cashier_sessions(id) ON DELETE CASCADE NOT NULL,
    type TEXT CHECK (type IN ('SALE', 'WITHDRAWAL', 'SUPPLY', 'ADJUSTMENT')) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    payment_method TEXT, -- 'CASH', 'CREDIT', 'DEBIT', 'PIX', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id)
);

-- Add simple RLS policies (adjust as needed for your auth setup)
ALTER TABLE public.cashier_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashier_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for authenticated users" ON public.cashier_sessions
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON public.cashier_transactions
    FOR ALL USING (auth.role() = 'authenticated');
