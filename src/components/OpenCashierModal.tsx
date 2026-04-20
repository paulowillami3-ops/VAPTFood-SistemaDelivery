import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useCashier } from '../contexts/CashierContext';

interface OpenCashierModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const OpenCashierModal = ({ isOpen, onClose, onSuccess }: OpenCashierModalProps) => {
    const { openCashier } = useCashier();
    const [initialBalance, setInitialBalance] = useState('');

    if (!isOpen) return null;



    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, '');
        if (!val) {
            setInitialBalance('');
            return;
        }

        // Prevent huge numbers if needed
        if (val.length > 15) val = val.slice(0, 15);

        const floatValue = parseInt(val) / 100;
        const formatted = floatValue.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });

        setInitialBalance(formatted);
    };

    const parseCurrency = (val: string) => {
        if (!val) return 0;
        return parseFloat(val.replace('R$', '').replace(/\./g, '').replace(',', '.').trim()) || 0;
    };

    const handleOpen = async () => {
        await openCashier(parseCurrency(initialBalance));
        onSuccess();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">Abrir frente de caixa</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-sm text-gray-600 mb-6">
                        Informe o valor total em dinheiro presente no caixa no ato da abertura
                    </p>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Valor em dinheiro *</label>
                        <input
                            type="text"
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-[#0099FF] focus:outline-none"
                            placeholder="R$ 0,00"
                            value={initialBalance}
                            onChange={handleInputChange}
                            autoFocus
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                    <button onClick={onClose} className="px-6 py-2 rounded-md font-bold text-gray-600 hover:bg-gray-200 transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={handleOpen}
                        className="bg-[#0099FF] text-white px-6 py-2 rounded-md font-bold hover:bg-blue-600 transition-colors"
                    >
                        Abrir caixa
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OpenCashierModal;
