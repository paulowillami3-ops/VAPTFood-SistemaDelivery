import { useState } from 'react';
import { Search, Filter, Plus, BookOpen, Video } from 'lucide-react';

const Expenses = () => {
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

                <div className="p-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Data Inicial</label>
                        <div className="relative">
                            <input type="text" className="w-full pl-3 pr-3 py-2 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none text-gray-600" placeholder="27/01/2026" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Data Final</label>
                        <div className="relative">
                            <input type="text" className="w-full pl-3 pr-3 py-2 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none text-gray-600" placeholder="29/01/2026" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Loja</label>
                        <select className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none appearance-none bg-white text-gray-600">
                            <option>WN Print</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Fornecedor</label>
                        <select className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none appearance-none bg-white text-gray-400">
                            <option value="">Selecione</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Categoria financeira</label>
                        <select className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none appearance-none bg-white text-gray-400">
                            <option value="">Selecione</option>
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
                        Relatório de Despesas
                    </div>
                </div>

                <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                    <button className="bg-[#1877F2] text-white px-4 py-2 rounded text-xs font-bold hover:bg-blue-600 transition-all shadow-sm flex items-center gap-2">
                        <Plus size={16} />
                        Nova despesa
                    </button>

                    <div className="flex items-center gap-2 w-full md:w-auto">
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

                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                        <thead className="bg-white text-gray-600 font-bold border-y border-gray-200">
                            <tr>
                                <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">
                                    <div className="flex items-center gap-1 cursor-pointer hover:text-gray-900">
                                        Data <ArrowUpDown />
                                    </div>
                                </th>
                                <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">
                                    <div className="flex items-center gap-1 cursor-pointer hover:text-gray-900">
                                        Recebedor <ArrowUpDown />
                                    </div>
                                </th>
                                <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">
                                    <div className="flex items-center gap-1 cursor-pointer hover:text-gray-900">
                                        Descrição <ArrowUpDown />
                                    </div>
                                </th>
                                <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap text-right">
                                    <div className="flex items-center justify-end gap-1 cursor-pointer hover:text-gray-900">
                                        Valor <ArrowUpDown />
                                    </div>
                                </th>
                                <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">
                                    <div className="flex items-center gap-1 cursor-pointer hover:text-gray-900">
                                        Categoria <ArrowUpDown />
                                    </div>
                                </th>
                                <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">
                                    <div className="flex items-center gap-1 cursor-pointer hover:text-gray-900">
                                        Identificador (NF) <ArrowUpDown />
                                    </div>
                                </th>
                                <th className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex items-center gap-1 cursor-pointer hover:text-gray-900">
                                        Usuário que criou <ArrowUpDown />
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="bg-gray-100 border-b border-gray-200">
                                <td colSpan={7} className="px-4 py-8 text-center text-gray-500 font-medium">
                                    Nenhum resultado encontrado
                                </td>
                            </tr>
                        </tbody>
                        <tfoot className="bg-white font-bold text-gray-700 border-t border-gray-200">
                            <tr>
                                <td className="px-4 py-3 border-r border-gray-100">-</td>
                                <td className="px-4 py-3 border-r border-gray-100">-</td>
                                <td className="px-4 py-3 border-r border-gray-100">-</td>
                                <td className="px-4 py-3 border-r border-gray-100 text-right">R$ 0,00</td>
                                <td className="px-4 py-3 border-r border-gray-100">-</td>
                                <td className="px-4 py-3 border-r border-gray-100">-</td>
                                <td className="px-4 py-3">-</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                {/* Scrollbar placeholder logic if needed, visually indicated in screenshot */}
                <div className="px-4 py-2 border-t border-gray-200 bg-gray-50/50">
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gray-400 w-full rounded-full"></div>
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

export default Expenses;
