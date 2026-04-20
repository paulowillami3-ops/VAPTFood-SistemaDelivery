import React, { useState, useEffect } from 'react';
import { X, DollarSign, CreditCard, Wallet, CheckCircle2, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface CloseCashierModalProps {
    isOpen: boolean;
    onClose: () => void;
    cashierId: string;
    onSuccess: () => void;
    establishmentId: string | number;
}

const CloseCashierModal: React.FC<CloseCashierModalProps> = ({ isOpen, onClose, cashierId, onSuccess, establishmentId }) => {
    const [loading, setLoading] = useState(false);
    const [openOrdersCount, setOpenOrdersCount] = useState<number | null>(null);
    const [step, setStep] = useState(1);
    const [totals, setTotals] = useState({
        money: 0,
        credit: 0,
        debit: 0,
        pix: 0,
        total: 0
    });

    // Contagem física (o que o operador diz que tem)
    const [physicalCount, setPhysicalCount] = useState({
        money: '',
        credit: '',
        debit: '',
        pix: ''
    });

    const [difference, setDifference] = useState({
        money: 0,
        credit: 0,
        debit: 0,
        pix: 0,
        total: 0
    });

    const [observations, setObservations] = useState('');

    useEffect(() => {
        if (isOpen && cashierId) {
            fetchCashierTotals();
        } else {
            // Reset state when closing
            setStep(1);
            setPhysicalCount({ money: '', credit: '', debit: '', pix: '' });
            setObservations('');
            setOpenOrdersCount(null);
        }
    }, [isOpen, cashierId]);

    // Recalculate differences whenever totals or physical count changes
    useEffect(() => {
        const moneyDiff = (Number(physicalCount.money) || 0) - totals.money;
        const creditDiff = (Number(physicalCount.credit) || 0) - totals.credit;
        const debitDiff = (Number(physicalCount.debit) || 0) - totals.debit;
        const pixDiff = (Number(physicalCount.pix) || 0) - totals.pix;

        setDifference({
            money: moneyDiff,
            credit: creditDiff,
            debit: debitDiff,
            pix: pixDiff,
            total: moneyDiff + creditDiff + debitDiff + pixDiff
        });
    }, [totals, physicalCount]);

    const fetchCashierTotals = async () => {
        try {
            setLoading(true);

            // 0. Check for open orders
            const { count: openCount, error: ordersError } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('establishment_id', establishmentId)
                .in('status', ['PENDING', 'PREPARING', 'READY']);

            if (ordersError) throw ordersError;
            setOpenOrdersCount(openCount || 0);

            if (openCount && openCount > 0) {
                setLoading(false);
                return;
            }

            // 1. Get initial balance (fundo de troco)
            const { data: cashierData, error: cashierError } = await supabase
                .from('cashier_sessions')
                .select('initial_balance')
                .eq('id', cashierId)
                .single();

            if (cashierError) throw cashierError;

            // 2. Get all payments for this session
            // We need to fetch orders that were paid during this session
            // AND cashier_transactions (entries/withdrawals)
            // For simplicity in this example we rely on a backend function or specific logic 
            // Here we just fetch hypothetical totals

            const { data, error } = await supabase
                .rpc('get_cashier_totals', { p_cashier_id: cashierId });

            if (error) {
                console.error('Error fetching totals:', error);
                // Fallback to zero or mock for now if function doesn't exist
                setTotals({
                    money: cashierData.initial_balance || 0, // Include initial balance in expected money
                    credit: 0,
                    debit: 0,
                    pix: 0,
                    total: cashierData.initial_balance || 0
                });
            } else {
                // Add initial balance to money total
                const moneyTotal = (data.money || 0) + (cashierData.initial_balance || 0);
                setTotals({
                    money: moneyTotal,
                    credit: data.credit || 0,
                    debit: data.debit || 0,
                    pix: data.pix || 0,
                    total: moneyTotal + (data.credit || 0) + (data.debit || 0) + (data.pix || 0)
                });
            }

        } catch (error) {
            console.error('Error:', error);
            toast.error('Erro ao carregar totais do caixa');
        } finally {
            setLoading(false);
        }
    };

    const handleCloseCashier = async () => {
        try {
            setLoading(true);

            // Update cashier session
            const { error } = await supabase
                .from('cashier_sessions')
                .update({
                    closed_at: new Date().toISOString(),
                    status: 'CLOSED',
                    final_balance: Number(physicalCount.money) || 0, // Usually final money in drawer
                    observations: observations,
                    // We could store the full breakdown in a JSONB column if needed
                    closing_data: {
                        expected: totals,
                        counted: {
                            money: Number(physicalCount.money) || 0,
                            credit: Number(physicalCount.credit) || 0,
                            debit: Number(physicalCount.debit) || 0,
                            pix: Number(physicalCount.pix) || 0
                        },
                        difference: difference
                    }
                })
                .eq('id', cashierId);

            if (error) throw error;

            toast.success('Caixa fechado com sucesso!');
            onSuccess();
            onClose();

        } catch (error) {
            console.error('Error closing cashier:', error);
            toast.error('Erro ao fechar caixa');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    if (openOrdersCount !== null && openOrdersCount > 0) {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Não foi possível fechar o caixa</h2>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="py-8 border-t border-b border-gray-100 mb-6">
                            <p className="text-gray-700 text-center leading-relaxed">
                                Não foi possível realizar o fechamento do caixa, pois há pedidos em aberto, finalize os pedidos para conseguir fechar o caixa
                            </p>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full py-3 bg-[#0099FF] text-white font-bold rounded-lg hover:bg-[#0088EE] transition-all shadow-lg shadow-blue-100"
                        >
                            Entendi
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const getDiffColor = (value: number) => {
        if (Math.abs(value) < 0.01) return 'text-green-600';
        if (value > 0) return 'text-blue-600';
        return 'text-red-600';
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg md:max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-[#003152] p-4 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/10 p-2 rounded-lg">
                            <Wallet className="text-white" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Fechamento de Caixa</h2>
                            <p className="text-blue-200 text-xs">Confira os valores antes de finalizar</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="overflow-y-auto p-4 md:p-6 space-y-6 flex-1">

                    {/* Summary Cards */}
                    {step === 2 && difference.total !== 0 && (
                        <div className={`p-4 rounded-lg flex items-start gap-3 border ${difference.total > 0 ? 'bg-blue-50 border-blue-100 text-blue-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                            <AlertTriangle className="shrink-0 mt-0.5" size={18} />
                            <div className="text-sm">
                                <span className="font-bold block mb-1">Divergência de Valores</span>
                                O valor total contado apresenta uma diferença de <span className="font-bold">{formatCurrency(difference.total)}</span> em relação ao esperado pelo sistema. Justifique nas observações se necessário.
                            </div>
                        </div>
                    )}

                    {/* Main Grid */}
                    <div className="border rounded-xl overflow-hidden shadow-sm">
                        {/* Header Row - Hidden on mobile, shown on md */}
                        <div className="hidden md:grid grid-cols-4 gap-4 p-3 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                            <div>Forma de Pagamento</div>
                            <div className="text-right">Valor em Sistema</div>
                            <div className="text-right">Valor Contado</div>
                            <div className="text-right">Diferença</div>
                        </div>

                        {/* Rows */}
                        {[
                            { id: 'money', label: 'Dinheiro', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100', expected: totals.money },
                            { id: 'credit', label: 'Crédito', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-100', expected: totals.credit },
                            { id: 'debit', label: 'Débito', icon: CreditCard, color: 'text-orange-600', bg: 'bg-orange-100', expected: totals.debit },
                            { id: 'pix', label: 'PIX', icon: CheckCircle2, color: 'text-purple-600', bg: 'bg-purple-100', expected: totals.pix },
                        ].map((item) => {
                            const diff = difference[item.id as keyof typeof difference];
                            const userValue = physicalCount[item.id as keyof typeof physicalCount];

                            return (
                                <div key={item.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border-b border-gray-100 last:border-0 items-center hover:bg-gray-50/50 transition-colors">

                                    {/* Payment Method Label */}
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${item.bg} ${item.color}`}>
                                            <item.icon size={18} />
                                        </div>
                                        <span className="font-medium text-gray-700">{item.label}</span>
                                    </div>

                                    {/* System Value */}
                                    <div className="flex justify-between md:block">
                                        <span className="md:hidden text-xs text-gray-500 font-medium uppercase mt-2">Sistema</span>
                                        <div className="text-right text-gray-500 font-mono text-sm md:text-base mt-1 md:mt-0">
                                            {formatCurrency(item.expected)}
                                        </div>
                                    </div>

                                    {/* Input Field */}
                                    <div className="flex justify-between md:block">
                                        <span className="md:hidden text-xs text-gray-500 font-medium uppercase mt-3">Contado</span>
                                        <div className="relative mt-1 md:mt-0">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">R$</span>
                                            <input
                                                type="number"
                                                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-right font-medium text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-300 text-sm md:text-base"
                                                placeholder="0,00"
                                                value={userValue}
                                                onChange={(e) => setPhysicalCount(prev => ({ ...prev, [item.id]: e.target.value }))}
                                                step="0.01"
                                                min="0"
                                            />
                                        </div>
                                    </div>

                                    {/* Difference */}
                                    <div className="flex justify-between md:block">
                                        <span className="md:hidden text-xs text-gray-500 font-medium uppercase mt-2">Diferença</span>
                                        <div className={`text-right font-bold text-sm md:text-base mt-1 md:mt-0 ${getDiffColor(diff)}`}>
                                            {diff > 0 ? '+' : ''}{formatCurrency(diff)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Total Row */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <span className="text-sm font-bold text-gray-500 uppercase tracking-wider w-full md:w-auto text-center md:text-left">Totais Gerais</span>

                            <div className="flex flex-col md:flex-row gap-6 md:gap-12 w-full md:w-auto">
                                <div className="flex justify-between md:block text-center md:text-right">
                                    <span className="text-xs text-gray-400 block mb-1">Esperado</span>
                                    <span className="text-lg font-bold text-gray-700">{formatCurrency(totals.total)}</span>
                                </div>
                                <div className="flex justify-between md:block text-center md:text-right">
                                    <span className="text-xs text-gray-400 block mb-1">Contado</span>
                                    <span className="text-lg font-bold text-black bg-white px-3 py-0.5 rounded border border-gray-200 shadow-sm block">
                                        {formatCurrency(
                                            (Number(physicalCount.money) || 0) +
                                            (Number(physicalCount.credit) || 0) +
                                            (Number(physicalCount.debit) || 0) +
                                            (Number(physicalCount.pix) || 0)
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between md:block text-center md:text-right">
                                    <span className="text-xs text-gray-400 block mb-1">Diferença</span>
                                    <span className={`text-lg font-bold ${getDiffColor(difference.total)}`}>
                                        {difference.total > 0 ? '+' : ''}{formatCurrency(difference.total)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Observations */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Observações do Fechamento</label>
                        <textarea
                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none text-sm"
                            rows={3}
                            placeholder="Descreva aqui justificativas para diferenças ou ocorrências no turno..."
                            value={observations}
                            onChange={(e) => setObservations(e.target.value)}
                        />
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200/50 rounded-lg transition-colors text-sm"
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleCloseCashier}
                        disabled={loading}
                        className="px-6 py-2 bg-[#003152] text-white font-medium rounded-lg hover:bg-[#00223A] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-blue-900/10 text-sm"
                    >
                        {loading ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Processando...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 size={18} />
                                Confirmar Fechamento
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default CloseCashierModal;
