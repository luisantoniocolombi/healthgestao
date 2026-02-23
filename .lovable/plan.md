

# Sistema Multiusuario com Hierarquia Admin/Profissional

## Decisao Arquitetural Importante

Em vez de **duplicar fisicamente** os atendimentos (espelhamento), vamos usar uma abordagem mais robusta: adicionar `conta_principal_id` em todas as tabelas e ajustar as politicas de seguranca (RLS) para que o Administrador veja todos os registros dos profissionais vinculados. Isso evita:

- Duplicacao de dados e inconsistencias
- Problemas de sincronizacao entre registros espelhados
- Dobro de armazenamento desnecessario

O resultado final e identico: o Admin ve tudo consolidado, o Profissional ve so o dele.

---

## Fase 1: Banco de Dados (Migracao SQL)

### 1.1 Tabela `profiles`
```text
profiles
  id (UUID, PK, references auth.users ON DELETE CASCADE)
  nome (TEXT, NOT NULL)
  cor_identificacao (TEXT, default '#3b82f6')
  conta_principal_id (UUID, references profiles.id)
  ativo (BOOLEAN, default true)
  created_at, updated_at
```
- Se admin: `conta_principal_id = id` (proprio)
- Se profissional: `conta_principal_id = id do admin`
- Trigger para criar profile automaticamente no signup

### 1.2 Tabela `user_roles` (conforme requisito de seguranca)
```text
user_roles
  id (UUID, PK)
  user_id (UUID, references auth.users ON DELETE CASCADE)
  role (app_role ENUM: 'admin', 'profissional')
  UNIQUE(user_id, role)
```
- Todo usuario que se cadastra diretamente recebe role `admin`
- Profissional criado via convite recebe role `profissional`

### 1.3 Tabela `invitations`
```text
invitations
  id (UUID, PK)
  admin_id (UUID, NOT NULL)
  email (TEXT, NOT NULL)
  nome_profissional (TEXT)
  cor_identificacao (TEXT)
  token (TEXT, UNIQUE)
  status ('pendente', 'aceito', 'expirado')
  created_at, expires_at
```

### 1.4 Funcao de seguranca `has_role`
Funcao `SECURITY DEFINER` para verificar roles sem recursao RLS.

### 1.5 Funcao `get_conta_principal_id`
Funcao `SECURITY DEFINER` que retorna o `conta_principal_id` do usuario autenticado. Usada nas politicas RLS.

### 1.6 Alterar tabelas existentes
Adicionar `conta_principal_id` em:
- `patients`
- `appointments`
- `conditions`
- `clinical_notes`
- `medical_attachments`
- `receivables`

Adicionar `profissional_id` em:
- `appointments` (quem realizou o atendimento)
- `receivables` (quem gerou a cobranca)

Preencher os registros existentes: `conta_principal_id = user_id` e `profissional_id = user_id`.

Tornar `conta_principal_id` NOT NULL apos preenchimento.

### 1.7 Novas politicas RLS
Substituir as politicas atuais por:

**Pacientes (e tabelas filhas):**
- SELECT: `conta_principal_id = get_conta_principal_id(auth.uid())` (admin ve tudo da clinica, profissional tambem ve pacientes compartilhados)
- INSERT: usuario autenticado, `conta_principal_id` preenchido
- UPDATE/DELETE: admin pode tudo na clinica; profissional so os proprios

**Atendimentos:**
- SELECT Admin: `conta_principal_id = auth.uid()` (ve todos)
- SELECT Profissional: `user_id = auth.uid()` (ve so os seus)
- INSERT: `user_id = auth.uid()`
- UPDATE/DELETE: dono do registro ou admin

**Financeiro:**
- Admin: ve tudo consolidado
- Profissional: ve so os proprios

### 1.8 Indices
Novos indices em `conta_principal_id` para performance.

---

## Fase 2: Edge Function para Convites

### `invite-professional`
- Recebe: email, nome, cor
- Valida que o usuario autenticado e admin
- Cria registro na tabela `invitations` com token unico
- Gera link de convite: `{origin}/signup?token={token}`
- Retorna o link para o admin copiar/enviar

