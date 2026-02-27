import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAccountProfiles } from "@/hooks/use-account-profiles";
import { Patient, Receivable } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DollarSign, Plus, Search, Check, X, Edit } from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Financial() {
  const { user } = useAuth();
  const { profileMap, isAdmin } = useAccountProfiles();
  const navigate = useNavigate();
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("todos");
  const [nfeFilter, setNfeFilter] = useState("todos");
  const [search, setSearch] = useState("");
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), "yyyy-MM"));

  // New receivable dialog
  const [newDialog, setNewDialog] = useState(false);
  const [newForm, setNewForm] = useState({
    patient_id: "",
    data_cobranca: format(new Date(), "yyyy-MM-dd"),
    valor: "",
    forma_pagamento: "",
    observacao: "",
  });

  const fetchData = async () => {
    if (!user) return;
    const [year, month] = currentMonth.split("-").map(Number);
    const start = format(new Date(year, month - 1, 1), "yyyy-MM-dd");
    const end = format(endOfMonth(new Date(year, month - 1, 1)), "yyyy-MM-dd");

    const recQuery = supabase.from("receivables").select("*, patients(nome_completo)")
        .eq("archived", false)
        .gte("data_cobranca", start).lte("data_cobranca", end)
        .order("data_cobranca", { ascending: false });

    const patQuery = supabase.from("patients").select("id, nome_completo")
        .eq("archived", false).order("nome_completo");

    if (!isAdmin) {
      recQuery.eq("user_id", user.id);
      patQuery.eq("user_id", user.id);
    }

    try {
      const [recRes, patRes] = await Promise.all([recQuery, patQuery]);
      setReceivables((recRes.data || []) as Receivable[]);
      setPatients((patRes.data || []) as Patient[]);
    } catch (err) {
      console.error("Erro ao carregar financeiro:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user, currentMonth, isAdmin]);

  const filtered = receivables.filter(r => {
    if (statusFilter !== "todos" && r.status_pagamento !== statusFilter) return false;
    if (nfeFilter === "nfe" && !(r as any).gerar_nfe) return false;
    if (nfeFilter === "sem_nfe" && (r as any).gerar_nfe) return false;
    if (search) {
      const name = (r as any).patients?.nome_completo?.toLowerCase() || "";
      if (!name.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const totalReceber = filtered.filter(r => r.status_pagamento === "pendente").reduce((s, r) => s + Number(r.valor), 0);
  const totalRecebido = filtered.filter(r => r.status_pagamento === "pago").reduce((s, r) => s + Number(r.valor), 0);
  const totalCancelado = filtered.filter(r => r.status_pagamento === "cancelado").reduce((s, r) => s + Number(r.valor), 0);
  const ticketMedio = filtered.length > 0 ? (totalReceber + totalRecebido) / filtered.filter(r => r.status_pagamento !== "cancelado").length : 0;
  const totalNfe = filtered.filter(r => (r as any).gerar_nfe && r.status_pagamento !== "cancelado").reduce((s, r) => s + Number(r.valor), 0);
  const countNfe = filtered.filter(r => (r as any).gerar_nfe && r.status_pagamento !== "cancelado").length;

  const markAsPaid = async (id: string) => {
    const { error } = await supabase.from("receivables").update({
      status_pagamento: "pago",
      data_pagamento: format(new Date(), "yyyy-MM-dd"),
    }).eq("id", id);
    if (error) { toast.error("Erro"); return; }
    toast.success("Marcado como pago");
    fetchData();
  };

  const cancelReceivable = async (id: string) => {
    const { error } = await supabase.from("receivables").update({
      status_pagamento: "cancelado",
    }).eq("id", id);
    if (error) { toast.error("Erro"); return; }
    toast.success("Cancelado");
    fetchData();
  };

  const createReceivable = async () => {
    if (!user) return;
    const { error } = await supabase.from("receivables").insert({
      user_id: user.id,
      patient_id: newForm.patient_id,
      data_cobranca: newForm.data_cobranca,
      valor: parseFloat(newForm.valor),
      forma_pagamento: newForm.forma_pagamento || null,
      observacao: newForm.observacao || null,
      origem: "manual",
      created_by: user.id,
      updated_by: user.id,
    });
    if (error) { toast.error("Erro ao criar recebível"); return; }
    toast.success("Recebível criado!");
    setNewDialog(false);
    setNewForm({ patient_id: "", data_cobranca: format(new Date(), "yyyy-MM-dd"), valor: "", forma_pagamento: "", observacao: "" });
    fetchData();
  };

  const exportCSV = () => {
    const header = "Paciente,Data,Valor,Status,Forma Pagamento,Observação\n";
    const rows = filtered.map(r =>
      `"${(r as any).patients?.nome_completo || ""}","${r.data_cobranca}","${r.valor}","${r.status_pagamento}","${r.forma_pagamento || ""}","${r.observacao || ""}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financeiro-${currentMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado!");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}>Exportar CSV</Button>
          <Dialog open={newDialog} onOpenChange={setNewDialog}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Novo Recebível</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo Recebível</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Paciente *</Label>
                  <Select value={newForm.patient_id} onValueChange={(v) => setNewForm(p => ({ ...p, patient_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {patients.map(p => <SelectItem key={p.id} value={p.id}>{p.nome_completo}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Data *</Label>
                    <Input type="date" value={newForm.data_cobranca} onChange={(e) => setNewForm(p => ({ ...p, data_cobranca: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor (R$) *</Label>
                    <Input type="number" step="0.01" value={newForm.valor} onChange={(e) => setNewForm(p => ({ ...p, valor: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Forma de Pagamento</Label>
                  <Input value={newForm.forma_pagamento} onChange={(e) => setNewForm(p => ({ ...p, forma_pagamento: e.target.value }))} placeholder="Ex: PIX, Cartão..." />
                </div>
                <div className="space-y-2">
                  <Label>Observação</Label>
                  <Input value={newForm.observacao} onChange={(e) => setNewForm(p => ({ ...p, observacao: e.target.value }))} />
                </div>
                <Button onClick={createReceivable} className="w-full">Criar Recebível</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Recebíveis</p><p className="text-2xl font-bold">{filtered.length}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">A Receber</p><p className="text-2xl font-bold text-warning">R$ {totalReceber.toFixed(2)}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Recebido</p><p className="text-2xl font-bold text-success">R$ {totalRecebido.toFixed(2)}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Cancelados</p><p className="text-2xl font-bold text-destructive">R$ {totalCancelado.toFixed(2)}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Ticket Médio</p><p className="text-2xl font-bold">R$ {(ticketMedio || 0).toFixed(2)}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">NFe ({countNfe})</p><p className="text-2xl font-bold text-primary">R$ {totalNfe.toFixed(2)}</p></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input type="month" value={currentMonth} onChange={(e) => setCurrentMonth(e.target.value)} className="w-full sm:w-48" />
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar paciente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={nfeFilter} onValueChange={setNfeFilter}>
          <SelectTrigger className="w-full sm:w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">NFe: Todos</SelectItem>
            <SelectItem value="nfe">Somente NFe</SelectItem>
            <SelectItem value="sem_nfe">Sem NFe</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum recebível encontrado</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(r => (
            <Card key={r.id}>
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative overflow-hidden">
                {isAdmin && profileMap[r.user_id] && (
                  <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: profileMap[r.user_id].cor_identificacao }} />
                )}
                <div className={`space-y-1 flex-1 ${isAdmin && profileMap[r.user_id] ? "pl-3" : ""}`}>
                  <p className="font-medium">{(r as any).patients?.nome_completo || "—"}</p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{format(new Date(r.data_cobranca), "dd/MM/yyyy")}</span>
                    <span className="font-semibold text-foreground">R$ {Number(r.valor).toFixed(2)}</span>
                    {r.forma_pagamento && <span>{r.forma_pagamento}</span>}
                    {(r as any).gerar_nfe && <Badge variant="outline" className="text-[10px]">NFe</Badge>}
                  </div>
                  {r.observacao && <p className="text-xs text-muted-foreground">{r.observacao}</p>}
                  {isAdmin && profileMap[r.user_id] && (
                    <p className="text-xs text-muted-foreground">Profissional: {profileMap[r.user_id].nome}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={
                    r.status_pagamento === "pago" ? "default" :
                    r.status_pagamento === "pendente" ? "secondary" : "destructive"
                  }>
                    {r.status_pagamento}
                  </Badge>
                  {r.status_pagamento === "pendente" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => markAsPaid(r.id)} title="Marcar como pago">
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => cancelReceivable(r.id)} title="Cancelar">
                        <X className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
