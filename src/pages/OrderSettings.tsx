import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Printer, ListOrdered, ToggleLeft, Shield,
    Smartphone, Facebook, Instagram, Volume2, Save
} from 'lucide-react';
import { useEstablishment } from '../contexts/EstablishmentContext';
import { useNotification } from '../contexts/NotificationContext';

interface OrderSettings {
    id: number;
    enable_whatsapp: boolean;
    enable_facebook: boolean;
    enable_instagram: boolean;
    enable_digital_menu: boolean;
    current_order_number: number;
    order_number_reset_days: number;
    sound_delivery: 'long' | 'short' | 'none';
    sound_dinein: 'long' | 'short' | 'none';
    sound_waiter: 'bell1' | 'bell2' | 'none';
    auto_print: boolean;
    kds_print: boolean;
    scale_print: boolean;
    cancellation_policy: 'no_password' | 'waiter_password' | 'admin_password';
}

const OrderSettings = () => {
    const [settings, setSettings] = useState<OrderSettings>({
        id: 0,
        enable_whatsapp: false,
        enable_facebook: false,
        enable_instagram: false,
        enable_digital_menu: true,
        current_order_number: 1,
        order_number_reset_days: 0,
        sound_delivery: 'long',
        sound_dinein: 'long',
        sound_waiter: 'bell1',
        auto_print: true,
        kds_print: true,
        scale_print: true,
        cancellation_policy: 'admin_password'
    });
    const { establishment } = useEstablishment();
    const { triggerTestNotification } = useNotification();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState(0);

    const tabs = [
        { id: 0, label: "1. Status do sistema", icon: ToggleLeft },
        { id: 1, label: "2. Sequência do pedido", icon: ListOrdered },
        { id: 2, label: "3. Som dos pedidos", icon: Volume2 },
        { id: 3, label: "4. Impressão", icon: Printer },
        { id: 4, label: "5. Cancelar pedido", icon: Shield },
    ];

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        if (!establishment?.id) return;
        try {
            const { data, error } = await supabase
                .from('order_settings')
                .select('*')
                .eq('establishment_id', establishment.id)
                .maybeSingle();

            if (error) {
                console.error('Error fetching order settings:', error);
            } else if (data) {
                setSettings(data);
            } else {
                // If not found, try to insert default for this establishment
                const { data: newData } = await supabase
                    .from('order_settings')
                    .insert([{
                        establishment_id: establishment.id,
                        enable_digital_menu: true,
                        sound_delivery: 'long',
                        sound_dinein: 'long',
                        sound_waiter: 'bell1'
                    }])
                    .select()
                    .single();

                if (newData) setSettings(newData);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Remove id from payload as it is GENERATED ALWAYS
            const { id, ...payload } = settings;

            const { error } = await supabase
                .from('order_settings')
                .upsert(
                    {
                        ...payload,
                        establishment_id: establishment.id,
                        updated_at: new Date().toISOString()
                    },
                    { onConflict: 'establishment_id' }
                );

            if (error) throw error;
            alert('Configurações salvas!');
        } catch (error: any) {
            console.error(error);
            alert('Erro ao salvar: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (field: keyof OrderSettings, value: any) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const renderContent = () => {
        switch (activeTab) {
            case 0: // Status
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-gray-800">1. Status do sistema</h2>
                            <p className="text-sm text-gray-500">Defina o status de cada aplicação do seu estabelecimento</p>
                        </div>

                        <div className="space-y-6">
                            {[
                                { key: 'enable_whatsapp', label: 'WhatsApp', desc: 'Receber pedidos pelo robô do WhatsApp', icon: Smartphone },
                                { key: 'enable_facebook', label: 'Facebook', desc: 'Receber pedidos pelo robô do Facebook/Messenger', icon: Facebook },
                                { key: 'enable_instagram', label: 'Instagram', desc: 'Receber pedidos pelo robô do Instagram', icon: Instagram },
                                { key: 'enable_digital_menu', label: 'Cardápio Digital', desc: 'Receber pedidos pelo Cardápio Digital', icon: ListOrdered },
                            ].map((item) => (
                                <div key={item.key} className="flex items-start gap-4">
                                    <button
                                        onClick={() => handleChange(item.key as keyof OrderSettings, !settings[item.key as keyof OrderSettings])}
                                        className={`w-12 h-6 rounded-full flex items-center transition-colors p-1 ${settings[item.key as keyof OrderSettings] ? 'bg-blue-500 justify-end' : 'bg-gray-300 justify-start'}`}
                                    >
                                        <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                                    </button>
                                    <div>
                                        <h4 className="font-bold text-gray-800">{item.label}</h4>
                                        <p className="text-sm text-gray-500">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 1: // Sequência
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-gray-800">2. Sequência do pedido</h2>
                            <p className="text-sm text-gray-500">Redefina os números dos seus pedidos</p>
                        </div>

                        <div className="space-y-6 max-w-sm">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Numeração atual *</label>
                                <div className="flex bg-white border border-gray-300 rounded overflow-hidden">
                                    <button className="px-3 py-2 bg-gray-50 hover:bg-gray-100" onClick={() => handleChange('current_order_number', Math.max(1, settings.current_order_number - 1))}>-</button>
                                    <input
                                        type="number"
                                        className="flex-1 text-center border-none p-2 font-bold outline-none"
                                        value={settings.current_order_number}
                                        onChange={(e) => handleChange('current_order_number', parseInt(e.target.value) || 1)}
                                    />
                                    <button className="px-3 py-2 bg-gray-50 hover:bg-gray-100" onClick={() => handleChange('current_order_number', settings.current_order_number + 1)}>+</button>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Número do último pedido</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Dias para zerar *</label>
                                <div className="flex bg-white border border-gray-300 rounded overflow-hidden">
                                    <button className="px-3 py-2 bg-gray-50 hover:bg-gray-100" onClick={() => handleChange('order_number_reset_days', Math.max(0, settings.order_number_reset_days - 1))}>-</button>
                                    <input
                                        type="number"
                                        className="flex-1 text-center border-none p-2 font-bold outline-none"
                                        value={settings.order_number_reset_days}
                                        onChange={(e) => handleChange('order_number_reset_days', parseInt(e.target.value) || 0)}
                                    />
                                    <button className="px-3 py-2 bg-gray-50 hover:bg-gray-100" onClick={() => handleChange('order_number_reset_days', settings.order_number_reset_days + 1)}>+</button>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Será zerado a cada {settings.order_number_reset_days} dias</p>
                            </div>
                        </div>
                    </div>
                );
            case 2: // Sons
                return (
                    <div className="space-y-8 animate-fade-in">
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-gray-800">3. Som dos pedidos</h2>

                            <div className="mt-4">
                                <h3 className="font-bold text-gray-700">Tela inicial - Meus Pedidos</h3>
                                <p className="text-sm text-gray-500">A campainha tocará sempre que seu estabelecimento receber um pedido</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h4 className="font-bold text-gray-600 mb-3 text-sm">Pedidos delivery:</h4>
                                <div className="space-y-3">
                                    {[
                                        { val: 'long', label: 'Campainha Longa' },
                                        { val: 'short', label: 'Campainha Curta' },
                                        { val: 'none', label: 'Sem notificação' }
                                    ].map((opt) => (
                                        <div key={opt.val} className="flex items-center justify-between">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    checked={settings.sound_delivery === opt.val}
                                                    onChange={() => handleChange('sound_delivery', opt.val)}
                                                    className="text-blue-500 focus:ring-blue-500"
                                                />
                                                <span className="text-sm text-gray-700 font-medium">{opt.label}</span>
                                            </label>
                                            {opt.val !== 'none' && (
                                                <button
                                                    onClick={() => triggerTestNotification(opt.val as 'long' | 'short')}
                                                    className="text-blue-500 hover:text-blue-600 text-sm font-bold flex items-center gap-1"
                                                >
                                                    <Volume2 size={14} /> Testar
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h4 className="font-bold text-gray-600 mb-3 text-sm">Pedidos salão/consumo local:</h4>
                                <div className="space-y-3">
                                    {[
                                        { val: 'long', label: 'Campainha Longa' },
                                        { val: 'short', label: 'Campainha Curta' },
                                        { val: 'none', label: 'Sem notificação' }
                                    ].map((opt) => (
                                        <div key={opt.val} className="flex items-center justify-between">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    checked={settings.sound_dinein === opt.val}
                                                    onChange={() => handleChange('sound_dinein', opt.val)}
                                                    className="text-blue-500 focus:ring-blue-500"
                                                />
                                                <span className="text-sm text-gray-700 font-medium">{opt.label}</span>
                                            </label>
                                            {opt.val !== 'none' && (
                                                <button
                                                    onClick={() => triggerTestNotification(opt.val as 'long' | 'short')}
                                                    className="text-blue-500 hover:text-blue-600 text-sm font-bold flex items-center gap-1"
                                                >
                                                    <Volume2 size={14} /> Testar
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="border-t pt-6">
                            <h3 className="font-bold text-gray-700 mb-1">Chamados atendente - Robô</h3>
                            <p className="text-sm text-gray-500 mb-4">A notificação vai tocar sempre que um cliente desejar falar com um atendente</p>

                            <div className="space-y-3 max-w-sm">
                                {[
                                    { val: 'bell1', label: 'Campainha 1' },
                                    { val: 'bell2', label: 'Campainha 2' },
                                    { val: 'none', label: 'Sem notificação' }
                                ].map((opt) => (
                                    <div key={opt.val} className="flex items-center justify-between">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                checked={settings.sound_waiter === opt.val}
                                                onChange={() => handleChange('sound_waiter', opt.val)}
                                                className="text-blue-500 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-700 font-medium">{opt.label}</span>
                                        </label>
                                        {opt.val !== 'none' && (
                                            <button className="text-blue-500 hover:text-blue-600 text-sm font-bold flex items-center gap-1">
                                                <Volume2 size={14} /> Testar
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 3: // Impressão
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-gray-800">4. Impressão</h2>
                            <p className="text-sm text-gray-500">Configure a impressão automática</p>
                        </div>

                        <div className="space-y-6">
                            {[
                                { key: 'auto_print', label: 'Habilitar impressão automática', desc: 'Ao aceitar os pedidos a impressão será realizada automaticamente' },
                                { key: 'kds_print', label: 'Habilitar impressão automática no KDS', desc: 'Ao aceitar pedidos com uma aba do KDS aberta, o pedido será impresso duas vezes.' },
                                { key: 'scale_print', label: 'Habilitar impressão automática de pedidos com itens por quilo', desc: 'Ao aceitar pedidos com itens vendidos por quilo, a impressão será realizada automaticamente.' }
                            ].map((item) => (
                                <div key={item.key} className="flex items-start gap-4">
                                    <button
                                        onClick={() => handleChange(item.key as keyof OrderSettings, !settings[item.key as keyof OrderSettings])}
                                        className={`w-12 h-6 rounded-full flex items-center transition-colors p-1 ${settings[item.key as keyof OrderSettings] ? 'bg-blue-500 justify-end' : 'bg-gray-300 justify-start'}`}
                                    >
                                        <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                                    </button>
                                    <div>
                                        <h4 className="font-bold text-gray-800">{item.label}</h4>
                                        <p className="text-sm text-gray-500">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 4: // Cancelar
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-gray-800">5. Cancelar pedido</h2>
                        </div>

                        <div className="space-y-4">
                            {[
                                { val: 'no_password', label: 'Não solicitar senha para cancelamento de pedidos', desc: 'Qualquer pessoa pode cancelar os pedidos' },
                                { val: 'waiter_password', label: 'Solicitar senha do(a) atendente para cancelar pedidos', desc: 'Ao cancelar pedidos, será solicitada a senha do(a) atendente.' },
                                { val: 'admin_password', label: 'Solicitar senha padrão para cancelar pedidos', desc: 'Crie uma senha padrão e utilize sempre que precisar cancelar um pedido. Os pedidos só poderão ser cancelados com essa senha.' }
                            ].map((opt) => (
                                <div key={opt.val} className="flex items-start gap-3">
                                    <input
                                        type="radio"
                                        className="mt-1 text-blue-500 focus:ring-blue-500"
                                        checked={settings.cancellation_policy === opt.val}
                                        onChange={() => handleChange('cancellation_policy', opt.val)}
                                    />
                                    <div>
                                        <span className="block font-bold text-gray-800 text-sm">{opt.label}</span>
                                        <span className="text-sm text-gray-500">{opt.desc}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1 flex-wrap">
                    <span>Início</span>
                    <span>›</span>
                    <span>Configurações</span>
                    <span>›</span>
                    <span className="text-blue-500">Meus pedidos</span>
                    {activeTab > 0 && (
                        <>
                            <span>›</span>
                            <span>{tabs[activeTab].label.split('. ')[1]}</span>
                        </>
                    )}
                </div>
                <h1 className="text-2xl font-bold text-gray-800">Meus pedidos</h1>
            </div>

            {/* Mobile: Horizontal scrollable tabs */}
            <div className="md:hidden bg-white border-b border-gray-200 overflow-x-auto">
                <div className="flex w-max">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id
                                        ? 'border-blue-500 text-blue-500'
                                        : 'border-transparent text-gray-500'
                                    }`}
                            >
                                <Icon size={14} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Desktop: Two-column layout / Mobile: Single column */}
            <div className="flex flex-col md:flex-row max-w-7xl mx-auto p-4 md:p-6 gap-6">
                {/* Sidebar — desktop only */}
                <div className="hidden md:block w-64 flex-shrink-0">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-4 text-sm font-medium transition-colors border-l-4 ${activeTab === tab.id
                                        ? 'border-blue-500 text-blue-500 bg-blue-50'
                                        : 'border-transparent text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    <Icon size={18} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 md:p-8 min-h-[400px]">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-40">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            </div>
                        ) : renderContent()}
                    </div>
                </div>
            </div>

            {/* Floating Save Button */}
            <div className="fixed bottom-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent w-full flex justify-end pointer-events-none">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="pointer-events-auto bg-[#0099FF] hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full shadow-lg flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isSaving ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                            Salvando...
                        </>
                    ) : (
                        <>
                            <Save size={20} />
                            Salvar Alterações
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default OrderSettings;
