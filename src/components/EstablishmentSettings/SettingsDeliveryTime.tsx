import { Info, Minus, Plus } from 'lucide-react';
import type { EstablishmentSettings } from '../../types/establishment';
import { useState } from 'react';

interface SettingsDeliveryTimeProps {
    settings: EstablishmentSettings;
    onChange: (field: keyof EstablishmentSettings, value: any) => void;
}

export const SettingsDeliveryTime = ({ settings, onChange }: SettingsDeliveryTimeProps) => {
    const [deliveryTimeTab, setDeliveryTimeTab] = useState<'delivery' | 'pickup'>('delivery');

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800">4. Tempo de entrega</h2>
                <p className="text-sm text-gray-500">Adicione o período mínimo e máximo levado para entregar seus pedidos</p>
            </div>

            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Info size={18} className="text-blue-500" />
                    <span>Atenção! Existem campos obrigatórios nesta sessão.</span>
                </div>
            </div>

            <div className="border-b border-gray-200 flex gap-6 mb-6">
                <button
                    onClick={() => setDeliveryTimeTab('delivery')}
                    className={`pb-2 text-sm font-bold border-b-2 transition-colors ${deliveryTimeTab === 'delivery' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Entrega
                </button>
                <button
                    onClick={() => setDeliveryTimeTab('pickup')}
                    className={`pb-2 text-sm font-bold border-b-2 transition-colors ${deliveryTimeTab === 'pickup' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Retirada
                </button>
            </div>

            <div className="grid grid-cols-2 gap-8 max-w-lg">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Mínimo</label>
                    <div className="flex items-center border border-gray-300 rounded bg-white overflow-hidden">
                        <button className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700" onClick={() => onChange(deliveryTimeTab === 'delivery' ? 'delivery_time_min' : 'pickup_time_min', Math.max(0, (settings[deliveryTimeTab === 'delivery' ? 'delivery_time_min' : 'pickup_time_min'] || 0) - 5))}><Minus size={16} /></button>
                        <input
                            type="number"
                            className="w-full text-center border-none focus:ring-0 text-sm font-bold p-2 outline-none"
                            value={settings[deliveryTimeTab === 'delivery' ? 'delivery_time_min' : 'pickup_time_min'] || 0}
                            onChange={(e) => onChange(deliveryTimeTab === 'delivery' ? 'delivery_time_min' : 'pickup_time_min', parseInt(e.target.value))}
                        />
                        <button className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700" onClick={() => onChange(deliveryTimeTab === 'delivery' ? 'delivery_time_min' : 'pickup_time_min', (settings[deliveryTimeTab === 'delivery' ? 'delivery_time_min' : 'pickup_time_min'] || 0) + 5)}><Plus size={16} /></button>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Minutos</div>
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Máximo</label>
                    <div className="flex items-center border border-gray-300 rounded bg-white overflow-hidden">
                        <button className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700" onClick={() => onChange(deliveryTimeTab === 'delivery' ? 'delivery_time_max' : 'pickup_time_max', Math.max(0, (settings[deliveryTimeTab === 'delivery' ? 'delivery_time_max' : 'pickup_time_max'] || 0) - 5))}><Minus size={16} /></button>
                        <input
                            type="number"
                            className="w-full text-center border-none focus:ring-0 text-sm font-bold p-2 outline-none"
                            value={settings[deliveryTimeTab === 'delivery' ? 'delivery_time_max' : 'pickup_time_max'] || 0}
                            onChange={(e) => onChange(deliveryTimeTab === 'delivery' ? 'delivery_time_max' : 'pickup_time_max', parseInt(e.target.value))}
                        />
                        <button className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700" onClick={() => onChange(deliveryTimeTab === 'delivery' ? 'delivery_time_max' : 'pickup_time_max', (settings[deliveryTimeTab === 'delivery' ? 'delivery_time_max' : 'pickup_time_max'] || 0) + 5)}><Plus size={16} /></button>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Minutos</div>
                </div>
            </div>
        </div>
    );
};
