import { Monitor, Plus, Pencil, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useEstablishment } from '../contexts/EstablishmentContext';
import KDSEditModal from '../components/KDSEditModal';
import type { KDSScreenData } from '../components/KDSEditModal';
import KDSDeleteModal from '../components/KDSDeleteModal';
import { supabase } from '../lib/supabase';

interface KDSScreen extends KDSScreenData {
    id: number;
}

const KDS = () => {
    const navigate = useNavigate();
    const { establishment } = useEstablishment();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // State to manage screens
    const [screens, setScreens] = useState<KDSScreen[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [screenToDelete, setScreenToDelete] = useState<number | null>(null);
    const [editingScreen, setEditingScreen] = useState<KDSScreen | null>(null);

    // Fetch screens on mount
    useEffect(() => {
        if (establishment?.id) {
            fetchScreens();
        }
    }, [establishment?.id]);

    const fetchScreens = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('kds_screens')
                .select('*')
                .eq('establishment_id', establishment.id)
                .order('id', { ascending: true });

            if (error) {
                console.error('Error fetching screens:', error);
            } else {
                // Map database columns to frontend model if necessary, 
                // but names match (name, preparation_time -> preparationTime, categories, addons)
                // Need to map snake_case from DB to camelCase for frontend
                const mappedScreens = data?.map(item => ({
                    id: item.id,
                    name: item.name,
                    preparationTime: item.preparation_time,
                    categories: item.categories || [],
                    addons: item.addons || []
                })) || [];
                setScreens(mappedScreens);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddClick = () => {
        setEditingScreen(null);
        setIsEditModalOpen(true);
    };

    const handleEditClick = (screen: KDSScreen) => {
        setEditingScreen(screen);
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = (id: number) => {
        setScreenToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (screenToDelete) {
            try {
                const { error } = await supabase
                    .from('kds_screens')
                    .delete()
                    .eq('id', screenToDelete);

                if (error) {
                    console.error('Error deleting screen:', error);
                } else {
                    await fetchScreens(); // Refresh list
                    setScreenToDelete(null);
                }
            } catch (error) {
                console.error('Error:', error);
            }
        }
        setIsDeleteModalOpen(false);
    };

    const handleSaveScreen = async (data: KDSScreenData) => {
        try {
            const payload = {
                establishment_id: establishment.id,
                name: data.name,
                preparation_time: data.preparationTime,
                categories: data.categories.map(String),
                addons: data.addons
            };

            if (editingScreen?.id) {
                // Update existing screen
                const { error } = await supabase
                    .from('kds_screens')
                    .update(payload)
                    .eq('id', editingScreen.id);

                if (error) throw error;
            } else {
                // Add new screen
                const { error } = await supabase
                    .from('kds_screens')
                    .insert([payload]);

                if (error) throw error;
            }

            await fetchScreens(); // Refresh list
            setIsEditModalOpen(false);
        } catch (error) {
            console.error('Error saving screen:', error);
            alert('Erro ao salvar tela. Verifique o console.');
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <KDSEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                initialData={editingScreen}
                onSave={handleSaveScreen}
            />
            <KDSDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
            />

            <header className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Cozinha (KDS)</h1>
                <nav className="flex items-center text-sm text-gray-500">
                    <span className="hover:text-blue-500 cursor-pointer">Início</span>
                    <span className="mx-2">›</span>
                    <span className="hover:text-blue-500 cursor-pointer">Cozinha (KDS)</span>
                    <span className="mx-2">›</span>
                    <span className="text-gray-700 font-medium">Mapa de telas KDS</span>
                </nav>
            </header>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 min-h-[400px]">
                {isLoading ? (
                    <div className="flex items-center justify-center h-40">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {/* Add New Screen Card */}
                        <button
                            onClick={handleAddClick}
                            className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
                        >
                            <div className="w-10 h-10 rounded-full border-2 border-gray-400 group-hover:border-blue-500 flex items-center justify-center mb-3 text-gray-400 group-hover:text-blue-500">
                                <Plus size={24} />
                            </div>
                            <span className="font-medium text-gray-500 group-hover:text-blue-600">Adicionar tela KDS</span>
                        </button>

                        {/* Dynamic Kitchen Screen Cards */}
                        {screens.map((screen) => (
                            <div key={screen.id} className="flex h-40 rounded-lg overflow-hidden shadow-sm border border-gray-100 group hover:shadow-md transition-shadow">
                                {/* Main Content */}
                                <div
                                    onClick={() => {
                                        const urlSlug = window.location.pathname.split('/')[1];
                                        navigate(`/${establishment.slug || urlSlug || 'noia-burguer'}/admin/kds/view?screen_id=${screen.id}`);
                                    }}
                                    className="flex-1 bg-[#0099FF] p-6 flex flex-col items-center justify-center text-white cursor-pointer hover:bg-blue-600 transition-colors"
                                >
                                    <Monitor size={40} className="mb-3" />
                                    <span className="font-bold text-lg">{screen.name}</span>
                                </div>

                                {/* Actions Side Panel */}
                                <div className="w-12 bg-white flex flex-col items-center justify-center border-l border-gray-100 divide-y divide-gray-100">
                                    <button
                                        onClick={() => handleEditClick(screen)}
                                        className="h-1/2 w-full flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                                        title="Editar"
                                    >
                                        <Pencil size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(screen.id)}
                                        className="h-1/2 w-full flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-gray-50 transition-colors"
                                        title="Excluir"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default KDS;
