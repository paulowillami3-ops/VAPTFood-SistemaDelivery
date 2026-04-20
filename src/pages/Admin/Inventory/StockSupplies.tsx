import { Search, Plus, Download, Video } from 'lucide-react';

const StockSupplies = () => {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-gray-800">Insumos de Estoque</h1>
                </div>
                <button className="flex items-center gap-2 bg-[#1877F2] text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-blue-600 transition-all shadow-sm">
                    <Video size={14} />
                    Tutorial
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 space-y-6">
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 bg-[#1877F2] text-white px-4 py-2 rounded text-[10px] font-bold shadow-sm hover:bg-blue-700 transition-all uppercase tracking-tight">
                            <Plus size={14} />
                            Criar Item de Estoque
                        </button>
                        <button className="flex items-center gap-2 border border-blue-500 text-blue-500 px-4 py-2 rounded text-[10px] font-bold shadow-sm hover:bg-blue-50 transition-all uppercase tracking-tight">
                            Importar lista de insumos
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        <button className="flex items-center gap-2 bg-[#0B1E34] text-white px-4 py-2 rounded text-[10px] font-bold shadow-sm hover:opacity-90 transition-all uppercase tracking-tight">
                            <Download size={14} />
                            Exportar para CSV
                        </button>

                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Procurar"
                                    className="pl-4 pr-10 py-2 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none w-64 bg-white shadow-inner"
                                />
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            </div>
                            <button className="p-2.5 bg-[#0B1E34] text-white rounded shadow-md hover:bg-blue-600 transition-all">
                                <Search size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-[11px] text-left border-collapse">
                        <thead className="bg-[#F8F9FB] text-gray-500 uppercase font-bold border-y border-gray-100">
                            <tr>
                                <th className="px-6 py-4 border-r border-gray-100">Nome</th>
                                <th className="px-6 py-4 border-r border-gray-100">Und. medi...</th>
                                <th className="px-6 py-4 border-r border-gray-100">Custo</th>
                                <th className="px-6 py-4 border-r border-gray-100">Qtd. mínim...</th>
                                <th className="px-6 py-4 border-r border-gray-100">Baixa do estoque</th>
                                <th className="px-6 py-4 border-r border-gray-100">Categoria de estoq...</th>
                                <th className="px-6 py-4 border-r border-gray-100">Categoria tributária</th>
                                <th className="px-6 py-4 border-r border-gray-100">SKU</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="bg-gray-100 transition-colors">
                                <td colSpan={9} className="px-6 py-4 text-center text-gray-500 font-bold uppercase tracking-widest text-[10px]">
                                    Nenhum resultado encontrado
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex justify-between items-center text-[11px] text-gray-400 px-2 pb-10">
                <span>Versão 4.0.54</span>
            </div>
        </div>
    );
};

export default StockSupplies;
