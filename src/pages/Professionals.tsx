import { useState, forwardRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Copy, Check, Users, Save } from "lucide-react";
import type { Profile } from "@/types";

const COLOR_OPTIONS = [
  "#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6",
  "#ec4899", "#06b6d4", "#f97316", "#6366f1", "#14b8a6",
];

function cpfMask(value: string) {
  const raw = value.replace(/\D/g, "").slice(0, 11);
  return raw
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function ProfessionalCard({ prof, onUpdate }: { prof: Profile; onUpdate: () => void }) {
  const { toast } = useToast();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [fieldValues, setFieldValues] = useState({
    nome: prof.nome,
    email: prof.email || "",
    cpf: prof.cpf || "",
    registro_profissional: prof.registro_profissional || "",
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      const { error } = await supabase
        .from("profiles" as any)
        .update(updates as any)
        .eq("id", prof.id);
      if (error) throw error;
    },
    onSuccess: () => {
      onUpdate();
      toast({ title: "Perfil atualizado" });
      setEditingField(null);
    },
    onError: () => {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async (ativo: boolean) => {
      const { error } = await supabase
        .from("profiles" as any)
        .update({ ativo } as any)
        .eq("id", prof.id);
      if (error) throw error;
    },
    onSuccess: () => {
      onUpdate();
      toast({ title: "Status atualizado" });
    },
  });

  const saveField = (field: string) => {
    const value = (fieldValues as any)[field];
    updateProfile.mutate({ [field]: value || null });
  };

  const renderEditableField = (label: string, field: string, placeholder: string, mask?: (v: string) => string) => {
    const isEditing = editingField === field;
    const value = (fieldValues as any)[field];
    return (
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <div className="flex items-center gap-1.5">
          {isEditing ? (
            <>
              <Input
                value={value}
                onChange={(e) => {
                  const v = mask ? mask(e.target.value) : e.target.value;
                  setFieldValues(prev => ({ ...prev, [field]: v }));
                }}
                placeholder={placeholder}
                className="h-8 text-sm"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") saveField(field); if (e.key === "Escape") setEditingField(null); }}
              />
              <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => saveField(field)} disabled={updateProfile.isPending}>
                <Save className="h-3.5 w-3.5" />
              </Button>
            </>
          ) : (
            <button
              type="button"
              className="text-sm text-left w-full px-2 py-1 rounded hover:bg-muted/50 transition-colors truncate"
              onClick={() => setEditingField(field)}
            >
              {value || <span className="text-muted-foreground italic">{placeholder}</span>}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: prof.cor_identificacao }} />
      <CardHeader className="pb-2 pl-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{prof.nome}</CardTitle>
          <Badge variant={prof.ativo ? "default" : "secondary"}>
            {prof.ativo ? "Ativo" : "Inativo"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pl-6 space-y-3">
        {renderEditableField("Nome", "nome", "Nome do profissional")}
        {renderEditableField("Email", "email", "email@exemplo.com")}
        {renderEditableField("CPF", "cpf", "000.000.000-00", cpfMask)}
        {renderEditableField("Registro Profissional", "registro_profissional", "Ex: CRF-A 12345")}

        <div className="flex items-center justify-between pt-2">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Switch
            checked={prof.ativo}
            onCheckedChange={(checked) => toggleActive.mutate(checked)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Cor</Label>
          <div className="flex gap-1.5 flex-wrap">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                className={`h-6 w-6 rounded-full border-2 transition-all ${prof.cor_identificacao === c ? "border-foreground scale-110" : "border-transparent"}`}
                style={{ backgroundColor: c }}
                onClick={() => updateProfile.mutate({ cor_identificacao: c })}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const Professionals = forwardRef<HTMLDivElement, object>(function Professionals(_props, ref) {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cor, setCor] = useState(COLOR_OPTIONS[0]);
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);

  const { data: professionals = [], isLoading } = useQuery({
    queryKey: ["professionals", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("profiles" as any)
        .select("*")
        .eq("conta_principal_id", user.id)
        .neq("id", user.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Profile[];
    },
    enabled: !!user && isAdmin,
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");
      const res = await supabase.functions.invoke("invite-professional", {
        body: { email, nome, cor_identificacao: cor, origin: "https://healthgestao.lovable.app" },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.error) throw res.error;
      return res.data as { invite_link: string };
    },
    onSuccess: (data) => {
      setInviteLink(data.invite_link);
      queryClient.invalidateQueries({ queryKey: ["professionals"] });
      toast({ title: "Convite criado com sucesso!" });
    },
    onError: async (err: any) => {
      let message = err.message || "Erro desconhecido";
      if (err.context && typeof err.context.json === "function") {
        try {
          const body = await err.context.json();
          if (body?.error) message = body.error;
        } catch {}
      }
      toast({ title: "Erro ao convidar", description: message, variant: "destructive" });
    },
  });

  const handleInvite = () => {
    if (!email.trim()) {
      toast({ title: "Informe o email", variant: "destructive" });
      return;
    }
    setInviteLink("");
    setCopied(false);
    inviteMutation.mutate();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetDialog = () => {
    setNome("");
    setEmail("");
    setCor(COLOR_OPTIONS[0]);
    setInviteLink("");
    setCopied(false);
  };

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["professionals"] });

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Acesso restrito a administradores.</p>
      </div>
    );
  }

  return (
    <div ref={ref} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profissionais</h1>
          <p className="text-muted-foreground">Gerencie os profissionais da sua clínica</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetDialog(); }}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Convidar Profissional
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Convidar Profissional</DialogTitle>
              <DialogDescription>Preencha os dados abaixo para gerar um link de convite.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do profissional" />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" />
              </div>
              <div className="space-y-2">
                <Label>Cor de identificação</Label>
                <div className="flex gap-2 flex-wrap">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`h-8 w-8 rounded-full border-2 transition-all ${cor === c ? "border-foreground scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setCor(c)}
                    />
                  ))}
                </div>
              </div>

              {inviteLink ? (
                <div className="space-y-2">
                  <Label>Link do convite</Label>
                  <div className="flex gap-2">
                    <Input value={inviteLink} readOnly className="text-xs" />
                    <Button variant="outline" size="icon" onClick={handleCopy}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Válido por 7 dias. Envie este link ao profissional.</p>
                </div>
              ) : (
                <Button onClick={handleInvite} disabled={inviteMutation.isPending} className="w-full">
                  {inviteMutation.isPending ? "Enviando..." : "Gerar Convite"}
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : professionals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Nenhum profissional vinculado.</p>
            <p className="text-sm text-muted-foreground">Clique em "Convidar Profissional" para começar.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {professionals.map((prof) => (
            <ProfessionalCard key={prof.id} prof={prof} onUpdate={invalidate} />
          ))}
        </div>
      )}
    </div>
  );
});

export default Professionals;
