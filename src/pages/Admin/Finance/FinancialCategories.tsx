import { useState } from 'react';
import { Search, BookOpen, Video } from 'lucide-react';

const FinancialCategories = () => {
    const [searchQuery, setSearchQuery] = useState('');

    const categories = [
        { position: 1, name: "01 Receita Bruta" },
        { position: 1, name: "04 COMPRA DE MERCADORIA" },
        { position: 1, name: "04.01 ACESSORIOS E EMBALAGENS" },
        { position: 1, name: "04.02 ACUCAR E DERIVADOS" },
        { position: 1, name: "04.03 BEBIDAS" },
        { position: 1, name: "04.04 CAFETERIA" },
        { position: 1, name: "04.05 CARNES" },
        { position: 1, name: "04.06 CONFEITARIA" },
        { position: 1, name: "04.07 CONFEITARIA TERCEIROS" },
        { position: 1, name: "04.08 CONGELADOS" },
        { position: 1, name: "04.09 GRAOS E FARINHA" },
        { position: 1, name: "04.10 HORTIFRUTI" },
        { position: 1, name: "04.11 LATICINIOS E FRIOS" },
        { position: 1, name: "04.12 MASSA E PAES" },
        { position: 1, name: "04.13 PRATO PRONTO" },
        { position: 1, name: "04.14 TEMPEROS E CONDIMENTOS" },
        { position: 1, name: "04.15 ESTOQUE PADRAO" },
        { position: 1, name: "04.16 IMPOSTOS NOTAS" },
        { position: 1, name: "04.17 FRETE NOTAS COMPRA" },
        { position: 1, name: "05 MARGEM BRUTA DE VENDAS" },
        { position: 1, name: "06 TOTAL DE CUSTOS" },
        { position: 1, name: "06.01 IMPOSTOS" },
        { position: 1, name: "06.01.01 ICMS" },
        { position: 1, name: "06.01.02 SIMPLES NACIONAL" },
        { position: 1, name: "06.01.03 DARF" },
        { position: 1, name: "06.02 TAXA MENSAL FRANQUIA" },
        { position: 1, name: "06.02.01 FUNDO DE PROMOÇÃO" },
        { position: 1, name: "06.02.01 ROYALTIES" },
        { position: 1, name: "06.03 COMUNICAÇÃO E MARKETING" },
        { position: 1, name: "06.03.01 PROPAGANDA" },
        { position: 1, name: "06.04 COLABORADORES" },
        { position: 1, name: "06.04.01 TRANSPORTE" },
        { position: 1, name: "06.04.02 SUBSIDIO ALIMENTACAO (TICKET)" },
        { position: 1, name: "06.04.03 SALÁRIO" },
        { position: 1, name: "06.04.04 SALÁRIO - ADIANTAMENTO" },
        { position: 1, name: "06.04.05 SALÁRIO 13" },
        { position: 1, name: "06.04.06 RESCISÃO" },
        { position: 1, name: "06.04.07 RECLAMATÓRIO (EVENTUAL)" },
        { position: 1, name: "06.04.08 PROVISÃO FÉRIAS" },
        { position: 1, name: "06.04.09 PROVISÃO 13 º SALÁRIO" },
        { position: 1, name: "06.04.10 PRÊMIOS E COMISSÕES" },
        { position: 1, name: "06.04.11 PLANO DE SAÚDE (FIXO + VARIÁVEL)" },
        { position: 1, name: "06.04.12 H. EXTRA" },
        { position: 1, name: "06.04.13 FREELANCER" },
        { position: 1, name: "06.04.14 FÉRIAS" },
        { position: 1, name: "06.04.15 FARMÁCIA" },
        { position: 1, name: "06.04.16 EXAMES ADMIS/DEMIS" },
        { position: 1, name: "06.04.17 INSS" },
        { position: 1, name: "06.04.18 FGTS" },
        { position: 1, name: "06.04.20 CONTRIBUIÇÃO" },
        { position: 1, name: "06.04.21 CESTA BÁSICA" },
        { position: 1, name: "06.05 MATERIAIS DE ESCRITÓRIO" },
        { position: 1, name: "06.05.01 MATERIAL DE ESCRITÓRIO" },
        { position: 1, name: "06.05.02 MATERIAL DE INFORMÁTICA" },
        { position: 1, name: "06.06 MATERIAL DE LIMPEZA" },
        { position: 1, name: "06.06.01 MATERIAL DE LIMPEZA" },
        { position: 1, name: "06.07 SERVIÇOS ESPECIAIS DE TERCEIROS" },
        { position: 1, name: "06.07.01 CONTADOR" },
        { position: 1, name: "06.07.02 JURIDICO" },
        { position: 1, name: "06.07.03 INFORMÁTICA" },
        { position: 1, name: "06.07.04 SISTEMA DE SEGURANÇA" },
        { position: 1, name: "06.07.05 SISTEMA DE DESINSETIZAÇÃO E LIMPEZA" },
        { position: 1, name: "06.07.06 SISTEMA" },
        { position: 1, name: "06.07.07 TELE-ENTREGA" },
        { position: 1, name: "06.07.08 LOCAÇÃO DE EQUIPAMENTOS" },
        { position: 1, name: "06.08 TERCEIROS EVENTUAIS" },
        { position: 1, name: "06.08.01 UNIFORME" },
        { position: 1, name: "06.08.02 CORREIO" },
        { position: 1, name: "06.08.03 CARTÓRIO" },
        { position: 1, name: "06.08.04 GRÁFICAS" },
        { position: 1, name: "06.08.05 ANUNCIOS VAGAS" },
        { position: 1, name: "06.08.06 CURSOS" },
        { position: 1, name: "06.08.07 UTENSÍLIOS" },
        { position: 1, name: "06.09 CUSTO DE OCUPAÇÃO" },
        { position: 1, name: "06.09.01 ALUGUEL" },
        { position: 1, name: "06.09.02 13º ALUGUEL - PROVISÃO" },
        { position: 1, name: "06.09.03 CONDOMINIO" },
        { position: 1, name: "06.09.04 FUNDO DE PROMOÇÃO" },
        { position: 1, name: "06.09.05 IMPOSTO IPTU" },
        { position: 1, name: "06.09.06 SEGURO PREDIAL" },
        { position: 1, name: "06.09.07 AR CONDICIONADO" },
        { position: 1, name: "06.10 CONCESSIONÁRIAS" },
        { position: 1, name: "06.10.01 ENERGIA" },
        { position: 1, name: "06.10.02 AGUA" },
        { position: 1, name: "06.10.03 TELEFONE/INTERNET" },
        { position: 1, name: "06.10.04 GAS DE COZINHA" },
        { position: 1, name: "06.10.05 OUTROS" },
        { position: 1, name: "06.11 MANUTENÇÃO GERAL" },
        { position: 1, name: "06.11.01 OBRAS" },
        { position: 1, name: "06.11.02 EQUIPAMENTO COZINHA" },
        { position: 1, name: "06.11.03 MANUTENÇÃO EQUIPAMENTOS DIVERSOS" },
        { position: 1, name: "06.12 DESPESAS FINANCEIRAS OPERACIONAIS" },
        { position: 1, name: "06.12.01 ALUGUEL MAQUINA DE CARTOES" },
        { position: 1, name: "06.12.02 TARIFAS BANCÁRIAS" },
        { position: 1, name: "06.12.03 TAXAS APPS" },
        { position: 1, name: "06.12.04 TAXAS ADM CARTÕES" },
        { position: 1, name: "07 RESULTADO OPERACIONAL" },
        { position: 1, name: "08 RETIRADAS" },
        { position: 1, name: "08.01 PRO-LABORE" },
        { position: 1, name: "08.02 COMISSÕES" },
    ];

    const filteredCategories = categories.filter(category =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

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

            {/* Main Content Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                        <div className="w-1 h-4 bg-gray-400 rounded-full"></div>
                        Categorias Financeiras
                    </div>
                </div>

                <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                    <button className="bg-[#1877F2] text-white px-4 py-2 rounded text-xs font-bold hover:bg-blue-600 transition-all shadow-sm flex items-center gap-2">
                        Nova Categoria Financeira
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
                                <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap w-24 uppercase">Posição <ArrowUpDown /></th>
                                <th className="px-4 py-3 border-r border-gray-100 whitespace-nowrap uppercase">Nome <ArrowUpDown /></th>
                                <th className="px-4 py-3 whitespace-nowrap w-24 uppercase">Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCategories.map((cat, idx) => (
                                <tr key={idx} className="bg-gray-100 hover:bg-gray-200/50 transition-colors border-b border-gray-200">
                                    <td className="px-4 py-3 border-r border-gray-200 text-gray-600 font-medium">{cat.position}</td>
                                    <td className="px-4 py-3 border-r border-gray-200 text-gray-700 font-medium uppercase">{cat.name}</td>
                                    <td className="px-4 py-3 text-center">
                                        <button className="bg-[#60A5FA] text-white px-4 py-1.5 rounded text-[10px] font-bold shadow-sm hover:bg-blue-500 transition-all uppercase tracking-wide w-full">
                                            Abrir
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* Footer / Pagination Placeholder */}
                <div className="px-4 py-2 border-t border-gray-200 bg-gray-50/50">
                    <div className="flex justify-between items-center text-[10px] text-gray-500">
                        <span>Showing {filteredCategories.length} items</span>
                        <div className="flex gap-1">
                            {/* Simple pagination mock */}
                            <button className="px-2 py-1 bg-white border border-gray-200 rounded hover:bg-gray-50">&lt;</button>
                            <button className="px-2 py-1 bg-blue-500 text-white border border-blue-500 rounded">1</button>
                            <button className="px-2 py-1 bg-white border border-gray-200 rounded hover:bg-gray-50">2</button>
                            <button className="px-2 py-1 bg-white border border-gray-200 rounded hover:bg-gray-50">&gt;</button>
                        </div>
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

export default FinancialCategories;
