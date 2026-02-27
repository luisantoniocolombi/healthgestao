ALTER TABLE public.patients
  ADD COLUMN cpf text,
  ADD COLUMN data_nascimento date;

CREATE UNIQUE INDEX patients_cpf_unique ON public.patients (cpf) WHERE cpf IS NOT NULL;