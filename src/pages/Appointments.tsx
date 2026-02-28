import { useState, useEffect, useRef, forwardRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAccountProfiles } from "@/hooks/use-account-profiles";
import { Patient, Appointment, Profile } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, CalendarDays, Plus, Mic, MicOff, Copy, Check, CheckCircle, RotateCcw, AlertTriangle, Trash2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

// ========== SPEECH HOOK ==========
function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSupported(!!SpeechRecognition);
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = "pt-BR";
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (event: any) => {
        let text = "";
        for (let i = 0; i < event.results.length; i++) {
          text += event.results[i][0].transcript;
        }
        setTranscript(text);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const start = () => {
    if (recognitionRef.current) {
      setTranscript("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const stop = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  return { isListening, transcript, supported, start, stop, setTranscript };
}

// ========== APPOINTMENTS PAGE ==========
const Appointments = forwardRef<HTMLDivElement, object>(function Appointments(_props, ref) {
  const { user } = useAuth();
  const { profileMap, isAdmin } = useAccountProfiles();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [patientFilter, setPatientFilter] = useState<string>("all");

  const fetchData = async () => {
    if (!user) return;
    try {
      const monthStart = format(startOfMonth(currentMonth), "yyyy-MM-dd");
      const monthEnd = format(endOfMonth(currentMonth), "yyyy-MM-dd");

      const apptQuery = supabase.from("appointments").select("*, patients(nome_completo)")
          .eq("archived", false)
          .gte("data_atendimento", monthStart).lte("data_atendimento", monthEnd)
          .order("data_atendimento");

      const patQuery = supabase.from("patients").select("id, nome_completo")
          .eq("archived", false).order("nome_completo");

      if (!isAdmin) {
        apptQuery.eq("user_id", user.id);
        patQuery.eq("user_id", user.id);
      }

      const [apptRes, patRes] = await Promise.all([apptQuery, patQuery]);

      if (apptRes.error) console.error("Erro atendimentos:", apptRes.error);
      if (patRes.error) console.error("Erro pacientes:", patRes.error);

      setAppointments((apptRes.data || []) as Appointment[]);
      setPatients((patRes.data || []) as Patient[]);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user, currentMonth, isAdmin]);

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth), { locale: ptBR }),
    end: endOfWeek(endOfMonth(currentMonth), { locale: ptBR }),
  });

  const filteredAppointments = patientFilter === "all"
    ? appointments
    : appointments.filter(a => a.patient_id === patientFilter);

  const getApptsForDay = (date: Date) =>
    filteredAppointments.filter(a => isSameDay(new Date(a.data_atendimento + "T00:00:00"), date));

  return (
    <div ref={ref} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Atendimentos</h1>
        </div>
        <Button onClick={() => navigate("/atendimentos/novo")}>
          <Plus className="h-4 w-4 mr-2" /> Novo Atendimento
        </Button>
      </div>

      {/* Patient filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={patientFilter} onValueChange={setPatientFilter}>
          <SelectTrigger className="w-full sm:w-72">
            <SelectValue placeholder="Filtrar por paciente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os pacientes</SelectItem>
            {patients.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.nome_completo}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Monthly counters */}
      {(() => {
        const agendados = filteredAppointments.filter(a => a.status === "agendado").length;
        const realizados = filteredAppointments.filter(a => a.status === "realizado").length;
        const cancelados = filteredAppointments.filter(a => a.status === "cancelado").length;
        return (
          <div className="grid grid-cols-3 gap-3">
            <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Agendados</p><p className="text-2xl font-bold text-blue-500">{agendados}</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Realizados</p><p className="text-2xl font-bold text-green-600">{realizados}</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Cancelados</p><p className="text-2xl font-bold text-destructive">{cancelados}</p></CardContent></Card>
          </div>
        );
      })()}

      {/* Calendar nav */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>←</Button>
        <h2 className="text-lg font-semibold capitalize">
          {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
        </h2>
        <Button variant="outline" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>→</Button>
      </div>

      {/* Calendar grid */}
      <Card>
        <CardContent className="p-2 sm:p-4">
          <div className="grid grid-cols-7 gap-px">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(d => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
            ))}
            {days.map((day) => {
              const dayAppts = getApptsForDay(day);
              const isToday = isSameDay(day, new Date());
              const isSelected = isSameDay(day, selectedDate);
              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[60px] sm:min-h-[80px] p-1 border rounded-sm cursor-pointer hover:bg-muted/50 transition-colors ${
                    !isSameMonth(day, currentMonth) ? "opacity-30" : ""
                  } ${isToday ? "bg-primary/5 border-primary" : ""} ${isSelected && !isToday ? "bg-accent/30 border-accent" : ""}`}
                  onClick={() => setSelectedDate(day)}
                >
                  <span className={`text-xs ${isToday ? "font-bold text-primary" : "text-muted-foreground"}`}>
                    {format(day, "d")}
                  </span>
                  {dayAppts.slice(0, 2).map(a => {
                    const profColor = isAdmin ? profileMap[a.user_id]?.cor_identificacao : undefined;
                    return (
                      <div
                        key={a.id}
                        className={`text-[10px] truncate rounded px-1 mt-0.5 cursor-pointer ${
                          a.status === "cancelado"
                            ? "bg-destructive/10 text-destructive line-through"
                            : a.status === "agendado"
                              ? "bg-blue-500/10 text-blue-600"
                              : "bg-primary/10 text-primary"
                        }`}
                        style={profColor ? { borderLeft: `3px solid ${profColor}` } : undefined}
                        onClick={(e) => { e.stopPropagation(); navigate(`/atendimentos/${a.id}`); }}
                      >
                        {a.hora && `${a.hora.slice(0, 5)} `}
                        {(a as any).patients?.nome_completo || "Paciente"}
                      </div>
                    );
                  })}
                  {dayAppts.length > 2 && (
                    <span className="text-[10px] text-muted-foreground">+{dayAppts.length - 2}</span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Daily detail view */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">
              {format(selectedDate, "dd 'de' MMMM, EEEE", { locale: ptBR })}
            </h3>
            <Button size="sm" onClick={() => navigate(`/atendimentos/novo?data=${format(selectedDate, "yyyy-MM-dd")}`)}>
              <Plus className="h-4 w-4 mr-1" /> Novo
            </Button>
          </div>
          {(() => {
            const dayAppts = getApptsForDay(selectedDate);
            if (dayAppts.length === 0) return <p className="text-sm text-muted-foreground">Nenhum atendimento neste dia</p>;
            return dayAppts
              .sort((a, b) => (a.hora || "").localeCompare(b.hora || ""))
              .map(a => {
                const profColor = isAdmin ? profileMap[a.user_id]?.cor_identificacao : undefined;
                const profNome = isAdmin ? profileMap[a.user_id]?.nome : undefined;
                return (
                  <div
                    key={a.id}
                    className="p-3 border rounded-lg flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                    style={profColor ? { borderLeftWidth: '3px', borderLeftColor: profColor } : undefined}
                    onClick={() => navigate(`/atendimentos/${a.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono text-muted-foreground w-12">{a.hora ? a.hora.slice(0, 5) : "--:--"}</span>
                      <div>
                        <span className="text-sm font-medium">{(a as any).patients?.nome_completo || "Paciente"}</span>
                        {profNome && <p className="text-xs text-muted-foreground">{profNome}</p>}
                      </div>
                    </div>
                    {a.status === "agendado" ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant="secondary"
                              className="cursor-pointer group/badge hover:bg-green-500 hover:text-white transition-colors"
                              onClick={async (e) => {
                                e.stopPropagation();
                                const { error } = await supabase
                                  .from("appointments")
                                  .update({ status: "realizado" })
                                  .eq("id", a.id);
                                if (error) {
                                  toast.error("Erro ao atualizar status");
                                  return;
                                }
                                setAppointments(prev =>
                                  prev.map(ap => ap.id === a.id ? { ...ap, status: "realizado" } : ap)
                                );
                                toast.success("Atendimento marcado como realizado");
                              }}
                            >
                              <span className="group-hover/badge:hidden">agendado</span>
                              <span className="hidden group-hover/badge:inline-flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" /> realizado
                              </span>
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>Clique para marcar como realizado</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <Badge variant={a.status === "realizado" ? "default" : "destructive"}>
                        {a.status}
                      </Badge>
                    )}
                  </div>
                );
              });
          })()}
        </CardContent>
      </Card>
    </div>
  );
});

