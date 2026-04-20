import { X, ChevronDown, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useEstablishment } from '../contexts/EstablishmentContext';

interface NewCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    categoryToEdit?: any; // Add category to edit prop
}

const NewCategoryModal = ({ isOpen, onClose, onSuccess, categoryToEdit }: NewCategoryModalProps) => {
    const { establishment } = useEstablishment();
    const [name, setName] = useState('');
    const [type, setType] = useState('Itens Principais');
    const [isPromo, setIsPromo] = useState(false);
    const [availability, setAvailability] = useState('always');
    const [channels, setChannels] = useState({
        all: true,
        app: true,
        pos: true,
        digital: true,
        qrcode: true
    });
    const [isLoading, setIsLoading] = useState(false);

    // Populate form when editing
    useEffect(() => {
        if (isOpen && categoryToEdit) {
            setName(categoryToEdit.name);
            setType(categoryToEdit.type || 'Itens Principais');
            setIsPromo(categoryToEdit.is_promo);
            setAvailability(categoryToEdit.availability || 'always');

            // Map channels array to object
            if (categoryToEdit.channels && Array.isArray(categoryToEdit.channels)) {
                const newChannels = {
                    all: categoryToEdit.channels.includes('all'),
                    app: categoryToEdit.channels.includes('all') || categoryToEdit.channels.includes('app'),
                    pos: categoryToEdit.channels.includes('all') || categoryToEdit.channels.includes('pos'),
                    digital: categoryToEdit.channels.includes('all') || categoryToEdit.channels.includes('digital'),
                    qrcode: categoryToEdit.channels.includes('all') || categoryToEdit.channels.includes('qrcode')
                };
                setChannels(newChannels);
            }
        } else if (isOpen && !categoryToEdit) {
            // Reset for new creation
            setName('');
            setType('Itens Principais');
            setIsPromo(false);
            setAvailability('always');
            setChannels({
                all: true,
                app: true,
                pos: true,
                digital: true,
                qrcode: true
            });
        }
    }, [isOpen, categoryToEdit]);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!name.trim()) return;

        setIsLoading(true);
        try {
            const selectedChannels = channels.all ? ['all'] : Object.keys(channels).filter(key => key !== 'all' && channels[key as keyof typeof channels]);

            const payload = {
                name,
                type,
                is_promo: isPromo,
                availability,
                channels: selectedChannels
            };

            if (categoryToEdit) {
                const { error } = await supabase
                    .from('categories')
                    .update(payload)
                    .eq('id', categoryToEdit.id);
                if (error) throw error;
            } else {
                if (!establishment?.id) throw new Error('Missing establishment ID');
                const { error } = await supabase
                    .from('categories')
                    .insert([{ ...payload, establishment_id: establishment.id }]);
                if (error) throw error;
            }

            onSuccess();
            onClose();
            onClose();
            // Form reset is handled by useEffect when modal opens/closes or switches mode
        } catch (error) {
            console.error('Error creating category:', error);
            alert(categoryToEdit ? 'Erro ao atualizar categoria' : 'Erro ao criar categoria');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChannelChange = (channel: keyof typeof channels) => {
        if (channel === 'all') {
            const newValue = !channels.all;
            setChannels({
                all: newValue,
                app: newValue,
                pos: newValue,
                digital: newValue,
                qrcode: newValue
            });
        } else {
            const newChannels = { ...channels, [channel]: !channels[channel] };
            const allSelected = newChannels.app && newChannels.pos && newChannels.digital && newChannels.qrcode;
            setChannels({ ...newChannels, all: allSelected });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-6 pb-2">
                    <h2 className="text-xl font-bold text-gray-800">{categoryToEdit ? 'Editar Categoria' : 'Adicionar nova categoria'}</h2>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {/* Warning Banner */}
                    <div className="bg-gray-50 border border-gray-200 rounded p-4 mb-6 flex items-start justify-between">
                        <div className="flex items-center gap-2 text-gray-700 text-sm">
                            <span className="border border-gray-800 rounded-full w-5 h-5 flex items-center justify-center font-bold text-xs">!</span>
                            <span>Atenção! Existem campos obrigatórios nesta sessão.</span>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X size={16} />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Modelo */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Modelo *</label>
                            <div className="relative">
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                    className="w-full border border-gray-300 rounded px-4 py-2 appearance-none bg-white text-gray-600 focus:outline-none focus:border-blue-500"
                                >
                                    <option>Itens Principais</option>
                                    <option>Bebidas</option>
                                    <option>Sobremesas</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" size={16} />
                            </div>
                        </div>

                        {/* Nome */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Nome da categoria *</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ex.: Bebidas"
                                className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        {/* Promoção */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsPromo(!isPromo)}
                                className={`w-12 h-6 rounded-full relative transition-colors ${isPromo ? 'bg-blue-500' : 'bg-gray-300'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${isPromo ? 'left-7' : 'left-1'}`}></div>
                            </button>
                            <span className="text-sm font-bold text-gray-700">Promoção</span>
                        </div>

                        {/* Disponibilidade */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-700 mb-4">Disponibilidade</h3>
                            <div className="space-y-4">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <div className="mt-0.5">
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${availability === 'always' ? 'border-blue-500' : 'border-gray-300'}`}>
                                            {availability === 'always' && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>}
                                        </div>
                                    </div>
                                    <input type="radio" name="availability" className="hidden" checked={availability === 'always'} onChange={() => setAvailability('always')} />
                                    <div>
                                        <div className="text-sm font-bold text-gray-700">Sempre disponível</div>
                                        <div className="text-xs text-gray-500">O item ficará disponível sempre que o estabelecimento estiver aberto em todos os canais de venda</div>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 cursor-pointer">
                                    <div className="mt-0.5">
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${availability === 'paused' ? 'border-blue-500' : 'border-gray-300'}`}>
                                            {availability === 'paused' && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>}
                                        </div>
                                    </div>
                                    <input type="radio" name="availability" className="hidden" checked={availability === 'paused'} onChange={() => setAvailability('paused')} />
                                    <div>
                                        <div className="text-sm font-bold text-gray-700">Pausado e não disponível no cardápio</div>
                                        <div className="text-xs text-gray-500">Não aparecerá nos seus canais de venda</div>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 cursor-pointer">
                                    <div className="mt-0.5">
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${availability === 'specific' ? 'border-blue-500' : 'border-gray-300'}`}>
                                            {availability === 'specific' && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>}
                                        </div>
                                    </div>
                                    <input type="radio" name="availability" className="hidden" checked={availability === 'specific'} onChange={() => setAvailability('specific')} />
                                    <div>
                                        <div className="text-sm font-bold text-gray-700">Disponível em dias e horários específicos</div>
                                        <div className="text-xs text-gray-500">Escolha quando o item aparece nos seus canais de venda</div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Canais de Venda Info */}
                        <div className="text-sm text-gray-700" style={{ maxWidth: '400px' }}>
                            Os canais de venda são: App Garçom, PDV, Cardápio Digital e Cardápio QR Code de Mesa
                        </div>

                        {/* Canais Checkboxes */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-700 mb-2">Exibição por canais de venda</h3>
                            <p className="text-sm text-gray-600 mb-4">Selecione em quais locais deseja que essa categoria fique visível para os seus clientes.</p>

                            <div className="space-y-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${channels.all ? 'bg-[#0099FF] border-[#0099FF]' : 'border-gray-300 bg-white'}`}>
                                        {channels.all && <Check size={14} className="text-white" />}
                                    </div>
                                    <input type="checkbox" className="hidden" checked={channels.all} onChange={() => handleChannelChange('all')} />
                                    <span className="text-sm font-medium text-gray-700">Exibir em todos</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer pl-6">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${channels.app ? 'bg-[#0099FF] border-[#0099FF]' : 'border-gray-300 bg-white'}`}>
                                        {channels.app && <Check size={14} className="text-white" />}
                                    </div>
                                    <input type="checkbox" className="hidden" checked={channels.app} onChange={() => handleChannelChange('app')} />
                                    <span className="text-sm font-medium text-gray-700">Exibir no App Garçom</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer pl-6">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${channels.pos ? 'bg-[#0099FF] border-[#0099FF]' : 'border-gray-300 bg-white'}`}>
                                        {channels.pos && <Check size={14} className="text-white" />}
                                    </div>
                                    <input type="checkbox" className="hidden" checked={channels.pos} onChange={() => handleChannelChange('pos')} />
                                    <span className="text-sm font-medium text-gray-700">Exibir no PDV</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer pl-6">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${channels.digital ? 'bg-[#0099FF] border-[#0099FF]' : 'border-gray-300 bg-white'}`}>
                                        {channels.digital && <Check size={14} className="text-white" />}
                                    </div>
                                    <input type="checkbox" className="hidden" checked={channels.digital} onChange={() => handleChannelChange('digital')} />
                                    <span className="text-sm font-medium text-gray-700">Exibir no Cardápio Digital</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer pl-6">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${channels.qrcode ? 'bg-[#0099FF] border-[#0099FF]' : 'border-gray-300 bg-white'}`}>
                                        {channels.qrcode && <Check size={14} className="text-white" />}
                                    </div>
                                    <input type="checkbox" className="hidden" checked={channels.qrcode} onChange={() => handleChannelChange('qrcode')} />
                                    <span className="text-sm font-medium text-gray-700">Exibir no Cardápio QR Code de Mesa</span>
                                </label>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 flex justify-between gap-4 bg-white rounded-b-lg">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 bg-gray-100 text-gray-700 font-medium rounded hover:bg-gray-200 transition-colors"
                        disabled={isLoading}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 py-2 bg-[#90A4AE] text-white font-medium rounded hover:bg-slate-500 transition-colors flex items-center justify-center gap-2"
                        disabled={isLoading}
                    >
                        <span>Salvar</span>
                        <ChevronDown size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NewCategoryModal;
