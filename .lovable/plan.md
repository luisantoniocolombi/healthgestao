

# Diagnóstico: Erro ao gerar convite (409 + getClaims)

Encontrei **2 problemas** que estão causando falhas na geração e aceitação de convites.

---

## Problema 1: Convite duplicado bloqueado (409)

O Edge Function `invite-professional` verifica se já existe um convite pendente para o mesmo email e retorna erro 409 se encontrar. Como você já tentou convidar `luisantonio.reverah@gmail.com` anteriormente, a função bloqueia novas tentativas.

**Correção:** Alterar a lógica para **atualizar o convite existente** com um novo token e nova data de expiração, em vez de bloquear. Assim o admin pode re-gerar o link sempre que necessário.

---

## Problema 2: `getClaims()` pode não existir no supabase-js v2

Ambos os Edge Functions (`invite-professional` e `accept-invitation`) usam `supabaseUser.auth.getClaims(token)`, que **não é um método padrão** do supabase-js v2. Isso pode estar falhando silenciosamente ou causando erros dependendo da versão carregada pelo Deno.

**Correção:** Substituir `getClaims` por `supabaseUser.auth.getUser()` que é o método oficial para obter os dados do usuário autenticado a partir do token.

---

## Problema 3: Erro genérico no frontend

Quando o Edge Function retorna um erro (409, 401, etc.), o `supabase.functions.invoke` retorna um `FunctionsHttpError` cujo `.message` é genérico ("Edge Function returned a non-2xx status code"). A mensagem real do servidor não aparece para o usuário.

**Correção:** Extrair a mensagem de erro do contexto da resposta no frontend.

---

## Alterações

| Arquivo | Alteração |
|---|---|
| `supabase/functions/invite-professional/index.ts` | Substituir `getClaims` por `getUser`; ao encontrar convite duplicado, atualizar o existente com novo token/expiração em vez de retornar 409 |
| `supabase/functions/accept-invitation/index.ts` | Substituir `getClaims` por `getUser` |
| `src/pages/Professionals.tsx` | Melhorar tratamento de erro para exibir a mensagem real do servidor |

