

# Diagnóstico: Link de convite aponta para ambiente de preview

## Problema

O código atual usa `window.location.origin` para construir o link de convite. Quando você está testando no ambiente de preview (`id-preview--...lovable.app`), o link gerado aponta para esse mesmo ambiente de preview em vez da URL publicada (`healthgestao.lovable.app`).

Isso é tecnicamente "correto" (envia a URL de onde o admin está), mas na prática o link deveria sempre apontar para a URL de produção.

## Correção

Alterar `Professionals.tsx` para usar a URL publicada como origem do link, com fallback para `window.location.origin` caso não esteja definida.

Criar uma constante de configuração com a URL de produção:

| Arquivo | Alteração |
|---|---|
| `src/pages/Professionals.tsx` | Substituir `window.location.origin` por `https://healthgestao.lovable.app` como URL base do convite |

A mudanca e de uma unica linha no frontend. Nenhuma alteracao no Edge Function e necessaria, pois ele ja le o `origin` do body corretamente.

