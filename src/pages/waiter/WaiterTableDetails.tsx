import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, PlusCircle, DollarSign, CheckSquare, Square, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

const WaiterTableDetails = () => {
    const { slug, id: tableId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [tableName, setTableName] = useState('');
    // const [establishmentId, setEstablishmentId] = useState<number | null>(null); // Unused
    const [orders, setOrders] = useState<any[]>([]);

    // Derived totals
    // const [totalAmount, setTotalAmount] = useState(0); // Unused for now

    // Local state for "delivered" checkboxes
    const [deliveredOrders, setDeliveredOrders] = useState<Record<string, boolean>>({});

    const fetchTableDetails = useCallback(async () => {
        if (!tableId) return;
        try {
            // 1. Get Table Table & Establishment
            const { data: tableData, error: tableError } = await supabase
                .from('restaurant_tables')
                .select('id, name, establishment_id, table_number')
                .eq('id', tableId)
                .single();

            if (tableError) throw tableError;
            setTableName(tableData.name);
            // setEstablishmentId(tableData.establishment_id);

            // 2. Fetch Active Orders (Last 12 hours to avoid stale data from previous sessions)
            const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();

            const { data: ordersData, error: ordersError } = await supabase
                .from('orders')
                .select('*')
                .eq('table_id', tableId)
                .eq('establishment_id', tableData.establishment_id)
                .in('status', ['PENDING', 'PREPARING', 'READY', 'DELIVERED'])
                .gte('created_at', twelveHoursAgo)
                .order('created_at', { ascending: false }); // Newest first

            if (ordersError) throw ordersError;

            const activeOrders = ordersData || [];
            setOrders(activeOrders);

            // Init delivered state (always unchecked/empty as requested)
            const initialDelivered: Record<string, boolean> = {};
            setDeliveredOrders(initialDelivered);

        } catch (error) {
            console.error('Error details:', error);
            // toast.error('Erro ao carregar detalhes.'); // Silencing to avoid spam on realtime updates
        } finally {
            setLoading(false);
        }
    }, [tableId]);

    useEffect(() => {
        if (!tableId) return;

        fetchTableDetails();

        const channel = supabase
            .channel(`table_details_${tableId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                    filter: `table_id=eq.${tableId}`
                },
                () => {
                    fetchTableDetails();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [tableId, fetchTableDetails]);

    const handleToggleDelivered = async (orderId: string) => { // Removed unused currentStatus
        const isDelivered = deliveredOrders[orderId];
        const newStatus = !isDelivered;

        setDeliveredOrders(prev => ({ ...prev, [orderId]: newStatus }));

        if (newStatus) {
            try {
                await supabase
                    .from('orders')
                    .update({ status: 'DELIVERED' })
                    .eq('id', orderId);
                toast.success('Pedido marcado como entregue');
            } catch (e) {
                console.error(e);
            }
        }
    };

    const handlePrint = () => {
        toast.success(`Imprimindo detalhes de ${tableName}...`);
    };

    const handleNewOrder = () => {
        navigate(`/${slug}/garcom/mesa/${tableId}`);
    };

    const handleCloseAccount = () => {
        navigate(`/${slug}/garcom/mesa/${tableId}/fechar`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#003152] flex flex-col items-center justify-center text-white p-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4 flex items-center justify-center">
                    <Loader2 size={24} className="text-blue-500" />
                </div>
                <div className="bg-white p-8 rounded-lg shadow-xl flex flex-col items-center animate-pulse">
                    <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-500 animate-spin mb-4 flex items-center justify-center bg-gray-50">
                        <Loader2 className="text-blue-500 animate-none" size={24} style={{ animation: 'none' }} />
                    </div>
                    <span className="text-gray-800 font-bold">Carregando detalhes da mesa...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#003152] flex flex-col font-sans">
            {/* Header */}
            <div className="bg-[#00223A] border-b border-white/10 p-4 flex justify-between items-center shadow-md sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(`/${slug}/garcom/app`)} className="text-white">
                        <ArrowLeft size={24} />
                    </button>
                    <span className="font-bold text-lg text-white">{tableName}</span>
                </div>
                <div>
                    {/* User Icon placeholder */}
                    <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-xs font-bold">G</div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
                {orders.map((order) => {
                    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                    const isDelivered = deliveredOrders[order.id];

                    return (
                        <div key={order.id} className="bg-[#00223A] rounded-md overflow-hidden border border-white/5">
                            {/* Order Header */}
                            <div className="bg-[#001828] p-3 flex justify-between items-center border-b border-white/5">
                                <span className="font-bold text-white">Pedido #{order.order_number || order.id}</span>
                            </div>

                            {/* Items */}
                            <div className="p-3 space-y-3">
                                {items.map((item: any, idx: number) => (
                                    <div key={idx}>
                                        <div className="flex justify-between text-sm text-gray-200">
                                            <span>
                                                <span className="font-bold">{item.quantity}x</span> {item.name}
                                            </span>
                                            <span>{Number(item.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                        </div>
                                        {/* Addons */}
                                        {item.addons && item.addons.length > 0 && (
                                            <div className="pl-4 mt-1 space-y-1 text-xs text-gray-400">
                                                {item.addons.map((addon: any, aIdx: number) => (
                                                    <div key={aIdx} className="flex justify-between">
                                                        <span>
                                                            <span className="text-gray-500">Turbine seu lanche</span><br />
                                                            <span className="ml-2">{addon.quantity}x {addon.name}</span>
                                                        </span>
                                                        <span>{Number(addon.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Footer / Subtotal */}
                            <div className="p-3 bg-[#001828]/50 border-t border-white/5 flex flex-col gap-2">
                                <div className="flex justify-between items-center font-bold text-white">
                                    <span>Subtotal</span>
                                    <span>{Number(order.total_amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                </div>
                                <div className="flex justify-end pt-2">
                                    <button
                                        onClick={() => handleToggleDelivered(order.id)}
                                        className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                    >
                                        {isDelivered ? <CheckSquare size={18} /> : <Square size={18} />}
                                        Marcar como entregue
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {orders.length === 0 && (
                    <div className="text-center text-gray-400 mt-10">Nenhum pedido encontrado nesta mesa.</div>
                )}
            </div>

            {/* Bottom Actions */}
            <div className="bg-[#00223A] p-4 border-t border-white/10 flex gap-4 text-xs font-bold text-white sticky bottom-0">
                <button
                    onClick={handlePrint}
                    className="flex flex-col items-center gap-1 flex-1 active:scale-95 transition-transform"
                >
                    <Printer size={20} />
                    <span>Imprimir</span>
                </button>

                <div className="w-px bg-white/10"></div>

                <button
                    onClick={handleNewOrder}
                    className="flex flex-col items-center gap-1 flex-1 active:scale-95 transition-transform"
                >
                    <div className="bg-[#0099FF] rounded-full p-1 -mt-6 mb-1 shadow-lg border-4 border-[#003152]">
                        <PlusCircle size={32} className="text-white fill-current" />
                    </div>
                    <span>Gerar pedido</span>
                </button>

                <div className="w-px bg-white/10"></div>

                <button
                    onClick={handleCloseAccount}
                    className="flex flex-col items-center gap-1 flex-1 active:scale-95 transition-transform"
                >
                    <DollarSign size={20} />
                    <span>Fechar conta</span>
                </button>
            </div>
        </div>
    );
};

export default WaiterTableDetails;
