

# Sistema de Gestão para Fonoaudióloga

## Visão Geral
Sistema web responsivo em português (BR) para gestão clínica de fonoaudiologia, cobrindo pacientes, atendimentos/prontuários e financeiro. Backend com Supabase (Postgres, Auth, Storage, Edge Functions).

---

## 🔐 Autenticação e Segurança
- Login com e-mail/senha via Supabase Auth
- Recuperação de senha
- Todos os dados segregados por `user_id` com RLS obrigatório
- Arquivos privados no Storage (segregados por `user_id`)
- Aviso de privacidade no ditado por voz
- Soft delete em todas as entidades (campo `archived`)
- Campos de auditoria: `created_at`, `updated_at`, `created_by`, `updated_by`

---

## 📋 Módulo 1 — Pacientes

### Lista de Pacientes
- Busca por nome, telefone e responsável
- Filtro ativo/inativo
- Botão "Novo Paciente"

### Detalhe do Paciente (4 abas)

**Aba 1 — Dados Cadastrais**
- Nome completo, telefone, endereço, responsável, doença principal, observações, status

**Aba 2 — Condições e Exames**
- Lista de condições clínicas (nome, data início, observação)
- Upload de anexos médicos (título, data, arquivo privado no Storage)

**Aba 3 — Evolução Clínica**
- Linha do tempo dos atendimentos (sem duplicação de dados)
- Preview do prontuário com link para abrir atendimento completo
- Filtro por mês/ano
- Notas clínicas avulsas com anexos opcionais

**Aba 4 — Financeiro do Paciente**
- Cards: atendimentos do mês, total pendente, total pago, saldo
- Tabela editável de recebíveis
- Botões: "Novo Recebível" e "Gerar cobrança a partir de atendimento"

---

## 📅 Módulo 2 — Atendimentos (Prontuários)

### Visões de Calendário
- Dia, Semana e Mês
- Filtros por paciente e status

### Criar/Editar Atendimento
- Campos obrigatórios: paciente, data
- Campos opcionais: hora, texto do prontuário, anexos
- Toggle "Criar cobrança deste atendimento?" com mini-formulário (valor, status, observação)

### 🎤 Ditado por Voz (Web Speech API)
- Botão "Gravar Áudio" no prontuário
- Estados visuais: gravando → processando → pronto
- Transcrição editável antes de salvar
- Botões: Inserir no prontuário, Regravar, Copiar
- Opção de salvar áudio como anexo no Storage
- Aviso de privacidade ao usar ditado
- Fallback para texto manual se microfone indisponível

---

## 💰 Módulo 3 — Financeiro

### Dashboard
- Cards: total atendimentos, a receber, recebido, cancelados, ticket médio
- Tabela de recebíveis com filtros (mês, status, paciente)
- Ações rápidas: marcar como pago, editar, cancelar

### Novo Recebível
- Paciente, data, valor, status, forma de pagamento, observação
- Vínculo opcional com atendimento
- Origem: manual ou via atendimento

### Fechamento do Mês
- Resumo por paciente: atendimentos, cobranças, pendente, pago, saldo
- Exportar CSV
- Gerar PDF via Edge Function (cabeçalho profissional, resumo, tabelas, paginação)

---

## 🗄️ Banco de Dados (Supabase/Postgres)

### Tabelas
- `patients` — dados cadastrais
- `conditions` — condições clínicas (vinculada a paciente)
- `medical_attachments` — anexos médicos (vinculada a paciente)
- `clinical_notes` — notas avulsas (vinculada a paciente)
- `appointments` — atendimentos com campos de transcrição
- `receivables` — recebíveis financeiros

### Segurança
- RLS em todas as tabelas: `auth.uid() = user_id`
- Storage com buckets privados por `user_id`
- Índices otimizados para consultas frequentes

---

## 🧭 Navegação
- Menu lateral responsivo (colapsável em mobile)
- 3 itens: Pacientes, Atendimentos, Financeiro
- Header com nome do profissional e logout

---

## 📱 Responsividade
- Layout adaptável para desktop e mobile
- Tabelas com scroll horizontal em telas pequenas
- Calendário adaptado para mobile

