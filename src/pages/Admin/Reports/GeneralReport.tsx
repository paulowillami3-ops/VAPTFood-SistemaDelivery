import { useState, useEffect, useMemo } from 'react';
import {
    DollarSign,
    Users,
    Calendar,
    ChevronRight,
    Tag,
    ShoppingBag,
    MessageSquare,
    ChevronDown,
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import { useEstablishment } from '../../../contexts/EstablishmentContext';
import { supabase } from '../../../lib/supabase';
import { format, subDays, startOfDay, endOfDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const GeneralReport = () => {
    const { establishment } = useEstablishment();
    const [dateRange, setDateRange] = useState({
        start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
        end: format(new Date(), 'yyyy-MM-dd')
    });
    const [orders, setOrders] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'orders' | 'revenue' | 'payments'>('orders');

    // Period Dropdown State
    const [periodFilter, setPeriodFilter] = useState<'weekly' | 'monthly'>('weekly');
    const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);

    useEffect(() => {
        if (periodFilter === 'weekly') {
            const start = format(subDays(new Date(), 6), 'yyyy-MM-dd'); // Last 7 days
            const end = format(new Date(), 'yyyy-MM-dd');
            setDateRange({ start, end });
        } else {
            const start = format(subDays(new Date(), 30), 'yyyy-MM-dd'); // Last 30 days
            const end = format(new Date(), 'yyyy-MM-dd');
            setDateRange({ start, end });
        }
    }, [periodFilter]);

    useEffect(() => {
        if (establishment?.id) {
            fetchOrders();
        }
    }, [establishment?.id, dateRange]);

    const fetchOrders = async () => {
        // ... (fetchOrders function remains same, implicit via context of replace)
        try {
            const startDate = startOfDay(parseISO(dateRange.start)).toISOString();
            const endDate = endOfDay(parseISO(dateRange.end)).toISOString();

            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('establishment_id', establishment.id)
                .gte('created_at', startDate)
                .lte('created_at', endDate)
                .neq('status', 'CANCELLED')
                .order('created_at', { ascending: true });

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    };

    const metrics = useMemo(() => {
        // ... (metrics calculation remains same)
        const totalRevenue = orders.reduce((acc, order) => acc + (Number(order.total_amount) || 0), 0);
        const totalOrders = orders.length;
        const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const uniqueCustomers = new Set(orders.map(o => o.customer_id).filter(Boolean)).size;

        return {
            revenue: totalRevenue,
            orders: totalOrders,
            averageTicket,
            customers: uniqueCustomers
        };
    }, [orders]);

    const chartsData = useMemo(() => {
        const daysMap: Record<string, any> = {};
        const sortedKeys: string[] = [];

        // Initialize all days in range to ensure continuous axis
        if (periodFilter === 'weekly') {
            const today = new Date();
            for (let i = 6; i >= 0; i--) {
                const d = subDays(today, i);
                const dateKey = format(d, 'dd/MM');
                const dayLabel = format(d, 'EEE', { locale: ptBR }).replace('.', '');
                const capitalizedDay = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1);

                daysMap[dateKey] = {
                    date: dateKey,
                    dayOfWeek: capitalizedDay,
                    orders: 0,
                    revenue: 0,
                    delivery: 0,
                    pickup: 0
                };
                sortedKeys.push(dateKey);
            }
        }

        // Aggregation
        orders.forEach(order => {
            const date = format(parseISO(order.created_at), 'dd/MM', { locale: ptBR });

            // If date not in map (e.g. monthly view or outside range issue), add it if monthly
            // For weekly, we strictly follow sortedKeys usually, but let's be safe
            if (!daysMap[date]) {
                if (periodFilter === 'weekly') return; // Skip if outside weekly range (shouldn't happen due to filter)

                const dayOfWeek = format(parseISO(order.created_at), 'EEE', { locale: ptBR }).replace('.', '');
                const capitalizedDay = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
                daysMap[date] = { date, dayOfWeek: capitalizedDay, orders: 0, revenue: 0, delivery: 0, pickup: 0 };
                // For monthly, we might want to push to sortedKeys or sort later. 
                // Since this block is mainly for 'weekly' requirement refinment, monthly behavior logic relies on standard reduce.
            }

            if (daysMap[date]) {
                daysMap[date].orders += 1;
                daysMap[date].revenue += Number(order.total_amount) || 0;
                if (order.delivery_method === 'DELIVERY') daysMap[date].delivery += 1;
                if (order.delivery_method === 'PICKUP' || order.delivery_method === 'TAKEOUT') daysMap[date].pickup += 1;
            }
        });

        let barChartData = [];
        if (periodFilter === 'weekly') {
            barChartData = sortedKeys.map(key => daysMap[key]);
        } else {
            barChartData = Object.values(daysMap).sort((a: any, b: any) => {
                // Sort by date string dd/MM - simplified assumption they are within same year/month structure or just use string compare
                // Better to compare actual timestamp if available, but for now:
                const [dayA, monthA] = a.date.split('/').map(Number);
                const [dayB, monthB] = b.date.split('/').map(Number);
                if (monthA !== monthB) return monthA - monthB;
                return dayA - dayB;
            });
        }

        const paymentData = orders.reduce((acc: any, order) => {
            const method = order.payment_method || 'Outros';
            if (!acc[method]) acc[method] = 0;
            acc[method] += 1;
            return acc;
        }, {});

        const pieChartData = Object.entries(paymentData).map(([name, value]) => ({
            name: name === 'CREDIT_CARD' ? 'Cartão Crédito' :
                name === 'DEBIT_CARD' ? 'Cartão Débito' :
                    name === 'PIX' ? 'PIX' :
                        name === 'CASH' ? 'Dinheiro' : name,
            value
        }));

        return { barChartData, pieChartData };
    }, [orders, periodFilter]);

    const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-100 rounded-lg shadow-lg">
                    <p className="text-sm font-bold text-gray-700 mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-xs mb-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.fill }}></div>
                            <span className="text-gray-500 font-medium">{entry.name}:</span>
                            <span className="font-bold text-gray-700">
                                {entry.dataKey === 'revenue'
                                    ? Number(entry.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                    : entry.value
                                }
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="p-6 space-y-6 animate-fade-in text-gray-800 bg-gray-50 min-h-screen">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                <span>Início</span>
                <ChevronRight size={14} />
                <span>Relatórios</span>
                <ChevronRight size={14} />
                <span className="font-bold text-gray-600">Relatório Geral</span>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-gray-600">Relatório Geral</h1>
            </div>

            {/* Date Filter Bar */}
            <div className="flex items-center gap-4">
                <div className="flex items-center bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 px-3 py-2 border-r border-gray-200">
                        {/* <Calendar size={18} className="text-gray-400" /> */}
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="bg-transparent text-sm text-gray-600 focus:outline-none"
                        />
                        <span className="text-gray-400">-</span>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="bg-transparent text-sm text-gray-600 focus:outline-none"
                        />
                        <Calendar size={18} className="text-gray-400 ml-2" />
                    </div>
                </div>

                <div className="flex items-center gap-2 px-2 cursor-pointer opacity-50 hover:opacity-100 transition-opacity">
                    <div className="w-10 h-5 bg-gray-300 rounded-full relative">
                        <div className="w-5 h-5 bg-white rounded-full shadow-sm absolute left-0 top-0 border border-gray-300 transform translate-x-0"></div>
                    </div>
                    <span className="text-sm text-gray-500 font-medium">Comparar períodos</span>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Summary Cards code remains mostly same, can keep abbreviated for brevity in replace if not changing */}
                <SummaryCard
                    value={metrics.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    subtitle="Faturamento"
                    icon={DollarSign}
                    iconBg="bg-blue-50"
                    iconColor="text-blue-500"
                />
                <SummaryCard
                    value={metrics.averageTicket.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    subtitle="Ticket médio"
                    icon={Tag}
                    iconBg="bg-blue-50"
                    iconColor="text-blue-500"
                />
                <SummaryCard
                    value={metrics.orders.toString()}
                    subtitle="Total de pedidos"
                    icon={ShoppingBag}
                    iconBg="bg-blue-50"
                    iconColor="text-blue-500"
                />
                <SummaryCard
                    value={metrics.customers.toString()}
                    subtitle="Clientes ativos"
                    icon={Users}
                    iconBg="bg-blue-50"
                    iconColor="text-blue-500"
                />
            </div>

            {/* Charts Section with Tabs */}
            <div className="bg-white p-6 rounded-xl shadow-sm">

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b border-gray-100 pb-2">
                    {/* Tabs */}
                    <div className="flex gap-8 w-full sm:w-auto">
                        <button
                            onClick={() => setActiveTab('orders')}
                            className={`pb-4 text-sm font-bold transition-colors relative ${activeTab === 'orders' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Pedidos e Entregas
                        </button>
                        <button
                            onClick={() => setActiveTab('revenue')}
                            className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === 'revenue' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Faturamento
                        </button>
                        <button
                            onClick={() => setActiveTab('payments')}
                            className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === 'payments' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Formas de pagamento
                        </button>
                    </div>

                    {/* Period Selector */}
                    <div className="relative z-20">
                        <button
                            onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
                            className={`flex items-center gap-2 px-4 py-2 bg-[#0099FF] text-white rounded-lg text-sm font-bold hover:bg-blue-600 transition-colors w-[140px] justify-between
                                ${isPeriodDropdownOpen ? 'rounded-b-none' : ''}
                            `}
                        >
                            {periodFilter === 'weekly' ? 'Semanal' : 'Mensal'}
                            <ChevronDown size={16} className={`transition-transform ${isPeriodDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isPeriodDropdownOpen && (
                            <div className="absolute top-full left-0 w-full bg-white border-x border-b border-gray-200 rounded-b-lg shadow-lg overflow-hidden flex flex-col">
                                <button
                                    onClick={() => {
                                        setPeriodFilter('weekly');
                                        setIsPeriodDropdownOpen(false);
                                    }}
                                    className={`px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-blue-50
                                        ${periodFilter === 'weekly' ? 'bg-blue-50 text-[#0099FF]' : 'text-gray-600'}
                                    `}
                                >
                                    Semanal
                                </button>
                                <button
                                    onClick={() => {
                                        setPeriodFilter('monthly');
                                        setIsPeriodDropdownOpen(false);
                                    }}
                                    className={`px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-blue-50
                                        ${periodFilter === 'monthly' ? 'bg-blue-50 text-[#0099FF]' : 'text-gray-600'}
                                    `}
                                >
                                    Mensal
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Date Display */}
                <div className="mb-6 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 text-lg">
                        {format(parseISO(dateRange.start), 'dd/MM/yyyy')} - {format(parseISO(dateRange.end), 'dd/MM/yyyy')}
                    </h3>

                    {activeTab === 'orders' && (
                        <div className="flex gap-4 text-xs font-medium text-gray-500">
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-[#0B3B69] rounded-[2px]"></div>
                                <span>Entregas</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-[#60A5FA] rounded-[2px]"></div>
                                <span>Pedidos</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Chart Content */}
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        {activeTab === 'orders' ? (
                            <BarChart data={chartsData.barChartData} barGap={4}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis
                                    dataKey="dayOfWeek"
                                    stroke="#94a3b8"
                                    tick={{ fontSize: 13, fill: '#334155' }}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    stroke="#94a3b8"
                                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />

                                <Bar
                                    dataKey="orders"
                                    name="Pedidos"
                                    fill="#60A5FA"
                                    radius={4}
                                    maxBarSize={20}
                                    background={{ fill: '#f3f4f6', radius: 4 }}
                                />
                                <Bar
                                    dataKey="delivery"
                                    name="Entregas"
                                    fill="#0B3B69"
                                    radius={4}
                                    maxBarSize={20}
                                    background={{ fill: '#f3f4f6', radius: 4 }}
                                />
                            </BarChart>
                        ) : activeTab === 'revenue' ? (
                            <BarChart data={chartsData.barChartData} barGap={8}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis
                                    dataKey="dayOfWeek"
                                    stroke="#94a3b8"
                                    tick={{ fontSize: 13, fill: '#334155' }}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    stroke="#94a3b8"
                                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `R$ ${value}`}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }} />
                                <Bar dataKey="revenue" name="Faturamento" fill="#0099FF" radius={[4, 4, 0, 0]} maxBarSize={50} />
                            </BarChart>
                        ) : (
                            <PieChart>
                                <Pie
                                    data={chartsData.pieChartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={120}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {chartsData.pieChartData.map((_entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                            </PieChart>
                        )}
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Help Button (Visual only) */}
            <div className="fixed bottom-6 right-6 z-50">
                <button className="w-14 h-14 bg-[#0099FF] hover:bg-blue-600 text-white rounded-[20px] rounded-tl-sm shadow-xl flex items-center justify-center transition-transform hover:scale-105">
                    <MessageSquare size={28} fill="white" strokeWidth={0} />
                </button>
            </div>
        </div>
    );
};

const SummaryCard = ({ value, subtitle, icon: Icon, iconBg, iconColor }: any) => {
    return (
        <div className="bg-white p-6 rounded-xl border-none shadow-sm flex flex-col items-center text-center justify-center h-48 hover:shadow-md transition-shadow">
            <div className={`p-3 rounded-lg mb-3 ${iconBg} ${iconColor}`}>
                <Icon size={24} />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
            <span className="text-gray-400 text-sm font-medium mt-1">{subtitle}</span>
        </div>
    );
};

export default GeneralReport;
