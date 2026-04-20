import { Search, Filter, Download, Video } from 'lucide-react';

const StockAdjustments = () => {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-gray-800">Ajustes de Estoque</h1>
                </div>
                <button className="flex items-center gap-2 bg-[#1877F2] text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-blue-600 transition-all shadow-sm">
                    <Video size={14} />
                    Tutorial
                </button>
            </div>

            {/* Filters Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-widest">
                    <Filter size={14} className="text-blue-500" />
                    Filtros
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Data Inicial</label>
                        <input type="text" defaultValue="24/01/2026" className="w-full h-10 px-3 border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-gray-50/30" />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Data Final</label>
                        <input type="text" defaultValue="26/01/2026" className="w-full h-10 px-3 border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-gray-50/30" />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Tipo de Movimentação</label>
                        <select className="w-full h-10 px-3 border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white">
                            <option>Selecione..</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Lojas</label>
                        <div className="relative group">
                            <div className="w-full h-10 px-3 border border-gray-200 rounded flex items-center gap-1 bg-white cursor-pointer">
                                <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 flex items-center gap-1.5 text-gray-700">
                                    WN Print <span className="hover:text-red-500">×</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-end">
                        <button className="h-10 px-8 bg-[#1877F2] text-white rounded font-bold text-xs hover:bg-blue-700 transition-colors shadow-sm uppercase tracking-wide">
                            Filtrar
                        </button>
                    </div>
                </div>
            </div>

            {/* Data Table Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-widest">
                        <Filter size={14} className="text-blue-500" />
                        Movimentos de Estoque
                    </div>
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

                <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 bg-[#1877F2] text-white px-4 py-2 rounded text-[10px] font-bold shadow-sm hover:bg-blue-700 transition-all uppercase tracking-tight">
                            Novo Movimento
                        </button>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-blue-600 font-medium cursor-pointer">
                        <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center text-[8px]">i</div>
                        <span className="underline decoration-dotted transition-colors hover:text-blue-800">Aviso: Listagem de produtos</span>
                    </div>
                </div>

                <div className="px-4 pb-4">
                    <button className="flex items-center gap-2 bg-[#1877F2] text-white px-4 py-2 rounded text-[10px] font-bold shadow-sm hover:bg-blue-700 transition-all uppercase tracking-tight">
                        <Download size={14} />
                        Exportar para CSV
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-[11px] text-left border-collapse">
                        <thead className="bg-[#F8F9FB] text-gray-500 uppercase font-bold border-y border-gray-100">
                            <tr>
                                <th className="px-6 py-4 border-r border-gray-100">Data</th>
                                <th className="px-6 py-4 border-r border-gray-100">Operador</th>
                                <th className="px-6 py-4 border-r border-gray-100">Observação</th>
                                <th className="px-6 py-4 border-r border-gray-100">Valor da Movimentação</th>
                                <th className="px-6 py-4 border-r border-gray-100">Tipo</th>
                                <th className="px-6 py-4 text-center">AÇÃO</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="bg-white hover:bg-gray-50 transition-colors border-b border-gray-50">
                                <td colSpan={6} className="px-6 py-20 text-center text-gray-400 font-medium">
                                    <span>Nenhum resultado encontrado</span>
                                </td>
                            </tr>
                        </tbody>
                        <tfoot className="bg-white font-bold text-gray-700">
                            <tr>
                                <td className="px-6 py-4 border-r border-gray-100">-</td>
                                <td className="px-6 py-4 border-r border-gray-100">-</td>
                                <td className="px-6 py-4 border-r border-gray-100">-</td>
                                <td className="px-6 py-4 border-r border-gray-100 text-gray-900">R$ 0,00</td>
                                <td className="px-6 py-4 border-r border-gray-100">-</td>
                                <td className="px-6 py-4">-</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <div className="flex justify-between items-center text-[11px] text-gray-400 px-2 pb-10">
                <span>Versão 4.0.54</span>
            </div>
        </div>
    );
};

export default StockAdjustments;
