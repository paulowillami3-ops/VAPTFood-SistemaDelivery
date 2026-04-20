import React, { useState } from 'react';
import { X, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PrintConferenceModalProps {
    isOpen: boolean;
    onClose: () => void;
    orders: any[];
    tableName: string;
    subtotal: number;
    serviceFee: number;
    total: number;
    establishmentName?: string;
}

const PrintConferenceModal: React.FC<PrintConferenceModalProps> = ({
    isOpen,
    onClose,
    orders,
    tableName,
    subtotal,
    serviceFee,
    total,
    establishmentName = 'Noia Burguer'
}) => {
    const [selectedOption, setSelectedOption] = useState<'with-fee' | 'without-fee'>('with-fee');

    if (!isOpen) return null;

    const currentDate = new Date().toLocaleDateString('pt-BR');
    const currentTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // Mock receipt content generation
    const renderReceipt = (withFee: boolean) => (
        <div className="font-mono text-[10px] leading-tight text-gray-800 p-4 bg-[#FFF8DC] border border-gray-200 shadow-sm w-full h-full overflow-y-auto">
            <div className="text-center font-bold mb-2">
                {establishmentName}<br />
                ================================<br />
                {tableName}<br />
                Abertura em {currentDate} {currentTime}<br />
                ================================
            </div>

            <div className="mb-2">
                Comanda: {orders[0]?.id || '?'}<br />
                Cliente: {orders[0]?.customer_name || 'Cliente'}
            </div>

            <div className="space-y-1 mb-2">
                {orders.map((order, oIdx) => (
                    <div key={oIdx}>
                        {typeof order.items === 'string' ? JSON.parse(order.items).map((item: any, i: number) => (
                            <div key={i} className="flex justify-between">
                                <span>({item.quantity}) {item.name}</span>
                                <span>R$ {(item.total || item.total_price || 0).toFixed(2).replace('.', ',')}</span>
                            </div>
                        )) : order.items.map((item: any, i: number) => (
                            <div key={i} className="flex justify-between">
                                <span>({item.quantity}) {item.name}</span>
                                <span>R$ {(item.total || item.total_price || 0).toFixed(2).replace('.', ',')}</span>
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            <div className="border-t border-dashed border-gray-400 my-2 pt-1">
                <div className="flex justify-between font-bold">
                    <span>Total dos itens</span>
                    <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                </div>
                {withFee && (
                    <div className="flex justify-between font-bold">
                        <span>Taxa de serviço (10%)</span>
                        <span>R$ {serviceFee.toFixed(2).replace('.', ',')}</span>
                    </div>
                )}
            </div>

            <div className="border-t border-double border-gray-600 my-2 pt-1">
                <div className="flex justify-between font-bold text-sm">
                    <span>Total</span>
                    <span>R$ {(withFee ? total : subtotal).toFixed(2).replace('.', ',')}</span>
                </div>
            </div>

            <div className="text-center mt-4">
                ================================
            </div>
        </div>
    );

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4"
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white rounded-lg w-full max-w-3xl flex flex-col shadow-2xl overflow-hidden"
                >
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-800">Imprimir conferência</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 bg-gray-50 flex-1 overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[500px]">
                            {/* Option 1: With Fee */}
                            <div
                                onClick={() => setSelectedOption('with-fee')}
                                className={`relative cursor-pointer rounded-lg border-2 transition-all p-2 flex flex-col ${selectedOption === 'with-fee' ? 'border-[#0099FF] ring-2 ring-blue-100' : 'border-transparent hover:border-gray-300'}`}
                            >
                                <div className="flex items-center gap-2 mb-2 px-2">
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedOption === 'with-fee' ? 'border-[#0099FF]' : 'border-gray-400'}`}>
                                        {selectedOption === 'with-fee' && <div className="w-2.5 h-2.5 rounded-full bg-[#0099FF]" />}
                                    </div>
                                    <span className="font-bold text-gray-700">Com taxa de serviço</span>
                                </div>
                                {renderReceipt(true)}
                            </div>

                            {/* Option 2: Without Fee */}
                            <div
                                onClick={() => setSelectedOption('without-fee')}
                                className={`relative cursor-pointer rounded-lg border-2 transition-all p-2 flex flex-col ${selectedOption === 'without-fee' ? 'border-[#0099FF] ring-2 ring-blue-100' : 'border-transparent hover:border-gray-300'}`}
                            >
                                <div className="flex items-center gap-2 mb-2 px-2">
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedOption === 'without-fee' ? 'border-[#0099FF]' : 'border-gray-400'}`}>
                                        {selectedOption === 'without-fee' && <div className="w-2.5 h-2.5 rounded-full bg-[#0099FF]" />}
                                    </div>
                                    <span className="font-bold text-gray-700">Sem taxa de serviço</span>
                                </div>
                                {renderReceipt(false)}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-gray-200 bg-white flex justify-center">
                        <button
                            onClick={() => {
                                alert(`Imprimindo conferência (${selectedOption === 'with-fee' ? 'Com taxa' : 'Sem taxa'})...`);
                                onClose();
                            }}
                            className="bg-[#0099FF] text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-600 transition-colors flex items-center gap-2"
                        >
                            <Printer size={20} />
                            Imprimir
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default PrintConferenceModal;
