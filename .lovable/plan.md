

# Plano: Corrigir tela branca e carregamento de profissionais

## Diagnóstico

Identifiquei **dois problemas**:

### 1. Race condition no AuthContext (causa da tela branca)
Em `AuthContext.tsx`, `setLoading(false)` (linhas 67 e 77) é chamado **ANTES** de `fetchProfileAndRole` completar. Isso faz `isAdmin = false` temporariamente. A página Profissionais vê `isAdmin = false` e renderiza "Acesso restrito", ou pior, causa um erro que o ErrorBoundary captura. Após refresh, o timing muda e funciona.

### 2. Políticas RLS da tabela profiles são RESTRITIVAS
As 3 políticas SELECT em `profiles` são todas RESTRICTIVE (Permissive: No). Isso significa que TODAS devem ser verdadeiras simultaneamente:
- `id = auth.uid()` (policy 1)  
- `conta_principal_id = get_my_conta_principal_id()` (policy 2)

A interseção dessas duas condições = admin só lê o **próprio** perfil. A query de profissionais (`id != admin_id`) retorna `[]` vazio. Confirmado pelo network request que retorna `[]`.

## Solução

### 1. Corrigir AuthContext (`src/contexts/AuthContext.tsx`)
Só chamar `setLoading(false)` **depois** que `fetchProfileAndRole` terminar. Await o resultado antes de liberar o loading.

### 2. Migração SQL: trocar policies de profiles para PERMISSIVE
Dropar as 3 policies RESTRICTIVE e recriar como PERMISSIVE:
- `Users can read own profile` - PERMISSIVE SELECT: `id = auth.uid()`
- `Admins can read all profiles in their account` - PERMISSIVE SELECT: `conta_principal_id = get_my_conta_principal_id()`
- `Admins can update profiles in their account` - PERMISSIVE UPDATE (manter mesma lógica)

Com PERMISSIVE, basta UMA policy ser verdadeira para conceder acesso. O admin poderá ler todos os profiles da mesma conta.

