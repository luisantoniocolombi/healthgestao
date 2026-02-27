import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import type { Profile } from "@/types";

const COLOR_OPTIONS = [
  "#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6",
  "#ec4899", "#06b6d4", "#f97316", "#6366f1", "#14b8a6",
];

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

interface Props {
  prof: Profile;
  onToggleActive: (id: string, ativo: boolean) => void;
  onUpdateProfile: (id: string, fields: Partial<Profile>) => void;
}

export function ProfessionalCard({ prof, onToggleActive, onUpdateProfile }: Props) {
  const [nome, setNome] = useState(prof.nome);
  const [cpf, setCpf] = useState(prof.cpf ? formatCpf(prof.cpf) : "");
  const [registro, setRegistro] = useState(prof.registro_profissional ?? "");
  const [cor, setCor] = useState(prof.cor_identificacao);

  const hasChanges =
    nome !== prof.nome ||
    cpf.replace(/\D/g, "") !== (prof.cpf ?? "") ||
    registro !== (prof.registro_profissional ?? "") ||
    cor !== prof.cor_identificacao;

  const handleSave = () => {
    onUpdateProfile(prof.id, {
      nome: nome.trim(),
      cpf: cpf.replace(/\D/g, "") || undefined,
      registro_profissional: registro.trim() || undefined,
      cor_identificacao: cor,
    });
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: cor }} />
      <CardHeader className="pb-3 pl-6">
        <div className="flex items-center justify-between">
          <Badge variant={prof.ativo ? "default" : "secondary"}>
            {prof.ativo ? "Ativo" : "Inativo"}
          </Badge>
          <Switch
            checked={prof.ativo}
            onCheckedChange={(checked) => onToggleActive(prof.id, checked)}
          />
        </div>
      </CardHeader>
      <CardContent className="pl-6 space-y-3">
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs">Nome</Label>
          <Input value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs">CPF</Label>
          <Input
            value={cpf}
            onChange={(e) => setCpf(formatCpf(e.target.value))}
            placeholder="000.000.000-00"
            maxLength={14}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs">Registro Profissional</Label>
          <Input
            value={registro}
            onChange={(e) => setRegistro(e.target.value)}
            placeholder="Ex: CRM 12345/SP"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs">Cor</Label>
          <div className="flex gap-1.5 flex-wrap">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                className={`h-6 w-6 rounded-full border-2 transition-all ${cor === c ? "border-foreground scale-110" : "border-transparent"}`}
                style={{ backgroundColor: c }}
                onClick={() => setCor(c)}
              />
            ))}
          </div>
        </div>
        {hasChanges && (
          <Button onClick={handleSave} size="sm" className="w-full">
            <Save className="h-4 w-4 mr-1" />
            Salvar
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
