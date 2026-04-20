import { X, Printer, Trash2, Edit, DollarSign, Clock, ArrowRight, User, CreditCard, Utensils, Truck, ShoppingBag, ArrowLeft, SquareMinus, Store } from 'lucide-react';
import { useEstablishment } from '../contexts/EstablishmentContext';
import { useState, useEffect, type FC } from 'react';
import { printOrder } from '../utils/printReceipt';
import { motion, AnimatePresence } from 'framer-motion';

interface OrderDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    order?: any;
    onUpdateStatus?: (status: string) => void;
    isFirstOrder?: boolean;
    onEditPayment?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
}

const StoreIcon = ({ size, className }: { size?: number, className?: string }) => (
    <svg width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M3 21h18v-8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8Z" />
        <path d="m3 10 1.7-2.5A2 2 0 0 1 6.4 6.6h11.2a2 2 0 0 1 1.7.9L21 10" />
        <path d="M12 2a2 2 0 0 1 2 2v2h-4V4a2 2 0 0 1 2-2Z" />
    </svg>
);

const TruckIcon = ({ type }: { type: string }) => {
    if (type === 'DELIVERY') return <Truck size={24} className="text-blue-500" />;
    if (type === 'DINE_IN') return <Utensils size={24} className="text-orange-500" />;
    return <ShoppingBag size={24} className="text-green-500" />;
};

const CountdownTimer = ({ createdAt, minutes }: { createdAt: string, minutes: number }) => {
    const [timeLeft, setTimeLeft] = useState('');
    const [isLate, setIsLate] = useState(false);

    useEffect(() => {
        const calculateTime = () => {
            const created = new Date(createdAt).getTime();
            const target = created + (minutes * 60 * 1000);
            const now = new Date().getTime();
            const diff = target - now;

            const absDiff = Math.abs(diff);
            const h = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((absDiff % (1000 * 60)) / 1000);

            const formattedTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

            if (diff < 0) {
                setIsLate(true);
                setTimeLeft(`-${formattedTime}`);
            } else {
                setIsLate(false);
                setTimeLeft(formattedTime);
            }
        };

        calculateTime();
        const interval = setInterval(calculateTime, 1000);
        return () => clearInterval(interval);
    }, [createdAt, minutes]);

    if (isLate) {
        return (
            <div className="w-full bg-[#D35400] text-white py-2 px-4 rounded-md font-bold text-sm flex items-center justify-center gap-2">
                <Clock size={16} />
                <span>Pedido atrasado</span>
            </div>
        );
    }

    return (
        <div className="bg-blue-100 border border-blue-200 text-blue-800 text-center py-2 rounded-md font-bold text-sm flex items-center justify-center gap-2">
            <Clock size={16} />
            <span>Prepare em até {timeLeft}</span>
        </div>
    );
}

import { useCashier } from '../contexts/CashierContext';

