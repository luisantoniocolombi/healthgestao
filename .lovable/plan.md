

# Despesas Recorrentes e Parceladas no Fluxo de Caixa

## Resumo

Ao criar uma nova despesa (ou receita), o usuário poderá marcar como **recorrente** (ex: aluguel mensal) ou **parcelada** (ex: equipamento em 5x). O sistema criará automaticamente os lançamentos nos meses seguintes.

## Alterações

### 1. Tabela `expenses` -- migração de banco

Adicionar duas colunas para rastrear a origem:
```sql
ALTER TABLE public.expenses ADD COLUMN recorrencia_tipo text; -- 'recorrente', 'parcelada', ou null
ALTER TABLE public.expenses ADD COLUMN parcela_info text; -- ex: '2/5' para parcela 2 de 5
```

### 2. `src/pages/CashFlow.tsx`

**Novo estado no formulário:**
- `recorrencia`: `"nenhuma" | "recorrente" | "parcelada"` (default `"nenhuma"`)
- `num_parcelas`: `""` (número de parcelas, visível só quando parcelada)
- `num_meses_recorrente`: `""` (quantos meses gerar, visível só quando recorrente)

**Novos campos no Dialog de criação (não aparecem na edição):**
- Select "Tipo de lançamento": Único / Recorrente / Parcelado
- Se Recorrente: Input "Quantidade de meses" (2 a 24)
- Se Parcelado: Input "Número de parcelas" (2 a 48)

**Lógica no `handleSave` (somente criação, não edição):**
- Se `recorrente`: cria N registros com mesma descrição, mesmo valor, data_vencimento incrementada mês a mês (mesmo dia), com `recorrencia_tipo = 'recorrente'`
- Se `parcelada`: divide o valor total pelo número de parcelas, cria N registros com `parcela_info = '1/5', '2/5'...` e descrição com sufixo `(1/5)`, `recorrencia_tipo = 'parcelada'`
- Se `nenhuma`: comportamento atual, sem alterações

**Exemplo concreto:**
- Aluguel R$2.000, recorrente 6 meses, vencimento 05/03 → cria 6 registros: 05/03, 05/04, 05/05, 05/06, 05/07, 05/08
- Equipamento R$2.000, parcelado 5x, vencimento 05/03 → cria 5 registros de R$400: 05/03 (1/5), 05/04 (2/5), etc.

### 3. Exibição na tabela

Na coluna "Descrição", as despesas parceladas mostrarão o sufixo da parcela (ex: "Equipamento (2/5)"). Despesas recorrentes terão um badge "Recorrente" ao lado.

Nenhuma outra alteração necessária.

