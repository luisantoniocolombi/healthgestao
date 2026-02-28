

# Diagnostico e correcao definitiva do AuthContext

## Problema identificado

O `initialSessionHandled` flag no AuthContext esta causando uma race condition. O flag assume que `onAuthStateChange` SEMPRE dispara antes de `getSession` resolver, mas isso nao e garantido. Em alguns cenarios:

1. `onAuthStateChange` dispara `INITIAL_SESSION` → flag pula o evento
2. `getSession` resolve → configura tudo corretamente
3. Logo apos, `TOKEN_REFRESHED` dispara → handler processa normalmente

Mas em OUTROS cenarios (token expirado, rede lenta):
1. `getSession` resolve PRIMEIRO com sessao nula ou stale
2. `onAuthStateChange` dispara depois → MAS o flag ja esta false, entao o PRIMEIRO evento e pulado
3. Resultado: dados carregam com sessao incompleta ou `user` fica null

## Solucao

### Arquivo: `src/contexts/AuthContext.tsx`

Remover o flag `initialSessionHandled` completamente. Usar o padrao robusto e simples:

1. `onAuthStateChange` processa TODOS os eventos (sem pular nenhum)
2. `getSession` so e usado como fallback para o caso raro de `INITIAL_SESSION` nao disparar
3. Usar uma flag `initialLoadDone` para evitar que `getSession` sobrescreva dados ja carregados por `onAuthStateChange`
4. Adicionar console.logs temporarios para diagnostico

```tsx
useEffect(() => {
  let mounted = true;
  let initialLoadDone = false;

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (_event, session) => {
      if (!mounted) return;

      console.log("[Auth] onAuthStateChange:", _event, !!session);

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchProfileAndRole(session.user.id);
      } else {
        setProfile(null);
        setRole(null);
      }

      initialLoadDone = true;
      if (mounted) setLoading(false);
    }
  );

  // Fallback: se INITIAL_SESSION nao disparar em 2s, usar getSession
  const fallbackTimer = setTimeout(async () => {
    if (!mounted || initialLoadDone) return;
    console.log("[Auth] Fallback: using getSession");

    const { data: { session } } = await supabase.auth.getSession();
    if (!mounted || initialLoadDone) return;

    setSession(session);
    setUser(session?.user ?? null);

    if (session?.user) {
      await fetchProfileAndRole(session.user.id);
    }

    if (mounted) setLoading(false);
  }, 2000);

  return () => {
    mounted = false;
    clearTimeout(fallbackTimer);
    subscription.unsubscribe();
  };
}, []);
```

Esta abordagem garante que:
- `onAuthStateChange` e o caminho primario (processa tudo, incluindo `INITIAL_SESSION`)
- Se por algum motivo `INITIAL_SESSION` nao disparar em 2 segundos, `getSession` assume como fallback
- Nenhum evento e pulado
- `loading` so vira `false` apos profile e role estarem carregados
- Console logs ajudam a diagnosticar se o problema persistir

