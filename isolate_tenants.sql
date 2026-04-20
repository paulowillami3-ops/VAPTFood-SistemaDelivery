
-- 1. Helper Function to get Establishment ID for current user
-- This function is SECURITY DEFINER to read the collaborators table securely
CREATE OR REPLACE FUNCTION public.get_user_establishment_id()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_est_id bigint;
BEGIN
  -- Change this to match your linking logic. 
  -- We assume 'collaborators.email' matches 'auth.email()'
  SELECT establishment_id INTO v_est_id
  FROM public.collaborators
  WHERE email = auth.jwt() ->> 'email'
  LIMIT 1;

  RETURN v_est_id;
END;
$$;

-- 2. Secure "cashier_sessions"
ALTER TABLE public.cashier_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.cashier_sessions;
DROP POLICY IF EXISTS "Isolation for cashier sessions" ON public.cashier_sessions;

CREATE POLICY "Isolation for cashier sessions" ON public.cashier_sessions
FOR ALL
TO authenticated
USING (
  establishment_id = public.get_user_establishment_id()
)
WITH CHECK (
  establishment_id = public.get_user_establishment_id()
);

-- 3. Secure "cashier_transactions"
ALTER TABLE public.cashier_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.cashier_transactions;
DROP POLICY IF EXISTS "Isolation for cashier transactions" ON public.cashier_transactions;

-- Transactions link to sessions, which link to establishment.
-- We can verify via the session_id OR join.
-- Simpler: Add establishment_id to transactions? No, schema doesn't have it.
-- Join check:
CREATE POLICY "Isolation for cashier transactions" ON public.cashier_transactions
FOR ALL
TO authenticated
USING (
  session_id IN (
    SELECT id FROM public.cashier_sessions 
    WHERE establishment_id = public.get_user_establishment_id()
  )
)
WITH CHECK (
  session_id IN (
    SELECT id FROM public.cashier_sessions 
    WHERE establishment_id = public.get_user_establishment_id()
  )
);

-- 4. Secure "establishment_settings"
ALTER TABLE public.establishment_settings ENABLE ROW LEVEL SECURITY;

-- Allow READ for everyone (public menu needs to find store by slug)
CREATE POLICY "Public read access for establishment_settings" ON public.establishment_settings
FOR SELECT
TO anon, authenticated
USING (true); 
-- Note: 'USING (true)' allows listing ALL establishments. 
-- Ideally for public menu: 'USING (true)' is fine, or filter by active.
-- But for ADMIN writes:

CREATE POLICY "Admin write access for establishment_settings" ON public.establishment_settings
FOR UPDATE
TO authenticated
USING (
  id = public.get_user_establishment_id()
)
WITH CHECK (
  id = public.get_user_establishment_id()
);

-- 5. Secure "collaborators"
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own collaborator profile or same store" ON public.collaborators
FOR SELECT
TO authenticated
USING (
  -- User can see themselves OR other colleagues in the same store
  establishment_id = public.get_user_establishment_id()
);

-- 6. Secure "products" and "categories" (Admin Write Access)
-- Public Read is usually needed for menu
CREATE POLICY "Public read products" ON public.products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read categories" ON public.categories FOR SELECT TO anon, authenticated USING (true);

-- Admin Write
CREATE POLICY "Admin write products" ON public.products
FOR ALL
TO authenticated
USING (establishment_id = public.get_user_establishment_id())
WITH CHECK (establishment_id = public.get_user_establishment_id());

CREATE POLICY "Admin write categories" ON public.categories
FOR ALL
TO authenticated
USING (establishment_id = public.get_user_establishment_id())
WITH CHECK (establishment_id = public.get_user_establishment_id());
