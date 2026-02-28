

# Corrigir tela branca na página de Profissionais

## Problema identificado

O console mostra dois erros de ref:
1. "Function components cannot be given refs" para `Professionals` (React Router tenta passar ref)
2. Mesmo erro para `Dialog` dentro de `Professionals`

Esses warnings podem causar crash em React 18 strict mode, ativando o ErrorBoundary e resultando na tela branca.

Além disso, há warning de `DialogContent` sem `Description`/`aria-describedby`.

## Correções em `src/pages/Professionals.tsx`

1. Converter `Professionals` para usar `forwardRef` para que React Router consiga passar refs sem erro
2. Adicionar `DialogDescription` ao `DialogContent` para eliminar o warning de acessibilidade
3. Manter toda a lógica existente intacta

