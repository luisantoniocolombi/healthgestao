

# Nova Receita no Fluxo de Caixa

Adicionar botao "Nova Receita" ao lado de "Nova Despesa" para lancar entradas manuais de outras origens (nao vinculadas a pacientes).

## Banco de dados

Adicionar coluna `tipo` na tabela `expenses` com default `'despesa'`. Isso permite reusar a mesma tabela para receitas e despesas manuais, sem criar tabela nova.

```sql
ALTER TABLE public.expenses ADD COLUMN tipo text NOT NULL DEFAULT 'despesa';
```

## Frontend (`src/pages/CashFlow.tsx`)

1. Adicionar estado `dialogMode` ("despesa" | "receita") para controlar qual tipo o dialog esta criando
2. Botao "Nova Receita" (variante outline com icone verde) ao lado de "Nova Despesa"
3. No `handleSave`, incluir o campo `tipo` no insert (despesa ou receita)
4. No `fetchData`, buscar expenses com `tipo = 'receita'` tambem e incluir como entradas no fluxo
5. No calculo de `totalEntradas`, somar receitas manuais (expenses com tipo=receita e status=pago) aos receivables pagos
6. Na tabela, receitas manuais aparecem como "entrada" com acoes de editar/pagar/cancelar (igual despesas)
7. Dialog title muda conforme o modo: "Nova Receita" ou "Nova Despesa"

### Arquivo afetado
- Migracao SQL: adicionar coluna `tipo`
- `src/pages/CashFlow.tsx`: botao, logica de modo, calculo de totais

