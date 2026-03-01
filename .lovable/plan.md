

# Adicionar campo "Gerar NFe" na edição do paciente

## Alterações no arquivo `src/pages/PatientDetail.tsx`

### 1. Importar Checkbox
Adicionar import do `Checkbox` de `@/components/ui/checkbox`.

### 2. Adicionar checkbox no formulário de edição
Inserir campo "Gerar NFe" entre o campo Convênio (linha 340) e o campo Status (linha 341), com o mesmo padrão visual do cadastro:

```tsx
<div className="flex items-center space-x-2 sm:col-span-2">
  <Checkbox
    id="edit_gerar_nfe"
    checked={!!form.gerar_nfe}
    onCheckedChange={(checked) => setForm((prev) => ({ ...prev, gerar_nfe: !!checked }))}
    disabled={!editing}
  />
  <Label htmlFor="edit_gerar_nfe">Gerar NFe</Label>
</div>
```

### 3. Incluir `gerar_nfe` no handleSave
Na linha 90, adicionar `gerar_nfe` na destructuring do form e incluir no objeto `updateData` (linha 91).

Nenhuma outra alteração.

