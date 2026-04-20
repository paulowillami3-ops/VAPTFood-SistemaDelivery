import { useState, useEffect } from 'react';
import { X, MapPin, Check } from 'lucide-react';

import { supabase } from '../lib/supabase';

interface DeliveryMethodModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: any) => void;
    initialData?: any;
    customerAddresses?: any[];
    customerName?: string;
    customerPhone?: string;
}

const DeliveryMethodModal = ({ isOpen, onClose, onConfirm, initialData, customerAddresses, customerName, customerPhone }: DeliveryMethodModalProps) => {
    const [activeTab, setActiveTab] = useState<'DELIVERY' | 'PICKUP' | 'DINE_IN'>('DELIVERY');
    const [addresses, setAddresses] = useState<any[]>(customerAddresses || []);
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
    const [deliveryFee, setDeliveryFee] = useState<string>('0,00');

    console.log('DeliveryMethodModal customerAddresses:', customerAddresses);

    useEffect(() => {
        if (customerAddresses && customerAddresses.length > 0) {
            setAddresses(customerAddresses);
        } else {
            setAddresses([]);
        }
    }, [customerAddresses]);

    // New State for Form
    const [viewMode, setViewMode] = useState<'LIST' | 'FORM'>('LIST');
    const [formAddress, setFormAddress] = useState({
        cep: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: ''
    });

    const [isLoadingCep, setIsLoadingCep] = useState(false);

    const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 8) value = value.slice(0, 8);

        // Mask 00000-000
        const displayValue = value.replace(/^(\d{5})(\d)/, '$1-$2');

        setFormAddress(prev => ({ ...prev, cep: displayValue }));

        if (value.length === 8) {
            setIsLoadingCep(true);
            try {
                const response = await fetch(`https://viacep.com.br/ws/${value}/json/`);
                const data = await response.json();

                if (!data.erro) {
                    setFormAddress(prev => ({
                        ...prev,
                        street: data.logradouro,
                        neighborhood: data.bairro,
                        city: data.localidade,
                        cep: displayValue
                    }));
                } else {
                    alert('CEP não encontrado');
                }
            } catch (error) {
                console.error('Erro ao buscar CEP:', error);
                alert('Erro ao buscar CEP');
            } finally {
                setIsLoadingCep(false);
            }
        }
    };

    const handleNewAddress = () => {
        setFormAddress({ cep: '', street: '', number: '', complement: '', neighborhood: '', city: '' });
        setViewMode('FORM');
    };

    const handleSaveAddress = async () => {
        if (!formAddress.street || !formAddress.number || !formAddress.neighborhood || !formAddress.city) {
            alert('Preencha os campos obrigatórios (*)');
            return;
        }

        const newId = Date.now(); // Temporary ID for UI
        const newAddress = { id: newId, ...formAddress };

        // Optimistic UI Update
        const updatedAddresses = [...addresses, newAddress];
        setAddresses(updatedAddresses);
        setSelectedAddressId(newId);
        setViewMode('LIST');

        // Persist to Supabase if we have a customer phone
        if (customerPhone) {
            const cleanPhone = customerPhone.replace(/\D/g, '');
            if (cleanPhone.length >= 10) {
                try {
                    // Check if customer exists
                    const { data: existingCustomer } = await supabase
                        .from('customers')
                        .select('id, addresses')
                        .eq('phone', cleanPhone)
                        .maybeSingle();

                    if (existingCustomer) {
                        // Update existing customer
                        const currentAddresses = existingCustomer.addresses || [];
                        // Ensure we don't save the temporary ID to the DB (optional, but cleaner)
                        // const addressToSave = { ...formAddress }; 
                        // Actually, keeping an ID might be useful, but for JSONB simple array is fine.
                        // Let's just append.
                        const newAddresses = [...currentAddresses, newAddress];

                        const { error } = await supabase
                            .from('customers')
                            .update({ addresses: newAddresses })
                            .eq('id', existingCustomer.id);

                        if (error) throw error;
                    } else {
                        // Create new customer
                        const { error } = await supabase
                            .from('customers')
                            .insert([{
                                phone: cleanPhone,
                                name: customerName || 'Cliente PDV',
                                addresses: [newAddress]
                            }]);

                        if (error) throw error;
                    }
                    console.log('Address saved to customer successfully');
                } catch (error) {
                    console.error('Error saving address to customer:', error);
                    alert('Erro ao salvar endereço no cadastro do cliente, mas ele foi adicionado ao pedido.');
                }
            }
        }
    };

    useEffect(() => {
        if (isOpen) {
            // Reset or load initial data
            setActiveTab(initialData?.type || 'DELIVERY');
            if (initialData?.fee) setDeliveryFee(initialData.fee.toFixed(2).replace('.', ','));
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        const fee = parseFloat(deliveryFee.replace(',', '.'));
        const selectedAddress = addresses.find(a => a.id === selectedAddressId);

        onConfirm({
            type: activeTab,
            deliveryFee: fee,
            address: selectedAddress
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">Forma de entrega</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('DELIVERY')}
                        className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'DELIVERY'
                            ? 'bg-[#0099FF] text-white border-[#0099FF]'
                            : 'bg-white text-gray-600 border-transparent hover:bg-gray-50'
                            }`}
                    >
                        [ E ] Entrega (delivery)
                    </button>
                    <button
                        onClick={() => setActiveTab('PICKUP')}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'PICKUP'
                            ? 'border-[#0099FF] text-[#0099FF] bg-blue-50'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        [ R ] Retirar no local
                    </button>
                    <button
                        onClick={() => setActiveTab('DINE_IN')}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'DINE_IN'
                            ? 'border-[#0099FF] text-[#0099FF] bg-blue-50'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        [ C ] Consumir no local
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 flex-1 overflow-y-auto">

                    {/* Address Section - Only for DELIVERY */}
                    {activeTab === 'DELIVERY' && (
                        <div className="space-y-4">
                            {/* Toolbar (Only show in List Mode) */}
                            {viewMode === 'LIST' && (
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-gray-800">Endereço de entrega:</span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleNewAddress}
                                            className="flex items-center gap-1 px-3 py-1.5 border border-[#0099FF] text-[#0099FF] rounded font-bold text-xs hover:bg-blue-50"
                                        >
                                            [ N ] Novo
                                        </button>
                                        <button className="flex items-center gap-1 px-3 py-1.5 border border-[#0099FF] text-[#0099FF] rounded font-bold text-xs hover:bg-blue-50">
                                            [ Q ] Editar
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (selectedAddressId) {
                                                    setAddresses(prev => prev.filter(a => a.id !== selectedAddressId));
                                                    if (selectedAddressId === selectedAddressId) setSelectedAddressId(null);
                                                }
                                            }}
                                            className="flex items-center gap-1 px-3 py-1.5 border border-[#0099FF] text-[#0099FF] rounded font-bold text-xs hover:bg-blue-50"
                                        >
                                            [ W ] Excluir
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* View Mode: LIST */}
                            {viewMode === 'LIST' && (
                                <div className="border border-gray-200 rounded-md p-2 bg-gray-50 min-h-[100px] flex flex-col gap-2 max-h-[250px] overflow-y-auto custom-scrollbar">
                                    {addresses.length === 0 ? (
                                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-sm py-8">
                                            <MapPin size={32} className="mb-2 opacity-50" />
                                            <p className="mb-2">Nenhum endereço cadastrado</p>
                                            <button
                                                onClick={handleNewAddress}
                                                className="mt-2 px-4 py-2 bg-[#0099FF] text-white font-bold rounded text-sm hover:bg-blue-600"
                                            >
                                                [ N ] Novo endereço
                                            </button>
                                        </div>
                                    ) : (
                                        addresses.map((addr) => (
                                            <div
                                                key={addr.id}
                                                onClick={() => setSelectedAddressId(addr.id)}
                                                className={`p-3 rounded border cursor-pointer flex items-center gap-3 transition-colors ${selectedAddressId === addr.id ? 'bg-blue-50 border-[#0099FF]' : 'bg-white border-gray-200 hover:border-blue-300'}`}
                                            >
                                                <MapPin size={18} className={selectedAddressId === addr.id ? "text-[#0099FF]" : "text-gray-400"} />
                                                <div className="flex-1 text-sm">
                                                    <span className="font-bold block text-gray-800">{addr.street}, {addr.number}</span>
                                                    <span className="text-gray-500 text-xs">{addr.neighborhood} - {addr.city}</span>
                                                </div>
                                                {selectedAddressId === addr.id && <Check size={16} className="text-[#0099FF]" />}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* View Mode: FORM */}
                            {viewMode === 'FORM' && (
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 animate-in fade-in slide-in-from-bottom-4 duration-200">
                                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <div className="bg-[#0099FF] w-1 h-4 rounded-full"></div>
                                        Novo endereço
                                    </h3>

                                    <div className="grid grid-cols-1 gap-3">
                                        {/* CEP */}
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1 flex justify-between">
                                                CEP
                                                {isLoadingCep && <span className="text-blue-500">Buscando...</span>}
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="00000-000"
                                                className="w-full px-3 py-2 border border-gray-300 rounded focus:border-[#0099FF] focus:ring-1 focus:ring-[#0099FF] outline-none text-sm bg-white"
                                                value={formAddress.cep}
                                                onChange={handleCepChange}
                                                maxLength={9}
                                            />
                                        </div>

                                        {/* Rua */}
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Rua *</label>
                                            <input
                                                type="text"
                                                placeholder="Nome da rua..."
                                                className="w-full px-3 py-2 border border-gray-300 rounded focus:border-[#0099FF] focus:ring-1 focus:ring-[#0099FF] outline-none text-sm bg-white"
                                                value={formAddress.street}
                                                onChange={(e) => setFormAddress({ ...formAddress, street: e.target.value })}
                                                disabled={isLoadingCep}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            {/* Número */}
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-1">Número</label>
                                                <input
                                                    type="text"
                                                    placeholder="123"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:border-[#0099FF] focus:ring-1 focus:ring-[#0099FF] outline-none text-sm bg-white"
                                                    value={formAddress.number}
                                                    onChange={(e) => setFormAddress({ ...formAddress, number: e.target.value })}
                                                />
                                            </div>
                                            {/* Complemento */}
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-1">Complemento</label>
                                                <input
                                                    type="text"
                                                    placeholder="Apto, Casa 2..."
                                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:border-[#0099FF] focus:ring-1 focus:ring-[#0099FF] outline-none text-sm bg-white"
                                                    value={formAddress.complement}
                                                    onChange={(e) => setFormAddress({ ...formAddress, complement: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            {/* Bairro */}
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-1">Bairro *</label>
                                                <input
                                                    type="text"
                                                    placeholder="Centro"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:border-[#0099FF] focus:ring-1 focus:ring-[#0099FF] outline-none text-sm bg-white"
                                                    value={formAddress.neighborhood}
                                                    onChange={(e) => setFormAddress({ ...formAddress, neighborhood: e.target.value })}
                                                />
                                            </div>
                                            {/* Cidade */}
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-1">Cidade *</label>
                                                <input
                                                    type="text"
                                                    placeholder="Nome da cidade"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:border-[#0099FF] focus:ring-1 focus:ring-[#0099FF] outline-none text-sm bg-white"
                                                    value={formAddress.city}
                                                    onChange={(e) => setFormAddress({ ...formAddress, city: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Form Actions */}
                                    <div className="flex gap-2 mt-4">
                                        <button
                                            onClick={handleSaveAddress}
                                            className="px-6 py-2 bg-[#0099FF] text-white font-bold rounded text-sm hover:bg-blue-600 transition-colors shadow-sm"
                                        >
                                            [ ENTER ] Salvar
                                        </button>
                                        <button
                                            onClick={() => setViewMode('LIST')}
                                            className="px-6 py-2 bg-white border border-gray-300 text-gray-600 font-bold rounded text-sm hover:bg-gray-50 transition-colors"
                                        >
                                            [ ESC ] Cancelar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Delivery Fee Section - Only for DELIVERY and LIST mode */}
                    {activeTab === 'DELIVERY' && viewMode === 'LIST' && (
                        <div className="space-y-2 pt-2 border-t border-gray-100">
                            <div className="space-y-2">
                                <span className="font-bold text-gray-800 text-sm">[ V ] Valor da taxa de entrega:</span>
                                <div className="flex items-center border border-gray-300 rounded-md overflow-hidden w-48">
                                    <div className="bg-gray-50 px-3 py-2 border-r border-gray-300 text-gray-600 font-bold">$</div>
                                    <div className="flex-1 flex items-center px-3">
                                        <span className="text-gray-600 mr-1">R$</span>
                                        <input
                                            type="text"
                                            value={deliveryFee}
                                            onChange={(e) => setDeliveryFee(e.target.value)}
                                            className="w-full outline-none font-bold text-gray-800"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Placeholder for other tabs if needed */}
                    {activeTab !== 'DELIVERY' && (
                        <div className="text-center py-10 text-gray-500">
                            Nenhuma configuração adicional necessária para {activeTab === 'PICKUP' ? 'Retirada' : 'Consumo no Local'}.
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 border border-blue-200 text-blue-600 rounded font-bold text-sm hover:bg-blue-50">
                            [ V ] Voltar
                        </button>
                        <button className="px-4 py-2 bg-gray-600 text-white rounded font-bold text-sm hover:bg-gray-700">
                            [ A ] Próximo
                        </button>
                    </div>

                    <button
                        onClick={handleConfirm}
                        className="flex-1 ml-4 px-6 py-3 font-bold text-lg rounded shadow-sm transition-colors uppercase flex items-center justify-center gap-2 bg-[#0099FF] text-white hover:bg-blue-600 shadow-blue-200"
                    >
                        [ ENTER ] Adicionar forma de entrega
                    </button>
                </div>
            </div>
        </div >
    );
};

export default DeliveryMethodModal;
