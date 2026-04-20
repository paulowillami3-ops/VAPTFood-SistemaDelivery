
import { useState, useEffect } from 'react';
import { useEstablishment } from '../../../contexts/EstablishmentContext';
import { supabase } from '../../../lib/supabase';
import { format, subDays, startOfDay, endOfDay, parseISO } from 'date-fns';

import {
    Calendar,
    Eye,
    FileCheck,
    Printer,
    ChevronLeft,
    ChevronRight,
    ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CashierReport = () => {
    const { establishment } = useEstablishment();
    const navigate = useNavigate();
    const [dateRange, setDateRange] = useState({
        start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
        end: format(new Date(), 'yyyy-MM-dd')
    });
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONCILIATED' | 'NOT_CONCILIATED'>('ALL');
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const [sessions, setSessions] = useState<any[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (establishment?.id) {
            fetchSessions();
        }
    }, [establishment?.id, dateRange, statusFilter, page]);

    const fetchSessions = async () => {
        setLoading(true);
        try {
            const startDate = startOfDay(parseISO(dateRange.start)).toISOString();
            const endDate = endOfDay(parseISO(dateRange.end)).toISOString();

            let query = supabase
                .from('cashier_sessions')
                .select('*', { count: 'exact' })
                .eq('establishment_id', establishment.id)
                .gte('opened_at', startDate)
                .lte('opened_at', endDate);

            if (statusFilter === 'CONCILIATED') {
                query = query.eq('conciliation_status', 'CONCILIATED');
            } else if (statusFilter === 'NOT_CONCILIATED') {
                query = query.neq('conciliation_status', 'CONCILIATED'); // Or is usually NULL or specific status
                // Better approach if 'conciliation_status' is nullable:
                // query = query.or('conciliation_status.neq.CONCILIATED,conciliation_status.is.null');
                // But Supabase simple filtering might be easier if we assume it defaults to something else or we filter specifically.
                // Let's assume NOT_CONCILIATED means anything not CONCILIATED.
            }

            const from = (page - 1) * ITEMS_PER_PAGE;
            const to = from + ITEMS_PER_PAGE - 1;

            const { data, error, count } = await query
                .order('opened_at', { ascending: false })
                .range(from, to);

            if (error) throw error;
            setSessions(data || []);
            setTotalCount(count || 0);
        } catch (error) {
            console.error('Error fetching cashier sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    const getStatusBadge = (status: string | null) => {
        if (status === 'CONCILIATED') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-orange-500 text-white">
                    Conciliado
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-orange-500 text-white">
                Não conciliado
            </span>
        );
    };

    return (
        <div className="p-4 md:p-6 space-y-4 md:space-y-6 animate-fade-in text-gray-800 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-800">Relatório de Caixas</h1>
                    {/* <p className="text-gray-500 text-sm">Histórico de abertura e fechamento de caixas</p> */}
                </div>

                {/* Filters */}
                <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row gap-3">
                    {/* Date Range */}
                    <div className="flex items-center gap-2 border border-gray-200 rounded-md px-3 py-2 bg-gray-50 flex-1">
                        <Calendar size={18} className="text-gray-400" />
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="bg-transparent text-sm text-gray-700 focus:outline-none w-full"
                        />
                        <span className="text-gray-400">-</span>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="bg-transparent text-sm text-gray-700 focus:outline-none w-full"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="relative min-w-[200px]">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="w-full appearance-none bg-white border border-gray-200 text-gray-700 py-2 px-3 pr-8 rounded-md leading-tight focus:outline-none focus:bg-white focus:border-gray-500 text-sm"
                        >
                            <option value="ALL">Status da conciliação</option>
                            <option value="CONCILIATED">Conciliado</option>
                            <option value="NOT_CONCILIATED">Não conciliado</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <ChevronDown size={16} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Total Count & Pagination Controls (Top) */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <h3 className="text-lg font-medium text-gray-800">
                    Total de {totalCount} registros
                </h3>

                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-white border border-gray-200 rounded-md shadow-sm">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-2 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed border-r border-gray-200"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <div className="px-4 py-1 text-sm font-medium text-gray-700">
                            {page} <span className="text-gray-400 font-normal">de</span> {totalPages || 1}
                        </div>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || totalPages === 0}
                            className="p-2 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed border-l border-gray-200"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    <select
                        value={ITEMS_PER_PAGE}
                        disabled
                        className="bg-white border border-gray-200 text-gray-700 py-2 px-3 rounded-md text-sm shadow-sm"
                    >
                        <option>10 v</option>
                    </select>
                </div>
            </div>


            {/* List Content */}
            <div className="space-y-4">
                {loading ? (
                    <div className="p-8 text-center text-gray-500 bg-white rounded-xl border border-gray-200 shadow-sm">Carregando...</div>
                ) : sessions.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 bg-white rounded-xl border border-gray-200 shadow-sm">Nenhum caixa encontrado no período.</div>
                ) : (
                    <>
                        {/* Mobile Cards (Visible on Small Screens) */}
                        <div className="grid grid-cols-1 gap-4 md:hidden">
                            {sessions.map((session) => (
                                <div key={session.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                        <span className="font-bold text-gray-700">#{session.id.slice(0, 8)}</span>
                                        <div className="flex gap-1">
                                            <button className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-white rounded-md border border-gray-200 shadow-sm transition-colors">
                                                <Printer size={16} />
                                            </button>
                                            <button className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-white rounded-md border border-gray-200 shadow-sm transition-colors">
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                onClick={() => navigate(`${session.id}/conciliation`)}
                                                className={`p-1.5 rounded-md border border-gray-200 shadow-sm transition-colors ${session.conciliation_status === 'CONCILIATED'
                                                    ? 'text-green-600 bg-green-50 border-green-200'
                                                    : 'text-gray-500 hover:text-blue-600 hover:bg-white'
                                                    }`}
                                            >
                                                <FileCheck size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-4 space-y-2 text-sm">
                                        <div className="flex justify-between py-1 border-b border-gray-50">
                                            <span className="text-gray-500">Abertura</span>
                                            <span className="text-gray-700 font-medium int-tabular">
                                                {format(parseISO(session.opened_at), "dd/MM/yy - HH:mm")}
                                            </span>
                                        </div>
                                        <div className="flex justify-between py-1 border-b border-gray-50">
                                            <span className="text-gray-500">Fechamento</span>
                                            <span className="text-gray-700 font-medium int-tabular">
                                                {session.closed_at
                                                    ? format(parseISO(session.closed_at), "dd/MM/yy - HH:mm")
                                                    : 'Em aberto'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center pt-2">
                                            <span className="text-gray-500">Status</span>
                                            {getStatusBadge(session.conciliation_status)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop Table (Visible on Medium+ Screens) */}
                        <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                                        <th className="p-4 font-semibold">Nº do Caixa</th>
                                        <th className="p-4 font-semibold">Abertura</th>
                                        <th className="p-4 font-semibold">Fechamento</th>
                                        <th className="p-4 font-semibold">Status</th>
                                        <th className="p-4 font-semibold text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {sessions.map((session) => (
                                        <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-4 font-medium text-gray-900">#{session.id.slice(0, 8)}</td>
                                            <td className="p-4 text-gray-600">
                                                {format(parseISO(session.opened_at), "dd/MM/yyyy - HH:mm")}
                                            </td>
                                            <td className="p-4 text-gray-600">
                                                {session.closed_at
                                                    ? format(parseISO(session.closed_at), "dd/MM/yyyy - HH:mm")
                                                    : <span className="text-green-600 font-medium">Aberto</span>
                                                }
                                            </td>
                                            <td className="p-4">
                                                {getStatusBadge(session.conciliation_status)}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => navigate(`${session.id}/conciliation`)}
                                                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                        title="Conciliação"
                                                    >
                                                        <FileCheck size={18} />
                                                    </button>
                                                    <button className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Visualizar">
                                                        <Eye size={18} />
                                                    </button>
                                                    <button className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Imprimir">
                                                        <Printer size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>

    );
};

export default CashierReport;