export default Appointments;

// ========== APPOINTMENT FORM ==========
export const AppointmentForm = forwardRef<HTMLDivElement, object>(function AppointmentForm(_props, ref) {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { profileMap, isAdmin } = useAccountProfiles();
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [existing, setExisting] = useState<Appointment | null>(null);

  const [form, setForm] = useState({
    patient_id: params.get("paciente") || "",
    data_atendimento: params.get("data") || format(new Date(), "yyyy-MM-dd"),
    hora: "",
    texto_prontuario: "",
    status: "realizado" as string,
    gerar_nfe: false,
    profissional_parceiro_id: "",
    percentual_parceiro: "50",
  });

  const [createReceivable, setCreateReceivable] = useState(false);
  const [receivableForm, setReceivableForm] = useState({
    valor: "",
    observacao: "",
  });

  // Recurring appointment (only for new)
  const [repetirSemanas, setRepetirSemanas] = useState(false);
  const [quantidadeSemanas, setQuantidadeSemanas] = useState(4);

  const speech = useSpeechRecognition();
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("patients").select("id, nome_completo")
      .eq("archived", false).order("nome_completo")
      .then(({ data }) => setPatients((data || []) as Patient[]));

    if (id) {
      supabase.from("appointments").select("*").eq("id", id).maybeSingle()
        .then(({ data, error }) => {
          if (error) { console.error("Erro ao carregar atendimento:", error); return; }
          if (data) {
            setExisting(data as Appointment);
            setForm({
              patient_id: data.patient_id,
              data_atendimento: data.data_atendimento,
              hora: data.hora || "",
              texto_prontuario: data.texto_prontuario || "",
              status: data.status,
              gerar_nfe: (data as any).gerar_nfe || false,
              profissional_parceiro_id: (data as any).profissional_parceiro_id || "",
              percentual_parceiro: String((data as any).percentual_parceiro || 50),
            });
          }
        });
    }
  }, [user, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const payload = {
      patient_id: form.patient_id,
      data_atendimento: form.data_atendimento,
      hora: form.hora || null,
      texto_prontuario: form.texto_prontuario,
      status: form.status,
      gerar_nfe: form.gerar_nfe,
      profissional_parceiro_id: form.profissional_parceiro_id || null,
      percentual_parceiro: form.profissional_parceiro_id ? parseFloat(form.percentual_parceiro) : null,
      user_id: user.id,
      updated_by: user.id,
    };

    let appointmentId = id;

    if (id) {
      const { error } = await supabase.from("appointments").update(payload).eq("id", id);
      if (error) { toast.error("Erro ao salvar"); setLoading(false); return; }
    } else {
      const { data, error } = await supabase.from("appointments").insert({
        ...payload,
        created_by: user.id,
      }).select("id").single();
      if (error) { toast.error("Erro ao salvar"); setLoading(false); return; }
      appointmentId = data.id;
    }

    // Create receivable(s) if toggled
    if (createReceivable && receivableForm.valor && appointmentId) {
      const totalValor = parseFloat(receivableForm.valor);
      
      if (form.profissional_parceiro_id) {
        // Split: create 2 receivables
        const pct = parseFloat(form.percentual_parceiro) / 100;
        const valorParceiro = totalValor * pct;
        const valorPrincipal = totalValor - valorParceiro;

        await Promise.all([
          supabase.from("receivables").insert({
            user_id: user.id,
            patient_id: form.patient_id,
            appointment_id: appointmentId,
            data_cobranca: form.data_atendimento,
            valor: valorPrincipal,
            observacao: receivableForm.observacao || null,
            origem: "atendimento",
            gerar_nfe: form.gerar_nfe,
            created_by: user.id,
            updated_by: user.id,
          }),
          supabase.from("receivables").insert({
            user_id: form.profissional_parceiro_id,
            patient_id: form.patient_id,
            appointment_id: appointmentId,
            data_cobranca: form.data_atendimento,
            valor: valorParceiro,
            observacao: `Parceiro - ${receivableForm.observacao || ""}`.trim(),
            origem: "atendimento",
            gerar_nfe: form.gerar_nfe,
            created_by: user.id,
            updated_by: user.id,
          }),
        ]);
      } else {
        await supabase.from("receivables").insert({
          user_id: user.id,
          patient_id: form.patient_id,
          appointment_id: appointmentId,
          data_cobranca: form.data_atendimento,
          valor: totalValor,
          observacao: receivableForm.observacao || null,
          origem: "atendimento",
          gerar_nfe: form.gerar_nfe,
          created_by: user.id,
          updated_by: user.id,
        });
      }
    }

    // Create recurring appointments if toggled (only for new)
    if (!id && repetirSemanas && quantidadeSemanas > 0) {
      const baseDate = new Date(form.data_atendimento + "T00:00:00");
      for (let i = 1; i <= quantidadeSemanas; i++) {
        const nextDate = format(addDays(baseDate, i * 7), "yyyy-MM-dd");
        const recurPayload = {
          patient_id: form.patient_id,
          data_atendimento: nextDate,
          hora: form.hora || null,
          texto_prontuario: "",
          status: "agendado",
          gerar_nfe: form.gerar_nfe,
          profissional_parceiro_id: form.profissional_parceiro_id || null,
          percentual_parceiro: form.profissional_parceiro_id ? parseFloat(form.percentual_parceiro) : null,
          user_id: user.id,
          created_by: user.id,
          updated_by: user.id,
        };

        const { data: recurData, error: recurError } = await supabase.from("appointments").insert(recurPayload).select("id").single();
        if (recurError) {
          console.error(`Erro ao criar atendimento recorrente semana ${i}:`, recurError);
          continue;
        }

        // Duplicate receivables for recurring appointments if enabled
        if (createReceivable && receivableForm.valor && recurData) {
          const totalValor = parseFloat(receivableForm.valor);
          if (form.profissional_parceiro_id) {
            const pct = parseFloat(form.percentual_parceiro) / 100;
            const valorParceiro = totalValor * pct;
            const valorPrincipal = totalValor - valorParceiro;
            await Promise.all([
              supabase.from("receivables").insert({
                user_id: user.id,
                patient_id: form.patient_id,
                appointment_id: recurData.id,
                data_cobranca: nextDate,
                valor: valorPrincipal,
                observacao: receivableForm.observacao || null,
                origem: "atendimento",
                gerar_nfe: form.gerar_nfe,
                created_by: user.id,
                updated_by: user.id,
              }),
              supabase.from("receivables").insert({
                user_id: form.profissional_parceiro_id,
                patient_id: form.patient_id,
                appointment_id: recurData.id,
                data_cobranca: nextDate,
                valor: valorParceiro,
                observacao: `Parceiro - ${receivableForm.observacao || ""}`.trim(),
                origem: "atendimento",
                gerar_nfe: form.gerar_nfe,
                created_by: user.id,
                updated_by: user.id,
              }),
            ]);
          } else {
            await supabase.from("receivables").insert({
              user_id: user.id,
              patient_id: form.patient_id,
              appointment_id: recurData.id,
              data_cobranca: nextDate,
              valor: totalValor,
              observacao: receivableForm.observacao || null,
              origem: "atendimento",
              gerar_nfe: form.gerar_nfe,
              created_by: user.id,
              updated_by: user.id,
            });
          }
        }
      }
    }

    toast.success(id ? "Atendimento atualizado!" : repetirSemanas ? `${quantidadeSemanas + 1} atendimentos criados!` : "Atendimento salvo!");
    navigate("/atendimentos");
    setLoading(false);
  };

  const insertTranscription = () => {
    setForm(prev => ({
      ...prev,
      texto_prontuario: prev.texto_prontuario
        ? prev.texto_prontuario + "\n\n" + speech.transcript
        : speech.transcript,
    }));
    speech.setTranscript("");
    toast.success("Transcrição inserida no prontuário");
  };

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div ref={ref} className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/atendimentos")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">
          {id ? "Editar Atendimento" : "Novo Atendimento"}
        </h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label>Paciente *</Label>
                <Select value={form.patient_id} onValueChange={(v) => update("patient_id", v)} required>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {patients.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.nome_completo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data *</Label>
                <Input type="date" value={form.data_atendimento} onChange={(e) => update("data_atendimento", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Hora</Label>
                <Input type="time" value={form.hora} onChange={(e) => update("hora", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => update("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agendado">Agendado</SelectItem>
                    <SelectItem value="realizado">Realizado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Recurring appointment toggle - only for new */}
            {!id && (
              <div className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Switch checked={repetirSemanas} onCheckedChange={setRepetirSemanas} />
                  <Label>Repetir nas próximas semanas</Label>
                </div>
                {repetirSemanas && (
                  <>
                    <div className="space-y-2">
                      <Label>Quantas semanas? (1 a 12)</Label>
                      <Input
                        type="number"
                        min={1}
                        max={12}
                        value={quantidadeSemanas}
                        onChange={(e) => setQuantidadeSemanas(Math.min(12, Math.max(1, parseInt(e.target.value) || 1)))}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Serão criados <strong>{quantidadeSemanas + 1}</strong> atendimentos:{" "}
                      {Array.from({ length: quantidadeSemanas + 1 }, (_, i) =>
                        format(addDays(new Date(form.data_atendimento + "T00:00:00"), i * 7), "dd/MM")
                      ).join(", ")}
                    </p>
                  </>
                )}
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Prontuário</Label>
                {speech.supported && (
                  <Button
                    type="button"
                    size="sm"
                    variant={speech.isListening ? "destructive" : "outline"}
                    onClick={() => {
                      if (speech.isListening) {
                        speech.stop();
                      } else {
                        setShowPrivacyNotice(true);
                        speech.start();
                      }
                    }}
                  >
                    {speech.isListening ? <><MicOff className="h-4 w-4 mr-1" />Parar</> : <><Mic className="h-4 w-4 mr-1" />Gravar</>}
                  </Button>
                )}
              </div>

              {showPrivacyNotice && (
                <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/30 rounded-lg text-sm">
                  <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                  <p>Ao usar ditado, sua fala será transcrita. Revise o texto antes de salvar.</p>
                </div>
              )}

              <Textarea
                value={form.texto_prontuario}
                onChange={(e) => update("texto_prontuario", e.target.value)}
                rows={6}
                placeholder="Escreva o prontuário ou use o ditado por voz..."
              />

              {speech.transcript && (
                <div className="p-3 border rounded-lg bg-muted/50 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Transcrição:</p>
                  <p className="text-sm">{speech.transcript}</p>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" onClick={insertTranscription}>
                      <Check className="h-3 w-3 mr-1" /> Inserir
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => { speech.setTranscript(""); speech.start(); }}>
                      <RotateCcw className="h-3 w-3 mr-1" /> Regravar
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => {
                      navigator.clipboard.writeText(speech.transcript);
                      toast.success("Copiado!");
                    }}>
                      <Copy className="h-3 w-3 mr-1" /> Copiar
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* NFe checkbox */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="gerar_nfe"
                checked={form.gerar_nfe}
                onCheckedChange={(checked) => setForm(prev => ({ ...prev, gerar_nfe: !!checked }))}
              />
              <Label htmlFor="gerar_nfe">Gerar NFe</Label>
            </div>

            {/* Partner professional */}
            {Object.keys(profileMap).length > 0 && (
              <div className="space-y-2 p-4 border rounded-lg">
                <Label>Profissional Parceiro (opcional)</Label>
                <Select value={form.profissional_parceiro_id} onValueChange={(v) => setForm(prev => ({ ...prev, profissional_parceiro_id: v === "none" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {Object.entries(profileMap)
                      .filter(([pid]) => pid !== user?.id)
                      .map(([pid, prof]) => (
                        <SelectItem key={pid} value={pid}>{prof.nome}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {form.profissional_parceiro_id && (
                  <div className="space-y-2">
                    <Label>% Parceiro</Label>
                    <Input type="number" min="1" max="99" value={form.percentual_parceiro} onChange={(e) => setForm(prev => ({ ...prev, percentual_parceiro: e.target.value }))} />
                    <p className="text-xs text-muted-foreground">Você: {100 - Number(form.percentual_parceiro)}% | Parceiro: {form.percentual_parceiro}%</p>
                  </div>
                )}
              </div>
            )}

            {/* Toggle cobrança */}
            {!id && (
              <div className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Switch checked={createReceivable} onCheckedChange={setCreateReceivable} />
                  <Label>Criar cobrança deste atendimento?</Label>
                </div>
                {createReceivable && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Valor (R$) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={receivableForm.valor}
                        onChange={(e) => setReceivableForm(p => ({ ...p, valor: e.target.value }))}
                        required={createReceivable}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Observação</Label>
                      <Input
                        value={receivableForm.observacao}
                        onChange={(e) => setReceivableForm(p => ({ ...p, observacao: e.target.value }))}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Salvar"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/atendimentos")}>
                Cancelar
              </Button>
              {id && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive" className="ml-auto">
                      <Trash2 className="h-4 w-4 mr-1" /> Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir atendimento?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. O atendimento será removido permanentemente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={async () => {
                          await supabase.from("appointments").update({ archived: true }).eq("id", id);
                          toast.success("Atendimento excluído!");
                          navigate("/atendimentos");
                        }}
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
});
