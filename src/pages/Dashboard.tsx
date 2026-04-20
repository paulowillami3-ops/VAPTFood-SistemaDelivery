import { Search, Plus, Settings, ArrowRight, Scooter, Utensils, Printer } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, useDroppable } from '@dnd-kit/core';

import AutoAcceptModal from '../components/AutoAcceptModal';
import OrderDetailsModal from '../components/OrderDetailsModal';
import PaymentEditSidebar from '../components/PaymentEditSidebar';
import DeliveryTimeSidebar from '../components/DeliveryTimeSidebar';
import Toast from '../components/Toast';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useEstablishment } from '../contexts/EstablishmentContext';
import { useUI } from '../contexts/UIContext';


import SkeletonCard from '../components/SkeletonCard';
import { ChevronDown, Filter } from 'lucide-react'; // Import ChevronDown, Filter
import confetti from 'canvas-confetti';
import DraggableOrderCard, { type Order } from '../components/DraggableOrderCard';




const Tooltip = ({ text, children }: { text: string; children: React.ReactNode }) => (
    <div className="relative group">
        {children}
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
            {text}
            {/* Arrow pointing up */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-800"></div>
        </div>
    </div>
);

const Dashboard = () => {
    const navigate = useNavigate();
    const { establishment, updateEstablishment } = useEstablishment();
    const { openNewOrderModal } = useUI();


    // const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false); // Removed local state
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<'ALL' | 'DELIVERY' | 'LOCAL'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    // Auto Accept State
    const [autoAcceptEnabled, setAutoAcceptEnabled] = useState(false);
    const [showAutoAcceptModal, setShowAutoAcceptModal] = useState(false);

    // Order Details Modal
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);

    // Payment Sidebar
    const [isPaymentSidebarOpen, setIsPaymentSidebarOpen] = useState(false);
    const [paymentEditingOrder, setPaymentEditingOrder] = useState<Order | null>(null);

    // Toast Notification
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Delivery Time Sidebar
    const [isDeliveryTimeSidebarOpen, setIsDeliveryTimeSidebarOpen] = useState(false);



    // Mobile Tabs
    const [activeMobileTab, setActiveMobileTab] = useState<'PENDING' | 'PREPARING' | 'READY'>('PENDING');

    // DnD State
    const [activeId, setActiveId] = useState<number | null>(null);
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    // Countdown Component


    useEffect(() => {
        // Sync with context
        if (establishment) {
            setAutoAcceptEnabled(!!establishment.auto_accept_orders);
        }
    }, [establishment]);

    const handleAutoAcceptToggle = () => {
        if (!autoAcceptEnabled) {
            // Turning ON
            if (establishment.auto_accept_modal_seen) {
                toggleAutoAccept(true);
            } else {
                setShowAutoAcceptModal(true);
            }
        } else {
            // Turning OFF
            toggleAutoAccept(false);
        }
    };

    const toggleAutoAccept = async (value: boolean, markSeen = false) => {
        if (!establishment?.id) return;

        setAutoAcceptEnabled(value);

        // Optimistic update for settings
        updateEstablishment({
            auto_accept_orders: value,
            ...(markSeen ? { auto_accept_modal_seen: true } : {})
        });

        // Loop: If turning ON, move all PENDING orders to PREPARING
        if (value === true) {
            // Optimistic UI update for orders
            setOrders(prev => prev.map(o => o.status === 'PENDING' ? { ...o, status: 'PREPARING' } : o));

            try {
                const { error: batchError } = await supabase
                    .from('orders')
                    .update({ status: 'PREPARING' })
                    .eq('establishment_id', establishment.id) // IMPORTANT
                    .eq('status', 'PENDING');

                if (batchError) {
                    console.error('Error auto-accepting existing orders:', batchError);
                } else {
                    setToastMessage('Todos os pedidos em análise foram aceitos!');
                }
            } catch (err) {
                console.error('Failed to batch accept orders', err);
            }
        }

        // Persist settings to DB
        try {
            const { error } = await supabase
                .from('establishment_settings')
                .update({
                    auto_accept_orders: value,
                    ...(markSeen ? { auto_accept_modal_seen: true } : {})
                })
                .eq('id', establishment.id); // IMPORTANT

            if (error) console.error('Error updating settings:', error);
        } catch (err) {
            console.error('Failed to persist settings', err);
        }
    };

    const handleModalConfirm = (dontShowAgain: boolean) => {
        setShowAutoAcceptModal(false);
        toggleAutoAccept(true, dontShowAgain);
    };

    // Auto-accept effect removed (handled by Database Trigger)

    useEffect(() => {
        if (!establishment?.id) return;

        fetchOrders();

        // Supabase Realtime Subscription
        const channel = supabase
            .channel(`orders_dashboard_${establishment.id}`) // Unique channel per establishment
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                    filter: `establishment_id=eq.${establishment.id}` // Filter events
                },
                (payload: any) => {
                    console.log('Realtime update received:', payload.eventType, payload.new?.id, payload.new?.status);
                    // Refresh orders on any change to ensure consistency
                    fetchOrders();
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Realtime connected!');
                }
            });

        // Poll for updates as fallback (every 30s instead of 15s)
        const interval = setInterval(fetchOrders, 30000);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(interval);
        };
    }, [establishment?.id]);

    const fetchOrders = async () => {
        if (!establishment?.id) return;
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('establishment_id', establishment.id)
                .in('status', ['PENDING', 'PREPARING', 'READY']) // Only fetch active orders
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (orderId: number, newStatus: string) => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId)
                .eq('establishment_id', establishment.id) // Enforced safety
                .select();

            if (error) {
                console.error('Supabase update error:', error);
                throw error;
            }

            if (!data || data.length === 0) {
                console.error('Update returned no data. Possible RLS or ID mismatch.', { orderId, newStatus });

                // Check if user is authenticated
                const { data: { session } } = await supabase.auth.getSession();
                console.log('Current Session:', session);

                if (!session) {
                    alert('Sessão expirada. Redirecionando para login...');
                    window.location.href = '/login';
                    return;
                }

                alert('Erro de Permissão: Você está logado, mas não tem permissão para alterar este pedido. Verifique suas permissões de administrador.');
                return;
            }

            // Optimistic update
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus as any } : o));
            toast.success('Prontinho! Operação realizada com sucesso.', {
                duration: 3000,
                position: 'top-center',
                style: {
                    background: '#57BC78',
                    color: '#fff',
                    fontWeight: 'bold'
                }
            });

            if (selectedOrder?.id === orderId) {
                setSelectedOrder(prev => prev ? { ...prev, status: newStatus as any } : null);
                // Close modal if delivered or simple update? Let's keep open for now or close if moved to Delivered?
                // Typically keep open
                if (newStatus === 'DELIVERED' || newStatus === 'REJECTED') {
                    setIsOrderDetailsOpen(false);
                }
            }

            if (newStatus === 'DELIVERED') {
                setToastMessage('Prontinho! Operação realizada com sucesso.');
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Erro ao atualizar status do pedido check console');
        }
    };

    const handleDeleteOrder = async (orderId: number) => {
        try {
            const { error } = await supabase
                .from('orders')
                .delete()
                .eq('id', orderId)
                .eq('establishment_id', establishment.id);

            if (error) throw error;

            setOrders(prev => prev.filter(o => o.id !== orderId));
            if (selectedOrder?.id === orderId) {
                setIsOrderDetailsOpen(false);
                setSelectedOrder(null);
            }
        } catch (error) {
            console.error('Error deleting order:', error);
            alert('Erro ao excluir pedido');
        }
    };

    const handleFinalizeAllReady = async () => {
        if (!confirm('Tem certeza que deseja finalizar TODOS os pedidos prontos para entrega?')) return;
        if (!establishment?.id) return;

        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: 'DELIVERED' })
                .eq('establishment_id', establishment.id) // IMPORTANT
                .eq('status', 'READY');

            if (error) throw error;

            // Optimistic update or refetch
            setOrders(prev => prev.map(o => o.status === 'READY' ? { ...o, status: 'DELIVERED' } : o));
            setToastMessage('Prontinho! Operação realizada com sucesso.');
            confetti({
                particleCount: 200,
                spread: 120,
                origin: { y: 0.6 }
            });
        } catch (error) {
            console.error('Error finalizing all:', error);
            alert('Erro ao finalizar pedidos');
        }
    };

    const filteredOrders = useMemo(() => orders.filter(order => {
        // Filter by Type
        if (filterType === 'DELIVERY' && order.type !== 'DELIVERY') return false;
        if (filterType === 'LOCAL' && !['DINE_IN', 'PICKUP'].includes(order.type)) return false;

        // Filter by Search
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            return (
                order.customer_name?.toLowerCase().includes(lowerQuery) ||
                order.order_number?.toLowerCase().includes(lowerQuery)
            );
        }

        return true;
    }), [orders, filterType, searchQuery]);

    const pendingOrders = useMemo(() => filteredOrders.filter(o => o.status === 'PENDING'), [filteredOrders]);
    const preparingOrders = useMemo(() => filteredOrders.filter(o => o.status === 'PREPARING'), [filteredOrders]);
    const readyOrders = useMemo(() => filteredOrders.filter(o => o.status === 'READY'), [filteredOrders]);

    const getOrdersByStatus = (status: string) => {
        switch (status) {
            case 'PENDING': return pendingOrders;
            case 'PREPARING': return preparingOrders;
            case 'READY': return readyOrders;
            default: return [];
        }
    };

    const handleDragEnd = (event: any) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            // Find order
            const orderId = Number(active.id);
            const newStatus = over.id; // Droppable ID is status

            // Validate status change
            const order = orders.find(o => o.id === orderId);
            if (order && order.status !== newStatus) {
                handleUpdateStatus(orderId, newStatus as string);
            }
        }
        setActiveId(null);
    };

    const DroppableColumn = ({ id, children, className }: { id: string, children: React.ReactNode, className?: string }) => {
        const { setNodeRef } = useDroppable({
            id
        });

        return (
            <div ref={setNodeRef} className={className}>
                {children}
            </div>
        );
    };

    // DraggableOrderCard removed (now imported)

    const handleOpenDetails = (order: Order) => {
        setSelectedOrder(order);
        setIsOrderDetailsOpen(true);
    };

    const handleOpenPayment = (order: Order) => {
        setPaymentEditingOrder(order);
        setIsPaymentSidebarOpen(true);
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50 overflow-hidden md:p-6">
            {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}

            <AutoAcceptModal
                isOpen={showAutoAcceptModal}
                onClose={() => setShowAutoAcceptModal(false)}
                onConfirm={handleModalConfirm}
            />
            <OrderDetailsModal
                isOpen={isOrderDetailsOpen}
                onClose={() => setIsOrderDetailsOpen(false)}
                order={selectedOrder}
                isFirstOrder={selectedOrder ? (() => {
                    const customerOrders = orders.filter(o => o.customer_phone === selectedOrder.customer_phone);
                    const sortedOrders = customerOrders.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                    return sortedOrders.length > 0 && sortedOrders[0].id === selectedOrder.id;
                })() : false}
                onUpdateStatus={(status) => {
                    if (selectedOrder) handleUpdateStatus(selectedOrder.id, status);
                }}
                onDelete={() => {
                    if (selectedOrder) handleDeleteOrder(selectedOrder.id);
                }}
                onEditPayment={() => {
                    if (selectedOrder) {
                        setPaymentEditingOrder(selectedOrder);
                        setIsPaymentSidebarOpen(true);
                    }
                }}
                onEdit={() => {
                    if (selectedOrder) {
                        openNewOrderModal(selectedOrder);
                        setIsOrderDetailsOpen(false);
                    }
                }}
            />

            <PaymentEditSidebar
                isOpen={isPaymentSidebarOpen}
                onClose={() => setIsPaymentSidebarOpen(false)}
                order={paymentEditingOrder}
                onSave={(methods: any[]) => {
                    if (paymentEditingOrder) {
                        const isSplitted = methods.length > 1;
                        const mainMethod = isSplitted ? 'split' : methods[0].type;

                        const updated = {
                            ...paymentEditingOrder,
                            payment_methods: methods,
                            payment_method: mainMethod,
                            ...(mainMethod === 'money' ? { change_for: methods[0].changeFor } : {})
                        };

                        setPaymentEditingOrder(updated);
                        setSelectedOrder(updated);

                        setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));

                        supabase.from('orders').update({
                            payment_method: mainMethod,
                            payment_methods: methods,
                            change_for: mainMethod === 'money' ? methods[0].changeFor : null
                        }).eq('id', updated.id).then(({ error }) => {
                            if (error) console.error('Failed to update payment method in DB', error);
                        });
                    }
                }}
            />

            <DeliveryTimeSidebar
                isOpen={isDeliveryTimeSidebarOpen}
                onClose={() => setIsDeliveryTimeSidebarOpen(false)}
            />

            {/* Mobile Header (New Redesign) */}
            <div className="md:hidden px-4 pt-4 pb-2 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 p-1 rounded-lg transition-colors">
                        <span className="text-lg font-bold text-gray-800">Meus Pedidos</span>
                        <ChevronDown size={20} className="text-gray-500" />
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors relative">
                            <Filter size={20} />
                            {filterType !== 'ALL' && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full" />}
                        </button>
                        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                            <Search size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveMobileTab('PENDING')}
                        className={`flex-1 flex flex-col items-center justify-center py-2 px-3 rounded-lg border transition-all relative ${activeMobileTab === 'PENDING'
                            ? 'bg-white border-orange-500 shadow-sm'
                            : 'bg-gray-100 border-transparent text-gray-400 hover:bg-gray-200'
                            }`}
                    >
                        <span className={`text-xs font-bold leading-none mb-1 ${activeMobileTab === 'PENDING' ? 'text-gray-800' : 'text-gray-500'}`}>Análise</span>
                        <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeMobileTab === 'PENDING' ? 'bg-red-500 text-white' : 'bg-gray-300 text-gray-500'
                            }`}>
                            {getOrdersByStatus('PENDING').length}
                        </div>
                    </button>

                    <button
                        onClick={() => setActiveMobileTab('PREPARING')}
                        className={`flex-1 flex flex-col items-center justify-center py-2 px-3 rounded-lg border transition-all relative ${activeMobileTab === 'PREPARING'
                            ? 'bg-orange-50 border-orange-500 shadow-sm'
                            : 'bg-gray-100 border-transparent text-gray-400 hover:bg-gray-200'
                            }`}
                        style={activeMobileTab === 'PREPARING' ? { backgroundColor: '#FFF8E1', borderColor: '#FFB300' } : {}}
                    >
                        <span className={`text-xs font-bold leading-none mb-1 ${activeMobileTab === 'PREPARING' ? 'text-orange-700' : 'text-gray-500'}`}>Produção</span>
                        <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeMobileTab === 'PREPARING' ? 'bg-orange-500 text-white' : 'bg-gray-300 text-gray-500'
                            }`}>
                            {getOrdersByStatus('PREPARING').length}
                        </div>
                    </button>

                    <button
                        onClick={() => setActiveMobileTab('READY')}
                        className={`flex-1 flex flex-col items-center justify-center py-2 px-3 rounded-lg border transition-all relative ${activeMobileTab === 'READY'
                            ? 'bg-green-50 border-green-500 shadow-sm'
                            : 'bg-gray-100 border-transparent text-gray-400 hover:bg-gray-200'
                            }`}
                        style={activeMobileTab === 'READY' ? { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' } : {}}
                    >
                        <span className={`text-xs font-bold leading-none mb-1 ${activeMobileTab === 'READY' ? 'text-green-700' : 'text-gray-500'}`}>Pronto</span>
                        <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeMobileTab === 'READY' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-500'
                            }`}>
                            {getOrdersByStatus('READY').length}
                        </div>
                    </button>
                </div>
            </div>

            {/* Desktop Controls (Restored) */}
            <div className="hidden md:flex items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-2 flex-1">
                    <button
                        onClick={() => setFilterType('ALL')}
                        className={`px-6 py-2 rounded-md font-medium shadow-sm transition-colors ${filterType === 'ALL'
                            ? 'bg-[#F36B46] text-white'
                            : 'bg-white text-gray-700 hover:bg-orange-50 border border-gray-200'
                            }`}
                    >
                        Todos
                    </button>

                    <Tooltip text="Entrega">
                        <button
                            onClick={() => setFilterType('DELIVERY')}
                            className={`p-2 rounded-md shadow-sm transition-colors border ${filterType === 'DELIVERY'
                                ? 'bg-[#0099FF] text-white border-[#0099FF]'
                                : 'bg-white text-gray-500 border-gray-200 hover:bg-blue-50 hover:text-[#0099FF] hover:border-blue-200'
                                }`}
                        >
                            <Scooter size={20} />
                        </button>
                    </Tooltip>

                    <Tooltip text="Mesas, comandas e retirada no local">
                        <button
                            onClick={() => setFilterType('LOCAL')}
                            className={`p-2 rounded-md shadow-sm transition-colors border ${filterType === 'LOCAL'
                                ? 'bg-[#F36B46] text-white border-[#F36B46]'
                                : 'bg-white text-gray-500 border-gray-200 hover:bg-orange-50 hover:text-[#F36B46] hover:border-orange-200'
                                }`}
                        >
                            <Utensils size={20} />
                        </button>
                    </Tooltip>

                    <div className="relative flex-1 max-w-lg ml-2">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Busque por cliente ou número do pedido"
                            className="w-full pl-10 pr-4 py-2 rounded-md border-none shadow-sm focus:ring-2 focus:ring-orange-500 outline-none placeholder-gray-400 font-light"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            const urlSlug = window.location.pathname.split('/')[1];
                            navigate(`/${establishment.slug || urlSlug || 'noia-burguer'}/admin/pdv`);
                        }}
                        className="bg-[#F36B46] text-white px-4 py-2 rounded-md flex items-center gap-2 font-medium hover:bg-orange-600 transition-colors shadow-sm"
                    >
                        <Plus size={18} />
                        Novo pedido
                    </button>
                    <button className="bg-white text-gray-600 p-2 rounded-md hover:bg-gray-50 shadow-sm border border-gray-200">
                        <Printer size={20} />
                    </button>
                    <button
                        onClick={() => {
                            const urlSlug = window.location.pathname.split('/')[1];
                            navigate(`/${establishment.slug || urlSlug || 'noia-burguer'}/admin/settings/orders`);
                        }}
                        className="bg-white text-gray-600 p-2 rounded-md hover:bg-gray-50 shadow-sm border border-gray-200"
                    >
                        <Settings size={20} />
                    </button>
                </div>
            </div>

            {/* Kanban Board */}
            <DndContext sensors={sensors} onDragEnd={handleDragEnd} onDragStart={(event) => setActiveId(event.active.id as number)}>
                <div className="flex-1 overflow-hidden md:p-0 min-h-0">
                    <div className="flex flex-col md:flex-row gap-0 h-full rounded-none md:rounded-lg border-0 md:border md:border-gray-200 bg-transparent md:bg-white shadow-none md:shadow-sm overflow-hidden min-h-0">

                        {/* Column 1: PENDING */}
                        <DroppableColumn id="PENDING" className={`flex-col flex-1 h-full md:bg-[#F36B46] bg-[#C4C4C4] border-r border-gray-100 ${activeMobileTab === 'PENDING' ? 'flex' : 'hidden md:flex'} min-h-0`}>
                            {/* Mobile Header PENDING */}
                            <div className="md:hidden px-4 py-3 bg-[#757575] flex justify-between items-center shadow-sm">
                                <span className="font-bold text-white text-lg">Em análise</span>
                                <span className="font-bold text-white text-lg">{getOrdersByStatus('PENDING').length}</span>
                            </div>

                            {/* Mobile Controls */}
                            <div className="md:hidden px-4 my-4">
                                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
                                    <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-2">
                                        <div className="text-xs space-x-3">
                                            <span className="font-bold text-gray-800">Balcão: <span className="font-normal text-gray-600">{establishment?.pickup_time_min ?? 15} a {establishment?.pickup_time_max ?? 30} min</span></span>
                                            <span className="font-bold text-gray-800">Delivery: <span className="font-normal text-gray-600">{establishment?.delivery_time_min ?? 30} a {establishment?.delivery_time_max ?? 50} min</span></span>
                                        </div>
                                        <button onClick={() => setIsDeliveryTimeSidebarOpen(true)} className="text-xs font-bold text-gray-800 underline">Editar</button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-8 h-4 rounded-full relative transition-colors cursor-pointer ${autoAcceptEnabled ? 'bg-green-500' : 'bg-gray-300'}`} onClick={handleAutoAcceptToggle}>
                                                <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${autoAcceptEnabled ? 'translate-x-4' : ''}`} />
                                            </div>
                                            <span className="text-xs font-bold text-gray-700">Aceitar os pedidos automaticamente</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Desktop Header PENDING (Restored) */}
                            <div className="hidden md:block px-3 py-2 bg-[#F36B46] border-b border-white/20">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-white text-sm">Em análise</span>
                                    <div className="bg-white/20 px-2 py-0.5 rounded text-white text-xs font-bold">
                                        {getOrdersByStatus('PENDING').length}
                                    </div>
                                </div>

                                <div className="bg-white rounded p-1.5 flex items-center justify-between shadow-sm mb-2">
                                    <div className="flex gap-4">
                                        <span className="text-[10px] font-bold text-gray-700">
                                            Balcão: <span className="font-normal text-gray-500">
                                                {establishment?.pickup_time_min !== undefined && establishment?.pickup_time_min !== null
                                                    ? `${establishment.pickup_time_min} a ${establishment.pickup_time_max} min`
                                                    : 'N/D'}
                                            </span>
                                        </span>
                                        <span className="text-[10px] font-bold text-gray-700">
                                            Delivery: <span className="font-normal text-gray-500">
                                                {establishment?.delivery_time_min !== undefined && establishment?.delivery_time_min !== null
                                                    ? `${establishment.delivery_time_min} a ${establishment.delivery_time_max} min`
                                                    : 'N/D'}
                                            </span>
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => setIsDeliveryTimeSidebarOpen(true)}
                                        className="text-[10px] font-bold underline text-gray-800 hover:text-orange-600"
                                    >
                                        Editar
                                    </button>
                                </div>

                                <div className="flex items-center justify-between bg-black/10 rounded-full px-2 py-1">
                                    <label className="flex items-center cursor-pointer w-full relative">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={autoAcceptEnabled}
                                            onChange={handleAutoAcceptToggle}
                                        />
                                        <div className="w-8 h-4 bg-black/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-green-500"></div>
                                        <span className="ml-2 text-[10px] font-bold text-white">Aceitar pedidos autos</span>
                                    </label>
                                </div>
                            </div>

                            <div className={`p-2 space-y-2 overflow-y-auto custom-scrollbar pb-24 md:pb-2 h-[calc(100vh-320px)] ${autoAcceptEnabled ? 'flex flex-col items-center justify-center' : ''}`}>
                                {autoAcceptEnabled ? (
                                    <div className="flex flex-col items-center animate-fadeIn opacity-50">
                                        <div className="mb-4 transform rotate-90 text-white">
                                            <ArrowRight size={32} />
                                        </div>
                                        <h3 className="font-bold text-base mb-1 text-white">Todos os pedidos</h3>
                                        <p className="font-medium text-xs text-white/80">são aceitos automaticamente</p>
                                    </div>
                                ) : (
                                    loading ? (
                                        <>
                                            <SkeletonCard />
                                            <SkeletonCard />
                                        </>
                                    ) : getOrdersByStatus('PENDING').length > 0 ? (
                                        getOrdersByStatus('PENDING').map(order => (
                                            <DraggableOrderCard
                                                key={order.id}
                                                order={order}
                                                establishment={establishment}
                                                orders={orders}
                                                onOpenDetails={handleOpenDetails}
                                                onOpenPayment={handleOpenPayment}
                                                onUpdateStatus={handleUpdateStatus}
                                            />
                                        ))
                                    ) : (
                                        <div className="mt-10 text-center text-white text-xs px-6">
                                            <p className="font-medium mb-1">Nenhum pedido no momento.</p>
                                            <p className="opacity-90">Compartilhe os seus links nas redes sociais e receba pedidos!</p>
                                        </div>
                                    )
                                )}
                            </div>
                        </DroppableColumn>

                        {/* Column 2: PREPARING */}
                        <DroppableColumn id="PREPARING" className={`flex-col flex-1 h-full md:bg-[#FFA502] bg-[#FFA502] border-r border-gray-100 ${activeMobileTab === 'PREPARING' ? 'flex' : 'hidden md:flex'} min-h-0`}>
                            <div className="md:hidden px-4 py-3 bg-[#D98C00] flex justify-between items-center shadow-sm">
                                <span className="font-bold text-white text-lg">Em produção</span>
                                <span className="font-bold text-white text-lg">{getOrdersByStatus('PREPARING').length}</span>
                            </div>

                            <div className="hidden md:flex px-3 py-2 justify-between items-center bg-[#FFA502] border-b border-white/20">
                                <span className="font-bold text-sm text-white">Em produção</span>
                                <div className="bg-white/20 px-2 py-0.5 rounded text-white text-xs font-bold">
                                    {getOrdersByStatus('PREPARING').length}
                                </div>
                            </div>

                            <div className="flex-1 min-h-0 p-2 space-y-2 overflow-y-auto custom-scrollbar pb-24 md:pb-2 h-[calc(100vh-220px)]">
                                {loading ? (
                                    <> <SkeletonCard /> <SkeletonCard /> </>
                                ) : getOrdersByStatus('PREPARING').length > 0 ? (
                                    getOrdersByStatus('PREPARING').map(order => (
                                        <DraggableOrderCard
                                            key={order.id}
                                            order={order}
                                            establishment={establishment}
                                            orders={orders}
                                            onOpenDetails={handleOpenDetails}
                                            onOpenPayment={handleOpenPayment}
                                            onUpdateStatus={handleUpdateStatus}
                                        />
                                    ))
                                ) : (
                                    <div className="mt-10 text-center text-white text-xs px-6">
                                        <p className="font-medium mb-1">Nenhum pedido no momento.</p>
                                        <p className="opacity-90">Receba pedidos e visualize os que estão em produção.</p>
                                    </div>
                                )}
                            </div>
                        </DroppableColumn>

                        {/* Column 3: READY */}
                        <DroppableColumn id="READY" className={`flex-col flex-1 h-full md:bg-[#57BC78] bg-[#57BC78] ${activeMobileTab === 'READY' ? 'flex' : 'hidden md:flex'} min-h-0`}>
                            <div className="md:hidden px-4 py-3 bg-[#44945D] flex justify-between items-center shadow-sm">
                                <span className="font-bold text-white text-lg">Prontos para entrega</span>
                                <div className="flex items-center gap-3">
                                    <button onClick={handleFinalizeAllReady} className="border border-white/60 text-white text-xs px-3 py-1 rounded hover:bg-white/10 font-medium transition-colors">
                                        Finalizar
                                    </button>
                                    <span className="font-bold text-white text-lg">{getOrdersByStatus('READY').length}</span>
                                </div>
                            </div>

                            <div className="hidden md:flex px-3 py-2 justify-between items-center bg-[#57BC78] border-b border-white/20">
                                <span className="font-bold text-sm text-white">Prontos para entrega</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleFinalizeAllReady}
                                        className="px-2 py-0.5 border border-white/50 rounded text-xs font-semibold text-white hover:bg-white/10 transition-colors"
                                    >
                                        Finalizar
                                    </button>
                                    <div className="bg-white/20 px-2 py-0.5 rounded text-white text-xs font-bold">
                                        {getOrdersByStatus('READY').length}
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 min-h-0 p-2 space-y-2 overflow-y-auto custom-scrollbar pb-24 md:pb-2 h-[calc(100vh-220px)]">
                                {loading ? (
                                    <> <SkeletonCard /> <SkeletonCard /> </>
                                ) : getOrdersByStatus('READY').length > 0 ? (
                                    getOrdersByStatus('READY').map(order => (
                                        <DraggableOrderCard
                                            key={order.id}
                                            order={order}
                                            establishment={establishment}
                                            orders={orders}
                                            onOpenDetails={handleOpenDetails}
                                            onOpenPayment={handleOpenPayment}
                                            onUpdateStatus={handleUpdateStatus}
                                        />
                                    ))
                                ) : (
                                    <div className="mt-10 text-center text-white text-xs px-6">
                                        <p className="font-medium mb-1">Nenhum pedido no momento.</p>
                                        <p className="opacity-90">Receba pedidos e visualize os prontos para entrega.</p>
                                    </div>
                                )}
                            </div>
                        </DroppableColumn>
                    </div>
                </div>

                <DragOverlay>
                    {activeId ? (
                        <DraggableOrderCard
                            order={orders.find(o => o.id === activeId)!}
                            isOverlay
                            establishment={establishment}
                            orders={orders}
                            onOpenDetails={handleOpenDetails}
                            onOpenPayment={handleOpenPayment}
                            onUpdateStatus={handleUpdateStatus}
                        />
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
};

export default Dashboard;

