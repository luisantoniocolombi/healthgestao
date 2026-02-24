

# Plano: 3 novas funcionalidades

## 1. Campo "Convênio" no perfil do paciente

### Banco de dados
- Adicionar coluna `convenio` (text, nullable) na tabela `patients`

### Frontend
- **PatientForm.tsx**: Adicionar Select com opcoes "particular", "unimed", "outros"
- **PatientDetail.tsx** (aba Dados): Adicionar o mesmo Select no formulario de edicao
- **Patients.tsx**: Exibir o convenio como badge no card do paciente

---

## 2. Checkbox "Gerar NFe" no atendimento + filtro no financeiro

### Banco de dados
- Adicionar coluna `gerar_nfe` (boolean, default false) na tabela `appointments`
- Adicionar coluna `gerar_nfe` (boolean, default false) na tabela `receivables` (para propagar a marcacao ao recebivel criado)

### Frontend
- **Appointments.tsx (AppointmentForm)**: Adicionar checkbox "Gerar NFe" no formulario. Quando o recebivel e criado junto com o atendimento, propagar o valor de `gerar_nfe` para o recebivel
- **Financial.tsx**: Adicionar filtro "NFe" (todos / somente NFe / sem NFe). Adicionar card no dashboard com total de NFe a gerar e valor correspondente
- **PatientDetail.tsx** (aba Financeiro): Exibir indicador de NFe nos recebiveis
- **Tipo Appointment** e **Receivable** em `types/index.ts`: Adicionar campo `gerar_nfe`

---

## 3. Atendimento compartilhado com profissional parceiro

### Banco de dados
- Adicionar coluna `profissional_parceiro_id` (uuid, nullable) na tabela `appointments`
- Adicionar coluna `percentual_parceiro` (numeric, nullable, default 50) na tabela `appointments`

### Frontend
- **PatientDetail.tsx** (aba Dados ou secao dedicada): Adicionar opcao para selecionar profissional parceiro. Listar profissionais da mesma conta usando `useAccountProfiles`
- **Appointments.tsx (AppointmentForm)**: Adicionar campo para selecionar profissional parceiro e definir percentual de divisao (padrao 50%). Quando "Criar cobranca" estiver ativo e houver parceiro selecionado, criar **2 recebiveis**: um para o profissional logado (50%) e outro para o parceiro (50%), cada um com seu respectivo `user_id`
- **Tipo Appointment** em `types/index.ts`: Adicionar campos `profissional_parceiro_id` e `percentual_parceiro`

### Logica de divisao
Ao salvar atendimento com cobranca + parceiro:
1. Recebivel 1: `user_id = usuario logado`, `valor = valor * (100 - percentual) / 100`
2. Recebivel 2: `user_id = parceiro`, `valor = valor * percentual / 100`
Ambos com mesmo `appointment_id` e `patient_id`

---

## Resumo de alteracoes

| Arquivo | Alteracao |
|---|---|
| **Migracao SQL** | Adicionar colunas: `patients.convenio`, `appointments.gerar_nfe`, `appointments.profissional_parceiro_id`, `appointments.percentual_parceiro`, `receivables.gerar_nfe` |
| `src/types/index.ts` | Adicionar campos nos tipos Patient, Appointment, Receivable |
| `src/pages/PatientForm.tsx` | Campo Select para convenio |
| `src/pages/PatientDetail.tsx` | Campo convenio na aba Dados; indicador NFe na aba Financeiro; seletor de profissional parceiro |
| `src/pages/Appointments.tsx` | Checkbox NFe + seletor de parceiro no AppointmentForm; logica de split no submit |
| `src/pages/Financial.tsx` | Filtro NFe; card com totais de NFe |
| `src/pages/Patients.tsx` | Exibir convenio no card |

