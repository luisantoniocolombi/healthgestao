# Opção "Criar cobrança" ao abrir um atendimento já lançado

## O que encontrei
- Login da Cynthia: cz.neuroexcelencia@gmail.com.
- Em 28/10 ela lançou 21 atendimentos (26/10 a 30/10). Todos estão salvos, mas **nenhum** tem valor no Contas a Receber.
- O print confirma a causa: a opção "Criar cobrança deste atendimento?" só aparece quando o atendimento é **novo**. Quando ela abre um atendimento já lançado (como o agendado do print), a opção some. Assim, quem lançou sem ligar a opção não consegue mais incluir o valor por essa tela.
- O banco e as regras de acesso estão corretos. Ela tem permissão para gravar.

## O que vou mudar (sem mexer no banco)
1. Ao abrir um atendimento já lançado, mostrar a opção "Criar cobrança deste atendimento?" **se ele ainda não tiver cobrança**. Se já tiver, a opção continua escondida, para não cobrar duas vezes.
2. Se a gravação do valor falhar, mostrar uma mensagem de erro em vez de dizer "salvo".
3. Com isso, a Cynthia pode abrir cada um dos 21 atendimentos, ligar a opção, informar o valor e salvar.

## Detalhes técnicos
- Só muda `src/pages/Appointments.tsx`.
- Ao carregar um atendimento existente, consultar `receivables` com `appointment_id = id` e `archived = false`; guardar `hasReceivable`.
- Trocar `{!id && (` por `{(!id || !hasReceivable) && (` no bloco do toggle.
- No `handleSubmit`, conferir o `error` de cada `insert` em `receivables` e mostrar `toast.error`.
- A repetição semanal continua só para atendimentos novos.
- Nenhuma mudança em tabelas, colunas ou regras de acesso.
