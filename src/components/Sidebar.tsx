import {
    ShoppingBag, Store, Utensils, Calendar, BookOpen, Settings,
    Search, ChevronDown, LogOut, X,
    TrendingUp, ChefHat, Bot, LayoutDashboard, HelpCircle, MessageSquare, Shield,
    FileText, Smile, CreditCard, Truck, User, Zap, Ticket
} from 'lucide-react';
import { differenceInMinutes } from 'date-fns';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEstablishment } from '../contexts/EstablishmentContext';
import { supabase } from '../lib/supabase';
import { useState, useEffect, useMemo } from 'react';
import { useCashier } from '../contexts/CashierContext';
import CloseCashierModal from './CloseCashierModal';
import PartialSummaryModal from './PartialSummaryModal';
import OpenCashierModal from './OpenCashierModal';
import CashierTransactionModal from './CashierTransactionModal';
import Toast from './Toast';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    isCollapsed: boolean;
    toggleCollapse: () => void;
}

const NavSubItem = ({ label, badge, active, onClick, isCollapsed }: { label: string; badge?: string; active?: boolean; onClick?: () => void; isCollapsed?: boolean }) => {
    if (isCollapsed) return null; // Hide sub-items in collapsed mode for now

    return (
        <div
            onClick={onClick}
            className={`
            flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors select-none pl-9
            ${active ? 'text-[#F36B46]' : 'text-gray-400 hover:text-white hover:bg-white/5'}
        `}
        >
            <span className="text-xs font-medium truncate">{label}</span>
            {badge && (
                <span className="bg-[#E67E22] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    {badge}
                </span>
            )}
        </div>
    )
};

const SectionTitle = ({ label, isCollapsed }: { label: string; isCollapsed?: boolean }) => {
    if (isCollapsed) return <div className="h-4"></div>; // Spacer instead of text
    return (
        <div className="px-3 pb-1 pt-2">
            <span className="text-xs text-gray-500 uppercase font-semibold tracking-wider">{label}</span>
        </div>
    )
};

interface NavItemProps {
    icon: React.ElementType;
    label: string;
    count?: number;
    active?: boolean;
    hasSubmenu?: boolean;
    badge?: string;
    badgeColor?: string;
    onClick?: () => void;
    children?: React.ReactNode;
    forceOpen?: boolean;
    isCollapsed?: boolean;
}

