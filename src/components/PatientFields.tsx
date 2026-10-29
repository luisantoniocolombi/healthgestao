import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function maskCpf(raw: string) {
  return raw
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function maskCnpj(raw: string) {
  return raw
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function detectDocType(value?: string | null): "cpf" | "cnpj" {
  return (value || "").replace(/\D/g, "").length > 11 ? "cnpj" : "cpf";
}

export function DocumentField({ value, onChange, disabled, id }: { value: string; onChange: (v: string) => void; disabled?: boolean; id?: string }) {
  const [tipo, setTipo] = useState<"cpf" | "cnpj">(detectDocType(value));
  useEffect(() => { setTipo(detectDocType(value)); }, [value === "" ? "" : detectDocType(value)]); // sync when loaded
  const changeTipo = (t: "cpf" | "cnpj") => { setTipo(t); onChange(""); };
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor={id}>Documento</Label>
        <Select value={tipo} onValueChange={(v) => changeTipo(v as any)} disabled={disabled}>
          <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="cpf">CPF</SelectItem>
            <SelectItem value="cnpj">CNPJ</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Input
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => {
          const max = tipo === "cnpj" ? 14 : 11;
          const raw = e.target.value.replace(/\D/g, "").slice(0, max);
          onChange(tipo === "cnpj" ? maskCnpj(raw) : maskCpf(raw));
        }}
        placeholder={tipo === "cnpj" ? "00.000.000/0000-00" : "000.000.000-00"}
        maxLength={tipo === "cnpj" ? 18 : 14}
      />
    </div>
  );
}

const DEFAULTS = [
  { value: "particular", label: "Particular" },
  { value: "unimed", label: "Unimed" },
  { value: "gap", label: "GAP" },
  { value: "outros", label: "Outros" },
];

export function ConvenioField({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const [extras, setExtras] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [novo, setNovo] = useState("");

  useEffect(() => {
    supabase.from("patients").select("convenio").not("convenio", "is", null).then(({ data }) => {
      const set = new Set<string>();
      (data || []).forEach((r: any) => {
        const c = (r.convenio || "").trim();
        if (c && !DEFAULTS.some((d) => d.value === c.toLowerCase())) set.add(c);
      });
      setExtras(Array.from(set).sort((a, b) => a.localeCompare(b)));
    });
  }, []);

  const all = [...DEFAULTS, ...extras.map((e) => ({ value: e, label: e }))];
  if (value && !all.some((o) => o.value === value)) all.push({ value, label: value });

  const confirmNovo = () => {
    const t = novo.trim().replace(/\s+/g, " ");
    if (!t) return;
    const existing = all.find((o) => o.label.toLowerCase() === t.toLowerCase());
    const v = existing ? existing.value : t.charAt(0).toUpperCase() + t.slice(1);
    if (!existing) setExtras((p) => [...p, v]);
    onChange(v);
    setNovo("");
    setAdding(false);
  };

  return (
    <div className="space-y-2">
      <Label>Convênio</Label>
      {adding ? (
        <div className="flex gap-2">
          <Input autoFocus value={novo} onChange={(e) => setNovo(e.target.value)} placeholder="Nome do convênio"
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); confirmNovo(); } }} />
          <Button type="button" size="sm" onClick={confirmNovo}>OK</Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setAdding(false)}>Cancelar</Button>
        </div>
      ) : (
        <Select value={value || ""} onValueChange={(v) => (v === "__novo__" ? setAdding(true) : onChange(v))} disabled={disabled}>
          <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
          <SelectContent>
            {all.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            <SelectItem value="__novo__">+ Novo convênio</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
