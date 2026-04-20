
import { Search, Filter, Download, Package } from 'lucide-react';

const StockPosition = () => {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-800">Posição de Estoque</h1>
            </div>

            {/* Filters Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-widest">
                    <Filter size={14} className="text-blue-500" />
                    Filtros
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Filtrar por Data</label>
                        <div className="flex items-center h-10 px-3 border border-gray-200 rounded bg-gray-50">
                            {/* Toggle Switch Mockup */}
                            <div className="w-8 h-4 bg-gray-200 rounded-full relative">
                                <div className="absolute left-1 top-1 w-2 h-2 bg-white rounded-full"></div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Tipo de estoque</label>
                        <select className="w-full h-10 px-3 border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white">
                            <option>Todos</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Loja</label>
                        <select className="w-full h-10 px-3 border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white">
                            <option>Noia Burguer</option>
                        </select>
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
                        <Package size={14} className="text-blue-500" />
                        Estoque de produtos
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

                <div className="p-4">
                    <button className="flex items-center gap-2 bg-[#1877F2] text-white px-4 py-2 rounded text-[10px] font-bold shadow-sm hover:bg-blue-700 transition-all uppercase tracking-tight">
                        <Download size={14} />
                        Exportar para CSV
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-[11px] text-left border-collapse">
                        <thead className="bg-[#F8F9FB] text-gray-500 uppercase font-bold border-y border-gray-100">
                            <tr>
                                <th className="px-6 py-4 border-r border-gray-100">Tipo</th>
                                <th className="px-6 py-4 border-r border-gray-100">SKU</th>
                                <th className="px-6 py-4 border-r border-gray-100">Produto</th>
                                <th className="px-6 py-4 border-r border-gray-100">U...</th>
                                <th className="px-6 py-4 border-r border-gray-100">Qtd</th>
                                <th className="px-6 py-4 border-r border-gray-100">Custo</th>
                                <th className="px-6 py-4">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="bg-white hover:bg-gray-50 transition-colors">
                                <td colSpan={7} className="px-6 py-20 text-center text-gray-400 font-medium">
                                    <div className="flex flex-col items-center gap-3">
                                        <Package size={32} className="text-gray-200" />
                                        <span>Nenhum resultado encontrado para os filtros selecionados</span>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                        <tfoot className="bg-[#F8F9FB] font-bold border-t border-gray-100 text-gray-700">
                            <tr>
                                <td className="px-6 py-4 border-r border-gray-100 uppercase tracking-tighter">Totais de custo</td>
                                <td className="px-6 py-4 border-r border-gray-100 text-center">-</td>
                                <td className="px-6 py-4 border-r border-gray-100 text-center">-</td>
                                <td className="px-6 py-4 border-r border-gray-100 text-center">-</td>
                                <td className="px-6 py-4 border-r border-gray-100 text-center">-</td>
                                <td className="px-6 py-4 border-r border-gray-100 text-center">-</td>
                                <td className="px-6 py-4 text-right text-gray-900">R$ 0,00</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <div className="flex justify-between items-center text-[11px] text-gray-400 px-2 pb-10">
                <span>Versão 4.0.54</span>
                <div className="flex gap-4">
                    <span className="hover:text-blue-500 cursor-pointer">Termos de uso</span>
                    <span className="hover:text-blue-500 cursor-pointer">Privacidade</span>
                </div>
            </div>
        </div>
    );
};

export default StockPosition;
