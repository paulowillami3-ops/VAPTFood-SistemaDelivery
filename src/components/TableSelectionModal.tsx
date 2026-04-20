import React, { useState, useEffect } from 'react';
import { X, Search, Receipt } from 'lucide-react';
import { supabase } from '../lib/supabase';

import { useEstablishment } from '../contexts/EstablishmentContext';

interface TableSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (table: any) => void;
}

const TableSelectionModal: React.FC<TableSelectionModalProps> = ({ isOpen, onClose, onSelect }) => {
    const { establishment } = useEstablishment(); // Context Hook
    const [activeTab, setActiveTab] = useState<'mesas' | 'comandas'>('mesas');
    const [searchTerm, setSearchTerm] = useState('');
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && establishment?.id) {
            fetchItems();
        }
    }, [isOpen, activeTab, establishment?.id]);

    const fetchItems = async () => {
        if (!establishment?.id) return;
        setLoading(true);
        try {
            const tableName = activeTab === 'comandas' ? 'restaurant_comandas' : 'restaurant_tables';

            // 1. Fetch tables/comandas
            const { data: itemsData, error: itemsError } = await supabase
                .from(tableName)
                .select('*')
                .eq('establishment_id', establishment.id)
                .order(activeTab === 'mesas' ? 'table_number' : 'name', { ascending: true });

            if (itemsError) throw itemsError;

            // 2. Fetch open orders for these tables
            const { data: ordersData, error: ordersError } = await supabase
                .from('orders')
                .select('id, table_id, total_amount, status')
                .eq('establishment_id', establishment.id)
                .eq('type', 'DINE_IN')
                .not('status', 'in', '(DELIVERED,REJECTED,CANCELLED,CLOSED)')
                .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

            if (ordersError) throw ordersError;

            // 3. Map orders to tables
            // Note: For comandas, we don't have a direct ID link strictly enforced yet unless we added a column or use name parsing.
            // But per previous fix, we are not storing comanda ID in table_id.
            // So this logic mainly applies to 'mesas' (activeTab === 'mesas').

            let finalItems = itemsData || [];

            if (activeTab === 'mesas' && ordersData) {
                const ordersByTable = ordersData.reduce((acc: any, order: any) => {
                    if (order.table_id) {
                        if (!acc[order.table_id]) {
                            acc[order.table_id] = { count: 0, total: 0 };
                        }
                        acc[order.table_id].count += 1;
                        acc[order.table_id].total += (order.total_amount || 0);
                    }
                    return acc;
                }, {});

                finalItems = finalItems.map(item => ({
                    ...item,
                    orderCount: ordersByTable[item.id]?.count || 0,
                    orderTotal: ordersByTable[item.id]?.total || 0,
                    status: ordersByTable[item.id]?.count > 0 ? 'Occupied' : 'Livre'
                }));
            }

            // Sort custom logic if needed, e.g. numeric sort
            const sorted = finalItems.sort((a, b) => {
                // Try to extract numbers for better sorting
                const numA = parseInt(a.name.replace(/\D/g, '')) || 0;
                const numB = parseInt(b.name.replace(/\D/g, '')) || 0;
                return numA - numB;
            });

            setItems(sorted);
        } catch (error) {
            console.error('Error fetching items:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(item.number).includes(searchTerm)
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose}></div>

            {/* Modal Content */}
            <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800">Selecione uma mesa</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>

                {/* Tags */}
                <div className="flex gap-6 px-6 pt-4 border-b border-gray-100">
                    <button
                        onClick={() => setActiveTab('mesas')}
                        className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'mesas' ? 'border-[#0099FF] text-[#0099FF]' : 'border-transparent text-gray-500'}`}
                    >
                        Mesas
                    </button>
                    <button
                        onClick={() => setActiveTab('comandas')}
                        className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'comandas' ? 'border-[#0099FF] text-[#0099FF]' : 'border-transparent text-gray-500'}`}
                    >
                        Comandas
                    </button>
                </div>

                {/* Sub-Header & Search */}
                <div className="p-4 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder={activeTab === 'mesas' ? 'Mesa' : 'Comanda'}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-4 content-start">
                    {loading ? (
                        <div className="flex justify-center py-8 text-gray-500">Carregando...</div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {filteredItems.map(item => {
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => onSelect({ ...item, source: activeTab })}
                                        className={`rounded-lg overflow-hidden hover:shadow-md transition-shadow text-left group border ${item.status === 'Occupied' ? 'border-[#ff765b]' : 'border-green-500'
                                            }`}
                                    >
                                        <div className={`p-4 border-b ${item.status === 'Occupied' ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'}`}>
                                            <span className="font-bold text-gray-700">
                                                {activeTab === 'mesas' ? `Mesa ${item.table_number}` : item.name}
                                            </span>
                                        </div>
                                        <div className={`p-2 px-3 flex items-center justify-between ${item.status === 'Occupied' ? 'bg-[#ff765b]' : 'bg-[#57BC78]'}`}>
                                            {item.status === 'Occupied' ? (
                                                <>
                                                    <div className="flex items-center gap-1.5 text-white text-sm font-medium">
                                                        <Receipt size={16} />
                                                        <span>{item.orderCount}</span>
                                                    </div>
                                                    <span className="text-white text-sm font-bold">
                                                        R$ {item.orderTotal?.toFixed(2).replace('.', ',')}
                                                    </span>
                                                </>
                                            ) : (
                                                <div className="w-full text-center text-white text-sm font-bold">Livre</div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TableSelectionModal;
