import { useState } from 'react';
import { Search, Filter, BookOpen, Video, Download } from 'lucide-react';

const Payable = () => {
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header / Breadcrumbs area is handled by Layout, but buttons are specific */}
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

            {/* Filters Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                        <Filter size={16} className="text-gray-500" />
                        Filtros
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Data Inicial</label>
                        <div className="relative">
                            <input type="text" className="w-full pl-3 pr-3 py-2 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none text-gray-600" placeholder="01/01/2026" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Data Final</label>
                        <div className="relative">
                            <input type="text" className="w-full pl-3 pr-3 py-2 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none text-gray-600" placeholder="29/01/2026" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Filtrar por</label>
                        <select className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none appearance-none bg-white text-gray-600">
                            <option value="vencimento">Vencimento</option>
                        </select>
                    </div>
                    {/* Empty placeholder for alignment if needed, or just flow */}
                    <div className="hidden lg:block"></div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Lojas</label>
                        <div className="w-full pl-2 pr-2 py-1.5 border border-gray-200 rounded text-sm focus-within:ring-1 focus-within:ring-blue-500 flex items-center gap-2 bg-white">
                            <span className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-700 flex items-center gap-1">
                                WN Print <button className="hover:text-red-500">×</button>
                            </span>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Conta bancaria</label>
                        <select className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none appearance-none bg-white text-gray-400">
                            <option value="">Selecione</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Fornecedor</label>
                        <select className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none appearance-none bg-white text-gray-600">
                            <option value="">Todos</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Status</label>
                        <select className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none appearance-none bg-white text-gray-600">
                            <option value="">Todos</option>
                        </select>
                    </div>
                </div>

                <div className="px-6 pb-6">
                    <button className="bg-[#1877F2] text-white px-6 py-2 rounded text-sm font-bold hover:bg-blue-600 transition-all shadow-sm">
                        Filtrar
                    </button>
                </div>
            </div>

            {/* Results Table Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                        <div className="w-1 h-4 bg-gray-400 rounded-full"></div>
                        Contas a Pagar
                    </div>
                </div>

                <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <button className="bg-[#566576] text-white px-4 py-2 rounded text-xs font-bold hover:bg-gray-600 transition-all shadow-sm flex items-center gap-2">
                            <Download size={14} />
                            Exportar para CSV
                        </button>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <button className="text-blue-500 hover:text-blue-700 text-xs font-medium border border-blue-200 px-3 py-2 rounded hover:bg-blue-50 transition-colors">
                            Histórico de remoções
                        </button>
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
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-xs text-left border-collapse min-w-[1200px]">
                        <thead className="bg-white text-gray-600 font-bold border-y border-gray-200">
                            <tr>
                                <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Status</th>
                                <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap"><div className="flex items-center gap-1 cursor-pointer">Venc. <ArrowUpDown /></div></th>
                                <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap"><div className="flex items-center gap-1 cursor-pointer">Compet. <ArrowUpDown /></div></th>
                                <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap"><div className="flex items-center gap-1 cursor-pointer">Realizado... <ArrowUpDown /></div></th>
                                <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap"><div className="flex items-center gap-1 cursor-pointer">Recebedor <ArrowUpDown /></div></th>
                                <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap"><div className="flex items-center gap-1 cursor-pointer">Descrição <ArrowUpDown /></div></th>

                                <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap text-right"><div className="flex items-center justify-end gap-1 cursor-pointer">Valor <ArrowUpDown /></div></th>
                                <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap text-right"><div className="flex items-center justify-end gap-1 cursor-pointer">Juros ou Taxas <ArrowUpDown /></div></th>
                                <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap text-right"><div className="flex items-center justify-end gap-1 cursor-pointer">Valor Liq. <ArrowUpDown /></div></th>
                                <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap text-right"><div className="flex items-center justify-end gap-1 cursor-pointer">Valor Confirm. <ArrowUpDown /></div></th>

                                <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap"><div className="flex items-center gap-1 cursor-pointer">Operador <ArrowUpDown /></div></th>
                                <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap"><div className="flex items-center gap-1 cursor-pointer">Conta <ArrowUpDown /></div></th>
                                <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap"><div className="flex items-center gap-1 cursor-pointer">Categoria <ArrowUpDown /></div></th>
                                <th className="px-4 py-3 whitespace-nowrap"><div className="flex items-center gap-1 cursor-pointer">Usuário que criou <ArrowUpDown /></div></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="bg-gray-100 border-b border-gray-200">
                                <td colSpan={14} className="px-4 py-8 text-center text-gray-500 font-medium">
                                    Nenhum resultado encontrado
                                </td>
                            </tr>
                        </tbody>
                        <tfoot className="bg-white font-bold text-gray-700 border-t border-gray-200">
                            <tr>
                                <td className="px-4 py-3 border-r border-gray-100">-</td>
                                <td className="px-4 py-3 border-r border-gray-100">-</td>
                                <td className="px-4 py-3 border-r border-gray-100">-</td>
                                <td className="px-4 py-3 border-r border-gray-100">-</td>
                                <td className="px-4 py-3 border-r border-gray-100">-</td>
                                <td className="px-4 py-3 border-r border-gray-100">-</td>

                                <td className="px-4 py-3 border-r border-gray-100 text-right">R$ 0,00</td>
                                <td className="px-4 py-3 border-r border-gray-100 text-right">R$ 0,00</td>
                                <td className="px-4 py-3 border-r border-gray-100 text-right">R$ 0,00</td>
                                <td className="px-4 py-3 border-r border-gray-100 text-right">-</td>

                                <td className="px-4 py-3 border-r border-gray-100">-</td>
                                <td className="px-4 py-3 border-r border-gray-100">-</td>
                                <td className="px-4 py-3 border-r border-gray-100">-</td>
                                <td className="px-4 py-3">-</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                <div className="px-4 py-2 border-t border-gray-200 bg-gray-50/50">
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gray-400 w-1/4 rounded-full"></div>
                    </div>
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

export default Payable;
