import { useState } from 'react';
import { Search, Plus, Filter } from 'lucide-react';

const StockCategories = () => {
    const [searchQuery, setSearchQuery] = useState('');

    const categories = [
        "Padaria", "Pães artesanais", "Pancho", "Panetone",
        "Patrimônio - Comodato", "Patrimônio - Máquinas e Equipamentos",
        "Peixes", "Prato Pronto", "Preparado", "Produto Intermediário",
        "Produtos de Higiene", "Produtos de Limpeza", "Proteína", "Queijos",
        "Refeições Fit", "Saches", "Sal", "Sorvete / Gelo", "Suplementos",
        "Tabacaria", "Temperos e Condimentos", "Tortas", "Uniformes",
        "Utensílios", "Vegetais Congelados", "Vinagres", "Vinhos"
    ];

    const filteredCategories = categories.filter(cat =>
        cat.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-800">Categorias de Estoque</h1>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-widest">
                        <Filter size={14} className="text-blue-500" />
                        Categorias de Estoque
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

                <div className="p-4">
                    <button className="flex items-center gap-2 bg-[#1877F2] text-white px-4 py-2 rounded text-[10px] font-bold shadow-sm hover:bg-blue-700 transition-all uppercase tracking-tight">
                        <Plus size={14} />
                        Nova Categoria de Estoque
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-[11px] text-left border-collapse">
                        <thead className="bg-[#F8F9FB] text-gray-500 uppercase font-bold border-y border-gray-100">
                            <tr>
                                <th className="px-6 py-4 border-r border-gray-100">NOME</th>
                                <th className="px-6 py-4 text-center w-20">AÇÃO</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCategories.map((cat, idx) => (
                                <tr key={idx} className="bg-white hover:bg-gray-50 transition-colors border-b border-gray-50">
                                    <td className="px-6 py-4 border-r border-gray-50 font-medium text-gray-700">{cat}</td>
                                    <td className="px-6 py-4 text-center">
                                        <button className="bg-[#1877F2] text-white px-4 py-1.5 rounded text-[10px] font-bold shadow-sm hover:bg-blue-700 transition-all uppercase tracking-tight">
                                            Abrir
                                        </button>
                                    </td>
                                </tr>
                            ))}
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

export default StockCategories;
