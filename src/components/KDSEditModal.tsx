import { ChevronDown, Check, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useEstablishment } from '../contexts/EstablishmentContext';

export interface KDSScreenData {
    id?: number;
    name: string;
    preparationTime: number;
    categories: string[];
    addons: string[];
}

interface KDSEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: KDSScreenData | null;
    onSave: (data: KDSScreenData) => void;
}

interface Category {
    id: number;
    name: string;
}

const KDSEditModal = ({ isOpen, onClose, initialData, onSave }: KDSEditModalProps) => {
    const { establishment } = useEstablishment();
    const [categoriesOpen, setCategoriesOpen] = useState(true);

    const [showExitConfirmation, setShowExitConfirmation] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [preparationTime, setPreparationTime] = useState(20);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

    // Available Data
    const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(false);

    // Validation State
    const [isValid, setIsValid] = useState(false);

    useEffect(() => {
        if (isOpen && establishment?.id) {
            fetchCategories();
            setShowExitConfirmation(false);
            if (initialData) {
                // Edit Mode
                setName(initialData.name);
                setPreparationTime(initialData.preparationTime);
                // Ensure categories are strings for comparison if IDs are numbers in DB
                setSelectedCategories(initialData.categories.map(String));
                setSelectedAddons(initialData.addons);
            } else {
                // Add Mode (Reset)
                setName('');
                setPreparationTime(20);
                setSelectedCategories([]);
                setSelectedAddons([]);
            }
        }
    }, [isOpen, initialData, establishment?.id]);

    const fetchCategories = async () => {
        if (!establishment?.id) return;
        setLoadingCategories(true);
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('id, name')
                .eq('establishment_id', establishment.id)
                .order('name');

            if (error) throw error;
            setAvailableCategories(data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoadingCategories(false);
        }
    };

    useEffect(() => {
        // Validation Logic
        const isNameValid = name.trim().length > 0;
        const isTimeValid = preparationTime > 0;
        const isCategoriesValid = selectedCategories.length > 0;

        setIsValid(isNameValid && isTimeValid && isCategoriesValid);
    }, [name, preparationTime, selectedCategories]);

    if (!isOpen) return null;

    const handleClose = () => {
        setShowExitConfirmation(false);
        onClose();
    };

    const handleSave = () => {
        if (isValid) {
            onSave({
                id: initialData?.id,
                name,
                preparationTime,
                categories: selectedCategories,
                addons: selectedAddons
            });
            onClose();
        }
    };

    const toggleCategory = (categoryId: string) => {
        if (selectedCategories.includes(categoryId)) {
            setSelectedCategories(selectedCategories.filter(c => c !== categoryId));
        } else {
            setSelectedCategories([...selectedCategories, categoryId]);
        }
    };

    // Placeholder for Addons if we want to fetch them too later
    // const toggleAddon = (addon: string) => ...

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-black/50 transition-opacity" onClick={() => setShowExitConfirmation(true)} />

            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in">

                {/* Exit Confirmation Overlay */}
                {showExitConfirmation && (
                    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/20 backdrop-blur-[1px] animate-fade-in p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-scale-in">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold text-gray-800">Deseja sair sem salvar?</h3>
                                <button onClick={() => setShowExitConfirmation(false)} className="text-gray-400 hover:text-gray-600 p-1">
                                    <X size={20} />
                                </button>
                            </div>
                            <p className="text-gray-600 mb-8 text-sm">
                                Caso saia dessa tela sem salvar, você perderá as informações que foram editadas.
                            </p>
                            <div className="flex items-center justify-center gap-3">
                                <button
                                    onClick={handleClose}
                                    className="px-8 py-2.5 bg-[#0099FF] text-white font-medium rounded-lg hover:bg-blue-600 transition-colors flex-1"
                                >
                                    Sair
                                </button>
                                <button
                                    onClick={() => setShowExitConfirmation(false)}
                                    className="px-8 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors flex-1"
                                >
                                    Voltar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="p-6 pb-2">
                    <h2 className="text-xl font-bold text-gray-800">
                        {initialData ? 'Editar tela' : 'Adicionar tela'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Nomeie e selecione as categorias do seu cardápio que quer inserir nessa tela</p>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-6">
                    {/* Name Input */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Nome da tela KDS <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex.: Cozinha 2"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-700 placeholder-gray-400"
                        />
                    </div>

                    {/* Time Input */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Tempo médio de preparação dos pedidos
                        </label>
                        <input
                            type="number"
                            value={preparationTime}
                            onChange={(e) => setPreparationTime(Number(e.target.value))}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-700"
                        />
                        <p className="text-xs text-gray-400 mt-1">Em minutos</p>
                    </div>

                    {/* Categories Section */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-700 mb-3">Categorias</h3>
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <div
                                className="flex items-center justify-between p-4 bg-white cursor-pointer hover:bg-gray-50 border-b border-gray-100"
                                onClick={() => setCategoriesOpen(!categoriesOpen)}
                            >
                                <span className="font-medium text-gray-700">Selecione as categorias</span>
                                <ChevronDown size={20} className={`text-gray-400 transform transition-transform ${categoriesOpen ? 'rotate-180' : ''}`} />
                            </div>

                            {categoriesOpen && (
                                <div className="bg-white">
                                    {loadingCategories ? (
                                        <div className="p-4 text-center text-gray-500 text-sm">Carregando categorias...</div>
                                    ) : availableCategories.length > 0 ? (
                                        availableCategories.map(cat => {
                                            const catIdStr = String(cat.id);
                                            const isSelected = selectedCategories.includes(catIdStr);
                                            return (
                                                <div
                                                    key={cat.id}
                                                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 border-b border-gray-50 last:border-0"
                                                    onClick={() => toggleCategory(catIdStr)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-[#0099FF] border-[#0099FF] text-white' : 'bg-white border-gray-300'}`}>
                                                            {isSelected && <Check size={14} strokeWidth={3} />}
                                                        </div>
                                                        <span className="font-medium text-gray-700">{cat.name}</span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="p-4 text-center text-gray-500 text-sm">Nenhuma categoria encontrada.</div>
                                    )}
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                            {selectedCategories.length} selecionada(s) de {availableCategories.length}
                        </p>
                    </div>

                    {/* Add-ons Section - Simplified/Hidden for now or static as per request only mentioned categories */}
                    {/* 
                    <div>
                        <h3 className="text-sm font-bold text-gray-700 mb-3">Grupo de Adicionais</h3>
                        ...
                    </div> 
                    */}
                </div>

                {/* Footer */}
                <div className="p-4 bg-white border-t border-gray-100 flex items-center justify-center gap-3">
                    <button
                        onClick={handleSave}
                        disabled={!isValid}
                        className={`px-8 py-2.5 text-white font-medium rounded-lg transition-colors ${isValid ? 'bg-[#0099FF] hover:bg-blue-600' : 'bg-[#9CA3AF] cursor-not-allowed'}`}
                    >
                        Salvar
                    </button>
                    <button
                        onClick={() => setShowExitConfirmation(true)}
                        className="px-8 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default KDSEditModal;
