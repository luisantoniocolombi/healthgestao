

# Correcao do bug do profissional (tela branca)

## Causa raiz identificada

O componente `Badge` foi alterado para renderizar um `<div>`, mas em varios locais ele esta dentro de tags `<p>`. Exemplo: `PatientDetail.tsx` linha 513 coloca um `Badge` (`<div>`) dentro de um `<p>`. Isso viola a regra HTML de DOM nesting (`<div>` nao pode ser filho de `<p>`), o que em React 18 gera um erro que o `ErrorBoundary` captura, resultando na tela branca.

Apos reload, o React consegue montar o DOM de forma diferente e o erro nao ocorre na primeira renderizacao. Mas qualquer acao que force re-render (re-fetch, troca de tab) dispara o erro novamente.

## Correcao

### Arquivo 1: `src/components/ui/badge.tsx`
- Trocar o elemento de `<div>` para `<span>` (que e inline e pode existir dentro de `<p>`)
- Atualizar o tipo de `HTMLDivElement` para `HTMLSpanElement`

Essa unica mudanca resolve o problema em TODAS as paginas do sistema de uma vez.

### Arquivo 2: `src/pages/PatientDetail.tsx`
- Adicionar `DialogDescription` ao dialog "Novo Recebivel" (linha 480) que ainda esta faltando

