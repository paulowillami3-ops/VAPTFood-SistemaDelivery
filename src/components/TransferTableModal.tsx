import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Check, AlertCircle, RefreshCcw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface TransferTableModalProps {
    isOpen: boolean;
    onClose: () => void;
    sourceTableId: number;
    sourceTableName: string;
    establishmentId: string;
    onSuccess: () => void;
}

const TransferTableModal: React.FC<TransferTableModalProps> = ({
    isOpen,
    onClose,
    sourceTableId,
    sourceTableName,
    establishmentId,
    onSuccess
}) => {
    const [targetTableId, setTargetTableId] = useState<number | null>(null);
    const [availableTables, setAvailableTables] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [transferring, setTransferring] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [step, setStep] = useState<'select' | 'confirm'>('select');

    useEffect(() => {
        if (isOpen && establishmentId) {
            fetchAvailableTables();
            setTargetTableId(null);
            setStep('select');
        }
    }, [isOpen, establishmentId]);

    const fetchAvailableTables = async () => {
        setLoading(true);
        try {
            // 1. Fetch all tables
            const { data: tablesData, error: tablesError } = await supabase
                .from('restaurant_tables')
                .select('*')
                .eq('establishment_id', establishmentId)
                .neq('id', sourceTableId) // Exclude current table
                .order('name');

            if (tablesError) throw tablesError;

            // 2. Fetch active orders to determine occupancy
            const { data: activeOrders, error: ordersError } = await supabase
                .from('orders')
                .select('table_id')
                .eq('establishment_id', establishmentId)
                .in('status', ['PENDING', 'PREPARING', 'READY'])
                .eq('type', 'DINE_IN');

            if (ordersError) throw ordersError;

            // 3. Filter out occupied tables
            const occupiedTableIds = new Set(activeOrders?.map(o => o.table_id));
            const freeTables = (tablesData || []).filter(table => !occupiedTableIds.has(table.id));

            // Sort numerically if possible
            const sorted = freeTables.sort((a, b) => {
                const numA = parseInt(a.name.replace(/\D/g, '')) || 0;
                const numB = parseInt(b.name.replace(/\D/g, '')) || 0;
                if (numA !== numB) return numA - numB;
                return a.name.localeCompare(b.name);
            });

            setAvailableTables(sorted);
        } catch (error) {
            console.error('Error fetching tables:', error);
            toast.error('Erro ao buscar mesas disponíveis.');
        } finally {
            setLoading(false);
        }
    };

    const handleTransfer = async () => {
        if (!targetTableId) {
            toast.error('Selecione uma mesa de destino.');
            return;
        }

        setTransferring(true);
        try {
            // Update orders from source table to target table
            const { error } = await supabase
                .from('orders')
                .update({ table_id: targetTableId })
                .eq('table_id', sourceTableId)
                .eq('establishment_id', establishmentId)
                .in('status', ['PENDING', 'PREPARING', 'READY']);

            if (error) throw error;

            toast.success('Mesa transferida com sucesso!');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error transferring table:', error);
            toast.error('Erro ao transferir mesa.');
        } finally {
            setTransferring(false);
        }
    };

    if (!isOpen) return null;

    const selectedTable = availableTables.find(t => t.id === targetTableId);

    // Confirmation Step UI
    if (step === 'confirm') {
        return (
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
                <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col">
                    <div className="p-6 text-center space-y-6">
                        <div className="flex justify-between items-center absolute top-4 right-4">
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <h2 className="text-xl font-bold text-gray-800 mt-2">Deseja transferir a mesa?</h2>

                        {/* Illustration */}
                        <div className="flex items-center justify-center gap-6 py-4">
                            <div className="flex flex-col items-center gap-2 text-gray-400">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                    <Receipt size={32} />
                                </div>
                                <span className="font-bold text-sm">{sourceTableName}</span>
                            </div>
                            <div className="text-[#0099FF] animate-pulse">
                                <RefreshCcw size={32} />
                            </div>
                            <div className="flex flex-col items-center gap-2 text-[#0099FF]">
                                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center border-2 border-[#0099FF]">
                                    <Receipt size={32} />
                                </div>
                                <span className="font-bold text-sm">{selectedTable?.name}</span>
                            </div>
                        </div>

                        <div className="text-gray-600">
                            Será transferido da <span className="font-bold text-gray-900">{sourceTableName}</span> para <span className="font-bold text-gray-900">{selectedTable?.name}</span>
                        </div>

                        {/* Tags */}
                        <div className="flex justify-center gap-2">
                            {['Comandas', 'Pedidos', 'Pagamentos'].map(tag => (
                                <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full border border-gray-200">
                                    {tag}
                                </span>
                            ))}
                        </div>

                        {/* Warning */}
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-3 text-left">
                            <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={18} />
                            <p className="text-sm text-blue-700 leading-snug">
                                <span className="font-bold">Atenção!</span> Essa ação é irreversível. A comanda de origem será liberada.
                            </p>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setStep('select')}
                                className="flex-1 py-3 font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleTransfer}
                                disabled={transferring}
                                className="flex-1 py-3 bg-[#0099FF] hover:bg-blue-600 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
                            >
                                {transferring ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Transferindo...
                                    </>
                                ) : (
                                    'Sim, transferir mesa'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">Transferir mesa</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 md:p-8 space-y-8 flex-1 overflow-y-auto">

                    {/* Info Alert */}
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={20} />
                        <p className="text-sm text-blue-700">
                            Todos os pedidos, comandas e pagamentos serão transferidos para a nova mesa.
                            A mesa atual será fechada automaticamente.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 items-start">
                        {/* Source */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-gray-700">Mesa de origem:</label>
                            <div className="border-2 border-[#ff765b] bg-white rounded-lg overflow-hidden ring-4 ring-red-50">
                                <div className="p-4 border-b border-gray-100">
                                    <span className="font-bold text-gray-800 text-lg">Mesa {sourceTableName}</span>
                                </div>
                                <div className="p-3 bg-red-50 flex items-center gap-2 text-[#ff765b] font-bold">
                                    <Receipt size={18} />
                                    <span>Ocupada</span>
                                </div>
                            </div>
                        </div>

                        {/* Arrows for Desktop */}
                        <div className="hidden md:flex justify-center items-center h-full pt-8">
                            <ArrowRight className="text-gray-300" size={32} />
                        </div>

                        {/* Target */}
                        <div className="space-y-3 relative">
                            <label className="text-sm font-bold text-gray-700">Escolha uma mesa de destino:</label>

                            {/* Custom Dropdown Trigger */}
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className={`w-full text-left border-2 rounded-lg overflow-hidden transition-all ${isDropdownOpen ? 'border-[#0099FF] ring-4 ring-blue-50' :
                                    targetTableId ? 'border-[#0099FF]' : 'border-gray-200 hover:border-blue-300'
                                    }`}
                            >
                                <div className="p-4 bg-white flex items-center justify-between">
                                    <span className={`text-lg ${targetTableId ? 'font-bold text-gray-800' : 'text-gray-400'}`}>
                                        {selectedTable ? `Mesa ${selectedTable.name}` : 'Selecione a mesa'}
                                    </span>
                                    <div className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}>
                                        <ChevronDown className="text-gray-400" />
                                    </div>
                                </div>
                                {targetTableId && (
                                    <div className="p-3 bg-blue-50 flex items-center gap-2 text-[#0099FF] font-bold border-t border-blue-100">
                                        <Check size={18} />
                                        <span>Selecionada</span>
                                    </div>
                                )}
                            </button>

                            {/* Dropdown Menu */}
                            {isDropdownOpen && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-100 max-h-60 overflow-y-auto z-10 animate-in fade-in zoom-in-95 duration-100">
                                    {loading ? (
                                        <div className="p-4 text-center text-gray-500 text-sm">Carregando mesas...</div>
                                    ) : availableTables.length === 0 ? (
                                        <div className="p-4 text-center text-gray-500 text-sm">Nenhuma mesa livre disponível.</div>
                                    ) : (
                                        availableTables.map(table => (
                                            <button
                                                key={table.id}
                                                onClick={() => {
                                                    setTargetTableId(table.id);
                                                    setIsDropdownOpen(false);
                                                }}
                                                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 border-b border-gray-50 last:border-none transition-colors"
                                            >
                                                <span className="font-medium text-gray-700">Mesa {table.name}</span>
                                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">Livre</span>
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                        disabled={transferring}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => setStep('confirm')}
                        disabled={!targetTableId}
                        className="px-6 py-2.5 bg-[#8DB6C9] hover:bg-[#7a9eb0] text-white font-bold rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        Transferir mesa
                    </button>
                </div>
            </div>
        </div>
    );
};

// Import icons within component to avoid top-level missing imports if I messed up
import { ChevronDown, Receipt } from 'lucide-react';

export default TransferTableModal;
