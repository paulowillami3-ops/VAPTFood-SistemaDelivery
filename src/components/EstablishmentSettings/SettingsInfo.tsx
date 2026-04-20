import { Camera, Plus, Trash2 } from 'lucide-react';
import type { EstablishmentSettings } from '../../types/establishment';
import { useState } from 'react';

interface SettingsInfoProps {
    settings: EstablishmentSettings;
    onChange: (field: keyof EstablishmentSettings, value: any) => void;
}

export const SettingsInfo = ({ settings, onChange }: SettingsInfoProps) => {
    const [isUploading, setIsUploading] = useState(false);

    const segments = [
        "Lanchonete", "Pizzaria", "Restaurante", "Hamburgueria", "Açaí",
        "Doceria", "Padaria", "Mercado", "Outros"
    ];

    const handleContactChange = (index: number, value: string) => {
        const newContacts = [...settings.contacts];
        newContacts[index] = value;
        onChange('contacts', newContacts);
    };

    const addContact = () => {
        onChange('contacts', [...settings.contacts, '']);
    };

    const removeContact = (index: number) => {
        const newContacts = settings.contacts.filter((_, i) => i !== index);
        onChange('contacts', newContacts);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800">1. Informações</h2>
                <p className="text-sm text-gray-500">Preencha as informações sobre o seu estabelecimento</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Nome do estabelecimento *</label>
                        <input
                            type="text"
                            value={settings.name}
                            onChange={(e) => onChange('name', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                            placeholder="WN Print"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">CPF do responsável legal*</label>
                            <input
                                type="text"
                                value={settings.legal_representative_cpf}
                                onChange={(e) => onChange('legal_representative_cpf', e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                                placeholder="Digite o CPF aqui"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Nome do responsável legal</label>
                            <input
                                type="text"
                                value={settings.legal_representative_name}
                                onChange={(e) => onChange('legal_representative_name', e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                                placeholder="Digite seu nome aqui"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="no_cnpj"
                            checked={settings.no_cnpj}
                            onChange={(e) => onChange('no_cnpj', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="no_cnpj" className="text-sm font-bold text-gray-700">Não possuo CNPJ</label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">CNPJ*</label>
                            <input
                                type="text"
                                value={settings.cnpj}
                                onChange={(e) => onChange('cnpj', e.target.value)}
                                disabled={settings.no_cnpj}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
                                placeholder="58.671.078/0001-18"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Razão Social</label>
                            <input
                                type="text"
                                value={settings.business_name}
                                onChange={(e) => onChange('business_name', e.target.value)}
                                disabled={settings.no_cnpj}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
                                placeholder="Digite a Razão Social aqui"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Segmento</label>
                        <select
                            value={settings.segment}
                            onChange={(e) => onChange('segment', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                        >
                            <option value="">Ex.: Lanchonete</option>
                            {segments.map(seg => (
                                <option key={seg} value={seg}>{seg}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Contato*</label>
                            <div className="space-y-2">
                                {settings.contacts.map((contact, index) => (
                                    <div key={index} className="flex gap-2">
                                        <div className="relative flex-1">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">📱</span>
                                            <input
                                                type="text"
                                                value={contact}
                                                onChange={(e) => handleContactChange(index, e.target.value)}
                                                className="w-full border border-gray-300 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                                                placeholder="(82) 9 9609-6247"
                                            />
                                        </div>
                                        {settings.contacts.length > 1 && (
                                            <button
                                                onClick={() => removeContact(index)}
                                                className="text-blue-500 hover:text-blue-700 p-2 border border-blue-200 rounded-md hover:bg-blue-50"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    onClick={addContact}
                                    className="flex items-center gap-1 text-blue-500 text-sm font-medium hover:text-blue-700"
                                >
                                    <Plus size={16} /> Adicionar outro
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Instagram da sua loja</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">📷</span>
                                <input
                                    type="text"
                                    value={settings.instagram}
                                    onChange={(e) => onChange('instagram', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                                    placeholder="@sualoja"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Logo Upload Section - Right Side */}
                <div className="md:col-span-1">
                    <div className="border-2 border-dashed border-blue-200 rounded-lg p-6 bg-blue-50 text-center flex flex-col items-center justify-center min-h-[200px] relative group overflow-hidden">
                        {settings.logo_url ? (
                            <img src={settings.logo_url} alt="Logo" className="w-full h-full object-contain absolute inset-0 p-4" />
                        ) : (
                            <>
                                <div className="bg-white p-3 rounded-xl mb-3 shadow-sm border border-blue-100">
                                    <Camera size={32} className="text-blue-500" />
                                </div>
                                <span className="text-sm font-medium text-gray-600">Escolha a foto</span>
                                <span className="text-xs text-gray-400 mt-1">Clique aqui ou arraste a foto para cá.</span>
                            </>
                        )}
                        {!settings.logo_url && (
                            <input
                                type="file"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                accept="image/*"
                                disabled={isUploading}
                                onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                        const file = e.target.files[0];
                                        if (file.size > 1024 * 1024) { // 1MB limit
                                            alert('A imagem deve ter no máximo 1MB.');
                                            return;
                                        }
                                        setIsUploading(true);
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                            onChange('logo_url', reader.result as string);
                                            setIsUploading(false);
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }}
                            />
                        )}
                    </div>
                    {settings.logo_url && (
                        <div className="flex gap-2 mt-2">
                            <label className="flex-1 flex items-center justify-center gap-2 p-2 text-blue-500 border border-blue-200 rounded-lg hover:bg-blue-50 cursor-pointer text-sm font-medium transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 16h5v5" /></svg>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files?.[0]) {
                                            const file = e.target.files[0];
                                            if (file.size > 1024 * 1024) { // 1MB limit
                                                alert('A imagem deve ter no máximo 1MB.');
                                                return;
                                            }
                                            setIsUploading(true);
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                onChange('logo_url', reader.result as string);
                                                setIsUploading(false);
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                            </label>
                            <button
                                onClick={() => onChange('logo_url', '')}
                                className="flex-1 flex items-center justify-center gap-2 p-2 text-red-500 border border-red-200 rounded-lg hover:bg-red-50 text-sm font-medium transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    )}
                    <div className="text-center mt-2 font-bold text-gray-700">{settings.name || 'Nome da loja'}</div>
                </div>
            </div>

            {/* Potencializador Banner */}
            <div className="mt-8 border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
                <div className="flex items-start gap-4">
                    <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                        <div className="w-5 h-5 flex items-center justify-center font-bold">N</div>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800">Potencialize suas vendas agora!</h3>
                        <p className="text-sm text-gray-600 max-w-xl">
                            Ative os métodos de pagamento Pix e Cartão de Crédito e tenha transações online rápidas e seguras no seu cardápio digital
                        </p>
                    </div>
                </div>
                <button className="px-6 py-2 border border-blue-500 text-blue-500 font-medium rounded-md hover:bg-blue-50 transition-colors whitespace-nowrap">
                    Ativar
                </button>
            </div>
        </div>
    );
};
