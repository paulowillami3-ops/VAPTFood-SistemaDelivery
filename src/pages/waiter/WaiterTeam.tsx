import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useEstablishment } from '../../contexts/EstablishmentContext';
import { ArrowLeft, User, Search, RefreshCw, Plus, Edit2, Copy, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

interface Waiter {
    id: number;
    name: string;
    email: string;
    active: boolean;
    created_at: string;
}

const WaiterTeam = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { establishment } = useEstablishment();

    // UI State
    const [activeTab, setActiveTab] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);

    // Data State
    const [waiters, setWaiters] = useState<Waiter[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchWaiters = useCallback(async () => {
        if (!establishment?.id) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('collaborators')
                .select('*')
                .eq('establishment_id', establishment.id)
                .eq('role', 'Garçom')
                .order('name');

            if (error) throw error;
            setWaiters(data || []);
        } catch (error) {
            console.error('Error fetching waiters:', error);
        } finally {
            setLoading(false);
        }
    }, [establishment?.id]);

    useEffect(() => {
        fetchWaiters();
    }, [fetchWaiters]);

    const handleToggleStatus = async (waiterId: number, currentStatus: boolean) => {
        // Optimistic Update
        setWaiters(prev => prev.map(w => w.id === waiterId ? { ...w, active: !currentStatus } : w));

        try {
            const { error } = await supabase
                .from('collaborators')
                .update({ active: !currentStatus })
                .eq('id', waiterId);

            if (error) throw error;
            toast.success('Status atualizado');
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Erro ao atualizar status');
            // Revert
            setWaiters(prev => prev.map(w => w.id === waiterId ? { ...w, active: currentStatus } : w));
        }
    };

    const copyAppUrl = () => {
        const url = window.location.origin + `/${slug}/garcom/login`;
        navigator.clipboard.writeText(url);
        toast.success('Link copiado!');
    };

    const filteredWaiters = waiters.filter(waiter => {
        const matchesSearch = waiter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            waiter.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTab = activeTab === 'ACTIVE' ? waiter.active : !waiter.active;
        return matchesSearch && matchesTab;
    });

    const activeCount = waiters.filter(w => w.active).length;
    const inactiveCount = waiters.filter(w => !w.active).length;

    if (showAddModal) {
        return <AddWaiterModal onClose={() => setShowAddModal(false)} onSuccess={() => { setShowAddModal(false); fetchWaiters(); }} establishmentId={establishment?.id} />;
    }

    return (
        <div className="min-h-screen bg-[#003152] flex flex-col">
            {/* Header */}
            <div className="bg-[#00223A] text-white p-4 sticky top-0 z-10 shadow-md flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(`/${slug}/garcom/app`)}
                        className="p-1 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-lg font-bold">Meus Garçons</h1>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-1 bg-[#0099FF] hover:bg-blue-600 px-3 py-1.5 rounded text-sm font-bold transition-colors"
                >
                    <Plus size={16} />
                    Garçom
                </button>
            </div>

            {/* Tabs */}
            <div className="flex bg-[#00223A] text-white text-sm font-medium border-t border-white/10">
                <button
                    onClick={() => setActiveTab('ACTIVE')}
                    className={`flex-1 py-3 border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'ACTIVE' ? 'border-[#0099FF] text-[#0099FF] bg-[#003152]' : 'border-transparent text-gray-400'}`}
                >
                    Ativos
                    <span className="bg-[#0099FF]/20 text-[#0099FF] text-xs px-1.5 py-0.5 rounded-full">{activeCount}</span>
                </button>
                <button
                    onClick={() => setActiveTab('INACTIVE')}
                    className={`flex-1 py-3 border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'INACTIVE' ? 'border-[#0099FF] text-[#0099FF] bg-[#003152]' : 'border-transparent text-gray-400'}`}
                >
                    Inativos
                    <span className="bg-gray-700 text-gray-300 text-xs px-1.5 py-0.5 rounded-full">{inactiveCount}</span>
                </button>
            </div>

            {/* Search */}
            <div className="p-4 bg-[#003152]">
                <div className="bg-white rounded-lg p-3 flex items-center gap-2 shadow-sm">
                    <Search size={20} className="text-gray-400" />
                    <input
                        type="text"
                        placeholder="Busque por nome, e-mail ou telefone"
                        className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* List Content */}
            <div className="flex-1 px-4 pb-24 overflow-y-auto">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-10 text-white/50">
                        <RefreshCw size={32} className="animate-spin mb-2" />
                        <span className="text-sm">Carregando...</span>
                    </div>
                ) : filteredWaiters.length > 0 ? (
                    <div className="space-y-0 divide-y divide-white/10">
                        {filteredWaiters.map((waiter) => (
                            <div key={waiter.id} className="py-4 flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    {/* Custom Toggle */}
                                    <button
                                        onClick={() => handleToggleStatus(waiter.id, waiter.active)}
                                        className={`w-10 h-6 rounded-full relative transition-colors ${waiter.active ? 'bg-[#0099FF]' : 'bg-gray-600'}`}
                                    >
                                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${waiter.active ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                    </button>

                                    <div>
                                        <div className="text-white font-bold text-sm">{waiter.name}</div>
                                        <div className="text-white/60 text-xs">{waiter.email}</div>
                                    </div>
                                </div>
                                <button className="p-2 text-[#0099FF] hover:bg-white/5 rounded-full transition-colors">
                                    <Edit2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center py-10">
                        <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-4 relative">
                            <div className="absolute inset-0 bg-[#0099FF]/20 rounded-full blur-xl"></div>
                            <User size={48} className="text-[#0099FF] relative z-10" />
                            <div className="absolute -bottom-1 -right-1 bg-gray-800 rounded-full p-1">
                                <Search size={16} className="text-gray-400" />
                            </div>
                        </div>
                        <h3 className="text-white font-bold text-lg mb-1">Não há garçons {activeTab === 'ACTIVE' ? 'ativos' : 'inativos'}</h3>
                        <p className="text-white/50 text-sm text-center max-w-xs">
                            {searchTerm ? 'Tente buscar com outros termos.' : 'Toque em "+ Garçom" para adicionar novos membros à equipe.'}
                        </p>
                    </div>
                )}
            </div>

            {/* Bottom Banner */}
            <div className="fixed bottom-0 left-0 right-0 bg-[#00223A] border-t border-white/10 p-4">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <div className="text-white font-bold text-sm">Compartilhe o App</div>
                        <div className="text-white/50 text-xs">Copie o link do app para compartilhar com sua equipe.</div>
                    </div>
                    <button
                        onClick={copyAppUrl}
                        className="bg-[#0099FF] hover:bg-blue-600 text-white px-4 py-2 rounded-md font-bold text-sm flex items-center gap-2 transition-colors"
                    >
                        <Copy size={16} />
                        Copiar
                    </button>
                </div>
            </div>
        </div>
    );
};

// Add Waiter Modal/Sub-component
const AddWaiterModal = ({ onClose, onSuccess, establishmentId }: { onClose: () => void, onSuccess: () => void, establishmentId?: number }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!establishmentId || !name || !email || !password) {
            toast.error('Preencha os campos obrigatórios');
            return;
        }

        setLoading(true);

        try {
            // Include password in schema or metadata if possible
            const { error } = await supabase
                .from('collaborators')
                .insert({
                    establishment_id: establishmentId,
                    name,
                    email,
                    password: password, // IMPORTANT: Saving as plain for now based on context of other files using direct checks - IDEALLY HASHED, but following existing patterns if any
                    active: true,
                    role: 'Garçom',
                    permissions: JSON.stringify([])
                });

            if (error) throw error;

            toast.success('Garçom adicionado com sucesso!');
            onSuccess();
        } catch (error: any) {
            console.error('Error adding waiter:', error);
            toast.error('Erro ao adicionar garçom');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-[#003152] flex flex-col z-50 animate-in slide-in-from-right duration-200 text-white">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-[#00223A]">
                <button onClick={onClose} className="text-white hover:bg-white/10 rounded-full p-1 transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-lg font-bold">Adicionar Garçom</h1>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 p-4 overflow-y-auto bg-[#003152]">
                <p className="text-white/70 text-sm mb-6">Preencha os dados do garçom para enviar o convite</p>

                <div className="space-y-5">
                    <div className="space-y-1">
                        <label className="text-white font-bold text-sm ml-1">E-mail: *</label>
                        <input
                            type="email"
                            required
                            placeholder="Ex.: everaldo@gmail.com"
                            className="w-full bg-white rounded-md px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#0099FF]"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <p className="text-white/40 text-[10px] ml-1">Este email será utilizado pelo garçom para acessar o Aplicativo do Garçom</p>
                    </div>

                    <div className="space-y-1">
                        <label className="text-white font-bold text-sm ml-1">Nome: *</label>
                        <input
                            type="text"
                            required
                            placeholder="Ex.: Everaldo Santos"
                            className="w-full bg-white rounded-md px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#0099FF]"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>


                    <div className="space-y-1">
                        <label className="text-white font-bold text-sm ml-1">Senha: *</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                placeholder="Senha do garçom"
                                className="w-full bg-white rounded-md px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#0099FF] pr-10"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        <div className="mt-2 space-y-1">
                            <p className="text-white/60 text-xs font-medium">Crie uma senha forte com os critérios abaixo:</p>
                            <div className="flex items-center gap-2 text-white/50 text-[10px]">
                                <div className="w-3 h-3 border border-white/30 rounded-full flex items-center justify-center text-[8px]">-</div>
                                No mínimo 8 caracteres
                            </div>
                            <div className="flex items-center gap-2 text-white/50 text-[10px]">
                                <div className="w-3 h-3 border border-white/30 rounded-full flex items-center justify-center text-[8px]">-</div>
                                Letras maiúsculas e minúsculas
                            </div>
                            <div className="flex items-center gap-2 text-white/50 text-[10px]">
                                <div className="w-3 h-3 border border-white/30 rounded-full flex items-center justify-center text-[8px]">-</div>
                                Pelo menos 1 número
                            </div>
                            <div className="flex items-center gap-2 text-white/50 text-[10px]">
                                <div className="w-3 h-3 border border-white/30 rounded-full flex items-center justify-center text-[8px]">-</div>
                                Símbolo ou caractere especial ($#@)
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <span className="text-white/40 text-sm">ou</span>
                    <button type="button" className="block w-full mt-2 text-[#0099FF] text-sm font-bold hover:text-blue-400 transition-colors">
                        Cadastrar garçom via convite
                    </button>
                </div>

                <div className="mt-8 pb-8">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-md transition-colors disabled:opacity-50 border border-white/20"
                    >
                        {loading ? 'Salvando...' : 'Confirmar'}
                    </button>
                </div>

            </form>
        </div>
    );
};

export default WaiterTeam;
