

# Plano: Corrigir tela branca na conta dos profissionais

## Diagnóstico

Analisei o código e as políticas RLS do banco de dados. Identifiquei os seguintes problemas que podem causar tela branca para profissionais:

### Problema principal
A página `PatientDetail` não possui tratamento de erro. Se qualquer query falhar (ex: RLS bloqueando acesso), o componente pode crashar sem feedback, resultando em tela branca. React sem Error Boundary remove toda a UI no caso de erros não tratados.

### Problemas complementares de RLS
- Tabela `appointments`: profissional só lê registros próprios (`user_id = auth.uid()`), mas falta uma policy `is_same_account` para SELECT que permita ver atendimentos de toda a conta
- Tabela `receivables`: mesma situação - falta policy `is_same_account` para SELECT para profissionais

## Solução

### 1. Criar componente ErrorBoundary (`src/components/ErrorBoundary.tsx`)
- Componente React class que captura erros de rendering
- Exibe mensagem amigável ao invés de tela branca
- Botão para voltar à página anterior

### 2. Aplicar ErrorBoundary no AppLayout (`src/components/AppLayout.tsx`)
- Envolver o `<Outlet />` com o ErrorBoundary

### 3. Adicionar tratamento de erro em PatientDetail (`src/pages/PatientDetail.tsx`)
- Tratar erros retornados pelo Supabase em `fetchAll`
- Se `patientRes.error` existir, mostrar mensagem de erro ao invés de tela branca

### 4. Corrigir políticas RLS (migração SQL)
- Adicionar policy `is_same_account(user_id)` SELECT em `appointments` para profissionais
- Adicionar policy `is_same_account(user_id)` SELECT em `receivables` para profissionais
- Garantir que profissionais vejam dados de toda a conta (como já funciona para `patients`, `conditions`, `clinical_notes`)

