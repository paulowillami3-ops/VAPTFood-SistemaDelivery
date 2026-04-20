import { useState } from 'react';
import { MessageCircle, Info } from 'lucide-react';

const ServiceFee = () => {
    const [serviceFeeEnabled, setServiceFeeEnabled] = useState(false);

    return (
        <div className="p-6 bg-gray-50 min-h-screen pb-24">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Taxa de serviço</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Início <span className="mx-1">›</span> Configurações Salão <span className="mx-1">›</span> Taxa de serviço
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="border border-dashed border-gray-300 rounded-lg p-8">
                    <h2 className="text-base font-bold text-gray-800 mb-6">Configure as opção de taxa de serviço para pedidos em mesas e comandas.</h2>

                    <div className="flex gap-4 items-start">
                        <label className="relative inline-flex items-center cursor-pointer mt-1 flex-shrink-0">
                            <input type="checkbox" className="sr-only peer" checked={serviceFeeEnabled} onChange={(e) => setServiceFeeEnabled(e.target.checked)} />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0099FF]"></div>
                        </label>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-gray-800 text-base">Permitir taxa de serviço para pedidos mesa e comandas</h3>
                                <Info size={16} className="text-gray-400" />
                            </div>
                            <p className="text-sm text-gray-500 mt-1">A taxa de serviço será aplicada no fechamento da conta de todos os pedidos da mesa independente da origem do pedido.</p>
                        </div>
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
            <div className="fixed bottom-4 right-6 bg-[#0099FF] p-3 rounded-full text-white shadow-lg cursor-pointer hover:bg-blue-600 transition-colors z-20">
                <div className="w-6 h-6 flex items-center justify-center">
                    <MessageCircle size={24} />
                </div>
            </div>
        </div>
    );
};

export default ServiceFee;
