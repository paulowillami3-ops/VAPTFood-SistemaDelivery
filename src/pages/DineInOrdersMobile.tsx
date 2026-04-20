import { Search, Plus, ChevronDown, QrCode, FileText, DollarSign } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../lib/supabase';

import { useEstablishment } from '../contexts/EstablishmentContext';

import TableDetailsModal from '../components/TableDetailsModal';

const DineInOrdersMobile = () => {
    const { establishment } = useEstablishment();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'tables' | 'commands'>('tables');

    const [tables, setTables] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Todos os status');
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const statusDropdownRef = useRef<HTMLDivElement>(null);

    // Close status dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
                setIsStatusDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredTables = tables.filter(table => {
        const matchesSearch = table.name.toLowerCase().includes(searchTerm.toLowerCase());

        let matchesStatus = true;
        if (statusFilter === 'Livre') matchesStatus = table.status === 'Livre';
        if (statusFilter === 'Ocupada') matchesStatus = table.status === 'Occupied';
        if (statusFilter === 'Fechando conta') matchesStatus = table.status === 'Closing'; // Future proofing

        return matchesSearch && matchesStatus;
    });

    const [selectedTableForDetails, setSelectedTableForDetails] = useState<any>(null);

    useEffect(() => {
        // Mock loading usage
        setLoading(false);
    }, []);

    useEffect(() => {
        if (establishment?.id) {
            fetchData();
        }
    }, [activeTab, establishment?.id]);

    const fetchData = async () => {
        if (!establishment?.id) return;
        setLoading(true);
        try {
            const tableName = activeTab === 'commands' ? 'restaurant_comandas' : 'restaurant_tables';

            // 1. Fetch tables/comandas
            const { data: itemsData, error: itemsError } = await supabase
                .from(tableName)
                .select('*')
                .eq('establishment_id', establishment.id)
                .order('name');

            if (itemsError) throw itemsError;

            // 2. Fetch open orders for these tables
            const { data: ordersData, error: ordersError } = await supabase
                .from('orders')
                .select('id, table_id, total_amount, status, payment_methods')
                .eq('establishment_id', establishment.id)
                .eq('type', 'DINE_IN')
                .not('status', 'in', '(DELIVERED,REJECTED,CANCELLED,CLOSED)')
                .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

            if (ordersError) throw ordersError;

            // 3. Map orders to tables
            let finalItems = itemsData || [];

            if (activeTab === 'tables' && ordersData) {
                const ordersByTable = ordersData.reduce((acc: any, order: any) => {
                    if (order.table_id) {
                        if (!acc[order.table_id]) {
                            acc[order.table_id] = { count: 0, total: 0, paid: 0 };
                        }
                        acc[order.table_id].count += 1;
                        acc[order.table_id].total += (order.total_amount || 0);

                        // Calculate paid amount from payment_methods
                        let methods = order.payment_methods;
                        if (typeof methods === 'string') {
                            try {
                                methods = JSON.parse(methods);
                            } catch (e) {
                                methods = [];
                            }
                        }

                        if (Array.isArray(methods)) {
                            const orderPaid = methods.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
                            acc[order.table_id].paid += orderPaid;
                        }
                    }
                    return acc;
                }, {});

                finalItems = finalItems.map(item => ({
                    ...item,
                    orderCount: ordersByTable[item.id]?.count || 0,
                    orderTotal: ordersByTable[item.id]?.total || 0,
                    paidTotal: ordersByTable[item.id]?.paid || 0,
                    status: ordersByTable[item.id]?.count > 0 ? 'Occupied' : 'Livre' // Using internal status string
                }));
            } else {
                finalItems = finalItems.map(item => ({ ...item, status: 'Livre', orderCount: 0, orderTotal: 0, paidTotal: 0 }));
            }

            const sorted = finalItems.sort((a, b) => {
                if (a.table_number && b.table_number) {
                    return a.table_number - b.table_number;
                }
                const numA = parseInt(a.name.replace(/\D/g, '')) || 0;
                const numB = parseInt(b.name.replace(/\D/g, '')) || 0;
                return numA - numB;
            });

            setTables(sorted);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNewOrder = (table: any) => {
        navigate(`/${establishment.slug}/admin/pdv`, {
            state: {
                table: {
                    id: table.id,
                    name: table.name,
                    source: activeTab === 'commands' ? 'comandas' : 'mesas'
                }
            }
        });
    };

    return (
        <div className="p-6 h-full flex flex-col overflow-hidden">
            {/* Header Title - Optimized for Mobile */}
            <div className="mb-4 flex flex-col justify-between shrink-0 gap-2">
                <div>
                    <h1 className="text-xl font-bold text-gray-800 text-left">Pedidos salão</h1>
                </div>
            </div>

            {/* Tabs - Segmented Control on Mobile */}
            <div className="flex p-1 bg-gray-100 rounded-lg mb-6">
                <button
                    onClick={() => setActiveTab('tables')}
                    className={`flex-1 py-2.5 text-sm font-bold transition-all rounded-md ${activeTab === 'tables'
                        ? 'bg-[#0099FF] text-white shadow-sm ring-1 ring-black/5'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Mesas
                </button>
                <button
                    onClick={() => setActiveTab('commands')}
                    className={`flex-1 py-2.5 text-sm font-bold transition-all rounded-md ${activeTab === 'commands'
                        ? 'bg-[#0099FF] text-white shadow-sm ring-1 ring-black/5'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Comandas
                </button>
            </div>

            {/* Controls - Optimized for Mobile */}
            <div className="space-y-3 mb-6 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Mesa"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white"
                        />
                    </div>

                    <div className="relative shrink-0" ref={statusDropdownRef}>
                        <button
                            onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                            className={`flex items-center gap-2 px-3 py-2.5 bg-white border rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors ${isStatusDropdownOpen ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'}`}
                        >
                            <span className="max-w-[100px] truncate">{statusFilter}</span>
                            <ChevronDown size={14} className={`transition-transform duration-200 ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isStatusDropdownOpen && (
                            <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-50 py-1 animate-in fade-in zoom-in-95 duration-100">
                                {['Todos os status', 'Livre', 'Ocupada', 'Fechando conta'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => {
                                            setStatusFilter(status);
                                            setIsStatusDropdownOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${statusFilter === status ? 'text-[#0099FF] font-medium bg-blue-50' : 'text-gray-700'}`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => navigate(`/${establishment.slug}/admin/hall-management`, {
                            state: { action: 'create-table' }
                        })}
                        className="w-full h-11 border border-[#0099FF] text-[#0099FF] rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-50 transition-all uppercase tracking-wide"
                    >
                        <Plus size={20} />
                        <span>Criar mesa</span>
                    </button>
                    <button
                        onClick={() => navigate(`/${establishment.slug}/admin/pdv`)}
                        className="w-full h-11 bg-[#0099FF] text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-md uppercase tracking-wide"
                    >
                        <Plus size={20} />
                        <span>Novo pedido</span>
                    </button>
                </div>

                <div className="flex items-center justify-center gap-4 py-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-600 uppercase">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                        Livre
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-600 uppercase">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#E67E22]"></div>
                        Ocupada
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-600 uppercase">
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                        Fechando conta
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0099FF]"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 overflow-y-auto pb-6">
                    {filteredTables.map(table => (
                        <TableCard
                            key={table.id}
                            id={table.id}
                            name={table.name}
                            status={table.status}
                            orderCount={table.orderCount}
                            orderTotal={table.orderTotal}
                            paidTotal={table.paidTotal}
                            onNewOrder={() => handleNewOrder(table)}
                            onViewDetails={() => setSelectedTableForDetails(table)}
                        />
                    ))}
                </div>
            )}

            {selectedTableForDetails && (
                <TableDetailsModal
                    isOpen={!!selectedTableForDetails}
                    onClose={() => {
                        setSelectedTableForDetails(null);
                        fetchData();
                    }}
                    tableId={selectedTableForDetails.id}
                    tableName={selectedTableForDetails.name}
                    establishmentId={String(establishment?.id)}
                    onNewOrder={() => {
                        setSelectedTableForDetails(null);
                        handleNewOrder(selectedTableForDetails);
                    }}
                />
            )}
        </div>
    );
};

interface TableCardProps {
    id: number;
    name: string;
    status: string;
    orderCount?: number;
    orderTotal?: number;
    paidTotal?: number;
    onNewOrder: () => void;
    onViewDetails: () => void;
}

const TableCard = ({ id, name, status, orderCount = 0, orderTotal = 0, paidTotal = 0, onNewOrder, onViewDetails }: TableCardProps) => {
    const isOccupied = status === 'Occupied';
    const isClosing = isOccupied && paidTotal > 0;

    const footerBg = isClosing ? 'bg-yellow-400' : (isOccupied ? 'bg-[#ff765b]' : 'bg-green-500');
    const headerBorder = isClosing ? 'border-yellow-100' : (isOccupied ? 'border-red-100' : 'border-gray-100');
    const borderColor = isClosing ? 'border-yellow-400' : (isOccupied ? 'border-[#ff765b]' : 'border-green-500');

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen]);

    const handlePrintQRCode = () => {
        setIsDropdownOpen(false);
        const svg = document.getElementById(`qrcode-${id}`);
        if (!svg) return;

        const printWindow = window.open('', '', 'width=600,height=600');
        if (!printWindow) return;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Imprimir ${name}</title>
                    <style>
                        body {
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            height: 100vh;
                            margin: 0;
                            font-family: sans-serif;
                        }
                        h1 { font-size: 24px; margin-bottom: 20px; }
                        svg { width: 300px; height: 300px; }
                    </style>
                </head>
                <body>
                    <h1>${name}</h1>
                    ${svg.outerHTML}
                    <script>
                        window.onload = () => {
                            window.print();
                            window.onafterprint = () => window.close();
                        }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div
            onClick={() => isOccupied ? onViewDetails() : onNewOrder()}
            className={`group relative bg-white rounded-lg shadow-sm flex flex-col border ${borderColor} transition-all cursor-pointer hover:shadow-md active:brightness-95`}
        >
            <div className="hidden">
                <QRCodeSVG id={`qrcode-${id}`} value={`https://app.vaptfood.com.br/table/${id}`} size={64} />
            </div>

            <div className={`p-4 flex items-center justify-between border-b ${headerBorder}`}>
                <span className="font-bold text-gray-800 text-base">{name}</span>

                <div className="flex gap-2 relative" ref={dropdownRef}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onNewOrder();
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-md text-sm font-bold text-gray-400"
                    >
                        <Plus size={16} />
                        <span>Pedido</span>
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsDropdownOpen(!isDropdownOpen);
                        }}
                        className={`w-9 h-9 border rounded-md transition-colors flex items-center justify-center ${isDropdownOpen ? 'bg-[#0099FF] text-white border-[#0099FF]' : 'bg-white text-gray-400 border-gray-200'}`}
                    >
                        <ChevronDown size={20} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute top-full right-0 mt-1 w-52 bg-white rounded-lg shadow-xl border border-gray-100 z-[60] py-1">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handlePrintQRCode();
                                }}
                                className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-b border-gray-50"
                            >
                                <QrCode size={18} className="text-gray-400" />
                                Imprimir QRCode
                            </button>

                            {isOccupied && (
                                <>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsDropdownOpen(false);
                                            onViewDetails();
                                        }}
                                        className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-b border-gray-50"
                                    >
                                        <FileText size={18} className="text-gray-400" />
                                        Ver pedidos
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsDropdownOpen(false);
                                            onViewDetails();
                                        }}
                                        className="w-full text-left px-4 py-3 text-sm font-bold text-gray-800 hover:bg-green-50 flex items-center gap-2"
                                    >
                                        <DollarSign size={18} className="text-green-600" />
                                        Fechar conta
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className={`h-10 px-4 flex items-center justify-between text-sm font-bold ${footerBg} text-white rounded-b-lg`}>
                {isOccupied ? (
                    <>
                        <div className="flex items-center gap-2">
                            <FileText size={18} />
                            <span>{orderCount}</span>
                        </div>
                        <span className="text-base uppercase tracking-tight">
                            R$ {orderTotal?.toFixed(2).replace('.', ',')}
                        </span>
                    </>
                ) : (
                    <div className="w-full text-center tracking-wide">
                        Livre
                    </div>
                )}
            </div>
        </div>
    );
};

export default DineInOrdersMobile;
