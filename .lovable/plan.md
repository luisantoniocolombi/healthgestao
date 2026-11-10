# 3 melhorias: valor fixo da fono, relatório por fono e % da NFe

Nada que já existe é apagado ou alterado. O banco só ganha campos novos e vazios. Atendimentos e cobranças antigos continuam iguais.

## 1. Fono parceira: valor fixo OU %
- No atendimento, ao escolher a fono parceira, aparece a escolha **"%" ou "Valor (R$)"**.
- Com %: funciona como hoje.
- Com valor: a fono recebe esse valor, e a clínica fica com o resto.
- Atendimentos antigos abrem como "%", com o percentual que já tinham.

## 2. Financeiro: relatório de faturamento e repasse por fono
- Nova seção **"Faturamento e Repasses"** (fechada ao abrir a página, como o Resumo por Paciente), no período escolhido (mensal ou semanal):
  - Total faturado (o que os pacientes pagaram ou vão pagar).
  - Total repassado para cada fono, com nome, número de atendimentos, valor pendente e valor pago.
- Novo filtro **"Fono"** com a lista pelo nome. Ele filtra a lista, os totais do topo e o relatório.
- Só o admin vê o relatório de todas. O profissional vê só os próprios valores, como hoje.

## 3. % da NFe
- Ao marcar "Gerar NFe" no atendimento, aparece ao lado o campo **"% NFe"**.
- Ao criar a cobrança, o desconto sai **só da parte da clínica**. A fono recebe sobre o valor cheio.
  - Exemplo: R$ 200, fono 50%, NFe 10% → fono R$ 100; clínica 100 − 20 = R$ 80.
- O Financeiro e o Fluxo de Caixa já mostram o valor com o desconto. A cobrança também guarda o valor bruto e o %, para consulta.
- Cobranças antigas não mudam.

## Detalhes técnicos
Uma única migração, só com campos novos que aceitam vazio (nenhum DROP, nenhuma mudança de tipo, nenhum UPDATE em dados):
```sql
ALTER TABLE public.appointments ADD COLUMN valor_parceiro numeric;          -- valor fixo (null = usa %)
ALTER TABLE public.appointments ADD COLUMN percentual_nfe numeric;
ALTER TABLE public.receivables ADD COLUMN percentual_nfe numeric;
ALTER TABLE public.receivables ADD COLUMN valor_bruto numeric;
```
- `Appointments.tsx`: alternância %/R$ no parceiro; campo `% NFe` ao lado de Gerar NFe; cálculo do split: parceiro = valor fixo ou total×%; principal = (total − parceiro) × (1 − %NFe). Grava `valor_bruto` e `percentual_nfe` só na cobrança da clínica.
- `Financial.tsx`: filtro por profissional (`user_id`, via `profileMap`); card colapsável com faturamento total e repasse agrupado por `user_id` (cobranças com observação "Parceiro"/user diferente do admin).
- `CashFlow.tsx`: não precisa mudar a conta, porque `valor` já vem descontado; só conferir que lê os recebíveis normalmente.
- As regras de acesso atuais continuam valendo, sem mudanças.
