import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useEstablishment } from '../contexts/EstablishmentContext';
import {
    MapPin, Clock, Timer, Truck, DollarSign, Map,
    CreditCard, Banknote, Coffee, Info
} from 'lucide-react';
import type { EstablishmentSettings as IEstablishmentSettings } from '../types/establishment';

// Sub-components
import { SettingsInfo } from '../components/EstablishmentSettings/SettingsInfo';
import { SettingsAddress } from '../components/EstablishmentSettings/SettingsAddress';
import { SettingsHours } from '../components/EstablishmentSettings/SettingsHours';
import { SettingsDeliveryTime } from '../components/EstablishmentSettings/SettingsDeliveryTime';
import { SettingsDeliveryMethods } from '../components/EstablishmentSettings/SettingsDeliveryMethods';
import { SettingsMinimumFee } from '../components/EstablishmentSettings/SettingsMinimumFee';
import { SettingsRegions } from '../components/EstablishmentSettings/SettingsRegions';
import { SettingsOnlinePayment } from '../components/EstablishmentSettings/SettingsOnlinePayment';
import { SettingsPaymentOnDelivery } from '../components/EstablishmentSettings/SettingsPaymentOnDelivery';
import { SettingsDineIn } from '../components/EstablishmentSettings/SettingsDineIn';
import Toast from '../components/Toast';

const EstablishmentSettings = () => {
    const [settings, setSettings] = useState<IEstablishmentSettings>({
        name: '',
        legal_representative_cpf: '',
        legal_representative_name: '',
        no_cnpj: false,
        cnpj: '',
        business_name: '',
        segment: '',
        logo_url: '',
        contacts: [''],
        instagram: '',
        // Address Defaults
        cep: '',
        street: '',
        number: '',
        city: '',
        state: '',
        reference: '',
        neighborhood: '',
        complement: '',
        hide_address: false,
        manual_coordinates: false,
        latitude: undefined,
        longitude: undefined,
        // Defaults for new fields
        delivery_time_min: 30,
        delivery_time_max: 60,
        pickup_time_min: 15,
        pickup_time_max: 30,
        enable_delivery: true,
        enable_pickup: true,
        enable_on_site: true,
        minimum_order_fee_enabled: false,
        minimum_order_fee_value: 0,
        payment_methods_on_delivery: { cash: true, card: true }
    });

    const { establishment, refreshEstablishment, updateEstablishment } = useEstablishment();
    const [isSaving, setIsSaving] = useState(false);
    const [activeSection, setActiveSection] = useState(0);

    const sidebarItems = [
        { icon: Info, label: "1. Informações" },
        { icon: MapPin, label: "2. Endereço" },
        { icon: Clock, label: "3. Horários" },
        { icon: Timer, label: "4. Tempo de entrega" },
        { icon: Truck, label: "5. Formas de entrega" },
        { icon: DollarSign, label: "6. Taxa mínima" },
        { icon: Map, label: "7. Regiões de atendimento" },
        { icon: CreditCard, label: "8. Pagamento online" },
        { icon: Banknote, label: "9. Pagamento na entrega" },
        { icon: Coffee, label: "10. Operação em salão" },
    ];

    useEffect(() => {
        if (establishment?.id) {
            fetchSettings();
        }
    }, [establishment?.id]);

    const fetchSettings = async () => {
        if (!establishment?.id) return;

        try {
            const { data, error } = await supabase
                .from('establishment_settings')
                .select('*')
                .eq('id', establishment.id) // IMPORTANT: Filter by current establishment ID
                .single();

            if (error) {
                console.error('Error fetching settings:', error);
                return;
            }

            if (data) {
                setSettings(prev => ({
                    ...prev,
                    ...data,
                    // Ensure contacts is an array
                    contacts: Array.isArray(data.contacts) ? data.contacts : (data.contacts ? [data.contacts] : [''])
                }));
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    };

    const handleChange = (field: keyof IEstablishmentSettings, value: any) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const [showToast, setShowToast] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('establishment_settings')
                .upsert({
                    id: settings.id || 1, // Fallback ONLY if setting is missing (should verify context id)
                    ...settings,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            // Optimistic update - Force local state update immediately
            updateEstablishment({
                ...settings,
                id: settings.id || 1,
                latitude: settings.latitude?.toString(),
                longitude: settings.longitude?.toString()
            });
            refreshEstablishment(); // Still fetch for consistency

            setShowToast(true);
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Erro ao salvar configurações.');
        } finally {
            setIsSaving(false);
        }
    };

    const renderContent = () => {
        switch (activeSection) {
            case 0: return <SettingsInfo settings={settings} onChange={handleChange} />;
            case 1: return <SettingsAddress settings={settings} onChange={handleChange} />;
            case 2: return <SettingsHours settings={settings} onChange={handleChange} />;
            case 3: return <SettingsDeliveryTime settings={settings} onChange={handleChange} />;
            case 4: return <SettingsDeliveryMethods settings={settings} onChange={handleChange} />;
            case 5: return <SettingsMinimumFee settings={settings} onChange={handleChange} />;
            case 6: return <SettingsRegions />; // Self-contained
            case 7: return <SettingsOnlinePayment />; // Placeholder
            case 8: return <SettingsPaymentOnDelivery settings={settings} onChange={handleChange} />;
            case 9: return <SettingsDineIn />; // Placeholder
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="p-6 md:p-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-800">Configurações Estabelecimento</h1>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <span>Início</span>
                        <span>›</span>
                        <span>Configurações</span>
                        <span>›</span>
                        <span>Estabelecimento</span>
                        <span>›</span>
                        <span className="text-blue-500 font-medium">{sidebarItems[activeSection].label.split('. ')[1]}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                    {/* Sidebar */}
                    <div className="md:col-span-3 bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                        {sidebarItems.map((item, index) => {
                            const isActive = activeSection === index;
                            return (
                                <button
                                    key={index}
                                    onClick={() => setActiveSection(index)}
                                    className={`w-full flex items-center gap-3 px-4 py-4 text-sm font-medium transition-colors border-l-4 ${isActive
                                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                                        : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                                        }`}
                                >
                                    {/* Optional: Add icons back if desired */}
                                    {/* <item.icon size={18} /> */}
                                    <span>{item.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Main Content */}
                    <div className="md:col-span-9 bg-white rounded-lg shadow-sm border border-gray-100 p-6 md:p-8 relative">
                        {renderContent()}
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:pl-72 z-40">
                <div className="max-w-7xl mx-auto flex justify-end gap-3 pr-8">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`px-6 py-2.5 bg-[#8DA5B3] hover:bg-[#7a92a3] text-white font-medium rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-[#8DA5B3] focus:ring-offset-2 flex items-center gap-2 ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {isSaving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            'Salvar alterações'
                        )}
                    </button>
                </div>
            </div>

            {/* Chat Widget Mockup */}
            <div className="fixed bottom-24 right-6 z-50">
                <button className="bg-[#0099FF] text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors w-12 h-12 flex items-center justify-center">
                    <div className="w-6 h-4 border-2 border-white rounded-lg relative">
                        <div className="absolute top-1/2 left-1 right-1 h-0.5 bg-white"></div>
                    </div>
                </button>
                {showToast && (
                    <Toast
                        message="Configurações salvas com sucesso!"
                        onClose={() => setShowToast(false)}
                    />
                )}
            </div>
        </div>
    );
};

export default EstablishmentSettings;
