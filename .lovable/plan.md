

# Plano: Melhorar perfil do profissional + Corrigir erros de tela branca

Recomendo fazer **tudo junto** em uma única implementação, pois os dois temas afetam as mesmas páginas e o mesmo fluxo.

---

## Parte 1: Perfil detalhado do profissional

### 1.1 Adicionar coluna `email` na tabela `profiles`
A tabela já tem `cpf` e `registro_profissional`. Falta apenas `email`.
- Migração SQL: `ALTER TABLE profiles ADD COLUMN email text;`
- Atualizar o trigger `on_auth_user_created` para salvar o email do usuário no profile

### 1.2 Preencher email dos profissionais existentes via convite
- Migração: `UPDATE profiles SET email = invitations.email FROM invitations WHERE ...` para preencher retroativamente

### 1.3 Atualizar `Profile` type em `src/types/index.ts`
- Adicionar `email?: string`

### 1.4 Atualizar `Professionals.tsx` - Cards com campos editáveis
- Exibir **email** (read-only ou editável), **CPF** (com máscara), **Registro Profissional** nos cards
- Adicionar mutation `updateProfile` genérica que faz UPDATE de nome, cpf, registro_profissional, email, cor
- Transformar card em formato mais detalhado com os novos campos inline editáveis

### 1.5 Atualizar edge function `invite-professional`
- Salvar email no profile ao aceitar convite (se não já feito)

---

## Parte 2: Corrigir erros de tela branca no painel do profissional

### 2.1 Adicionar `try-catch` em `PatientDetail.tsx` (`fetchAll`)
- Envolver `Promise.all` em try-catch com toast de erro e `setLoading(false)`

### 2.2 Adicionar `try-catch` em `Appointments.tsx` (`fetchData`)
- Envolver `Promise.all` em try-catch

### 2.3 Adicionar `try-catch` em `Patients.tsx` (`fetchPatients`)
- Já tem tratamento parcial, mas falta try-catch no nível externo

### 2.4 Proteger ações de escrita em `PatientDetail.tsx`
- `handleSave` e `handleArchive`: verificar se o profissional tem permissão (é dono ou admin) antes de executar
- Esconder botões "Editar" e "Arquivar" para profissionais que não são donos do paciente

---

## Arquivos afetados
- `src/types/index.ts` - adicionar email ao Profile
- `src/pages/Professionals.tsx` - campos editáveis + try-catch
- `src/pages/PatientDetail.tsx` - try-catch + proteção de escrita
- `src/pages/Appointments.tsx` - try-catch
- `src/pages/Patients.tsx` - try-catch
- Migração SQL - email na profiles + update trigger
- Edge function `accept-invitation` - salvar email

