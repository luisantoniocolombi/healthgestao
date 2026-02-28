

# Correcao definitiva: Race condition no AuthContext

## Diagnostico

Apos varredura completa, o Badge e forwardRef ja estao corretos. O problema real esta no **AuthContext** — ha uma race condition que causa comportamento diferente entre navegacao por clique (client-side) e reload (fresh load):

1. `onAuthStateChange` E `getSession` rodam em paralelo, causando dupla inicializacao
2. `setLoading(false)` e chamado ANTES de `fetchProfileAndRole` completar
3. `fetchProfileAndRole` usa `setTimeout(0)`, atrasando ainda mais
4. Resultado: componentes renderizam com `profile = null`, `role = null`, `contaPrincipalId = null` — e depois re-renderizam quando os dados chegam

Para o profissional, esse re-render tardio pode causar queries duplicadas, estados inconsistentes, e potencialmente o ErrorBoundary capturando um erro durante a transicao.

No reload, a sequencia e diferente: `loading = true` segura a renderizacao ate tudo estar pronto, mascarando o problema.

## Plano

### Arquivo 1: `src/contexts/AuthContext.tsx`
Reescrever a logica de inicializacao:
- Usar APENAS `onAuthStateChange` (remover `getSession` separado)
- So setar `loading = false` DEPOIS de `fetchProfileAndRole` completar
- Remover o `setTimeout` desnecessario
- Adicionar guard para nao resetar user durante token refresh

```tsx
useEffect(() => {
  let mounted = true;

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchProfileAndRole(session.user.id);
      } else {
        setProfile(null);
        setRole(null);
      }
      
      if (mounted) setLoading(false);
    }
  );

  return () => {
    mounted = false;
    subscription.unsubscribe();
  };
}, []);
```

### Arquivo 2: `src/pages/PatientDetail.tsx`
Adicionar tratamento defensivo para datas potencialmente nulas:
- Wrapper `safeFormat` que retorna fallback em caso de data invalida
- Aplicar em todas as chamadas `format(new Date(...))` no componente

### Arquivo 3: `src/components/ErrorBoundary.tsx`
Adicionar logging mais detalhado no `componentDidCatch` para capturar a stack trace completa caso o erro persista:
```tsx
componentDidCatch(error: Error, errorInfo: ErrorInfo) {
  console.error("ErrorBoundary caught:", error.message);
  console.error("Component stack:", errorInfo.componentStack);
}
```

Essa correcao garante que NENHUM componente renderize antes de ter profile e role disponiveis, eliminando a race condition que causa a tela branca.

