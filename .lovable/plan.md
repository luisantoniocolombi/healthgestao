

# Plano: Correções de permissão do Admin

Estas alterações apenas adicionam capacidades administrativas sem modificar o comportamento existente para profissionais.

---

## 1. Migração SQL: Policies de UPDATE para admin

Adicionar duas novas policies RLS:

- **`patients`**: Policy de UPDATE para admins da mesma conta (`has_role(auth.uid(), 'admin') AND is_same_account(user_id)`)
- **`receivables`**: Policy de UPDATE para admins da mesma conta (mesma condição)

Também adicionar policy de INSERT em `patients` para admins poderem cadastrar pacientes com `user_id` diferente do próprio (para atribuir a um profissional):

- **`patients`**: Policy de INSERT para admins onde `is_same_account(user_id)` — permitindo que o admin insira pacientes em nome de profissionais da conta

---

## 2. PatientDetail.tsx — Admin visualiza pacientes do profissional

**Problema atual**: Linha 54 filtra `.eq("user_id", user.id)`, impedindo o admin de ver pacientes do profissional.

**Correção**: Remover `.eq("user_id", user.id)` da query do paciente. A RLS policy `Same account can read patients` já garante a segurança.

**Adição**: Seletor de profissional na aba Dados (visível apenas para admin) usando `useAccountProfiles`, permitindo trocar o `user_id` do paciente para outro profissional da conta. Incluir `user_id` no `handleSave`.

---

## 3. PatientForm.tsx — Admin escolhe profissional ao cadastrar

**Adição**: Importar `useAccountProfiles` e `useAuth`. Se admin, exibir Select com profissionais da conta. O `user_id` do paciente será o profissional selecionado (padrão: o próprio admin). A policy de INSERT atual só permite `user_id = auth.uid()`, então a nova policy de INSERT para admin é necessária.

---

## 4. Financial.tsx — Admin edita recebíveis do profissional

**Nenhuma mudança de código necessária.** Os botões "Marcar como pago" e "Cancelar" já existem no componente. Atualmente o update falha silenciosamente porque a RLS só permite update pelo owner. Com a nova policy de UPDATE para admins, esses botões passarão a funcionar para o admin em recebíveis de qualquer profissional da conta.

---

## Resumo

| Arquivo | Alteração |
|---|---|
| **Migração SQL** | 3 novas policies: UPDATE admin em `patients`, UPDATE admin em `receivables`, INSERT admin em `patients` (para `user_id` de profissionais da conta) |
| `src/pages/PatientDetail.tsx` | Remover filtro `user_id` na query; adicionar seletor de profissional (admin only) |
| `src/pages/PatientForm.tsx` | Adicionar seletor de profissional (admin only) |
| `src/pages/Financial.tsx` | Nenhuma alteração de código |

