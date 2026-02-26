import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Brain, UserPlus, LogIn } from "lucide-react";

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
  const [isLoginMode, setIsLoginMode] = useState(false);
  const autoAcceptAttempted = useRef(false);

  // Fetch invitation data
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

  // Auto-accept invitation when returning from email confirmation with active session
  useEffect(() => {
    if (!token || !invitation || autoAcceptAttempted.current) return;

    const checkSessionAndAccept = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      autoAcceptAttempted.current = true;
      toast.loading("Processando convite...");

      try {
        const { error } = await supabase.functions.invoke("accept-invitation", {
          body: { invite_token: token },
        });

        if (error) {
          // Try to extract server message
          let message = "Erro ao aceitar convite. Contacte o administrador.";
          if (error.context && typeof error.context.json === "function") {
            try {
              const body = await error.context.json();
              if (body?.error) message = body.error;
            } catch {}
          }
          toast.dismiss();
          toast.error(message);
        } else {
          toast.dismiss();
          toast.success("Convite aceito com sucesso! Bem-vindo(a)!");
          navigate("/pacientes");
        }
      } catch {
        toast.dismiss();
        toast.error("Erro ao processar convite.");
      }
    };

    checkSessionAndAccept();
  }, [token, invitation, navigate]);

  const acceptInvitation = async () => {
    const { error } = await supabase.functions.invoke("accept-invitation", {
      body: { invite_token: token },
    });

    if (error) {
      let message = "Conta criada, mas houve um erro ao aceitar o convite. Contacte o administrador.";
      if (error.context && typeof error.context.json === "function") {
        try {
          const body = await error.context.json();
          if (body?.error) message = body.error;
        } catch {}
      }
      toast.error(message);
    } else {
      toast.success("Convite aceito com sucesso! Bem-vindo(a)!");
      navigate("/pacientes");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLoginMode) {
        // Login mode: sign in and accept invitation
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        if (token) {
          await acceptInvitation();
        } else {
          toast.success("Login realizado com sucesso!");
          navigate("/pacientes");
        }
        return;
      }

      // Signup mode
      const redirectUrl = token
        ? `https://healthgestao.lovable.app/signup?token=${token}`
        : "https://healthgestao.lovable.app";

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectUrl },
      });

      if (signUpError) throw signUpError;

      // Detect repeated signup (user already exists)
      if (
        signUpData.user &&
        (!signUpData.user.identities || signUpData.user.identities.length === 0)
      ) {
        toast.info("Este e-mail já está cadastrado. Faça login para aceitar o convite.");
        setIsLoginMode(true);
        return;
      }

      if (token && signUpData.session) {
        // Email confirmation disabled: session available immediately
        await acceptInvitation();
        return;
      } else if (token && !signUpData.session) {
        toast.success(
          "Conta criada! Verifique seu e-mail para confirmar. Ao confirmar, o convite será processado automaticamente."
        );
      } else {
        toast.success("Conta criada! Verifique seu e-mail para confirmar.");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao processar");
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
            {isLoginMode ? (
              <LogIn className="h-7 w-7 text-primary-foreground" />
            ) : (
              <Brain className="h-7 w-7 text-primary-foreground" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold">Health Gestão</CardTitle>
          <CardDescription>
            {invitation
              ? isLoginMode
                ? `Faça login para aceitar o convite${invitation.nome_profissional ? ` como ${invitation.nome_profissional}` : ""}`
                : `Você foi convidado(a) como profissional${invitation.nome_profissional ? ` (${invitation.nome_profissional})` : ""}`
              : isLoginMode
                ? "Faça login na sua conta"
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
                placeholder={isLoginMode ? "Sua senha" : "Mínimo 6 caracteres"}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? isLoginMode
                  ? "Entrando..."
                  : "Criando conta..."
                : isLoginMode
                  ? "Entrar"
                  : "Criar conta"}
            </Button>

            <div className="text-center text-sm space-y-1">
              {token && (
                <button
                  type="button"
                  className="text-primary hover:underline block w-full"
                  onClick={() => setIsLoginMode(!isLoginMode)}
                >
                  {isLoginMode
                    ? "Não tem conta? Criar conta"
                    : "Já tem conta? Fazer login"}
                </button>
              )}
              <button
                type="button"
                className="text-muted-foreground hover:underline"
                onClick={() => navigate("/login")}
              >
                Ir para a página de login
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
