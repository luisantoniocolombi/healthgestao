# Imposto NFe e Repasse da fono como despesas

Nada muda no banco de dados (estrutura nem dados existentes). Só telas.

## O que muda para você

1. **Cobrança com NFe entra pelo valor cheio**
   - Novos atendimentos com NFe geram a cobrança pelo valor que o paciente paga (ex.: R$ 100,00), com a etiqueta "NFe 10%".
   - Cobranças já existentes ficam como estão.

2. **Despesa de imposto automática (pendente)**
   - Quando a cobrança com NFe é marcada como **Paga** no Financeiro, o sistema cria uma despesa **"Imposto NFe (10%) - Paciente X"** de R$ 10,00, categoria **"Impostos / NFe"**, como **pendente**, com vencimento na data do pagamento.
   - Você dá baixa no Fluxo de Caixa quando pagar a guia/DAS.

3. **Repasse da fono parceira**
   - Quando a parte da fono parceira é marcada como **Paga**, o sistema cria uma despesa **"Repasse - [Nome da fono] - Paciente X"**, categoria **"Repasse Profissional"**, como pendente, para dar baixa quando pagar a fono.

4. **Sem duplicar**
   - Se você voltar a cobrança para pendente e marcar paga de novo, não cria uma segunda despesa.
   - Se a cobrança voltar para Pendente/Cancelado, a despesa pendente ligada a ela é cancelada.

5. **Novas categorias** "Impostos / NFe" e "Repasse Profissional" aparecem na lista de categorias do Fluxo de Caixa.

Exemplo: paciente paga R$ 100 com NFe 10% → Entradas +100, Saídas -10 (quando pagar a guia), Saldo 90.

## Limite importante
Pelas regras de acesso atuais, só o **admin** pode criar despesas. Se uma profissional (ex.: Cynthia) marcar uma cobrança como paga, a despesa não é criada e o sistema avisa; o admin pode gerar ao confirmar. Mudar isso exigiria alterar regras no banco, o que não faremos.

## Detalhes técnicos
- `Appointments.tsx`: em novos recebíveis, `valor` = bruto (antes da NFe); manter `valor_bruto` e `percentual_nfe`.
- `Financial.tsx`: ao marcar pago (botão ✓ e dialog de edição), se admin: 
  - recebível com `percentual_nfe` → insert em `expenses` (`tipo: 'despesa'`, `status: 'pendente'`, `categoria: 'Impostos / NFe'`, valor = bruto × % ).
  - recebível de parceiro (`observacao` começa com "Parceiro" / `user_id` ≠ dono do atendimento) → despesa "Repasse Profissional".
  - Vínculo para evitar duplicidade: marcador `[rec:<id>]` no campo `observacao` da despesa; checa antes de inserir; ao voltar para pendente/cancelado, cancela despesa pendente com esse marcador.
- `CashFlow.tsx`: adicionar as 2 categorias à lista.
