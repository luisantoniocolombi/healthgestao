import { useState, forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAccountProfiles } from "@/hooks/use-account-profiles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const PatientForm = forwardRef<HTMLDivElement, object>(function PatientForm(_props, ref) {
  const { user, isAdmin } = useAuth();
  const { profileMap } = useAccountProfiles();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState("");
  const [form, setForm] = useState({
    nome_completo: "",
    telefone: "",
    endereco: "",
    responsavel_nome: "",
    doenca_principal: "",
    observacoes_gerais: "",
    convenio: "",
    cpf: "",
    data_nascimento: "",
    status: "ativo",
    gerar_nfe: false as boolean,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const targetUserId = isAdmin && selectedProfessional ? selectedProfessional : user.id;
    const insertData: any = {
      ...form,
      cpf: form.cpf || null,
      data_nascimento: form.data_nascimento || null,
      user_id: targetUserId,
      created_by: user.id,
      updated_by: user.id,
    };
    const { error } = await supabase.from("patients").insert(insertData);

    if (error) {
      toast.error("Erro ao salvar paciente");
    } else {
      toast.success("Paciente cadastrado!");
      navigate("/pacientes");
    }
    setLoading(false);
  };

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div ref={ref} className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/pacientes")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Novo Paciente</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  value={form.nome_completo}
                  onChange={(e) => update("nome_completo", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone *</Label>
                <Input
                  id="telefone"
                  value={form.telefone}
                  onChange={(e) => update("telefone", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={form.cpf}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "").slice(0, 11);
                    const masked = raw
                      .replace(/(\d{3})(\d)/, "$1.$2")
                      .replace(/(\d{3})(\d)/, "$1.$2")
                      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
                    update("cpf", masked);
                  }}
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nascimento">Data de Nascimento</Label>
                <Input
                  id="nascimento"
                  type="date"
                  value={form.data_nascimento}
                  onChange={(e) => update("data_nascimento", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="responsavel">Responsável</Label>
                <Input
                  id="responsavel"
                  value={form.responsavel_nome}
                  onChange={(e) => update("responsavel_nome", e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={form.endereco}
                  onChange={(e) => update("endereco", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doenca">Doença Principal</Label>
                <Input
                  id="doenca"
                  value={form.doenca_principal}
                  onChange={(e) => update("doenca_principal", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="convenio">Convênio</Label>
                <Select value={form.convenio} onValueChange={(v) => update("convenio", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="particular">Particular</SelectItem>
                    <SelectItem value="unimed">Unimed</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 sm:col-span-2">
                <Checkbox
                  id="gerar_nfe"
                  checked={form.gerar_nfe}
                  onCheckedChange={(checked) => setForm((prev) => ({ ...prev, gerar_nfe: !!checked }))}
                />
                <Label htmlFor="gerar_nfe">Gerar NFe</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={form.status} onValueChange={(v) => update("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {isAdmin && Object.keys(profileMap).length > 0 && (
                <div className="space-y-2">
                  <Label>Profissional Responsável</Label>
                  <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
                    <SelectTrigger><SelectValue placeholder="Eu mesmo (admin)" /></SelectTrigger>
                    <SelectContent>
                      {Object.values(profileMap).map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="obs">Observações Gerais</Label>
                <Textarea
                  id="obs"
                  value={form.observacoes_gerais}
                  onChange={(e) => update("observacoes_gerais", e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Salvar"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/pacientes")}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
});

export default PatientForm;
