import { useState, useEffect, forwardRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAccountProfiles } from "@/hooks/use-account-profiles";
import { Patient, Appointment, Receivable, Condition, ClinicalNote } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Edit, Save, Plus, FileText, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const PatientDetail = forwardRef<HTMLDivElement, object>(function PatientDetail(_props, ref) {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin } = useAuth();
  const { profileMap } = useAccountProfiles();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Patient>>({});
  const [loading, setLoading] = useState(true);

  const [conditions, setConditions] = useState<Condition[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [clinicalNotes, setClinicalNotes] = useState<ClinicalNote[]>([]);

  const [conditionDialog, setConditionDialog] = useState(false);
  const [noteDialog, setNoteDialog] = useState(false);
  const [receivableDialog, setReceivableDialog] = useState(false);
  const [newCondition, setNewCondition] = useState({ nome_condicao: "", data_inicio: "", observacao: "" });
  const [newNote, setNewNote] = useState({ data_nota: format(new Date(), "yyyy-MM-dd"), texto_nota: "" });
  const [newReceivable, setNewReceivable] = useState({ data_cobranca: format(new Date(), "yyyy-MM-dd"), valor: "", forma_pagamento: "", observacao: "" });

  const [financeMonth, setFinanceMonth] = useState(format(new Date(), "yyyy-MM"));
  const [evoStart, setEvoStart] = useState("");
  const [evoEnd, setEvoEnd] = useState("");

  const fetchAll = async () => {
    if (!user || !id) return;
    try {
      const [patientRes, condRes, apptRes, recRes, noteRes] = await Promise.all([
        supabase.from("patients").select("*").eq("id", id).maybeSingle(),
        supabase.from("conditions").select("*").eq("patient_id", id).eq("archived", false).order("data_inicio", { ascending: false }),
        supabase.from("appointments").select("*").eq("patient_id", id).eq("archived", false).order("data_atendimento", { ascending: false }),
        supabase.from("receivables").select("*").eq("patient_id", id).eq("archived", false).order("data_cobranca", { ascending: false }),
        supabase.from("clinical_notes").select("*").eq("patient_id", id).eq("archived", false).order("data_nota", { ascending: false }),
      ]);

      if (patientRes.error) {
        console.error("Erro ao carregar paciente:", patientRes.error);
        toast.error("Erro ao carregar paciente");
        setLoading(false);
        return;
      }

      if (patientRes.data) {
        const p = patientRes.data as Patient;
        setPatient(p);
        setForm(p);
      }
      if (condRes.error) console.error("Erro condições:", condRes.error);
      if (apptRes.error) console.error("Erro atendimentos:", apptRes.error);
      if (recRes.error) console.error("Erro recebíveis:", recRes.error);
      if (noteRes.error) console.error("Erro notas:", noteRes.error);
      setConditions((condRes.data || []) as Condition[]);
      setAppointments((apptRes.data || []) as Appointment[]);
      setReceivables((recRes.data || []) as Receivable[]);
      setClinicalNotes((noteRes.data || []) as ClinicalNote[]);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      toast.error("Erro ao carregar dados do paciente");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [user, id]);

  const handleSave = async () => {
    if (!id || !user) return;
    const { nome_completo, telefone, responsavel_nome, endereco, doenca_principal, status, observacoes_gerais, convenio, user_id, cpf, data_nascimento } = form;
    const updateData: any = { nome_completo, telefone, responsavel_nome, endereco, doenca_principal, status, observacoes_gerais, convenio, cpf: cpf || null, data_nascimento: data_nascimento || null, updated_by: user.id };
    if (isAdmin && user_id) updateData.user_id = user_id;
    const { error } = await supabase
      .from("patients")
      .update(updateData)
      .eq("id", id);
    if (error) { toast.error("Erro ao salvar"); return; }
    toast.success("Paciente atualizado!");
    setEditing(false);
    fetchAll();
  };

  const handleArchive = async () => {
    if (!id) return;
    const { error } = await supabase.from("patients").update({ archived: true }).eq("id", id);
    if (error) { toast.error("Erro ao arquivar"); return; }
    toast.success("Paciente arquivado");
    navigate("/pacientes");
  };

  const addCondition = async () => {
    if (!user || !id) return;
    const { error } = await supabase.from("conditions").insert({
      ...newCondition,
      patient_id: id,
      user_id: user.id,
      data_inicio: newCondition.data_inicio || null,
    });
    if (error) { toast.error("Erro"); return; }
    toast.success("Condição adicionada");
    setConditionDialog(false);
    setNewCondition({ nome_condicao: "", data_inicio: "", observacao: "" });
    fetchAll();
  };

  const addNote = async () => {
    if (!user || !id) return;
    const { error } = await supabase.from("clinical_notes").insert({
      ...newNote,
      patient_id: id,
      user_id: user.id,
    });
    if (error) { toast.error("Erro"); return; }
    toast.success("Nota adicionada");
    setNoteDialog(false);
    setNewNote({ data_nota: format(new Date(), "yyyy-MM-dd"), texto_nota: "" });
    fetchAll();
  };

  const addReceivable = async () => {
    if (!user || !id) return;
    if (!newReceivable.valor) { toast.error("Informe o valor"); return; }
    const { error } = await supabase.from("receivables").insert({
      patient_id: id,
      user_id: user.id,
      data_cobranca: newReceivable.data_cobranca,
      valor: parseFloat(newReceivable.valor),
      forma_pagamento: newReceivable.forma_pagamento || null,
      observacao: newReceivable.observacao || null,
      origem: "manual",
      created_by: user.id,
      updated_by: user.id,
    });
    if (error) { toast.error("Erro ao criar recebível"); return; }
    toast.success("Recebível criado");
    setReceivableDialog(false);
    setNewReceivable({ data_cobranca: format(new Date(), "yyyy-MM-dd"), valor: "", forma_pagamento: "", observacao: "" });
    fetchAll();
  };

  const markAsPaid = async (recId: string) => {
    const { error } = await supabase.from("receivables").update({
      status_pagamento: "pago",
      data_pagamento: format(new Date(), "yyyy-MM-dd"),
    }).eq("id", recId);
    if (error) { toast.error("Erro"); return; }
    toast.success("Marcado como pago");
    fetchAll();
  };

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  if (loading) return <div ref={ref} className="text-center py-12 text-muted-foreground">Carregando...</div>;
  if (!patient) return <div ref={ref} className="text-center py-12">Paciente não encontrado</div>;

  const filteredReceivables = receivables.filter(r => r.data_cobranca.startsWith(financeMonth));
  const totalPago = filteredReceivables.filter(r => r.status_pagamento === "pago").reduce((s, r) => s + Number(r.valor), 0);
  const totalPendente = filteredReceivables.filter(r => r.status_pagamento === "pendente").reduce((s, r) => s + Number(r.valor), 0);

  const allEvoItems = [
    ...appointments.map(a => ({ type: "appointment" as const, date: a.data_atendimento, data: a })),
    ...clinicalNotes.map(n => ({ type: "note" as const, date: n.data_nota, data: n })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredEvoItems = allEvoItems.filter(item => {
    if (evoStart && item.date < evoStart) return false;
    if (evoEnd && item.date > evoEnd) return false;
    return true;
  });

  const exportEvoPDF = () => {
    const items = filteredEvoItems;
    if (items.length === 0) { toast.error("Nenhum registro para exportar"); return; }

    const periodoText = evoStart || evoEnd
      ? `Período: ${evoStart ? format(new Date(evoStart + "T00:00:00"), "dd/MM/yyyy") : "início"} a ${evoEnd ? format(new Date(evoEnd + "T00:00:00"), "dd/MM/yyyy") : "hoje"}`
      : "Período: Todos";

    const rows = items.map(item => {
      const dateStr = format(new Date(item.date + "T00:00:00"), "dd/MM/yyyy");
      const tipo = item.type === "appointment" ? "Atendimento" : "Nota Clínica";
      const texto = item.type === "appointment"
        ? (item.data as Appointment).texto_prontuario || "Sem prontuário"
        : (item.data as ClinicalNote).texto_nota;
      return `<tr><td style="padding:8px;border:1px solid #ddd;">${dateStr}</td><td style="padding:8px;border:1px solid #ddd;">${tipo}</td><td style="padding:8px;border:1px solid #ddd;white-space:pre-wrap;">${texto}</td></tr>`;
    }).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Evolução - ${patient.nome_completo}</title><style>body{font-family:Arial,sans-serif;padding:20px}h1{font-size:18px}h2{font-size:14px;color:#666}table{width:100%;border-collapse:collapse;margin-top:16px}th{background:#f5f5f5;padding:8px;border:1px solid #ddd;text-align:left}@media print{button{display:none}}</style></head><body><h1>Evolução Clínica - ${patient.nome_completo}</h1><h2>${periodoText}</h2><table><thead><tr><th>Data</th><th>Tipo</th><th>Conteúdo</th></tr></thead><tbody>${rows}</tbody></table><br><button onclick="window.print()">Imprimir / Salvar PDF</button></body></html>`;

    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); }
  };

  return (
    <div ref={ref} className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/pacientes")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground flex-1">{patient.nome_completo}</h1>
        <Badge variant={patient.status === "ativo" ? "default" : "secondary"}>
          {patient.status}
        </Badge>
      </div>

      <Tabs defaultValue="dados">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="condicoes">Condições</TabsTrigger>
          <TabsTrigger value="evolucao">Evolução</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
        </TabsList>

        {/* ABA 1 - DADOS */}
        <TabsContent value="dados">
          <Card>
            <CardContent className="pt-6 space-y-4">
              {(isAdmin || patient.user_id === user?.id) && (
                <div className="flex justify-end gap-2">
                  {editing ? (
                    <>
                      <Button size="sm" onClick={handleSave}><Save className="h-4 w-4 mr-1" />Salvar</Button>
                      <Button size="sm" variant="outline" onClick={() => { setEditing(false); setForm(patient); }}>Cancelar</Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setEditing(true)}><Edit className="h-4 w-4 mr-1" />Editar</Button>
                      <Button size="sm" variant="destructive" onClick={handleArchive}><Trash2 className="h-4 w-4 mr-1" />Arquivar</Button>
                    </>
                  )}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Nome Completo</Label>
                  <Input value={form.nome_completo || ""} onChange={(e) => update("nome_completo", e.target.value)} disabled={!editing} />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input value={form.telefone || ""} onChange={(e) => update("telefone", e.target.value)} disabled={!editing} />
                </div>
                <div className="space-y-2">
                  <Label>CPF</Label>
                  <Input
                    value={form.cpf || ""}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, "").slice(0, 11);
                      const masked = raw
                        .replace(/(\d{3})(\d)/, "$1.$2")
                        .replace(/(\d{3})(\d)/, "$1.$2")
                        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
                      update("cpf", masked);
                    }}
                    disabled={!editing}
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data de Nascimento</Label>
                  <Input type="date" value={form.data_nascimento || ""} onChange={(e) => update("data_nascimento", e.target.value)} disabled={!editing} />
                </div>
                <div className="space-y-2">
                  <Label>Responsável</Label>
                  <Input value={form.responsavel_nome || ""} onChange={(e) => update("responsavel_nome", e.target.value)} disabled={!editing} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Endereço</Label>
                  <Input value={form.endereco || ""} onChange={(e) => update("endereco", e.target.value)} disabled={!editing} />
                </div>
                <div className="space-y-2">
                  <Label>Doença Principal</Label>
                  <Input value={form.doenca_principal || ""} onChange={(e) => update("doenca_principal", e.target.value)} disabled={!editing} />
                </div>
                <div className="space-y-2">
                  <Label>Convênio</Label>
                  <Select value={form.convenio || ""} onValueChange={(v) => update("convenio", v)} disabled={!editing}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="particular">Particular</SelectItem>
                      <SelectItem value="unimed">Unimed</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => update("status", v)} disabled={!editing}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Observações</Label>
                  <Textarea value={form.observacoes_gerais || ""} onChange={(e) => update("observacoes_gerais", e.target.value)} disabled={!editing} rows={3} />
                </div>
                {isAdmin && Object.keys(profileMap).length > 0 && (
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Profissional Responsável</Label>
                    <Select value={form.user_id || ""} onValueChange={(v) => update("user_id", v)} disabled={!editing}>
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        {Object.values(profileMap).map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 2 - CONDIÇÕES */}
        <TabsContent value="condicoes">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Condições Clínicas</h3>
                <Dialog open={conditionDialog} onOpenChange={setConditionDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="h-4 w-4 mr-1" />Nova Condição</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Nova Condição</DialogTitle><DialogDescription>Adicione uma condição clínica ao paciente.</DialogDescription></DialogHeader>
                    <div className="space-y-3">
                      <div><Label>Nome *</Label><Input value={newCondition.nome_condicao} onChange={(e) => setNewCondition(p => ({ ...p, nome_condicao: e.target.value }))} /></div>
                      <div><Label>Data Início</Label><Input type="date" value={newCondition.data_inicio} onChange={(e) => setNewCondition(p => ({ ...p, data_inicio: e.target.value }))} /></div>
                      <div><Label>Observação</Label><Textarea value={newCondition.observacao} onChange={(e) => setNewCondition(p => ({ ...p, observacao: e.target.value }))} /></div>
                      <Button onClick={addCondition}>Salvar</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              {conditions.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhuma condição registrada</p>
              ) : (
                <div className="space-y-2">
                  {conditions.map((c) => (
                    <div key={c.id} className="p-3 border rounded-lg">
                      <p className="font-medium">{c.nome_condicao}</p>
                      {c.data_inicio && <p className="text-xs text-muted-foreground">Início: {format(new Date(c.data_inicio + "T00:00:00"), "dd/MM/yyyy")}</p>}
                      {c.observacao && <p className="text-sm text-muted-foreground mt-1">{c.observacao}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 3 - EVOLUÇÃO */}
        <TabsContent value="evolucao">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h3 className="font-semibold">Evolução Clínica</h3>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" onClick={exportEvoPDF}>
                    <Download className="h-4 w-4 mr-1" />Exportar PDF
                  </Button>
                  <Dialog open={noteDialog} onOpenChange={setNoteDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" />Nota Avulsa</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Nova Nota Clínica</DialogTitle><DialogDescription>Registre uma nova nota clínica para o paciente.</DialogDescription></DialogHeader>
                      <div className="space-y-3">
                        <div><Label>Data *</Label><Input type="date" value={newNote.data_nota} onChange={(e) => setNewNote(p => ({ ...p, data_nota: e.target.value }))} /></div>
                        <div><Label>Texto *</Label><Textarea value={newNote.texto_nota} onChange={(e) => setNewNote(p => ({ ...p, texto_nota: e.target.value }))} rows={4} /></div>
                        <Button onClick={addNote}>Salvar</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Date filters */}
              <div className="flex gap-3 flex-wrap">
                <div className="space-y-1">
                  <Label className="text-xs">De</Label>
                  <Input type="date" value={evoStart} onChange={(e) => setEvoStart(e.target.value)} className="w-auto" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Até</Label>
                  <Input type="date" value={evoEnd} onChange={(e) => setEvoEnd(e.target.value)} className="w-auto" />
                </div>
                {(evoStart || evoEnd) && (
                  <Button size="sm" variant="ghost" className="self-end" onClick={() => { setEvoStart(""); setEvoEnd(""); }}>Limpar</Button>
                )}
              </div>

              {/* Timeline */}
              <div className="space-y-3">
                {filteredEvoItems.length === 0 && (
                  <p className="text-muted-foreground text-sm">Nenhum registro de evolução</p>
                )}

                {filteredEvoItems.map((item) => (
                  <div key={item.data.id} className="p-3 border rounded-lg border-l-4"
                    style={{ borderLeftColor: item.type === "appointment" ? "hsl(var(--primary))" : "hsl(var(--accent))" }}>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={item.type === "appointment" ? "default" : "secondary"}>
                        {item.type === "appointment" ? "Atendimento" : "Nota"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(item.date + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-sm line-clamp-3">
                      {item.type === "appointment"
                        ? (item.data as Appointment).texto_prontuario || "Sem prontuário"
                        : (item.data as ClinicalNote).texto_nota}
                    </p>
                    {item.type === "appointment" && (
                      <Button
                        size="sm"
                        variant="link"
                        className="p-0 h-auto mt-1"
                        onClick={() => navigate(`/atendimentos/${item.data.id}`)}
                      >
                        <FileText className="h-3 w-3 mr-1" /> Abrir atendimento
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 4 - FINANCEIRO */}
        <TabsContent value="financeiro">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Label className="text-sm font-medium">Mês:</Label>
              <Input type="month" value={financeMonth} onChange={(e) => setFinanceMonth(e.target.value)} className="w-auto" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Atendimentos</p><p className="text-2xl font-bold">{appointments.length}</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Pendente</p><p className="text-2xl font-bold text-orange-500">R$ {totalPendente.toFixed(2)}</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Pago</p><p className="text-2xl font-bold text-green-600">R$ {totalPago.toFixed(2)}</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Saldo</p><p className="text-2xl font-bold">R$ {(totalPendente).toFixed(2)}</p></CardContent></Card>
            </div>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Recebíveis</h3>
                  <Dialog open={receivableDialog} onOpenChange={setReceivableDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Recebível</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Novo Recebível</DialogTitle></DialogHeader>
                      <DialogDescription className="sr-only">Preencha os dados do novo recebível</DialogDescription>
                      <div className="space-y-3">
                        <div><Label>Data Cobrança *</Label><Input type="date" value={newReceivable.data_cobranca} onChange={(e) => setNewReceivable(p => ({ ...p, data_cobranca: e.target.value }))} /></div>
                        <div><Label>Valor (R$) *</Label><Input type="number" step="0.01" value={newReceivable.valor} onChange={(e) => setNewReceivable(p => ({ ...p, valor: e.target.value }))} /></div>
                        <div>
                          <Label>Forma de Pagamento</Label>
                          <Select value={newReceivable.forma_pagamento} onValueChange={(v) => setNewReceivable(p => ({ ...p, forma_pagamento: v }))}>
                            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="dinheiro">Dinheiro</SelectItem>
                              <SelectItem value="pix">PIX</SelectItem>
                              <SelectItem value="cartao_credito">Cartão Crédito</SelectItem>
                              <SelectItem value="cartao_debito">Cartão Débito</SelectItem>
                              <SelectItem value="transferencia">Transferência</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div><Label>Observação</Label><Input value={newReceivable.observacao} onChange={(e) => setNewReceivable(p => ({ ...p, observacao: e.target.value }))} /></div>
                        <Button onClick={addReceivable}>Salvar</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                {filteredReceivables.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Nenhum recebível neste mês</p>
                ) : (
                  <div className="space-y-2">
                    {filteredReceivables.map((r) => (
                      <div key={r.id} className="p-3 border rounded-lg flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">R$ {Number(r.valor).toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(r.data_cobranca + "T00:00:00"), "dd/MM/yyyy")}
                            {(r as any).gerar_nfe && <Badge variant="outline" className="ml-2 text-[10px]">NFe</Badge>}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={r.status_pagamento === "pago" ? "default" : r.status_pagamento === "pendente" ? "secondary" : "destructive"}>
                            {r.status_pagamento}
                          </Badge>
                          {r.status_pagamento === "pendente" && (
                            <Button size="sm" variant="outline" onClick={() => markAsPaid(r.id)}>Pagar</Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
});

export default PatientDetail;
