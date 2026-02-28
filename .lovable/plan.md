

# Fix: Restore getSession + keep race condition protection

## Root cause
The previous fix removed `getSession()`, but `onAuthStateChange` doesn't always fire immediately on page load with a persisted session. Result: `loading` stays `true` forever → user sees "Carregando..." and never gets past it.

## Solution

### File: `src/contexts/AuthContext.tsx`
Restore the proper initialization pattern:
1. Set up `onAuthStateChange` listener first (for subsequent auth events)
2. Call `getSession()` to bootstrap the initial session
3. In both paths, **await** `fetchProfileAndRole` before setting `loading = false`
4. Use a flag to prevent the double-fire race condition (both `getSession` and `onAuthStateChange` firing for the same initial session)

```tsx
useEffect(() => {
  let mounted = true;
  let initialSessionHandled = false;

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (_event, session) => {
      if (!mounted) return;
      
      // Skip if this is the initial session and getSession already handled it
      if (!initialSessionHandled) {
        initialSessionHandled = true;
        return; // getSession below will handle the first load
      }

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

  // Bootstrap initial session
  supabase.auth.getSession().then(async ({ data: { session } }) => {
    if (!mounted) return;
    
    setSession(session);
    setUser(session?.user ?? null);

    if (session?.user) {
      await fetchProfileAndRole(session.user.id);
    }

    if (mounted) setLoading(false);
  });

  return () => {
    mounted = false;
    subscription.unsubscribe();
  };
}, []);
```

This restores the working initialization while keeping the fix that ensures profile/role are loaded before `loading` becomes `false`.

