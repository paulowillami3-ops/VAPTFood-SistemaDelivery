
import { useState } from 'react';
import { Search, Filter, BookOpen, Video, X } from 'lucide-react';

const BankAccounts = () => {
    const [searchQuery, setSearchQuery] = useState('');

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

            {/* Filters Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                        <Filter size={16} className="text-gray-500" />
                        Filtros
                    </div>
                </div>

                <div className="p-6">
                    <div className="space-y-1 w-full md:w-1/3">
                        <label className="text-xs font-medium text-gray-500">Loja</label>
                        <div className="relative flex items-center">
                            <span className="absolute left-2 bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded flex items-center gap-1">
                                WN Print <X size={12} className="cursor-pointer" />
                            </span>
                            <select className="w-full pl-24 pr-8 py-2 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none appearance-none bg-white text-gray-600">
                                <option></option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                        <div className="w-1 h-4 bg-gray-400 rounded-full"></div>
                        Contas Bancárias
                    </div>
                </div>

                <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                    <button className="bg-[#1877F2] text-white px-4 py-2 rounded text-xs font-bold hover:bg-blue-600 transition-all shadow-sm flex items-center gap-2">
                        Nova Conta
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
                                <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap uppercase">BANCO <ArrowUpDown /></th>
                                <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap uppercase">NOME <ArrowUpDown /></th>
                                <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap uppercase">SALDO <ArrowUpDown /></th>
                                <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap uppercase">Número Conta <ArrowUpDown /></th>
                                <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap uppercase">Lojas <ArrowUpDown /></th>
                                <th className="px-4 py-3 whitespace-nowrap uppercase">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="bg-gray-100 border-b border-gray-200">
                                <td colSpan={6} className="px-4 py-8 text-center text-gray-500 font-medium">
                                    Nenhum resultado encontrado
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                {/* Footer Placeholder for visual consistency */}
                <div className="px-4 py-2 border-t border-gray-200 bg-gray-50/50 min-h-[20px]"></div>
            </div>

            <div className="flex justify-between items-center text-[11px] text-gray-400 px-2 pb-10">
                <span>OpDV © 2022.</span>
                <span>Versão 4.0.54</span>
            </div>
        </div>
    );
};

const ArrowUpDown = () => (
    <svg className="w-3 h-3 text-gray-400 inline-block ml-1" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 5l-5 5h10l-5-5zm0 14l5-5H7l5 5z" />
    </svg>
);

export default BankAccounts;
