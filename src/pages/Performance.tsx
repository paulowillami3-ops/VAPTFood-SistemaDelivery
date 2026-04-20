import { useState, useEffect } from 'react';
import { Info, HelpCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

const Performance = () => {
    const [dateRange, setDateRange] = useState<'7d' | '15d' | '30d'>('7d');

    // Today's Metrics
    const [todayRevenue, setTodayRevenue] = useState(0);
    const [pendingCount, setPendingCount] = useState(0);
    const [preparingCount, setPreparingCount] = useState(0);
    const [readyCount, setReadyCount] = useState(0);

    // Period Metrics
    const [periodRevenue, setPeriodRevenue] = useState(0);
    const [periodOrders, setPeriodOrders] = useState(0);
    const [periodTicket, setPeriodTicket] = useState(0);

    // Comparison (Growth)
    const [revenueGrowth, setRevenueGrowth] = useState(0);
    const [ordersGrowth, setOrdersGrowth] = useState(0);
    const [ticketGrowth, setTicketGrowth] = useState(0);

    // Breakdowns
    const [ordersByType, setOrdersByType] = useState<{ name: string, count: number, percentage: number }[]>([]);

    useEffect(() => {
        fetchTodayStats();
        // Poll every 30s for today's live activity
        const interval = setInterval(fetchTodayStats, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        fetchPeriodStats();
    }, [dateRange]);

    const fetchTodayStats = async () => {
        const todayStart = startOfDay(new Date()).toISOString();
        const todayEnd = endOfDay(new Date()).toISOString();

        try {
            // Revenue (Delivered only)
            const { data: revenueData } = await supabase
                .from('orders')
                .select('total_amount')
                .eq('status', 'DELIVERED')
                .gte('created_at', todayStart)
                .lte('created_at', todayEnd);

            const total = revenueData?.reduce((acc, curr) => acc + (curr.total_amount || 0), 0) || 0;
            setTodayRevenue(total);

            // Active Counts
            // We can do separate queries or one grouped query. Separate is simpler to write/maintain for now.
            const { count: pending } = await supabase.from('orders').select('id', { count: 'exact' }).eq('status', 'PENDING');
            const { count: preparing } = await supabase.from('orders').select('id', { count: 'exact' }).eq('status', 'PREPARING');
            const { count: ready } = await supabase.from('orders').select('id', { count: 'exact' }).eq('status', 'READY');

            setPendingCount(pending || 0);
            setPreparingCount(preparing || 0);
            setReadyCount(ready || 0);

        } catch (error) {
            console.error('Error fetching today stats:', error);
        }
    };

    const fetchPeriodStats = async () => {
        const days = dateRange === '7d' ? 7 : dateRange === '15d' ? 15 : 30;
        const now = new Date();
        const currentPeriodStart = subDays(now, days).toISOString();
        const previousPeriodStart = subDays(now, days * 2).toISOString(); // For comparison
        const previousPeriodEnd = currentPeriodStart;

        try {
            // 1. Current Period Data
            const { data: currentData } = await supabase
                .from('orders')
                .select('total_amount, type, status')
                .eq('status', 'DELIVERED') // Only count delivered for revenue stats? Or all? Usually delivered.
                .gte('created_at', currentPeriodStart);

            const curRevenue = currentData?.reduce((acc, curr) => acc + (curr.total_amount || 0), 0) || 0;
            const curCount = currentData?.length || 0;
            const curTicket = curCount > 0 ? curRevenue / curCount : 0;

            setPeriodRevenue(curRevenue);
            setPeriodOrders(curCount);
            setPeriodTicket(curTicket);

            // 2. Previous Period Data (for comparison)
            const { data: prevData } = await supabase
                .from('orders')
                .select('total_amount')
                .eq('status', 'DELIVERED')
                .gte('created_at', previousPeriodStart)
                .lt('created_at', previousPeriodEnd);

            const prevRevenue = prevData?.reduce((acc, curr) => acc + (curr.total_amount || 0), 0) || 0;
            const prevCount = prevData?.length || 0;
            const prevTicket = prevCount > 0 ? prevRevenue / prevCount : 0;

            // Calculate Growth
            const calcGrowth = (current: number, previous: number) => {
                if (previous === 0) return current > 0 ? 100 : 0;
                return ((current - previous) / previous) * 100;
            };

            setRevenueGrowth(calcGrowth(curRevenue, prevRevenue));
            setOrdersGrowth(calcGrowth(curCount, prevCount));
            setTicketGrowth(calcGrowth(curTicket, prevTicket));

            // 3. Breakdown by Type (using currentData which has all delivered orders in period)
            // Note: If we want breakdown of ALL orders (including cancelled) we might need a separate query. 
            // Lets stick to Delivered/Successful orders for performance stats usually.
            if (currentData) {
                const typeCounts = currentData.reduce((acc: any, order) => {
                    const type = order.type || 'UNKNOWN';
                    acc[type] = (acc[type] || 0) + 1;
                    return acc;
                }, {});

                const typeMapping: any = { 'DELIVERY': 'Delivery', 'DINE_IN': 'Mesa', 'PICKUP': 'Retirada' };
                const formattedTypes = Object.entries(typeCounts).map(([key, count]: any) => ({
                    name: typeMapping[key] || key,
                    count: count,
                    percentage: (count / curCount) * 100
                }));

                setOrdersByType(formattedTypes);
            }

        } catch (error) {
            console.error('Error fetching period stats:', error);
        }
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans text-gray-800">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Meu desempenho</h1>
                <div className="text-sm text-gray-500 mt-1">
                    <span>Início</span>
                    <span className="mx-2">›</span>
                    <span className="text-gray-400">Meu desempenho</span>
                </div>
            </div>

            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {/* Card 1: Revenue - Blue */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    <div className="bg-[#0074D9] text-white px-4 py-2 flex items-center justify-between">
                        <span className="font-bold text-sm">Faturamento de hoje</span>
                        <Info size={16} />
                    </div>
                    <div className="p-4 flex-1 flex items-center justify-center">
                        <span className="text-2xl font-bold text-gray-700">{formatCurrency(todayRevenue)}</span>
                    </div>
                </div>

                {/* Card 2: In Analysis - Orange */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    <div className="bg-[#FF851B] text-white px-4 py-2">
                        <span className="font-bold text-sm">Em análise agora</span>
                    </div>
                    <div className="p-4 flex-1 flex items-center justify-center">
                        <span className="text-3xl font-bold text-gray-700">{pendingCount}</span>
                    </div>
                </div>

                {/* Card 3: In Production - Yellow */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    <div className="bg-[#FFDC00] text-black px-4 py-2">
                        <span className="font-bold text-sm">Em produção agora</span>
                    </div>
                    <div className="p-4 flex-1 flex items-center justify-center">
                        <span className="text-3xl font-bold text-gray-700">{preparingCount}</span>
                    </div>
                </div>

                {/* Card 4: Ready - Green */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    <div className="bg-[#2ECC40] text-white px-4 py-2">
                        <span className="font-bold text-sm">Pronto para entrega</span>
                    </div>
                    <div className="p-4 flex-1 flex items-center justify-center">
                        <span className="text-3xl font-bold text-gray-700">{readyCount}</span>
                    </div>
                </div>
            </div>

            {/* Date Filters & Notice */}
            <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
                <div className="text-gray-500 font-medium text-sm">
                    {format(subDays(new Date(), dateRange === '7d' ? 7 : dateRange === '15d' ? 15 : 30), 'dd/MM/yyyy')} a {format(new Date(), 'dd/MM/yyyy')}
                </div>
                <div className="flex bg-white rounded-md shadow-sm border border-gray-200 p-1">
                    <button onClick={() => setDateRange('7d')} className={`px-4 py-1.5 text-xs font-medium rounded transition-colors ${dateRange === '7d' ? 'bg-[#0099FF] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>Últimos 7 dias</button>
                    <button onClick={() => setDateRange('15d')} className={`px-4 py-1.5 text-xs font-medium rounded transition-colors ${dateRange === '15d' ? 'bg-[#0099FF] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>Últimos 15 dias</button>
                    <button onClick={() => setDateRange('30d')} className={`px-4 py-1.5 text-xs font-medium rounded transition-colors ${dateRange === '30d' ? 'bg-[#0099FF] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>Últimos 30 dias</button>
                </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 bg-white rounded-lg shadow-sm border border-gray-100 mb-6 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-gray-100">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-gray-700 text-lg">Faturamento</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${revenueGrowth >= 0 ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>
                            {revenueGrowth >= 0 ? '↗' : '↘'} {Math.abs(revenueGrowth).toFixed(2)}%
                        </span>
                    </div>
                    <span className="text-2xl font-bold text-gray-600">{formatCurrency(periodRevenue)}</span>
                </div>
                <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-gray-700 text-lg">Pedidos</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${ordersGrowth >= 0 ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>
                            {ordersGrowth >= 0 ? '↗' : '↘'} {Math.abs(ordersGrowth).toFixed(2)}%
                        </span>
                    </div>
                    <span className="text-2xl font-bold text-gray-600">{periodOrders}</span>
                </div>
                <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-gray-700 text-lg">Ticket médio</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${ticketGrowth >= 0 ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>
                            {ticketGrowth >= 0 ? '↗' : '↘'} {Math.abs(ticketGrowth).toFixed(2)}%
                        </span>
                    </div>
                    <span className="text-2xl font-bold text-gray-600">{formatCurrency(periodTicket)}</span>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Menu Quality - 2/5 width */}
                <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                    <div className="mb-4">
                        <h3 className="font-bold text-lg text-gray-700 mb-1">Qualidade do Cardápio</h3>
                        <p className="text-xs text-gray-400">Quanto maior a pontuação, mais pedidos você pode receber!</p>
                    </div>

                    <div className="flex flex-col items-center justify-center py-6">
                        <div className="relative w-48 h-24 overflow-hidden mb-2">
                            {/* Simple Semi-circle Gauge using CSS/SVG */}
                            <svg viewBox="0 0 100 50" className="w-full h-full">
                                <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#E5E7EB" strokeWidth="10" />
                                <path d="M 10 50 A 40 40 0 0 1 35 20" fill="none" stroke="#2ECC40" strokeWidth="10" />
                            </svg>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
                                <span className="text-4xl font-bold text-gray-700">33%</span>
                            </div>
                        </div>
                        <span className="text-sm font-medium text-gray-500">do cardápio otimizado</span>

                        <button className="mt-6 text-[#0099FF] text-sm font-bold hover:underline">
                            Saiba mais
                        </button>
                    </div>
                </div>

                {/* Orders Breakdown Tabs - 3/5 width */}
                <div className="lg:col-span-3 bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                    <div className="flex border-b border-gray-100 mb-4">
                        <button className="px-4 py-2 text-sm font-bold text-[#0099FF] border-b-2 border-[#0099FF]">
                            Pedidos por modalidade
                        </button>
                        <button className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
                            Pedidos por canais de atendimento
                        </button>
                    </div>

                    <div className="h-64 flex flex-col justify-center space-y-6 px-4">
                        {ordersByType.length > 0 ? (
                            ordersByType.map(item => (
                                <div key={item.name} className="flex flex-col gap-1">
                                    <div className="flex justify-between text-sm font-medium text-gray-600">
                                        <span>{item.name}</span>
                                        <span>{item.count} ({item.percentage.toFixed(1)}%)</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                                        <div
                                            className="bg-[#0099FF] h-2.5 rounded-full"
                                            style={{ width: `${item.percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-400 text-sm">Nenhum pedido neste período</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Help Button */}
            <div className="fixed bottom-6 right-6">
                <button className="bg-[#0099FF] w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-600 transition-colors">
                    <HelpCircle size={24} />
                </button>
            </div>
        </div>
    );
};

export default Performance;
