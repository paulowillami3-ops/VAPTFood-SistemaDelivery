import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';
import { useEstablishment } from '../../contexts/EstablishmentContext';

const General = () => {
    const navigate = useNavigate();
    const { establishment } = useEstablishment();
    const [hasService, setHasService] = useState<'yes' | 'no' | null>(null);

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Meu Salão</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Início <span className="mx-1">›</span> Configurações Salão <span className="mx-1">›</span> Meu Salão
                    </p>
                </div>
                <button
                    onClick={() => {
                        const urlSlug = window.location.pathname.split('/')[1];
                        navigate(`/${establishment?.slug || urlSlug || 'noia-burguer'}/garcom/login`);
                    }}
                    className="bg-[#0099FF] text-white px-6 py-2 rounded-md font-bold hover:bg-blue-600 transition-colors"
                >
                    Acessar Garçom
                </button>
            </div>

            {/* Content Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <h2 className="text-xl font-bold text-gray-800 mb-2">Dados do Salão</h2>
                <div className="w-full h-px bg-gray-200 mb-6"></div>

                <div className="space-y-6">
                    <div>
                        <p className="text-gray-500 text-sm mb-4">Defina informações da sua operação no Salão.</p>

                        <div className="space-y-3">
                            <label className="text-gray-400 text-sm font-medium block">Atendimento de Salão</label>
                            <label className="text-gray-800 font-bold block mb-2">Você tem atendimento de salão no seu estabelecimento? *</label>

                            <div className="flex gap-6">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${hasService === 'yes' ? 'border-[#0099FF]' : 'border-gray-300 group-hover:border-gray-400'}`}>
                                        {hasService === 'yes' && <div className="w-2.5 h-2.5 rounded-full bg-[#0099FF]"></div>}
                                    </div>
                                    <input
                                        type="radio"
                                        name="has_service"
                                        className="hidden"
                                        onChange={() => setHasService('yes')}
                                        checked={hasService === 'yes'}
                                    />
                                    <span className="text-gray-700">Sim</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${hasService === 'no' ? 'border-[#0099FF]' : 'border-gray-300 group-hover:border-gray-400'}`}>
                                        {hasService === 'no' && <div className="w-2.5 h-2.5 rounded-full bg-[#0099FF]"></div>}
                                    </div>
                                    <input
                                        type="radio"
                                        name="has_service"
                                        className="hidden"
                                        onChange={() => setHasService('no')}
                                        checked={hasService === 'no'}
                                    />
                                    <span className="text-gray-700">Não</span>
                                </label>
                            </div>
                        </div>

                        {hasService === 'yes' && (
                            <>
                                <div className="w-full h-px bg-gray-200 my-6"></div>
                                <h3 className="text-gray-400 text-sm font-medium mb-4">Estrutura e Modelo de Negócio</h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
                                    {/* Quantidade de mesas */}
                                    <div>
                                        <label className="text-gray-800 font-bold block mb-2 text-sm">Quantidade de mesas</label>
                                        <div className="inline-flex items-center border border-gray-300 rounded overflow-hidden">
                                            <button className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 border-r border-gray-300">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /></svg>
                                            </button>
                                            <div className="px-4 py-2 bg-white text-gray-800 text-sm font-medium w-12 text-center">3</div>
                                            <button className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 border-l border-gray-300">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">Mesas no seu estabelecimento</p>
                                    </div>

                                    {/* Quantidade de comandas */}
                                    <div>
                                        <label className="text-gray-800 font-bold block mb-2 text-sm">Quantidade de comandas</label>
                                        <div className="inline-flex items-center border border-gray-300 rounded overflow-hidden">
                                            <button className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 border-r border-gray-300">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /></svg>
                                            </button>
                                            <div className="px-4 py-2 bg-white text-gray-800 text-sm font-medium w-12 text-center">0</div>
                                            <button className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 border-l border-gray-300">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">Comandas no estabelecimento</p>
                                    </div>

                                    {/* Possui Garçons */}
                                    <div>
                                        <label className="text-gray-800 font-bold block mb-2 text-sm">Possui Garçons? *</label>
                                        <div className="flex gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio" name="has_waiters" className="accent-[#0099FF]" />
                                                <span className="text-gray-700 text-sm">Sim</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio" name="has_waiters" className="accent-[#0099FF]" />
                                                <span className="text-gray-700 text-sm">Não</span>
                                            </label>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">Garçons do seu estabelecimento</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {/* Como você opera */}
                                    <div>
                                        <label className="text-gray-800 font-bold block mb-3 text-sm">Como você opera? * (Selecione apenas 1 opção, considere a principal)</label>
                                        <div className="flex flex-col md:flex-row gap-6 md:gap-12">
                                            <label className="flex items-start gap-2 cursor-pointer group">
                                                <div className="w-4 h-4 rounded-full border border-gray-400 mt-0.5 group-hover:border-[#0099FF]"></div>
                                                <div>
                                                    <span className="text-gray-700 text-sm font-medium block">À la carte <HelpCircle size={12} className="inline text-gray-300 ml-1" /></span>
                                                    <span className="text-gray-400 text-xs">Cardápio físico ou digital</span>
                                                </div>
                                            </label>
                                            <label className="flex items-start gap-2 cursor-pointer group">
                                                <div className="w-4 h-4 rounded-full border border-gray-400 mt-0.5 group-hover:border-[#0099FF]"></div>
                                                <div>
                                                    <span className="text-gray-700 text-sm font-medium block">Buffet/Self Service <HelpCircle size={12} className="inline text-gray-300 ml-1" /></span>
                                                    <span className="text-gray-400 text-xs">Preço único ou por quilo (Kg)</span>
                                                </div>
                                            </label>
                                            <label className="flex items-start gap-2 cursor-pointer group">
                                                <div className="w-4 h-4 rounded-full border border-gray-400 mt-0.5 group-hover:border-[#0099FF]"></div>
                                                <div>
                                                    <span className="text-gray-700 text-sm font-medium block">Rodízio <HelpCircle size={12} className="inline text-gray-300 ml-1" /></span>
                                                    <span className="text-gray-400 text-xs">Garçons oferecem variedades</span>
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Como você atende */}
                                    <div>
                                        <label className="text-gray-800 font-bold block mb-3 text-sm">Como você atende o seu cliente no salão? * (Selecione 1 opção ou mais)</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                            <label className="flex items-start gap-2 cursor-pointer group">
                                                <div className="w-4 h-4 rounded border border-gray-400 mt-0.5 group-hover:border-[#0099FF]"></div>
                                                <div>
                                                    <span className="text-gray-700 text-sm font-medium block">Em mesa <HelpCircle size={12} className="inline text-gray-300 ml-1" /></span>
                                                    <span className="text-gray-400 text-xs">Garçom se dirige ao cliente nas mesas</span>
                                                </div>
                                            </label>
                                            <label className="flex items-start gap-2 cursor-pointer group">
                                                <div className="w-4 h-4 rounded border border-gray-400 mt-0.5 group-hover:border-[#0099FF]"></div>
                                                <div>
                                                    <span className="text-gray-700 text-sm font-medium block">Comanda individual <HelpCircle size={12} className="inline text-gray-300 ml-1" /></span>
                                                    <span className="text-gray-400 text-xs">Registra o consumo de cada cliente</span>
                                                </div>
                                            </label>
                                            <label className="flex items-start gap-2 cursor-pointer group">
                                                <div className="w-4 h-4 rounded border border-gray-400 mt-0.5 group-hover:border-[#0099FF]"></div>
                                                <div>
                                                    <span className="text-gray-700 text-sm font-medium block">No Balcão <HelpCircle size={12} className="inline text-gray-300 ml-1" /></span>
                                                    <span className="text-gray-400 text-xs">Cliente se dirige ao balcão</span>
                                                </div>
                                            </label>
                                            <label className="flex items-start gap-2 cursor-pointer group">
                                                <div className="w-4 h-4 rounded border border-gray-400 mt-0.5 group-hover:border-[#0099FF]"></div>
                                                <div>
                                                    <span className="text-gray-700 text-sm font-medium block">Auto atendimento <HelpCircle size={12} className="inline text-gray-300 ml-1" /></span>
                                                    <span className="text-gray-400 text-xs">Cliente pede através de dispositivo eletrônico</span>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="fixed bottom-0 left-64 right-0 p-4 bg-white border-t border-gray-200 flex justify-end z-10">
                <button className="bg-[#0099FF] text-white px-8 py-2.5 rounded-md font-bold hover:bg-blue-600 transition-colors">
                    Salvar Alterações
                </button>
            </div>

            {/* Chat Widget Mock */}
            <div className="fixed bottom-20 right-6 bg-[#0099FF] p-3 rounded-full text-white shadow-lg cursor-pointer hover:bg-blue-600 transition-colors z-20">
                <div className="w-6 h-6 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default General;
