
import { useState, useEffect, useMemo } from 'react';
import { useEstablishment } from '../../../contexts/EstablishmentContext';
import { supabase } from '../../../lib/supabase';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, Save, CheckCircle } from 'lucide-react';

const CashierConciliation = () => {
    const { sessionId } = useParams();
    const { establishment } = useEstablishment();
    const navigate = useNavigate();

    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);

    // Conciliation State
    const [conciliatedValues, setConciliatedValues] = useState<any>({});
    const [notes, setNotes] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    useEffect(() => {
        if (sessionId && establishment?.id) {
            fetchData();
        }
    }, [sessionId, establishment?.id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Session
            const { data: sessionData, error: sessionError } = await supabase
                .from('cashier_sessions')
                .select('*')
                .eq('id', sessionId)
                .single();

            if (sessionError) throw sessionError;
            setSession(sessionData);

            if (sessionData.conciliated_values) {
                setConciliatedValues(sessionData.conciliated_values);
            }
            if (sessionData.conciliation_notes) {
                setNotes(sessionData.conciliation_notes);
            }

            // 2. Fetch Orders for this session window
            const { data: ordersData, error: ordersError } = await supabase
                .from('orders')
                .select('*')
                .eq('establishment_id', establishment.id)
                .gte('created_at', sessionData.opened_at)
                .lte('created_at', sessionData.closed_at || new Date().toISOString()) // Handle open sessions cautiously
                .neq('status', 'CANCELLED'); // Exclude cancelled

            if (ordersError) throw ordersError;
            setOrders(ordersData || []);

            // 3. Fetch Transactions (Withdrawals/Supplies)
            const { data: transData, error: transError } = await supabase
                .from('cashier_transactions')
                .select('*')
                .eq('session_id', sessionId);

            if (transError) throw transError;
            setTransactions(transData || []);

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };



    // Refined Metrics with standardized keys
    const metrics = useMemo(() => {
        if (!session) return [];

        const data: Record<string, { system: number, verified: number, conciliated: number }> = {
            'money': { system: Number(session.initial_balance || 0), verified: Number(session.final_money_balance || 0), conciliated: 0 },
            'card': { system: 0, verified: Number(session.final_card_balance || 0), conciliated: 0 }, // Grouping credit/debit
            'pix': { system: 0, verified: 0, conciliated: 0 }, // Assuming pix verification isn't in session table explicitly yet?
            'other': { system: 0, verified: 0, conciliated: 0 }
        };

        // Add Transactions to Money System
        transactions.forEach(t => {
            if (t.type === 'SUPPLY') data['money'].system += Number(t.amount);
            if (t.type === 'WITHDRAWAL') data['money'].system -= Number(t.amount);
        });

        // Add Orders
        orders.forEach(order => {
            if (order.payment_method === 'split' && order.payment_methods) {
                const methods = typeof order.payment_methods === 'string' ? JSON.parse(order.payment_methods) : order.payment_methods;
                if (Array.isArray(methods)) {
                    methods.forEach((m: any) => {
                        const type = mapMethod(m.type);
                        if (data[type]) data[type].system += Number(m.amount);
                        else data['other'].system += Number(m.amount);
                    });
                }
            } else {
                const type = mapMethod(order.payment_method);
                if (data[type]) data[type].system += (order.total_amount || 0);
                else data['other'].system += (order.total_amount || 0);
            }
        });

        // Apply existing conciliated values state
        Object.keys(data).forEach(key => {
            if (conciliatedValues[key] !== undefined) {
                data[key].conciliated = Number(conciliatedValues[key]);
            } else {
                // Default to Verified if present, else System
                data[key].conciliated = data[key].verified || data[key].system;
            }
        });

        return Object.entries(data).map(([key, value]) => ({
            key,
            label: getLabel(key),
            ...value,
            diff: value.conciliated - value.system
        }));

    }, [orders, transactions, session, conciliatedValues]);

    const handleConciliateChange = (key: string, value: string) => {
        const numValue = parseFloat(value); // handle NaN
        setConciliatedValues((prev: any) => ({
            ...prev,
            [key]: isNaN(numValue) ? 0 : numValue
        }));
    };

    const handleSave = async (status: 'PENDING' | 'CONCILIATED') => {
        try {
            const { error } = await supabase
                .from('cashier_sessions')
                .update({
                    conciliation_status: status,
                    conciliated_at: status === 'CONCILIATED' ? new Date().toISOString() : null,
                    conciliated_values: conciliatedValues,
                    conciliation_notes: notes
                })
                .eq('id', sessionId);

            if (error) throw error;

            if (status === 'CONCILIATED') {
                navigate('..'); // Go back
            } else {
                alert('Rascunho salvo');
            }
        } catch (error) {
            console.error('Error saving conciliation:', error);
            alert('Erro ao salvar');
        }
    };

    const totalConciliated = metrics.reduce((acc, curr) => acc + curr.conciliated, 0);
    const totalDiff = metrics.reduce((acc, curr) => acc + curr.diff, 0);

    if (loading) return <div className="p-8 text-gray-400">Carregando dados da conciliação...</div>;

    return (
        <div className="p-6 space-y-6 animate-fade-in text-gray-100 max-w-5xl mx-auto">
            <button onClick={() => navigate('..')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                <ArrowLeft size={18} />
                Voltar
            </button>

            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold">Conciliação de caixa</h1>
                    <p className="text-gray-400 mt-1">
                        Caixa #{session?.id.slice(0, 8)} •
                        Aberto em {format(parseISO(session.opened_at), "dd/MM HH:mm")} •
                        {session.closed_at ? `Fechado em ${format(parseISO(session.closed_at), "dd/MM HH:mm")}` : 'Aberto'}
                    </p>
                </div>
                <div className="bg-blue-500/10 px-4 py-2 rounded-lg border border-blue-500/20 text-right">
                    <span className="block text-xs text-blue-400 font-bold uppercase tracking-wider">Total Conciliado</span>
                    <span className="text-xl font-bold text-blue-400">
                        {totalConciliated.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                </div>
            </div>

            <div className="bg-[#1A2E44] rounded-xl border border-gray-700/50 overflow-hidden shadow-lg">
                <div className="p-6 border-b border-gray-700/50 bg-[#0F172A]/30">
                    <p className="text-gray-300">
                        Revise os valores e ajuste divergências no campo "Valor conciliado". Em seguida, clique em "Conciliar", registre o motivo e conclua o processo.
                    </p>
                </div>

                <table className="w-full text-left">
                    <thead>
                        <tr className="text-gray-400 text-sm border-b border-gray-700/50 bg-[#0F172A]/50">
                            <th className="p-4 font-medium">Forma de pagamento</th>
                            <th className="p-4 font-medium">Valor do sistema</th>
                            <th className="p-4 font-medium">Valor apurado</th>
                            <th className="p-4 font-medium">Valor Conciliado</th>
                            <th className="p-4 font-medium">Sistema x Conciliado</th>
                            {/* <th className="p-4 font-medium w-16"></th> */}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/30">
                        {metrics.map((row) => (
                            <tr key={row.key} className="hover:bg-white/5 transition-colors">
                                <td className="p-4 font-medium capitalize text-white">{row.label}</td>
                                <td className="p-4 text-gray-300">{row.system.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                <td className="p-4 text-gray-300">{row.verified.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                <td className="p-4">
                                    <input
                                        type="number"
                                        value={conciliatedValues[row.key] ?? row.conciliated}
                                        onChange={(e) => handleConciliateChange(row.key, e.target.value)}
                                        className="w-32 bg-[#0F172A] border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                                    />
                                </td>
                                <td className={`p-4 font-medium ${row.diff < 0 ? 'text-red-400' : row.diff > 0 ? 'text-green-400' : 'text-gray-400'}`}>
                                    {row.diff.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-[#0F172A]/50 font-bold border-t border-gray-700/50">
                        <tr>
                            <td className="p-4 text-white">Total</td>
                            <td className="p-4 text-white">
                                {metrics.reduce((a, b) => a + b.system, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                            <td className="p-4 text-white">
                                {metrics.reduce((a, b) => a + b.verified, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                            <td className="p-4 text-white">
                                {totalConciliated.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                            <td className={`p-4 ${totalDiff < 0 ? 'text-red-400' : totalDiff > 0 ? 'text-green-400' : 'text-gray-400'}`}>
                                {totalDiff.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
                <button
                    onClick={() => handleSave('PENDING')}
                    className="px-6 py-3 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors font-medium flex items-center gap-2"
                >
                    <Save size={18} />
                    Salvar rascunho
                </button>
                <button
                    onClick={() => setShowConfirmModal(true)}
                    className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20"
                >
                    <CheckCircle size={18} />
                    Conciliar
                </button>
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-[#1A2E44] rounded-xl border border-gray-700 p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-2">Confirmação de conciliação</h3>
                        <p className="text-gray-400 mb-4">
                            Ao conciliar o caixa, esta ação será definitiva e não poderá ser desfeita.
                        </p>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-400 mb-2">Motivo da conciliação (opcional)</label>
                            <input
                                type="text"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Descreva os motivos da conciliação no caixa"
                                className="w-full bg-[#0F172A] border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleSave('CONCILIATED')}
                                className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

const mapMethod = (method: string) => {
    const m = method?.toLowerCase() || '';
    if (m.includes('dinheiro') || m === 'money' || m === 'cash') return 'money';
    if (m.includes('debito') || m.includes('credito') || m.includes('visa') || m.includes('card')) return 'card';
    if (m.includes('pix')) return 'pix';
    return 'other';
};

const getLabel = (key: string) => {
    switch (key) {
        case 'money': return 'Dinheiro';
        case 'card': return 'Cartão / Maquina';
        case 'pix': return 'PIX';
        case 'other': return 'Outros';
        default: return key;
    }
}

export default CashierConciliation;
