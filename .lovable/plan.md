

# Analise Completa do Sistema Health Gestao

## Bug Encontrado

### Atendimentos: Admin sobrescreve user_id ao editar

Em `src/pages/Appointments.tsx` (linha 390), o payload de UPDATE inclui `user_id: user.id` incondicionalmente. Quando um admin edita o atendimento de um profissional, isso muda a propriedade do registro para o admin, quebrando a hierarquia de dados.

Compare com `PatientDetail.tsx` (linha 92) que faz corretamente:
```tsx
if (isAdmin && user_id) updateData.user_id = user_id;
```

**Correcao**: No `AppointmentForm`, ao fazer UPDATE, nao incluir `user_id` no payload. Ao fazer INSERT, manter `user_id: user.id`. Somente o campo `updated_by` deve ser atualizado.

### Arquivo: `src/pages/Appointments.tsx`
- Separar o payload de update do de insert
- No update: remover `user_id: user.id` do payload (preservar o dono original)
- No insert: manter `user_id: user.id`

---

## Resumo de Protecao de Dados

### Autenticacao
- Login/Signup com Supabase Auth ✓
- Rotas protegidas via `ProtectedRoute` ✓
- Loading state antes de renderizar ✓
- Reset de senha funcional ✓

### Row Level Security (RLS) - Todas as tabelas
| Tabela | SELECT | INSERT | UPDATE | DELETE |
|--------|--------|--------|--------|--------|
| patients | same_account | own | own + admin | own |
| appointments | same_account | own | own + admin | own (via ALL) |
| receivables | same_account | own | own + admin | own (via ALL) |
| clinical_notes | same_account | own | own | own |
| conditions | same_account | own | own | own |
| medical_attachments | same_account | own | own | own |
| expenses | admin only | admin | admin | admin |
| profiles | own + same_account | trigger only | admin | bloqueado |
| user_roles | own | bloqueado | bloqueado | bloqueado |
| invitations | public read, admin write | admin | admin | admin |

### Segregacao de Dados
- `conta_principal_id` em todas as tabelas relevantes ✓
- Funcoes `is_same_account()` e `get_my_conta_principal_id()` como SECURITY DEFINER ✓
- `has_role()` como SECURITY DEFINER (evita recursao) ✓

### Interface
- Sidebar oculta Financeiro/Caixa/Profissionais para nao-admins ✓
- Rotas acessiveis diretamente retornam dados vazios (RLS protege) ✓
- ErrorBoundary com key por rota ✓
- forwardRef em todos os componentes de pagina ✓
- DialogDescription em todos os dialogs ✓

### Storage
- Buckets `medical-files` e `audio-recordings` privados ✓

### Edge Functions
- `invite-professional` e `accept-invitation` com logica server-side ✓

### Pontos Seguros
- Roles em tabela separada (`user_roles`) ✓
- Nenhum dado sensivel exposto via SELECT ✓
- Soft delete via campo `archived` ✓
- Trigger `on_auth_user_created` para auto-provisionar perfil e role ✓

---

## Unica Correcao Necessaria

Arquivo `src/pages/Appointments.tsx`: separar payload de UPDATE para nao sobrescrever `user_id`, preservando a propriedade original do atendimento.

