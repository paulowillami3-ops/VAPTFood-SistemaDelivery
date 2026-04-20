import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
// import { useEstablishment } from '../contexts/EstablishmentContext';
import { Save, ShoppingBag, Tag } from 'lucide-react';

const FeaturedProductsSettings = () => {
    // const { establishment } = useEstablishment();
    const [mode, setMode] = useState<'most_sold' | 'promotional'>('most_sold');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('establishment_settings')
                .select('featured_products_mode')
                .single();

            if (error) throw error;
            if (data) {
                setMode(data.featured_products_mode as any || 'most_sold');
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('establishment_settings')
                .update({ featured_products_mode: mode })
                .eq('id', 1); // Assuming single tenant for now or use establishment logic

            if (error) throw error;
            alert('Configurações salvas com sucesso!');
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Erro ao salvar configurações.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Carregando configurações...</div>;
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Produtos em destaque</h1>
            <p className="text-gray-500 mb-8">Incentive a compra na sua loja destacando seus produtos</p>

            <div className="flex flex-col md:flex-row gap-6 mb-8">
                {/* Phone Preview Mockup */}
                <div className="w-[300px] border-8 border-gray-800 rounded-[2.5rem] overflow-hidden bg-white shadow-xl flex-shrink-0 h-[600px] relative">
                    <div className="bg-[#0099FF] h-32 flex items-center justify-center pt-8">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center font-bold text-gray-300">LOGO</div>
                    </div>
                    <div className="p-4 space-y-4">
                        {mode === 'most_sold' ? (
                            <>
                                <h3 className="font-bold text-gray-800 text-sm mb-2">Mais pedidos</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {[1, 2].map(i => (
                                        <div key={i} className="bg-white border border-gray-100 rounded-lg p-2 shadow-sm">
                                            <div className="aspect-square bg-gray-100 rounded-md mb-2"></div>
                                            <div className="h-2 w-full bg-gray-100 rounded mb-1"></div>
                                            <div className="h-2 w-1/2 bg-gray-100 rounded"></div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <>
                                <h3 className="font-bold text-gray-800 text-sm mb-2">Destaques</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {[1, 2].map(i => (
                                        <div key={i} className="bg-white border border-gray-100 rounded-lg p-2 shadow-sm relative overflow-hidden">
                                            <div className="absolute top-0 right-0 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-bl">-10%</div>
                                            <div className="aspect-square bg-gray-100 rounded-md mb-2"></div>
                                            <div className="h-2 w-full bg-gray-100 rounded mb-1"></div>
                                            <div className="h-2 w-1/2 bg-gray-100 rounded"></div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                        {/* List Skeletons */}
                        <div className="space-y-2 mt-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-16 bg-gray-50 rounded-lg w-full"></div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Options */}
                <div className="flex-1 space-y-4">
                    <label
                        className={`block p-6 border-2 rounded-xl cursor-pointer transition-all ${mode === 'most_sold' ? 'border-[#0099FF] bg-blue-50/10' : 'border-gray-200 hover:border-gray-300'}`}
                        onClick={() => setMode('most_sold')}
                    >
                        <div className="flex items-start gap-4">
                            <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${mode === 'most_sold' ? 'border-[#0099FF]' : 'border-gray-300'}`}>
                                {mode === 'most_sold' && <div className="w-2.5 h-2.5 bg-[#0099FF] rounded-full" />}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <ShoppingBag size={20} className={mode === 'most_sold' ? 'text-[#0099FF]' : 'text-gray-400'} />
                                    <h3 className="font-bold text-gray-800">Os mais pedidos</h3>
                                </div>
                                <p className="text-sm text-gray-500 leading-relaxed">
                                    Os seis produtos mais pedidos da sua loja aparecerão em destaque no topo do cardápio.
                                </p>
                            </div>
                        </div>
                    </label>

                    <label
                        className={`block p-6 border-2 rounded-xl cursor-pointer transition-all ${mode === 'promotional' ? 'border-[#0099FF] bg-blue-50/10' : 'border-gray-200 hover:border-gray-300'}`}
                        onClick={() => setMode('promotional')}
                    >
                        <div className="flex items-start gap-4">
                            <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${mode === 'promotional' ? 'border-[#0099FF]' : 'border-gray-300'}`}>
                                {mode === 'promotional' && <div className="w-2.5 h-2.5 bg-[#0099FF] rounded-full" />}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Tag size={20} className={mode === 'promotional' ? 'text-[#0099FF]' : 'text-gray-400'} />
                                    <h3 className="font-bold text-gray-800">Destaques promocionais</h3>
                                </div>
                                <p className="text-sm text-gray-500 leading-relaxed">
                                    Os seis produtos com os maiores descontos cadastrados por você (Preço Original vs Preço Atual) aparecerão em destaque.
                                </p>
                            </div>
                        </div>
                    </label>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-8 py-3 bg-[#0099FF] text-white font-bold rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                    <Save size={20} />
                    {isSaving ? 'Salvando...' : 'Salvar Configurações'}
                </button>
            </div>
        </div>
    );
};

export default FeaturedProductsSettings;
