

# Adicionar campo "Email do Responsável" no cadastro e edição do paciente

## Alterações

### 1. Migração de banco
Adicionar coluna `responsavel_email` (text, nullable) na tabela `patients`:
```sql
ALTER TABLE public.patients ADD COLUMN responsavel_email text;
```

### 2. `src/types/index.ts`
Adicionar `responsavel_email?: string` à interface `Patient`.

### 3. `src/pages/PatientForm.tsx`
- Adicionar `responsavel_email: ""` ao estado inicial do form
- Adicionar campo Input "Email do Responsável" logo após o campo "Responsável"
- Incluir no objeto de inserção

### 4. `src/pages/PatientDetail.tsx`
- Adicionar campo Input "Email do Responsável" após o campo "Responsável" (linha 322)
- Incluir `responsavel_email` na destructuring e no `updateData` do `handleSave` (linhas 91-92)

Nenhuma outra alteração.

