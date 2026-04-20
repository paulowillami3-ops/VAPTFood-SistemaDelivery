import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search, Rocket, Menu, X, Bike, ShoppingBag } from 'lucide-react';
import WaiterSidebar from '../../components/WaiterSidebar';
import { supabase } from '../../lib/supabase';
import WaiterTableOptions from '../../components/WaiterTableOptions';
import { toast } from 'react-hot-toast';
import { useEstablishment } from '../../contexts/EstablishmentContext';

const WaiterHome = () => {
    const navigate = useNavigate();
    const { slug } = useParams();
    const { establishment } = useEstablishment();
    const [activeTab, setActiveTab] = useState<'mesas' | 'comandas'>('mesas');
    const [showWelcome, setShowWelcome] = useState(() => {
        const today = new Date().toISOString().split('T')[0];
        const welcomeKey = `waiter_welcome_shown_${today}`;
        return !localStorage.getItem(welcomeKey);
    });
    const [waiterName, setWaiterName] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Data states
    const [tables, setTables] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [establishmentId, setEstablishmentId] = useState<number | null>(null);

    // Modal State
    const [selectedTable, setSelectedTable] = useState<any>(null);
    const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);

    useEffect(() => {
        // Load name from session (guaranteed by Route Guard for this specific slug)
        const session = localStorage.getItem(`waiter_session_${slug}`);
        if (session) {
            const data = JSON.parse(session);
            setWaiterName(data.name || 'Garçom');
            if (data.establishment_id) {
                setEstablishmentId(data.establishment_id);
            }
        }

        // Welcome check moved to useState lazy init

        // Load preferences
        const prefs = localStorage.getItem('waiter_preferences');
        if (prefs) {
            const { startScreen } = JSON.parse(prefs);
            if (startScreen && (startScreen === 'mesas' || startScreen === 'comandas')) {
                setActiveTab(startScreen);
            }
        }
    }, [navigate]);

    const handleCloseWelcome = () => {
        const today = new Date().toISOString().split('T')[0];
        const welcomeKey = `waiter_welcome_shown_${today}`;
        localStorage.setItem(welcomeKey, 'true');
        setShowWelcome(false);
    };

    // Fetch data when tab or establishment changes
    useEffect(() => {
        if (establishmentId) {
            fetchData();
        }
    }, [activeTab, establishmentId]);

    const fetchData = async () => {
        if (!establishmentId) return;
        setLoading(true);
        try {
            const tableName = activeTab === 'comandas' ? 'restaurant_comandas' : 'restaurant_tables';

            // 1. Fetch tables/comandas
            const { data: itemsData, error: itemsError } = await supabase
                .from(tableName)
                .select('*')
                .eq('establishment_id', establishmentId)
                .order('name'); // Or order by ID if preferred

            if (itemsError) throw itemsError;

            // 2. Fetch open orders for these tables
            const { data: ordersData, error: ordersError } = await supabase
                .from('orders')
                .select('id, table_id, total_amount, status, payment_methods')
                .eq('establishment_id', establishmentId)
                .eq('type', 'DINE_IN')
                .in('status', ['PENDING', 'PREPARING', 'READY', 'DELIVERED'])
                .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

            if (ordersError) throw ordersError;

            // 3. Map orders to tables
            let finalItems = itemsData || [];

            if (activeTab === 'mesas' && ordersData) {
                const ordersByTable = ordersData.reduce((acc: any, order: any) => {
                    if (order.table_id) {
                        if (!acc[order.table_id]) {
                            acc[order.table_id] = { count: 0, total: 0, paid: 0 };
                        }
                        acc[order.table_id].count += 1;
                        acc[order.table_id].total += (order.total_amount || 0);

                        // Calculate paid amount
                        let methods = order.payment_methods;
                        if (typeof methods === 'string') {
                            try { methods = JSON.parse(methods); } catch (e) { methods = []; }
                        }
                        if (Array.isArray(methods)) {
                            const orderPaid = methods.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
                            acc[order.table_id].paid += orderPaid;
                        }
                    }
                    return acc;
                }, {});

                finalItems = finalItems.map(item => {
                    const stats = ordersByTable[item.id] || { count: 0, total: 0, paid: 0 };

                    // Determine Status
                    let status = 'Livre'; // Default Green

                    if (stats.count > 0) {
                        if (stats.paid > 0) {
                            status = 'Closing'; // Yellow (Em pagamento)
                        } else {
                            status = 'Occupied'; // Red (Ocupada)
                        }
                    }

                    return {
                        ...item,
                        orderCount: stats.count,
                        orderTotal: stats.total,
                        paidTotal: stats.paid, // Make sure to pass this
                        status: status
                    };
                });
            } else {
                // For comandas, simplicity for now (or implement logic if needed)
                // Just mapping default status
                finalItems = finalItems.map(item => ({ ...item, status: 'Livre', orderTotal: 0, paidTotal: 0, orderCount: 0 }));
            }

            // Optional: numeric sort
            const sorted = finalItems.sort((a, b) => {
                if (a.table_number && b.table_number) {
                    return a.table_number - b.table_number;
                }
                const numA = parseInt(a.name.replace(/\D/g, '')) || 0;
                const numB = parseInt(b.name.replace(/\D/g, '')) || 0;
                return numA - numB || a.name.localeCompare(b.name);
            });

            setTables(sorted);
        } catch (error) {
            console.error('Error fetching waiter data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Occupied': return 'bg-red-500 hover:bg-red-600'; // Ocupada - Vermelho
            case 'Closing': return 'bg-yellow-400 hover:bg-yellow-500'; // Em pagamento - Amarelo
            case 'Livre':
            default: return 'bg-green-600 hover:bg-green-700'; // Livre - Verde
        }
    };

    const handleTableClick = (table: any) => {
        if (table.status === 'Livre') {
            // New order directly
            navigate(`/${slug}/garcom/mesa/${table.id}`);
        } else {
            // Open Options Modal
            setSelectedTable(table);
            setIsOptionsModalOpen(true);
        }
    };

    const handleOptionAction = (action: 'view-orders' | 'print-conference' | 'close-account' | 'new-order') => {
        if (!selectedTable) return;

        switch (action) {
            case 'new-order':
                navigate(`/${slug}/garcom/mesa/${selectedTable.id}`);
                setIsOptionsModalOpen(false);
                break;
            case 'view-orders':
                // Navigate to details page
                navigate(`/${slug}/garcom/mesa/${selectedTable.id}/detalhes`);
                setIsOptionsModalOpen(false);
                break;
            case 'print-conference':
                toast.success('Solicitação de impressão enviada!');
                // Implement actual print logic later
                break;
            case 'close-account':
                // Logic to close account or mark as closing
                navigate(`/${slug}/garcom/mesa/${selectedTable.id}/fechar`);
                setIsOptionsModalOpen(false);
                break;
        }
    };

    // Quick Order Modal
    const [isQuickOrderModalOpen, setIsQuickOrderModalOpen] = useState(false);

    // ... (existing helper functions)

    const handleQuickOrder = (mode: 'DELIVERY' | 'PICKUP') => {
        setIsQuickOrderModalOpen(false);
        navigate(`/${slug}/garcom/pedido/delivery`, { state: { initialMode: mode } });
    };

    if (showWelcome) {
        // ... (existing welcome modal)
        return (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg w-full max-w-lg overflow-hidden animate-scale-in">
                    <div className="flex justify-end p-2">
                        <button onClick={handleCloseWelcome} className="text-gray-400 hover:text-gray-600">

                            <X size={24} />
                        </button>
                    </div>
                    <div className="flex flex-col items-center px-8 pb-8 text-center">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Bem-vindo</h2>

                        <div className="relative mb-4">
                            {/* Confetti decoration would go here, using a static image or CSS shapes */}
                            <div className="w-24 h-24 bg-[#003152] rounded-lg rotate-45 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg z-10 relative">
                                <div className="text-white -rotate-45 font-bold text-3xl">G</div>
                            </div>
                            {/* Confetti particles mocked with characters for now */}
                            <div className="absolute top-0 left-0 text-red-500 text-xs animate-bounce" style={{ animationDelay: '0.1s' }}>★</div>
                            <div className="absolute top-0 right-0 text-blue-500 text-xs animate-bounce" style={{ animationDelay: '0.2s' }}>●</div>
                            <div className="absolute bottom-0 left-10 text-green-500 text-xs animate-bounce" style={{ animationDelay: '0.3s' }}>▲</div>
                        </div>

                        <h3 className="text-lg font-bold text-gray-700 mb-1">Selo Bem-vindo</h3>
                        <p className="text-gray-500 text-sm mb-6">{waiterName} entrou no app</p>

                        <p className="text-xs text-gray-400 mb-6 max-w-xs">
                            Dica: Você também pode lançar pedidos para uma comanda, ative a funcionalidade.
                        </p>

                        <button
                            onClick={handleCloseWelcome}
                            className="w-full bg-[#0099FF] text-white font-bold py-3 rounded-md hover:bg-blue-600 transition-colors"
                        >
                            Começar agora
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#003152] text-white font-sans flex flex-col">
            <WaiterSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                waiterName={waiterName}
                establishmentName={establishment?.name}
            />

            {/* Header */}
            <div className="bg-[#00223A] border-b border-white/10 p-4 flex justify-between items-center shadow-md">
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsSidebarOpen(true)} className="text-[#FFA500]">
                        <Menu size={24} />
                    </button>
                    <span className="font-medium text-sm text-gray-300">Mapa de mesas e comandas</span>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-[#003152]">
                <button
                    onClick={() => setActiveTab('mesas')}
                    className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors ${activeTab === 'mesas' ? 'border-[#0099FF] bg-[#0099FF] text-white' : 'border-transparent bg-[#00223A] text-gray-400'}`}
                >
                    Mesas
                </button>
                <button
                    onClick={() => setActiveTab('comandas')}
                    className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors ${activeTab === 'comandas' ? 'border-[#0099FF] bg-[#0099FF] text-white' : 'border-transparent bg-[#00223A] text-gray-400'}`}
                >
                    Comandas
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 bg-[#003152]">
                {/* Search Bar */}
                <div className="bg-white rounded-md flex items-center px-4 py-3 mb-4 shadow-sm">
                    <Search className="text-gray-400 mr-2" size={18} />
                    <input
                        type="text"
                        placeholder={activeTab === 'mesas' ? "Buscar por nome da mesa" : "Buscar por comanda"}
                        className="flex-1 bg-transparent outline-none text-gray-700 text-sm placeholder-gray-400"
                    />
                </div>

                {/* Filter Status (Legend) */}
                <div className="flex gap-4 mb-6 text-xs overflow-x-auto pb-2">
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                        <span className="text-gray-300">Livres</span>
                    </div>
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                        <span className="text-gray-300">Ocupadas</span>
                    </div>
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                        <span className="text-gray-300">Em pagamento</span>
                    </div>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="text-center text-gray-400 py-10">Carregando {activeTab}...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tables.map(item => (
                            <div
                                key={item.id}
                                onClick={() => handleTableClick(item)}
                                className={`${getStatusColor(item.status)} border border-white/10 rounded-md p-4 h-32 transition-colors cursor-pointer relative overflow-hidden group`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="font-bold text-lg text-white mb-1 shadow-black drop-shadow-md">{item.name}</div>

                                    {/* Optional: Show status badge */}
                                    {item.status === 'Closing' && (
                                        <div className="bg-white/20 px-2 py-0.5 rounded text-xs font-medium text-white shadow-sm backdrop-blur-sm">
                                            $
                                        </div>
                                    )}
                                </div>

                                <div className="mt-2 text-xs text-white/90 font-medium">
                                    {item.status === 'Livre' ? 'Disponível' :
                                        item.status === 'Occupied' ? 'Ocupada' : 'Fechando conta'}
                                </div>

                                {item.status !== 'Livre' && (
                                    <div className="mt-4 flex justify-between items-end border-t border-white/20 pt-2">
                                        <div className="text-xs text-white/80">
                                            {item.paidTotal > 0 ? (
                                                <span className="text-white font-bold">Parcial: R$ {item.paidTotal.toFixed(2)}</span>
                                            ) : (
                                                <span>Total: R$ {item.orderTotal.toFixed(2)}</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && tables.length === 0 && (
                    <div className="text-center text-gray-400 py-10">
                        Nenhuma {activeTab === 'mesas' ? 'mesa' : 'comanda'} encontrada.
                    </div>
                )}
            </div>

            {/* Footer Action */}
            <div className="p-4 bg-[#00223A] border-t border-white/10 sticky bottom-0">
                <button
                    onClick={() => setIsQuickOrderModalOpen(true)}
                    className="w-full border border-[#0099FF] text-[#0099FF] rounded-md py-3 font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#0099FF]/10 transition-colors"
                >
                    <Rocket size={18} />
                    Delivery/Para Levar
                </button>
            </div>

            {/* Options Modal */}
            <WaiterTableOptions
                isOpen={isOptionsModalOpen}
                onClose={() => setIsOptionsModalOpen(false)}
                table={selectedTable}
                onAction={handleOptionAction}
            />

            {/* Quick Order Modal */}
            {isQuickOrderModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-lg rounded-t-2xl p-6 animate-in slide-in-from-bottom duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg text-gray-800">Pedido Rápido</h3>
                            <button onClick={() => setIsQuickOrderModalOpen(false)} className="text-gray-400">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <button
                                onClick={() => handleQuickOrder('DELIVERY')}
                                className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 shadow-sm transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#0099FF]">
                                        <Bike size={20} />
                                    </div>
                                    <span className="font-bold text-gray-700">Delivery</span>
                                </div>
                                <div className="text-gray-400">›</div>
                            </button>

                            <button
                                onClick={() => handleQuickOrder('PICKUP')}
                                className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 shadow-sm transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                                        <ShoppingBag size={20} />
                                    </div>
                                    <span className="font-bold text-gray-700">Para Levar</span>
                                </div>
                                <div className="text-gray-400">›</div>
                            </button>
                        </div>
                        <div className="mt-8"></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WaiterHome;
