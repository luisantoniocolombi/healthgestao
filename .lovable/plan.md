

# Mostrar todas as 4 colunas no mobile

## Alteração: `src/pages/Financial.tsx`

Remover `hidden sm:table-cell` da coluna "Dias" nas linhas 281, 290 e 298, mantendo-a sempre visível. Ajustar o `colSpan` do footer para 3 (já que agora são 4 colunas visíveis). Manter os tamanhos de fonte e padding responsivos (`p-2 sm:p-4`, `text-xs sm:text-sm`) para que tudo caiba no mobile.

Linhas afetadas:
- **281**: `hidden sm:table-cell` → visível sempre
- **290**: `hidden sm:table-cell` → visível sempre  
- **297**: Footer `colSpan={2}` → `colSpan={3}`
- **298**: Remover a célula vazia separada (`hidden sm:table-cell`)

Sem alterações de banco de dados.

