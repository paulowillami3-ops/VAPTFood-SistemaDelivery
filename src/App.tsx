import { Toaster } from 'react-hot-toast';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { CashierProvider } from './contexts/CashierContext';
import MainLayout from './layouts/MainLayout';
import { UIProvider } from './contexts/UIContext';
import Dashboard from './pages/Dashboard';
import DineInOrders from './pages/DineInOrders';
import Maintenance from './pages/Maintenance';
import PDV from './pages/PDV';
import Performance from './pages/Performance';
import HallManagement from './pages/HallManagement';
import KDS from './pages/KDS';
import KDSView from './pages/KDSView';
import MenuManager from './pages/MenuManager';
import MenuMedia from './pages/MenuMedia';
import DigitalMenuSettings from './pages/DigitalMenuSettings';
import EstablishmentSettings from './pages/EstablishmentSettings';
import OrderSettings from './pages/OrderSettings';
import FeaturedProductsSettings from './components/FeaturedProductsSettings';
import PublicMenu from './pages/PublicMenu';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import Signup from './pages/Signup';
import Collaborators from './pages/Collaborators';
import WaiterHome from './pages/waiter/WaiterHome';
import WaiterLogin from './pages/waiter/WaiterLogin';
import WaiterOrder from './pages/waiter/WaiterOrder';
import WaiterTableDetails from './pages/waiter/WaiterTableDetails';
import WaiterCloseAccount from './pages/waiter/WaiterCloseAccount';
import WaiterDeliveryOrder from './pages/waiter/WaiterDeliveryOrder';
import WaiterSettings from './pages/waiter/WaiterSettings';
import WaiterTeam from './pages/waiter/WaiterTeam';
import WaiterProtectedRoute from './components/WaiterProtectedRoute';
import ProtectedRoute from './components/ProtectedRoute';
import { EstablishmentProvider } from './contexts/EstablishmentContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Hall Settings
import GeneralHallSettings from './pages/HallSettings/General';
import WaitersSettings from './pages/HallSettings/Waiters';
import AppSettings from './pages/HallSettings/App';
import CommandsSettings from './pages/HallSettings/Commands';
import PDVSettings from './pages/HallSettings/PDVSettings';
import ServiceFeeSettings from './pages/HallSettings/ServiceFee';
import QRCodeSettings from './pages/HallSettings/QRCode';
import PrintersSettings from './pages/HallSettings/Printers';
import ScalesSettings from './pages/HallSettings/Scales';

// Layouts
import AdminLayout from './layouts/AdminLayout';

// Admin Inventory
import StockPosition from './pages/Admin/Inventory/StockPosition';
import StockAdjustments from './pages/Admin/Inventory/StockAdjustments';
import StockSupplies from './pages/Admin/Inventory/StockSupplies';
import SalesProducts from './pages/Admin/Inventory/SalesProducts';
import TechSpecs from './pages/Admin/Inventory/TechSpecs';
import StockCategories from './pages/Admin/Inventory/StockCategories';

// Admin Finance
import Expenses from './pages/Admin/Finance/Expenses';
import Payable from './pages/Admin/Finance/Payable';
import Receivable from './pages/Admin/Finance/Receivable';
import PaymentMethods from './pages/Admin/Finance/PaymentMethods';
import CashReconciliation from './pages/Admin/Finance/CashReconciliation';
import FinancialCategories from './pages/Admin/Finance/FinancialCategories';
import BankAccounts from './pages/Admin/Finance/BankAccounts';
import Suppliers from './pages/Admin/Finance/Suppliers';

// Admin Reports
import GeneralReport from './pages/Admin/Reports/GeneralReport';
import CashierReport from './pages/Admin/Reports/CashierReport';
import CashierConciliation from './pages/Admin/Reports/CashierConciliation';
import FinancialReports from './pages/Admin/Reports/FinancialReports';
import StockReports from './pages/Admin/Reports/StockReports';

// Placeholders
import { Users, Invoices, Purchases, Reports } from './pages/Admin/Placeholders';

