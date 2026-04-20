import { Search, Plus, ChevronDown, Receipt, QrCode, FileText, Printer, DollarSign, ArrowRightLeft, Clock } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../lib/supabase';

import { useEstablishment } from '../contexts/EstablishmentContext';

import TableDetailsModal from '../components/TableDetailsModal';

import DineInOrdersMobile from './DineInOrdersMobile';

const DineInOrders = () => {
    const { establishment } = useEstablishment();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'tables' | 'commands'>('tables');
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);


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
                // For comandas or fallback, default to Livre for now unless we implement comanda mapping
                finalItems = finalItems.map(item => ({ ...item, status: 'Livre', orderCount: 0, orderTotal: 0, paidTotal: 0 }));
            }

            // Sort custom logic if needed, e.g. numeric sort
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
        // Navigate to PDV with pre-selected table if possible, or just open PDV
        // Assuming we can pass state or just navigate
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

    if (isMobile) {
        return <DineInOrdersMobile />;
    }

    return (
        <div className="p-6 h-full flex flex-col overflow-hidden">
            {/* Header Title */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Pedidos salão</h1>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <span>Início</span>
                        <span>›</span>
                        <span>Pedidos salão</span>
                    </div>
                </div>

                {/* Promo Banner Removed */}
            </div>

            {/* Tabs */}
            <div className="flex mb-6">
                <button
                    onClick={() => setActiveTab('tables')}
                    className={`px-8 py-2 font-medium text-sm rounded-l-md transition-colors ${activeTab === 'tables'
                        ? 'bg-[#0099FF] text-white'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                >
                    Mesas
                </button>
                <button
                    onClick={() => setActiveTab('commands')}
                    className={`px-8 py-2 font-medium text-sm rounded-r-md transition-colors ${activeTab === 'commands'
                        ? 'bg-[#0099FF] text-white'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                >
                    Comandas
                </button>

                <div className="ml-auto flex items-center gap-2 text-xs font-medium">
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Livre</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#E67E22]"></div> Ocupada</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-400"></div> Fechando conta</div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Mesa"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white"
                    />
                </div>

                <div className="relative" ref={statusDropdownRef}>
                    <button
                        onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                        className={`flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors ${isStatusDropdownOpen ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'}`}
                    >
                        <span>{statusFilter}</span>
                        <ChevronDown size={16} className={`transition-transform duration-200 ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isStatusDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-50 py-1 animate-in fade-in zoom-in-95 duration-100">
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

                <div className="ml-auto flex gap-2">
                    <button
                        onClick={() => navigate(`/${establishment.slug}/admin/hall-management`, {
                            state: { action: 'create-table' }
                        })}
                        className="flex items-center gap-2 px-4 py-2 border border-[#0099FF] text-[#0099FF] rounded-lg text-sm font-bold hover:bg-blue-50 transition-colors"
                    >
                        <Plus size={18} />
                        <span>Criar mesa</span>
                    </button>
                    <button
                        onClick={() => navigate(`/${establishment.slug}/admin/pdv`)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#0099FF] text-white rounded-lg text-sm font-bold hover:bg-blue-600 transition-colors shadow-sm"
                    >
                        <Plus size={18} />
                        <span>Novo pedido</span>
                    </button>
                </div>
            </div>

            {/* Tables Grid */}
            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0099FF]"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pb-40">
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
                        fetchData(); // Recarrega os dados ao fechar o modal para atualizar os cards
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
    const remaining = Math.max(0, orderTotal - paidTotal);

    // Status colors
    // Free: Green | Occupied: Red | Closing: Yellow
    const borderColor = isClosing ? 'border-yellow-400' : (isOccupied ? 'border-[#ff765b]' : 'border-green-500');
    const headerBg = isClosing ? 'bg-yellow-50' : (isOccupied ? 'bg-red-50' : 'bg-white');
    const headerBorder = isClosing ? 'border-yellow-100' : (isOccupied ? 'border-red-100' : 'border-gray-100');
    const footerBg = isClosing ? 'bg-yellow-400' : (isOccupied ? 'bg-[#ff765b]' : 'bg-green-500');

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
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
            className={`group relative bg-white rounded-lg shadow-sm flex flex-col border ${borderColor} transition-all cursor-pointer hover:shadow-md hover:brightness-95 hover:z-50`}
        >
            {/* Tooltip on Hover */}
            {isOccupied && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-gray-900/90 text-white text-xs rounded-lg py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 backdrop-blur-sm shadow-xl">
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-700">
                        <span className="text-gray-300">Total Pedidos:</span>
                        <div className="flex items-center gap-1">
                            <Receipt size={12} />
                            <span className="font-bold text-white">{orderCount}</span>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between text-green-400">
                            <span>Pago:</span>
                            <span className="font-bold">R$ {paidTotal.toFixed(2).replace('.', ',')}</span>
                        </div>
                        <div className="flex justify-between text-gray-300">
                            <span>Total:</span>
                            <span className="font-bold">R$ {orderTotal.toFixed(2).replace('.', ',')}</span>
                        </div>
                        <div className="flex justify-between text-blue-300 font-bold border-t border-gray-700 pt-1 mt-1">
                            <span>Falta:</span>
                            <span>R$ {remaining.toFixed(2).replace('.', ',')}</span>
                        </div>
                    </div>

                    {/* Arrow (Top) */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full border-4 border-transparent border-b-gray-900/90"></div>
                </div>
            )}


            {/* Hidden QRCode for printing */}
            <div className="hidden">
                <QRCodeSVG id={`qrcode-${id}`} value={`https://app.vaptfood.com.br/table/${id}`} size={64} />
            </div>

            <div className={`p-3 flex items-center justify-between border-b rounded-t-lg ${headerBg} ${headerBorder}`}>
                <div className="flex items-center gap-2 overflow-hidden">
                    <span className="font-bold text-gray-700 truncate max-w-[100px]" title={name}>{name}</span>
                    {isClosing && <Clock size={16} className="text-yellow-600 animate-pulse flex-shrink-0" />}
                </div>
                <div className="flex gap-2 relative" ref={dropdownRef}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onNewOrder();
                        }}
                        className="flex items-center gap-1 px-3 py-1 bg-white border border-gray-200 rounded text-xs font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                        <Plus size={12} />
                        <span>Pedido</span>
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsDropdownOpen(!isDropdownOpen);
                        }}
                        className={`p-1 rounded transition-colors flex items-center justify-center w-7 h-7 border ${isDropdownOpen ? 'bg-[#0099FF] text-white border-[#0099FF]' : 'bg-white text-gray-400 border-gray-200 hover:bg-[#0099FF] hover:text-white hover:border-[#0099FF]'}`}
                    >
                        <ChevronDown size={16} />
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                        <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-100 z-50 py-1 animate-in fade-in zoom-in-95 duration-100">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsDropdownOpen(false);
                                    onNewOrder();
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm font-medium flex items-center gap-2 transition-colors border-b border-gray-50 bg-blue-50 text-blue-600 hover:bg-blue-100/50`}
                            >
                                <Plus size={16} />
                                Novo Pedido
                            </button>

                            {isOccupied && (
                                <>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsDropdownOpen(false);
                                            onViewDetails();
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 flex items-center gap-2 transition-colors border-b border-gray-50"
                                    >
                                        <FileText size={16} className="text-gray-500" />
                                        Ver pedidos
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsDropdownOpen(false);
                                            // Handle print conference
                                            alert('Funcionalidade de impressão em breve');
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 flex items-center gap-2 transition-colors border-b border-gray-50"
                                    >
                                        <Printer size={16} className="text-gray-500" />
                                        Imprimir conferência
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsDropdownOpen(false);
                                            // Handle close account
                                            onViewDetails(); // Shortcut to details for now
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-blue-50 flex items-center gap-2 transition-colors border-b border-gray-50"
                                    >
                                        <DollarSign size={16} className="text-gray-900" />
                                        Fechar conta
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsDropdownOpen(false);
                                            alert('Funcionalidade de transferência em breve');
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 flex items-center gap-2 transition-colors border-b border-gray-50"
                                    >
                                        <ArrowRightLeft size={16} className="text-gray-500" />
                                        Transferir entre mesas
                                    </button>
                                </>
                            )}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handlePrintQRCode();
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 flex items-center gap-2 transition-colors"
                            >
                                <QrCode size={16} className="text-gray-500" />
                                Imprimir QRCode
                            </button>
                        </div>
                    )}
                </div>
            </div>
            {/* Status Bar */}
            <div className={`py-1.5 px-3 flex items-center justify-between text-xs font-medium rounded-b-lg ${footerBg} text-white`}>
                {isOccupied ? (
                    <>
                        <div className="flex items-center gap-1.5">
                            <Receipt size={14} />
                            <span className="text-sm font-bold">{orderCount}</span>
                        </div>
                        <span className="text-sm font-bold">
                            R$ {orderTotal?.toFixed(2).replace('.', ',')}
                        </span>
                    </>
                ) : (
                    <div className="w-full text-center font-bold">
                        {isClosing ? 'Fechando conta' : 'Livre'}
                    </div>
                )}
            </div>
        </div >
    );
};

export default DineInOrders;
