import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useEstablishment } from '../contexts/EstablishmentContext';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import Toast from './Toast';

interface DeliveryTimeSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const DeliveryTimeSidebar: React.FC<DeliveryTimeSidebarProps> = ({ isOpen, onClose }) => {
    const { establishment, refreshEstablishment } = useEstablishment();
    const [isLoading, setIsLoading] = useState(false);
    const [showToast, setShowToast] = useState(false);

    // Form State
    const [pickupMin, setPickupMin] = useState(5);
    const [pickupMax, setPickupMax] = useState(10);
    const [deliveryMin, setDeliveryMin] = useState(30);
    const [deliveryMax, setDeliveryMax] = useState(40);

    useEffect(() => {
        if (isOpen && establishment) {
            setPickupMin(establishment.pickup_time_min ?? 5);
            setPickupMax(establishment.pickup_time_max ?? 10);
            setDeliveryMin(establishment.delivery_time_min ?? 30);
            setDeliveryMax(establishment.delivery_time_max ?? 40);
        }
    }, [isOpen, establishment]);

    const handleSave = async () => {
        if (!establishment?.id) {
            toast.error('Erro: ID do estabelecimento não encontrado.');
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('establishment_settings')
                .update({
                    pickup_time_min: pickupMin,
                    pickup_time_max: pickupMax,
                    delivery_time_min: deliveryMin,
                    delivery_time_max: deliveryMax
                })
                .eq('id', establishment.id);

            if (error) throw error;

            await refreshEstablishment();
            setShowToast(true);
            setTimeout(() => {
                setShowToast(false);
                onClose();
            }, 1000);
        } catch (error) {
            console.error('Error saving times:', error);
            toast.error('Erro ao salvar tempos');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const TimeInput = ({ label, value, onChange }: { label: string, value: number, onChange: (val: number) => void }) => (
        <div className="flex-1">
            <label className="block text-xs font-bold text-gray-700 mb-1">{label}</label>
            <div className="flex items-center">
                <button
                    onClick={() => onChange(Math.max(0, value - 5))}
                    className="w-8 h-8 rounded-l border border-gray-300 bg-gray-50 flex items-center justify-center hover:bg-gray-100 font-bold text-gray-500"
                >
                    -
                </button>
                <div className="flex-1 h-8 border-t border-b border-gray-300 flex items-center justify-center text-sm font-bold bg-white">
                    {value}
                </div>
                <button
                    onClick={() => onChange(value + 5)}
                    className="w-8 h-8 rounded-r border border-gray-300 bg-gray-50 flex items-center justify-center hover:bg-gray-100 font-bold text-gray-500"
                >
                    +
                </button>
            </div>
            <span className="text-[10px] text-gray-400 mt-1 block">Minutos</span>
        </div>
    );

    return (
        <>
            <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={onClose} />
            <div className={`fixed right-0 top-0 h-full w-[400px] bg-white z-50 shadow-2xl transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                {showToast && <Toast message="Tempos atualizados com sucesso!" onClose={() => setShowToast(false)} />}

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800">Tempo de entrega</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-gray-500 text-sm mb-6">Defina o intervalo em minutos.</p>

                    {/* Pickup */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                            <h3 className="font-bold text-gray-700 text-sm">Retirada no balcão</h3>
                        </div>
                        <div className="flex gap-4">
                            <TimeInput label="Mínimo" value={pickupMin} onChange={setPickupMin} />
                            <TimeInput label="Máximo" value={pickupMax} onChange={setPickupMax} />
                        </div>
                    </div>

                    {/* Delivery */}
                    <div className="mb-8 border-t border-gray-100 pt-6">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                            <h3 className="font-bold text-gray-700 text-sm">Entrega delivery</h3>
                        </div>
                        <div className="flex gap-4">
                            <TimeInput label="Mínimo" value={deliveryMin} onChange={setDeliveryMin} />
                            <TimeInput label="Máximo" value={deliveryMax} onChange={setDeliveryMax} />
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 mt-auto pt-4 border-t border-gray-100 fixed bottom-0 left-0 w-full bg-white p-4">
                        <button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="flex-1 bg-[#0099FF] text-white font-bold py-2 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
                        >
                            {isLoading ? 'Salvando...' : 'Salvar'}
                        </button>
                        <button
                            onClick={onClose}
                            className="flex-1 bg-gray-100 text-gray-700 font-bold py-2 rounded-md hover:bg-gray-200 transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default DeliveryTimeSidebar;
