import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, MessageCircle, Copy } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import CollaboratorModal from '../../components/CollaboratorModal';
import WaiterModal from '../../components/WaiterModal';
import { useEstablishment } from '../../contexts/EstablishmentContext';

interface Waiter {
    id: number;
    name: string;
    email: string;
    phone: string;
    role: string;
    active: boolean;
    cpf?: string;
    permissions?: string;
    image_url?: string;
}

const Waiters = () => {
    const [activeTab, setActiveTab] = useState<'actives' | 'inactives'>('actives');
    const [searchQuery, setSearchQuery] = useState('');
    const [waiters, setWaiters] = useState<Waiter[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isWaiterModalOpen, setIsWaiterModalOpen] = useState(false);
    const [collaboratorToEdit, setCollaboratorToEdit] = useState<Waiter | null>(null);

    const { establishment } = useEstablishment();

    const fetchWaiters = useCallback(async () => {
        if (!establishment?.id) return;

        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('collaborators')
                .select('*')
                .eq('role', 'Garçom')
                .eq('establishment_id', establishment.id) // Strict filtering
                .order('name');

            if (error) {
                console.error('Error fetching waiters:', error);
                return;
            }

            setWaiters(data || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsLoading(false);
        }
    }, [establishment?.id]);

    useEffect(() => {
        fetchWaiters();
    }, [fetchWaiters]);

    const handleOpenModal = (waiter: Waiter | null = null) => {
        setCollaboratorToEdit(waiter);
        setIsModalOpen(true);
    };

    const handleSuccess = () => {
        fetchWaiters();
    };

    const filteredWaiters = waiters.filter(waiter => {
        const matchesTab = activeTab === 'actives' ? waiter.active : !waiter.active;
        const matchesSearch = waiter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            waiter.email?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesSearch;
    });

    return (
        <div className="p-6 bg-gray-50 min-h-screen pb-24">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Meus garçons</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Início <span className="mx-1">›</span> Configurações Salão <span className="mx-1">›</span> Meus Garçons
                    </p>
                </div>

                {/* App Share Banner */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-center gap-4">
                    <div className="text-sm">
                        <span className="font-bold text-gray-800 block">Compartilhe o App</span>
                        <span className="text-gray-600 text-xs">Copie o link do app para compartilhar com sua equipe.</span>
                    </div>
                    <div className="flex gap-2">
                        <button className="flex items-center gap-1.5 px-3 py-1.5 border border-[#0099FF] text-[#0099FF] rounded bg-white text-xs font-bold hover:bg-blue-50 transition-colors">
                            <Copy size={14} />
                            Copiar
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 border border-[#0099FF] text-[#0099FF] rounded bg-white text-xs font-bold hover:bg-blue-50 transition-colors">
                            <MessageCircle size={14} />
                            Compartilhar
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Controls */}
                <div className="p-6 border-b border-gray-100">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        {/* Tabs */}
                        <div className="flex gap-6 border-b border-transparent">
                            <button
                                onClick={() => setActiveTab('actives')}
                                className={`pb-2 text-sm font-bold flex items-center gap-2 transition-colors relative ${activeTab === 'actives' ? 'text-[#0099FF]' : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                Ativos
                                <span className={`px-1.5 py-0.5 rounded-full text-xs ${activeTab === 'actives' ? 'bg-[#0099FF] text-white' : 'bg-gray-100 text-gray-500'}`}>
                                    {waiters.filter(w => w.active).length}
                                </span>
                                {activeTab === 'actives' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0099FF]"></div>}
                            </button>
                            <button
                                onClick={() => setActiveTab('inactives')}
                                className={`pb-2 text-sm font-bold flex items-center gap-2 transition-colors relative ${activeTab === 'inactives' ? 'text-[#0099FF]' : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                Inativos
                                <span className={`px-1.5 py-0.5 rounded-full text-xs ${activeTab === 'inactives' ? 'bg-[#0099FF] text-white' : 'bg-gray-100 text-gray-500'}`}>
                                    {waiters.filter(w => !w.active).length}
                                </span>
                                {activeTab === 'inactives' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0099FF]"></div>}
                            </button>
                        </div>

                        {/* Search & Add */}
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:w-80">
                                <input
                                    type="text"
                                    placeholder="Busque por nome, e-mail ou telefone"
                                    className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400 font-light"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            </div>
                            <button
                                onClick={() => setIsWaiterModalOpen(true)}
                                className="bg-[#0099FF] text-white px-4 py-2 rounded-md font-bold flex items-center gap-2 hover:bg-blue-600 transition-colors text-sm"
                            >
                                <Plus size={18} />
                                Garçom
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-800">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 flex items-center gap-1 cursor-pointer hover:bg-gray-50">
                                    Nome
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-down"><path d="M12 5v14" /><path d="m19 12-7 7-7-7" /></svg>
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-800">E-mail</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-800">Número WhatsApp</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-800"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">
                                        Carregando...
                                    </td>
                                </tr>
                            ) : filteredWaiters.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">
                                        Nenhum garçom encontrado.
                                    </td>
                                </tr>
                            ) : (
                                filteredWaiters.map((waiter) => (
                                    <tr key={waiter.id} className="hover:bg-gray-50 group border-b border-gray-50 last:border-none">
                                        <td className="px-6 py-4">
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" checked={waiter.active} readOnly />
                                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-0 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0099FF]"></div>
                                            </label>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">{waiter.name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500 font-light">{waiter.email}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500 font-light">{waiter.phone}</td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-2 text-gray-400">
                                            <button
                                                onClick={() => handleOpenModal(waiter)}
                                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                                                title="Editar"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button className="p-1 hover:bg-gray-100 rounded transition-colors" title="WhatsApp">
                                                <MessageCircle size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Chat Widget Mock */}
            <div className="fixed bottom-4 right-6 bg-[#0099FF] p-3 rounded-full text-white shadow-lg cursor-pointer hover:bg-blue-600 transition-colors z-20">
                <div className="w-6 h-6 flex items-center justify-center">
                    <MessageCircle size={24} />
                </div>
            </div>

            <CollaboratorModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleSuccess}
                collaboratorToEdit={collaboratorToEdit}
                defaultRole="Garçom"
            />

            <WaiterModal
                isOpen={isWaiterModalOpen}
                onClose={() => setIsWaiterModalOpen(false)}
                onSuccess={handleSuccess}
            />
        </div>
    );
};

export default Waiters;