const OrderDetailsModal: FC<OrderDetailsModalProps> = ({ isOpen, onClose, order, onUpdateStatus = () => { }, isFirstOrder, onEditPayment, onEdit, onDelete }) => {
    const { establishment } = useEstablishment();
    const { registerSale } = useCashier();
    if (!isOpen || !order) return null;

    const statusColors = {
        PENDING: { bg: 'bg-[#D35400]', text: 'text-white', label: 'EM ANÁLISE' },
        PREPARING: { bg: 'bg-[#FFB703]', text: 'text-gray-900', label: 'PRODUÇÃO' },
        READY: { bg: 'bg-[#57BC78]', text: 'text-white', label: 'PRONTO' },
        DELIVERED: { bg: 'bg-gray-500', text: 'text-white', label: 'ENTREGUE' }
    };

    // Fallback for status if undefined
    const status = statusColors[order.status as keyof typeof statusColors] || statusColors.PENDING;

    // Parse items if they are string
    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items || [];

    // Parse address if string
    const address = typeof order.delivery_address === 'string'
        ? JSON.parse(order.delivery_address)
        : order.delivery_address;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 md:p-4"
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white md:rounded-lg w-full max-w-4xl md:h-[90vh] h-full flex flex-col shadow-2xl overflow-hidden relative"
                    >
                        {/* --- DESKTOP VIEW --- */}
                        <div className="hidden md:flex flex-col h-full">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-100 rounded-lg">
                                        <TruckIcon type={order.type} />
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-800">Pedido #{order.order_number || order.id}</h2>
                                    <span className={`px-3 py-1 rounded text-xs font-bold uppercase ${status.bg} ${status.text}`}>
                                        {status.label}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="px-2 py-1.5 bg-blue-50 text-blue-600 font-bold text-xs rounded-md flex items-center gap-1 border border-blue-100">
                                        <Clock size={14} />
                                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>

                                    <button
                                        onClick={() => {
                                            if (confirm('Tem certeza que deseja EXCLUIR PERMANENTEMENTE este pedido?')) {
                                                if (onDelete) onDelete();
                                            }
                                        }}
                                        className="p-1.5 text-gray-400 border border-gray-200 rounded-md hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors"
                                        title="Excluir pedido"
                                    >
                                        <Trash2 size={18} />
                                    </button>

                                    <button
                                        onClick={onEdit}
                                        className="p-1.5 text-blue-500 border border-blue-200 rounded-md hover:bg-blue-500 hover:text-white transition-colors"
                                        title="Editar pedido"
                                    >
                                        <Edit size={18} />
                                    </button>

                                    <button
                                        onClick={() => printOrder(order, establishment?.name || 'Noia Burguer')}
                                        className="p-1.5 text-gray-500 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
                                        title="Imprimir pedido"
                                    >
                                        <Printer size={18} />
                                    </button>

                                    {order.status !== 'DELIVERED' && order.status !== 'REJECTED' && (
                                        <button
                                            onClick={() => {
                                                const nextStatus =
                                                    order.status === 'PENDING' ? 'PREPARING' :
                                                        order.status === 'PREPARING' ? 'READY' :
                                                            order.status === 'READY' ? 'DELIVERED' : null;
                                                if (nextStatus) {
                                                    onUpdateStatus(nextStatus);
                                                    if (nextStatus === 'DELIVERED') {
                                                        setTimeout(async () => {
                                                            if (order.payment_methods && order.payment_methods.length > 0) {
                                                                for (const pm of order.payment_methods) {
                                                                    await registerSale(Number(pm.amount), pm.type, `Pedido #${order.order_number || order.id} (Parcial)`);
                                                                }
                                                            } else {
                                                                await registerSale(Number(order.total_amount), order.payment_method || 'money', `Pedido #${order.order_number || order.id}`);
                                                            }
                                                        }, 100);
                                                    }
                                                }
                                            }}
                                            className="p-1.5 bg-[#0099FF] text-white border border-[#0099FF] rounded-md hover:bg-blue-600 transition-colors"
                                            title="Avançar pedido"
                                        >
                                            <ArrowRight size={18} />
                                        </button>
                                    )}

                                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
                                        <X size={24} />
                                    </button>
                                </div>
                            </div>

                            {/* Desktop Content */}
                            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex gap-4">
                                <div className="w-1/3 space-y-4">
                                    {['PENDING', 'PREPARING'].includes(order.status) && (
                                        <div className="mb-2">
                                            <CountdownTimer
                                                createdAt={order.created_at}
                                                minutes={order.type === 'DELIVERY' ? (establishment?.delivery_time_max || 40) : (establishment?.pickup_time_max || 20)}
                                            />
                                        </div>
                                    )}
                                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                            <User size={18} className="text-gray-400" />
                                            Cliente
                                        </h3>
                                        <div className="space-y-1">
                                            <p className="font-medium text-gray-800">
                                                {(!order.customer_name || order.customer_name.startsWith('Mesa '))
                                                    ? 'Cliente não identificado'
                                                    : order.customer_name}
                                            </p>
                                            <p className="text-sm text-blue-600 font-bold underline cursor-pointer">{order.customer_phone}</p>
                                            {isFirstOrder && <div className="mt-2 inline-block bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-bold">Novo Cliente</div>}
                                        </div>
                                    </div>
                                    {order.type === 'DINE_IN' && (
                                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                                                    <Utensils size={18} />
                                                </div>
                                                <span className="font-bold text-gray-800">
                                                    {order.table_number ? `Mesa ${order.table_number}` : (order.customer_name?.startsWith('Mesa') || order.customer_name?.startsWith('Comanda') ? order.customer_name : 'Mesa ?')}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                            {order.type === 'DELIVERY' ? <Truck size={18} className="text-gray-400" /> : <Utensils size={18} className="text-gray-400" />}
                                            {order.type === 'DELIVERY' ? 'Entrega' : 'Consumo no local'}
                                        </h3>
                                        {order.type === 'DELIVERY' && address && (
                                            <p className="text-sm text-gray-600 leading-relaxed">
                                                {address.street}, {address.number}<br />
                                                {address.neighborhood} - {address.city}/{address.state}<br />
                                                {address.complement && <span className="text-gray-400">({address.complement})</span>}
                                            </p>
                                        )}
                                        {order.type === 'DINE_IN' && (
                                            <p className="text-sm text-gray-600">Pedido realizado no balcão/mesa.</p>
                                        )}
                                    </div>

                                    {/* Payment Info */}
                                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 relative group">
                                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                            <DollarSign size={18} className="text-gray-400" />
                                            Formas de pagamento
                                        </h3>
                                        {onEditPayment && (
                                            <button
                                                onClick={onEditPayment}
                                                className="absolute top-2 right-2 p-1.5 text-blue-500 bg-blue-50 rounded hover:bg-blue-100 transition-colors opacity-0 group-hover:opacity-100"
                                                title="Editar forma de pagamento"
                                            >
                                                <Edit size={16} />
                                            </button>
                                        )}
                                        {order.payment_methods && order.payment_methods.length > 0 ? (
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 shrink-0">
                                                    <CreditCard size={20} />
                                                </div>
                                                <div className="space-y-1">
                                                    {order.payment_methods.map((pm: any, idx: number) => (
                                                        <div key={idx}>
                                                            <p className="font-bold text-gray-800 text-sm">
                                                                {pm.type === 'money' ? 'Dinheiro' : 'Cartão'} - R$ {Number(pm.amount).toFixed(2).replace('.', ',')}
                                                            </p>
                                                            {pm.type === 'money' ? (
                                                                <p className="text-xs text-gray-500">
                                                                    {pm.changeFor ? `Troco para R$ ${Number(pm.changeFor).toFixed(2).replace('.', ',')}` : 'Não precisa de troco'}
                                                                </p>
                                                            ) : (
                                                                <p className="text-xs text-gray-500">Cartão</p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : order.payment_method ? (
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 shrink-0">
                                                    {order.payment_method === 'money' ? <DollarSign size={20} /> : <CreditCard size={20} />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800 text-sm">
                                                        {order.payment_method === 'money' ? 'Dinheiro' : order.payment_method === 'card' ? 'Cartão' : 'Outro'}
                                                        - R$ {Number(order.total_amount).toFixed(2).replace('.', ',')}
                                                    </p>
                                                    {order.payment_method === 'money' && (
                                                        <p className="text-xs text-gray-500">Troco: {order.change_for ? `R$ ${order.change_for.toFixed(2).replace('.', ',')}` : 'Não precisa'}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-sm text-orange-500 font-bold">
                                                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                                <span>Não identificado</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Origin */}
                                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                            <StoreIcon size={18} className="text-gray-400" />
                                            Origem do pedido
                                        </h3>
                                        <p className="text-sm text-gray-600">Pedido via link do cardápio</p>
                                    </div>
                                </div>

                                <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col">
                                    <div className="p-4 bg-gray-50 border-b border-gray-100 font-bold text-gray-700">Itens do pedido</div>
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                        {items.map((item: any, idx: number) => (
                                            <div key={idx} className="p-2 border-b border-gray-50 last:border-none">
                                                <div className="flex justify-between items-start mb-1">
                                                    <div className="flex gap-2">
                                                        <span className="font-bold text-gray-500">{item.quantity}x</span>
                                                        <div>
                                                            <span className="font-medium text-gray-800 block">{item.name}</span>
                                                            {item.addons && item.addons.length > 0 && (
                                                                <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                                                                    {item.addons.map((addon: any, aIdx: number) => (
                                                                        <div key={aIdx} className="flex items-center gap-1">
                                                                            <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                                                                            <span>{addon.quantity > 1 ? `${addon.quantity}x ` : ''}{addon.name}</span>
                                                                            {addon.price > 0 && <span>(+R$ {addon.price.toFixed(2).replace('.', ',')})</span>}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span className="font-medium text-gray-800">R$ {(item.total || item.total_price || 0).toFixed(2).replace('.', ',')}</span>
                                                </div>
                                                {item.observation && <p className="text-xs text-gray-500 ml-6 bg-yellow-50 p-1 rounded inline-block mt-1">Obs: {item.observation}</p>}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-4 bg-orange-50 border-t border-orange-100">
                                        {!order.payment_method && (
                                            <div className="flex items-center gap-2 text-orange-600 font-bold mb-2">
                                                <div className="p-1 rounded-full border border-orange-600">
                                                    <DollarSign size={12} />
                                                </div>
                                                Pagamento não registrado
                                            </div>
                                        )}
                                        <div className="flex justify-between items-baseline mb-1">
                                            <span className="text-gray-600">Subtotal</span>
                                            <span>R$ {items.reduce((acc: number, i: any) => acc + (i.total || i.total_price || 0), 0).toFixed(2).replace('.', ',')}</span>
                                        </div>
                                        {order.delivery_fee > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span>Entrega</span>
                                                <span>R$ {order.delivery_fee.toFixed(2).replace('.', ',')}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                                            <span>Total</span>
                                            <span>R$ {Number(order.total_amount).toFixed(2).replace('.', ',')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* --- MOBILE VIEW (SCREENSHOT MATCH) --- */}
                        <div className="flex md:hidden flex-col h-full bg-white overflow-hidden">
                            {/* Mobile Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
                                <button onClick={onClose} className="p-1 -ml-1">
                                    <ArrowLeft size={24} />
                                </button>
                                <h2 className="text-lg font-bold text-gray-800">#{order.order_number || order.id}</h2>
                                <div className="flex items-center gap-4">
                                    <button onClick={() => printOrder(order, establishment?.name || 'Noia Burguer')} className="text-gray-600">
                                        <Printer size={22} />
                                    </button>
                                    <button onClick={onEdit} className="text-gray-600">
                                        <Edit size={22} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (confirm('Deseja excluir este pedido?')) onDelete?.();
                                        }}
                                        className="text-gray-600"
                                    >
                                        <Trash2 size={22} />
                                    </button>
                                </div>
                            </div>

                            {/* Mobile Content Scroll Area */}
                            <div className="flex-1 overflow-y-auto pb-44">
                                {/* Status & Time Section */}
                                <div className="px-4 py-3 flex items-center justify-between border-b border-gray-50">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-gray-100 rounded border border-gray-200">
                                            <StoreIcon size={18} className="text-gray-700" />
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase ${order.status === 'READY' ? 'bg-[#57BC78] text-white' : 'bg-[#FFB703] text-gray-800'}`}>
                                            {status.label}
                                        </span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-800">
                                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}h
                                    </span>
                                </div>

                                {/* Timer Banner (Mobile Full Width) */}
                                {['PENDING', 'PREPARING'].includes(order.status) && (
                                    <div className="bg-white border-b border-gray-50">
                                        <CountdownTimer
                                            createdAt={order.created_at}
                                            minutes={order.type === 'DELIVERY' ? (establishment?.delivery_time_max || 40) : (establishment?.pickup_time_max || 20)}
                                        />
                                    </div>
                                )}

                                {/* Items Section */}
                                <div className="mt-2 text-gray-500">
                                    <div className="px-4 py-2.5 bg-gray-100 border-y border-gray-200 text-xs font-bold uppercase">
                                        Itens do pedido
                                    </div>
                                    <div className="divide-y divide-gray-50 bg-white">
                                        {items.map((item: any, idx: number) => (
                                            <div key={idx} className="px-4 py-3 flex justify-between items-start">
                                                <span className="text-sm font-bold text-gray-800">{item.quantity}x {item.name}</span>
                                                <span className="text-sm font-bold text-gray-700">R$ {(item.total || item.total_price || 0).toFixed(2).replace('.', ',')}</span>
                                            </div>
                                        ))}

                                        {/* Mobile Subtotal Line */}
                                        <div className="px-4 py-3 flex justify-between border-t border-gray-200">
                                            <span className="text-sm font-bold text-gray-400">Subtotal</span>
                                            <span className="text-sm font-bold text-gray-700">R$ {items.reduce((acc: number, i: any) => acc + i.total, 0).toFixed(2).replace('.', ',')}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Client Info Section */}
                                <div className="mt-4 px-4 py-3 border-t border-gray-100 flex items-center gap-3">
                                    <div className="p-2.5 bg-gray-50 rounded-lg text-gray-400">
                                        <User size={22} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-gray-700 uppercase leading-none mb-1">Cliente</p>
                                        <p className="text-sm font-medium text-gray-600">
                                            {(!order.customer_name || order.customer_name.startsWith('Mesa ')) ? 'Não Identificado' : order.customer_name}
                                        </p>
                                    </div>
                                </div>

                                {/* Delivery/Type Section */}
                                <div className="mt-2 px-4 py-3 flex items-center gap-3">
                                    <div className="p-2.5 bg-gray-50 rounded-lg text-gray-400">
                                        <ShoppingBag size={22} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-gray-700 uppercase leading-none mb-1">Entrega</p>
                                        <p className="text-sm font-medium text-gray-600">
                                            {order.type === 'DELIVERY' ? 'Entrega em domicílio' : (order.table_number ? `Mesa ${order.table_number}` : 'Retirada no local')}
                                        </p>
                                    </div>
                                </div>

                                {/* Payment Section */}
                                <div className="mt-2 px-4 py-3 flex items-center gap-3 relative">
                                    <div className="p-2.5 bg-gray-50 rounded-lg text-gray-400">
                                        <SquareMinus size={22} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-gray-700 uppercase leading-none mb-1">Formas de pagamento</p>
                                        {(!order.payment_method && !order.payment_methods?.length) ? (
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-sm font-medium text-gray-400">Não identificado</span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onEditPayment?.();
                                                    }}
                                                    className="px-4 py-1.5 border border-[#0099FF] text-[#0099FF] rounded-md text-sm font-bold active:bg-blue-50"
                                                >
                                                    Registrar
                                                </button>
                                            </div>
                                        ) : (
                                            <p className="text-sm font-medium text-gray-600">
                                                {order.payment_method === 'money' ? 'Dinheiro' : order.payment_method === 'card' ? 'Cartão' : 'Múltiplos pagamentos'}
                                            </p>
                                        )}
                                    </div>
                                    <button onClick={(e) => {
                                        e.stopPropagation();
                                        onEditPayment?.();
                                    }} className="p-2.5 bg-gray-50 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                                        <Edit size={20} />
                                    </button>
                                </div>

                                {/* Origin Section */}
                                <div className="mt-2 px-4 py-3 flex items-center gap-3">
                                    <div className="p-2.5 bg-gray-50 rounded-lg text-gray-400">
                                        <Store size={22} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-gray-700 uppercase leading-none mb-1">Origem do pedido</p>
                                        <p className="text-sm font-medium text-gray-600">
                                            Balcão (PDV)
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Mobile Sticky Footer */}
                            <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 z-20 space-y-4">
                                {/* Payment Warning Banner */}
                                {!order.payment_method && !order.payment_methods?.length && (
                                    <div className="bg-[#FFF4E5] border border-[#FFD8A8] p-3 rounded-lg flex items-center gap-2 text-[#855C33] text-[13px] font-bold">
                                        <div className="shrink-0 p-1 border border-[#855C33] rounded-full">
                                            <DollarSign size={14} />
                                        </div>
                                        Pagamento não registrado
                                    </div>
                                )}

                                {/* Values Summary */}
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center text-gray-500 font-bold text-sm">
                                        <span>Subtotal</span>
                                        <span>R$ {items.reduce((acc: number, i: any) => acc + i.total, 0).toFixed(2).replace('.', ',')}</span>
                                    </div>
                                    {order.delivery_fee > 0 && (
                                        <div className="flex justify-between items-center text-gray-500 font-bold text-sm">
                                            <span>Entrega</span>
                                            <span>R$ {Number(order.delivery_fee).toFixed(2).replace('.', ',')}</span>
                                        </div>
                                    )}
                                    {/* Calculate Adjustment (Total - Subtotal - Delivery) */}
                                    {Math.abs(Number(order.total_amount) - (items.reduce((acc: number, i: any) => acc + i.total, 0) + (Number(order.delivery_fee) || 0))) > 0.01 && (
                                        <div className="flex justify-between items-center text-gray-500 font-bold text-sm">
                                            <span>Ajuste / Extra</span>
                                            <span>R$ {(Number(order.total_amount) - (items.reduce((acc: number, i: any) => acc + i.total, 0) + (Number(order.delivery_fee) || 0))).toFixed(2).replace('.', ',')}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center text-gray-900 font-black text-lg border-t border-gray-100 pt-1 mt-1">
                                        <span>Total</span>
                                        <span>R$ {Number(order.total_amount).toFixed(2).replace('.', ',')}</span>
                                    </div>
                                </div>

                                {/* Primary Button */}
                                <button
                                    onClick={() => {
                                        const nextStatus =
                                            order.status === 'PENDING' ? 'PREPARING' :
                                                order.status === 'PREPARING' ? 'READY' :
                                                    order.status === 'READY' ? 'DELIVERED' : null;
                                        if (nextStatus) {
                                            onUpdateStatus(nextStatus);
                                            if (nextStatus === 'DELIVERED') {
                                                setTimeout(async () => {
                                                    if (order.payment_methods?.length > 0) {
                                                        for (const pm of order.payment_methods) {
                                                            await registerSale(Number(pm.amount), pm.type, `Pedido #${order.id}`);
                                                        }
                                                    } else {
                                                        await registerSale(Number(order.total_amount), order.payment_method || 'money', `Pedido #${order.id}`);
                                                    }
                                                }, 100);
                                            }
                                        }
                                    }}
                                    className="w-full py-4 bg-[#0099FF] hover:bg-blue-600 text-white font-black rounded-lg transition-all shadow-md uppercase tracking-wide text-base active:scale-[0.98]"
                                >
                                    Avançar pedido
                                </button>
                            </div>
                        </div>

                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default OrderDetailsModal;
