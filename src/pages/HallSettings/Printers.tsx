import { useState } from 'react';
import { MessageCircle, Download } from 'lucide-react';

const Printers = () => {
    const [activeTab, setActiveTab] = useState('info');
    const [headerText, setHeaderText] = useState('');
    const [footerText, setFooterText] = useState('');

    // Comanda Toggles
    const [includeInfo, setIncludeInfo] = useState(false);
    const [groupItems, setGroupItems] = useState(false);
    const [addGroupNames, setAddGroupNames] = useState(false);
    const [notificationDelivery, setNotificationDelivery] = useState(false);
    const [notificationPickup, setNotificationPickup] = useState(false);
    const [notificationLocal, setNotificationLocal] = useState(false);

    const renderReceiptPreview = (content: React.ReactNode) => (
        <div className="bg-gray-100 border border-gray-200 p-8 rounded-lg flex items-center justify-center w-full max-w-sm ml-auto mr-auto lg:mr-0">
            <div className="bg-white p-6 shadow-sm w-full font-mono text-xs text-gray-500 leading-relaxed border-t-4 border-b-4 border-dashed border-gray-200 relative">
                <div className="text-center mb-6">
                    <span className="font-bold text-gray-800 text-sm">Teste</span>
                </div>
                {content}
                <div className="text-center mt-6">
                    <span className="font-bold text-gray-800 text-sm">Teste</span>
                </div>
            </div>
        </div>
    );


    return (
        <div className="p-6 bg-gray-50 min-h-screen pb-24">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Impressora</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Início <span className="mx-1">›</span> Configurações Salão <span className="mx-1">›</span> Impressora <span className="mx-1">›</span> {activeTab === 'info' ? 'Informação impressora' : activeTab === 'mensagem' ? 'Mensagem impressão' : 'Comanda'}
                    </p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar Navigation */}
                <div className="w-full lg:w-64 space-y-6 flex-shrink-0">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <button
                            onClick={() => setActiveTab('info')}
                            className={`w-full text-left px-4 py-3 text-sm font-medium border-l-4 transition-colors ${activeTab === 'info' ? 'border-[#0099FF] text-[#0099FF] bg-blue-50' : 'border-transparent text-gray-600 hover:bg-gray-50'}`}
                        >
                            1. Informação impressora
                        </button>
                        <div className="h-px bg-gray-100 mx-4"></div>
                        <button
                            onClick={() => setActiveTab('mensagem')}
                            className={`w-full text-left px-4 py-3 text-sm font-medium border-l-4 transition-colors ${activeTab === 'mensagem' ? 'border-[#0099FF] text-[#0099FF] bg-blue-50' : 'border-transparent text-gray-600 hover:bg-gray-50'}`}
                        >
                            2. Mensagem impressão
                        </button>
                        <div className="h-px bg-gray-100 mx-4"></div>
                        <button
                            onClick={() => setActiveTab('comanda')}
                            className={`w-full text-left px-4 py-3 text-sm font-medium border-l-4 transition-colors ${activeTab === 'comanda' ? 'border-[#0099FF] text-[#0099FF] bg-blue-50' : 'border-transparent text-gray-600 hover:bg-gray-50'}`}
                        >
                            3. Comanda
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                    {activeTab === 'info' && (
                        <div className="flex flex-col items-center text-center">
                            <div className="max-w-xl w-full">
                                <h2 className="text-xl font-bold text-gray-800 mb-10 text-left">1. Informação Impressora</h2>

                                <div className="relative mb-8 inline-block">
                                    <div className="w-64 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                                        {/* Placeholder for Printer Image */}
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                        </svg>
                                    </div>
                                    <div className="absolute -bottom-4 -right-4 bg-[#0099FF] w-12 h-12 rounded-full flex items-center justify-center text-white border-4 border-white shadow-lg">
                                        <Download size={24} />
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-gray-800 mb-2">Baixe o Aplicativo para computador e configure sua impressora</h3>
                                <p className="text-gray-500 text-sm mb-8 max-w-md mx-auto">
                                    A Instalação e conexão da Impressora só pode ser realizada pelo aplicativo para computador. Baixe o APP
                                </p>

                                <button className="bg-[#0099FF] text-white px-12 py-3 rounded text-base font-bold hover:bg-blue-600 transition-colors w-full max-w-sm mb-6">
                                    Baixar VAPT Food
                                </button>

                                <a href="#" className="text-[#0099FF] text-sm underline hover:text-blue-700">
                                    Dúvidas? Acesse o tutorial
                                </a>
                            </div>
                        </div>
                    )}

                    {activeTab === 'mensagem' && (
                        <div className="flex gap-12">
                            <div className="flex-1">
                                <h2 className="text-xl font-bold text-gray-800 mb-1">2. Mensagem impressão</h2>
                                <p className="text-sm text-gray-500 mb-8">Personalize o cabeçalho e o rodapé da impressão de pedidos</p>

                                <div className="space-y-6">
                                    <div>
                                        <label className="text-gray-800 font-bold block mb-2 text-sm">Cabeçalho</label>
                                        <input
                                            type="text"
                                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-[#0099FF] focus:outline-none"
                                            placeholder="Ex: Para entrega"
                                            value={headerText}
                                            onChange={(e) => setHeaderText(e.target.value)}
                                            maxLength={40}
                                        />
                                        <div className="text-right text-xs text-gray-400 mt-1">5/40</div>
                                    </div>

                                    <div>
                                        <label className="text-gray-800 font-bold block mb-2 text-sm">Rodapé</label>
                                        <input
                                            type="text"
                                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-[#0099FF] focus:outline-none"
                                            placeholder="Ex: Agradecemos o seu pedido"
                                            value={footerText}
                                            onChange={(e) => setFooterText(e.target.value)}
                                            maxLength={40}
                                        />
                                        <div className="text-right text-xs text-gray-400 mt-1">5/40</div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-shrink-0 pt-8">
                                {renderReceiptPreview(
                                    <div className="space-y-2 py-4 border-t border-b border-dashed border-gray-300">
                                        <div className="h-2 bg-gray-100 w-full mb-1"></div>
                                        <div className="h-2 bg-gray-100 w-3/4 mb-1"></div>
                                        <div className="h-2 bg-gray-100 w-full mb-1"></div>
                                        <div className="h-2 bg-gray-100 w-1/2 mb-1"></div>
                                        <div className="h-2 bg-gray-100 w-full mb-1"></div>
                                        <div className="h-2 bg-gray-100 w-3/4"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'comanda' && (
                        <div className="flex gap-12">
                            <div className="flex-1">
                                <h2 className="text-xl font-bold text-gray-800 mb-1">3. Comanda</h2>
                                <p className="text-sm text-gray-500 mb-8">Personalize a sua comanda de acordo com suas preferências</p>

                                <div className="space-y-6">
                                    <div className="flex gap-4 items-center">
                                        <label className="relative inline-flex items-center cursor-pointer mt-1 flex-shrink-0">
                                            <input type="checkbox" className="sr-only peer" checked={includeInfo} onChange={(e) => setIncludeInfo(e.target.checked)} />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0099FF]"></div>
                                        </label>
                                        <span className="font-bold text-gray-800 text-sm">Incluir informações de mesa ou comanda em pedidos de consumo local</span>
                                    </div>

                                    <div className="flex gap-4 items-center">
                                        <label className="relative inline-flex items-center cursor-pointer mt-1 flex-shrink-0">
                                            <input type="checkbox" className="sr-only peer" checked={groupItems} onChange={(e) => setGroupItems(e.target.checked)} />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0099FF]"></div>
                                        </label>
                                        <span className="font-bold text-gray-800 text-sm">Agrupar os itens do pedido na impressão da comanda e economizar papel</span>
                                    </div>

                                    <div className="flex gap-4 items-center">
                                        <label className="relative inline-flex items-center cursor-pointer mt-1 flex-shrink-0">
                                            <input type="checkbox" className="sr-only peer" checked={addGroupNames} onChange={(e) => setAddGroupNames(e.target.checked)} />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0099FF]"></div>
                                        </label>
                                        <span className="font-bold text-gray-800 text-sm">Adicionar o nome dos grupos de adicionais na impressão</span>
                                    </div>

                                    <div className="pt-6 border-t border-gray-100">
                                        <p className="text-gray-400 text-sm mb-4">Exibir notificação chamativa na comanda quando for:</p>

                                        <div className="space-y-4">
                                            <div className="flex gap-4 items-center">
                                                <label className="relative inline-flex items-center cursor-pointer mt-1 flex-shrink-0">
                                                    <input type="checkbox" className="sr-only peer" checked={notificationDelivery} onChange={(e) => setNotificationDelivery(e.target.checked)} />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0099FF]"></div>
                                                </label>
                                                <span className="font-bold text-gray-800 text-sm">Para entrega</span>
                                            </div>

                                            <div className="flex gap-4 items-center">
                                                <label className="relative inline-flex items-center cursor-pointer mt-1 flex-shrink-0">
                                                    <input type="checkbox" className="sr-only peer" checked={notificationPickup} onChange={(e) => setNotificationPickup(e.target.checked)} />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0099FF]"></div>
                                                </label>
                                                <span className="font-bold text-gray-800 text-sm">Retirada no local</span>
                                            </div>

                                            <div className="flex gap-4 items-center">
                                                <label className="relative inline-flex items-center cursor-pointer mt-1 flex-shrink-0">
                                                    <input type="checkbox" className="sr-only peer" checked={notificationLocal} onChange={(e) => setNotificationLocal(e.target.checked)} />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0099FF]"></div>
                                                </label>
                                                <span className="font-bold text-gray-800 text-sm">Consumo no local</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-shrink-0 pt-8">
                                {renderReceiptPreview(
                                    <>
                                        <div className="text-center mb-2">
                                            <span className="text-xs uppercase font-bold text-gray-600 border-b border-gray-300 pb-1">NOTIFICAÇÃO APARECERÁ AQUI</span>
                                        </div>
                                        <div className="space-y-2 py-4 border-t border-b border-dashed border-gray-300">
                                            <div className="h-2 bg-gray-100 w-full mb-1"></div>
                                            <div className="h-2 bg-gray-100 w-3/4 mb-1"></div>
                                            <div className="h-2 bg-gray-100 w-full mb-1"></div>
                                            <div className="h-2 bg-gray-100 w-1/2 mb-1"></div>
                                            <div className="h-2 bg-gray-100 w-full mb-1"></div>
                                            <div className="h-2 bg-gray-100 w-3/4"></div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Save Button */}
            {(activeTab === 'mensagem' || activeTab === 'comanda') && (
                <div className="fixed bottom-0 left-64 right-0 p-4 bg-white border-t border-gray-200 flex justify-end z-10">
                    <button className="bg-[#0099FF] text-white px-8 py-2.5 rounded-md font-bold hover:bg-blue-600 transition-colors">
                        Salvar Alterações
                    </button>
                </div>
            )}


            {/* Chat Widget Mock */}
            <div className="fixed bottom-4 right-6 bg-[#0099FF] p-3 rounded-full text-white shadow-lg cursor-pointer hover:bg-blue-600 transition-colors z-20">
                <div className="w-6 h-6 flex items-center justify-center">
                    <MessageCircle size={24} />
                </div>
            </div>
        </div>
    );
};

export default Printers;
