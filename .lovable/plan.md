

# Exibir badge "NFe" na listagem de pacientes

## Alteração

### Arquivo: `src/pages/Patients.tsx`

Adicionar um Badge "NFe" condicional na área de badges (linha 144-154), visível apenas quando `patient.gerar_nfe` for `true`. Será posicionado antes do badge de convênio e status.

```tsx
{patient.gerar_nfe && (
  <Badge variant="outline" className="text-green-600 border-green-600">NFe</Badge>
)}
```

Nenhuma outra alteração necessária. O campo `gerar_nfe` já existe na tabela e no tipo `Patient`.

