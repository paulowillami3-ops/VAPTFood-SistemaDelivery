import { useState } from 'react';
import { Search, Filter, Video } from 'lucide-react';

const TechSpecs = () => {
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-800">Ficha Técnica</h1>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 bg-[#1877F2] text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-blue-600 transition-all shadow-sm">
                        <Video size={14} />
                        Tutorial
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-widest">
                        <Filter size={14} className="text-blue-500" />
                        Fichas Técnicas
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Procurar"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-4 pr-10 py-2 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none w-64 bg-white shadow-inner"
                            />
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        </div>
                        <button className="p-2.5 bg-[#0B1E34] text-white rounded shadow-md hover:bg-blue-600 transition-all">
                            <Search size={14} />
                        </button>
                    </div>
                </div>

                <div className="p-4 flex gap-3">
                    <button className="flex items-center gap-2 bg-[#1877F2] text-white px-4 py-2 rounded text-[10px] font-bold shadow-sm hover:bg-blue-700 transition-all uppercase tracking-tight">
                        Nova ficha técnica
                    </button>
                    <button className="flex items-center gap-2 bg-[#0B1E34] text-white px-4 py-2 rounded text-[10px] font-bold shadow-sm hover:opacity-90 transition-all uppercase tracking-tight">
                        Copiar ficha técnica
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-[11px] text-left border-collapse">
                        <thead className="bg-[#F8F9FB] text-gray-500 uppercase font-bold border-y border-gray-100">
                            <tr>
                                <th className="px-6 py-4 border-r border-gray-100">NOME</th>
                                <th className="px-6 py-4 text-center w-32">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="bg-white hover:bg-gray-50 transition-colors border-b border-gray-50">
                                <td colSpan={2} className="px-6 py-10 text-center text-gray-400 font-medium">
                                    Nenhum resultado encontrado
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex justify-between items-center text-[11px] text-gray-400 px-2 pb-10 pt-4">
                <span>Versão 4.0.54</span>
            </div>
        </div>
    );
};

export default TechSpecs;