function App() {
  return (
    <BrowserRouter>
      <EstablishmentProvider>
        <NotificationProvider>
          <UIProvider>
            <CashierProvider>
              <Toaster />
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                <Route path="/:slug">
                  <Route index element={<Navigate to="menu" replace />} />
                  <Route path="cardapio" element={<Navigate to="menu" replace />} />
                  <Route path="menu" element={<PublicMenu />} />

                  {/* Public Waiter Login Route */}
                  <Route path="garcom/login" element={<WaiterLogin />} />

                  <Route element={<WaiterProtectedRoute />}>
                    <Route path="garcom/app" element={<WaiterHome />} />
                    <Route path="garcom/configuracoes" element={<WaiterSettings />} />
                    <Route path="garcom/equipe" element={<WaiterTeam />} />
                    <Route path="garcom/mesa/:id" element={<WaiterOrder />} />
                    <Route path="garcom/mesa/:id/detalhes" element={<WaiterTableDetails />} />
                    <Route path="garcom/mesa/:id/fechar" element={<WaiterCloseAccount />} />
                    <Route path="garcom/pedido/delivery" element={<WaiterDeliveryOrder />} />
                  </Route>

                  {/* Protected Admin Routes */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="admin" element={<MainLayout><Outlet /></MainLayout>}>
                      <Route index element={<Navigate to="orders" replace />} />
                      <Route path="orders" element={<Dashboard />} />
                      <Route path="local-orders/tables" element={<DineInOrders />} />

                      {/* Features to be implemented - Redirecting to Maintenance */}
                      <Route path="pdv" element={<PDV />} />
                      <Route path="scheduled-orders" element={<Maintenance />} />

                      <Route path="menu-manager" element={<MenuManager />} />
                      <Route path="menu-media" element={<MenuMedia />} />
                      <Route path="bulk-edit" element={<Maintenance />} />
                      <Route path="menu-booster" element={<Maintenance />} />
                      <Route path="smart-import" element={<Maintenance />} />

                      <Route path="advanced-management" element={<Maintenance />} />
                      <Route path="performance" element={<Performance />} />
                      <Route path="kds" element={<KDS />} />

                      <Route path="kds/view" element={<KDSView />} />
                      <Route path="robot" element={<Maintenance />} />
                      <Route path="hall-management" element={<HallManagement />} />

                      {/* Hall Settings Pages */}
                      <Route path="hall-settings/general" element={<GeneralHallSettings />} />
                      <Route path="hall-settings/waiters" element={<WaitersSettings />} />
                      <Route path="hall-settings/app" element={<AppSettings />} />
                      <Route path="hall-settings/commands" element={<CommandsSettings />} />
                      <Route path="hall-settings/pdv" element={<PDVSettings />} />
                      <Route path="hall-settings/service-fee" element={<ServiceFeeSettings />} />
                      <Route path="hall-settings/qrcode" element={<QRCodeSettings />} />
                      <Route path="hall-settings/printers" element={<PrintersSettings />} />
                      <Route path="hall-settings/scales" element={<ScalesSettings />} />
                      <Route path="hall-settings" element={<Navigate to="general" replace />} />
                      <Route path="sales-recovery" element={<Maintenance />} />
                      <Route path="cashback" element={<Maintenance />} />
                      <Route path="coupons" element={<Maintenance />} />
                      <Route path="buy-more-get-more" element={<Maintenance />} />
                      <Route path="reports/general" element={<GeneralReport />} />
                      <Route path="reports/cashier" element={<CashierReport />} />
                      <Route path="reports/cashier/:sessionId/conciliation" element={<CashierConciliation />} />
                      <Route path="reports/*" element={<Maintenance />} />
                      <Route path="satisfaction" element={<Maintenance />} />
                      <Route path="payments" element={<Maintenance />} />
                      <Route path="delivery-men" element={<Maintenance />} />
                      <Route path="account" element={<Maintenance />} />
                      <Route path="account/general" element={<Maintenance />} />
                      <Route path="account/personal-info" element={<Maintenance />} />
                      <Route path="account/payment-methods" element={<Maintenance />} />
                      <Route path="account/invoices" element={<Maintenance />} />
                      <Route path="account/plans" element={<Maintenance />} />
                      <Route path="account/collaborators" element={<Collaborators />} />
                      <Route path="settings" element={<Maintenance />} />
                      <Route path="settings/customers" element={<Maintenance />} />
                      <Route path="settings/orders" element={<OrderSettings />} />
                      <Route path="settings/printer" element={<Maintenance />} />
                      <Route path="settings/invoices" element={<Maintenance />} />
                      <Route path="settings/pos" element={<Maintenance />} />
                      <Route path="settings/integrations" element={<Maintenance />} />
                      <Route path="settings/digital-menu" element={<DigitalMenuSettings />} />
                      <Route path="settings/social" element={<Maintenance />} />
                      <Route path="settings/establishment" element={<EstablishmentSettings />} />
                      <Route path="settings/featured" element={<FeaturedProductsSettings />} />
                      <Route path="settings/ads-integration" element={<Maintenance />} />

                      <Route path="help" element={<Maintenance />} />
                      <Route path="suggestions" element={<Maintenance />} />
                      <Route path="terms" element={<Maintenance />} />
                    </Route>

                    <Route path="management" element={<AdminLayout />}>
                      <Route index element={<Navigate to="inventory/stock-position" replace />} />
                      <Route path="inventory">
                        <Route index element={<Navigate to="stock-position" replace />} />
                        <Route path="stock-position" element={<StockPosition />} />
                        <Route path="adjustments" element={<StockAdjustments />} />
                        <Route path="supplies" element={<StockSupplies />} />
                        <Route path="products" element={<SalesProducts />} />
                        <Route path="tech-specs" element={<TechSpecs />} />
                        <Route path="categories" element={<StockCategories />} />
                      </Route>

                      <Route path="finance">
                        <Route index element={<Expenses />} />
                        <Route path="expenses" element={<Expenses />} />
                        <Route path="payable" element={<Payable />} />
                        <Route path="receivable" element={<Receivable />} />
                        <Route path="payment-methods" element={<PaymentMethods />} />
                        <Route path="reconciliation" element={<CashReconciliation />} />
                        <Route path="categories" element={<FinancialCategories />} />
                        <Route path="bank-accounts" element={<BankAccounts />} />
                        <Route path="suppliers" element={<Suppliers />} />
                      </Route>
                      <Route path="invoices/*" element={<Invoices />} />
                      <Route path="purchases/*" element={<Purchases />} />
                      <Route path="reports">
                        <Route path="finance" element={<FinancialReports />} />
                        <Route path="stock" element={<StockReports />} />
                        <Route path="*" element={<Reports />} />
                      </Route>
                      <Route path="users" element={<Users />} />
                      <Route path="cashier" element={<Maintenance />} />
                    </Route>
                  </Route>
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </CashierProvider>
          </UIProvider>
        </NotificationProvider>
      </EstablishmentProvider>
    </BrowserRouter >
  );
}

export default App;
