import { Fragment } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useEstablishment } from '../contexts/EstablishmentContext';
import {
    BarChart3,
    FileText,
    ShoppingCart,
    Package,
    Users,
    Settings,
    HelpCircle,
    ChevronRight,
    Volume2
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';

const AdminSidebar = () => {
    const location = useLocation();

    interface SubMenuItem {
        label: string;
        path: string;
        badge?: string;
    }

    interface MenuItem {
        icon: any;
        label: string;
        path: string;
        subItems?: SubMenuItem[];
    }

    const { establishment } = useEstablishment();
    const urlSlug = location.pathname.split('/')[1];
    const slug = establishment.slug || urlSlug || 'noia-burguer'; // Dynamic slug recovery

    const menuItems: MenuItem[] = [
        {
            icon: BarChart3,
            label: "Financeiro",
            path: `/${slug}/admin/finance`,
            subItems: [
                { label: "Despesas Operacionais", path: `/${slug}/admin/finance/expenses` },
                { label: "Contas a Pagar", path: `/${slug}/admin/finance/payable` },
                { label: "Contas a Receber", path: `/${slug}/admin/finance/receivable` },
                { label: "Formas de pagamento", path: `/${slug}/admin/finance/payment-methods` },
                { label: "Conciliação de Caixa", path: `/${slug}/admin/finance/reconciliation` },
                { label: "Categorias financeiras", path: `/${slug}/admin/finance/categories` },
                { label: "Contas Bancárias", path: `/${slug}/admin/finance/bank-accounts` },
                { label: "Fornecedores", path: `/${slug}/admin/finance/suppliers` },
            ]
        },
        {
            icon: FileText,
            label: "Notas Fiscais",
            path: `/${slug}/admin/invoices`,
            subItems: [
                { label: "Emitir Notas", path: `/${slug}/admin/invoices/issue` },
                { label: "Exportar Notas", path: `/${slug}/admin/invoices/export` },
                { label: "Configuração NFCe", path: `/${slug}/admin/invoices/config` },
                { label: "Categorias tributárias", path: `/${slug}/admin/invoices/tax-categories` },
            ]
        },
        {
            icon: ShoppingCart,
            label: "Compras",
            path: `/${slug}/admin/purchases`,
            subItems: [
                { label: "Lançar NF Manualmente", path: `/${slug}/admin/purchases/manual` },
                { label: "Importar NF via Manifesto", path: `/${slug}/admin/purchases/manifest` },
                { label: "Importar NF via Chave", path: `/${slug}/admin/purchases/key` },
                { label: "Importar NF via XML", path: `/${slug}/admin/purchases/xml` },
            ]
        },
        {
            icon: Package,
            label: "Estoque",
            path: `/${slug}/admin/inventory`,
            subItems: [
                { label: "Posição de Estoque", path: `/${slug}/admin/inventory/stock-position` },
                { label: "Ajustes de Estoque", path: `/${slug}/admin/inventory/adjustments` },
                { label: "Insumos de estoque", path: `/${slug}/admin/inventory/supplies` },
                { label: "Produtos de venda", path: `/${slug}/admin/inventory/products` },
                { label: "Ficha Técnica", path: `/${slug}/admin/inventory/tech-specs` },
                { label: "Categorias de Estoque", path: `/${slug}/admin/inventory/categories` },
            ]
        },
        {
            icon: BarChart3,
            label: "Relatórios",
            path: `/${slug}/admin/reports`,
            subItems: [
                { label: "Geral", path: `/${slug}/admin/reports/general` },
                { label: "Caixas", path: `/${slug}/admin/reports/cashier` },
                { label: "Clientes", path: `/${slug}/admin/reports/customers` },
                { label: "Entradas", path: `/${slug}/admin/reports/entries` },
                { label: "Pedidos", path: `/${slug}/admin/reports/orders` },
                { label: "Notas fiscais", path: `/${slug}/admin/reports/invoices`, badge: "NOVO" },
                { label: "Mesas", path: `/${slug}/admin/reports/tables` },
                { label: "Cupons", path: `/${slug}/admin/reports/coupons` },
                { label: "Itens", path: `/${slug}/admin/reports/items` },
                { label: "Entregadores", path: `/${slug}/admin/reports/drivers` },
                { label: "Garçons", path: `/${slug}/admin/reports/waiters` },
                { label: "Área de Entrega", path: `/${slug}/admin/reports/delivery-areas` },
                { label: "Satisfação", path: `/${slug}/admin/reports/satisfaction` },
                { label: "Cashback", path: `/${slug}/admin/reports/cashback` },
            ]
        },
        { icon: Users, label: "Usuários", path: `/${slug}/admin/users` },
    ];

    return (
        <aside className="w-56 bg-[#0B1E34] text-white flex flex-col h-screen shrink-0 overflow-y-auto">
            <div className="p-4 flex items-center gap-2 border-b border-gray-700/30">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Settings className="text-white" size={18} />
                </div>
                <span className="font-bold text-sm tracking-tight text-white italic">VAPT <span className="text-blue-400 not-italic">Food</span></span>
            </div>

            <nav className="flex-1 py-4 px-2 space-y-1">
                {menuItems.map((item, idx) => (
                    <div key={idx}>
                        <Link
                            to={item.path}
                            className={`flex items-center justify-between px-3 py-2.5 rounded-md transition-all text-xs font-medium group
                                ${location.pathname.startsWith(item.path) ? 'bg-[#1877F2] text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}
                    `}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon size={16} className={location.pathname.startsWith(item.path) ? 'text-white' : 'text-gray-500 group-hover:text-blue-400'} />
                                <span>{item.label}</span>
                            </div>
                            {item.subItems && <ChevronRight size={14} className={`transition-transform ${location.pathname.startsWith(item.path) ? 'rotate-90' : ''}`} />}
                        </Link>

                        {item.subItems && location.pathname.startsWith(item.path) && (
                            <div className="mt-1 space-y-1 animate-fade-in">
                                {item.subItems.map((sub, sIdx) => (
                                    <Link
                                        key={sIdx}
                                        to={sub.path}
                                        className={`flex items-center justify-between px-4 py-2 pl-9 rounded-md transition-all text-[11px] font-medium
                                            ${location.pathname === sub.path ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'}
                    `}
                                    >
                                        <span>{sub.label}</span>
                                        {sub.badge && (
                                            <span className="bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                                {sub.badge}
                                            </span>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </nav>

            <div className="p-4 border-t border-gray-700/30">
                <div className="flex items-center justify-between text-gray-500 text-[10px]">
                    <span>WN Print © 2026.</span>
                    <span className="hover:text-blue-400 cursor-pointer">Versão 4.0.54</span>
                </div>
            </div>
        </aside>
    );
};

import MobileBottomNav from '../components/MobileBottomNav';

const AdminLayout = () => {
    const location = useLocation();
    const { triggerTestNotification } = useNotification();

    // Breadcrumbs logic...
    const pathParts = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = pathParts.map((part, i) => ({
        label: part.charAt(0).toUpperCase() + part.slice(1),
        path: '/' + pathParts.slice(0, i + 1).join('/')
    }));

    return (
        <div className="flex h-screen bg-[#F4F7FA]">
            <AdminSidebar />
            <div className="flex-1 flex flex-col overflow-hidden relative">
                <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        {breadcrumbs.map((crumb, idx) => (
                            <Fragment key={idx}>
                                {idx > 0 && <span className="text-gray-300">/</span>}
                                <Link to={crumb.path} className={`hover:text-blue-600 transition-colors ${idx === breadcrumbs.length - 1 ? 'font-medium text-gray-600' : ''}`}>
                                    {crumb.label}
                                </Link>
                            </Fragment>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                console.log("Admin global manual sound test triggered via context");
                                triggerTestNotification();
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-[#1877F2] border border-blue-100 rounded text-xs font-bold hover:bg-blue-100 transition-all shadow-sm"
                            title="Testar som de notificação"
                        >
                            <Volume2 size={14} />
                            <span>🔔 Som</span>
                        </button>

                        <button className="flex items-center gap-2 border border-blue-600 text-blue-600 px-3 py-1.5 rounded text-xs font-bold hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                            <HelpCircle size={14} />
                            Central de ajuda
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 pb-20 md:pb-8">
                    <Outlet />
                </main>

                {/* Mobile Bottom Navigation */}
                <MobileBottomNav />
            </div>
        </div>
    );
};

export default AdminLayout;
