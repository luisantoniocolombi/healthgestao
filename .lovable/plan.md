

# Plano: Corrigir erros no painel do profissional

## Diagnóstico

Identifiquei dois problemas principais:

### Problema 1: ErrorBoundary não reseta ao navegar
O ErrorBoundary atual mantém o estado `hasError: true` mesmo quando o usuário navega para outra página. Uma vez que qualquer página causa erro, TODAS as páginas subsequentes mostram a mensagem de erro sem possibilidade de recuperação (exceto recarregar). Isso explica o comportamento "qualquer campo/item mostra erro".

### Problema 2: `.single()` sem tratamento de erro
Em `AppointmentForm` (linha 311), a query usa `.single()` que falha quando o profissional não tem acesso ao registro via RLS. Isso causa o erro inicial que trava o ErrorBoundary.

### Problema 3: Sub-queries sem verificação de erro
Em `PatientDetail`, os erros das queries de `conditions`, `appointments`, `receivables` e `clinical_notes` não são verificados.

## Solução

### 1. Corrigir ErrorBoundary para resetar ao navegar (`src/components/AppLayout.tsx`)
Usar `useLocation()` e passar `key={location.pathname}` no ErrorBoundary, forçando remontagem a cada navegação.

### 2. Trocar `.single()` por `.maybeSingle()` em AppointmentForm (`src/pages/Appointments.tsx`, linha 311)
Adicionar verificação de erro no `.then()`.

### 3. Adicionar tratamento de erro nas sub-queries do PatientDetail (`src/pages/PatientDetail.tsx`)
Verificar `.error` em cada resultado de query e exibir toast de erro quando necessário.

