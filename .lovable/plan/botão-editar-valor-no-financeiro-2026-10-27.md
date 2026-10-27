# Botão "Editar valor" no Financeiro

## Resposta curta
Sim, é seguro. Não é preciso mudar nada no banco de dados: nenhuma tabela, coluna ou regra de acesso nova. Só muda a tela do Financeiro. Nenhum dado existente é apagado ou alterado, a não ser o valor que você editar de propósito.

## O que muda para você
- Cada recebível na lista do Financeiro ganha um botão de lápis (Editar).
- Ao clicar, abre uma janela pequena com o valor atual preenchido.
- Você digita o novo valor e clica em "Salvar". O valor do recebível é atualizado e a lista e os totais do topo são recalculados.
- Se o valor ficar vazio, for zero ou negativo, o sistema avisa e não salva.

## Quem pode editar
Valem as mesmas regras de acesso de hoje:
- O profissional edita só os próprios recebíveis.
- O admin edita os recebíveis da conta toda.

## O que não muda
- O banco de dados: estrutura, dados existentes e regras de acesso.
- O atendimento ligado ao recebível.
- Status, data, forma de pagamento e o resto da tela.

## Detalhes técnicos
- Arquivo: só `src/pages/Financial.tsx`.
- Novos estados: `editDialog` (o recebível em edição, ou null) e `editValor`.
- Nova função `updateValor`: `supabase.from("receivables").update({ valor, updated_by: user.id }).eq("id", id)`, seguida de toast e `fetchData()`.
- Botão com ícone `Edit` (já importado) ao lado de Check/X, visível em todos os status.
- O `Dialog` usa os componentes que já estão importados.
- As regras de acesso atuais ("Users manage own receivables" e "Admins update receivables in same account") já permitem essa alteração.
