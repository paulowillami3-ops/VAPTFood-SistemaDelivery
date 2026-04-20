import { useState } from 'react';
import { MessageCircle } from 'lucide-react';

const PDVSettings = () => {
    const [activeTab, setActiveTab] = useState('geral');

    // Geral Toggles
    const [autoPrint, setAutoPrint] = useState(false);
    const [quickOrder, setQuickOrder] = useState(true);

    return (
        <div className="p-6 bg-gray-50 min-h-screen pb-24">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Pedidos Balcão (PDV)</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Início <span className="mx-1">›</span> Configurações Salão <span className="mx-1">›</span> Pedidos balcão (PDV) <span className="mx-1">›</span> {activeTab === 'aparencia' ? 'Aparência' : 'Geral'}
                    </p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar Navigation */}
                <div className="w-full lg:w-64 space-y-6 flex-shrink-0">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <button
                            onClick={() => setActiveTab('aparencia')}
                            className={`w-full text-left px-4 py-3 text-sm font-medium border-l-4 transition-colors ${activeTab === 'aparencia' ? 'border-[#0099FF] text-[#0099FF] bg-blue-50' : 'border-transparent text-gray-600 hover:bg-gray-50'}`}
                        >
                            1. Aparência
                        </button>
                        <div className="h-px bg-gray-100 mx-4"></div>
                        <button
                            onClick={() => setActiveTab('geral')}
                            className={`w-full text-left px-4 py-3 text-sm font-medium border-l-4 transition-colors ${activeTab === 'geral' ? 'border-[#0099FF] text-[#0099FF] bg-blue-50' : 'border-transparent text-gray-600 hover:bg-gray-50'}`}
                        >
                            2. Geral
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                    {activeTab === 'geral' && (
                        <>
                            <h2 className="text-xl font-bold text-gray-800 mb-1">2. Geral</h2>
                            <p className="text-sm text-gray-500 mb-8">Configure as opções gerais do seu PDV</p>

                            <div className="space-y-8">
                                {/* Toggle Item */}
                                <div className="flex gap-4">
                                    <label className="relative inline-flex items-center cursor-pointer mt-1 flex-shrink-0">
                                        <input type="checkbox" className="sr-only peer" checked={autoPrint} onChange={(e) => setAutoPrint(e.target.checked)} />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0099FF]"></div>
                                    </label>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-sm">Permitir impressão automática dos pedidos feitos pelo PDV</h3>
                                        <p className="text-sm text-gray-500 mt-1">Ao ativar, o sistema imprime automaticamente cada pedido feito pelo PDV. Se desativado, o pedido deverá ser impresso manualmente.</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <label className="relative inline-flex items-center cursor-pointer mt-1 flex-shrink-0">
                                        <input type="checkbox" className="sr-only peer" checked={quickOrder} onChange={(e) => setQuickOrder(e.target.checked)} />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0099FF]"></div>
                                    </label>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-sm">Permitir criar pedidos com apenas os itens do cardápio</h3>
                                        <p className="text-sm text-gray-500 mt-1">Ao ativar, você poderá finalizar o pedido imediatamente após adicionar um item ao pedido, as informações de nome do cliente, modo de entrega e forma de pagamento serão opcionais.</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                    {activeTab === 'aparencia' && (
                        <div className="text-center py-20">
                            <h2 className="text-xl font-bold text-gray-800">Conteúdo da Aba Aparência</h2>
                            <p className="text-gray-500">Conteúdo não especificado no momento.</p>
                        </div>
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

export default PDVSettings;
