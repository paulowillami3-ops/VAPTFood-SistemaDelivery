import { useState } from 'react';
import { MessageCircle, Info, Upload } from 'lucide-react';

const QRCode = () => {
    const [activeTab, setActiveTab] = useState('configuracoes');

    // Toggles
    const [menuActive, setMenuActive] = useState(true);
    const [orderObservation, setOrderObservation] = useState(true);
    const [editByClick, setEditByClick] = useState(false);
    const [showSoldOut, setShowSoldOut] = useState(false);
    const [highlightPromotions, setHighlightPromotions] = useState(true);
    const [mostOrdered, setMostOrdered] = useState(false);

    // Form data
    const [description, setDescription] = useState('');
    const [footer, setFooter] = useState('');

    const renderMobilePreview = (content: React.ReactNode) => (
        <div className="relative mx-auto w-[280px] h-[550px] border-8 border-gray-800 rounded-[2.5rem] bg-white overflow-hidden shadow-xl">
            <div className="absolute top-0 w-full h-6 bg-gray-800 z-10 flex justify-center">
                <div className="w-32 h-4 bg-gray-800 rounded-b-xl"></div>
            </div>
            <div className="w-full h-full overflow-y-auto no-scrollbar bg-gray-50">
                {content}
            </div>
        </div>
    );

    return (
        <div className="p-6 bg-gray-50 min-h-screen pb-24">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Cardápio QR Code</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Início <span className="mx-1">›</span> Configurações Salão <span className="mx-1">›</span> Cardápio QR Code <span className="mx-1">›</span> {activeTab === 'configuracoes' ? 'Configurações' : activeTab === 'cor' ? 'Cor e capa da loja' : activeTab === 'descricao' ? 'Descrição e Rodapé' : activeTab === 'destaque' ? 'Produtos em destaque' : 'Produtos esgotados'}
                    </p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar Navigation */}
                <div className="w-full lg:w-64 space-y-6 flex-shrink-0">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <button
                            onClick={() => setActiveTab('configuracoes')}
                            className={`w-full text-left px-4 py-3 text-sm font-medium border-l-4 transition-colors ${activeTab === 'configuracoes' ? 'border-[#0099FF] text-[#0099FF] bg-blue-50' : 'border-transparent text-gray-600 hover:bg-gray-50'}`}
                        >
                            1. Configurações
                        </button>
                        <div className="h-px bg-gray-100 mx-4"></div>
                        <button
                            onClick={() => setActiveTab('cor')}
                            className={`w-full text-left px-4 py-3 text-sm font-medium border-l-4 transition-colors ${activeTab === 'cor' ? 'border-[#0099FF] text-[#0099FF] bg-blue-50' : 'border-transparent text-gray-600 hover:bg-gray-50'}`}
                        >
                            2. Cor e capa da loja
                        </button>
                        <div className="h-px bg-gray-100 mx-4"></div>
                        <button
                            onClick={() => setActiveTab('descricao')}
                            className={`w-full text-left px-4 py-3 text-sm font-medium border-l-4 transition-colors ${activeTab === 'descricao' ? 'border-[#0099FF] text-[#0099FF] bg-blue-50' : 'border-transparent text-gray-600 hover:bg-gray-50'}`}
                        >
                            3. Descrição e Rodapé
                        </button>
                        <div className="h-px bg-gray-100 mx-4"></div>
                        <button
                            onClick={() => setActiveTab('destaque')}
                            className={`w-full text-left px-4 py-3 text-sm font-medium border-l-4 transition-colors ${activeTab === 'destaque' ? 'border-[#0099FF] text-[#0099FF] bg-blue-50' : 'border-transparent text-gray-600 hover:bg-gray-50'}`}
                        >
                            4. Produtos em destaque
                        </button>
                        <div className="h-px bg-gray-100 mx-4"></div>
                        <button
                            onClick={() => setActiveTab('esgotados')}
                            className={`w-full text-left px-4 py-3 text-sm font-medium border-l-4 transition-colors ${activeTab === 'esgotados' ? 'border-[#0099FF] text-[#0099FF] bg-blue-50' : 'border-transparent text-gray-600 hover:bg-gray-50'}`}
                        >
                            5. Produtos esgotados
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                    {activeTab === 'configuracoes' && (
                        <>
                            <h2 className="text-xl font-bold text-gray-800 mb-1">1. Configurações</h2>
                            <p className="text-sm text-gray-500 mb-8">Configurações do seu cardápio</p>

                            <div className="space-y-6">
                                <div className="border border-dashed border-[#0099FF]/30 bg-blue-50/30 rounded-lg p-6 flex gap-4">
                                    <label className="relative inline-flex items-center cursor-pointer mt-1 flex-shrink-0">
                                        <input type="checkbox" className="sr-only peer" checked={menuActive} onChange={(e) => setMenuActive(e.target.checked)} />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0099FF]"></div>
                                    </label>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-sm">Cardápio ativado</h3>
                                        <p className="text-xs text-gray-500 mt-1">Você receberá pedidos do cardápio digital.</p>
                                    </div>
                                </div>

                                <div className="border border-dashed border-[#0099FF]/30 bg-blue-50/30 rounded-lg p-6 flex gap-4">
                                    <label className="relative inline-flex items-center cursor-pointer mt-1 flex-shrink-0">
                                        <input type="checkbox" className="sr-only peer" checked={orderObservation} onChange={(e) => setOrderObservation(e.target.checked)} />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0099FF]"></div>
                                    </label>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-sm">Observação do pedido</h3>
                                        <p className="text-xs text-gray-500 mt-1">O campo de observações será exibido no final do pedido.</p>
                                    </div>
                                </div>

                                <div className="border border-dashed border-gray-200 rounded-lg p-6 flex gap-4">
                                    <label className="relative inline-flex items-center cursor-pointer mt-1 flex-shrink-0">
                                        <input type="checkbox" className="sr-only peer" checked={editByClick} onChange={(e) => setEditByClick(e.target.checked)} />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0099FF]"></div>
                                    </label>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-sm">Edição por clique na quantidade do produto</h3>
                                        <p className="text-xs text-gray-500 mt-1">Facilite a personalização dos pedidos: os clientes podem ajustar as quantidades dos itens diretamente ao clicar nas quantidades exibidas.</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'cor' && (
                        <div className="flex gap-12">
                            <div className="flex-1">
                                <h2 className="text-xl font-bold text-gray-800 mb-1">2. Cor e capa da loja</h2>
                                <p className="text-sm text-gray-500 mb-8">Personalize a cor do cabeçalho do seu Cardápio</p>

                                <div className="mb-6">
                                    <label className="text-gray-800 font-bold block mb-2 text-sm">Cor e capa da loja *</label>
                                    <select className="w-full border border-gray-300 rounded px-4 py-2 text-sm text-gray-700 bg-white">
                                        <option>Cor Selecionada</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-gray-800 font-bold block mb-2 text-sm">Imagem da capa da loja</label>
                                    <div className="border-2 border-dashed border-blue-200 bg-blue-50/30 rounded-lg h-40 flex flex-col items-center justify-center text-center p-4 cursor-pointer hover:bg-blue-50 transition-colors group">
                                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-[#0099FF] mb-2 group-hover:scale-110 transition-transform">
                                            <Upload size={20} />
                                        </div>
                                        <span className="text-sm font-bold text-gray-600">Escolha a foto</span>
                                        <span className="text-xs text-gray-400">Clique aqui ou arraste a foto para cá.</span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">Formatos: .png, .jpg, .jpeg</p>
                                    <p className="text-xs text-gray-400">Peso máximo: 1mb</p>
                                    <p className="text-xs text-gray-400">Resolução mínima: 800x200px</p>
                                </div>
                            </div>
                            <div className="flex-shrink-0 pt-8">
                                {renderMobilePreview(
                                    <div className="flex flex-col h-full">
                                        <div className="h-20 bg-[#0099FF] w-full shrink-0 relative">
                                            <div className="absolute bottom-[-20px] left-4 w-12 h-12 rounded-full bg-yellow-100 border-2 border-white flex items-center justify-center shadow-sm">
                                                <span className="text-lg">🍕</span>
                                            </div>
                                        </div>
                                        <div className="mt-8 px-4 space-y-3">
                                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                            <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                                            <div className="h-20 bg-gray-100 rounded-lg mt-4"></div>
                                            <div className="h-20 bg-gray-100 rounded-lg"></div>
                                            <div className="h-20 bg-gray-100 rounded-lg"></div>
                                            <div className="h-20 bg-gray-100 rounded-lg"></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'descricao' && (
                        <div className="flex gap-12">
                            <div className="flex-1">
                                <h2 className="text-xl font-bold text-gray-800 mb-1">3. Descrição e Rodapé</h2>
                                <p className="text-sm text-gray-500 mb-8">Adicione uma descrição e um rodapé no seu cardápio</p>

                                <div className="mb-8">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-gray-800 font-bold text-sm">Descrição</label>
                                    </div>
                                    <div className="relative">
                                        <textarea
                                            className="w-full border border-gray-300 rounded-lg p-3 text-sm min-h-[100px] resize-none focus:outline-none focus:border-[#0099FF]"
                                            placeholder="Ex: Pizzaria mais tradicional da cidade..."
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            maxLength={40}
                                        ></textarea>
                                        <div className="text-right text-xs text-gray-400 mt-1">0/40</div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-gray-800 font-bold text-sm">Rodapé</label>
                                    </div>
                                    <div className="relative">
                                        <textarea
                                            className="w-full border border-gray-300 rounded-lg p-3 text-sm min-h-[100px] resize-none focus:outline-none focus:border-[#0099FF]"
                                            placeholder="Ex: CNPJ 01.001.001/0001-01"
                                            value={footer}
                                            onChange={(e) => setFooter(e.target.value)}
                                            maxLength={40}
                                        ></textarea>
                                        <div className="text-right text-xs text-gray-400 mt-1">0/40</div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-shrink-0 pt-8 space-y-6">
                                {renderMobilePreview(
                                    <div className="p-4 pt-12">
                                        <div className="bg-white rounded-lg p-3 shadow-sm border border-orange-100 mb-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Info size={14} className="text-orange-400" />
                                                <span className="text-xs font-bold text-gray-700">Sobre o estabelecimento</span>
                                            </div>
                                            <div className="h-2 bg-gray-100 rounded w-full mb-1"></div>
                                            <div className="h-2 bg-gray-100 rounded w-3/4 mb-1"></div>
                                            <div className="h-2 bg-gray-100 rounded w-1/2"></div>
                                        </div>
                                    </div>
                                )}
                                {renderMobilePreview(
                                    <div className="flex flex-col justify-end h-full p-4">
                                        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                                            <div className="text-center text-xs font-bold text-gray-700 mb-2">Estabelecimento</div>
                                            <div className="h-2 bg-gray-100 rounded w-full mb-1"></div>
                                            <div className="h-2 bg-gray-100 rounded w-3/4 mb-1"></div>
                                            <div className="h-2 bg-gray-100 rounded w-1/2"></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'destaque' && (
                        <div className="flex gap-12">
                            <div className="flex-1">
                                <h2 className="text-xl font-bold text-gray-800 mb-1">4. Produtos em destaque</h2>
                                <p className="text-sm text-gray-500 mb-8">Incentive a compra na sua loja destacando seus produtos</p>

                                <div className="space-y-4">
                                    <p className="text-sm text-gray-700 font-medium">Escolha o tipo de destaque que deseja dar aos seus produtos:</p>

                                    <div
                                        onClick={() => { setMostOrdered(true); setHighlightPromotions(false); }}
                                        className={`border rounded-lg p-4 cursor-pointer flex gap-3 items-start ${mostOrdered ? 'border-[#0099FF] bg-blue-50' : 'border-dashed border-gray-300'}`}
                                    >
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${mostOrdered ? 'border-[#0099FF]' : 'border-gray-300'}`}>
                                            {mostOrdered && <div className="w-2.5 h-2.5 rounded-full bg-[#0099FF]" />}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm text-gray-800">Os mais pedidos</h3>
                                            <p className="text-sm text-gray-500">Os seis produtos mais pedidos da sua loja aparecerão em destaque</p>
                                        </div>
                                    </div>

                                    <div
                                        onClick={() => { setMostOrdered(false); setHighlightPromotions(true); }}
                                        className={`border rounded-lg p-4 cursor-pointer flex gap-3 items-start ${highlightPromotions ? 'border-[#0099FF] bg-blue-50' : 'border-dashed border-gray-300'}`}
                                    >
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${highlightPromotions ? 'border-[#0099FF]' : 'border-gray-300'}`}>
                                            {highlightPromotions && <div className="w-2.5 h-2.5 rounded-full bg-[#0099FF]" />}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm text-gray-800">Destaques promocionais</h3>
                                            <p className="text-sm text-gray-500">Os seis produtos com os maiores descontos cadastrados por você no gestor aparecerão em destaque</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-shrink-0 pt-8">
                                {renderMobilePreview(
                                    <div className="p-4 pt-12">
                                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                                            <div className="w-24 h-24 bg-gray-200 rounded-lg shrink-0"></div>
                                            <div className="w-24 h-24 bg-gray-200 rounded-lg shrink-0"></div>
                                            <div className="w-24 h-24 bg-gray-200 rounded-lg shrink-0"></div>
                                        </div>
                                        <div className="mt-4 space-y-3">
                                            <div className="h-16 bg-gray-100 rounded-lg flex items-center p-2 gap-2">
                                                <div className="w-12 h-12 bg-gray-200 rounded"></div>
                                                <div className="flex-1 space-y-1">
                                                    <div className="h-2 bg-gray-200 w-3/4 rounded"></div>
                                                    <div className="h-2 bg-gray-200 w-1/2 rounded"></div>
                                                </div>
                                            </div>
                                            <div className="h-16 bg-gray-100 rounded-lg flex items-center p-2 gap-2">
                                                <div className="w-12 h-12 bg-gray-200 rounded"></div>
                                                <div className="flex-1 space-y-1">
                                                    <div className="h-2 bg-gray-200 w-3/4 rounded"></div>
                                                    <div className="h-2 bg-gray-200 w-1/2 rounded"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'esgotados' && (
                        <div className="flex gap-12">
                            <div className="flex-1">
                                <h2 className="text-xl font-bold text-gray-800 mb-1">5. Produtos esgotados</h2>
                                <p className="text-sm text-gray-500 mb-8">Exibir ou não produtos esgotados no cardápio</p>

                                <div className="border border-dashed border-gray-200 rounded-lg p-6 flex gap-4">
                                    <label className="relative inline-flex items-center cursor-pointer mt-1 flex-shrink-0">
                                        <input type="checkbox" className="sr-only peer" checked={showSoldOut} onChange={(e) => setShowSoldOut(e.target.checked)} />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0099FF]"></div>
                                    </label>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-sm">Exibir produtos esgotados</h3>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-shrink-0 pt-8 flex gap-4">
                                {renderMobilePreview(
                                    <div className="p-4 pt-12">
                                        <div className="bg-[#0099FF] rounded-lg p-2 text-white text-xs mb-2 w-max">Delivery</div>
                                        <div className="flex gap-2 mb-4">
                                            <div className="h-6 w-16 bg-gray-100 rounded-full"></div>
                                            <div className="h-6 w-16 bg-gray-100 rounded-full"></div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex gap-3">
                                                <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                                                <div className="flex-1">
                                                    <div className="h-3 bg-gray-200 w-3/4 rounded mb-2"></div>
                                                    <div className="h-2 bg-gray-100 w-full rounded mb-1"></div>
                                                    <div className="h-2 bg-gray-100 w-1/2 rounded text-[#0099FF]"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {renderMobilePreview(
                                    <div className="p-4 pt-12">
                                        <div className="bg-gray-100 rounded-lg p-2 text-gray-400 text-xs mb-2 w-max grayscale">Delivery</div>
                                        <div className="flex gap-2 mb-4 opacity-50">
                                            <div className="h-6 w-16 bg-gray-100 rounded-full"></div>
                                            <div className="h-6 w-16 bg-gray-100 rounded-full"></div>
                                        </div>
                                        <div className="space-y-4 opacity-50">
                                            <div className="flex gap-3">
                                                <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                                                <div className="flex-1">
                                                    <div className="h-3 bg-gray-200 w-3/4 rounded mb-2"></div>
                                                    <div className="h-2 bg-gray-100 w-full rounded mb-1"></div>
                                                    <div className="h-2 bg-gray-100 w-1/2 rounded"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Save Button */}
            <div className="fixed bottom-0 left-64 right-0 p-4 bg-white border-t border-gray-200 flex justify-end z-10">
                <button className="bg-[#0099FF] text-white px-8 py-2.5 rounded-md font-bold hover:bg-blue-600 transition-colors">
                    Salvar Configurações
                </button>
            </div>


            {/* Chat Widget Mock */}
            <div className="fixed bottom-4 right-6 bg-[#0099FF] p-3 rounded-full text-white shadow-lg cursor-pointer hover:bg-blue-600 transition-colors z-20">
                <div className="w-6 h-6 flex items-center justify-center">
                    <MessageCircle size={24} />
                </div>
            </div>
        </div>
    );
};

export default QRCode;
