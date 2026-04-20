import { X, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface AddonGroup {
    id: number;
    name: string;
    description?: string;
    min_quantity: number;
    max_quantity: number;
    is_required: boolean;
    selection_mode?: 'QUANTITY' | 'SELECTION' | 'BOX';
}

interface ImportAddonGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (groups: AddonGroup[]) => void;
    existingGroupIds: number[];
    establishmentId?: number;
}

const ImportAddonGroupModal = ({ isOpen, onClose, onImport, existingGroupIds, establishmentId }: ImportAddonGroupModalProps) => {
    const [groups, setGroups] = useState<AddonGroup[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchGroups();
            setSelectedIds([]); // Reset selection on open
        }
    }, [isOpen, establishmentId]);

    const fetchGroups = async () => {
        if (!establishmentId) return;
        setLoading(true);
        const { data } = await supabase
            .from('addon_groups')
            .select('*')
            .eq('establishment_id', establishmentId)
            .order('name');

        if (data) {
            setGroups(data);
        }
        setLoading(false);
    };

    const toggleSelection = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(gid => gid !== id) : [...prev, id]
        );
    };

    const handleImport = () => {
        const selectedGroups = groups.filter(g => selectedIds.includes(g.id));
        onImport(selectedGroups);
        onClose();
    };

    const filteredGroups = groups.filter(g =>
        !existingGroupIds.includes(g.id) &&
        g.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[80vh]">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">Importar Grupo</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6">
                    <div className="relative mb-6">
                        <input
                            type="text"
                            placeholder="Buscar grupos..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-600"
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <Search size={18} />
                        </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center text-gray-400">Carregando...</div>
                        ) : filteredGroups.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">Nenhum grupo disponível para importar.</div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {filteredGroups.map(group => (
                                    <label key={group.id} className="flex items-start gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                                        <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0
                                            ${selectedIds.includes(group.id) ? 'bg-[#0099FF] border-[#0099FF] text-white' : 'border-gray-300 bg-white'}`}>
                                            {selectedIds.includes(group.id) && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={selectedIds.includes(group.id)}
                                            onChange={() => toggleSelection(group.id)}
                                        />
                                        <div>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="font-bold text-gray-700">{group.name}</span>
                                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                                    {group.is_required ? 'Obrigatório' : 'Opcional'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500">{group.description || 'Sem descrição'}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={selectedIds.length === 0}
                        className="px-6 py-2.5 bg-[#0099FF] text-white font-bold rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Importar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImportAddonGroupModal;
