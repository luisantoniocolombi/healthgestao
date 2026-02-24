

# Diagnóstico: Bugs no Fluxo de Convite de Profissional

Encontrei **4 problemas distintos** que precisam ser corrigidos:

---

## Bug 1: Recursão infinita nas políticas RLS de `profiles` (CRÍTICO)

A política "Admins can read all profiles in their account" contém uma subconsulta direta na própria tabela `profiles`:

```sql
conta_principal_id = (
  SELECT profiles_1.conta_principal_id
  FROM profiles profiles_1
  WHERE profiles_1.id = auth.uid()
)
```

Isso causa **recursão infinita** porque o PostgreSQL precisa avaliar a policy para executar a subconsulta, que por sua vez precisa avaliar a policy novamente. É o erro `42P17` que aparece em todas as requisições à tabela `profiles`.

**Correção:** Substituir a subconsulta pela função `get_my_conta_principal_id()` que já existe e usa `SECURITY DEFINER` (bypassa RLS):

```sql
DROP POLICY "Admins can read all profiles in their account" ON profiles;
CREATE POLICY "Admins can read all profiles in their account"
  ON profiles FOR SELECT
  USING (conta_principal_id = get_my_conta_principal_id());

DROP POLICY "Admins can update profiles in their account" ON profiles;
CREATE POLICY "Admins can update profiles in their account"
  ON profiles FOR UPDATE
  USING (has_role(auth.uid(), 'admin') AND conta_principal_id = get_my_conta_principal_id());
```

---

## Bug 2: Nome do campo incorreto na chamada do Edge Function

O `Professionals.tsx` envia `nome_profissional` no body:
```js
body: { email, nome_profissional: nome, cor_identificacao: cor }
```

Mas o Edge Function `invite-professional` extrai `nome`:
```js
const { email, nome, cor_identificacao } = await req.json();
```

**Correção:** Alterar o Edge Function para ler `nome_profissional` do body (ou vice-versa). A melhor opção é ajustar o frontend para enviar `nome` em vez de `nome_profissional`, mantendo consistência com a function.

---

## Bug 3: Link de convite gerado com URL incorreta

O Edge Function usa `req.headers.get("origin")` para construir o link. Quando chamado via `supabase.functions.invoke()`, o header `origin` aponta para a URL do Supabase Functions, não para a URL da aplicação.

**Correção:** Passar a URL de origem explicitamente no body da requisição a partir do frontend:

```js
// Professionals.tsx
body: { email, nome, cor_identificacao: cor, origin: window.location.origin }
```

```js
// Edge Function
const origin = body.origin || req.headers.get("origin") || "";
const inviteLink = `${origin}/signup?token=${inviteToken}`;
```

---

## Bug 4: Rota `/signup` bloqueada para usuários logados

No `App.tsx`, a rota `/signup` está envolvida em `AuthRoute`, que redireciona usuários logados para `/pacientes`. Se um profissional já estiver logado e clicar no link de convite, ele será redirecionado sem processar o token.

**Correção:** Remover o `AuthRoute` da rota `/signup`, permitindo que usuários acessem a página independentemente do estado de autenticação. A página `Signup.tsx` já tem lógica para lidar com tokens.

---

## Sobre o envio de email

O Edge Function **não envia email** — ele apenas gera o link e retorna para o admin copiar manualmente. Isso é intencional no design atual. Se desejar envio automático por email, será necessário configurar um serviço de email (como Resend) em uma etapa futura.

---

## Resumo das alterações

| Arquivo | Alteração |
|---|---|
| **Migração SQL** | Recriar policies de `profiles` usando `get_my_conta_principal_id()` |
| **`src/pages/Professionals.tsx`** | Corrigir campo `nome_profissional` → `nome`; passar `origin` no body |
| **`supabase/functions/invite-professional/index.ts`** | Ler `origin` do body da requisição |
| **`src/App.tsx`** | Remover `AuthRoute` wrapper da rota `/signup` |

