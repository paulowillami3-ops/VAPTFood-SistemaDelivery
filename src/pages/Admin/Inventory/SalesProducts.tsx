import { useState, useEffect } from 'react';
import { Search, Filter, Download, Edit2, Package } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface SaleItem {
    id: string | number;
    name: string;
    price: number;
    type: 'PRODUCT' | 'ADDON';
    sku: string;
}

const SalesProducts = () => {
    const [items, setItems] = useState<SaleItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todas');

    const fetchItems = async () => {
        setLoading(true);
        try {
            // Fetch Products
            const { data: products, error: pError } = await supabase
                .from('products')
                .select('id, name, price');

            // Fetch Addons
            const { data: addons, error: aError } = await supabase
                .from('addon_items')
                .select('id, name, price');

            if (pError) console.error('Error fetching products:', pError);
            if (aError) console.error('Error fetching addons:', aError);

            const unifiedItems: SaleItem[] = [
                ...(products?.map(p => ({
                    id: p.id,
                    name: p.name,
                    price: Number(p.price),
                    type: 'PRODUCT' as const,
                    sku: (Math.abs(Number(p.id) * 12345)).toString().slice(0, 8)
                })) || []),
                ...(addons?.map(a => ({
                    id: a.id,
                    name: a.name,
                    price: Number(a.price),
                    type: 'ADDON' as const,
                    sku: (Math.abs(Number(a.id) * 54321)).toString().slice(0, 8)
                })) || [])
            ];

            // Sort alphabetically
            unifiedItems.sort((a, b) => a.name.localeCompare(b.name));
            setItems(unifiedItems);
        } catch (err) {
            console.error('Failed to fetch sale items:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        // For now category filtering is simple, we could expand this later
        return matchesSearch;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-800">Produtos de venda</h1>
            </div>

            {/* Filters Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-widest">
                    <Filter size={14} className="text-blue-500" />
                    Filtros
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Categoria</label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full h-10 px-3 border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white"
                        >
                            <option>Todas</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Data Table Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-widest">
                        <Package size={14} className="text-blue-500" />
                        Produtos
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
                        <Download size={14} />
                        Exportar para CSV
                    </button>
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
                                <th className="px-6 py-4 text-center">AÇÃO</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-10 text-center text-gray-400">Carregando produtos...</td>
                                </tr>
                            ) : filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-10 text-center text-gray-400">Nenhum produto encontrado</td>
                                </tr>
                            ) : (
                                filteredItems.map((item) => (
                                    <tr key={`${item.type}-${item.id}`} className="bg-white hover:bg-gray-50 transition-colors border-b border-gray-50">
                                        <td className="px-6 py-3 border-r border-gray-50 font-medium text-gray-700">{item.name}</td>
                                        <td className="px-6 py-3 border-r border-gray-50 text-gray-400">un</td>
                                        <td className="px-6 py-3 border-r border-gray-50 font-bold text-gray-700">R$ 0,00</td>
                                        <td className="px-6 py-3 border-r border-gray-50 text-gray-700">0</td>
                                        <td className="px-6 py-3 border-r border-gray-50 text-gray-500">Não controlar estoque de p...</td>
                                        <td className="px-6 py-3 border-r border-gray-50"></td>
                                        <td className="px-6 py-3 border-r border-gray-50"></td>
                                        <td className="px-6 py-3 border-r border-gray-50 text-gray-500">{item.sku}</td>
                                        <td className="px-6 py-3 text-center">
                                            <button className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-all">
                                                <Edit2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
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

export default SalesProducts;
