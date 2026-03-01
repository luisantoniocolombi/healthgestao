

# Correcao: Tela branca no painel do profissional

## Causa raiz

O problema esta no `AuthContext`. O `loading` e definido como `false` ANTES de `fetchProfileAndRole` completar. Isso cria uma janela onde `profile` e `role` sao `null`, mas os componentes ja renderizam. Para profissionais, isso pode causar a tela branca durante navegacao porque:

1. `onAuthStateChange` usa `setTimeout` para `fetchProfileAndRole` mas chama `setLoading(false)` imediatamente
2. `getSession().then()` nao faz `await` em `fetchProfileAndRole` antes de `setLoading(false)`
3. Durante navegacao client-side, os componentes montam com `profile = null` e `role = null`

Na atualizacao da pagina (refresh), o timing e diferente e os dados carregam a tempo.

## Correcao

### Arquivo: `src/contexts/AuthContext.tsx`

1. No `getSession().then()`: usar `await fetchProfileAndRole()` antes de `setLoading(false)`
2. No `onAuthStateChange`: nao definir `loading = false` no evento `INITIAL_SESSION` (deixar o `getSession` controlar o loading inicial). Para eventos subsequentes (`SIGNED_IN`, `TOKEN_REFRESHED`, `SIGNED_OUT`), aguardar `fetchProfileAndRole` antes de definir loading.
3. Adicionar guard para evitar double-fetch com um ref

Codigo simplificado da mudanca:
```tsx
useEffect(() => {
  let initialDone = false;

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchProfileAndRole(session.user.id);
      } else {
        setProfile(null);
        setRole(null);
      }

      if (initialDone) {
        setLoading(false);
      }
    }
  );

  supabase.auth.getSession().then(async ({ data: { session } }) => {
    setSession(session);
    setUser(session?.user ?? null);
    if (session?.user) {
      await fetchProfileAndRole(session.user.id);
    }
    initialDone = true;
    setLoading(false);
  });

  return () => subscription.unsubscribe();
}, []);
```

Nenhuma outra alteracao. Apenas o `AuthContext`.

