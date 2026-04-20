import { useState } from 'react';
import { FileText, MessageCircle } from 'lucide-react';

const Commands = () => {
    const [activeTab, setActiveTab] = useState('operacional');

    // Operacional Toggles
    const [linkTable, setLinkTable] = useState(false);
    const [requestCpf, setRequestCpf] = useState(false);
    const [openWithoutOrder, setOpenWithoutOrder] = useState(false);

    // Cobranças Toggles
    const [couvert, setCouvert] = useState(false);
    const [minimumConsumption, setMinimumConsumption] = useState(false);

    return (
        <div className="p-6 bg-gray-50 min-h-screen pb-24">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Comandas</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Início <span className="mx-1">›</span> Configurações Salão <span className="mx-1">›</span> Comandas <span className="mx-1">›</span> {activeTab === 'operacional' ? 'Operacional' : 'Cobranças adicionais'}
                    </p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar Navigation */}
                <div className="w-full lg:w-64 space-y-6 flex-shrink-0">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <button
                            onClick={() => setActiveTab('operacional')}
                            className={`w-full text-left px-4 py-3 text-sm font-medium border-l-4 transition-colors ${activeTab === 'operacional' ? 'border-[#0099FF] text-[#0099FF] bg-blue-50' : 'border-transparent text-gray-600 hover:bg-gray-50'}`}
                        >
                            1. Operacional
                        </button>
                        <div className="h-px bg-gray-100 mx-4"></div>
                        <button
                            onClick={() => setActiveTab('cobrancas')}
                            className={`w-full text-left px-4 py-3 text-sm font-medium border-l-4 transition-colors ${activeTab === 'cobrancas' ? 'border-[#0099FF] text-[#0099FF] bg-blue-50' : 'border-transparent text-gray-600 hover:bg-gray-50'}`}
                        >
                            2. Cobranças adicionais
                        </button>
                    </div>

                    {/* Promo Box */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-[#0099FF]">
                            <FileText size={20} />
                        </div>
                        <h3 className="font-bold text-gray-800 text-sm mb-2 leading-tight">Mais organização e agilidade no seu salão</h3>
                        <p className="text-xs text-gray-500 mb-6">Use comandas individuais para anotar pedidos de forma descomplicada!</p>

                        <div className="space-y-2">
                            <button className="w-full border border-[#0099FF] text-[#0099FF] px-4 py-2 rounded-md font-bold hover:bg-blue-50 transition-colors text-sm">
                                Ver comandas
                            </button>
                            <button className="w-full border border-[#0099FF] text-[#0099FF] px-4 py-2 rounded-md font-bold hover:bg-blue-50 transition-colors text-sm">
                                Criar comanda
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                    {activeTab === 'operacional' && (
                        <>
                            <h2 className="text-xl font-bold text-gray-800 mb-1">1. Configurações operacionais de comandas</h2>
                            <p className="text-sm text-gray-500 mb-8">Configure as opções de personalização do modelo de comandas para o seu negócio</p>

                            <div className="space-y-8">
                                {/* Toggle Item */}
                                <div className="flex gap-4">
                                    <label className="relative inline-flex items-center cursor-pointer mt-1 flex-shrink-0">
                                        <input type="checkbox" className="sr-only peer" checked={linkTable} onChange={(e) => setLinkTable(e.target.checked)} />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0099FF]"></div>
                                    </label>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-sm">Permitir vinculação de comandas a uma mesa</h3>
                                        <p className="text-sm text-gray-500 mt-1">Ao ativar esta opção, será possível lançar pedidos avulsos e também vincular comandas a mesa.</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <label className="relative inline-flex items-center cursor-pointer mt-1 flex-shrink-0">
                                        <input type="checkbox" className="sr-only peer" checked={requestCpf} onChange={(e) => setRequestCpf(e.target.checked)} />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0099FF]"></div>
                                    </label>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-sm">Solicitar CPF do cliente</h3>
                                        <p className="text-sm text-gray-500 mt-1">Ao ativar esta opção, será incluído o campo para preenchimento opcional de CPF, junto das informações do cliente no ato de abertura da comanda.</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <label className="relative inline-flex items-center cursor-pointer mt-1 flex-shrink-0">
                                        <input type="checkbox" className="sr-only peer" checked={openWithoutOrder} onChange={(e) => setOpenWithoutOrder(e.target.checked)} />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0099FF]"></div>
                                    </label>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-sm">Abertura de comandas sem pedidos</h3>
                                        <p className="text-sm text-gray-500 mt-1">Permitir abertura de comandas sem realização simultânea de pedido, possibilitando por exemplo comandas abertas na entrada do estabelecimento.</p>
                                        <a href="#" className="text-[#0099FF] text-xs underline mt-1 inline-block">Configure o APP Garçom</a>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'cobrancas' && (
                        <>
                            <h2 className="text-xl font-bold text-gray-800 mb-1">2. Cobranças adicionais</h2>
                            <p className="text-sm text-gray-500 mb-8">Configure valores adicionais que podem ser cobrados de forma individual nas comandas</p>

                            <div className="space-y-8">
                                <div className="flex gap-4">
                                    <label className="relative inline-flex items-center cursor-pointer mt-1 flex-shrink-0">
                                        <input type="checkbox" className="sr-only peer" checked={couvert} onChange={(e) => setCouvert(e.target.checked)} />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0099FF]"></div>
                                    </label>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-sm">Couvert ou entrada</h3>
                                        <p className="text-sm text-gray-500 mt-1">Ao configurar esta opção, será cobrado o valor adicional informado abaixo em cada comanda, referente ao couvert artístico ou entrada no ambiente. Além do valor, configure o período em que deseja cobrar este couvert ou entrada de seus clientes.</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <label className="relative inline-flex items-center cursor-pointer mt-1 flex-shrink-0">
                                        <input type="checkbox" className="sr-only peer" checked={minimumConsumption} onChange={(e) => setMinimumConsumption(e.target.checked)} />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0099FF]"></div>
                                    </label>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-sm">Consumação mínima por comanda</h3>
                                        <p className="text-sm text-gray-500 mt-1">Ao ativar esta opção, consideramos o valor mínimo configurado abaixo e aplicamos na comanda a cobrança automática do que falta para atingir este valor, calculando o que foi consumido pelos pedidos, desconsiderando taxa e couvert. Quando o valor estipulado é atingido, a cobrança de consumação é zerada.</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Chat Widget Mock */}
            <div className="fixed bottom-4 right-6 bg-[#0099FF] p-3 rounded-full text-white shadow-lg cursor-pointer hover:bg-blue-600 transition-colors z-20">
                <div className="w-6 h-6 flex items-center justify-center">
                    <MessageCircle size={24} />
                </div>
            </div>
        </div>
    );
};

export default Commands;
