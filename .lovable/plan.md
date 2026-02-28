

# Tabela Resumo por Paciente no Financeiro

Adicionar uma seção de tabela consolidada abaixo dos cards de dashboard e acima da listagem de recebíveis individuais, usando os dados já carregados (receivables + appointments do mês).

## Implementacao

### 1. Buscar appointments do mes junto com receivables
No `fetchData`, adicionar query de `appointments` filtrada pelo mesmo periodo do mes, para contar atendimentos e dias por paciente.

### 2. Montar dados consolidados por paciente
Agrupar receivables por `patient_id`, calcular:
- Nome do paciente (ordem alfabetica)
- Total de atendimentos no mes (da query de appointments)
- Dias dos atendimentos (lista de datas formatadas)
- Total a receber (soma dos receivables pendentes)

### 3. Renderizar tabela com Table/TableHeader/TableBody
Usar os componentes `Table` ja existentes em `src/components/ui/table.tsx`. Colunas:
- **Paciente** (nome alfabetico)
- **Atendimentos** (quantidade)
- **Dias** (datas separadas por virgula)
- **Total a Receber** (R$)

Linha de rodape com total geral.

### 4. Posicionamento
A tabela fica entre os filtros e a listagem de cards individuais, dentro de um Card com titulo "Resumo por Paciente".

### Arquivo afetado
- `src/pages/Financial.tsx` -- adicionar query de appointments, logica de agrupamento e componente Table

