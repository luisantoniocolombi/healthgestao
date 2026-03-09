

# Filtro Semanal na aba Financeiro

## Resumo

Adicionar um seletor de período (Mensal / Semanal) ao lado do filtro de mês existente. Quando "Semanal" estiver selecionado, o input de mês será substituído por uma navegação de semana (com botões anterior/próxima e exibição do intervalo de datas). Os dados serão filtrados pelo intervalo da semana selecionada.

## Alteração: `src/pages/Financial.tsx`

### Novo estado
- `periodType`: `"mensal" | "semanal"` (default `"mensal"`)
- `currentWeekStart`: `Date` — início da semana atual (segunda-feira)

### Lógica de datas
- Importar `startOfWeek`, `endOfWeek`, `addWeeks`, `subWeeks` de `date-fns`
- Quando `periodType === "semanal"`, calcular `start` e `end` a partir de `currentWeekStart` (segunda a domingo, locale ptBR)
- Quando `periodType === "mensal"`, manter o comportamento atual com `currentMonth`
- O `fetchData` usará as datas corretas conforme o tipo de período

### UI dos filtros (linha 216-238)
- Adicionar um `Select` de período antes do input de data:
  - Opções: "Mensal" e "Semanal"
- Quando mensal: mostrar o `input type="month"` atual
- Quando semanal: mostrar botões `←` e `→` para navegar semanas + label com o intervalo (ex: "03/03 - 09/03/2026")

### Sem alterações no banco de dados

Os cards de resumo e a tabela continuarão funcionando normalmente — apenas o intervalo de datas da query muda.

