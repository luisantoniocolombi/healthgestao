

# Adicionar campo "Gerar NFe" no cadastro de paciente

## Alteração

### Arquivo: `src/pages/PatientForm.tsx`

1. Importar `Checkbox` de `@/components/ui/checkbox`
2. Adicionar `gerar_nfe: false` ao estado inicial do form
3. Adicionar campo checkbox "Gerar NFe" no formulário, após o campo de Convênio, com o mesmo padrão visual usado no formulário de atendimentos

Nenhuma outra alteração. A tabela `patients` não possui coluna `gerar_nfe`, então será necessária uma migração para adicionar essa coluna.

### Migração de banco

```sql
ALTER TABLE public.patients ADD COLUMN gerar_nfe boolean NOT NULL DEFAULT false;
```

