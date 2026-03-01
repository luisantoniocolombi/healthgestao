

# Correção: Sistema travado em "Carregando..."

## Causa raiz

O `onAuthStateChange` do Supabase não deve conter chamadas `await` para o próprio Supabase dentro do callback — isso causa um deadlock. A documentação do Supabase alerta que o callback deve ser rápido/síncrono. O código anterior usava `setTimeout` justamente para evitar isso, mas a última alteração trocou por `await`, travando o sistema.

## Correção

### Arquivo: `src/contexts/AuthContext.tsx`

Manter `setTimeout` no `onAuthStateChange` para evitar deadlock, mas controlar o `loading` corretamente usando um flag para saber quando a inicialização terminou:

```tsx
useEffect(() => {
  let initialDone = false;

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // setTimeout evita deadlock com Supabase
        setTimeout(() => {
          fetchProfileAndRole(session.user.id).then(() => {
            if (initialDone) setLoading(false);
          });
        }, 0);
      } else {
        setProfile(null);
        setRole(null);
        if (initialDone) setLoading(false);
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

Diferenças chave:
- `onAuthStateChange`: usa `setTimeout` + `.then()` (sem `await` direto) para evitar deadlock
- `getSession`: mantém `await` para garantir que profile/role carregam antes do loading inicial
- `initialDone` controla qual path define o loading

Nenhuma outra alteração.

