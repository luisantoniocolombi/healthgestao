import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface AccountProfile {
  id: string;
  nome: string;
  cor_identificacao: string;
}

export function useAccountProfiles() {
  const { user, isAdmin } = useAuth();
  const [profileMap, setProfileMap] = useState<Record<string, AccountProfile>>({});

  useEffect(() => {
    if (!user || !isAdmin) return;

    supabase
      .from("profiles" as any)
      .select("id, nome, cor_identificacao")
      .eq("conta_principal_id", user.id)
      .then(({ data }) => {
        const map: Record<string, AccountProfile> = {};
        ((data || []) as unknown as AccountProfile[]).forEach((p) => {
          map[p.id] = p;
        });
        setProfileMap(map);
      });
  }, [user, isAdmin]);

  return { profileMap, isAdmin };
}
