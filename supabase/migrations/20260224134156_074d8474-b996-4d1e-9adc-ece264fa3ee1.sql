
ALTER TABLE public.patients ADD COLUMN convenio text;

ALTER TABLE public.appointments ADD COLUMN gerar_nfe boolean NOT NULL DEFAULT false;
ALTER TABLE public.appointments ADD COLUMN profissional_parceiro_id uuid;
ALTER TABLE public.appointments ADD COLUMN percentual_parceiro numeric;

ALTER TABLE public.receivables ADD COLUMN gerar_nfe boolean NOT NULL DEFAULT false;
