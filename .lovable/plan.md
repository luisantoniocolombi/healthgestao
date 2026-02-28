# Plano: Corrigir refs + Agendamento Recorrente

## Parte 1 — Corrigir erro de refs (tela branca)

O erro "Function components cannot be given refs" aparece em `Patients` e potencialmente em todas as paginas renderizadas via `<Outlet>` do React Router.

### Arquivos a corrigir (adicionar `forwardRef`):

- `src/pages/Patients.tsx`
- `src/pages/Appointments.tsx` (tanto `Appointments` quanto `AppointmentForm`)
- `src/pages/Financial.tsx`
- `src/pages/CashFlow.tsx`
- `src/pages/PatientForm.tsx`
- `src/pages/PatientDetail.tsx`
- `src/pages/NotFound.tsx`

Cada um segue o mesmo padrao aplicado em `Professionals`:

```tsx
import { forwardRef } from "react";
const Component = forwardRef<HTMLDivElement, object>(function Component(_props, ref) {
  // ... logica existente
  return <div ref={ref} ...>...</div>;
});
export default Component;
```

## Parte 2 — Agendamento Recorrente

### Alteracao em `src/pages/Appointments.tsx` (AppointmentForm)

1. Adicionar dois novos campos de estado (somente para criacao, nao edicao):
  - `repetirSemanas: boolean` (toggle)
  - `quantidadeSemanas: number` (1-12, default 4)
2. Na UI, apos os campos de Data e Hora, exibir:
  - Switch "Repetir nas proximas semanas"
  - Se ativo, Input numerico "Quantas semanas?" (1 a 12)
  - Texto informativo: "Serao criados X atendimentos: [datas listadas]"
3. No `handleSubmit`, se `repetirSemanas` estiver ativo:
  - Criar o atendimento principal normalmente
  - Usar um loop para criar N atendimentos adicionais, cada um com `data_atendimento` incrementada em 7 dias
  - Todos com mesmo horario, paciente, status "agendado" e demais campos
  - Recebiveis devem ser  duplicados tambem (apenas se habilitado)

### Sem alteracao no banco de dados

Os atendimentos recorrentes sao simplesmente multiplos registros independentes na tabela `appointments`.