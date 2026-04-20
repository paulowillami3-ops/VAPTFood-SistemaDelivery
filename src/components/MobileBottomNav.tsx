import { Home, FileText, Plus, HelpCircle, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useEstablishment } from '../contexts/EstablishmentContext';

const MobileBottomNav = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const { establishment } = useEstablishment();

    // Helper to check active route
    const isActive = (path: string) => location.pathname.includes(path);

    const urlSlug = window.location.pathname.split('/')[1];
    const baseUrl = `/${establishment?.slug || urlSlug || 'noia-burguer'}/admin`;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:hidden z-50 flex items-end justify-between">
            {/* Pedidos (Dashboard) */}
            <button
                onClick={() => navigate(`${baseUrl}/orders`)}
                className={`flex flex-col items-center gap-1 w-1/5 transition-colors ${isActive('/orders') ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600'
                    }`}
            >
                <Home size={24} strokeWidth={isActive('/orders') ? 2.5 : 2} />
                <span className="text-[10px] font-medium">Pedidos</span>
            </button>

            {/* Cardápio */}
            <button
                onClick={() => navigate(`${baseUrl}/menu-manager`)}
                className={`flex flex-col items-center gap-1 w-1/5 transition-colors ${isActive('/menu-manager') ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600'
                    }`}
            >
                <FileText size={24} strokeWidth={isActive('/menu-manager') ? 2.5 : 2} />
                <span className="text-[10px] font-medium">Cardápio</span>
            </button>

            {/* Main Action: Novo Pedido */}
            <div className="relative -top-5 w-1/5 flex justify-center">
                <button
                    onClick={() => {
                        const urlSlug = location.pathname.split('/')[1];
                        const baseUrl = `/${establishment?.slug || urlSlug || 'noia-burguer'}/admin`;
                        navigate(`${baseUrl}/pdv`);
                    }}
                    className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-orange-200 border-4 border-gray-50 transform transition-transform active:scale-95"
                >
                    <Plus size={32} strokeWidth={3} />
                </button>
            </div>

            {/* Suporte */}
            <button
                onClick={() => navigate(`${baseUrl}/help`)}
                className={`flex flex-col items-center gap-1 w-1/5 transition-colors ${isActive('/help') ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600'
                    }`}
            >
                <HelpCircle size={24} strokeWidth={isActive('/help') ? 2.5 : 2} />
                <span className="text-[10px] font-medium">Suporte</span>
            </button>

            {/* Config */}
            <button
                onClick={() => navigate(`${baseUrl}/settings`)}
                className={`flex flex-col items-center gap-1 w-1/5 transition-colors ${isActive('/settings') ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600'
                    }`}
            >
                <Settings size={24} strokeWidth={isActive('/settings') ? 2.5 : 2} />
                <span className="text-[10px] font-medium">Config</span>
            </button>
        </div>
    );
};

export default MobileBottomNav;
