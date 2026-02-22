

# Plano de Correções e Melhorias — FonoGestão

## Resumo dos Itens

| # | Tipo | Descrição |
|---|------|-----------|
| 1 | Bug | Edição de paciente não salva |
| 2 | Feature | Mostrar pacientes arquivados |
| 3 | Feature | Permitir alterar status ativo/inativo (já existe, depende do bug 1) |
| 4 | Feature | Visão diária na aba Atendimentos |
| 5 | Feature | Contadores agendados/realizados/cancelados no mês |
| 6 | Feature | Filtro por mês no financeiro do paciente + exportar evolução em PDF |
| 7 | Bug | Novo recebível dentro do cadastro do paciente |

---

## Detalhamento Técnico

### 1. Bug: Edição de paciente não salva

**Causa raiz:** O `handleSave` envia `...form` que inclui campos do sistema como `id`, `user_id`, `created_at`, `updated_at`, etc. O Supabase rejeita a atualização desses campos. A solução é enviar apenas os campos editáveis.

**Correção em `PatientDetail.tsx`:**
- Extrair somente os campos editáveis no `handleSave`: `nome_completo`, `telefone`, `responsavel_nome`, `endereco`, `doenca_principal`, `status`, `observacoes_gerais`.

---

### 2. Mostrar pacientes arquivados

**Correção em `Patients.tsx`:**
- Adicionar uma opção "Arquivados" no filtro de status existente.
- Quando selecionado, consultar `.eq("archived", true)` em vez de `.eq("archived", false)`.
- Exibir badge "Arquivado" nos cards desses pacientes.

---

### 3. Status ativo/inativo editável

O campo Select de status já existe na aba Dados do paciente (linhas 193-199 de `PatientDetail.tsx`). Ele já funciona com o modo edição. O bug 1 impede o salvamento. Corrigindo o bug 1, essa funcionalidade passa a funcionar automaticamente.

---

### 4. Visão diária na aba Atendimentos

**Correção em `Appointments.tsx`:**
- Ao clicar em um dia do calendário, em vez de redirecionar para "novo atendimento", abrir uma lista dos atendimentos daquele dia logo abaixo do calendário.
- Exibir cards com: horário, nome do paciente, status (com cores), e botão para abrir/editar.
- Manter um botão "Novo Atendimento" dentro da visão diária para criar naquela data.

---

### 5. Contadores agendados/realizados/cancelados

**Correção em `Appointments.tsx`:**
- Adicionar 3 cards acima do calendário mostrando os totais do mês corrente:
  - Agendados (azul)
  - Realizados (verde)
  - Cancelados (vermelho)
- Calcular a partir dos dados de `appointments` já carregados.

---

### 6a. Filtro por mês na aba Financeiro do paciente

**Correção em `PatientDetail.tsx` (aba Financeiro):**
- Adicionar um seletor `<Input type="month">` acima da lista de recebíveis.
- Filtrar localmente os recebíveis pelo mês selecionado.
- Recalcular os cards (Pendente, Pago, Saldo) com base no filtro.

### 6b. Exportar evolução em PDF

**Correção em `PatientDetail.tsx` (aba Evolução):**
- Adicionar filtro de período (data início e data fim).
- Adicionar botão "Exportar PDF".
- Gerar PDF no frontend usando construção manual de Blob com layout HTML:
  - Cabeçalho com nome do paciente e período.
  - Lista cronológica de atendimentos e notas clínicas.
  - Usar `window.print()` com área de impressão estilizada, ou gerar HTML para abrir em nova janela para impressão.

---

### 7. Bug: Novo recebível dentro do cadastro do paciente

**Causa raiz:** O botão "Novo Recebível" navega para `/financeiro/novo?paciente=${id}`, mas essa rota não existe no `App.tsx`.

**Correção em `PatientDetail.tsx`:**
- Substituir a navegação por um Dialog inline (igual ao da página Financeiro).
- O formulário já terá o `patient_id` pré-preenchido.
- Campos: data, valor, forma de pagamento, observação.
- Após salvar, recarregar os dados com `fetchAll()`.

---

## Arquivos Modificados

1. `src/pages/PatientDetail.tsx` — Bugs 1, 7; Features 6a, 6b
2. `src/pages/Patients.tsx` — Feature 2
3. `src/pages/Appointments.tsx` — Features 4, 5

Nenhuma alteração de banco de dados necessária.

