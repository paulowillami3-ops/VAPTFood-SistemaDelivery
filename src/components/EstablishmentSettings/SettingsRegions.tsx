import { useState, useEffect } from 'react';
import { HelpCircle, Search, Plus, Edit2, Trash2, AlertCircle, X, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { DeliveryRegion } from '../../types/establishment';

export const SettingsRegions = () => {
    const [regions, setRegions] = useState<DeliveryRegion[]>([]);
    const [, setIsLoadingRegions] = useState(false);
    const [showRegionModal, setShowRegionModal] = useState(false);
    const [editingRegion, setEditingRegion] = useState<DeliveryRegion | null>(null);
    const [newRegionName, setNewRegionName] = useState('');
    const [newRegionFee, setNewRegionFee] = useState('');
    const [showSuccessToast, setShowSuccessToast] = useState(false);

    useEffect(() => {
        fetchRegions();
    }, []);

    const fetchRegions = async () => {
        setIsLoadingRegions(true);
        try {
            const { data, error } = await supabase
                .from('delivery_regions')
                .select('*')
                .order('name');

            if (error) throw error;
            setRegions(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoadingRegions(false);
        }
    };

    const handleSaveRegion = async () => {
        if (!newRegionName) return;
        try {
            const regionData = {
                name: newRegionName,
                fee: parseFloat(newRegionFee) || 0,
                active: true
            };

            const { error } = editingRegion
                ? await supabase.from('delivery_regions').update(regionData).eq('id', editingRegion.id)
                : await supabase.from('delivery_regions').insert([regionData]);

            if (error) throw error;

            fetchRegions();
            setShowRegionModal(false);
            setEditingRegion(null);
            setNewRegionName('');
            setNewRegionFee('');
            setShowSuccessToast(true);
            setTimeout(() => setShowSuccessToast(false), 3000);
        } catch (err) {
            console.error(err);
            alert('Erro ao salvar região');
        }
    };

    const handleDeleteRegion = async (id: number) => {
        if (!confirm('Tem certeza?')) return;
        const { error } = await supabase.from('delivery_regions').delete().eq('id', id);
        if (!error) fetchRegions();
    };

    const toggleRegionStatus = async (region: DeliveryRegion) => {
        const { error } = await supabase.from('delivery_regions').update({ active: !region.active }).eq('id', region.id);
        if (!error) fetchRegions();
    };

    return (
        <div className="space-y-6 animate-fade-in relative">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">7. Regiões de atendimento</h2>
                    <p className="text-sm text-gray-500">Adicione pelo menos uma região de atendimento do seu estabelecimento.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingRegion(null);
                        setNewRegionName('');
                        setNewRegionFee('');
                        setShowRegionModal(true);
                    }}
                    className="px-4 py-2 bg-blue-50 border border-blue-200 text-blue-600 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-100 transition-colors"
                >
                    <Plus size={16} />
                    Adicionar Região
                </button>
            </div>

            <div className="flex gap-0 border border-blue-500 rounded-md w-fit overflow-hidden mb-6">
                <button className="px-6 py-2.5 bg-blue-500 text-white font-bold text-sm">Bairro</button>
                <button className="px-6 py-2.5 bg-white text-gray-600 font-bold text-sm border-l border-blue-100 hover:bg-gray-50 opacity-60 cursor-not-allowed">Raio</button>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                <h4 className="font-bold text-sm text-gray-800 mb-3">O cliente pode editar no cadastro do endereço de entrega:</h4>
                <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 text-sm text-gray-700 opacity-60 cursor-not-allowed">
                        <div className={`w-10 h-5 bg-blue-500 rounded-full relative transition-colors`}>
                            <div className={`w-3 h-3 bg-white rounded-full absolute top-1 right-1 transition-transform`} />
                        </div>
                        Bairro <HelpCircle size={14} className="text-blue-400" />
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 opacity-60 cursor-not-allowed">
                        <div className={`w-10 h-5 bg-gray-300 rounded-full relative transition-colors`}>
                            <div className={`w-3 h-3 bg-white rounded-full absolute top-1 left-1 transition-transform`} />
                        </div>
                        Cidade <HelpCircle size={14} className="text-blue-400" />
                    </label>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-700">Total de {regions.length} registros</h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar"
                            className="pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 w-16 text-center">Status</th>
                                <th className="px-4 py-3">Bairro</th>
                                <th className="px-4 py-3">Taxa de Entrega</th>
                                <th className="px-4 py-3 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {regions.map((region) => (
                                <tr key={region.id} className="hover:bg-gray-50 group">
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => toggleRegionStatus(region)}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${region.active ? 'bg-blue-500' : 'bg-gray-300'}`}
                                        >
                                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${region.active ? 'translate-x-5' : 'translate-x-1'}`} />
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 font-medium text-gray-800">{region.name}</td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(region.fee)}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => {
                                                    setEditingRegion(region);
                                                    setNewRegionName(region.name);
                                                    setNewRegionFee(region.fee.toString());
                                                    setShowRegionModal(true);
                                                }}
                                                className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteRegion(region.id)}
                                                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {regions.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-gray-400 italic">
                                        Nenhuma região cadastrada. Clique em "Adicionar Região" para cadastrar.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Side Drawer Modal */}
            {showRegionModal && (
                <div className="fixed inset-0 z-[70] flex justify-end">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/30 backdrop-blur-[1px] transition-opacity"
                        onClick={() => setShowRegionModal(false)}
                    ></div>

                    {/* Drawer */}
                    <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                        {/* Drawer Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-800">
                                {editingRegion ? 'Editar Bairro' : 'Bairro'}
                            </h3>
                            <button
                                onClick={() => setShowRegionModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Drawer Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Alert Box */}
                            <div className="bg-gray-50 border border-gray-200 rounded-md p-3 flex items-start gap-3">
                                <AlertCircle className="text-gray-500 shrink-0 mt-0.5" size={18} />
                                <div className="flex-1 text-sm text-gray-600">
                                    <p className="font-medium text-gray-800">Atenção! Existem campos obrigatórios nesta sessão.</p>
                                </div>
                                <button className="text-gray-400 hover:text-gray-600">
                                    <X size={14} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Bairro *</label>
                                    <input
                                        type="text"
                                        value={newRegionName}
                                        onChange={(e) => setNewRegionName(e.target.value)}
                                        placeholder="Ex.: Bairro Anjo"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Valor *</label>
                                    <input
                                        type="number"
                                        value={newRegionFee}
                                        onChange={(e) => setNewRegionFee(e.target.value)}
                                        placeholder="Ex.: R$ 5,00"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        step="0.01"
                                        min="0"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Drawer Footer */}
                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                            <button
                                onClick={() => setShowRegionModal(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 font-bold rounded-md hover:bg-gray-300 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveRegion}
                                disabled={!newRegionName || !newRegionFee}
                                className="px-6 py-2 bg-[#0099FF] text-white font-bold rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
                            >
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Toast */}
            {showSuccessToast && (
                <div className="fixed top-20 right-4 z-[80] animate-in slide-in-from-right duration-300">
                    <div className="bg-[#22C55E] text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px]">
                        <div className="p-1 rounded-full border-2 border-white/30">
                            <CheckCircle size={16} className="text-white" />
                        </div>
                        <span className="font-medium flex-1">Região salva com sucesso</span>
                        <button
                            onClick={() => setShowSuccessToast(false)}
                            className="text-white/70 hover:text-white border-l border-white/20 pl-3 ml-1"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

