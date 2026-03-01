

# Corrigir filtro de pacientes inativos

## Problema

Quando o status do paciente é alterado para "inativo", o sistema também define `archived = true`. Porém, o filtro "Inativos" na listagem busca `archived = false AND status = 'inativo'`, o que nunca retorna resultados.

## Solução

### Arquivo: `src/pages/Patients.tsx`

Ajustar a lógica de query no `fetchPatients` para que o filtro "inativo" busque pacientes com `status = 'inativo'` independentemente do campo `archived`:

- Quando `statusFilter === "inativo"`: buscar `.eq("status", "inativo")` sem filtrar por `archived`
- Quando `statusFilter === "arquivados"`: manter `.eq("archived", true)` como está
- Quando `statusFilter === "todos"` ou `"ativo"`: manter `.eq("archived", false)` e filtrar por status se necessário

