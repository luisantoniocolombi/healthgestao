import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Receivable } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ArrowDownCircle, ArrowUpCircle, DollarSign, Plus, Check, X, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Expense {
  id: string;
  user_id: string;
  conta_principal_id: string;
  descricao: string;
  categoria: string;
  valor: number;
  data_vencimento: string;
  data_pagamento?: string | null;
  status: "pendente" | "pago" | "cancelado";
  forma_pagamento?: string | null;
  observacao?: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

interface CashFlowEntry {
  id: string;
  data: string;
  descricao: string;
  tipo: "entrada" | "saida";
  valor: number;
  status: string;
  original: Receivable | Expense;
}

const categorias = ["Fixo", "Variável", "Pessoal", "Material", "Outro"];

export default function CashFlow() {
  const { user, contaPrincipalId } = useAuth();
  const [month, setMonth] = useState(() => format(new Date(), "yyyy-MM"));
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [dialogMode, setDialogMode] = useState<"despesa" | "receita">("despesa");

  // Form state
  const [form, setForm] = useState({
    descricao: "",
    categoria: "Variável",
    valor: "",
    data_vencimento: format(new Date(), "yyyy-MM-dd"),
    forma_pagamento: "",
    observacao: "",
  });

  const monthDate = useMemo(() => parseISO(month + "-01"), [month]);
  const monthStart = useMemo(() => format(startOfMonth(monthDate), "yyyy-MM-dd"), [monthDate]);
  const monthEnd = useMemo(() => format(endOfMonth(monthDate), "yyyy-MM-dd"), [monthDate]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    const [recRes, expRes] = await Promise.all([
      supabase
        .from("receivables")
        .select("*, patients(nome_completo)")
        .eq("archived", false)
        .eq("status_pagamento", "pago")
        .gte("data_pagamento", monthStart)
        .lte("data_pagamento", monthEnd),
      supabase
        .from("expenses" as any)
        .select("*")
        .eq("archived", false)
        .gte("data_vencimento", monthStart)
        .lte("data_vencimento", monthEnd),
    ]);

    if (recRes.data) setReceivables(recRes.data as unknown as Receivable[]);
    if (expRes.data) setExpenses(expRes.data as unknown as Expense[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user, month]);

  const entries = useMemo<CashFlowEntry[]>(() => {
    const items: CashFlowEntry[] = [];

    receivables.forEach((r) => {
      items.push({
        id: r.id,
        data: r.data_pagamento || r.data_cobranca,
        descricao: `Recebimento - ${(r as any).patients?.nome_completo || "Paciente"}`,
        tipo: "entrada",
        valor: r.valor,
        status: "pago",
        original: r,
      });
    });

    expenses.forEach((e) => {
      const isReceita = (e as any).tipo === "receita";
      items.push({
        id: e.id,
        data: e.data_pagamento || e.data_vencimento,
        descricao: e.descricao,
        tipo: isReceita ? "entrada" : "saida",
        valor: e.valor,
        status: e.status,
        original: e,
      });
    });

    if (typeFilter === "entrada") return items.filter((i) => i.tipo === "entrada").sort((a, b) => a.data.localeCompare(b.data));
    if (typeFilter === "saida") return items.filter((i) => i.tipo === "saida").sort((a, b) => a.data.localeCompare(b.data));
    return items.sort((a, b) => a.data.localeCompare(b.data));
  }, [receivables, expenses, typeFilter]);

  const receitasManuais = expenses.filter((e) => (e as any).tipo === "receita" && e.status === "pago").reduce((s, e) => s + Number(e.valor), 0);
  const totalEntradas = receivables.reduce((s, r) => s + Number(r.valor), 0) + receitasManuais;
  const totalSaidas = expenses.filter((e) => (e as any).tipo !== "receita" && e.status === "pago").reduce((s, e) => s + Number(e.valor), 0);
  const saldo = totalEntradas - totalSaidas;

  const resetForm = () => {
    setForm({ descricao: "", categoria: "Variável", valor: "", data_vencimento: format(new Date(), "yyyy-MM-dd"), forma_pagamento: "", observacao: "" });
    setEditingExpense(null);
  };

  const handleOpenNew = (mode: "despesa" | "receita") => {
    resetForm();
    setDialogMode(mode);
    setDialogOpen(true);
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setDialogMode((expense as any).tipo === "receita" ? "receita" : "despesa");
    setForm({
      descricao: expense.descricao,
      categoria: expense.categoria,
      valor: String(expense.valor),
      data_vencimento: expense.data_vencimento,
      forma_pagamento: expense.forma_pagamento || "",
      observacao: expense.observacao || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.descricao || !form.valor || !form.data_vencimento) {
      toast.error("Preencha descrição, valor e data de vencimento");
      return;
    }

    if (editingExpense) {
      const { error } = await supabase
        .from("expenses" as any)
        .update({
          descricao: form.descricao,
          categoria: form.categoria,
          valor: parseFloat(form.valor),
          data_vencimento: form.data_vencimento,
          forma_pagamento: form.forma_pagamento || null,
          observacao: form.observacao || null,
        } as any)
        .eq("id", editingExpense.id);
      if (error) { toast.error("Erro ao atualizar despesa"); return; }
      toast.success("Despesa atualizada");
    } else {
      const { error } = await supabase.from("expenses" as any).insert({
        user_id: user!.id,
        conta_principal_id: contaPrincipalId,
        descricao: form.descricao,
        categoria: form.categoria,
        valor: parseFloat(form.valor),
        data_vencimento: form.data_vencimento,
        forma_pagamento: form.forma_pagamento || null,
        observacao: form.observacao || null,
        tipo: dialogMode,
      } as any);
      if (error) { toast.error("Erro ao criar despesa"); return; }
      toast.success("Despesa criada");
    }

    setDialogOpen(false);
    resetForm();
    fetchData();
  };

  const handleMarkPaid = async (expense: Expense) => {
    const { error } = await supabase
      .from("expenses" as any)
      .update({ status: "pago", data_pagamento: format(new Date(), "yyyy-MM-dd") } as any)
      .eq("id", expense.id);
    if (error) { toast.error("Erro ao marcar como pago"); return; }
    toast.success("Despesa marcada como paga");
    fetchData();
  };

  const handleCancel = async (expense: Expense) => {
    const { error } = await supabase
      .from("expenses" as any)
      .update({ status: "cancelado" } as any)
      .eq("id", expense.id);
    if (error) { toast.error("Erro ao cancelar"); return; }
    toast.success("Despesa cancelada");
    fetchData();
  };

  const handleArchive = async (expense: Expense) => {
    const { error } = await supabase
      .from("expenses" as any)
      .update({ archived: true } as any)
      .eq("id", expense.id);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Despesa excluída");
    fetchData();
  };

  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = -6; i <= 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      options.push({ value: format(d, "yyyy-MM"), label: format(d, "MMMM yyyy", { locale: ptBR }) });
    }
    return options;
  };

  const formatCurrency = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-foreground">Fluxo de Caixa</h1>
        <div className="flex gap-2">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {generateMonthOptions().map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" className="text-emerald-600 border-emerald-600 hover:bg-emerald-50" onClick={() => handleOpenNew("receita")}><Plus className="h-4 w-4 mr-1" /> Nova Receita</Button>
          <Button onClick={() => handleOpenNew("despesa")}><Plus className="h-4 w-4 mr-1" /> Nova Despesa</Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Entradas</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalEntradas)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Saídas</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(totalSaidas)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${saldo >= 0 ? "text-emerald-600" : "text-destructive"}`}>
              {formatCurrency(saldo)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="entrada">Entradas</SelectItem>
            <SelectItem value="saida">Saídas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : entries.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhum registro no período</TableCell></TableRow>
              ) : (
                entries.map((entry) => (
                  <TableRow key={`${entry.tipo}-${entry.id}`}>
                    <TableCell>{format(parseISO(entry.data), "dd/MM/yyyy")}</TableCell>
                    <TableCell>{entry.descricao}</TableCell>
                    <TableCell>
                      <Badge variant={entry.tipo === "entrada" ? "default" : "destructive"}>
                        {entry.tipo === "entrada" ? "Entrada" : "Saída"}
                      </Badge>
                    </TableCell>
                    <TableCell className={entry.tipo === "entrada" ? "text-emerald-600 font-medium" : "text-destructive font-medium"}>
                      {entry.tipo === "entrada" ? "+" : "-"}{formatCurrency(entry.valor)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={entry.status === "pago" ? "default" : entry.status === "cancelado" ? "secondary" : "outline"}>
                        {entry.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {(entry.original as any).tipo && (entry.original as Expense).status === "pendente" && (
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" title="Marcar como pago" onClick={() => handleMarkPaid(entry.original as Expense)}>
                            <Check className="h-4 w-4 text-emerald-500" />
                          </Button>
                          <Button size="icon" variant="ghost" title="Editar" onClick={() => handleEdit(entry.original as Expense)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" title="Cancelar" onClick={() => handleCancel(entry.original as Expense)}>
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                      {(entry.original as any).tipo && (entry.original as Expense).status !== "pendente" && (
                        <Button size="icon" variant="ghost" title="Excluir" onClick={() => handleArchive(entry.original as Expense)}>
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {entries.length > 0 && (
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3} className="font-bold">Saldo do Período</TableCell>
                  <TableCell colSpan={3} className={`font-bold ${saldo >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                    {formatCurrency(saldo)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </CardContent>
      </Card>

      {/* Dialog Nova/Editar Despesa */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) resetForm(); setDialogOpen(o); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingExpense ? (dialogMode === "receita" ? "Editar Receita" : "Editar Despesa") : (dialogMode === "receita" ? "Nova Receita" : "Nova Despesa")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Descrição *</Label>
              <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Ex: Aluguel, Material..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Categoria</Label>
                <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categorias.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valor (R$) *</Label>
                <Input type="number" step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data Vencimento *</Label>
                <Input type="date" value={form.data_vencimento} onChange={(e) => setForm({ ...form, data_vencimento: e.target.value })} />
              </div>
              <div>
                <Label>Forma de Pagamento</Label>
                <Input value={form.forma_pagamento} onChange={(e) => setForm({ ...form, forma_pagamento: e.target.value })} placeholder="Pix, Boleto..." />
              </div>
            </div>
            <div>
              <Label>Observação</Label>
              <Textarea value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleSave}>{editingExpense ? "Salvar" : (dialogMode === "receita" ? "Criar Receita" : "Criar Despesa")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
