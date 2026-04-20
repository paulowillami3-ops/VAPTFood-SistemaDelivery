import React, { useEffect } from 'react';
import { X, Settings, Award, User, MessageSquare, HelpCircle, LogOut, ChevronRight } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

interface WaiterSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    waiterName: string;
    establishmentName?: string;
}

const WaiterSidebar: React.FC<WaiterSidebarProps> = ({ isOpen, onClose, waiterName, establishmentName = "Carregando..." }) => {
    const navigate = useNavigate();
    const { slug } = useParams();

    // Prevent scrolling when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleLogout = () => {
        localStorage.removeItem(`waiter_session_${slug}`);
        navigate(`/${slug}/garcom/login`);
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            ></div>

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 w-[85%] max-w-[320px] bg-[#00223A] z-50 transform transition-transform duration-300 ease-out shadow-2xl flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>

                {/* Header */}
                <div className="p-4 flex items-center justify-between border-b border-white/10">
                    <span className="font-bold text-white text-sm">Mapa de mesas e comandas</span>
                    <button onClick={onClose} className="text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto py-2">

                    <button
                        onClick={() => navigate(`/${slug}/garcom/configuracoes`)}
                        className="w-full flex items-center gap-4 px-4 py-4 text-white hover:bg-[#003152] transition-colors"
                    >
                        <Settings size={20} />
                        <span className="font-medium text-sm">Configurações</span>
                    </button>

                    <button
                        onClick={() => navigate(`/${slug}/garcom/equipe`)}
                        className="w-full flex items-center gap-4 px-4 py-4 text-white hover:bg-[#003152] transition-colors"
                    >
                        <User size={20} />
                        <span className="font-medium text-sm">Meus Garçons</span>
                    </button>

                    <button className="w-full flex items-center gap-4 px-4 py-4 text-white hover:bg-[#003152] transition-colors">
                        <Award size={20} />
                        <span className="font-medium text-sm">Desafios Garçom</span>
                    </button>

                    <button className="w-full flex items-center gap-4 px-4 py-4 text-white bg-[#FFA500] hover:bg-[#FFB733] transition-colors text-black relative">
                        <div className="relative">
                            <User size={20} className="text-black" />
                            <div className="absolute top-0 right-0 w-2 h-2 bg-white rounded-full"></div>
                        </div>
                        <span className="font-bold text-sm">Meus dados</span>
                    </button>

                    {/* Add Shortcut Banner */}
                    <div className="mx-4 my-4 bg-gradient-to-r from-blue-100 to-white rounded-lg p-3 flex items-center gap-3 cursor-pointer">
                        <div className="bg-[#0099FF] rounded-md p-1.5 flex-shrink-0">
                            <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-bold text-[#003152] text-xs leading-tight">Adicionar atalho</div>
                            <div className="text-[#003152]/70 text-[10px] leading-tight mt-0.5">Salve na sua tela inicial</div>
                        </div>
                        <ChevronRight size={16} className="text-[#003152]" />
                    </div>

                    <button className="w-full flex items-center gap-4 px-4 py-4 text-white hover:bg-[#003152] transition-colors">
                        <MessageSquare size={20} />
                        <span className="font-medium text-sm">Enviar sugestão</span>
                        <div className="ml-auto w-2 h-2 bg-[#FFA500] rounded-full"></div>
                    </button>

                    <button className="w-full flex items-center gap-4 px-4 py-4 text-white hover:bg-[#003152] transition-colors">
                        <HelpCircle size={20} />
                        <span className="font-medium text-sm">Ajuda</span>
                    </button>

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 bg-[#001829]">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                            <User size={24} className="text-gray-400" />
                        </div>
                        <div>
                            <div className="text-white font-bold text-sm">{waiterName}</div>
                            <div className="text-gray-400 text-xs">{establishmentName}</div>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full border border-white/20 rounded-md py-2.5 flex items-center justify-center gap-2 text-white hover:bg-white/5 transition-colors text-sm font-medium"
                    >
                        <LogOut size={16} /> Sair
                    </button>
                </div>
            </div>
        </>
    );
};

export default WaiterSidebar;
