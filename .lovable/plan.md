

# Arquivar automaticamente ao mudar status para "inativo"

## Alteração

### Arquivo: `src/pages/PatientDetail.tsx`

Na função `handleSave` (linha 88), adicionar lógica para definir `archived: true` quando o status for alterado para "inativo". Quando voltar para "ativo", definir `archived: false`.

```tsx
// Dentro de handleSave, após montar updateData:
if (updateData.status === "inativo") {
  updateData.archived = true;
} else if (updateData.status === "ativo") {
  updateData.archived = false;
}
```

Após salvar com sucesso, se o paciente foi arquivado (status inativo), redirecionar para `/pacientes` em vez de recarregar a página, pois o paciente não aparecerá mais na listagem padrão.

### Arquivo: `src/pages/Patients.tsx`

Nenhuma alteração necessária. A listagem já filtra por `archived` e tem o filtro "Arquivados" funcional.

