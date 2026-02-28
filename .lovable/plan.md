

# Correcao: Paciente nao aparece ao editar atendimento agendado

## Problema

Em `AppointmentForm` (linha 353-354), a query de pacientes filtra por `user_id` para nao-admins:
```tsx
if (!isAdmin) {
  patQ = patQ.eq("user_id", user.id);
}
```

Isso exclui pacientes criados por outros usuarios da mesma conta. O RLS ja garante que so pacientes da mesma conta sao retornados (policy `is_same_account`), entao esse filtro e redundante e causa o bug.

## Correcao

### Arquivo: `src/pages/Appointments.tsx`

Remover as linhas 353-355 (o filtro `user_id` na query de pacientes do formulario):

```tsx
// ANTES
let patQ = supabase.from("patients").select("id, nome_completo")
  .eq("archived", false).order("nome_completo");
if (!isAdmin) {
  patQ = patQ.eq("user_id", user.id);
}

// DEPOIS
const patQ = supabase.from("patients").select("id, nome_completo")
  .eq("archived", false).order("nome_completo");
```

O RLS (`is_same_account`) ja cuida da seguranca. Sem mais alteracoes.

