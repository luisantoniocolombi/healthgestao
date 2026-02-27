

# Plano: Adicionar campos CPF e Data de Nascimento no cadastro de pacientes

## 1. Migração de banco de dados

Adicionar duas colunas na tabela `patients`:
- `cpf` (text, nullable, unique) — para uso futuro como identificador do cliente
- `data_nascimento` (date, nullable)

```sql
ALTER TABLE public.patients
  ADD COLUMN cpf text,
  ADD COLUMN data_nascimento date;

CREATE UNIQUE INDEX patients_cpf_unique ON public.patients (cpf) WHERE cpf IS NOT NULL;
```

## 2. Alterações no código

**`src/pages/PatientForm.tsx`**:
- Adicionar `cpf` e `data_nascimento` ao estado do formulário
- Adicionar campo de input para CPF com máscara (formato XXX.XXX.XXX-XX)
- Adicionar campo de input para Data de Nascimento (tipo date)
- Posicionar os campos no grid do formulário, junto aos dados pessoais

**`src/types/index.ts`**:
- Adicionar `cpf?: string` e `data_nascimento?: string` à interface `Patient`

**`src/pages/PatientDetail.tsx`** (se existir exibição de dados):
- Exibir CPF e data de nascimento na ficha do paciente

