import { useState } from 'react';
import { Search, BookOpen, Video, Download, X, Info } from 'lucide-react';

const StockReports = () => {
    const [activeTab, setActiveTab] = useState('movimentacao-analitica');
    const [searchQuery, setSearchQuery] = useState('');

    const tabs = [
        { id: 'movimentacao-analitica', label: 'Movimentação Analítica' },
        { id: 'extrato-detalhado', label: 'Extrato Detalhado' },
        { id: 'conferencia-inventarios', label: 'Conferência de Inventários' },
        { id: 'produtos-estoque', label: 'Produtos de Estoque' },
        { id: 'fichas-tecnicas', label: 'Fichas técnicas resumo' },
        { id: 'consumo-insumos', label: 'Consumo de Insumos' },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-end gap-2">
                <button className="flex items-center gap-2 bg-[#1877F2] text-white px-4 py-2 rounded text-xs font-bold hover:bg-blue-600 transition-all shadow-sm">
                    <BookOpen size={14} />
                    Central de ajuda
                </button>
                <button className="flex items-center gap-2 bg-blue-400 text-white px-4 py-2 rounded text-xs font-bold hover:bg-blue-500 transition-all shadow-sm">
                    <Video size={14} />
                    Tutorial
                </button>
            </div>

            <div className="text-sm text-gray-500">
                Home / Estoque / Relatórios de Estoque
            </div>

            <h1 className="text-lg font-bold text-gray-700">Relatórios de Estoque</h1>

            {/* Tabs */}
            <div className="flex overflow-x-auto bg-gray-100 rounded-t-lg border-b border-gray-200 scrollbar-hide">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-3 text-xs font-bold whitespace-nowrap transition-colors ${activeTab === tab.id
                            ? 'bg-[#0B1E34] text-white'
                            : 'text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-b-lg shadow-sm border border-t-0 border-gray-100">

                {/* Filters Section */}
                <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-end mb-4">
                        <button className="flex items-center gap-2 bg-[#1877F2] text-white px-4 py-2 rounded text-xs font-bold hover:bg-blue-600 transition-all shadow-sm">
                            <Video size={14} />
                            Tutorial
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 items-end">
                        {/* Common Date Fields for most tabs */}
                        {(activeTab === 'movimentacao-analitica' || activeTab === 'extrato-detalhado' || activeTab === 'conferencia-inventarios' || activeTab === 'consumo-insumos') && (
                            <>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500">Data Inicial</label>
                                    <input type="text" className="w-full pl-3 pr-3 py-2 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none text-gray-600" placeholder="27/01/2026" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500">Data Final</label>
                                    <input type="text" className="w-full pl-3 pr-3 py-2 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none text-gray-600" placeholder="29/01/2026" />
                                </div>
                            </>
                        )}

                        {/* Toggle Filters */}
                        {activeTab === 'consumo-insumos' && (
                            <div className="md:col-span-3 lg:col-span-3 flex flex-col gap-4">
                                <div className="flex items-center gap-8">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-500 block mb-1">Filtrar por Data de Venda</label>
                                        <label className="inline-flex items-center cursor-pointer">
                                            <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                                            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-500 block mb-1">Filtrar por Data de Competência</label>
                                        <label className="inline-flex items-center cursor-pointer">
                                            <input type="checkbox" value="" className="sr-only peer" />
                                            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                        <p className="text-[9px] text-gray-400 mt-1 max-w-[200px] leading-tight">
                                            Filtro por competência vai utilizar a data de abertura do turno como data de consulta.
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-500 block mb-1">Filtrar por Turno</label>
                                        <label className="inline-flex items-center cursor-pointer">
                                            <input type="checkbox" value="" className="sr-only peer" />
                                            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Store Select */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500">
                                {activeTab === 'movimentacao-analitica' ? 'Lojas' :
                                    activeTab === 'extrato-detalhado' ? 'Lojas' :
                                        activeTab === 'conferencia-inventarios' ? 'Loja' :
                                            activeTab === 'produtos-estoque' ? 'Lojas' :
                                                activeTab === 'fichas-tecnicas' ? 'Lojas' :
                                                    'Lojas'}
                            </label>
                            <div className="relative flex items-center">
                                {activeTab === 'fichas-tecnicas' || activeTab === 'produtos-estoque' || activeTab === 'extrato-detalhado' || activeTab === 'movimentacao-analitica' ? (
                                    <span className="absolute left-2 text-sm text-gray-600">WN Print</span>
                                ) : (
                                    <span className="absolute left-2 bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded flex items-center gap-1">
                                        WN Print <X size={12} className="cursor-pointer" />
                                    </span>
                                )}

                                <select className={`w-full ${activeTab === 'fichas-tecnicas' || activeTab === 'produtos-estoque' || activeTab === 'extrato-detalhado' || activeTab === 'movimentacao-analitica' ? 'px-3' : 'pl-24'} pr-8 py-2 border border-gray-200 rounded text-sm outline-none appearance-none bg-white text-gray-600`}>
                                    <option></option>
                                </select>
                            </div>
                        </div>

                        {/* Specific Filters */}
                        {activeTab === 'extrato-detalhado' && (
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500">Produto</label>
                                <select className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none bg-white text-gray-600">
                                    <option>Selecione..</option>
                                </select>
                            </div>
                        )}
                        {activeTab === 'conferencia-inventarios' && (
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500">Produto</label>
                                <div className="relative flex items-center">
                                    <span className="absolute left-2 bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded flex items-center gap-1">
                                        Todos <X size={12} className="cursor-pointer" />
                                    </span>
                                    <select className="w-full pl-16 pr-8 py-2 border border-gray-200 rounded text-sm outline-none appearance-none bg-white text-gray-600">
                                        <option></option>
                                    </select>
                                </div>
                            </div>
                        )}
                        {activeTab === 'produtos-estoque' && (
                            <>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500">Categoria de Estoque</label>
                                    <select className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none bg-white text-gray-600">
                                        <option>Selecione...</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500">Fornecedor</label>
                                    <select className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none bg-white text-gray-600">
                                        <option>Selecione..</option>
                                    </select>
                                </div>
                            </>
                        )}
                        {activeTab === 'consumo-insumos' && (
                            <>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500">Categoria de Estoque</label>
                                    <select className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none bg-white text-gray-600">
                                        <option>Selecione...</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500">Produto</label>
                                    <select className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none bg-white text-gray-600">
                                        <option>Selecione..</option>
                                    </select>
                                </div>
                            </>
                        )}


                        {/* Fichas técnicas toggle */}
                        {activeTab === 'fichas-tecnicas' && (
                            <div className="space-y-1 flex flex-col justify-end">
                                <label className="text-xs font-medium text-gray-500 block mb-1">Incluir Preço Delivery</label>
                                <label className="inline-flex items-center cursor-pointer">
                                    <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        )}

                        <div className="space-y-1">
                            <button className="bg-[#1877F2] text-white px-6 py-2 rounded text-sm font-bold hover:bg-blue-600 transition-all shadow-sm">
                                Filtrar
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="p-4">
                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                        <button className="bg-[#1877F2] text-white px-4 py-2 rounded text-xs font-bold hover:bg-blue-600 transition-all shadow-sm flex items-center gap-2">
                            <Download size={14} />
                            Exportar para CSV
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

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border-collapse">
                            <thead className="bg-white text-gray-600 font-bold border-y border-gray-200">
                                <tr>
                                    {/* HEADERS */}
                                    {activeTab === 'movimentacao-analitica' && (
                                        <>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Detalhar</th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">SKU <ArrowUpDown /></th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Produto. <ArrowUpDown /></th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Unid. <ArrowUpDown /></th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Est. Inicial <ArrowUpDown /></th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Compras(+) <ArrowUpDown /></th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Compra Canc.(-) <ArrowUpDown /></th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Ajuste (+) <ArrowUpDown /></th>
                                            <th className="px-4 py-3 whitespace-nowrap">Ajuste (-) <ArrowUpDown /></th>
                                        </>
                                    )}
                                    {activeTab === 'extrato-detalhado' && (
                                        <>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Descrição <ArrowUpDown /></th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Data <ArrowUpDown /></th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Saldo Ante. <ArrowUpDown /></th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Quantidade <ArrowUpDown /></th>
                                            <th className="px-4 py-3 whitespace-nowrap">Saldo Atual. <ArrowUpDown /></th>
                                        </>
                                    )}
                                    {activeTab === 'conferencia-inventarios' && (
                                        // No table headers shown in screenshot, assuming somewhat similar or just empty placeholder till data
                                        // Screenshot shows only filters.
                                        // Let's create a generic table structure or based on expected columns.
                                        // Actually let's assume standard columns for inventory conference: Product, Expected, Counted, Diff
                                        <>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Produto</th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Estoque Atual</th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Contagem</th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Diferença</th>
                                            <th className="px-4 py-3 whitespace-nowrap">Ações</th>
                                        </>
                                    )}
                                    {activeTab === 'produtos-estoque' && (
                                        // Screenshot shows empty table with no headers visible? No, headers are standard.
                                        // Wait, the screenshot 'produtos de estoque' doesn't show table headers clearly?
                                        // Ah, actually, NO table is shown in that screenshot, just "Nenhum resultado encontrado" and no headers?
                                        // Wait, typically there are headers.
                                        // Let's assume standard headers: Produto, Categoria, Unidade, Custo, Estoque Min, Estoque Atual.
                                        <>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Produto</th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Categoria</th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Unidade</th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Custo</th>
                                            <th className="px-4 py-3 whitespace-nowrap">Estoque Atual</th>
                                        </>
                                    )}
                                    {activeTab === 'fichas-tecnicas' && (
                                        <>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Produto</th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Custo</th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Venda</th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Markup</th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap flex items-center gap-1">CMV <Info size={12} /></th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Componente</th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Unid.</th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Qtd</th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Custo</th>
                                            <th className="px-4 py-3 whitespace-nowrap">Subtotal</th>
                                        </>
                                    )}
                                    {activeTab === 'consumo-insumos' && (
                                        <>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">ID <ArrowUpDown /></th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Produto <ArrowUpDown /></th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Un <ArrowUpDown /></th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Kg <ArrowUpDown /></th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Litr... <ArrowUpDown /></th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Custo Uni. <ArrowUpDown /></th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Custo Tota... <ArrowUpDown /></th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Loja <ArrowUpDown /></th>
                                            <th className="px-4 py-3 whitespace-nowrap">CNPJ <ArrowUpDown /></th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="bg-gray-100 border-b border-gray-200">
                                    <td colSpan={12} className="px-4 py-8 text-center text-gray-500 font-medium">
                                        Nenhum resultado encontrado
                                    </td>
                                </tr>
                            </tbody>
                            {/* TOTALS FOOTER */}
                            {(activeTab === 'movimentacao-analitica' || activeTab === 'consumo-insumos') && (
                                <tfoot className="bg-white border-t border-gray-200 font-bold text-gray-700">
                                    {activeTab === 'movimentacao-analitica' && (
                                        <tr>
                                            <td className="px-4 py-3 border-r border-gray-100">Totais de c...</td>
                                            <td className="px-4 py-3 border-r border-gray-100">-</td>
                                            <td className="px-4 py-3 border-r border-gray-100">-</td>
                                            <td className="px-4 py-3 border-r border-gray-100">-</td>
                                            <td className="px-4 py-3 border-r border-gray-100">-</td>
                                            <td className="px-4 py-3 border-r border-gray-100">-</td>
                                            <td className="px-4 py-3 border-r border-gray-100">-</td>
                                            <td className="px-4 py-3 border-r border-gray-100">-</td>
                                            <td>-</td>
                                        </tr>
                                    )}
                                    {activeTab === 'consumo-insumos' && (
                                        <tr>
                                            <td className="px-4 py-3 border-r border-gray-100 text-transparent">.</td>
                                            <td className="px-4 py-3 border-r border-gray-100">-</td>
                                            <td className="px-4 py-3 border-r border-gray-100">0</td>
                                            <td className="px-4 py-3 border-r border-gray-100">0</td>
                                            <td className="px-4 py-3 border-r border-gray-100">0</td>
                                            <td className="px-4 py-3 border-r border-gray-100">R$ 0,00</td>
                                            <td className="px-4 py-3 border-r border-gray-100">R$ 0,00</td>
                                            <td className="px-4 py-3 border-r border-gray-100">-</td>
                                            <td>-</td>
                                        </tr>
                                    )}
                                </tfoot>
                            )}
                        </table>
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
    <svg className="w-3 h-3 text-gray-400 inline-block ml-1" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 5l-5 5h10l-5-5zm0 14l5-5H7l5 5z" />
    </svg>
);

export default StockReports;
