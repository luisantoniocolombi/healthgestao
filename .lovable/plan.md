

# Plano: Corrigir listagem de pacientes no formulario de atendimento

## Problema

No formulario de novo atendimento (`AppointmentForm`, linha 303), a query de pacientes filtra por `.eq("user_id", user.id)`, fazendo o admin ver apenas seus proprios pacientes. Pacientes vinculados a profissionais nao aparecem.

## Solucao

**Arquivo: `src/pages/Appointments.tsx`** (linhas 301-305)

Remover o filtro `user_id` quando o usuario for admin, deixando o RLS filtrar corretamente (a policy `Same account can read patients` ja garante que o admin ve todos os pacientes da conta):

```typescript
// Antes:
supabase.from("patients").select("id, nome_completo")
  .eq("user_id", user.id).eq("archived", false).order("nome_completo")

// Depois:
let patQ = supabase.from("patients").select("id, nome_completo")
  .eq("archived", false).order("nome_completo");
if (!isAdmin) {
  patQ = patQ.eq("user_id", user.id);
}
patQ.then(({ data }) => setPatients((data || []) as Patient[]));
```

Mesmo padrao ja usado na pagina principal de Atendimentos (linhas 91-98) e na pagina de Pacientes.

