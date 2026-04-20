import { MapPin } from 'lucide-react';
import type { EstablishmentSettings } from '../../types/establishment';

interface SettingsAddressProps {
    settings: EstablishmentSettings;
    onChange: (field: keyof EstablishmentSettings, value: any) => void;
}

export const SettingsAddress = ({ settings, onChange }: SettingsAddressProps) => {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800">2. Endereço</h2>
                <p className="text-sm text-gray-500">Preencha o endereço do seu estabelecimento</p>
            </div>

            <div className="space-y-6 max-w-4xl">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">CEP *</label>
                    <input
                        type="text"
                        value={settings.cep || ''}
                        onChange={(e) => onChange('cep', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500 max-w-sm"
                        placeholder="57.490-000"
                    />
                    <p className="text-xs text-gray-400 mt-1">Digite o CEP para que outras informações sejam preenchidas</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-3">
                        <label className="block text-sm font-bold text-gray-700 mb-1">Logradouro (rua, avenida, etc.) *</label>
                        <input
                            type="text"
                            value={settings.street || ''}
                            onChange={(e) => onChange('street', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                            placeholder="RUA PADRE JOAQUIM ANTÔNIO TORRES"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Número *</label>
                        <input
                            type="text"
                            value={settings.number || ''}
                            onChange={(e) => onChange('number', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                            placeholder="1"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Cidade *</label>
                        <input
                            type="text"
                            value={settings.city || ''}
                            onChange={(e) => onChange('city', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                            placeholder="Água Branca"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Estado *</label>
                            <input
                                type="text"
                                value={settings.state || ''}
                                onChange={(e) => onChange('state', e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                                placeholder="AL"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Referência</label>
                            <input
                                type="text"
                                value={settings.reference || ''}
                                onChange={(e) => onChange('reference', e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                                placeholder="Ex: Próximo ao mercado"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Bairro *</label>
                        <input
                            type="text"
                            value={settings.neighborhood || ''}
                            onChange={(e) => onChange('neighborhood', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                            placeholder="CENTRO"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Complemento</label>
                        <input
                            type="text"
                            value={settings.complement || ''}
                            onChange={(e) => onChange('complement', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                            placeholder="Prédio"
                        />
                    </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-100">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Deseja ocultar o endereço para seus clientes? *
                        </label>
                        <p className="text-xs text-gray-400 mb-2">Seu endereço aparece nas infomações do seu estabelecimento no Cardápio Digital</p>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="hide_address"
                                    checked={settings.hide_address === true}
                                    onChange={() => onChange('hide_address', true)}
                                    className="text-blue-500 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">Sim</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="hide_address"
                                    checked={settings.hide_address === false}
                                    onChange={() => onChange('hide_address', false)}
                                    className="text-blue-500 focus:ring-blue-500"
                                />
                                <span className="text-sm font-bold text-gray-800">Não</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Deseja informar a latitude e longitude do seu estabelecimento manualmente? *
                        </label>
                        <div className="flex gap-4 mb-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="manual_coordinates"
                                    checked={settings.manual_coordinates === true}
                                    onChange={() => onChange('manual_coordinates', true)}
                                    className="text-blue-500 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">Sim</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="manual_coordinates"
                                    checked={settings.manual_coordinates === false}
                                    onChange={() => onChange('manual_coordinates', false)}
                                    className="text-blue-500 focus:ring-blue-500"
                                />
                                <span className="text-sm font-bold text-gray-800">Não</span>
                            </label>
                        </div>

                        {settings.manual_coordinates && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 animate-fade-in">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Latitude</label>
                                    <input
                                        type="text"
                                        value={settings.latitude || ''}
                                        onChange={(e) => onChange('latitude', e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                                        placeholder="9°38'16.8&quot;S"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Longitude</label>
                                    <input
                                        type="text"
                                        value={settings.longitude || ''}
                                        onChange={(e) => onChange('longitude', e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                                        placeholder="37°47'42.0&quot;W"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Map Placeholder */}
                        <div className="w-full h-64 bg-blue-100 rounded-lg overflow-hidden relative border border-blue-200">
                            <iframe
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                marginHeight={0}
                                marginWidth={0}
                                src={`https://maps.google.com/maps?q=${settings.latitude || -9.638},${settings.longitude || -37.795}&z=15&output=embed`}
                                style={{ filter: 'grayscale(0.2)' }}
                                title="Map location"
                            ></iframe>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-500 drop-shadow-md">
                                <MapPin size={40} fill="currentColor" className="text-red-500" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
