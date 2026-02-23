import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Mic, UserPlus } from "lucide-react";

interface InvitationData {
  id: string;
  email: string;
  nome_profissional?: string;
  cor_identificacao?: string;
  expires_at: string;
  status: string;
}

export default function Signup() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(!!token);
  const [inviteError, setInviteError] = useState("");

  useEffect(() => {
    if (!token) {
      setLoadingInvite(false);
      return;
    }

    const fetchInvitation = async () => {
      const { data, error } = await (supabase.from("invitations" as any) as any)
        .select("*")
        .eq("token", token)
        .eq("status", "pendente")
        .maybeSingle();

      if (error || !data) {
        setInviteError("Convite não encontrado ou já utilizado.");
      } else if (new Date(data.expires_at) < new Date()) {
        setInviteError("Este convite expirou.");
      } else {
        setInvitation(data as InvitationData);
        setEmail(data.email);
      }
      setLoadingInvite(false);
    };

    fetchInvitation();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });

      if (signUpError) throw signUpError;

      if (token && signUpData.session) {
        const { error: acceptError } = await supabase.functions.invoke("accept-invitation", {
          body: { invite_token: token },
        });

        if (acceptError) {
          console.error("Accept invitation error:", acceptError);
          toast.error("Conta criada, mas houve um erro ao aceitar o convite. Contacte o administrador.");
        } else {
          toast.success("Conta criada e vinculada com sucesso!");
          navigate("/pacientes");
          return;
        }
      } else if (token && !signUpData.session) {
        toast.success("Conta criada! Verifique seu e-mail para confirmar e depois o convite será processado.");
      } else {
        toast.success("Conta criada! Verifique seu e-mail para confirmar.");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  if (loadingInvite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Verificando convite...</p>
      </div>
    );
  }

  if (token && inviteError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
              <UserPlus className="h-7 w-7 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-bold">Convite Inválido</CardTitle>
            <CardDescription>{inviteError}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" onClick={() => navigate("/login")}>
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <Mic className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">FonoGestão</CardTitle>
          <CardDescription>
            {invitation
              ? `Você foi convidado(a) como profissional${invitation.nome_profissional ? ` (${invitation.nome_profissional})` : ""}`
              : "Crie sua conta"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
                disabled={!!invitation}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Criando conta..." : "Criar conta"}
            </Button>

            <div className="text-center text-sm">
              <button
                type="button"
                className="text-muted-foreground hover:underline"
                onClick={() => navigate("/login")}
              >
                Já tem conta? Entrar
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
