

# Excluir atendimento: opção de excluir apenas este ou todos futuros

## Problema

Atualmente, ao clicar em "Excluir" num atendimento, ele é arquivado sem perguntar sobre outros atendimentos futuros do mesmo paciente.

## Solução

### Arquivo: `src/pages/Appointments.tsx`

Substituir o `AlertDialog` atual de exclusão (linhas 808-836) por um dialog customizado com duas opções:

1. **"Apenas este atendimento"** — comportamento atual, arquiva só o atendimento aberto
2. **"Este e todos os futuros agendados"** — arquiva este atendimento E todos os atendimentos do mesmo paciente com:
   - `data_atendimento > data do atendimento atual` (estritamente futuros)
   - `status = 'agendado'` (não apaga realizados nem cancelados)
   - `archived = false`

### Implementação

- Trocar o `AlertDialog` por um `Dialog` (do `@/components/ui/dialog`) para ter mais controle no layout
- Dentro do dialog, dois botões:
  - "Apenas este" → `supabase.from("appointments").update({ archived: true }).eq("id", id)`
  - "Este e futuros agendados" → executa o acima + `supabase.from("appointments").update({ archived: true }).eq("patient_id", form.patient_id).gt("data_atendimento", form.data_atendimento).eq("status", "agendado").eq("archived", false)`
- Ambos redirecionam para `/atendimentos` com toast de sucesso
- Importar `Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription` de `@/components/ui/dialog`
- Adicionar estado `deleteDialogOpen` para controlar o dialog

### Sem alterações no banco de dados

