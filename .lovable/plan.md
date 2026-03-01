

# Hover para alterar status do paciente

## O que sera feito

Adicionar interacao de hover no Badge de status do paciente (no topo da pagina PatientDetail), similar ao que ja existe nos atendimentos. Ao passar o mouse sobre o badge:

- Se **ativo**: mostra opcao "inativo" com estilo visual diferente
- Se **inativo**: mostra opcao "ativo" com estilo visual diferente

Ao clicar, altera o status diretamente no banco (incluindo o campo `archived`) sem precisar entrar no modo edicao.

## Alteracao

### Arquivo: `src/pages/PatientDetail.tsx`

Substituir o Badge estatico (linhas 230-232) por um Badge interativo com hover, seguindo o mesmo padrao do `Appointments.tsx`:

```tsx
<Badge
  variant={patient.status === "ativo" ? "default" : "secondary"}
  className="cursor-pointer group/badge hover:bg-red-500 hover:text-white transition-colors"
  onClick={async (e) => {
    e.stopPropagation();
    const newStatus = patient.status === "ativo" ? "inativo" : "ativo";
    const archived = newStatus === "inativo";
    const { error } = await supabase
      .from("patients")
      .update({ status: newStatus, archived, updated_by: user?.id })
      .eq("id", id);
    if (error) { toast.error("Erro ao alterar status"); return; }
    toast.success(archived ? "Paciente arquivado" : "Paciente reativado");
    if (archived) {
      navigate("/pacientes");
    } else {
      fetchAll();
    }
  }}
>
  <span className="group-hover/badge:hidden">{patient.status}</span>
  <span className="hidden group-hover/badge:inline-flex items-center gap-1">
    {patient.status === "ativo" ? "inativo" : "ativo"}
  </span>
</Badge>
```

- Quando ativo: hover mostra "inativo" com fundo vermelho
- Quando inativo: hover mostra "ativo" com fundo verde
- Cor do hover sera condicional baseada no status atual

Nenhuma outra alteracao necessaria.

