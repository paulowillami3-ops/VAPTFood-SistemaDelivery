import React, { useState, useEffect, useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { supabase } from '../lib/supabase';
import { Utensils, ShoppingBag, Clock, Printer, CreditCard, DollarSign, Wallet, MapPin, ArrowRight, ExternalLink, Edit } from 'lucide-react';
import { printOrder } from '../utils/printReceipt';
import CountdownTimer from './CountdownTimer';

export interface Order {
    id: number;
    order_number: string;
    customer_name: string;
    customer_phone: string;
    status: 'PENDING' | 'PREPARING' | 'READY' | 'DELIVERED' | 'REJECTED';
    total_amount: number;
    items: any[];
    created_at: string;
    type: 'DELIVERY' | 'DINE_IN' | 'PICKUP';
    payment_method: string | null;
    payment_methods?: any[];
    delivery_address: any;
    table_number?: string;
    delivery_fee?: number;
}

interface DraggableOrderCardProps {
    order: Order;
    isOverlay?: boolean;
    establishment: any;
    orders: Order[];
    onOpenDetails: (order: Order) => void;
    onOpenPayment: (order: Order) => void;
    onUpdateStatus: (id: number, status: string) => void;
}

const DraggableOrderCard: React.FC<DraggableOrderCardProps> = ({
    order,
    isOverlay = false,
    establishment,
    orders,
    onOpenDetails,
    onOpenPayment,
    onUpdateStatus
}) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: order.id,
        data: order
    });

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [fallbackAddress, setFallbackAddress] = useState<any | null>(null);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        let isMounted = true;
        if (order.type === 'DELIVERY' && !order.delivery_address && order.customer_phone) {
            const fetchCustomerAddress = async () => {
                try {
                    const cleanPhone = order.customer_phone.replace(/\D/g, '');
                    const { data: recentOrder } = await supabase
                        .from('orders')
                        .select('delivery_address')
                        .eq('customer_phone', cleanPhone)
                        .not('delivery_address', 'is', null)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .single();

                    if (recentOrder?.delivery_address) {
                        if (isMounted) setFallbackAddress(typeof recentOrder.delivery_address === 'string' ? JSON.parse(recentOrder.delivery_address) : recentOrder.delivery_address);
                        return;
                    }

                    const { data: customer } = await supabase
                        .from('customers')
                        .select('addresses')
                        .eq('phone', cleanPhone)
                        .single();

                    if (customer?.addresses && customer.addresses.length > 0) {
                        if (isMounted) setFallbackAddress(customer.addresses[0]);
                    }
                } catch (err) {
                    console.error("Error fetching fallback address", err);
                }
            };
            fetchCustomerAddress();
        }
        return () => { isMounted = false; };
    }, [order.id, order.type, order.delivery_address, order.customer_phone]);

    const isFirstOrder = useMemo(() => {
        if (!orders || orders.length === 0) return false;
        const customerOrders = orders.filter((o: Order) => o.customer_phone === order.customer_phone);
        const sortedOrders = [...customerOrders].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        return sortedOrders.length > 0 && sortedOrders[0].id === order.id;
    }, [orders, order.customer_phone, order.id]);

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : undefined,
    } : undefined;

    // --- SHARED DATA ---
    const addrSource = order.delivery_address ? (typeof order.delivery_address === 'string' ? JSON.parse(order.delivery_address) : order.delivery_address) : fallbackAddress;
    let addressText = '';
    if (order.type === 'DELIVERY' && addrSource) {
        const addr = typeof addrSource === 'string' ? JSON.parse(addrSource) : addrSource;
        addressText = `${addr.street}, ${addr.number} - ${addr.neighborhood}`;
    }
    const total = `R$ ${order.total_amount.toFixed(2).replace('.', ',')}`;

    const getButtonLabel = () => {
        if (order.status === 'READY') {
            if (order.type === 'DINE_IN') return 'Fechar mesa';
            if (order.type === 'PICKUP') return 'Finalizar retirada';
            return 'Finalizar pedido';
        }
        return 'Avançar pedido';
    };

    // --- MOBILE CONTENT ---
    if (isMobile) {
        return (
            <div
                ref={!isOverlay ? setNodeRef : undefined}
                style={!isOverlay ? style : undefined}
                {...(!isOverlay ? listeners : {})}
                {...(!isOverlay ? attributes : {})}
                onClick={() => onOpenDetails(order)}
                className={`bg-white rounded-xl p-3 shadow-md border border-gray-100 hover:shadow-lg transition-all cursor-pointer relative overflow-hidden group ${isOverlay ? 'shadow-2xl scale-105 rotate-2' : ''}`}
            >
                <div className="flex items-center gap-2 mb-3">
                    <div className="bg-gray-100 p-1.5 rounded-lg text-gray-600">
                        <ShoppingBag size={18} />
                    </div>
                    <span className="font-black text-[#0099FF] text-lg">#{order.order_number || order.id}</span>
                    {['PENDING', 'PREPARING'].includes(order.status) && (
                        <div className="flex-1 px-3 py-1.5 bg-[#E1F2FF] rounded-lg">
                            <CountdownTimer
                                createdAt={order.created_at}
                                minutes={order.type === 'DELIVERY' ? (establishment?.delivery_time_max || 40) : (establishment?.pickup_time_max || 20)}
                                isCard={true}
                            />
                        </div>
                    )}
                    <span className="text-gray-500 font-medium text-sm">
                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
                <div className="mb-4">
                    <p className="text-gray-700 font-medium text-sm">
                        {(!order.customer_name || order.customer_name.toLowerCase().startsWith('mesa') || order.customer_name.toLowerCase().startsWith('comanda'))
                            ? 'Não identificado'
                            : order.customer_name}
                    </p>
                </div>
                <div className="bg-gray-50 p-2 rounded-lg flex items-center gap-2 text-gray-500 mb-4 h-9">
                    <MapPin size={14} />
                    <span className="text-sm font-medium">
                        {order.type === 'DELIVERY' ? 'Entrega' : (order.table_number ? `Mesa ${order.table_number}` : 'Retirada no local')}
                    </span>
                </div>
                <div className="flex items-center justify-between mb-4">
                    <div className="text-gray-500 text-sm font-medium">Pagamento:</div>
                    {!order.payment_method ? (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenDetails(order);
                                }}
                                className="p-1 hover:bg-gray-100 rounded text-gray-500"
                            >
                                <ExternalLink size={16} />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    // We need to access openNewOrderModal here or pass onEdit prop
                                    onOpenDetails(order); // Currently opens details, user can click edit there.
                                    // Ideal: Add onEdit prop to DraggableOrderCard?
                                }}
                                className="p-1 hover:bg-gray-100 rounded text-gray-500"
                            >
                                <Edit size={16} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 text-gray-700 text-sm font-bold">
                            {order.payment_method === 'money' ? <DollarSign size={14} /> : <CreditCard size={14} />}
                            <span>{total}</span>
                        </div>
                    )}
                </div>
                <div className="grid grid-cols-1 gap-3">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            const next = order.status === 'PENDING' ? 'PREPARING' : order.status === 'PREPARING' ? 'READY' : order.status === 'READY' ? 'DELIVERED' : null;
                            if (next) onUpdateStatus(order.id, next);
                        }}
                        className="py-2.5 bg-[#0099FF] text-white font-black text-lg rounded-lg shadow-sm active:scale-95 transition-all text-center flex items-center justify-center gap-2"
                    >
                        {getButtonLabel()}
                        <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        );
    }

    // --- DESKTOP CONTENT ---
    return (
        <div
            ref={!isOverlay ? setNodeRef : undefined}
            style={!isOverlay ? style : undefined}
            {...(!isOverlay ? listeners : {})}
            {...(!isOverlay ? attributes : {})}
            onClick={() => onOpenDetails(order)}
            className={`bg-white rounded-lg p-2 shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer relative overflow-hidden group ${isOverlay ? 'shadow-2xl scale-105 rotate-2' : ''} ${order.status === 'PENDING' ? 'border-l-4 border-l-[#D35400]' :
                order.status === 'PREPARING' ? 'border-l-4 border-l-[#FFA502]' :
                    order.status === 'READY' ? 'border-l-4 border-l-[#57BC78]' : ''
                }`}
        >
            <div className="flex justify-between items-start mb-1.5">
                <div className="flex items-center gap-2">
                    <div className="bg-gray-100 p-1 rounded-md text-gray-600">
                        {order.type === 'DELIVERY' ? (
                            <img src="/delivery-moto.png" alt="Delivery" className="w-[14px] h-[14px] object-contain" />
                        ) : order.type === 'DINE_IN' ? (
                            <Utensils size={14} />
                        ) : (
                            <ShoppingBag size={14} />
                        )}
                    </div>
                    <span className="font-bold text-gray-800 text-xs text-nowrap">#{order.order_number || order.id}</span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            printOrder(order, establishment?.name || 'Noia Burguer');
                        }}
                        className="p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="Imprimir"
                    >
                        <Printer size={14} />
                    </button>
                    <div className="px-1.5 py-0.5 bg-orange-50 text-orange-600 text-[10px] font-bold rounded flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            </div>

            {['PENDING', 'PREPARING'].includes(order.status) && (
                <div className="mb-1.5">
                    <CountdownTimer
                        createdAt={order.created_at}
                        minutes={order.type === 'DELIVERY' ? (establishment?.delivery_time_max || 40) : (establishment?.pickup_time_max || 20)}
                        isCard={true}
                    />
                </div>
            )}

            <div className="mb-2">
                <div className="flex justify-between items-baseline mb-0.5">
                    <span className="font-semibold text-gray-700 text-xs truncate max-w-[60%]">
                        {(!order.customer_name || order.customer_name.toLowerCase().startsWith('mesa') || order.customer_name.toLowerCase().startsWith('comanda'))
                            ? 'Cliente não identificado'
                            : order.customer_name}
                    </span>
                    <div className="flex flex-col items-end gap-0.5">
                        <div className="flex items-center gap-1">
                            {isFirstOrder ? (
                                <span className="text-[10px] font-bold text-white bg-green-500 px-1 rounded" title="Primeiro pedido do cliente">1º</span>
                            ) : null}
                            <span className="text-[10px] text-gray-500 font-bold">Total:</span>
                            <span className="text-xs font-bold text-gray-800">{total}</span>
                        </div>
                        {!order.payment_method && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenPayment(order);
                                }}
                                className="flex items-center gap-1 text-[9px] text-[#F36B46] font-bold hover:underline"
                            >
                                <CreditCard size={9} />
                                Registrar pagamento
                            </button>
                        )}
                    </div>
                </div>

                {['DINE_IN'].includes(order.type) && (
                    <div className="bg-gray-100 p-1.5 rounded mb-1.5 flex items-center gap-2 text-xs font-medium text-gray-700">
                        <Utensils size={14} />
                        <span>
                            {order.table_number
                                ? `Mesa ${order.table_number}`
                                : (order.customer_name?.toLowerCase().startsWith('mesa') ? order.customer_name : 'Mesa não informada')}
                        </span>
                    </div>
                )}

                <div className="flex justify-between items-end">
                    <span className="text-gray-500 text-[10px]">{order.customer_phone || '(Sem telefone)'}</span>
                    <div className="flex items-center gap-1 text-gray-500 text-[10px]">
                        {order.payment_method ? (
                            <>
                                {order.payment_method === 'money' ? <DollarSign size={10} /> :
                                    order.payment_method === 'card' ? <CreditCard size={10} /> :
                                        order.payment_method === 'split' ? <Wallet size={10} /> :
                                            <DollarSign size={10} />}
                                <span>
                                    {order.payment_method === 'money' ? 'Dinheiro' :
                                        order.payment_method === 'card' ? 'Cartão' :
                                            order.payment_method === 'split' ? 'Múltiplos pagamentos' :
                                                'Outro'}
                                </span>
                            </>
                        ) : (
                            <span className="flex items-center gap-1 text-red-500 text-[10px]">
                                <DollarSign size={10} />
                                Não registrado
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {order.type === 'DELIVERY' && addressText && (
                <div className="bg-gray-50 p-1.5 rounded text-[10px] text-gray-600 flex items-start gap-1 mb-2">
                    <MapPin size={12} className="shrink-0 mt-0.5" />
                    <span className="line-clamp-2 leading-tight">{addressText}</span>
                </div>
            )}

            <div className="flex gap-2">
                {order.status === 'READY' && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onOpenPayment(order);
                        }}
                        className="px-2 py-1.5 bg-gray-100 text-gray-700 font-bold text-[10px] rounded-md hover:bg-gray-200 transition-all active:scale-95 text-center"
                    >
                        Pagamento
                    </button>
                )
                }
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        const next = order.status === 'PENDING' ? 'PREPARING' : order.status === 'PREPARING' ? 'READY' : order.status === 'READY' ? 'DELIVERED' : null;
                        if (next) onUpdateStatus(order.id, next);
                    }}
                    className="flex-1 mt-1 py-1.5 text-[#0099FF] font-bold text-xs border border-[#0099FF] rounded-md hover:bg-blue-50 transition-colors flex items-center justify-center gap-1 group/btn"
                >
                    {getButtonLabel()}
                    <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    );
};

export default DraggableOrderCard;
