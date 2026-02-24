

# Analise completa: Profissional cadastrado nao fica vinculado ao admin

## O que acontece hoje (passo a passo)

1. Admin gera convite com token
2. Profissional abre `/signup?token=ABC`
3. Profissional preenche email e senha, clica "Criar conta"
4. Como a confirmacao de email esta ativa, `supabase.auth.signUp()` retorna **sem sessao** (`session = null`)
5. O codigo entra no branch `else if (token && !signUpData.session)` e mostra: "Verifique seu e-mail"
6. **Problema critico**: O `emailRedirectTo` e `window.location.origin` — **sem o token**. Quando o profissional confirma o email, ele e redirecionado para a raiz do site sem o token
7. Simultaneamente, o trigger `on_auth_user_created` dispara e cria o perfil com `conta_principal_id = proprio usuario` e role = `admin`
8. A funcao `accept-invitation` **nunca e chamada**, porque:
   - No signup nao havia sessao (email nao confirmado)
   - Ao retornar do email, o token do convite se perdeu
9. Resultado: profissional entra no sistema como admin independente, sem vinculo

## Problemas identificados

| # | Problema | Impacto |
|---|---|---|
| 1 | `emailRedirectTo` nao inclui o token do convite | Ao confirmar email, o token se perde e `accept-invitation` nunca e chamado |
| 2 | Nao ha logica de auto-aceitacao ao retornar com sessao + token | Mesmo que o redirect incluisse o token, a pagina nao tenta aceitar o convite automaticamente |
| 3 | Trigger `on_auth_user_created` sempre cria perfil como admin | O profissional comeca como admin; `accept-invitation` precisa corrigir isso depois, mas nunca e chamado |
| 4 | Nao ha modo login para usuarios ja existentes | Se o profissional ja tem conta, a pagina so oferece signup |

## Correcoes necessarias

### Arquivo: `src/pages/Signup.tsx`

**A. Corrigir emailRedirectTo para incluir o token:**
```
emailRedirectTo: token
  ? `https://healthgestao.lovable.app/signup?token=${token}`
  : "https://healthgestao.lovable.app"
```

**B. Adicionar useEffect para auto-aceitar convite ao retornar com sessao:**
- Ao carregar a pagina, se ha token valido E sessao ativa (usuario voltando do email de confirmacao), chamar `accept-invitation` automaticamente
- Redirecionar para `/pacientes` apos sucesso

**C. Adicionar modo login (toggle) para quando o profissional ja tem conta:**
- Botao para alternar entre "Criar conta" e "Entrar"
- No modo login, usar `signInWithPassword` e chamar `accept-invitation` em seguida

**D. Detectar signup repetido (usuario ja existente):**
- Quando `signUp` retorna sem erro mas `user.identities` e vazio, o email ja esta cadastrado
- Exibir mensagem e alternar para modo login automaticamente

### Nenhuma alteracao nas Edge Functions
As funcoes `accept-invitation` e `invite-professional` ja estao corretas — o problema e exclusivamente no frontend que nunca chama `accept-invitation`.

---

## Resumo de alteracoes

| Arquivo | Alteracao |
|---|---|
| `src/pages/Signup.tsx` | Corrigir redirect URL com token; adicionar auto-aceitacao via useEffect; adicionar toggle login/signup; detectar usuario existente |

