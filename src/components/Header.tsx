import { Bell, Store, Menu, Volume2 } from 'lucide-react';
import { useState } from 'react';
import { useEstablishment } from '../contexts/EstablishmentContext';
import { useAudioAlert } from '../hooks/useAudioAlert';
import StoreLinkModal from './StoreLinkModal';

interface HeaderProps {
    onMenuClick: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
    const { establishment } = useEstablishment();
    const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
    const { playNotification } = useAudioAlert();

    return (
        <>
            <header className="bg-white px-6 h-16 flex items-center justify-between shadow-sm sticky top-0 z-40">
                <div className="flex items-center gap-4">
                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={onMenuClick}
                        className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg md:hidden"
                    >
                        <Menu size={24} />
                    </button>

                    {/* Mobile Logo */}
                    <div className="flex items-center gap-2 md:hidden ml-2">
                        <div className="w-8 h-8 bg-[#0F2236] rounded-full flex items-center justify-center">
                            <span className="text-white font-bold">V</span>
                        </div>
                        <span className="text-[#0F2236] font-bold text-xl">VAPT Food</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => {
                            console.log("Global manual sound test triggered");
                            playNotification();
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-[#0099FF] border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors text-xs font-bold shadow-sm"
                        title="Testar som de notificação"
                    >
                        <Volume2 size={16} />
                        <span>🔔 Som</span>
                    </button>

                    <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
                        <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                            <Bell size={20} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                        </button>
                        <div
                            className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden border border-gray-300 cursor-pointer hover:border-blue-400 transition-colors"
                            onClick={() => setIsStoreModalOpen(true)}
                        >
                            {establishment?.logo_url ? (
                                <img
                                    src={establishment.logo_url}
                                    alt={establishment.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <Store size={32} className="text-gray-400 p-1" />
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <StoreLinkModal
                isOpen={isStoreModalOpen}
                onClose={() => setIsStoreModalOpen(false)}
            />
        </>
    );
};

export default Header;
