
CREATE TABLE public.expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  conta_principal_id uuid NOT NULL,
  descricao text NOT NULL,
  categoria text NOT NULL DEFAULT 'Variável',
  valor numeric NOT NULL,
  data_vencimento date NOT NULL,
  data_pagamento date,
  status text NOT NULL DEFAULT 'pendente',
  forma_pagamento text,
  observacao text,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Only admins of the same account can read
CREATE POLICY "Admins read expenses" ON public.expenses
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    AND conta_principal_id = get_my_conta_principal_id()
  );

-- Only admins can insert
CREATE POLICY "Admins insert expenses" ON public.expenses
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    AND conta_principal_id = get_my_conta_principal_id()
    AND user_id = auth.uid()
  );

-- Only admins can update
CREATE POLICY "Admins update expenses" ON public.expenses
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    AND conta_principal_id = get_my_conta_principal_id()
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    AND conta_principal_id = get_my_conta_principal_id()
  );

-- Only admins can delete
CREATE POLICY "Admins delete expenses" ON public.expenses
  FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    AND conta_principal_id = get_my_conta_principal_id()
  );

-- Auto-update updated_at
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
