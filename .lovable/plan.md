

# Filtro de Visualização do Calendário: Semanal / Quinzenal / Mensal

## Resumo

Adicionar um seletor de período na aba de Atendimentos que permite alternar entre 3 modos de exibição do calendário: **Semanal** (7 dias), **Quinzenal** (14 dias) e **Mensal** (mês completo, comportamento atual).

## Alteração: `src/pages/Appointments.tsx`

### 1. Novo estado

```tsx
const [calendarView, setCalendarView] = useState<"semanal" | "quinzenal" | "mensal">("mensal");
```

### 2. Cálculo dinâmico dos dias exibidos

Substituir o cálculo fixo de `days` (linhas 117-120) por lógica condicional:

- **Mensal**: mantém o comportamento atual (startOfWeek → endOfWeek do mês)
- **Semanal**: `startOfWeek(selectedDate)` → `endOfWeek(selectedDate)` (7 dias)
- **Quinzenal**: `startOfWeek(selectedDate)` → `endOfWeek(selectedDate) + 7 dias` (14 dias)

A navegação com ← / → avança/retrocede conforme o modo: 1 semana, 2 semanas ou 1 mês.

### 3. Ajuste do fetchData

O range de busca dos appointments também será dinâmico: no modo semanal/quinzenal, buscar apenas os dados do intervalo visível (em vez de sempre buscar o mês inteiro), usando o `selectedDate` como referência. O `useEffect` passará a depender também de `calendarView` e `selectedDate` (nos modos semanal/quinzenal).

### 4. UI do filtro

Adicionar um `Select` ao lado do filtro de paciente (na linha 142-154), com as opções:
- Semanal
- Quinzenal  
- Mensal

### 5. Ajuste do header de navegação

O título entre os botões ← / → mostrará:
- **Mensal**: "março 2026" (atual)
- **Semanal**: "23/03 - 29/03/2026"
- **Quinzenal**: "23/03 - 05/04/2026"

### 6. Contadores

Os contadores (Agendados/Realizados/Cancelados) continuarão refletindo os dados carregados, ou seja, se semanal, mostram a contagem da semana.

### Sem alterações no banco de dados.

