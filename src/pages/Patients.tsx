import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAccountProfiles } from "@/hooks/use-account-profiles";
import { Patient } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Users } from "lucide-react";
import { toast } from "sonner";

export default function Patients() {
  const { user } = useAuth();
  const { profileMap, isAdmin } = useAccountProfiles();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<(Patient & { _prof_color?: string; _prof_nome?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");

  const fetchPatients = async () => {
    if (!user) return;
    try {
      const isArchived = statusFilter === "arquivados";

      let query = supabase
        .from("patients")
        .select("*")
        .eq("archived", isArchived)
        .order("nome_completo");

      if (!isAdmin) {
        query = query.eq("user_id", user.id);
      }

      if (!isArchived && statusFilter !== "todos") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) {
        toast.error("Erro ao carregar pacientes");
        return;
      }
      const enriched = ((data || []) as Patient[]).map(p => ({
        ...p,
        _prof_color: profileMap[p.user_id]?.cor_identificacao,
        _prof_nome: profileMap[p.user_id]?.nome,
      }));
      setPatients(enriched);
    } catch (err) {
      console.error("Erro ao carregar pacientes:", err);
      toast.error("Erro inesperado ao carregar pacientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [user, statusFilter, profileMap]);

  const filtered = patients.filter((p) => {
    const term = search.toLowerCase();
    return (
      p.nome_completo.toLowerCase().includes(term) ||
      p.telefone.includes(term) ||
      (p.responsavel_nome && p.responsavel_nome.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Pacientes</h1>
        </div>
        <Button onClick={() => navigate("/pacientes/novo")}>
          <Plus className="h-4 w-4 mr-2" /> Novo Paciente
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, telefone ou responsável..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="ativo">Ativos</SelectItem>
            <SelectItem value="inativo">Inativos</SelectItem>
            <SelectItem value="arquivados">Arquivados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum paciente encontrado
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((patient) => (
            <Card
              key={patient.id}
              className="cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden"
              onClick={() => navigate(`/pacientes/${patient.id}`)}
            >
              {isAdmin && patient._prof_color && (
                <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: patient._prof_color }} />
              )}
              <CardContent className={`p-4 flex items-center justify-between ${isAdmin && patient._prof_color ? "pl-5" : ""}`}>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">{patient.nome_completo}</p>
                  <p className="text-sm text-muted-foreground">{patient.telefone}</p>
                  {patient.responsavel_nome && (
                    <p className="text-xs text-muted-foreground">
                      Responsável: {patient.responsavel_nome}
                    </p>
                  )}
                  {isAdmin && patient._prof_nome && (
                    <p className="text-xs text-muted-foreground">
                      Profissional: {patient._prof_nome}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {patient.archived && (
                    <Badge variant="outline" className="text-muted-foreground">Arquivado</Badge>
                  )}
                  {(patient as any).convenio && (
                    <Badge variant="outline">{(patient as any).convenio}</Badge>
                  )}
                  <Badge variant={patient.status === "ativo" ? "default" : "secondary"}>
                    {patient.status === "ativo" ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
