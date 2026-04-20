# Backlog de Funcionalidades Ocultas (Futuro)

Este arquivo documenta todas as páginas, rotas e itens de menu que foram ocultados durante a limpeza "Lean" do sistema. Use esta lista como referência para restaurar funcionalidades conforme o sistema evoluir.

## 1. Rotas e Páginas Desativadas (App.tsx)

As seguintes rotas foram removidas ou comentadas no arquivo `src/App.tsx`:

- **Gestão Diária**:
    - `scheduled-orders`: Pedidos Agendados
    - `bulk-edit`: Edição em Massa
    - `menu-booster`: Potencializador de Cardápio
    - `smart-import`: Importação Inteligente
    - `robot`: Robô de Atendimento
- **Gestão Avançada / Módulo Management**:
    - `management/inventory/*`: Controle de Estoque, Ajustes, Suprimentos, Produtos, Categorias de Estoque.
    - `management/tech-specs`: Ficha Técnica.
    - `management/finance/*`: Despesas, Contas a Pagar/Receber, Métodos de Pagamento, Conciliação, Bancos, Fornecedores.
    - `management/invoices/*`: Notas Fiscais.
    - `management/purchases/*`: Compras.
    - `management/reports/*`: Relatórios Financeiros e de Estoque.
    - `management/users`: Gestão de Usuários (Admin).
    - `management/cashier`: Controle de Caixa Avançado.
- **Venda Mais**:
    - `sales-recovery`: Recuperador de Vendas.
    - `coupons`: Gestão de Cupons.
- **Análises & Feedbacks**:
    - `satisfaction`: Pesquisas de Satisfação.
    - `reports/customers`, `reports/entries`, `reports/orders`, `reports/tables`, `reports/cupons`: Relatórios específicos.
- **Configurações Específicas**:
    - `payments`: Configurações de Pagamento.
    - `delivery-men`: Gestão de Entregadores.
    - `settings/customers`: Meus Clientes.
    - `settings/printer`: Configurações de Impressora.
    - `settings/invoices`: Configurações de Nota Fiscal.
    - `settings/pos`: Frente de Caixa (Config).
    - `settings/integrations`: Integrações Externas.
    - `settings/social`: Redes Sociais.
    - `settings/ads-integration`: Integração de Anúncios.
- **Central de Ajuda**:
    - `help`, `suggestions`, `terms`.

## 2. Itens de Menu (Sidebar.tsx)

Os ícones e links correspondentes às rotas acima foram removidos dos `menuItems` no componente Sidebar.
- **Seções Removidas**: "Venda Mais", "Central VAPT Food".
- **Submenus Reduzidos**: "Gestor de Cardápio", "Gestão Avançada", "Relatórios", "Configurações".

## 3. Menu Mobile (MobileSettingsPage.tsx)

A lista de configurações no mobile foi simplificada, removendo os mesmos itens acima para garantir consistência entre Desktop e Mobile.

---

**Nota**: Para restaurar qualquer uma dessas páginas, será necessário:
1. Re-adicionar a `<Route>` no `src/App.tsx`.
2. Restaurar o ícone no `import` de `src/components/Sidebar.tsx` e re-adicionar o item no array `menuItems`.
3. Adicionar o item de volta ao array `sections` em `src/pages/MobileSettingsPage.tsx`.
