import { useState } from 'react';
import { Search, BookOpen, Video } from 'lucide-react';

const PaymentMethods = () => {
    const [searchQuery, setSearchQuery] = useState('');

    const methods = [
        { name: "Alelo Alimentação", days: 7, category: "01.04 Vale Refeição" },
        { name: "Alelo Refeição", days: 7, category: "01.04 Vale Refeição" },
        { name: "American Express crédito", days: 30, category: "01.02 Cartão de Crédito" },
        { name: "VAPT Food Online", days: 1, category: "01.03 Cartão de Débito" },
        { name: "Aura crédito", days: 30, category: "01.02 Cartão de Crédito" },
        { name: "Banescard Crédito", days: 30, category: "01.02 Cartão de Crédito" },
        { name: "Banescard Débito (VAPT Food)", days: 1, category: "01.03 Cartão de Débito" },
        { name: "Banricompras Crédito (Ano...", days: 30, category: "01.02 Cartão de Crédito" },
        { name: "Brasilcard crédito", days: 30, category: "01.02 Cartão de Crédito" },
        { name: "Cabal Crédito (VAPT Food)", days: 30, category: "01.02 Cartão de Crédito" },
        { name: "Cabal Débito (VAPT Food)", days: 1, category: "01.03 Cartão de Débito" },
        { name: "Coopercard crédito", days: 30, category: "01.02 Cartão de Crédito" },
        { name: "Coopercard débito", days: 1, category: "01.03 Cartão de Débito" },
        { name: "Credishop crédito", days: 30, category: "01.02 Cartão de Crédito" },
        { name: "Dinheiro", days: 0, category: "01.01 Dinheiro" },
        { name: "Dinners Crédito (VAPT Food)", days: 30, category: "01.02 Cartão de Crédito" },
        { name: "Elo Crédito", days: 30, category: "01.02 Cartão de Crédito" },
        { name: "Elo Débito", days: 1, category: "01.03 Cartão de Débito" },
        { name: "Greencard alimentação", days: 7, category: "01.04 Vale Refeição" },
    ];

    const filteredMethods = methods.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Buttons */}
            <div className="flex justify-end gap-2">
                <button className="flex items-center gap-2 bg-[#1877F2] text-white px-4 py-2 rounded text-xs font-bold hover:bg-blue-600 transition-all shadow-sm">
                    <BookOpen size={14} />
                    Central de ajuda
                </button>
                <button className="flex items-center gap-2 bg-[#1877F2] text-white px-4 py-2 rounded text-xs font-bold hover:bg-blue-600 transition-all shadow-sm">
                    <Video size={14} />
                    Tutorial
                </button>
            </div>

            {/* Filters Section (Title + Search) */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                        <div className="w-1 h-4 bg-gray-400 rounded-full"></div>
                        Formas de pagamento
                    </div>
                </div>

                <div className="p-4 flex justify-end">
                    <div className="relative w-full md:w-64">
                        <input
                            type="text"
                            placeholder="Procurar"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                        />
                        <button className="absolute right-0 top-0 h-full px-3 text-white bg-[#0B1E34] rounded-r flex items-center justify-center hover:bg-blue-900 transition-colors">
                            <Search size={14} />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                        <thead className="bg-white text-gray-600 font-bold border-y border-gray-200">
                            <tr>
                                <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap uppercase">Formas de Pagamento <ArrowUpDown /></th>
                                <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap uppercase">Dias Recebimento <ArrowUpDown /></th>
                                <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap uppercase">Conta Bancaria <ArrowUpDown /></th>
                                <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap uppercase">Custo <ArrowUpDown /></th>
                                <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap uppercase">Categoria Financeira <ArrowUpDown /></th>
                                <th className="px-4 py-3 whitespace-nowrap uppercase w-20">Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMethods.map((method, idx) => (
                                <tr key={idx} className="bg-gray-100 hover:bg-gray-200/50 transition-colors border-b border-gray-200">
                                    <td className="px-4 py-3 border-r border-gray-200 font-medium text-gray-700">{method.name}</td>
                                    <td className="px-4 py-3 border-r border-gray-200 text-gray-600">{method.days}</td>
                                    <td className="px-4 py-3 border-r border-gray-200 text-gray-600"></td>
                                    <td className="px-4 py-3 border-r border-gray-200 text-gray-600"></td>
                                    <td className="px-4 py-3 border-r border-gray-200 text-gray-600">{method.category}</td>
                                    <td className="px-4 py-3 text-center">
                                        <button className="bg-[#1877F2] text-white px-4 py-1.5 rounded text-[10px] font-bold shadow-sm hover:bg-blue-700 transition-all uppercase tracking-tight w-full">
                                            Editar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex justify-between items-center text-[11px] text-gray-400 px-2 pb-10">
                <span>OpDV © 2022.</span>
                <span>Versão 4.0.54</span>
            </div>
        </div>
    );
};

const ArrowUpDown = () => (
    <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 5l-5 5h10l-5-5zm0 14l5-5H7l5 5z" />
    </svg>
);

export default PaymentMethods;
