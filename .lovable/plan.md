

# Plano: Atualizar status do atendimento no hover

## Problema de RLS

Atualmente, apenas o dono do atendimento (`user_id = auth.uid()`) pode fazer UPDATE. Admins só têm SELECT. Preciso adicionar uma policy de UPDATE para admins.

## Alterações

### 1. Migration: Adicionar policy de UPDATE para admins em `appointments`

```sql
CREATE POLICY "Admins update appointments in same account"
ON public.appointments
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) AND is_same_account(user_id))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND is_same_account(user_id));
```

### 2. UI em `src/pages/Appointments.tsx`

Na lista diária de atendimentos (linhas ~246-268), quando o status for `"agendado"`:

- Ao passar o mouse sobre o Badge de status, mostrar um botão/ícone de check para marcar como `"realizado"`
- Ao clicar, chamar `supabase.from("appointments").update({ status: "realizado" }).eq("id", a.id)` e atualizar o estado local
- Usar um `DropdownMenu` ou simplesmente um clique direto no Badge com tooltip para trocar o status
- Impedir propagação do click para não navegar ao detalhe do atendimento
- Após sucesso, atualizar a lista localmente (sem reload)

A interação será: hover no Badge "agendado" → Badge muda visual (ex: ícone de check aparece) → clique → status atualizado para "realizado" com toast de confirmação.