---

## Fase 3: Fluxo de Cadastro via Convite

### Pagina `/signup` (novo componente)
- Se tem `?token=` na URL: busca o convite, mostra nome do admin
- Campos: email (pre-preenchido se possivel), senha
- Ao criar conta:
  1. `supabase.auth.signUp()`
  2. Edge function `accept-invitation` que:
     - Cria profile com `conta_principal_id` do admin
     - Insere role `profissional` em `user_roles`
     - Atualiza convite para `aceito`

---

## Fase 4: Interface do Administrador

### 4.1 Pagina de Gestao de Profissionais (`/profissionais`)
- Lista profissionais vinculados (da tabela `profiles` onde `conta_principal_id = admin_id`)
- Botao "Convidar Profissional" abre dialog com: nome, email, seletor de cor
- Mostra link gerado para copiar
- Permite ativar/desativar profissional
- Permite alterar cor

### 4.2 Menu lateral (AppSidebar)
- Item "Profissionais" visivel apenas para admins

### 4.3 Filtro por Profissional
- Na pagina de Atendimentos: adicionar dropdown "Profissional" para filtrar
- Na pagina Financeiro: idem
- No detalhe do paciente: mostrar qual profissional atendeu

### 4.4 Identificacao Visual por Cor
- Nos cards de atendimento do calendario: borda lateral colorida com a cor do profissional
- Na visao diaria: tag com nome e cor do profissional
- Na lista financeira: indicador de cor do profissional

---

## Fase 5: Logica de Dados no Frontend

### 5.1 AuthContext atualizado
- Apos login, buscar `profiles` e `user_roles` do usuario
- Expor: `role`, `profile`, `isAdmin`, `contaPrincipalId`

### 5.2 Queries condicionais
- Admin: consultas filtram por `conta_principal_id`
- Profissional: consultas filtram por `user_id` (como hoje)

### 5.3 Inserts atualizados
- Ao criar paciente/atendimento/recebivel: preencher `conta_principal_id` automaticamente
- Ao criar atendimento: preencher `profissional_id = user.id`

### 5.4 Restricoes de UI
- Profissional: esconder menu "Financeiro" (global) e "Profissionais"
- Profissional: na aba financeira do paciente, ver apenas seus proprios recebíveis

---

## Arquivos a Criar/Modificar

| Arquivo | Acao |
|---------|------|
| Migracao SQL | Criar tabelas profiles, user_roles, invitations + alterar 6 tabelas existentes + novas RLS |
| `supabase/functions/invite-professional/index.ts` | Criar edge function |
| `supabase/functions/accept-invitation/index.ts` | Criar edge function |
| `src/contexts/AuthContext.tsx` | Adicionar role, profile, isAdmin, contaPrincipalId |
| `src/pages/Professionals.tsx` | Criar pagina de gestao |
| `src/pages/Login.tsx` | Adicionar fluxo de convite (signup com token) |
| `src/components/AppSidebar.tsx` | Menu condicional por role |
| `src/components/AppLayout.tsx` | Mostrar nome do profissional no header |
| `src/pages/Patients.tsx` | Query por conta_principal_id para admin |
| `src/pages/PatientDetail.tsx` | Preencher conta_principal_id nos inserts |
| `src/pages/PatientForm.tsx` | Preencher conta_principal_id |
| `src/pages/Appointments.tsx` | Filtro por profissional, cor nos cards, query condicional |
| `src/pages/Financial.tsx` | Filtro por profissional, visibilidade condicional |
| `src/types/index.ts` | Novos tipos Profile, Invitation, UserRole |
| `src/App.tsx` | Nova rota /profissionais |

---

## Ordem de Implementacao

1. Migracao SQL (tabelas, funcoes, RLS)
2. Edge functions (invite + accept)
3. AuthContext (role/profile)
4. Tipos TypeScript
5. Pagina de Profissionais
6. Login com fluxo de convite
7. Sidebar condicional
8. Queries condicionais em Pacientes, Atendimentos, Financeiro
9. Identificacao visual por cor
10. Testes

