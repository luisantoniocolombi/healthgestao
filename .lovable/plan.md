

# Plano: Corrigir sistema travado no "Carregando..."

## Diagnóstico

Identifiquei **dois problemas**:

### 1. Políticas RLS de `profiles` continuam RESTRICTIVE
A migração anterior criou policies sem a cláusula explícita `AS PERMISSIVE`. A configuração atual mostra todas as 3 policies de `profiles` como "Permissive: No" (RESTRICTIVE). Com RESTRICTIVE, **todas** as policies SELECT devem ser verdadeiras simultaneamente:
- `id = auth.uid()` (apenas próprio perfil)
- `conta_principal_id = get_my_conta_principal_id()`

Para o admin, ambas passam para o próprio perfil. Mas `get_my_conta_principal_id()` consulta `profiles` internamente, o que pode causar lentidão ou bloqueio intermitente durante o carregamento inicial, travando o `fetchProfileAndRole` no `AuthContext`.

### 2. Páginas não tratam erro corretamente
Em `Patients.tsx` (linha 45-46), quando a query falha, a função retorna **sem chamar `setLoading(false)`**, deixando a página em "Carregando..." para sempre.

## Solução

### 1. Nova migração SQL: recriar policies de `profiles` com `AS PERMISSIVE` explícito
Dropar as 3 policies e recriar com a cláusula `AS PERMISSIVE`:
- `Users can read own profile` - PERMISSIVE SELECT
- `Admins can read all profiles in their account` - PERMISSIVE SELECT
- `Admins can update profiles in their account` - PERMISSIVE UPDATE

### 2. Corrigir tratamento de erro em `Patients.tsx`
Adicionar `setLoading(false)` no caminho de erro (após `toast.error`), e mover para um bloco `finally`.

### 3. Aplicar mesmo fix em `Appointments.tsx` e `Financial.tsx`
Garantir que todas as páginas chamem `setLoading(false)` mesmo em caso de erro.

