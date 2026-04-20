import { useState } from 'react';
import { Search, Filter, BookOpen, Video, Download, X } from 'lucide-react';

const FinancialReports = () => {
    const [activeTab, setActiveTab] = useState('saldo-diario');
    const [searchQuery, setSearchQuery] = useState('');

    const tabs = [
        { id: 'saldo-diario', label: 'Saldo Diário' },
        { id: 'saldo-diario-detalhe', label: 'Saldo Diário Detalhe' },
        { id: 'conferencia', label: 'Conferência de Numerários' },
        { id: 'retiradas', label: 'Retiradas e Suprimentos' },
        { id: 'transferencia', label: 'Tranferência Conta' },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-end gap-2">
                <button className="flex items-center gap-2 bg-[#1877F2] text-white px-4 py-2 rounded text-xs font-bold hover:bg-blue-600 transition-all shadow-sm">
                    <BookOpen size={14} />
                    Central de ajuda
                </button>
                {/* Tutorial button is in the Filters section in screenshots, but let's keep consistent header if needed. 
                     Actually, screenshots show Tutorial button inside the filter container for some tabs. 
                     The top right usually has Central de Ajuda. 
                     Let's check screenshot 1. Top right: Central de Ajuda. Tutorial is NOT there.
                     Screenshot 1 Filter section has "Tutorial" button on the right.
                  */}
            </div>

            <div className="text-sm text-gray-500">
                Home / Relatórios Financeiros
            </div>

            <h1 className="text-lg font-bold text-gray-700">Relatórios Financeiros</h1>

            {/* Tabs */}
            <div className="flex overflow-x-auto bg-gray-100 rounded-t-lg border-b border-gray-200">
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

                {/* Filters Section - Varies by Tab */}
                <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                            <Filter size={16} className="text-gray-500" />
                            Filtros
                        </div>
                        <button className="flex items-center gap-2 bg-[#1877F2] text-white px-4 py-2 rounded text-xs font-bold hover:bg-blue-600 transition-all shadow-sm">
                            <Video size={14} />
                            Tutorial
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 items-end">
                        {/* Common Date Fields */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500">Data Inicial</label>
                            <input type="text" className="w-full pl-3 pr-3 py-2 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none text-gray-600" placeholder="27/01/2026" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500">Data Final</label>
                            <input type="text" className="w-full pl-3 pr-3 py-2 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none text-gray-600" placeholder="29/01/2026" />
                        </div>

                        {/* Specific Filters per Tab */}
                        {activeTab === 'saldo-diario' && (
                            <>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500">Loja</label>
                                    <div className="relative flex items-center">
                                        <span className="absolute left-2 bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded flex items-center gap-1">
                                            WN Print <X size={12} className="cursor-pointer" />
                                        </span>
                                        <select className="w-full pl-24 pr-8 py-2 border border-gray-200 rounded text-sm outline-none appearance-none bg-white text-gray-600">
                                            <option></option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500">Conta bancaria</label>
                                    <select className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none bg-white text-gray-600">
                                        <option>Selecione</option>
                                    </select>
                                </div>
                            </>
                        )}

                        {activeTab === 'saldo-diario-detalhe' && (
                            <>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500">Filtrar por</label>
                                    <select className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none bg-white text-gray-600">
                                        <option>Vencimento</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500">Loja</label>
                                    <div className="relative flex items-center">
                                        <span className="absolute left-2 bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded flex items-center gap-1">
                                            WN Print <X size={12} className="cursor-pointer" />
                                        </span>
                                        <select className="w-full pl-24 pr-8 py-2 border border-gray-200 rounded text-sm outline-none appearance-none bg-white text-gray-600">
                                            <option></option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500">Conta bancaria</label>
                                    <select className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none bg-white text-gray-600">
                                        <option>Todas</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500">Status</label>
                                    <select className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none bg-white text-gray-600">
                                        <option>Todos</option>
                                    </select>
                                </div>
                            </>
                        )}

                        {activeTab === 'conferencia' && (
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500">Loja</label>
                                <div className="relative flex items-center">
                                    <span className="absolute left-2 bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded flex items-center gap-1">
                                        WN Print <X size={12} className="cursor-pointer" />
                                    </span>
                                    <select className="w-full pl-24 pr-8 py-2 border border-gray-200 rounded text-sm outline-none appearance-none bg-white text-gray-600">
                                        <option></option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {activeTab === 'retiradas' && (
                            <>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500">Sangria ou suprimentos</label>
                                    <select className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none bg-white text-gray-600">
                                        <option>Todos</option>
                                    </select>
                                </div>
                                <div className="space-y-1 flex flex-col justify-end h-full pb-2">
                                    <label className="inline-flex items-center cursor-pointer">
                                        <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                                        <div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                        <span className="ms-2 text-xs font-medium text-gray-500">Filtrar por Data de Venda</span>
                                    </label>
                                </div>
                                <div className="space-y-1 flex flex-col justify-end h-full pb-2">
                                    <label className="inline-flex items-center cursor-pointer">
                                        <input type="checkbox" value="" className="sr-only peer" />
                                        <div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                        <span className="ms-2 text-xs font-medium text-gray-500">Filtrar por Turno</span>
                                    </label>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500">Loja</label>
                                    <div className="relative flex items-center">
                                        <span className="absolute left-2 bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded flex items-center gap-1">
                                            WN Print <X size={12} className="cursor-pointer" />
                                        </span>
                                        <select className="w-full pl-24 pr-8 py-2 border border-gray-200 rounded text-sm outline-none appearance-none bg-white text-gray-600">
                                            <option></option>
                                        </select>
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'transferencia' && (
                            <>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500">Conta bancaria origem</label>
                                    <select className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none bg-white text-gray-600">
                                        <option>Todas</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500">Conta bancaria destino</label>
                                    <select className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none bg-white text-gray-600">
                                        <option>Todas</option>
                                    </select>
                                </div>
                            </>
                        )}

                        <div className="space-y-1">
                            <button className="w-full md:w-auto bg-[#1877F2] text-white px-6 py-2 rounded text-sm font-bold hover:bg-blue-600 transition-all shadow-sm">
                                Filtrar
                            </button>
                        </div>
                    </div>
                    {activeTab === 'saldo-diario' && (
                        <div className='mt-2 text-[10px] text-gray-400'>Intervalo máximo: 120 dias</div>
                    )}
                    {activeTab === 'saldo-diario-detalhe' && (
                        <div className='mt-2 text-[10px] text-gray-400'>Intervalo máximo: 120 dias</div>
                    )}
                    {activeTab === 'conferencia' && (
                        <div className='mt-2 text-[10px] text-gray-400'>Intervalo máximo: 120 dias</div>
                    )}
                    {activeTab === 'transferencia' && (
                        <div className='mt-2 text-[10px] text-gray-400'>Intervalo máximo: 120 dias</div>
                    )}
                    {activeTab === 'retiradas' && (
                        <div className='mt-2 text-[10px] text-gray-400'>Intervalo máximo: 90 dias</div>
                    )}
                </div>

                {/* Main Content Area */}
                <div className="p-4">
                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                        {activeTab === 'conferencia' || activeTab === 'saldo-diario-detalhe' || activeTab === 'saldo-diario' || activeTab === 'retiradas' || activeTab === 'transferencia' ? (
                            <button className="bg-[#1877F2] text-white px-4 py-2 rounded text-xs font-bold hover:bg-blue-600 transition-all shadow-sm flex items-center gap-2">
                                <Download size={14} />
                                Exportar para CSV
                            </button>
                        ) : <div></div>}

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

                    {/* Table Titles - Vary by Tab */}
                    {activeTab === 'retiradas' && (
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                            <div className="w-1 h-4 bg-gray-400 rounded-full"></div>
                            Retiradas e Suprimentos
                        </div>
                    )}
                    {activeTab === 'transferencia' && (
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                            <div className="w-1 h-4 bg-gray-400 rounded-full"></div>
                            Transferências
                        </div>
                    )}
                    {activeTab === 'saldo-diario-detalhe' && (
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                            <div className="w-1 h-4 bg-gray-400 rounded-full"></div>
                            Fluxo de Caixa
                        </div>
                    )}

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border-collapse">
                            <thead className="bg-white text-gray-600 font-bold border-y border-gray-200">
                                <tr>
                                    {/* HEADERS */}
                                    {activeTab === 'saldo-diario' && (
                                        <>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Data <ArrowUpDown /></th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap text-right">Receitas <ArrowUpDown /></th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap text-right">Despesas <ArrowUpDown /></th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap text-right">Saldo <ArrowUpDown /></th>
                                            <th className="px-4 py-3 whitespace-nowrap">Detalhar</th>
                                        </>
                                    )}
                                    {activeTab === 'saldo-diario-detalhe' && (
                                        <>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Status</th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Venc. <ArrowUpDown /></th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Compet. <ArrowUpDown /></th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Realizado...</th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Recebedor <ArrowUpDown /></th>
                                            <th className="px-4 py-3 whitespace-nowrap w-full">Descrição <ArrowUpDown /></th>
                                            <th className="px-4 py-3 whitespace-nowrap"></th>
                                        </>
                                    )}
                                    {activeTab === 'conferencia' && (
                                        <>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Data <ArrowUpDown /></th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Forma de Pagamento <ArrowUpDown /></th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap text-right">Sistema(1) <ArrowUpDown /></th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap text-right">Operador(2) <ArrowUpDown /></th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap text-right">Conciliação(3) <ArrowUpDown /></th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap text-right">Dif (3-1) <ArrowUpDown /></th>
                                            <th className="px-4 py-3 whitespace-nowrap">Detalhar</th>
                                        </>
                                    )}
                                    {activeTab === 'retiradas' && (
                                        <>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Código</th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Loja <ArrowUpDown /></th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Tipo <ArrowUpDown /></th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Descrição <ArrowUpDown /></th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Observação <ArrowUpDown /></th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Data <ArrowUpDown /></th>
                                            <th className="px-4 py-3 whitespace-nowrap text-right">Valor <ArrowUpDown /></th>
                                        </>
                                    )}
                                    {activeTab === 'transferencia' && (
                                        <>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">ID <ArrowUpDown /></th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Data <ArrowUpDown /></th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Tipo <ArrowUpDown /></th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Conta Origem <ArrowUpDown /></th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">Conta Destino <ArrowUpDown /></th>
                                            <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap text-right">Valor <ArrowUpDown /></th>
                                            <th className="px-4 py-3 whitespace-nowrap">Feito por <ArrowUpDown /></th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="bg-gray-100 border-b border-gray-200">
                                    <td colSpan={10} className="px-4 py-8 text-center text-gray-500 font-medium">
                                        Nenhum resultado encontrado
                                    </td>
                                </tr>
                            </tbody>
                            {/* TOTALS FOOTER */}
                            <tfoot className="bg-white border-t border-gray-200 font-bold text-gray-700">
                                {activeTab === 'saldo-diario' && (
                                    <tr>
                                        <td className="px-4 py-3 border-r border-gray-100">-</td>
                                        <td className="px-4 py-3 border-r border-gray-100 text-right">R$ 0,00</td>
                                        <td className="px-4 py-3 border-r border-gray-100 text-right">R$ 0,00</td>
                                        <td className="px-4 py-3 border-r border-gray-100 text-right">R$ 0,00</td>
                                        <td></td>
                                    </tr>
                                )}
                                {activeTab === 'saldo-diario-detalhe' && (
                                    <tr>
                                        <td className="px-4 py-3 border-r border-gray-100"></td>
                                        <td className="px-4 py-3 border-r border-gray-100">-</td>
                                        <td className="px-4 py-3 border-r border-gray-100">-</td>
                                        <td className="px-4 py-3 border-r border-gray-100">-</td>
                                        <td className="px-4 py-3 border-r border-gray-100">-</td>
                                        <td className="px-4 py-3 border-r border-gray-100">-</td>
                                        <td className="px-4 py-3 text-right">R$ 0,00</td>
                                    </tr>
                                )}
                                {activeTab === 'conferencia' && (
                                    <tr>
                                        <td className="px-4 py-3 border-r border-gray-100">-</td>
                                        <td className="px-4 py-3 border-r border-gray-100">-</td>
                                        <td className="px-4 py-3 border-r border-gray-100 text-right">-</td>
                                        <td className="px-4 py-3 border-r border-gray-100 text-right">-</td>
                                        <td className="px-4 py-3 border-r border-gray-100 text-right">-</td>
                                        <td className="px-4 py-3 border-r border-gray-100 text-right">-</td>
                                        <td></td>
                                    </tr>
                                )}
                                {activeTab === 'retiradas' && (
                                    <tr>
                                        <td className="px-4 py-3 border-r border-gray-100">-</td>
                                        <td className="px-4 py-3 border-r border-gray-100">-</td>
                                        <td className="px-4 py-3 border-r border-gray-100">-</td>
                                        <td className="px-4 py-3 border-r border-gray-100">-</td>
                                        <td className="px-4 py-3 border-r border-gray-100">-</td>
                                        <td className="px-4 py-3 border-r border-gray-100">-</td>
                                        <td className="px-4 py-3 text-right">R$ 0,00</td>
                                    </tr>
                                )}
                            </tfoot>
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

export default FinancialReports;
