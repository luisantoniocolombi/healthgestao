

# Resumo por Paciente: Collapsible + Layout Mobile

## Alterações no arquivo `src/pages/Financial.tsx`

### 1. Tornar a seção colapsável (fechada por padrão)

Usar o componente `Collapsible` do Radix (já instalado) para envolver o "Resumo por Paciente". O CardHeader terá um botão de toggle com ícone chevron. Estado inicial: `open = false`.

```tsx
const [summaryOpen, setSummaryOpen] = useState(false);

<Collapsible open={summaryOpen} onOpenChange={setSummaryOpen}>
  <Card>
    <CollapsibleTrigger asChild>
      <CardHeader className="pb-3 cursor-pointer flex-row items-center justify-between">
        <CardTitle className="text-lg">Resumo por Paciente</CardTitle>
        <ChevronDown className={cn("h-4 w-4 transition-transform", summaryOpen && "rotate-180")} />
      </CardHeader>
    </CollapsibleTrigger>
    <CollapsibleContent>
      <CardContent>...</CardContent>
    </CollapsibleContent>
  </Card>
</Collapsible>
```

### 2. Ajustar colunas para mobile

- Ocultar a coluna "Dias" em telas pequenas (`hidden sm:table-cell`)
- Reduzir padding das cells (`p-2 sm:p-4`)
- Usar `text-xs sm:text-sm` nos textos
- Coluna "Atend." com texto abreviado no mobile
- Valores com `whitespace-nowrap` para não quebrar linha

Imports adicionais: `Collapsible, CollapsibleContent, CollapsibleTrigger` de `@/components/ui/collapsible`, `ChevronDown` de `lucide-react`.

Nenhuma alteração de banco de dados.

