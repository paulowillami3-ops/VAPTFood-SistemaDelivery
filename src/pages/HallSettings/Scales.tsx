import { MessageCircle, Printer, Scale, Cog } from 'lucide-react';

const Scales = () => {
    return (
        <div className="p-6 bg-gray-50 min-h-screen pb-24">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Configuração da Balança</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Início <span className="mx-1">›</span> Configurações Salão <span className="mx-1">›</span> Balança
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <h2 className="text-xl font-bold text-gray-800 mb-2">Selecione sua balança</h2>
                <p className="text-gray-500 text-sm mb-8">Após selecionar você terá acesso ao guia com o passo a passo de instalação.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {/* Scale Option 1 */}
                    <button className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 hover:shadow-sm transition-all group">
                        <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-gray-500">
                            <Scale size={20} />
                        </div>
                        <span className="font-bold text-gray-700 flex-1 text-left">Toledo Prix 3 Fit</span>
                        <span className="text-[#0099FF] text-lg">›</span>
                    </button>

                    {/* Scale Option 2 */}
                    <button className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 hover:shadow-sm transition-all group">
                        <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-gray-500">
                            <Scale size={20} />
                        </div>
                        <span className="font-bold text-gray-700 flex-1 text-left">Urano Pop S</span>
                        <span className="text-[#0099FF] text-lg">›</span>
                    </button>

                    {/* Scale Option 3 */}
                    <button className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 hover:shadow-sm transition-all group">
                        <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-gray-500">
                            <Printer size={20} />
                        </div>
                        <span className="font-bold text-gray-700 flex-1 text-left">Elgin DP</span>
                        <span className="text-[#0099FF] text-lg">›</span>
                    </button>

                    {/* Not Found Option */}
                    <button className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 hover:shadow-sm transition-all group">
                        <span className="text-gray-500 text-sm flex-1 text-left">Não encontrou sua balança?</span>
                        <span className="text-gray-400">+</span>
                    </button>
                </div>

                {/* Info Box */}
                <div className="border border-blue-100 bg-blue-50/50 rounded-lg p-4 flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-[#0099FF]">
                        <Cog size={14} className="animate-spin-slow" />
                    </div>
                    <span className="text-gray-700 text-sm">Após a instalação, sua balança será detectada automaticamente nesta página.</span>
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

export default Scales;