const NavItem = ({ icon: Icon, label, count, active, hasSubmenu, badge, badgeColor, onClick, children, forceOpen, isCollapsed }: NavItemProps) => {
    const [isOpen, setIsOpen] = useState(active || false);

    useEffect(() => {
        if (forceOpen) setIsOpen(true);
    }, [forceOpen]);

    const handleClick = () => {
        if (children && !isCollapsed) {
            setIsOpen(!isOpen);
        }
        if (onClick) onClick();
    };

    return (
        <div className="relative group">
            <div
                onClick={handleClick}
                className={`
                flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 mx-1 rounded-lg cursor-pointer transition-colors group select-none
                ${active && !children ? 'bg-[#0099FF] text-white' : 'text-gray-400 hover:bg-[#1A2E44] hover:text-white'}
                ${active && children ? 'text-white' : ''} 
            `}
                title={isCollapsed ? label : undefined}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    <Icon size={20} className="min-w-[20px]" />
                    {!isCollapsed && <span className="text-xs font-medium truncate">{label}</span>}
                </div>
                {!isCollapsed && (
                    <div className="flex items-center gap-2">
                        {badge && (
                            <span className={`
                            text-[10px] font-bold px-1.5 py-0.5 rounded
                            ${badgeColor ? badgeColor : 'bg-[#E67E22] text-white'}
                        `}>
                                {badge}
                            </span>
                        )}
                        {(count !== undefined && count > 0) && (
                            <span className={`
                            text-xs font-bold px-2 py-0.5 rounded
                            ${active ? 'bg-white/20' : 'bg-[#1A2E44] group-hover:bg-[#0F2236]'}
                         `}>
                                {count}
                            </span>
                        )}
                        {(hasSubmenu || children) && (
                            <ChevronDown size={14} className={`transform transition-transform text-gray-500 ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
                        )}
                    </div>
                )}
            </div>
            {/* Submenu Area */}
            {isOpen && children && !isCollapsed && (
                <div className="mt-1 space-y-0.5 animate-fade-in">
                    {children}
                </div>
            )}
        </div>
    );
};

const Sidebar = ({ isOpen, onClose, isCollapsed, toggleCollapse }: SidebarProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { establishment } = useEstablishment();
    const { isCashierOpen, currentSession, checkStatus } = useCashier();
    const [orderCount, setOrderCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [cashierMenuOpen, setCashierMenuOpen] = useState(false);

    // Modals State
    const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
    const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
    const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [transactionType, setTransactionType] = useState<'WITHDRAWAL' | 'SUPPLY'>('WITHDRAWAL');
    const [cashierDuration, setCashierDuration] = useState('');

    useEffect(() => {
        const updateDuration = () => {
            if (isCashierOpen && currentSession?.opened_at) {
                const start = new Date(currentSession.opened_at);
                const now = new Date();
                const diffMinutes = differenceInMinutes(now, start);
                const hours = Math.floor(diffMinutes / 60);
                const minutes = diffMinutes % 60;
                setCashierDuration(`${hours}h${minutes.toString().padStart(2, '0')}min`);
            } else {
                setCashierDuration('');
            }
        };

        updateDuration();
        const interval = setInterval(updateDuration, 60000); // 1 minute
        return () => clearInterval(interval);
    }, [isCashierOpen, currentSession]);

    // Toast State
    const [toastMessage, setToastMessage] = useState('');
    const [isToastOpen, setIsToastOpen] = useState(false);

    const showToast = (message: string) => {
        setToastMessage(message);
        setIsToastOpen(true);
    };

    const fetchOrderCount = async () => {
        if (!establishment?.id) return;
        try {
            console.log("Fetching order count for establishment:", establishment.id);
            const { count, error } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('establishment_id', establishment.id)
                .in('status', ['PENDING', 'PREPARING', 'READY']);

            if (error) {
                console.error('Error fetching count:', error);
            } else {
                console.log("New order count:", count);
                setOrderCount(count || 0);
            }
        } catch (err) {
            console.error('Exception fetching count:', err);
        }
    };

    useEffect(() => {
        if (!establishment?.id) return;

        // Initial fetch
        fetchOrderCount();

        // Real-time subscription
        console.log("Subscribing to order counter updates for establishment:", establishment.id);
        const channel = supabase
            .channel(`sidebar-orders-count-${establishment.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                    filter: `establishment_id=eq.${establishment.id}`
                },
                (payload: any) => {
                    console.log('Sidebar Realtime Event:', payload.eventType);
                    console.log('New State:', payload.new?.id, payload.new?.status);
                    if (payload.old) console.log('Old State:', payload.old?.id, payload.old?.status);

                    fetchOrderCount();
                }
            )
            .subscribe((status) => {
                console.log("Sidebar counter subscription status:", status);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [establishment?.id]);

    const isActive = (path: string) => location.pathname === path;

    const overlayClass = isOpen ? 'fixed inset-0 top-16 bg-black/50 z-20 md:hidden' : 'hidden';
    const sidebarClass = `
        ${isCollapsed ? 'w-20' : 'w-64'}
        bg-[#0F2236] text-white flex flex-col fixed left-0 transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        
        /* Mobile: Below Header */
        md:top-0 md:h-screen md:z-50 md:translate-x-0
        top-16 h-[calc(100vh-8.5rem)] z-30
    `;

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            localStorage.removeItem('isAuthenticated');
            navigate('/login');
        } catch (error) {
            console.error('Error logging out:', error);
            navigate('/login');
        }
    };

    const handleOpenTransaction = (type: 'WITHDRAWAL' | 'SUPPLY') => {
        setTransactionType(type);
        setIsTransactionModalOpen(true);
    };

    // Filter Logic
    const menuItems = useMemo(() => {
        const urlSlug = location.pathname.split('/')[1];
        const slug = establishment.slug || urlSlug || 'noia-burguer'; // Dynamic slug recovery

        const sections = [
            {
                label: "Seu dia a dia",
                items: [
                    { icon: ShoppingBag, label: "Meus pedidos", path: `/${slug}/admin/orders`, count: orderCount > 0 ? orderCount : undefined },
                    { icon: Store, label: "Pedidos balcão (PDV)", path: `/${slug}/admin/pdv` },
                    { icon: Utensils, label: "Pedidos salão", path: `/${slug}/admin/local-orders/tables` },
                    { icon: Calendar, label: "Pedidos agendados", path: `/${slug}/admin/scheduled-orders`, count: 0 },
                    {
                        icon: BookOpen,
                        label: "Gestor de cardápio",
                        path: `/${slug}/admin/menu-manager`,
                        subItems: [
                            { label: "Gestor", path: `/${slug}/admin/menu-manager`, isHeader: true },
                            { label: "Imagens do cardápio", path: `/${slug}/admin/menu-media` },
                            { label: "Edição em massa", path: `/${slug}/admin/bulk-edit` },
                            { label: "Potencializador de cardápio", path: `/${slug}/admin/menu-booster` },
                            { label: "Importação inteligente do cardápio", path: `/${slug}/admin/smart-import` },
                        ]
                    },
                    {
                        icon: Settings,
                        label: "Gestão avançada",
                        path: `/${slug}/admin/management`,
                        badge: "NOVO",
                        subItems: [
                            { label: "Controle de estoque", path: `/${slug}/admin/management/inventory`, openNewTab: true },
                            { label: "Ficha técnica", path: `/${slug}/admin/management/tech-specs`, openNewTab: true },
                            { label: "Controle de caixa", path: `/${slug}/admin/management/cashier`, openNewTab: true },
                            { label: "Nota fiscal", path: `/${slug}/admin/management/invoices`, badge: "NOVO", openNewTab: true },
                            { label: "Financeiro", path: `/${slug}/admin/management/finance`, openNewTab: true },
                            { label: "Compras", path: `/${slug}/admin/management/purchases`, openNewTab: true },
                        ]
                    },
                    { icon: TrendingUp, label: "Meu Desempenho", path: `/${slug}/admin/performance` },
                    { icon: ChefHat, label: "Cozinha (KDS)", path: `/${slug}/admin/kds` },
                    { icon: Bot, label: "Robô", path: `/${slug}/admin/robot`, hasSubmenu: true },
                ]
            },
            {
                label: "Meu Salão",
                items: [
                    { icon: LayoutDashboard, label: "Gestão de salão", path: `/${slug}/admin/hall-management`, badge: "Grátis", badgeColor: "bg-green-500 text-black" },
                    {
                        icon: Store,
                        label: "Configurações Salão",
                        path: `/${slug}/admin/hall-settings`,
                        subItems: [
                            { label: "Meu Salão", path: `/${slug}/admin/hall-settings/general` },
                            { label: "Meus Garçons", path: `/${slug}/admin/hall-settings/waiters` },
                            { label: "App Garçom", path: `/${slug}/admin/hall-settings/app` },
                            { label: "Comandas", path: `/${slug}/admin/hall-settings/commands` },
                            { label: "Pedidos Balcão (PDV)", path: `/${slug}/admin/hall-settings/pdv` },
                            { label: "Taxa de serviço", path: `/${slug}/admin/hall-settings/service-fee` },
                            { label: "Cardápio QR Code", path: `/${slug}/admin/hall-settings/qrcode` },
                            { label: "Impressoras", path: `/${slug}/admin/hall-settings/printers` },
                            { label: "Balanças", path: `/${slug}/admin/hall-settings/scales`, badge: "NOVO" },
                        ]
                    }
                ]
            },
            {
                label: "Venda mais",
                items: [
                    { icon: Zap, label: "Recuperador de vendas", path: `/${slug}/admin/sales-recovery` },
                    { icon: Ticket, label: "Cupom", path: `/${slug}/admin/coupons` },
                ]
            },
            {
                label: "Análises",
                items: [
                    {
                        icon: FileText,
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
                        ]
                    },
                    { icon: Smile, label: "Satisfação", path: `/${slug}/admin/satisfaction` },
                ]
            },
            {
                label: "Configurações",
                items: [
                    { icon: CreditCard, label: "Pagamentos", path: `/${slug}/admin/payments` },
                    { icon: Truck, label: "Entregadores", path: `/${slug}/admin/delivery-men`, hasSubmenu: true },
                    {
                        icon: User, label: "Minha conta", path: `/${slug}/admin/account`,
                        subItems: [
                            { label: "Geral", path: `/${slug}/admin/account/general` },
                            { label: "Informações pessoais", path: `/${slug}/admin/account/personal-info` },
                            { label: "Formas de pagamento", path: `/${slug}/admin/account/payment-methods` },
                            { label: "Fatura", path: `/${slug}/admin/account/invoices` },
                            { label: "Planos", path: `/${slug}/admin/account/plans` },
                            { label: "Colaboradores", path: `/${slug}/admin/account/collaborators` },
                        ]
                    },
                    {
                        icon: Settings, label: "Configurações", path: `/${slug}/admin/settings`,
                        subItems: [
                            { label: "Meus Clientes", path: `/${slug}/admin/settings/customers`, badge: "NOVO" },
                            { label: "Meus Pedidos", path: `/${slug}/admin/settings/orders` },
                            { label: "Impressora", path: `/${slug}/admin/settings/printer` },
                            { label: "Nota Fiscal", path: `/${slug}/admin/settings/invoices` },
                            { label: "Frente de caixa", path: `/${slug}/admin/settings/pos` },
                            { label: "Integrações", path: `/${slug}/admin/settings/integrations` },
                            { label: "Cardápio Digital", path: `/${slug}/admin/settings/digital-menu` },
                            { label: "Redes Sociais", path: `/${slug}/admin/settings/social` },
                            { label: "Entregadores", path: `/${slug}/admin/delivery-men` },
                            { label: "Robô", path: `/${slug}/admin/robot` },
                            { label: "Estabelecimento", path: `/${slug}/admin/settings/establishment` },
                            { label: "Pedidos agendados", path: `/${slug}/admin/scheduled-orders` },
                            { label: "Integração de anúncios", path: `/${slug}/admin/settings/ads-integration` },
                            { label: "Produtos em destaque", path: `/${slug}/admin/settings/featured` },
                        ]
                    }
                ]
            },
            {
                label: "Central VAPT Food",
                items: [
                    { icon: HelpCircle, label: "Instruções de ajuda", path: `/${slug}/admin/help` },
                    { icon: MessageSquare, label: "Sugestões", path: `/${slug}/admin/suggestions` },
                    { icon: Shield, label: "Termos e Políticas", path: `/${slug}/admin/terms` },
                ]
            }
        ];

        if (!searchQuery) return sections;

        const lowerQuery = searchQuery.toLowerCase();

        return sections.map(section => {
            const filteredItems = section.items.map(item => {
                const matchesItem = item.label.toLowerCase().includes(lowerQuery);

                let filteredSubItems = undefined;
                if (item.subItems) {
                    filteredSubItems = item.subItems.filter(sub =>
                        sub.label.toLowerCase().includes(lowerQuery)
                    );
                }

                if (matchesItem || (filteredSubItems && filteredSubItems.length > 0)) {
                    return {
                        ...item,
                        subItems: filteredSubItems && filteredSubItems.length > 0 ? filteredSubItems : item.subItems
                    };
                }
                return null;
            }).filter(Boolean) as typeof section.items;

            return {
                ...section,
                items: filteredItems
            };
        }).filter(section => section.items.length > 0);

    }, [searchQuery, orderCount, establishment.slug]);


    return (
        <>
            {isToastOpen && <Toast message={toastMessage} onClose={() => setIsToastOpen(false)} />}

            {/* Mobile Overlay */}
            <div className={overlayClass} onClick={onClose} />

            <aside className={sidebarClass.replace('overflow-y-auto', 'overflow-hidden')}>
                {/* Fixed Header Section */}
                <div className="shrink-0 bg-[#0F2236] z-10 animate-fade-in relative">
                    <div className={`p-4 flex items-center ${isCollapsed ? 'justify-center' : 'gap-2'} md:flex hidden`}>
                        {!isCollapsed && (
                            <div className="flex items-center gap-2 text-2xl font-bold text-blue-400">
                                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                                    <span className="text-[#0F2236] font-bold">V</span>
                                </div>
                                <span className="text-white">VAPT Food</span>
                            </div>
                        )}

                        {/* Toggle Button for Desktop */}
                        <button
                            onClick={toggleCollapse}
                            className={`
                                hidden md:flex text-gray-400 hover:text-white transition-colors
                                ${isCollapsed ? 'mx-auto' : 'ml-auto'}
                            `}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                        </button>

                        <button className="ml-auto text-gray-400 hover:text-white md:hidden" onClick={onClose}>
                            <X size={24} />
                        </button>
                    </div>

                    {/* Store Status / Cashier Status */}
                    {/* Store Status / Cashier Status */}
                    {!isCollapsed && (
                        <div className="px-4 mb-4 relative z-50 animate-fade-in">
                            {isCashierOpen ? (
                                // Cashier OPEN State
                                <div
                                    onClick={() => setCashierMenuOpen(!cashierMenuOpen)}
                                    className="bg-[#1A2E44] rounded-lg p-2 flex items-center justify-between cursor-pointer hover:bg-[#253f5c] transition-colors relative z-20 shadow-sm border border-transparent hover:border-blue-500/30"
                                >
                                    <div className="flex items-center gap-2">
                                        <Store size={20} className="text-white" />
                                        <div className="flex flex-col">
                                            <span className="text-xs font-medium text-gray-200">Caixa</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 bg-green-500 text-black text-xs font-bold px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.4)]">
                                        <span>Aberto</span>
                                        <ChevronDown size={14} className={`transition-transform duration-200 ${cashierMenuOpen ? 'rotate-180' : ''}`} />
                                    </div>
                                </div>
                            ) : (
                                // Cashier CLOSED State
                                <div className="bg-[#0b1a29] rounded-lg p-2 flex items-center justify-between transition-colors relative z-20 border border-red-900/30">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-[#1A2E44] rounded flex items-center justify-center">
                                            <Store size={18} className="text-gray-400" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-white">Caixa</span>
                                            <span className="text-[10px] bg-white text-gray-600 px-1.5 rounded font-bold w-max">Fechado</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsOpenModalOpen(true)}
                                        className="text-xs font-bold text-blue-400 hover:text-blue-300 px-2 py-1"
                                    >
                                        Abrir
                                    </button>
                                </div>
                            )}

                            {/* Dropdown Menu (Only when OPEN) */}
                            {isCashierOpen && cashierMenuOpen && (
                                <div className="absolute top-full left-4 right-4 mt-2 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-50 animate-fade-in-down">
                                    {/* Header: Caixa aberto há... */}
                                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex flex-col gap-0.5">
                                        <span className="text-xs text-gray-500 font-medium">Caixa aberto há:</span>
                                        <span className="text-sm font-bold text-gray-800">{cashierDuration}</span>
                                    </div>

                                    {/* Options */}
                                    <div className="py-1">
                                        <button
                                            onClick={() => { setIsSummaryModalOpen(true); setCashierMenuOpen(false); }}
                                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors border-b border-gray-100 flex items-center justify-between"
                                        >
                                            Resumo parcial
                                        </button>
                                        <button
                                            onClick={() => { handleOpenTransaction('WITHDRAWAL'); setCashierMenuOpen(false); }}
                                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors border-b border-gray-100"
                                        >
                                            Informar retirada
                                        </button>
                                        <button
                                            onClick={() => { handleOpenTransaction('SUPPLY'); setCashierMenuOpen(false); }}
                                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors border-b border-gray-100"
                                        >
                                            Informar suprimento
                                        </button>
                                        <button
                                            onClick={() => { setIsCloseModalOpen(true); setCashierMenuOpen(false); }}
                                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors"
                                        >
                                            Fechar caixa
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Search */}
                    {!isCollapsed && (
                        <div className="px-4 mb-4 animate-fade-in">
                            <div className="relative group focus-within:ring-2 focus-within:ring-blue-500/50 rounded-lg transition-all duration-300">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-400 transition-colors" size={16} />
                                <input
                                    type="text"
                                    placeholder="Procurando por algo?"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-[#1A2E44]/50 border-b border-gray-600 pb-2 pl-9 pt-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500 placeholder-gray-500 rounded-t-lg transition-all"
                                />
                            </div>
                        </div>
                    )}
                </div>


                {/* Scrollable Navigation */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <nav className="px-2 space-y-6 pb-4 pt-4">
                        {menuItems.map((section, idx) => (
                            <div key={idx} className="space-y-1 animate-fade-in">
                                <SectionTitle label={section.label} isCollapsed={isCollapsed} />
                                {section.items.map((item: any, itemIdx: number) => (
                                    <NavItem
                                        key={itemIdx}
                                        icon={item.icon}
                                        label={item.label}
                                        count={item.count}
                                        active={item.path ? isActive(item.path) || (item.subItems && location.pathname.startsWith(item.path)) : false}
                                        onClick={() => item.path && navigate(item.path)}
                                        hasSubmenu={!!item.subItems || item.hasSubmenu}
                                        badge={item.badge}
                                        badgeColor={item.badgeColor}
                                        forceOpen={!!searchQuery} // Expand matching items when searching
                                        isCollapsed={isCollapsed}
                                    >
                                        {item.subItems && (
                                            <>
                                                {item.subItems.map((sub: any, subIdx: number) => (
                                                    sub.isHeader ? (
                                                        <div
                                                            key={subIdx}
                                                            className="px-3 pb-1 pt-2 pl-9 cursor-pointer hover:text-blue-400 transition-colors"
                                                            onClick={() => navigate(sub.path)}
                                                        >
                                                            <span className="text-xs font-bold text-white">{sub.label}</span>
                                                        </div>
                                                    ) : (
                                                        <NavSubItem
                                                            key={subIdx}
                                                            label={sub.label}
                                                            badge={sub.badge}
                                                            onClick={() => sub.openNewTab ? window.open(sub.path, '_blank') : navigate(sub.path)}
                                                            active={isActive(sub.path)}
                                                            isCollapsed={isCollapsed}
                                                        />
                                                    )
                                                ))}
                                            </>
                                        )}
                                    </NavItem>
                                ))}
                                {idx < menuItems.length - 1 && <div className="h-px bg-gray-700/50 mx-2 mt-4" />}
                            </div>
                        ))}
                    </nav>
                </div>

                {/* Sidebar Footer */}
                <div className="p-4 bg-[#0F2236] border-t border-gray-800 shrink-0 z-20">
                    <div className="bg-[#102336] rounded-xl p-3 flex items-center justify-between border border-[#1A344F] transition-all hover:border-[#0099FF]/50 group cursor-pointer relative">
                        {isCollapsed ? (
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center shrink-0 overflow-hidden border-2 border-white/10 mx-auto">
                                {establishment.logo_url ? (
                                    <img src={establishment.logo_url} alt={establishment.name} className="w-full h-full object-cover" />
                                ) : (
                                    <Store size={20} className="text-gray-400" />
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-3">
                                    {/* Logo Placeholder */}
                                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center shrink-0 overflow-hidden border-2 border-white/10">
                                        {establishment.logo_url ? (
                                            <img src={establishment.logo_url} alt={establishment.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Store size={20} className="text-gray-400" />
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-white leading-tight">{establishment.name || 'Noia Burguer'}</span>
                                        <span className="text-xs text-gray-400 mb-1">{establishment.contacts?.[0] || 'Paulo Willami'}</span>

                                        {/* Status Badge */}
                                        <div className={`
                                    text-[10px] font-bold px-2 py-0.5 rounded-full w-max uppercase tracking-wide border
                                    ${establishment.isOpen
                                                ? 'bg-green-500 text-white border-green-400 shadow-[0_0_8px_rgba(34,197,94,0.4)]'
                                                : 'bg-[#FF4D4D] text-white border-[#FF4D4D] shadow-[0_0_8px_rgba(255,77,77,0.4)]'
                                            }
                                `}>
                                            {establishment.isOpen ? 'Aberto' : 'Fechado'}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); handleLogout(); }} className="text-gray-500 hover:text-red-400 transition-colors" title="Sair">
                                        <LogOut size={16} />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </aside >

            {/* Modals */}
            <OpenCashierModal
                isOpen={isOpenModalOpen}
                onClose={() => setIsOpenModalOpen(false)}
                onSuccess={() => showToast('Caixa aberto com sucesso')}
            />
            <CloseCashierModal
                isOpen={isCloseModalOpen}
                onClose={() => setIsCloseModalOpen(false)}
                cashierId={currentSession?.id || ''}
                establishmentId={establishment?.id || ''}
                onSuccess={() => {
                    setIsCloseModalOpen(false);
                    checkStatus(); // Force update status
                    showToast('Caixa fechado com sucesso');
                }}
            />
            <PartialSummaryModal
                isOpen={isSummaryModalOpen}
                onClose={() => setIsSummaryModalOpen(false)}
            />
            <CashierTransactionModal
                isOpen={isTransactionModalOpen}
                onClose={() => setIsTransactionModalOpen(false)}
                type={transactionType}
                onSuccess={() => showToast(transactionType === 'WITHDRAWAL' ? 'Retirada efetuada com sucesso' : 'Suprimento efetuado com sucesso')}
            />
        </>
    );
};

export default Sidebar;
