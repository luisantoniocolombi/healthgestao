

# Plano: Adicionar campos editaveis ao card do profissional (nome, CPF, registro profissional)

## 1. Migração de banco de dados

Adicionar duas colunas na tabela `profiles`:
- `cpf` (text, nullable)
- `registro_profissional` (text, nullable)

## 2. Atualizar tipo Profile (`src/types/index.ts`)
Adicionar `cpf?: string` e `registro_profissional?: string` à interface `Profile`.

## 3. Refatorar página Professionals (`src/pages/Professionals.tsx`)

Tornar os cards dos profissionais editaveis:
- Campo **Nome** editavel inline (Input)
- Campo **CPF** com mascara (XXX.XXX.XXX-XX)
- Campo **Registro Profissional** (texto livre, ex: CRM, CRO, CRP)
- Criar uma mutation genérica `updateProfile` que atualiza qualquer campo do profissional
- Usar estado local por card com debounce ou botao salvar para evitar chamadas excessivas

