import { X, FileText, Printer, DollarSign, PlusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Table {
    id: number;
    name: string;
    status: string;
    orderTotal: number;
    paidTotal: number;
    orderCount: number;
}

interface WaiterTableOptionsProps {
    isOpen: boolean;
    onClose: () => void;
    table: Table | null;
    onAction: (action: 'view-orders' | 'print-conference' | 'close-account' | 'new-order') => void;
}

export default function WaiterTableOptions({ isOpen, onClose, table, onAction }: WaiterTableOptionsProps) {
    if (!table) return null;

    const total = table.orderTotal || 0;
    // Assuming standard service fee logic isn't fully calculated here yet, just showing raw total for now as per plan
    // or we can append "(c/ taxa)" if we assume it. User screenshot showed "R$ 23,10 (c/ taxa)".
    // Let's stick to formatting the total we have.

    const formatCurrency = (val: number) => {
        return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 z-50"
                    />

                    {/* Modal Slide Up */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 p-6 shadow-xl max-w-lg mx-auto"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">{table.name}</h2>
                            <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="mb-6">
                            <div className="flex items-center gap-2 text-gray-700 font-medium text-lg">
                                <DollarSign size={20} className="text-gray-400" />
                                <span>Conta: <span className="font-bold text-gray-900">{formatCurrency(total)}</span></span>
                                {/* <span className="text-xs text-gray-400 font-normal ml-1">(c/ taxa)</span> */}
                                {/* Uncomment if we verify tax calculation logic is applied to orderTotal */}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => onAction('view-orders')}
                                className="w-full flex items-center justify-center gap-3 py-4 bg-white border border-[#0099FF] text-[#0099FF] font-bold rounded-xl hover:bg-blue-50 transition-colors"
                            >
                                <FileText size={20} />
                                Ver pedidos
                            </button>

                            <button
                                onClick={() => onAction('print-conference')}
                                className="w-full flex items-center justify-center gap-3 py-4 bg-white border border-[#0099FF] text-[#0099FF] font-bold rounded-xl hover:bg-blue-50 transition-colors"
                            >
                                <Printer size={20} />
                                Imprimir conferência
                            </button>

                            <button
                                onClick={() => onAction('close-account')}
                                className="w-full flex items-center justify-center gap-3 py-4 bg-white border border-[#0099FF] text-[#0099FF] font-bold rounded-xl hover:bg-blue-50 transition-colors"
                            >
                                <DollarSign size={20} />
                                Fechar conta
                            </button>

                            <button
                                onClick={() => onAction('new-order')}
                                className="w-full flex items-center justify-center gap-3 py-4 bg-[#0099FF] text-white font-bold rounded-xl hover:bg-blue-600 transition-colors shadow-lg shadow-blue-200"
                            >
                                <PlusCircle size={20} />
                                Novo pedido
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
