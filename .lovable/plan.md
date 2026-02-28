

# Fluxo de Caixa - Proposta de Implementação

## Conceito

Uma nova página "Fluxo de Caixa" visível apenas para o admin, com controle mensal de entradas (recebíveis pagos) e saídas (despesas da clínica), mostrando saldo do período.

## Banco de dados

### Nova tabela: `expenses` (contas a pagar)
- `id`, `user_id`, `conta_principal_id`
- `descricao` (text) - ex: "Aluguel", "Material"
- `categoria` (text) - ex: "Fixo", "Variável", "Pessoal"
- `valor` (numeric)
- `data_vencimento` (date)
- `data_pagamento` (date, nullable)
- `status` (text: "pendente" | "pago" | "cancelado")
- `forma_pagamento` (text, nullable)
- `observacao` (text, nullable)
- `archived`, `created_at`, `updated_at`
- RLS: apenas admin da conta pode ler/escrever

### Sem alteração na tabela `receivables`
As entradas no fluxo de caixa são calculadas automaticamente a partir dos recebíveis com `status_pagamento = 'pago'` no mês selecionado.

## Frontend

### Nova página: `/fluxo-de-caixa` (apenas admin)
- Seletor de mês
- 3 cards resumo: **Total Entradas** (recebíveis pagos), **Total Saídas** (despesas pagas), **Saldo**
- Tabela unificada em ordem cronológica com colunas: Data, Descrição, Tipo (Entrada/Saída), Valor, Status
  - Entradas: puxadas de `receivables` onde `status_pagamento = 'pago'` e `data_pagamento` no mês
  - Saídas: puxadas de `expenses`
- Botão "Nova Despesa" abre dialog para cadastrar conta a pagar
- Ações nas despesas: marcar como pago, cancelar, editar
- Filtros por tipo (entrada/saída) e categoria

### Sidebar
- Novo item "Fluxo de Caixa" visível apenas quando `isAdmin = true`

## Arquivos afetados
- Migração SQL: criar tabela `expenses` + RLS
- `src/pages/CashFlow.tsx` (novo)
- `src/App.tsx` - nova rota
- `src/components/AppSidebar.tsx` - novo link admin-only
- `src/types/index.ts` - tipo Expense

