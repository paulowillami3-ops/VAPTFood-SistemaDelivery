import type { EstablishmentSettings } from '../../types/establishment';

interface SettingsMinimumFeeProps {
    settings: EstablishmentSettings;
    onChange: (field: keyof EstablishmentSettings, value: any) => void;
}

export const SettingsMinimumFee = ({ settings, onChange }: SettingsMinimumFeeProps) => {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800">6. Taxa mínima</h2>
                <p className="text-sm text-gray-500">Adicione uma taxa mínima para entrega no seu estabelecimento. Pedidos menores que o valor da taxa não poderão ser realizados.</p>
            </div>

            <div className="space-y-4">
                <p className="text-sm font-bold text-gray-800 mb-2">Quer adicionar uma taxa mínima para delivery?</p>
                <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${settings.minimum_order_fee_enabled ? 'border-[#0099FF]' : 'border-gray-300'}`}>
                            {settings.minimum_order_fee_enabled && <div className="w-2.5 h-2.5 bg-[#0099FF] rounded-full" />}
                        </div>
                        <input type="radio" name="min_fee" checked={settings.minimum_order_fee_enabled === true} onChange={() => onChange('minimum_order_fee_enabled', true)} className="hidden" />
                        <span className="text-sm font-medium text-gray-700">Sim, adicionar</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${settings.minimum_order_fee_enabled === false ? 'border-[#0099FF]' : 'border-gray-300'}`}>
                            {settings.minimum_order_fee_enabled === false && <div className="w-2.5 h-2.5 bg-[#0099FF] rounded-full" />}
                        </div>
                        <input type="radio" name="min_fee" checked={settings.minimum_order_fee_enabled === false} onChange={() => onChange('minimum_order_fee_enabled', false)} className="hidden" />
                        <span className="text-sm font-medium text-gray-700">Não adicionar</span>
                    </label>
                </div>

                {settings.minimum_order_fee_enabled && (
                    <div className="animate-fade-in mt-4">
                        <label className="block text-sm font-bold text-gray-700 mb-1">Taxa mínima</label>
                        <div className="relative max-w-xs">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">$</span>
                            <input
                                type="number"
                                value={settings.minimum_order_fee_value}
                                onChange={(e) => onChange('minimum_order_fee_value', parseFloat(e.target.value))}
                                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none text-sm"
                                placeholder="0"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
