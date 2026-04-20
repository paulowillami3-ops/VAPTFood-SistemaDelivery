import { useState } from 'react';
import { ExternalLink, MessageCircle, Minus, Plus } from 'lucide-react';

const AppSettings = () => {
    const [activeTab, setActiveTab] = useState('pedido');

    // Pedido Toggles
    const [allowDelivery, setAllowDelivery] = useState(true);
    const [allowEdit, setAllowEdit] = useState(true);
    const [allowEditCharges, setAllowEditCharges] = useState(false);
    const [allowCancel, setAllowCancel] = useState(false);
    const [showStatus, setShowStatus] = useState(false);
    const [openWithoutOrder, setOpenWithoutOrder] = useState(false);
    const [autoPrint, setAutoPrint] = useState(true);
    const [autoPrintConference, setAutoPrintConference] = useState(false);

    // Fechamento Toggles
    const [allowCloseAccount, setAllowCloseAccount] = useState(true);
    const [allowDiscount, setAllowDiscount] = useState(false);
    const [allowSurcharge, setAllowSurcharge] = useState(false);

    // Atendimento Toggles
    const [informPeople, setInformPeople] = useState(false);
    const [transferTables, setTransferTables] = useState(false);
    const [transferOrders, setTransferOrders] = useState(true);
    const [clientCall, setClientCall] = useState(false);
    const [showIdleTables, setShowIdleTables] = useState(true);
    const [idleTime, setIdleTime] = useState(30);

    const handleIdleTimeChange = (delta: number) => {
        setIdleTime(prev => {
            const newValue = prev + delta;
            return newValue < 0 ? 0 : newValue;
        });
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen pb-24">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Aplicativo do Garçom</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Início <span className="mx-1">›</span> Configurações Salão <span className="mx-1">›</span> App Garçom <span className="mx-1">›</span> {activeTab === 'pedido' ? 'Pedido' : activeTab === 'fechamento' ? 'Fechamento de conta' : 'Atendimento'}
                    </p>
                </div>
                <button className="bg-[#0099FF] text-white px-4 py-2 rounded-md font-bold hover:bg-blue-600 transition-colors flex items-center gap-2">
                    <ExternalLink size={18} />
                    Acessar o App
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar Navigation */}
                <div className="w-full lg:w-64 space-y-6 flex-shrink-0">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <button
                            onClick={() => setActiveTab('pedido')}
                            className={`w-full text-left px-4 py-3 text-sm font-medium border-l-4 transition-colors ${activeTab === 'pedido' ? 'border-[#0099FF] text-[#0099FF] bg-blue-50' : 'border-transparent text-gray-600 hover:bg-gray-50'}`}
                        >
                            1. Pedido
                        </button>
                        <div className="h-px bg-gray-100 mx-4"></div>
                        <button
                            onClick={() => setActiveTab('fechamento')}
                            className={`w-full text-left px-4 py-3 text-sm font-medium border-l-4 transition-colors ${activeTab === 'fechamento' ? 'border-[#0099FF] text-[#0099FF] bg-blue-50' : 'border-transparent text-gray-600 hover:bg-gray-50'}`}
                        >
                            2. Fechamento de conta
                        </button>
                        <div className="h-px bg-gray-100 mx-4"></div>
                        <button
                            onClick={() => setActiveTab('atendimento')}
                            className={`w-full text-left px-4 py-3 text-sm font-medium border-l-4 transition-colors ${activeTab === 'atendimento' ? 'border-[#0099FF] text-[#0099FF] bg-blue-50' : 'border-transparent text-gray-600 hover:bg-gray-50'}`}
                        >
                            3. Atendimento
                        </button>
                    </div>

                    {/* Help Box */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="font-bold text-gray-800 mb-2">Dúvidas sobre o App Garçom?</h3>
                        <p className="text-sm text-gray-500 mb-4">Conheça tudo sobre o app na nossa central de ajuda</p>
                        <button className="w-full border border-[#0099FF] text-[#0099FF] px-4 py-2 rounded-md font-bold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
                            <ExternalLink size={18} />
                            Acessar ajuda
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                    {activeTab === 'pedido' && (
                        <>
                            <h2 className="text-xl font-bold text-gray-800 mb-1">1. Pedido</h2>
                            <p className="text-sm text-gray-500 mb-8">Configure as opções de pedidos do garçom no aplicativo</p>

                            <div className="space-y-8">
                                {/* Toggle Items for Pedido */}
                                <div className="flex gap-4">
                                    <label className="relative inline-flex items-center cursor-pointer mt-1 flex-shrink-0">
                                        <input type="checkbox" className="sr-only peer" checked={allowDelivery} onChange={(e) => setAllowDelivery(e.target.checked)} />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0099FF]"></div>
                                    </label>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-sm">Permitir que garçom faça lançamentos de pedidos de delivery</h3>
                                        <p className="text-sm text-gray-500 mt-1">Ao ativar esta opção, o garçom poderá criar pedidos de delivery. Para cada pedido, será necessário especificar o cliente, a forma de entrega e o método de pagamento.</p>
                                        <a href="#" className="text-[#0099FF] text-xs underline mt-1 inline-block">Mais detalhes</a>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <label className="relative inline-flex items-center cursor-pointer mt-1 flex-shrink-0">
                                        <input type="checkbox" className="sr-only peer" checked={allowEdit} onChange={(e) => setAllowEdit(e.target.checked)} />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0099FF]"></div>
                                    </label>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-sm">Permitir que Garçons editem pedidos</h3>
                                        <p className="text-sm text-gray-500 mt-1">Ao ativar, o garçom pode modificar pedidos já gerados.</p>
                                        <a href="#" className="text-[#0099FF] text-xs underline mt-1 inline-block">Mais detalhes</a>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <label className="relative inline-flex items-center cursor-pointer mt-1 flex-shrink-0">
                                        <input type="checkbox" className="sr-only peer" checked={allowEditCharges} onChange={(e) => setAllowEditCharges(e.target.checked)} />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0099FF]"></div>
                                    </label>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-sm">Permitir que Garçons editem cobranças adicionais</h3>
                                        <p className="text-sm text-gray-500 mt-1">Ao ativar, o garçom pode desativar a aplicação de cobranças adicionais como Consumação Mínima e Couvert ou entrada no momento da abertura ou fechamento de uma comanda.</p>
                                        <a href="#" className="text-[#0099FF] text-xs underline mt-1 inline-block">Ative cobranças adicionais nas configurações gerais de comanda</a>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <label className="relative inline-flex items-center cursor-pointer mt-1 flex-shrink-0">
                                        <input type="checkbox" className="sr-only peer" checked={allowCancel} onChange={(e) => setAllowCancel(e.target.checked)} />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0099FF]"></div>
                                    </label>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-sm">Permitir que garçons cancelem pedidos</h3>
                                        <p className="text-sm text-gray-500 mt-1">Quando ativado, garçons poderão Cancelar pedidos diretamente pelo app.</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <label className="relative inline-flex items-center cursor-pointer mt-1 flex-shrink-0">
                                        <input type="checkbox" className="sr-only peer" checked={showStatus} onChange={(e) => setShowStatus(e.target.checked)} />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0099FF]"></div>
                                    </label>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-sm">Permitir exibição de status de pedidos no mapa de mesas e comandas</h3>
                                        <p className="text-sm text-gray-500 mt-1">Ao ativar, o garçom poderá visualizar os status de pedidos como "Em preparo", "Pronto" e "Atrasado" no mapa de mesas e comandas.</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <label className="relative inline-flex items-center cursor-pointer mt-1 flex-shrink-0">
                                        <input type="checkbox" className="sr-only peer" checked={openWithoutOrder} onChange={(e) => setOpenWithoutOrder(e.target.checked)} />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0099FF]"></div>
                                    </label>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-sm">Permitir que garçons abram comandas sem pedido</h3>
                                        <p className="text-sm text-gray-500 mt-1">Ao ativar, o garçom poderá abrir comandas sem realizar pedidos imediatamente, permitindo a abertura na entrada do estabelecimento.</p>
                                    </div>
                                </div>

                                <div className="w-full h-px bg-gray-200 flex items-center gap-4">
                                    <span className="text-gray-400 text-xs bg-white px-2">Impressão</span>
                                </div>

                                <div className="flex gap-4">
                                    <label className="relative inline-flex items-center cursor-pointer mt-1 flex-shrink-0">
                                        <input type="checkbox" className="sr-only peer" checked={autoPrint} onChange={(e) => setAutoPrint(e.target.checked)} />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0099FF]"></div>
                                    </label>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-sm">Permitir impressão automática dos pedidos feitos pelo Garçom</h3>
                                        <p className="text-sm text-gray-500 mt-1">Ao ativar, o sistema imprime automaticamente cada pedido feito pelo garçom no aplicativo. Se desativado, o garçom deverá selecionar manualmente os itens para impressão após concluir o pedido.</p>
                                        <a href="#" className="text-[#0099FF] text-xs underline mt-1 inline-block">Mais detalhes</a>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <label className="relative inline-flex items-center cursor-pointer mt-1 flex-shrink-0">
                                        <input type="checkbox" className="sr-only peer" checked={autoPrintConference} onChange={(e) => setAutoPrintConference(e.target.checked)} />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0099FF]"></div>
                                    </label>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-sm">Permitir imprimir automaticamente conferência ao fechar mesa ou comanda</h3>
                                        <p className="text-sm text-gray-500 mt-1">Permitir que conferência de fechamento seja impressa de forma automática sempre que uma mesa ou comanda for encerrada no aplicativo.</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'fechamento' && (
                        <>
                            <h2 className="text-xl font-bold text-gray-800 mb-1">2. Fechamento de conta</h2>
                            <p className="text-sm text-gray-500 mb-8">Configure as opções de fechamento de conta do garçom no aplicativo</p>

                            <div className="space-y-8">
                                <div className="flex gap-4">
                                    <label className="relative inline-flex items-center cursor-pointer mt-1 flex-shrink-0">
                                        <input type="checkbox" className="sr-only peer" checked={allowCloseAccount} onChange={(e) => setAllowCloseAccount(e.target.checked)} />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0099FF]"></div>
                                    </label>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-sm">Permitir que Garçom feche a conta</h3>
                                        <p className="text-sm text-gray-500 mt-1">Ao ativar, o garçom pode finalizar e fechar as contas dos clientes diretamente pelo aplicativo, registrando os pagamentos.</p>
                                        <a href="#" className="text-[#0099FF] text-xs underline mt-1 inline-block">Mais detalhes</a>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <label className="relative inline-flex items-center cursor-pointer mt-1 flex-shrink-0">
                                        <input type="checkbox" className="sr-only peer" checked={allowDiscount} onChange={(e) => setAllowDiscount(e.target.checked)} />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0099FF]"></div>
                                    </label>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-sm">Permitir que Garçom aplique desconto</h3>
                                        <p className="text-sm text-gray-500 mt-1">Ao ativar, o garçom pode aplicar descontos nas contas dos clientes. Certifique-se de definir diretrizes claras e limites de desconto para evitar uso inadequado.</p>
                                        <a href="#" className="text-[#0099FF] text-xs underline mt-1 inline-block">Mais detalhes</a>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <label className="relative inline-flex items-center cursor-pointer mt-1 flex-shrink-0">
                                        <input type="checkbox" className="sr-only peer" checked={allowSurcharge} onChange={(e) => setAllowSurcharge(e.target.checked)} />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0099FF]"></div>
                                    </label>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-sm">Permitir que Garçom aplique acréscimo</h3>
                                        <p className="text-sm text-gray-500 mt-1">Ao ativar, o garçom pode aplicar acréscimos nas contas dos clientes. Certifique-se de definir diretrizes claras e limites de acréscimos para evitar uso inadequado.</p>
                                        <a href="#" className="text-[#0099FF] text-xs underline mt-1 inline-block">Mais detalhes</a>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'atendimento' && (
                        <>
                            <h2 className="text-xl font-bold text-gray-800 mb-1">3. Atendimento</h2>
                            <p className="text-sm text-gray-500 mb-8">Configure as opções de atendimento do aplicativo</p>

                            <div className="space-y-8">
                                <div className="flex gap-4">
                                    <label className="relative inline-flex items-center cursor-pointer mt-1 flex-shrink-0">
                                        <input type="checkbox" className="sr-only peer" checked={informPeople} onChange={(e) => setInformPeople(e.target.checked)} />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0099FF]"></div>
                                    </label>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-sm">Permitir que o garçom informe quantas pessoas vão sentar à mesa ou dividir uma comanda</h3>
                                        <p className="text-sm text-gray-500 mt-1">Ativando essa opção, sempre que o garçom abrir uma mesa ou comanda livre, receberá a pergunta e poderá preencher a quantidade de pessoas no App Garçom e no seu Gerenciador de pedidos. Essa quantidade é exibida no fechamento de conta para auxiliar a divisão do valor.</p>
                                        <a href="#" className="text-[#0099FF] text-xs underline mt-1 inline-block">Mais detalhes</a>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <label className="relative inline-flex items-center cursor-pointer mt-1 flex-shrink-0">
                                        <input type="checkbox" className="sr-only peer" checked={transferTables} onChange={(e) => setTransferTables(e.target.checked)} />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0099FF]"></div>
                                    </label>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-sm">Permitir que Garçom transfira mesas e comandas</h3>
                                        <p className="text-sm text-gray-500 mt-1">Ao ativar, o garçom poderá realizar a transferência de pedidos entre mesas e comandas. Caso a configuração esteja inativa, a transferência seguirá ativa via Pedidos Mesa em seu gerenciador de pedidos, porém, a funcionalidade ficará oculta no App do Garçom.</p>
                                        <a href="#" className="text-[#0099FF] text-xs underline mt-1 inline-block">Mais detalhes</a>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <label className="relative inline-flex items-center cursor-pointer mt-1 flex-shrink-0">
                                        <input type="checkbox" className="sr-only peer" checked={transferOrders} onChange={(e) => setTransferOrders(e.target.checked)} />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0099FF]"></div>
                                    </label>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-sm">Permitir que Garçom transfira pedidos e pagamentos para mesas ou comandas ocupadas</h3>
                                        <p className="text-sm text-gray-500 mt-1">Ao ativar, o garçom pode transferir pedidos e pagamentos de uma mesa para outra, mesmo que a mesa de destino já esteja ocupada. O mesmo vale para comandas</p>
                                        <a href="#" className="text-[#0099FF] text-xs underline mt-1 inline-block">Mais detalhes</a>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <label className="relative inline-flex items-center cursor-pointer mt-1 flex-shrink-0">
                                        <input type="checkbox" className="sr-only peer" checked={clientCall} onChange={(e) => setClientCall(e.target.checked)} />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0099FF]"></div>
                                    </label>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-sm">Permitir que Cliente chame Garçom na mesa</h3>
                                        <p className="text-sm text-gray-500 mt-1">Ao ativar, o cliente pode solicitar a presença do garçom em sua mesa através de um botão no Cardápio Digital, acessível pelo QR Code da mesa. Notificações serão enviadas ao aplicativo do garçom e ao painel de pedidos sempre que um cliente fizer a chamada.</p>
                                        <a href="#" className="text-[#0099FF] text-xs underline mt-1 inline-block">Mais detalhes</a>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <label className="relative inline-flex items-center cursor-pointer mt-1 flex-shrink-0">
                                        <input type="checkbox" className="sr-only peer" checked={showIdleTables} onChange={(e) => setShowIdleTables(e.target.checked)} />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0099FF]"></div>
                                    </label>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-sm">Permitir exibição de mesas ociosas</h3>
                                        <p className="text-sm text-gray-500 mt-1">Ao ativar, será exibido um alerta no mapa de mesas para indicar mesas sem pedidos há um tempo.</p>
                                    </div>
                                </div>

                                {showIdleTables && (
                                    <div className="pl-14">
                                        <h3 className="font-bold text-gray-800 text-sm mb-2">Definir tempo de ociosidade</h3>
                                        <p className="text-sm text-gray-600 mb-3">Determine o tempo (em minutos) sem pedidos para que uma mesa seja considerada ociosa.</p>
                                        <div className="inline-flex items-center border border-gray-300 rounded overflow-hidden">
                                            <button
                                                onClick={() => handleIdleTimeChange(-1)}
                                                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 border-r border-gray-300"
                                            >
                                                <Minus size={14} />
                                            </button>
                                            <div className="px-6 py-2 bg-white text-gray-800 text-sm font-medium w-16 text-center">
                                                {idleTime}
                                            </div>
                                            <button
                                                onClick={() => handleIdleTimeChange(1)}
                                                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 border-l border-gray-300"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                </div>
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

export default AppSettings;
