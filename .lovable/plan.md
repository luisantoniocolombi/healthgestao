

# Plano: Filtro por nome de paciente na tela de Atendimentos

## Alteracao

**Arquivo: `src/pages/Appointments.tsx`**

1. Adicionar estado `patientFilter` (string) para armazenar o ID do paciente selecionado no filtro
2. Adicionar um campo Select/Combobox abaixo do header (ao lado do botao "Novo Atendimento") com a lista de pacientes ja carregada em `patients`, permitindo buscar pelo nome
3. Quando um paciente for selecionado no filtro:
   - Filtrar o array `appointments` para mostrar apenas os atendimentos daquele paciente no mes corrente
   - Os contadores mensais (Agendados, Realizados, Cancelados) refletem apenas os atendimentos filtrados
   - O calendario e a lista diaria mostram apenas os atendimentos do paciente selecionado
4. Adicionar opcao "Todos os pacientes" para limpar o filtro e voltar a exibir todos
5. O filtro sera posicionado entre o header e os contadores mensais, com layout responsivo

Nenhuma alteracao de banco de dados necessaria — os dados ja estao sendo carregados.

