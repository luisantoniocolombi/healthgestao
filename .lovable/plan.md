# Lançamentos da Cynthia no Contas a Receber

## O que encontrei
- Login da Cynthia: cz.neuroexcelencia@gmail.com (admin).
- Até 09/04 todos os atendimentos dela geravam valor a receber normalmente.
- Em 28/10 ela lançou 21 atendimentos (de 26/10 a 30/10) e **nenhum** gerou valor a receber.
- Os atendimentos estão salvos. O que não foi salvo é o valor no Contas a Receber.
- O banco não mostra nenhum erro nesses horários. As regras de acesso permitem que ela grave.
- Outra profissional (Simone) lançou atendimentos com valor no mesmo dia e funcionou.

## Causa provável (não confirmada)
Na tela do atendimento, o valor só é gravado se a opção "Gerar recebível" estiver ligada e o campo valor estiver preenchido. Essa opção começa **desligada**. Além disso, se a gravação do valor falhar, o sistema não mostra nenhum aviso e diz "salvo" mesmo assim. Por isso, nem ela nem nós ficamos sabendo do problema.

## Proposta (sem mexer no banco)
1. Se a gravação do valor falhar, mostrar uma mensagem de erro clara em vez de dizer "salvo".
2. Se ela digitar um valor, mas a opção "Gerar recebível" estiver desligada, avisar antes de salvar.
3. Depois disso, peço para a Cynthia lançar um atendimento de teste e confirmo no sistema se o valor ficou gravado.
4. Os 21 atendimentos de outubro continuam sem valor. Ela pode incluir os valores pelo botão "Novo Recebível" no Financeiro, ou você me passa os valores e eu lanço por ela.

## Detalhes técnicos
- Só muda `src/pages/Appointments.tsx` (handleSubmit, linhas ~456-505 e ~533-580): conferir o `error` de cada `insert` em `receivables`, mostrar `toast.error` e não navegar se houver erro.
- Nenhuma mudança no banco, nas tabelas ou nas regras de acesso.
