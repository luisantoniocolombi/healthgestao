# CPF/CNPJ e novos convênios no cadastro do paciente

Nada muda no banco de dados. Os dados que já estão lá continuam iguais.

## 1. Escolher entre CPF e CNPJ
- No cadastro e na edição do paciente, um seletor "CPF / CNPJ" fica ao lado do campo do documento.
- CPF usa o formato 000.000.000-00. CNPJ usa o formato 00.000.000/0000-00.
- O número é guardado no mesmo lugar onde o CPF já é guardado hoje.
- Ao abrir um paciente, o sistema descobre sozinho o tipo de documento pela quantidade de números (11 = CPF, 14 = CNPJ).
- Os pacientes que já estão cadastrados continuam aparecendo como CPF.

## 2. Adicionar novos convênios
- A lista de convênios continua com Particular, Unimed, GAP e Outros.
- No fim da lista entra a opção "+ Novo convênio". Ela abre um campo para digitar o nome.
- Quando você salva o paciente, o novo convênio fica gravado nele. A partir daí, ele aparece na lista para todos da conta, porque a lista também junta os convênios que já foram usados em outros pacientes.
- Isso vale para o cadastro e para a edição do paciente.

## Limitação
- Um convênio novo só fica na lista depois de ser salvo em pelo menos um paciente. Se você digitar um nome e não salvar o paciente, ele não fica na lista.

## Detalhes técnicos
- Arquivos: `src/pages/PatientForm.tsx` e `src/pages/PatientDetail.tsx`. Um pequeno hook `useConvenios` busca os valores distintos de `patients.convenio` da conta (regra de acesso `is_same_account`) e junta com a lista padrão.
- O documento continua na coluna `cpf` (text). O tipo é tirado da quantidade de dígitos, então não precisa de coluna nova.
- O nome do convênio novo é salvo com a primeira letra maiúscula e sem espaços sobrando. Se o nome já existir na lista, o sistema usa o que já está lá, sem criar outro igual.
