import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { ChevronDown, Plus, X, Trash2, Printer, Edit, Eye, Clock, CreditCard, DollarSign, ChefHat, ArrowRightLeft, QrCode, CheckSquare, MousePointer2, Check, ArrowLeft } from 'lucide-react';
import OrderDetailsModal from './OrderDetailsModal';
import TransferTableModal from './TransferTableModal';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
// import { printOrder } from '../utils/printReceipt'; // Unused for now
import PrintConferenceModal from './PrintConferenceModal';
import { useNavigate } from 'react-router-dom';

interface TableDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    tableId: number;
    tableName: string;
    establishmentId: string;
    onNewOrder: () => void;
}

export default function TableDetailsModal({ isOpen, onClose, tableId, tableName, establishmentId, onNewOrder }: TableDetailsModalProps) {
    // Table State
    const [currentTableId, setCurrentTableId] = useState(tableId);
    const [currentTableName, setCurrentTableName] = useState(tableName);
    const [occupiedTables, setOccupiedTables] = useState<any[]>([]);

    const [orders, setOrders] = useState<any[]>([]);
    const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<any>(null); // New state for modal
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false); // State for Transfer Modal
    const [editingPaymentIndex, setEditingPaymentIndex] = useState<number | null>(null); // Track editing payment
    // @ts-ignore - loading is used in fetchOrders
    const [loading, setLoading] = useState(true);

    // UI States
    const [isTableDropdownOpen, setIsTableDropdownOpen] = useState(false);
    const [expandedPrintingMenu, setExpandedPrintingMenu] = useState(false);
    const [isActionsDropdownOpen, setIsActionsDropdownOpen] = useState(false);
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [showMobileOrders, setShowMobileOrders] = useState(false); // Mobile toggle for orders list


    // Adjustment States
    const [activeTab, setActiveTab] = useState<'discount' | 'surcharge' | null>(null);
    const [adjustmentType, setAdjustmentType] = useState<'value' | 'percent'>('value');
    const [tempAdjustmentValue, setTempAdjustmentValue] = useState('');

    // Applied Adjustments
    const [discount, setDiscount] = useState({ type: 'value', value: 0 });
    const [surcharge, setSurcharge] = useState({ type: 'value', value: 0 });

    // Payment States
    const [payments, setPayments] = useState<any[]>([]);
    const [paymentMethod, setPaymentMethod] = useState<'money' | 'card' | 'pix' | null>(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [serviceFeeEnabled, setServiceFeeEnabled] = useState(false);
    const [changeAmount, setChangeAmount] = useState('');
    const [splitCount, setSplitCount] = useState(1);

    // New Payment Modal State
    const [paymentModal, setPaymentModal] = useState({
        isOpen: false,
        type: 'money' as 'money' | 'card' | 'pix',
        amount: '',
        serviceFeeEnabled: true,
        serviceFeeType: 'proportional' as 'proportional' | 'full',
        change: ''
    });

    const handleOpenPaymentModal = (type: 'money' | 'card' | 'pix') => {
        setPaymentMethod(null); // Close inline forms if open
        // Default amount is remaining total or split value
        const defaultAmount = payments.length > 0 ? remainingTotal : splitValue;

        setPaymentModal({
            isOpen: true,
            type,
            amount: defaultAmount.toFixed(2).replace('.', ','),
            serviceFeeEnabled: true,
            serviceFeeType: 'proportional',
            change: ''
        });
    };

    const handleClosePaymentModal = () => {
        setPaymentModal(prev => ({ ...prev, isOpen: false }));
    };

    const handlePaymentModalSubmit = async () => {
        // Validation and Submission Logic
        const amountStr = paymentModal.amount;
        if (!amountStr) {
            toast.error('Digite o valor a ser pago');
            return;
        }

        const amountValue = Number(amountStr.replace(/\D/g, '')) / 100;
        if (isNaN(amountValue) || amountValue <= 0) {
            toast.error('Valor inválido');
            return;
        }

        // Calculate Fee
        let feeValue = 0;
        if (paymentModal.serviceFeeEnabled) {
            if (paymentModal.serviceFeeType === 'proportional') {
                feeValue = amountValue * 0.10;
            } else {
                // Full service fee based on table subtotal
                // We need to calculate full service fee (10% of subtotal)
                // But wait, if we pay "Full", do we pay the remaining full fee? 
                // Let's assume Full = 10% of global subtotal.
                feeValue = subtotal * 0.10;
            }
        }

        const totalPayment = amountValue + feeValue;

        const newPayment = {
            method: paymentModal.type,
            amount: totalPayment,
            change: paymentModal.type === 'money' ? paymentModal.change : null,
            // We might want to store metadata about fee type if backend supports it, but for now just amount
        };

        const updatedPayments = [...payments, newPayment];

        try {
            const { error } = await supabase
                .from('orders')
                .update({ payment_methods: updatedPayments })
                .eq('id', orders[0].id);

            if (error) throw error;

            setPayments(updatedPayments);
            toast.success('Pagamento adicionado!');
            handleClosePaymentModal();
        } catch (err) {
            console.error('Error saving payment:', err);
            toast.error('Erro ao salvar pagamento');
        }
    };

    useEffect(() => {
        if (isOpen) {
            setCurrentTableId(tableId);
            setCurrentTableName(tableName);
        }
    }, [isOpen, tableId, tableName]);

    useEffect(() => {
        if (isOpen && currentTableId) {
            fetchOrders();
            fetchOccupiedTables();
        }
    }, [isOpen, currentTableId]);

    const fetchOccupiedTables = async () => {
        try {
            const { data } = await supabase
                .from('restaurant_tables')
                .select('id, name')
                .eq('establishment_id', establishmentId)
                .eq('status', 'active'); // Changed from 'occupied' to 'active' to show all available tables for now, preventing empty list if 'occupied' isn't used.

            if (data) setOccupiedTables(data);
        } catch (error) {
            console.error('Error fetching occupied tables:', error);
        }
    };

    const fetchOrders = async () => {
        if (!currentTableId || !establishmentId) return;

        try {
            setLoading(true);
            console.log('Fetching orders for:', { currentTableId, establishmentId });

            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    customer:customers!left(name, phone)
                `)
                .eq('table_id', currentTableId)
                .eq('establishment_id', establishmentId)
                .in('status', ['PENDING', 'PREPARING', 'READY'])
                .order('created_at', { ascending: true })
                .order('id', { ascending: true });

            if (error) throw error;
            console.log('Orders fetched:', data);
            setOrders(data || []);
            // Initialize payments from the first order if available
            if (data && data.length > 0 && data[0].payment_methods && Array.isArray(data[0].payment_methods)) {
                setPayments(data[0].payment_methods);
            } else {
                setPayments([]);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calculations
    const subtotal = orders.reduce((acc, order) => acc + (order.total_amount || 0), 0);

    // Calculate Discount amount
    const discountAmount = discount.type === 'value'
        ? discount.value
        : subtotal * (discount.value / 100);

    // Calculate Surcharge amount (manual)
    const surchargeAmount = surcharge.type === 'value'
        ? surcharge.value
        : subtotal * (surcharge.value / 100);

    // Calculate Service Fee (10% of subtotal AFTER discount? Usually subtotal before, but let's stick to simple subtotal * 0.10 for now as previously implemented)
    // Actually, service fee is usually on the subtotal.
    const serviceFee = serviceFeeEnabled ? subtotal * 0.10 : 0;

    const total = Math.max(0, subtotal + serviceFee + surchargeAmount - discountAmount);

    // Derived values (Moved up for scope access)
    const splitValue = total / (splitCount || 1);
    const totalPaid = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    const remainingTotal = Math.max(0, total - totalPaid);

    const handleDeletePayment = async (index: number) => {
        if (!confirm('Tem certeza que deseja excluir este pagamento?')) return;

        const updatedPayments = payments.filter((_, i) => i !== index);

        try {
            const { error } = await supabase
                .from('orders')
                .update({ payment_methods: updatedPayments })
                .eq('id', orders[0].id);

            if (error) throw error;

            setPayments(updatedPayments);
        } catch (err) {
            console.error('Error deleting payment:', err);
            alert('Erro ao excluir pagamento');
        }
    };

    const handleCloseAccount = async () => {
        if (remainingTotal > 0.1) {
            alert('A conta precisa estar totalmente paga para encerrar.');
            return;
        }

        if (!confirm('Deseja realmente fechar a conta e liberar a mesa?')) return;

        try {
            // Update all visible orders to 'DELIVERED' (or 'COMPLETED' if that is the convention, but DELIVERED is excluded in the query)
            // Using DELIVERED effectively frees the table in the current logic.
            const { error } = await supabase
                .from('orders')
                .update({ status: 'DELIVERED' })
                .in('id', orders.map(o => o.id));

            if (error) throw error;

            toast.success('Conta fechada com sucesso! Mesa liberada.');
            onClose();
        } catch (err) {
            console.error('Error closing account:', err);
            alert('Erro ao fechar conta.');
        }
    };

    const handleApplyAdjustment = () => {
        const value = parseFloat(tempAdjustmentValue.replace(',', '.')) || 0;
        if (activeTab === 'discount') {
            setDiscount({ type: adjustmentType, value });
        } else if (activeTab === 'surcharge') {
            setSurcharge({ type: adjustmentType, value });
        }
        setActiveTab(null);
        setTempAdjustmentValue('');
    };

    // Reset payment amount when method changes or split value changes


    const handleEditPayment = (index: number) => {
        const payment = payments[index];
        setEditingPaymentIndex(index);
        setPaymentMethod(payment.method);

        // Format amount for display (assuming standard float storage)
        const formattedAmount = payment.amount.toFixed(2).replace('.', ',');
        setPaymentAmount(formattedAmount);

        // Logic to detect if fee was applied is tricky if we don't store "baseAmount" vs "totalAmount" separate.
        // For now, we assume user sets the final amount they want to pay.
        // Or if we want to reverse engineer: if amount / 1.1 matches a clean number? No, unsafe.
        // Simplification: We set the amount as the total value to edit.
        setServiceFeeEnabled(false);

        if (payment.change) {
            setChangeAmount(payment.change);
        } else {
            setChangeAmount('');
        }
    };

    const handleCancelEdit = () => {
        setEditingPaymentIndex(null);
        setPaymentMethod(null);
        setPaymentAmount('');
        setServiceFeeEnabled(false);
        setChangeAmount('');
    };

    const formatCurrencyInput = (value: string) => {
        const digits = value.replace(/\D/g, '');
        const numberValue = Number(digits) / 100;
        return numberValue.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (value: string) => void) => {
        const value = e.target.value;
        setter(formatCurrencyInput(value));
    };

    const handleAddPayment = async () => {
        if (!paymentMethod || !paymentAmount) {
            toast.error('Preencha o valor e a forma de pagamento');
            return;
        }

        // Parse "1.234,56" -> 1234.56
        const amountValue = Number(paymentAmount.replace(/\D/g, '')) / 100;

        if (isNaN(amountValue) || amountValue <= 0) {
            toast.error('Valor inválido');
            return;
        }

        const feeValue = serviceFeeEnabled ? amountValue * 0.1 : 0;
        const totalPayment = amountValue + feeValue;

        const newPayment = {
            method: paymentMethod,
            amount: totalPayment,
            change: paymentMethod === 'money' ? changeAmount : null
        };

        let updatedPayments;
        if (editingPaymentIndex !== null) {
            updatedPayments = [...payments];
            updatedPayments[editingPaymentIndex] = newPayment;
        } else {
            updatedPayments = [...payments, newPayment];
        }

        try {
            const { error } = await supabase
                .from('orders')
                .update({ payment_methods: updatedPayments })
                .eq('id', orders[0].id);

            if (error) throw error;

            setPayments(updatedPayments);
            handleCancelEdit(); // Resets form
            toast.success(editingPaymentIndex !== null ? 'Pagamento atualizado!' : 'Pagamento adicionado!');
        } catch (err) {
            console.error('Error saving payment:', err);
            toast.error('Erro ao salvar pagamento');
        }
    };

    // Reset payment amount when method changes or split value changes
    useEffect(() => {
        if (paymentMethod) {
            const defaultAmount = payments.length > 0 ? remainingTotal : splitValue;
            setPaymentAmount(formatCurrencyInput(defaultAmount.toFixed(2)));
        }
    }, [paymentMethod, splitValue, remainingTotal, payments.length]);

    const toggleTab = (tab: 'discount' | 'surcharge') => {
        if (activeTab === tab) {
            setActiveTab(null);
        } else {
            setActiveTab(tab);
            setTempAdjustmentValue('');
            setAdjustmentType('value'); // Reset to default
        }
    };

    // Helper to parse items
    const parseItems = (items: any) => {
        return typeof items === 'string' ? JSON.parse(items) : items || [];
    };

    const navigate = useNavigate();

    const handleDeleteOrder = async (orderId: number) => {
        if (!confirm('Tem certeza que deseja excluir este pedido?')) return;

        try {
            const { error } = await supabase
                .from('orders')
                .delete()
                .eq('id', orderId);

            if (error) throw error;

            // Refresh orders
            if (currentTableId) {
                fetchOrders();
            }
        } catch (error) {
            console.error('Error deleting order:', error);
            alert('Erro ao excluir pedido');
        }
    };

    const handlePrintIndividualOrder = (order: any) => {
        // Mock print for individual order
        alert(`Imprimindo pedido #${order.id} `);
    };

    const handlePrintOrders = () => {
        // Mock print for kitchen/bar orders
        alert('Enviando pedidos para impressão na Cozinha/Bar');
    };

    const handleNavigateToPDV = (orderId: number) => {
        navigate('/pdv', { state: { orderId } });
        onClose();
    };

    const handleUpdateStatus = async (orderId: number, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId);

            if (error) throw error;

            // Show custom success notification
            if (newStatus === 'READY') {
                const notification = document.createElement('div');
                notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-[100] flex items-center gap-2 animate-in slide-in-from-top duration-300';
                notification.innerHTML = `
        < svg xmlns = "http://www.w3.org/2000/svg" width = "20" height = "20" viewBox = "0 0 24 24" fill = "none" stroke = "currentColor" stroke - width="2" stroke - linecap="round" stroke - linejoin="round" ><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><path d="m9 11 3 3L22 4"></path></svg >
                    <span class="font-medium">Sucesso! O pedido foi atualizado para entregue.</span>
                    <button onclick="this.parentElement.remove()" class="ml-4 hover:bg-green-600 rounded p-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
    `;
                document.body.appendChild(notification);

                // Auto dismiss
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.classList.add('opacity-0', 'pointer-events-none');
                        setTimeout(() => notification.remove(), 300);
                    }
                }, 3000);
            }

            fetchOrders(); // Refresh list
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Erro ao atualizar status');
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Order Details Modal Integration */}
                    {selectedOrderForDetails && (
                        <OrderDetailsModal
                            isOpen={!!selectedOrderForDetails}
                            onClose={() => setSelectedOrderForDetails(null)}
                            order={selectedOrderForDetails}
                            onUpdateStatus={(newStatus) => handleUpdateStatus(selectedOrderForDetails.id, newStatus)}
                            onDelete={() => {
                                handleDeleteOrder(selectedOrderForDetails.id);
                                setSelectedOrderForDetails(null);
                            }}
                        />
                    )}

                    {/* Transfer Table Modal */}
                    {isTransferModalOpen && (
                        <TransferTableModal
                            isOpen={isTransferModalOpen}
                            onClose={() => setIsTransferModalOpen(false)}
                            sourceTableId={currentTableId || 0}
                            sourceTableName={currentTableName}
                            establishmentId={establishmentId}
                            onSuccess={() => {
                                // Reload logic - maybe close details modal or refresh?
                                // User asked to "Close automatically" the table.
                                // If transferred, this TABLE is now closed/empty?
                                // "A mesa atual será fechada automaticamente" in my implementation plan.
                                // In TransferTableModal, orders are moved.
                                // So THIS table has 0 orders.
                                fetchOrders(); // Will show 0 orders
                                onClose(); // Close details modal as table is now free/empty?
                                // Or refresh to show empty state?
                                // Let's refresh and let user decide to close, or close immediately.
                                // Plan: "Verify Table 1 is now Free".
                                onClose();
                            }}
                        />
                    )}

                    <motion.div
                        key="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
                        onClick={onClose}
                    />
                    <motion.div
                        key="modal-content"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 md:inset-6 bg-white md:rounded-xl rounded-none shadow-2xl z-[70] overflow-hidden flex flex-col"
                    >
                        {/* Desktop Header */}
                        <div className="hidden md:flex justify-between items-center p-4 border-b border-gray-200 bg-white z-30">
                            {/* Table Selector Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsTableDropdownOpen(!isTableDropdownOpen)}
                                    className="flex items-center gap-2 text-xl font-bold text-gray-800 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    Mesa {currentTableName}
                                    <ChevronDown size={20} className={`transform transition-transform ${isTableDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isTableDropdownOpen && (
                                    <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50">
                                        <div className="px-4 py-2 text-sm font-semibold text-gray-400 border-b border-gray-50 mb-1">
                                            Contas abertas ({occupiedTables.length})
                                        </div>
                                        <div className="max-h-[300px] overflow-y-auto">
                                            {occupiedTables.map(table => (
                                                <button
                                                    key={table.id}
                                                    onClick={() => {
                                                        setCurrentTableId(table.id);
                                                        setCurrentTableName(table.name);
                                                        setIsTableDropdownOpen(false);
                                                    }}
                                                    className={`w-full text-left px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center justify-between ${currentTableId === table.id ? 'bg-blue-50 text-blue-600 font-medium' : ''}`}
                                                >
                                                    Mesa {table.name}
                                                    {currentTableId === table.id && <CheckSquare size={16} className="text-blue-500" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Global Actions Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setIsActionsDropdownOpen(!isActionsDropdownOpen)}
                                        className="bg-[#0099FF] text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-600 transition-colors shadow-sm"
                                    >
                                        Ações
                                        <ChevronDown size={18} />
                                    </button>

                                    {isActionsDropdownOpen && (
                                        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50">
                                            <button
                                                onClick={() => {
                                                    setIsActionsDropdownOpen(false);
                                                    setIsTransferModalOpen(true);
                                                }}
                                                className="w-full text-left px-4 py-3 text-gray-700 hover:bg-blue-50 flex items-center gap-3 transition-colors border-b border-gray-50">
                                                <ArrowRightLeft size={18} className="text-gray-500" />
                                                Transferir entre mesas
                                            </button>
                                            <button className="w-full text-left px-4 py-3 text-gray-700 hover:bg-blue-50 flex items-center gap-3 transition-colors border-b border-gray-50">
                                                <QrCode size={18} className="text-gray-500" />
                                                Ver QR Code
                                            </button>

                                            {/* Nested Accordion for Printing */}
                                            <div className="border-b border-gray-50">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setExpandedPrintingMenu(!expandedPrintingMenu);
                                                    }}
                                                    className="w-full text-left px-4 py-3 text-gray-700 hover:bg-blue-50 flex items-center justify-between transition-colors bg-blue-50/50"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Printer size={18} className="text-[#0099FF]" />
                                                        <span className="font-medium text-[#0099FF]">Imprimir conferência</span>
                                                    </div>
                                                    <ChevronDown size={16} className={`text-[#0099FF] transform transition-transform ${expandedPrintingMenu ? 'rotate-180' : ''}`} />
                                                </button>

                                                {expandedPrintingMenu && (
                                                    <div className="bg-gray-50">
                                                        <button
                                                            onClick={() => {
                                                                setIsActionsDropdownOpen(false);
                                                                handlePrintOrders();
                                                            }}
                                                            className="w-full text-left pl-11 pr-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 flex items-center gap-2"
                                                        >
                                                            <ChefHat size={16} />
                                                            Imprimir pedidos
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setIsActionsDropdownOpen(false);
                                                                setShowPrintModal(true);
                                                            }}
                                                            className="w-full text-left pl-11 pr-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 flex items-center gap-2"
                                                        >
                                                            <DollarSign size={16} />
                                                            Imprimir valores
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={onNewOrder}
                                    className="bg-[#0099FF] text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-600 transition-colors shadow-sm"
                                >
                                    <Plus size={18} />
                                    Novo Pedido
                                </button>
                                <div className="h-8 w-px bg-gray-200 mx-2"></div>
                                <button
                                    onClick={onClose}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Mobile Header (Screenshot Match) */}
                        <div className="md:hidden flex items-center p-4 border-b border-gray-100 bg-white z-30">
                            <button onClick={onClose} className="p-1 -ml-1 text-gray-700">
                                <ArrowLeft size={24} />
                            </button>
                            <h2 className="ml-4 text-xl font-bold text-gray-800">Fechar Mesa {currentTableName}</h2>
                        </div>

                        {isActionsDropdownOpen && !showMobileOrders && (
                            <div className="absolute top-16 right-4 w-56 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50">
                                <button
                                    onClick={() => {
                                        setIsActionsDropdownOpen(false);
                                        setIsTransferModalOpen(true);
                                    }}
                                    className="w-full text-left px-4 py-3 text-gray-700 hover:bg-blue-50 flex items-center gap-3 transition-colors">
                                    <ArrowRightLeft size={18} className="text-gray-500" />
                                    Transferir mesa
                                </button>
                                <button
                                    onClick={() => {
                                        setIsActionsDropdownOpen(false);
                                        handlePrintOrders();
                                    }}
                                    className="w-full text-left px-4 py-3 text-gray-700 hover:bg-blue-50 flex items-center gap-3 transition-colors">
                                    <Printer size={18} className="text-gray-500" />
                                    Imprimir conferência
                                </button>
                            </div>
                        )}

                        {/* Content Grid */}
                        <div className="hidden md:flex flex-1 overflow-hidden relative">
                            {/* Left Side: Orders List */}
                            <div className="w-1/2 flex flex-col border-r border-gray-200 bg-gray-50/50">
                                <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center">
                                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                        <Clock size={18} className="text-blue-500" />
                                        Pedidos da Mesa ({orders.length})
                                    </h3>
                                    <div className="text-sm font-medium text-gray-500">
                                        Subtotal: <span className="text-gray-900 font-bold">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {orders.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
                                            <ChefHat size={48} strokeWidth={1} />
                                            <p>Nenhum pedido aberto</p>
                                        </div>
                                    ) : (
                                        orders.map((order) => (
                                            <div key={order.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:border-blue-200 transition-colors">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-gray-900">Pedido #{order.id}</span>
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${order.status === 'READY' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                                                }`}>
                                                                {order.status === 'READY' ? 'Pronto' : 'Em preparo'}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs text-gray-500 font-medium">{new Date(order.created_at).toLocaleTimeString('pt-BR')}</span>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => setSelectedOrderForDetails(order)}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Ver detalhes"
                                                        >
                                                            <Eye size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleNavigateToPDV(order.id)}
                                                            className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                            title="Editar no PDV"
                                                        >
                                                            <Edit size={18} />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5 mb-3">
                                                    {parseItems(order.items).slice(0, 3).map((item: any, idx: number) => (
                                                        <div key={idx} className="flex justify-between text-sm">
                                                            <span className="text-gray-600">
                                                                <span className="font-bold text-gray-800">{item.quantity}x</span> {item.name}
                                                            </span>
                                                            <span className="text-gray-500">R$ {item.total?.toFixed(2).replace('.', ',')}</span>
                                                        </div>
                                                    ))}
                                                    {parseItems(order.items).length > 3 && (
                                                        <div className="text-xs text-blue-500 font-medium">+{parseItems(order.items).length - 3} itens...</div>
                                                    )}
                                                </div>

                                                <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total do Pedido</span>
                                                    <span className="text-sm font-bold text-gray-900">R$ {order.total_amount?.toFixed(2).replace('.', ',')}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Right Side: Account Actions & Payments */}
                            <div className="w-1/2 flex flex-col bg-white overflow-y-auto">
                                <div className="p-6 space-y-6 pb-32">
                                    {/* Subtotal & Adjustments */}
                                    <div className="bg-gray-50 p-5 rounded-xl space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600 font-medium">Subtotal</span>
                                            <span className="text-gray-900 font-bold">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => toggleTab('discount')}
                                                className={`py-3 px-4 rounded-xl font-bold flex flex-col items-center gap-1 transition-all border-2 ${activeTab === 'discount' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Trash2 size={18} />
                                                    Desconto
                                                </div>
                                                <span className="text-xs font-medium">
                                                    {discount.value > 0 ? `- R$ ${discountAmount.toFixed(2).replace('.', ',')}` : 'Adicionar'}
                                                </span>
                                            </button>
                                            <button
                                                onClick={() => toggleTab('surcharge')}
                                                className={`py-3 px-4 rounded-xl font-bold flex flex-col items-center gap-1 transition-all border-2 ${activeTab === 'surcharge' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Plus size={18} />
                                                    Acréscimo
                                                </div>
                                                <span className="text-xs font-medium">
                                                    {surcharge.value > 0 ? `+ R$ ${surchargeAmount.toFixed(2).replace('.', ',')}` : 'Adicionar'}
                                                </span>
                                            </button>
                                        </div>

                                        {activeTab && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4"
                                            >
                                                <div className="flex bg-gray-100 p-1 rounded-lg">
                                                    <button
                                                        onClick={() => setAdjustmentType('value')}
                                                        className={`flex-1 py-1.5 rounded-md text-sm font-bold transition-all ${adjustmentType === 'value' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                                                    >
                                                        R$ Reais
                                                    </button>
                                                    <button
                                                        onClick={() => setAdjustmentType('percent')}
                                                        className={`flex-1 py-1.5 rounded-md text-sm font-bold transition-all ${adjustmentType === 'percent' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                                                    >
                                                        % Porcentagem
                                                    </button>
                                                </div>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={tempAdjustmentValue}
                                                        onChange={(e) => handleCurrencyChange(e, setTempAdjustmentValue)}
                                                        placeholder={adjustmentType === 'value' ? '0,00' : '0'}
                                                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-lg font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                                    />
                                                    <button
                                                        onClick={handleApplyAdjustment}
                                                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                                                    >
                                                        Aplicar
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}

                                        <div className="flex justify-between items-center py-2 border-t border-gray-200/50">
                                            <div className="flex items-center gap-2">
                                                <CheckSquare size={18} className={`transition-colors ${serviceFeeEnabled ? 'text-blue-500' : 'text-gray-400'}`} />
                                                <span className="text-gray-600 font-medium">Taxa de serviço (10%)</span>
                                            </div>
                                            <button
                                                onClick={() => setServiceFeeEnabled(!serviceFeeEnabled)}
                                                className={`w-12 h-6 rounded-full transition-colors relative ${serviceFeeEnabled ? 'bg-blue-500' : 'bg-gray-200'}`}
                                            >
                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${serviceFeeEnabled ? 'left-7' : 'left-1'}`} />
                                            </button>
                                        </div>

                                        <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                                            <span className="text-lg font-black text-gray-900">Total a pagar</span>
                                            <span className="text-2xl font-black text-blue-600">R$ {total.toFixed(2).replace('.', ',')}</span>
                                        </div>
                                    </div>

                                    {/* Payment Section */}
                                    <div className="space-y-4">
                                        <h4 className="font-bold text-gray-700 uppercase text-xs tracking-wider">Forma de Pagamento</h4>
                                        <div className="grid grid-cols-3 gap-3">
                                            <button
                                                onClick={() => handleOpenPaymentModal('money')}
                                                className={`p-4 rounded-xl border-2 font-bold flex flex-col items-center gap-2 transition-all ${paymentModal.isOpen && paymentModal.type === 'money' ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-sm' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'
                                                    }`}
                                            >
                                                <DollarSign size={24} />
                                                Dinheiro
                                            </button>
                                            <button
                                                onClick={() => handleOpenPaymentModal('card')}
                                                className={`p-4 rounded-xl border-2 font-bold flex flex-col items-center gap-2 transition-all ${paymentModal.isOpen && paymentModal.type === 'card' ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-sm' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'
                                                    }`}
                                            >
                                                <CreditCard size={24} />
                                                Cartão
                                            </button>
                                            <button
                                                onClick={() => setPaymentMethod('pix')}
                                                className={`p-4 rounded-xl border-2 font-bold flex flex-col items-center gap-2 transition-all ${paymentMethod === 'pix' ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-sm' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'
                                                    }`}
                                            >
                                                <QrCode size={24} />
                                                PIX
                                            </button>
                                        </div>

                                        {paymentMethod === 'pix' && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4"
                                            >
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-black text-gray-400 uppercase">Valor a pagar</label>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400">R$</span>
                                                            <input
                                                                type="text"
                                                                value={paymentAmount}
                                                                onChange={(e) => handleCurrencyChange(e, setPaymentAmount)}
                                                                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-xl font-black text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                                            />
                                                        </div>
                                                    </div>

                                                </div>
                                                <div className="flex gap-3">
                                                    {editingPaymentIndex !== null && (
                                                        <button
                                                            onClick={handleCancelEdit}
                                                            className="flex-1 py-3.5 border-2 border-gray-200 text-gray-500 rounded-xl font-bold hover:bg-gray-100 transition-all"
                                                        >
                                                            Cancelar
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={handleAddPayment}
                                                        className="flex-[2] py-3.5 bg-blue-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                                                    >
                                                        <Check size={20} />
                                                        {editingPaymentIndex !== null ? 'Salvar Edição' : 'Confirmar Pagamento'}
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>

                                    {/* Applied Payments */}
                                    {payments.length > 0 && (
                                        <div className="space-y-3">
                                            <h4 className="font-bold text-gray-700 uppercase text-xs tracking-wider">Pagamentos Aplicados</h4>
                                            <div className="space-y-2">
                                                {payments.map((p, idx) => (
                                                    <div key={`payment-${idx}-${p.method}`} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                                                {p.method === 'money' ? <DollarSign size={18} /> :
                                                                    p.method === 'card' ? <CreditCard size={18} /> : <QrCode size={18} />}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-gray-800 capitalize">{p.method}</div>
                                                                {p.change && <div className="text-xs text-gray-500">Troco para R$ {p.change}</div>}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <span className="font-black text-gray-900">R$ {p.amount.toFixed(2).replace('.', ',')}</span>
                                                            <div className="flex gap-1">
                                                                <button onClick={() => handleEditPayment(idx)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                                    <Edit size={16} />
                                                                </button>
                                                                <button onClick={() => handleDeletePayment(idx)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Desktop Sticky Footer */}
                                <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-6 flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-40">
                                    <div className="flex flex-col">
                                        <span className={`text-xs font-black uppercase tracking-widest ${remainingTotal > 0.1 ? 'text-red-500' : 'text-green-600'}`}>
                                            {remainingTotal > 0.1 ? 'Pendente' : 'Pago'}
                                        </span>
                                        <span className="text-2xl font-black text-gray-900">
                                            R$ {remainingTotal.toFixed(2).replace('.', ',')}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-3 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                                            <button
                                                onClick={() => setSplitCount(Math.max(1, splitCount - 1))}
                                                className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-gray-500 hover:border-gray-300 transition-all font-black"
                                            >
                                                -
                                            </button>
                                            <div className="flex flex-col items-center px-1">
                                                <span className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Dividir</span>
                                                <span className="text-xl font-black text-gray-800 leading-none">{splitCount}x</span>
                                            </div>
                                            <button
                                                onClick={() => setSplitCount(splitCount + 1)}
                                                className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-gray-500 hover:border-gray-300 transition-all font-black"
                                            >
                                                +
                                            </button>
                                        </div>

                                        <button
                                            onClick={handleCloseAccount}
                                            disabled={remainingTotal > 0.1}
                                            className={`px-8 py-4 rounded-xl font-black text-lg transition-all shadow-lg ${remainingTotal > 0.1
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                                                : 'bg-[#FF4D4D] text-white shadow-red-100 hover:bg-red-600 active:scale-[0.98]'
                                                }`}
                                        >
                                            FECHAR CONTA
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Content (Scrollable) */}
                        <div className="md:hidden flex-1 overflow-y-auto bg-white flex flex-col pb-44">
                            {!showMobileOrders ? (
                                <div className="px-4 pt-4 pb-4 space-y-4">
                                    {/* Ver Pedidos Toggle - Screenshot exact */}
                                    <button
                                        onClick={() => setShowMobileOrders(true)}
                                        className="w-full py-3 border border-gray-300 text-[#0099FF] rounded-lg font-semibold text-base flex items-center justify-center bg-white active:bg-gray-50 transition-colors"
                                    >
                                        Ver pedidos
                                    </button>

                                    {/* Desconto / Acréscimo - Screenshot exact: two cells inside a single bordered container */}
                                    <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                                        <button
                                            onClick={() => toggleTab('discount')}
                                            className="flex-1 py-3 text-gray-600 text-sm bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors border-r border-gray-300"
                                        >
                                            Desconto
                                        </button>
                                        <button
                                            onClick={() => toggleTab('surcharge')}
                                            className="flex-1 py-3 text-gray-600 text-sm bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors"
                                        >
                                            Acréscimo
                                        </button>
                                    </div>

                                    {activeTab && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-lg space-y-5"
                                        >
                                            <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-xl">
                                                <button
                                                    onClick={() => setAdjustmentType('value')}
                                                    className={`py-2 rounded-lg text-sm font-black transition-all ${adjustmentType === 'value' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                                                >
                                                    REAL (R$)
                                                </button>
                                                <button
                                                    onClick={() => setAdjustmentType('percent')}
                                                    className={`py-2 rounded-lg text-sm font-black transition-all ${adjustmentType === 'percent' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                                                >
                                                    PORC. (%)
                                                </button>
                                            </div>
                                            <div className="space-y-3">
                                                <input
                                                    type="text"
                                                    value={tempAdjustmentValue}
                                                    onChange={(e) => handleCurrencyChange(e, setTempAdjustmentValue)}
                                                    placeholder="Digite o valor"
                                                    className="w-full px-5 py-4 border border-gray-200 rounded-xl text-2xl font-black text-center text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                                />
                                                <button
                                                    onClick={handleApplyAdjustment}
                                                    className="w-full bg-gray-900 text-white py-4 rounded-xl font-black text-lg shadow-lg active:scale-[0.98] transition-all"
                                                >
                                                    APLICAR {activeTab === 'discount' ? 'DESCONTO' : 'ACRÉSCIMO'}
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Summary - Screenshot exact */}
                                    <div className="space-y-1 pt-2">
                                        <div className="flex justify-between items-center text-sm text-gray-500">
                                            <span>Subtotal</span>
                                            <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm text-gray-500">
                                            <span>Taxa de serviço (10%)</span>
                                            <span>R$ {serviceFee.toFixed(2).replace('.', ',')}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-base font-bold text-gray-900 pt-0.5">
                                            <span>Valor total:</span>
                                            <span>R$ {total.toFixed(2).replace('.', ',')}</span>
                                        </div>
                                    </div>

                                    {/* Payment Methods - Screenshot exact: dynamic label */}
                                    <div className="space-y-3 pt-2">
                                        <h4 className="text-sm text-gray-800">Escolha a {payments.length + 1}ª forma de pagamento:</h4>
                                        <div className="grid grid-cols-3 gap-2">
                                            <button
                                                onClick={() => handleOpenPaymentModal('money')}
                                                className="py-4 bg-[#0099FF] text-white rounded-lg font-bold flex flex-col items-center justify-center gap-1 active:scale-95 transition-all"
                                            >
                                                <DollarSign size={20} /> <span className="text-xs">Dinheiro</span>
                                            </button>
                                            <button
                                                onClick={() => handleOpenPaymentModal('card')}
                                                className="py-4 bg-[#0099FF] text-white rounded-lg font-bold flex flex-col items-center justify-center gap-1 active:scale-95 transition-all"
                                            >
                                                <CreditCard size={20} /> <span className="text-xs">Cartão</span>
                                            </button>
                                            <button
                                                onClick={() => handleOpenPaymentModal('pix')}
                                                className="py-4 bg-[#0099FF] text-white rounded-lg font-bold flex flex-col items-center justify-center gap-1 active:scale-95 transition-all"
                                            >
                                                <QrCode size={20} /> <span className="text-xs">Pix</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Payment Input Form (Mobile) */}
                                    {/* Mobile Inline Form Removed - Replaced by Modal */}

                                    {/* Applied Payments List - Only show when there are payments */}
                                    {payments.length > 0 && (
                                        <div className="pt-2 space-y-3">
                                            <h4 className="text-sm font-bold text-gray-900">Pagamentos</h4>
                                            <div className="space-y-4">
                                                {payments.map((p, idx) => (
                                                    <div key={`mobile-payment-${idx}-${p.method}`} className="pb-3 border-b border-gray-100">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <div className="text-sm text-gray-900">{idx + 1}º&nbsp;&nbsp;{p.method === 'money' ? 'Dinheiro' : 'Cartão'}</div>
                                                                {p.method === 'money' && <div className="text-xs text-gray-400 mt-0.5 pl-5">Troco</div>}
                                                            </div>
                                                            <div className="flex items-start gap-3">
                                                                <div className="text-right">
                                                                    <div className="text-sm text-gray-900">R$ {p.amount.toFixed(2).replace('.', ',')}</div>
                                                                    {p.method === 'money' && (
                                                                        <div className="text-xs text-gray-400 mt-0.5">
                                                                            {p.change ? (typeof p.change === 'string' ? p.change : `R$ ${p.change.toFixed(2).replace('.', ',')}`) : 'Não informado'}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <button
                                                                    onClick={() => handleDeletePayment(idx)}
                                                                    className="text-gray-300 hover:text-red-500 mt-0.5"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-1 flex-col p-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    {/* Secondary Mobile Header (Print/Actions) */}
                                    <div className="grid grid-cols-2 gap-3 mb-6">
                                        <button
                                            onClick={() => handlePrintOrders()}
                                            className="py-3 border-2 border-[#0099FF] text-[#0099FF] rounded-xl font-bold flex items-center justify-center gap-2 bg-white"
                                        >
                                            Imprimir
                                            <ChevronDown size={18} />
                                        </button>
                                        <button
                                            onClick={() => setIsActionsDropdownOpen(!isActionsDropdownOpen)}
                                            className="py-3 border-2 border-[#0099FF] text-[#0099FF] rounded-xl font-bold flex items-center justify-center gap-2 bg-white relative"
                                        >
                                            Ações
                                            <ChevronDown size={18} />
                                            {isActionsDropdownOpen && (
                                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50">
                                                    <button onClick={() => { setIsActionsDropdownOpen(false); setIsTransferModalOpen(true); }} className="w-full text-left px-4 py-3 text-sm text-gray-700 flex items-center gap-2 border-b border-gray-50">
                                                        <ArrowRightLeft size={16} /> Transferir mesa
                                                    </button>
                                                    <button onClick={() => { setIsActionsDropdownOpen(false); handlePrintIndividualOrder(orders[0]); }} className="w-full text-left px-4 py-3 text-sm text-gray-700 flex items-center gap-2">
                                                        <Printer size={16} /> Imprimir conferência
                                                    </button>
                                                </div>
                                            )}
                                        </button>
                                    </div>

                                    {/* Customer Header */}
                                    <div className="flex items-center gap-3 mb-4 p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                                        <div className="p-2 bg-gray-100 rounded-lg text-gray-400">
                                            <MousePointer2 size={20} />
                                        </div>
                                        <span className="font-bold text-gray-700">
                                            {orders[0]?.customer?.name || orders[0]?.customer_name || 'Cliente não identificado'}
                                        </span>
                                    </div>

                                    {/* Orders List */}
                                    <div className="space-y-4">
                                        {orders.map((order) => (
                                            <div key={order.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-extrabold text-[#333] tracking-tight">Pedido #{order.id}</span>
                                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${order.status === 'READY' ? 'bg-green-100 text-green-700' :
                                                                'bg-orange-50 text-orange-600'
                                                                }`}>
                                                                {order.status === 'READY' ? 'Pronto' : 'Em preparo'}
                                                            </span>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <div className="px-3 py-1 bg-gray-50 border border-gray-100 rounded-lg flex items-center gap-1.5 text-[11px] font-bold text-gray-500">
                                                                <ChefHat size={12} /> Garçom
                                                            </div>
                                                            <div className="px-3 py-1 bg-gray-50 border border-gray-100 rounded-lg flex items-center gap-1.5 text-[11px] font-bold text-gray-500">
                                                                <Clock size={12} /> {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-2 items-end">
                                                        <button className="px-4 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-500 flex items-center gap-1.5 bg-white">
                                                            Ações <ChevronDown size={12} />
                                                        </button>
                                                        <label className="flex items-center gap-2 px-3 py-1.5 bg-[#E8F4FD] border border-[#D0E9FA] rounded-lg cursor-pointer">
                                                            <input type="checkbox" checked={order.status === 'READY'} readOnly className="w-4 h-4 rounded border-gray-300 text-[#0099FF] focus:ring-[#0099FF]" />
                                                            <span className="text-[11px] font-bold text-[#0099FF]">Entregar</span>
                                                        </label>
                                                    </div>
                                                </div>

                                                <div className="space-y-2 py-3 border-t border-gray-100">
                                                    {parseItems(order.items).map((item: any, idx: number) => (
                                                        <div key={`item-${order.id}-${idx}-${item.name}`} className="flex justify-between items-center text-sm">
                                                            <span className="text-gray-600 font-medium">
                                                                <span className="text-gray-900 font-bold">{item.quantity}x</span> {item.name}
                                                            </span>
                                                            <span className="text-gray-900 font-bold">R$ {item.total?.toFixed(2).replace('.', ',')}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="pt-3 border-t border-dashed border-gray-200 flex justify-between items-center mt-2">
                                                    <span className="text-sm font-bold text-gray-800">Total</span>
                                                    <span className="text-md font-extrabold text-gray-900">R$ {order.total_amount?.toFixed(2).replace('.', ',')}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Mobile Order View Summary */}
                                    <div className="mt-6 py-4 border-t border-gray-200 space-y-1">
                                        <div className="flex justify-between text-sm font-bold text-gray-500">
                                            <span>Subtotal:</span>
                                            <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                                        </div>
                                        <div className="flex justify-between text-sm font-bold text-gray-500">
                                            <span>Taxa de serviço (10%):</span>
                                            <span>R$ {serviceFee.toFixed(2).replace('.', ',')}</span>
                                        </div>
                                        <div className="flex justify-between text-lg font-black text-gray-900 pt-1">
                                            <span>Total</span>
                                            <span>R$ {total.toFixed(2).replace('.', ',')}</span>
                                        </div>
                                    </div>


                                </div>
                            )}
                        </div>

                        {/* Mobile Sticky Footer - Compact "Tight" Layout */}
                        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-3 py-2 z-50 space-y-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                            {/* Falta bar - Compact height */}
                            {remainingTotal > 0.1 && (
                                <div className="bg-[#E8734A] rounded-md py-1.5 px-3 flex justify-between items-center">
                                    <span className="font-bold text-white text-sm">Falta</span>
                                    <span className="font-bold text-white text-sm">R$ {remainingTotal.toFixed(2).replace('.', ',')}</span>
                                </div>
                            )}

                            {/* Dividir por row - Compact */}
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-700">Dividir por:</span>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center border border-gray-300 rounded-md overflow-hidden h-8">
                                        <button onClick={() => setSplitCount(Math.max(1, splitCount - 1))} className="w-8 h-full flex items-center justify-center text-gray-500 bg-gray-50 border-r border-gray-300 text-lg hover:bg-gray-100 font-bold leading-none pb-1">−</button>
                                        <span className="w-8 h-full flex items-center justify-center font-bold text-gray-800 text-sm bg-white">{splitCount}</span>
                                        <button onClick={() => setSplitCount(splitCount + 1)} className="w-8 h-full flex items-center justify-center text-gray-500 bg-gray-50 border-l border-gray-300 text-lg hover:bg-gray-100 font-bold leading-none pb-1">+</button>
                                    </div>
                                    <span className="font-bold text-gray-800 text-sm">R$ {(total / splitCount).toFixed(2).replace('.', ',')}</span>
                                </div>
                            </div>

                            {/* Action Buttons - Stacked "Tight" */}
                            <div className="space-y-1.5">
                                {/* Selecionar itens - Compact */}
                                <button className="w-full py-2.5 border border-gray-300 text-gray-500 rounded-lg font-bold text-sm flex items-center justify-center gap-2 bg-white active:bg-gray-50 transition-colors">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
                                    Selecionar itens
                                </button>

                                {/* Fechar conta - Compact */}
                                <button
                                    onClick={handleCloseAccount}
                                    className={`w-full py-3 text-white rounded-lg font-bold text-base active:scale-[0.98] transition-all shadow-md ${remainingTotal <= 0.01
                                        ? 'bg-[#0099FF] hover:bg-blue-600'
                                        : 'bg-[#A6B8C4]'
                                        }`}
                                >
                                    Fechar conta
                                </button>
                            </div>
                        </div>

                    </motion.div>
                </>
            )}

            {/* Payment Modal */}
            <AnimatePresence>
                {paymentModal.isOpen && (
                    <div key="payment-modal" className="fixed inset-0 z-[80] flex items-end md:items-center justify-center sm:p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={handleClosePaymentModal}
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 500 }}
                            className="bg-white rounded-t-2xl md:rounded-2xl shadow-xl w-full max-w-sm relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Header */}
                            <div className="flex justify-between items-center p-4 border-b border-gray-100">
                                <h3 className="text-xl font-bold text-gray-800">
                                    Pagar com {paymentModal.type === 'money' ? 'Dinheiro' : paymentModal.type === 'card' ? 'Cartão' : 'Pix'}
                                </h3>
                                <button onClick={handleClosePaymentModal} className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-5 space-y-5 overflow-y-auto">
                                {/* Amount Input */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-800">Digite o valor a ser pago:</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={paymentModal.amount}
                                            onChange={(e) => {
                                                const val = formatCurrencyInput(e.target.value);
                                                setPaymentModal(prev => ({ ...prev, amount: val }));
                                            }}
                                            className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg text-lg font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="0,00"
                                            inputMode="numeric"
                                        />
                                        <div className="absolute right-0 top-0 bottom-0 px-4 flex items-center border-l border-gray-300 text-gray-500 bg-gray-50 rounded-r-lg">
                                            <span className="text-lg font-bold">$</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Service Fee */}
                                <div className="space-y-4 pt-1">
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-gray-800 text-base">Taxa de serviço</span>
                                        <button
                                            onClick={() => setPaymentModal(prev => ({ ...prev, serviceFeeEnabled: !prev.serviceFeeEnabled }))}
                                            className={`w-12 h-7 rounded-full transition-colors relative ${paymentModal.serviceFeeEnabled ? 'bg-[#0099FF]' : 'bg-gray-200'}`}
                                        >
                                            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${paymentModal.serviceFeeEnabled ? 'left-6' : 'left-1'}`} />
                                        </button>
                                    </div>

                                    {paymentModal.serviceFeeEnabled && (
                                        <div className="space-y-3 pl-1">
                                            <label className="flex items-center justify-between cursor-pointer group">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentModal.serviceFeeType === 'proportional' ? 'border-[#0099FF]' : 'border-gray-300'}`}>
                                                        {paymentModal.serviceFeeType === 'proportional' && <div className="w-2.5 h-2.5 rounded-full bg-[#0099FF]" />}
                                                    </div>
                                                    <input
                                                        type="radio"
                                                        name="feeType"
                                                        className="hidden"
                                                        checked={paymentModal.serviceFeeType === 'proportional'}
                                                        onChange={() => setPaymentModal(prev => ({ ...prev, serviceFeeType: 'proportional' }))}
                                                    />
                                                    <span className="text-gray-600 text-sm">Proporcional (10%)</span>
                                                    <div className="w-4 h-4 rounded-full border border-blue-400 text-blue-500 flex items-center justify-center text-[10px] font-bold">?</div>
                                                </div>
                                                <span className="text-gray-600 text-sm">
                                                    R$ {((Number(paymentModal.amount.replace(/\D/g, '')) / 100) * 0.10).toFixed(2).replace('.', ',')}
                                                </span>
                                            </label>

                                            <label className="flex items-center justify-between cursor-pointer group">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentModal.serviceFeeType === 'full' ? 'border-[#0099FF]' : 'border-gray-300'}`}>
                                                        {paymentModal.serviceFeeType === 'full' && <div className="w-2.5 h-2.5 rounded-full bg-[#0099FF]" />}
                                                    </div>
                                                    <input
                                                        type="radio"
                                                        name="feeType"
                                                        className="hidden"
                                                        checked={paymentModal.serviceFeeType === 'full'}
                                                        onChange={() => setPaymentModal(prev => ({ ...prev, serviceFeeType: 'full' }))}
                                                    />
                                                    <span className="text-gray-600 text-sm">Integral</span>
                                                    <div className="w-4 h-4 rounded-full border border-blue-400 text-blue-500 flex items-center justify-center text-[10px] font-bold">?</div>
                                                </div>
                                                <span className="text-gray-600 text-sm">
                                                    R$ {(subtotal * 0.10).toFixed(2).replace('.', ',')}
                                                </span>
                                            </label>
                                        </div>
                                    )}
                                </div>

                                {/* Total Summary */}
                                <div className="flex justify-between items-center py-2 border-t border-gray-100 mt-2">
                                    <span className="font-bold text-gray-700 text-base">Total a pagar</span>
                                    <span className="font-bold text-gray-900 text-lg">
                                        R$ {
                                            ((Number(paymentModal.amount.replace(/\D/g, '')) / 100) +
                                                (paymentModal.serviceFeeEnabled
                                                    ? (paymentModal.serviceFeeType === 'proportional'
                                                        ? (Number(paymentModal.amount.replace(/\D/g, '')) / 100) * 0.10
                                                        : subtotal * 0.10)
                                                    : 0)
                                            ).toFixed(2).replace('.', ',')
                                        }
                                    </span>
                                </div>

                                {/* Change for Money */}
                                {paymentModal.type === 'money' && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-800">Troco para:</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={paymentModal.change}
                                                onChange={(e) => {
                                                    const val = formatCurrencyInput(e.target.value);
                                                    setPaymentModal(prev => ({ ...prev, change: val }));
                                                }}
                                                className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg text-lg font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none placeholder-gray-400"
                                                placeholder="EX.: R$ 50,00"
                                                inputMode="numeric"
                                            />
                                            <div className="absolute right-0 top-0 bottom-0 px-4 flex items-center border-l border-gray-300 text-gray-500 bg-gray-50 rounded-r-lg">
                                                <span className="text-lg font-bold">$</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-5 pt-0 mt-auto">
                                <button
                                    onClick={handlePaymentModalSubmit}
                                    className="w-full bg-[#0099FF] text-white py-3.5 rounded-lg font-bold text-lg hover:bg-blue-600 transition-colors shadow-sm active:scale-[0.98]"
                                >
                                    Pagar
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )
                }
            </AnimatePresence >

            <PrintConferenceModal
                isOpen={showPrintModal}
                onClose={() => setShowPrintModal(false)}
                orders={orders}
                tableName={`Mesa ${currentTableName}`}
                subtotal={subtotal}
                serviceFee={serviceFee}
                total={total}
            />
        </AnimatePresence >
    );
}
