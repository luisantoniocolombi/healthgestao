

# Análise: O plano proposto vai funcionar?

## Resposta direta

**Sim, o plano vai resolver a tela branca**, mas quero ser transparente sobre o que cada parte faz:

### O que vai RESOLVER a tela branca (certeza alta)

**ErrorBoundary** -- Este é o item mais importante. Independente da causa exata do erro JavaScript, o ErrorBoundary captura qualquer crash de renderização do React e exibe uma mensagem amigável ao invés de tela branca. Hoje, sem ErrorBoundary, qualquer erro não tratado remove toda a UI.

**Tratamento de erro no PatientDetail** -- A chamada `.single()` na linha 56 pode retornar erro (ex: se a query falhar por qualquer motivo). Hoje o código não verifica `patientRes.error`, o que pode causar comportamento inesperado. Tratar o erro evita o crash.

### O que vai MELHORAR a experiência (mas provavelmente não é a causa da tela branca)

**Políticas RLS de appointments e receivables** -- Hoje o profissional só vê atendimentos e recebíveis onde `user_id = auth.uid()`. Se o admin criou registros com outro user_id, eles não aparecem. Isso causa dados vazios, não crash. Adicionar `is_same_account` melhora a visibilidade de dados, mas provavelmente não é o que causa a tela branca.

## Verificação que fiz

- As políticas RLS são todas PERMISSIVE (não restritivas) -- profissional CONSEGUE ler pacientes da mesma conta
- Foreign keys existem entre as tabelas -- os joins funcionam
- O `useAuth()` carrega role corretamente para profissionais (`role = "profissional"`)

## Recomendação

O plano é sólido e deve ser implementado. O ErrorBoundary sozinho já previne tela branca. Se após a implementação o erro persistir de forma visível (agora com mensagem ao invés de tela branca), teremos informação concreta para diagnosticar a causa exata.

## Passos de implementação

1. Criar `ErrorBoundary` component
2. Aplicar no `AppLayout` envolvendo o `<Outlet />`
3. Adicionar tratamento de erro em `PatientDetail.fetchAll`
4. Migração SQL: adicionar policy `is_same_account(user_id)` SELECT em `appointments` e `receivables`

