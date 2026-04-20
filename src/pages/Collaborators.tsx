import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import CollaboratorModal from '../components/CollaboratorModal';

interface Collaborator {
    id: number;
    name: string;
    role: string;
    phone: string;
    active: boolean;
}

const Collaborators = () => {
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCollaborator, setEditingCollaborator] = useState<Collaborator | null>(null);

    // Pagination (Simple client-side for now or DB limit)
    const [page, setPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchCollaborators();
    }, []);

    const fetchCollaborators = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('collaborators')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                // If the table doesn't exist yet, we might get an error. Handle gracefully.
                console.error('Error fetching collaborators:', error);
            } else {
                setCollaborators(data || []);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (collaborator: Collaborator) => {
        setEditingCollaborator(collaborator);
        setIsModalOpen(true);
    };

    const handleToggleStatus = async (collaborator: Collaborator) => {
        try {
            const { error } = await supabase
                .from('collaborators')
                .update({ active: !collaborator.active })
                .eq('id', collaborator.id);

            if (error) throw error;

            // Optimistic update
            setCollaborators(prev =>
                prev.map(c => c.id === collaborator.id ? { ...c, active: !c.active } : c)
            );
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Erro ao atualizar status');
        }
    };

    const filteredCollaborators = collaborators.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredCollaborators.length / itemsPerPage);
    const currentCollaborators = filteredCollaborators.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    return (
        <div className="p-6 h-[calc(100vh-64px)] overflow-y-auto bg-gray-50 font-sans">
            <div className="max-w-7xl mx-auto">
                <div className="mb-2 text-xs text-gray-500">
                    Início <span className="mx-1">›</span> Minha Conta <span className="mx-1">›</span> <span className="text-gray-700 font-medium">Colaboradores</span>
                </div>

                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-800">Colaboradores</h1>
                    <button
                        onClick={() => {
                            setEditingCollaborator(null);
                            setIsModalOpen(true);
                        }}
                        className="bg-[#0099FF] hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors text-sm"
                    >
                        <Plus size={18} /> Novo colaborador
                    </button>
                </div>

                {/* Search */}
                <div className="bg-transparent mb-6">
                    <div className="relative max-w-md bg-white rounded-lg shadow-sm">
                        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar colaborador"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-500 text-sm"
                        />
                    </div>
                </div>

                {/* Table Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                        <span className="font-bold text-gray-700 text-sm">Total de {filteredCollaborators.length.toString().padStart(2, '0')} registro{filteredCollaborators.length !== 1 ? 's' : ''}</span>

                        {/* Pagination Controls */}
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span className="px-2 py-1 border rounded bg-white">{page}</span>
                            <span>de {totalPages || 1}</span>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages || totalPages === 0}
                                    className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                            <select className="border rounded p-1 text-xs">
                                <option>10</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-4 w-24">Status</th>
                                    <th className="px-6 py-4">Funcionário</th>
                                    <th className="px-6 py-4">Cargo</th>
                                    <th className="px-6 py-4">Telefone</th>
                                    <th className="px-6 py-4 text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Carregando...</td>
                                    </tr>
                                ) : currentCollaborators.length > 0 ? (
                                    currentCollaborators.map((collab) => (
                                        <tr key={collab.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <button onClick={() => handleToggleStatus(collab)} className="text-[#0099FF]">
                                                    {collab.active ? (
                                                        <div className="w-10 h-6 bg-[#0099FF]/20 rounded-full flex items-center px-0.5 transition-all">
                                                            <div className="w-5 h-5 bg-[#0099FF] rounded-full shadow-sm flex items-center justify-center translate-x-4 transition-transform">
                                                                <svg width="10" height="8" viewBox="0 0 10 8" fill="none" className="text-white transform scale-75">
                                                                    <path d="M9 1L3.5 6.5L1 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="w-10 h-6 bg-gray-200 rounded-full flex items-center px-0.5 transition-all">
                                                            <div className="w-5 h-5 bg-white rounded-full shadow-sm transition-transform"></div>
                                                        </div>
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-800">{collab.name}</td>
                                            <td className="px-6 py-4 text-gray-500">{collab.role || '--'}</td>
                                            <td className="px-6 py-4 text-gray-500">{collab.phone || '--'}</td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleEdit(collab)}
                                                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                            Nenhum colaborador encontrado
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <CollaboratorModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchCollaborators}
                collaboratorToEdit={editingCollaborator}
            />
        </div>
    );
};

export default Collaborators;
