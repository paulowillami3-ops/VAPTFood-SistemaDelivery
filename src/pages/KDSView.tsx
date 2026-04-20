
import { Monitor, Maximize, ChevronDown, Search, Check, Clock, Utensils, RotateCcw } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useEstablishment } from '../contexts/EstablishmentContext';
import { differenceInMinutes } from 'date-fns';

interface KDSScreen {
    id: number;
    name: string;
    categories: string[];
}

interface OrderItem {
    id: number;
    menu_item_id: number;
    name: string;
    quantity: number;
    notes?: string;
    status: string;
    addons?: any[]; // Simplified for now
    menu_item?: {
        category_id: number;
        image_url?: string;
    }
}

interface Order {
    id: number;
    table_id?: number;// or string
    table_name?: string; // we might join this
    customer_name?: string;
    status: string;
    created_at: string;
    items: OrderItem[];
    type: string;
}

const KDSView = () => {
    const { establishment } = useEstablishment();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const screenId = searchParams.get('screen_id');

    const [screens, setScreens] = useState<KDSScreen[]>([]);
    const [currentScreen, setCurrentScreen] = useState<KDSScreen | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // New State for View Mode
    const [viewMode, setViewMode] = useState<'production' | 'ready'>('production');

    // Initial Fetch of Screens
    useEffect(() => {
        if (establishment?.id) {
            fetchScreens();
        }

        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [establishment?.id]);

    // Set Current Screen
    useEffect(() => {
        if (screens.length > 0) {
            if (screenId) {
                const found = screens.find(s => s.id === Number(screenId));
                setCurrentScreen(found || screens[0]);
            } else {
                setCurrentScreen(screens[0]);
            }
        }
    }, [screens, screenId]);

    // Fetch Orders and setup real-time subscription (data update only)
    useEffect(() => {
        if (!establishment?.id || !currentScreen) return;

        // Perform initial fetch
        fetchOrders();

        const channel = supabase
            .channel(`orders_kds_data_${establishment.id}_${currentScreen.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                    filter: `establishment_id=eq.${establishment.id}`
                },
                (payload: any) => {
                    console.log('KDS data real-time update:', payload.eventType, payload.new?.id);
                    fetchOrders();
                }
            )
            .subscribe();

        // Setup polling fallback
        const interval = setInterval(fetchOrders, 30000);

        return () => {
            clearInterval(interval);
            supabase.removeChannel(channel);
        };
    }, [currentScreen?.id, viewMode, establishment?.id]);

    const fetchScreens = async () => {
        if (!establishment?.id) return;
        try {
            const { data, error } = await supabase
                .from('kds_screens')
                .select('*')
                .eq('establishment_id', establishment.id)
                .order('name');

            if (error) throw error;
            setScreens(data || []);
        } catch (error) {
            console.error('Error fetching screens:', error);
        }
    };

    const fetchOrders = async () => {
        if (!currentScreen || !establishment?.id) return;
        setLoading(true);
        try {
            // Determine status filter based on viewMode
            const statusFilter = viewMode === 'production'
                ? ['PENDING', 'PREPARING']
                : ['READY'];

            // 1. Fetch Orders
            let query = supabase
                .from('orders')
                .select('*')
                .eq('establishment_id', establishment.id)
                .in('status', statusFilter)
                .order('created_at', { ascending: viewMode === 'production' });

            // Limit 'READY' orders to avoid fetching full history
            if (viewMode === 'ready') {
                query = query.limit(50);
            }

            const { data: ordersData, error: ordersError } = await query;

            if (ordersError) throw ordersError;

            // 2. Extract all product IDs from the JSONB items to fetch category info
            const allProductIds = new Set<number>();
            ordersData?.forEach((order: any) => {
                if (Array.isArray(order.items)) {
                    order.items.forEach((item: any) => {
                        if (item.id) allProductIds.add(item.id);
                    });
                }
            });

            // 3. Fetch Product Details (category_id, image_url)
            let productsMap: Record<number, any> = {};
            if (allProductIds.size > 0) {
                const { data: productsData, error: productsError } = await supabase
                    .from('products')
                    .select('id, category_id, image_url')
                    .in('id', Array.from(allProductIds));

                if (productsError) console.error('Error fetching product details:', productsError);

                productsData?.forEach((p: any) => {
                    productsMap[p.id] = p;
                });
            }

            // 4. Enrich Orders with Product Details
            const enrichedOrders = ordersData?.map((order: any) => ({
                ...order,
                items: Array.isArray(order.items) ? order.items.map((item: any) => ({
                    ...item,
                    // Map stored ID to menu_item_id or similar if needed by interface,
                    // but mainly attach the product info for filtering/display
                    menu_item_id: item.id,
                    menu_item: productsMap[item.id] || {}
                })) : []
            })) || [];

            // 5. Filter Orders based on Category Link
            const screenCategoryIds = currentScreen.categories?.map(String) || [];

            const filteredOrders = enrichedOrders.map((order: any) => {
                const relevantItems = order.items.filter((item: any) => {
                    const catId = String(item.menu_item?.category_id);
                    // Filter logic: if screen has categories, item must match one.
                    if (screenCategoryIds.length === 0) return true;
                    return screenCategoryIds.includes(catId);
                });

                if (relevantItems.length === 0) return null;

                return {
                    ...order,
                    items: relevantItems
                };
            }).filter(Boolean) as Order[];

            setOrders(filteredOrders);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleScreenSelect = (screen: KDSScreen) => {
        setCurrentScreen(screen);
        setIsDropdownOpen(false);
        const urlSlug = window.location.pathname.split('/')[1];
        navigate(`/${establishment.slug || urlSlug || 'noia-burguer'}/admin/kds/view?screen_id=${screen.id}`);
    };

    const handleUpdateStatus = async (orderId: number, newStatus: string) => {
        try {
            await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
            // Optimistic update
            setOrders(prev => prev.filter(o => o.id !== orderId));
        } catch (error) {
            console.error('Error updating order status:', error);
        }
    };

    const filteredScreens = screens.filter(screen =>
        screen.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <div className="p-6">
                <header className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Cozinha (KDS)</h1>
                    <nav className="flex items-center text-sm text-gray-500">
                        <span className="hover:text-blue-500 cursor-pointer" onClick={() => {
                            const urlSlug = window.location.pathname.split('/')[1];
                            navigate(`/${establishment.slug || urlSlug || 'noia-burguer'}/admin/orders`);
                        }}>Início</span>
                        <span className="mx-2">›</span>
                        <span className="hover:text-blue-500 cursor-pointer" onClick={() => {
                            const urlSlug = window.location.pathname.split('/')[1];
                            navigate(`/${establishment.slug || urlSlug || 'noia-burguer'}/admin/kds`);
                        }}>Cozinha (KDS)</span>
                        <span className="mx-2">›</span>
                        <span className="text-gray-700 font-medium">
                            Visualizar pedidos ({currentScreen?.name || '...'})
                        </span>
                    </nav>
                </header>

                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                    {/* Screen Selector Dropdown */}
                    <div className="relative w-full md:w-64" ref={dropdownRef}>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 flex items-center justify-between cursor-pointer hover:border-blue-500 transition-colors shadow-sm text-left"
                        >
                            <span className="text-gray-700 font-medium truncate">
                                {currentScreen?.name || 'Selecione uma tela'}
                            </span>
                            <ChevronDown size={20} className="text-gray-400" />
                        </button>

                        {/* Dropdown Menu */}
                        {isDropdownOpen && (
                            <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                                <div className="p-2 border-b border-gray-100">
                                    <div className="relative">
                                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Pesquisar"
                                            className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-blue-500"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                <div className="max-h-60 overflow-y-auto">
                                    {filteredScreens.map((screen) => (
                                        <div
                                            key={screen.id}
                                            onClick={() => handleScreenSelect(screen)}
                                            className={`px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between hover:bg-gray-50 ${currentScreen?.id === screen.id ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'}`}
                                        >
                                            {screen.name}
                                            {currentScreen?.id === screen.id && <Check size={16} className="text-blue-600" />}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                        <button onClick={() => {
                            const urlSlug = window.location.pathname.split('/')[1];
                            navigate(`/${establishment.slug || urlSlug || 'noia-burguer'}/admin/kds`);
                        }} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 transition-colors font-medium flex-1 md:flex-none">
                            <Monitor size={18} />
                            <span>Mapa de telas KDS</span>
                        </button>
                        <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0099FF] text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex-1 md:flex-none">
                            <Maximize size={18} />
                            <span>Tela inteira</span>
                        </button>
                    </div>
                </div>

                {/* Tabs for Production / Ready */}
                <div className="flex gap-4 mb-6 border-b border-gray-200">
                    <button
                        onClick={() => setViewMode('production')}
                        className={`pb-2 px-4 font-bold text-sm transition-colors border-b-2 ${viewMode === 'production' ? 'border-[#0099FF] text-[#0099FF]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Em Produção
                    </button>
                    <button
                        onClick={() => setViewMode('ready')}
                        className={`pb-2 px-4 font-bold text-sm transition-colors border-b-2 ${viewMode === 'ready' ? 'border-[#2ECC40] text-[#2ECC40]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Prontos
                    </button>
                </div>

                {/* Orders Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-20">
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center max-w-md w-full mx-4">
                            <h2 className="text-xl font-bold text-gray-800 mb-1">
                                {viewMode === 'production' ? 'Nenhum pedido em produção.' : 'Nenhum pedido pronto recentemente.'}
                            </h2>
                            <p className="text-gray-500">
                                {viewMode === 'production' ? 'Já já eles chegam =]' : 'Bora trabalhar!'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-x-auto pb-4">
                        {orders.map(order => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                viewMode={viewMode}
                                onAction={(action) => handleUpdateStatus(order.id, action)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// Sub-component: OrderCard
const OrderCard = ({ order, viewMode, onAction }: { order: Order; viewMode: 'production' | 'ready'; onAction: (action: string) => void }) => {
    // Calculate timer
    const [minutes, setMinutes] = useState(0);

    useEffect(() => {
        const updateTimer = () => {
            setMinutes(differenceInMinutes(new Date(), new Date(order.created_at)));
        };
        updateTimer();
        const interval = setInterval(updateTimer, 60000); // 1 min update
        return () => clearInterval(interval);
    }, [order.created_at]);

    // Format ID with #
    const displayId = `#${order.id}`;

    // Table Name logic
    const headerTitle = order.type === 'DINE_IN' ? `Mesa: Mesa ${order.table_id}` : (order.customer_name || 'Delivery');

    return (
        <div className={`bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col min-w-[300px] ${viewMode === 'ready' ? 'border-green-200' : 'border-gray-200'}`}>
            {/* Header */}
            <div className={`p-3 flex items-start justify-between ${viewMode === 'ready' ? 'bg-green-50' : ''}`}>
                <div className="flex items-center gap-2">
                    <Utensils size={20} className="text-gray-400" />
                    <div>
                        <span className="block font-bold text-gray-800 text-lg">Pedido</span>
                        <span className="block font-bold text-gray-800 text-lg">{displayId}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {viewMode === 'production' ? (
                        <button
                            onClick={() => onAction('READY')}
                            className="bg-[#2ECC40] hover:bg-green-600 text-white text-xs font-bold px-3 py-2 rounded uppercase text-center leading-tight transition-colors"
                        >
                            Finalizar<br />Todos
                        </button>
                    ) : (
                        <button
                            onClick={() => onAction('PREPARING')}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-600 text-xs font-bold px-3 py-2 rounded uppercase text-center leading-tight transition-colors flex items-center gap-1"
                        >
                            <RotateCcw size={14} /> Voltar
                        </button>
                    )}

                    <div className={`${viewMode === 'ready' ? 'bg-green-500' : 'bg-gray-400'} text-white px-2 py-2 rounded flex items-center gap-1 font-bold`}>
                        <Clock size={16} />
                        <span>{minutes}</span>
                    </div>
                </div>
            </div>

            {/* Subheader / Table Info */}
            <div className="px-3 pb-2 border-b border-gray-100 mb-2 pt-2">
                <span className="font-bold text-gray-700">{headerTitle}</span>
            </div>

            {/* Items List */}
            <div className="p-3 pt-0 flex-1 overflow-y-auto max-h-[300px]">
                {order.items.map((item, idx) => (
                    <div key={`${order.id}-${idx}`} className="mb-4 last:mb-0">
                        <div className="flex items-start gap-3">
                            {item.menu_item?.image_url ? (
                                <img src={item.menu_item.image_url} alt="" className="w-10 h-10 rounded object-cover border border-gray-100" />
                            ) : (
                                <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-400 font-bold">
                                    IMG
                                </div>
                            )}

                            <div className="flex-1">
                                <div className="text-gray-700 font-medium leading-tight mb-1">
                                    <span className="font-bold mr-1">{item.quantity}x</span>
                                    {item.name}
                                </div>

                                {/* Notes/Addons */}
                                {item.notes && (
                                    <div className="text-xs text-red-500 font-medium mt-1">
                                        Obs: {item.notes}
                                    </div>
                                )}

                                <div className="text-xs text-gray-500 mt-1 pl-1">
                                    {item.addons && Array.isArray(item.addons) && item.addons.map((addon: any, aIdx: number) => (
                                        <div key={aIdx} className="pl-2 text-gray-500">- {addon.item?.name || addon.name || 'Adicional'}</div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-gray-50 p-2 text-xs text-gray-400 text-center">
                {viewMode === 'production' ? 'Em produção' : 'Pronto para entrega'}
            </div>
        </div>
    );
};

export default KDSView;
