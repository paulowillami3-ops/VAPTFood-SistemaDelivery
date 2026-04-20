import { Plus } from 'lucide-react';
import type { EstablishmentSettings } from '../../types/establishment';

interface SettingsDeliveryMethodsProps {
    settings: EstablishmentSettings;
    onChange: (field: keyof EstablishmentSettings, value: any) => void;
}

export const SettingsDeliveryMethods = ({ settings, onChange }: SettingsDeliveryMethodsProps) => {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800">5. Formas de entrega</h2>
                <p className="text-sm text-gray-500">Selecione pelo menos uma forma de entrega</p>
            </div>

            <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${settings.enable_delivery ? 'bg-[#0099FF] border-[#0099FF]' : 'border-gray-300 bg-white'}`}>
                        {settings.enable_delivery && <Plus size={14} className="text-white rotate-45 transform" />}
                        <input type="checkbox" checked={settings.enable_delivery} onChange={(e) => onChange('enable_delivery', e.target.checked)} className="hidden" />
                    </div>
                    <div>
                        <span className="block font-bold text-gray-800 text-sm">Delivery</span>
                        <span className="text-sm text-gray-500">O pedido chega até o cliente por um entregador.</span>
                    </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer select-none">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${settings.enable_pickup ? 'bg-[#0099FF] border-[#0099FF]' : 'border-gray-300 bg-white'}`}>
                        {settings.enable_pickup && <Plus size={14} className="text-white rotate-45 transform" />}
                        <input type="checkbox" checked={settings.enable_pickup} onChange={(e) => onChange('enable_pickup', e.target.checked)} className="hidden" />
                    </div>
                    <div>
                        <span className="block font-bold text-gray-800 text-sm">Retirada no estabelecimento</span>
                        <span className="text-sm text-gray-500">O cliente vai até o estabelecimento e retira o pedido.</span>
                    </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer select-none">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${settings.enable_on_site ? 'bg-[#0099FF] border-[#0099FF]' : 'border-gray-300 bg-white'}`}>
                        {settings.enable_on_site && <Plus size={14} className="text-white rotate-45 transform" />}
                        <input type="checkbox" checked={settings.enable_on_site} onChange={(e) => onChange('enable_on_site', e.target.checked)} className="hidden" />
                    </div>
                    <div>
                        <span className="block font-bold text-gray-800 text-sm">Consumo no local</span>
                        <span className="text-sm text-gray-500">O cliente vai até o estabelecimento e consome no local.</span>
                    </div>
                </label>
            </div>
        </div>
    );
};
