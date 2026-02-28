import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Profile, AppRole } from "@/types";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: Profile | null;
  role: AppRole | null;
  isAdmin: boolean;
  contaPrincipalId: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  profile: null,
  role: null,
  isAdmin: false,
  contaPrincipalId: null,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);

  const fetchProfileAndRole = async (userId: string) => {
    try {
      const [profileRes, roleRes] = await Promise.all([
        supabase.from("profiles" as any).select("*").eq("id", userId).maybeSingle(),
        supabase.from("user_roles" as any).select("role").eq("user_id", userId).maybeSingle(),
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data as unknown as Profile);
      }
      if (roleRes.data) {
        setRole((roleRes.data as any).role as AppRole);
      }
    } catch (err) {
      console.error("Error fetching profile/role:", err);
    }
  };

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

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setRole(null);
  };

  const isAdmin = role === "admin";
  const contaPrincipalId = profile?.conta_principal_id ?? null;

  return (
    <AuthContext.Provider value={{ user, session, loading, profile, role, isAdmin, contaPrincipalId, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
