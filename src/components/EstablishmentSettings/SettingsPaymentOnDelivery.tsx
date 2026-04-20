import { CreditCard, Plus, QrCode } from 'lucide-react';
import type { EstablishmentSettings } from '../../types/establishment';

interface SettingsPaymentOnDeliveryProps {
    settings: EstablishmentSettings;
    onChange: (field: keyof EstablishmentSettings, value: any) => void;
}

export const SettingsPaymentOnDelivery = ({ settings, onChange }: SettingsPaymentOnDeliveryProps) => {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800">9. Pagamento na entrega</h2>
                <p className="text-sm text-gray-500">Selecione as formas de pagamento permitidas...</p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
                {/* Payment Tabs (visual) */}
                <div className="flex border-b border-gray-200 mb-2">
                    <button className="pb-2 text-sm font-bold text-blue-500 border-b-2 border-blue-500 px-4">Formas de Pagamento</button>
                    <button className="pb-2 text-sm font-medium text-gray-400 hover:text-gray-600 px-4">Configurações de recebimento</button>
                </div>

                <p className="text-sm text-gray-600 mb-4">Selecione as formas de pagamento permitidas ao seu cliente no momento da entrega (delivery) ou no caixa (consumo no local/retirada).</p>

                <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${settings.payment_methods_on_delivery?.cash ? 'bg-[#0099FF] border-[#0099FF]' : 'border-gray-300 bg-white'}`}>
                            {settings.payment_methods_on_delivery?.cash && <Plus size={14} className="text-white rotate-45 transform" />}
                            <input
                                type="checkbox"
                                checked={settings.payment_methods_on_delivery?.cash}
                                onChange={(e) => onChange('payment_methods_on_delivery', { ...settings.payment_methods_on_delivery, cash: e.target.checked })}
                                className="hidden"
                            />
                        </div>
                        <span className="font-bold text-gray-800 text-sm">Dinheiro</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer select-none">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${settings.payment_methods_on_delivery?.card ? 'bg-[#0099FF] border-[#0099FF]' : 'border-gray-300 bg-white'}`}>
                            {settings.payment_methods_on_delivery?.card && <Plus size={14} className="text-white rotate-45 transform" />}
                            <input
                                type="checkbox"
                                checked={settings.payment_methods_on_delivery?.card}
                                onChange={(e) => onChange('payment_methods_on_delivery', { ...settings.payment_methods_on_delivery, card: e.target.checked })}
                                className="hidden"
                            />
                        </div>
                        <span className="font-bold text-gray-800 text-sm">Cartão</span>
                    </label>

                    <div className="pt-2">
                        <label className="flex items-center gap-3 cursor-pointer select-none">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${settings.payment_methods_on_delivery?.pix ? 'bg-[#0099FF] border-[#0099FF]' : 'border-gray-300 bg-white'}`}>
                                {settings.payment_methods_on_delivery?.pix && <Plus size={14} className="text-white rotate-45 transform" />}
                                <input
                                    type="checkbox"
                                    checked={settings.payment_methods_on_delivery?.pix}
                                    onChange={(e) => onChange('payment_methods_on_delivery', { ...settings.payment_methods_on_delivery, pix: e.target.checked })}
                                    className="hidden"
                                />
                            </div>
                            <span className="font-bold text-gray-800 text-sm flex items-center gap-2">
                                <QrCode size={16} className="text-gray-500" />
                                PIX
                            </span>
                        </label>

                        {/* PIX Key Input */}
                        {settings.payment_methods_on_delivery?.pix && (
                            <div className="mt-3 ml-8 animate-in slide-in-from-top-2 duration-200">
                                <label className="block text-xs font-bold text-gray-600 mb-1">Chave PIX (CPF, CNPJ, Email, Telefone ou Aleatória)</label>
                                <input
                                    type="text"
                                    value={settings.payment_methods_on_delivery?.pix_key || ''}
                                    onChange={(e) => onChange('payment_methods_on_delivery', { ...settings.payment_methods_on_delivery, pix_key: e.target.value })}
                                    placeholder="Digite sua chave PIX aqui..."
                                    className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <p className="text-[10px] text-gray-400 mt-1">Essa chave aparecerá para o cliente copiar na hora do pagamento.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex gap-4 pt-4">
                    <button className="px-4 py-2 border border-blue-500 text-blue-500 font-bold rounded-lg hover:bg-blue-50 flex items-center gap-2 text-sm transition-colors">
                        <CreditCard size={16} /> Sugerir opção de bandeira
                    </button>
                    <button className="px-4 py-2 border border-gray-300 text-gray-500 font-bold rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm transition-colors">
                        <Plus size={16} /> Adicionar ID externo
                    </button>
                </div>
            </div>
        </div>
    );
};
