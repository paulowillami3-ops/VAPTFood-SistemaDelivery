import { Toaster } from 'react-hot-toast';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { CashierProvider } from './contexts/CashierContext';
import MainLayout from './layouts/MainLayout';
import { UIProvider } from './contexts/UIContext';
import PublicMenu from './pages/PublicMenu';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import Signup from './pages/Signup';
import Collaborators from './pages/Collaborators';
import MobileSettingsPage from './pages/MobileSettingsPage';
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

// Core Pages
import Dashboard from './pages/Dashboard';
import DineInOrders from './pages/DineInOrders';
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

// Admin Reports
import GeneralReport from './pages/Admin/Reports/GeneralReport';
import CashierReport from './pages/Admin/Reports/CashierReport';
import CashierConciliation from './pages/Admin/Reports/CashierConciliation';

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
                      <Route path="pdv" element={<PDV />} />

                      <Route path="menu-manager" element={<MenuManager />} />
                      <Route path="menu-media" element={<MenuMedia />} />

                      <Route path="performance" element={<Performance />} />
                      <Route path="kds" element={<KDS />} />
                      <Route path="kds/view" element={<KDSView />} />

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

                      <Route path="reports/general" element={<GeneralReport />} />
                      <Route path="reports/cashier" element={<CashierReport />} />
                      <Route path="reports/cashier/:sessionId/conciliation" element={<CashierConciliation />} />

                      <Route path="account/collaborators" element={<Collaborators />} />

                      <Route path="settings" element={<MobileSettingsPage />} />
                      <Route path="settings/orders" element={<OrderSettings />} />
                      <Route path="settings/digital-menu" element={<DigitalMenuSettings />} />
                      <Route path="settings/establishment" element={<EstablishmentSettings />} />
                      <Route path="settings/featured" element={<FeaturedProductsSettings />} />
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
