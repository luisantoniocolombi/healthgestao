

# Problema: Seu usuário existente não tem perfil nem role

As tabelas `profiles` e `user_roles` retornam **404** (não existem no banco). Isso significa que a migração SQL da Fase 1 ainda não foi executada, ou falhou.

Mesmo que as tabelas existam, o trigger `on_auth_user_created` só dispara para **novos** cadastros. Seu usuário já existia antes da migração, então ele não tem entrada em `profiles` nem em `user_roles`.

## Plano de Correção

### Passo 1: Verificar se as tabelas existem
Executar uma query para confirmar se `profiles` e `user_roles` foram criadas.

### Passo 2: Inserir dados do usuário existente
Executar uma migração SQL que:

1. Cria o perfil do seu usuário na tabela `profiles`:
   - `id` = seu user_id (`b1914198-00fe-491c-9276-8520db94ef16`)
   - `nome` = extraído do email
   - `conta_principal_id` = o próprio id (pois é admin)
   - `cor_identificacao` = cor padrão

2. Insere o role `admin` na tabela `user_roles`:
   - `user_id` = seu user_id
   - `role` = 'admin'

Ambos os inserts usarão `ON CONFLICT DO NOTHING` para segurança.

### Passo 3: Verificar o AuthContext
O `AuthContext` já busca `profiles` e `user_roles` após login. Com os dados inseridos, o sistema reconhecerá automaticamente que você é admin e exibirá os menus corretos (Financeiro, Profissionais).

### Arquivos modificados
- Apenas uma migração SQL (nenhum arquivo de código alterado)

