import { ChevronRight, Users, FileText, Smartphone, Store, Star } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEstablishment } from '../contexts/EstablishmentContext';

interface SettingsItem {
    icon: React.ElementType;
    label: string;
    path: string;
    badge?: string;
}

interface SettingsSection {
    title: string;
    items: SettingsItem[];
}

const MobileSettingsPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { establishment } = useEstablishment();

    const urlSlug = location.pathname.split('/')[1];
    const slug = establishment.slug || urlSlug || 'noia-burguer';
    const base = `/${slug}/admin`;

    const sections: SettingsSection[] = [
        {
            title: 'Configurações',
            items: [
                { icon: FileText, label: 'Meus Pedidos', path: `${base}/settings/orders` },
                { icon: Smartphone, label: 'Cardápio Digital', path: `${base}/settings/digital-menu` },
                { icon: Store, label: 'Estabelecimento', path: `${base}/settings/establishment` },
                { icon: Star, label: 'Produtos em destaque', path: `${base}/settings/featured` },
            ],
        },
        {
            title: 'Minha Conta',
            items: [
                { icon: Users, label: 'Colaboradores', path: `${base}/account/collaborators` },
            ],
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
                <h1 className="text-lg font-bold text-gray-900">Configurações</h1>
                <p className="text-xs text-gray-500 mt-0.5">{establishment.name}</p>
            </div>

            {/* Sections */}
            <div className="px-4 py-4 space-y-6">
                {sections.map((section) => (
                    <div key={section.title}>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 px-1">
                            {section.title}
                        </p>
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                            {section.items.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <button
                                        key={item.path}
                                        onClick={() => navigate(item.path)}
                                        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
                                    >
                                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                                            <Icon size={16} className="text-blue-600" />
                                        </div>
                                        <span className="flex-1 text-sm font-medium text-gray-800">{item.label}</span>
                                        {item.badge && (
                                            <span className="bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full mr-1">
                                                {item.badge}
                                            </span>
                                        )}
                                        <ChevronRight size={16} className="text-gray-300 shrink-0" />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MobileSettingsPage;
