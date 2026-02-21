import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Patient, Appointment } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, CalendarDays, Plus, Mic, MicOff, Copy, Check, RotateCcw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from "date-fns";
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
export default function Appointments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [selectedDate, setSelectedDate] = useState(new Date());

  const fetchData = async () => {
    if (!user) return;
    const monthStart = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const monthEnd = format(endOfMonth(currentMonth), "yyyy-MM-dd");

    const [apptRes, patRes] = await Promise.all([
      supabase.from("appointments").select("*, patients(nome_completo)")
        .eq("user_id", user.id).eq("archived", false)
        .gte("data_atendimento", monthStart).lte("data_atendimento", monthEnd)
        .order("data_atendimento"),
      supabase.from("patients").select("id, nome_completo")
        .eq("user_id", user.id).eq("archived", false).order("nome_completo"),
    ]);

    setAppointments((apptRes.data || []) as Appointment[]);
    setPatients((patRes.data || []) as Patient[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user, currentMonth]);

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth), { locale: ptBR }),
    end: endOfWeek(endOfMonth(currentMonth), { locale: ptBR }),
  });

  const getApptsForDay = (date: Date) =>
    appointments.filter(a => isSameDay(new Date(a.data_atendimento + "T00:00:00"), date));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Atendimentos</h1>
        </div>
        <Button onClick={() => navigate("/atendimentos/novo")}>
          <Plus className="h-4 w-4 mr-2" /> Novo Atendimento
        </Button>
      </div>

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
              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[60px] sm:min-h-[80px] p-1 border rounded-sm cursor-pointer hover:bg-muted/50 transition-colors ${
                    !isSameMonth(day, currentMonth) ? "opacity-30" : ""
                  } ${isToday ? "bg-primary/5 border-primary" : ""}`}
                  onClick={() => {
                    setSelectedDate(day);
                    navigate(`/atendimentos/novo?data=${format(day, "yyyy-MM-dd")}`);
                  }}
                >
                  <span className={`text-xs ${isToday ? "font-bold text-primary" : "text-muted-foreground"}`}>
                    {format(day, "d")}
                  </span>
                  {dayAppts.slice(0, 2).map(a => (
                    <div
                      key={a.id}
                      className="text-[10px] truncate bg-primary/10 text-primary rounded px-1 mt-0.5 cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); navigate(`/atendimentos/${a.id}`); }}
                    >
                      {a.hora && `${a.hora.slice(0, 5)} `}
                      {(a as any).patients?.nome_completo || "Paciente"}
                    </div>
                  ))}
                  {dayAppts.length > 2 && (
                    <span className="text-[10px] text-muted-foreground">+{dayAppts.length - 2}</span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ========== APPOINTMENT FORM ==========
export function AppointmentForm() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
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
  });

  const [createReceivable, setCreateReceivable] = useState(false);
  const [receivableForm, setReceivableForm] = useState({
    valor: "",
    observacao: "",
  });

  const speech = useSpeechRecognition();
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("patients").select("id, nome_completo")
      .eq("user_id", user.id).eq("archived", false).order("nome_completo")
      .then(({ data }) => setPatients((data || []) as Patient[]));

    if (id) {
      supabase.from("appointments").select("*").eq("id", id).single()
        .then(({ data }) => {
          if (data) {
            setExisting(data as Appointment);
            setForm({
              patient_id: data.patient_id,
              data_atendimento: data.data_atendimento,
              hora: data.hora || "",
              texto_prontuario: data.texto_prontuario || "",
              status: data.status,
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
      ...form,
      hora: form.hora || null,
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

    // Create receivable if toggled
    if (createReceivable && receivableForm.valor && appointmentId) {
      await supabase.from("receivables").insert({
        user_id: user.id,
        patient_id: form.patient_id,
        appointment_id: appointmentId,
        data_cobranca: form.data_atendimento,
        valor: parseFloat(receivableForm.valor),
        observacao: receivableForm.observacao || null,
        origem: "atendimento",
        created_by: user.id,
        updated_by: user.id,
      });
    }

    toast.success(id ? "Atendimento atualizado!" : "Atendimento salvo!");
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
    <div className="space-y-6 max-w-2xl">
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

            {/* Prontuário + Speech */}
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
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
