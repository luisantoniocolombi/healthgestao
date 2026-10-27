# Trocar o status do pagamento mesmo depois de pago

## O que muda para você
- A janela do lápis (Editar) passa a mostrar também o **Status do pagamento**: Pendente, Pago ou Cancelado.
- Assim dá para voltar um recebível de "Pago" para "Pendente" (ou qualquer outro status) se ele foi marcado por engano.
- Se voltar para **Pendente** ou **Cancelado**, a data de pagamento é apagada. Se mudar para **Pago**, a data de pagamento fica sendo a de hoje (se ainda não houver uma).
- Os totais do topo (A Receber, Recebido, Cancelados) se atualizam na hora.

## O que não muda
- O banco de dados não muda: nenhuma tabela, coluna ou regra de acesso nova. Os dados atuais ficam como estão.
- Os botões de Pago e Cancelar continuam iguais. As regras de acesso também: o profissional só altera os próprios recebíveis, e o admin altera os da conta toda.

## Detalhes técnicos
- Só muda `src/pages/Financial.tsx`.
- Novo estado `editStatus`, preenchido com `r.status_pagamento` quando a janela abre.
- `Select` (já importado) no dialog, com as opções pendente, pago e cancelado.
- `updateValor` envia `{ valor, status_pagamento, data_pagamento, updated_by }`: `data_pagamento` = a atual ou a de hoje se for "pago"; `null` nos outros casos.
