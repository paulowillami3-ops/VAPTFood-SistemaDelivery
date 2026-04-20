import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Monitor, X, Wallet, CreditCard, QrCode, Trash2, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { printOrder } from '../../utils/printReceipt';

interface Payment {
    id: string;
    type: 'MONEY' | 'CARD' | 'PIX';
    amount: number;
    change?: number;
    client?: string;
}

const WaiterCloseAccount = () => {
    const { slug, id: tableId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [tableName, setTableName] = useState('');
    const [orders, setOrders] = useState<any[]>([]);

    // Totals
    const [subtotal, setSubtotal] = useState(0);
    const [serviceFee, setServiceFee] = useState(0);
    const [total, setTotal] = useState(0);
    const [remaining, setRemaining] = useState(0);
    // @ts-ignore - paidAmount is used in useEffect
    const [paidAmount, setPaidAmount] = useState(0);

    // Payments
    const [payments, setPayments] = useState<Payment[]>([]);
    const [showClearModal, setShowClearModal] = useState(false);

    // Split
    const [splitCount, setSplitCount] = useState(1);

    // Modals
    const [paymentModalType, setPaymentModalType] = useState<'MONEY' | 'CARD' | 'PIX' | null>(null);

    // Payment Form
    const [payValue, setPayValue] = useState('');
    const [payChange, setPayChange] = useState('');
    const [includeFee, setIncludeFee] = useState(true);
    const [clientName, setClientName] = useState('');

    useEffect(() => {
        fetchData();
    }, [tableId]);

    const fetchData = async () => {
        if (!tableId) return;
        setLoading(true);
        try {
            // 1. Table
            const { data: tableData } = await supabase.from('restaurant_tables').select('name, establishment_id').eq('id', tableId).single();
            if (tableData) setTableName(tableData.name);

            // 2. Orders
            const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();

            const { data: ordersData } = await supabase
                .from('orders')
                .select('*')
                .eq('table_id', tableId)
                .in('status', ['PENDING', 'PREPARING', 'READY', 'DELIVERED'])
                .gte('created_at', twelveHoursAgo);

            if (ordersData) {
                // Filter out orders that already have payment_methods (paid orders)
                const activeOrders = ordersData.filter(o => {
                    // Check if payment_methods is present and not empty
                    if (o.payment_methods) {
                        try {
                            const methods = typeof o.payment_methods === 'string' ? JSON.parse(o.payment_methods) : o.payment_methods;
                            // If it's an array with items, consider it paid/partial. 
                            // For now, if any payment exists, we exclude it from "Open Bill" to avoid double charging.
                            // However, if we want to support "Remaining", we should verify if it's fully paid.
                            // But usually, if payment_methods is set, it was processed.
                            if (Array.isArray(methods) && methods.length > 0) return false;
                        } catch (e) {
                            return true; // Keep if parse error
                        }
                    }
                    return true;
                });

                const sub = activeOrders.reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0);
                setOrders(activeOrders);
                setSubtotal(sub);
                setServiceFee(sub * 0.10);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Recalculate totals
    useEffect(() => {
        const fees = includeFee ? subtotal * 0.10 : 0;
        setServiceFee(fees);
        const newTotal = subtotal + fees;
        setTotal(newTotal);

        const paid = payments.reduce((acc, p) => acc + p.amount, 0);
        setPaidAmount(paid);
        setRemaining(Math.max(0, newTotal - paid));

    }, [subtotal, includeFee, payments]);

    const handleSplit = (delta: number) => setSplitCount(prev => Math.max(1, prev + delta));

    const handleOpenPayment = (type: 'MONEY' | 'CARD' | 'PIX') => {
        setPaymentModalType(type);
        setPayValue(remaining.toFixed(2).replace('.', ','));
        setPayChange('');
        setClientName('');
        // Don't reset includeFee here to maintain toggle state
    };

    const handleAddPayment = () => {
        const amount = parseFloat(payValue.replace('R$ ', '').replace('.', '').replace(',', '.'));

        if (!amount || amount <= 0) {
            toast.error('Valor inválido');
            return;
        }

        if (amount > remaining + 0.05) { // Tolerance for float errors
            toast.error('Valor maior que o restante');
            return;
        }

        const newPayment: Payment = {
            id: Math.random().toString(36).substr(2, 9),
            type: paymentModalType!,
            amount,
            change: paymentModalType === 'MONEY' && payChange ? parseFloat(payChange.replace('R$ ', '').replace('.', '').replace(',', '.')) : undefined,
            client: clientName
        };

        setPayments([...payments, newPayment]);
        setPaymentModalType(null);
        toast.success('Pagamento adicionado!');
    };

    const handleClearPayments = () => {
        setPayments([]);
        setShowClearModal(false);
        toast.success('Pagamentos removidos');
    };

    const handlePrint = () => {
        if (orders.length === 0) return;
        const allItems = orders.flatMap(o => typeof o.items === 'string' ? JSON.parse(o.items) : o.items || []);
        if (serviceFee > 0) {
            allItems.push({ quantity: 1, name: 'Taxa de Serviço (10%)', total: serviceFee, price: serviceFee });
        }
        // ... (rest of print logic unchanged, ideally pass payments info too)
        const syntheticOrder = {
            id: 'FECHAMENTO',
            order_number: tableName,
            type: 'DINE_IN',
            table_number: tableName.replace('Mesa ', ''),
            customer_name: 'Fechamento de Conta',
            created_at: new Date().toISOString(),
            items: allItems,
            total_amount: total,
            payment_method: null // TODO: List payments in receipt?
        };
        printOrder(syntheticOrder);
    };

    const handleCloseTable = async () => {
        try {
            // Logic: Distribute payments across orders or just attach all payments to all orders (duplicated info but safe for MVP logging)
            // Better: Mark orders as CLOSED and store specific payment info in a `transaction` or just simpler JSON on order.

            // Converting payments to simple format for DB
            const methods = payments.map(p => ({
                type: p.type === 'MONEY' ? 'money' : p.type === 'CARD' ? 'card' : 'pix',
                amount: p.amount,
                changeFor: p.change,
                client: p.client
            }));

            const updates = orders.map(o =>
                supabase.from('orders').update({
                    status: 'CLOSED',
                    payment_methods: JSON.stringify(methods),
                    payment_method: 'split' // Indicator for complex payment
                }).eq('id', o.id)
            );

            const results = await Promise.all(updates);
            const error = results.find(r => r.error);
            if (error) throw error.error;

            // Optional: Free table status
            const { error: tableError } = await supabase.from('restaurant_tables').update({ status: 'FREE' }).eq('id', tableId);
            if (tableError) throw tableError;

            toast.success('Mesa fechada com sucesso!');
            navigate(`/${slug}/garcom/app`);

        } catch (e) {
            console.error(e);
            toast.error('Erro ao fechar mesa');
        }
    };

    const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const splitValue = remaining / splitCount;
    const isFullyPaid = remaining <= 0.01; // Float tolerance

    if (loading) return <div className="min-h-screen bg-[#003152] flex items-center justify-center text-white">Carregando...</div>;

    return (
        <div className="min-h-screen bg-[#003152] flex flex-col font-sans text-white">
            {/* Header */}
            <div className="bg-[#00223A] border-b border-white/10 p-4 flex justify-between items-center shadow-md">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="text-white"><ArrowLeft size={24} /></button>
                    <span className="font-bold text-lg">Fechar conta</span>
                </div>
                <button onClick={() => navigate(`/${slug}/garcom/app`)} className="flex items-center gap-2 bg-[#003152] px-3 py-1.5 rounded text-sm hover:bg-[#00416b] border border-white/10">
                    <Monitor size={16} /><span>Mapa de mesas</span>
                </button>
            </div>

            {/* Print Button */}
            <div className="p-4"><button onClick={handlePrint} className="w-full border border-white/20 rounded-md py-3 flex items-center justify-center gap-2 hover:bg-white/5 transition-colors text-gray-300"><Printer size={18} /><span>Imprimir</span></button></div>

            {/* Summary */}
            <div className="px-4 space-y-2 text-sm text-gray-400">
                <div className="flex justify-between font-bold text-white text-lg"><span>{tableName}</span></div>
                <div className="flex justify-between"><span>Subtotal</span><span className="text-white">{formatCurrency(subtotal)}</span></div>
                <div className="flex justify-between flex-wrap gap-2 items-center">
                    <span>Taxa de serviço (10%)</span>
                    {/* Toggle UI for Fee */}
                    <div className="flex items-center gap-2 ml-auto">
                        <button onClick={() => setIncludeFee(!includeFee)} className={`w-8 h-4 rounded-full flex items-center p-0.5 transition-colors ${includeFee ? 'bg-[#0099FF] justify-end' : 'bg-gray-600 justify-start'}`}><div className="w-3 h-3 rounded-full bg-white"></div></button>
                        <span className="text-white">{formatCurrency(serviceFee)}</span>
                    </div>
                </div>
                <div className="flex justify-between text-lg font-bold text-white pt-2 border-t border-white/10 mt-2"><span>Total</span><span>{formatCurrency(total)}</span></div>
            </div>

            {/* Payments List */}
            <div className="mt-4 bg-[#00223A] border-y border-white/10">
                <div className="flex justify-between items-center p-3 bg-[#001a2c]">
                    <span className="font-bold text-sm">Pagamentos</span>
                    {payments.length > 0 && (
                        <button onClick={() => setShowClearModal(true)} className="text-red-400 hover:text-red-300"><Trash2 size={18} /></button>
                    )}
                </div>
                <div className="max-h-40 overflow-y-auto">
                    {payments.map(p => (
                        <div key={p.id} className="flex justify-between items-center p-3 border-b border-white/5 text-sm">
                            <span className="capitalize">{p.type === 'MONEY' ? 'Dinheiro' : p.type === 'CARD' ? 'Cartão' : 'Pix'}</span>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-white">{formatCurrency(p.amount)}</span>
                                {p.client && <span className="text-xs text-gray-500">({p.client})</span>}
                            </div>
                        </div>
                    ))}
                    {payments.length === 0 && <div className="p-4 text-center text-xs text-gray-500">Nenhum pagamento lançado</div>}
                </div>
            </div>

            <div className="flex-1"></div>

            {/* Bottom Section */}
            <div className="bg-[#00223A] mt-auto">
                {!isFullyPaid ? (
                    <>
                        <div className="bg-[#FF5722] p-3 flex justify-between items-center font-bold text-white">
                            <span>Falta receber</span>
                            <span>{formatCurrency(remaining)}</span>
                        </div>
                        {/* Split Controls */}
                        <div className="p-4 border-b border-white/10 flex items-center justify-between">
                            <span className="text-sm font-medium">Dividir por:</span>
                            <div className="flex items-center gap-4">
                                <button onClick={() => handleSplit(-1)} className="w-8 h-8 rounded-full bg-[#003152] flex items-center justify-center hover:bg-black/20 text-white font-bold">-</button>
                                <span className="font-bold w-4 text-center">{splitCount}</span>
                                <button onClick={() => handleSplit(1)} className="w-8 h-8 rounded-full bg-[#00BB00] flex items-center justify-center hover:bg-green-600 text-white font-bold">+</button>
                            </div>
                            <span className="text-sm font-bold">{formatCurrency(splitValue)}</span>
                        </div>
                        {/* Action Buttons */}
                        <div className="p-4 grid grid-cols-3 gap-4">
                            <button onClick={() => handleOpenPayment('MONEY')} className="bg-[#0099FF] rounded-md py-4 font-bold flex flex-col items-center justify-center gap-1 hover:bg-blue-600 transition-colors"><Wallet size={24} /><span>Dinheiro</span></button>
                            <button onClick={() => handleOpenPayment('CARD')} className="bg-[#0099FF] rounded-md py-4 font-bold flex flex-col items-center justify-center gap-1 hover:bg-blue-600 transition-colors"><CreditCard size={24} /><span>Cartão</span></button>
                            <button onClick={() => handleOpenPayment('PIX')} className="bg-[#0099FF] rounded-md py-4 font-bold flex flex-col items-center justify-center gap-1 hover:bg-blue-600 transition-colors"><QrCode size={24} /><span>Pix</span></button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="bg-green-500 p-3 flex justify-center items-center font-bold text-white gap-2">
                            <CheckCircle size={20} />
                            <span>O valor total foi pago</span>
                        </div>
                        <div className="p-4">
                            <button
                                onClick={handleCloseTable}
                                className="w-full bg-[#0099FF] text-white font-bold py-4 rounded-md hover:bg-blue-600 transition-colors text-lg"
                            >
                                Fechar mesa
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* PAYMENT MODAL */}
            <AnimatePresence>
                {paymentModalType && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-0 sm:p-4">
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="bg-white w-full max-w-lg rounded-t-xl sm:rounded-xl overflow-hidden text-gray-800">
                            <div className="flex justify-between items-center p-4 border-b border-gray-100">
                                <h3 className="font-bold text-lg">{paymentModalType === 'MONEY' ? 'Pagar com Dinheiro' : paymentModalType === 'CARD' ? 'Pagar com Cartão' : 'Pagar com Pix'}</h3>
                                <button onClick={() => setPaymentModalType(null)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                            </div>
                            <div className="p-4 space-y-4 bg-gray-50">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Valor a pagar:</label>
                                    <input type="text" value={payValue} onChange={e => setPayValue(e.target.value)} className="w-full bg-white border border-gray-300 rounded p-3 text-gray-800 font-medium outline-none focus:border-blue-500" />
                                </div>
                                {paymentModalType === 'MONEY' && (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-1">Troco para (opcional)</label>
                                        <input type="text" value={payChange} onChange={e => setPayChange(e.target.value)} placeholder="R$ 0,00" className="w-full bg-white border border-gray-300 rounded p-3 text-gray-800 outline-none focus:border-blue-500" />
                                    </div>
                                )}
                                <div className="bg-gray-200/50 rounded p-2 flex items-center gap-2">
                                    <span className="text-sm font-bold text-gray-700 w-20">Cliente</span>
                                    <input type="text" placeholder="(opcional)" value={clientName} onChange={e => setClientName(e.target.value)} className="flex-1 bg-transparent outline-none text-sm" />
                                </div>
                            </div>
                            <div className="p-4 border-t border-gray-100">
                                <button onClick={handleAddPayment} className="w-full bg-[#0099FF] text-white font-bold py-3 rounded-md hover:bg-blue-600 transition-colors">Confirmar Pagamento</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* CLEAR CONFIRMATION MODAL */}
            <AnimatePresence>
                {showClearModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-sm rounded-lg overflow-hidden text-gray-800 shadow-xl">
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="font-bold text-lg">Remover pagamentos</h3>
                                <button onClick={() => setShowClearModal(false)}><X size={20} className="text-gray-400" /></button>
                            </div>
                            <div className="p-6 text-center">
                                <p className="text-gray-600 mb-2 font-medium">Tem certeza que deseja remover todos os pagamentos lançados?</p>
                                <p className="text-gray-400 text-xs">Os pagamentos via Pix serão estornados.</p>
                            </div>
                            <div className="p-4 bg-gray-50 flex gap-3">
                                <button onClick={() => setShowClearModal(false)} className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-md">Cancelar</button>
                                <button onClick={handleClearPayments} className="flex-1 py-3 bg-[#0099FF] text-white font-bold rounded-md hover:bg-blue-600">Sim, remover</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default WaiterCloseAccount;
