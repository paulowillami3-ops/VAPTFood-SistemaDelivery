import { useState } from 'react';
import { X } from 'lucide-react';
import { useCashier } from '../contexts/CashierContext';

interface CashierTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'WITHDRAWAL' | 'SUPPLY'; // 'WITHDRAWAL' = Retirada, 'SUPPLY' = Suprimento
    onSuccess: () => void;
}

const CashierTransactionModal = ({ isOpen, onClose, type, onSuccess }: CashierTransactionModalProps) => {
    const { addTransaction } = useCashier();
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const isWithdrawal = type === 'WITHDRAWAL';
    const title = isWithdrawal ? 'Informar retirada' : 'Informar suprimento';
    const buttonLabel = title;
    const descriptionLabel = isWithdrawal ? 'Observação *' : 'Observação'; // Required for Withdrawal

    const parseCurrency = (val: string) => {
        if (!val) return 0;
        return parseFloat(val.replace('R$', '').replace(/\./g, '').replace(',', '.').trim()) || 0;
    };

    const handleSubmit = async () => {
        setError('');

        if (isWithdrawal && description.length < 10) {
            setError('A justificativa deve ter pelo menos 10 caracteres.');
            return;
        }

        const value = parseCurrency(amount);
        if (value <= 0) {
            setError('Informe um valor válido.');
            return;
        }

        await addTransaction(type, value, description);
        onSuccess();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-600 mb-2">
                        {isWithdrawal ? 'Informe o valor total retirado do caixa' : 'Informe o valor total adicionado ao caixa'}
                    </p>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Valor *</label>
                        <input
                            type="text"
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-[#0099FF] focus:outline-none"
                            placeholder="R$ 0,00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">{descriptionLabel}</label>
                        <input
                            type="text"
                            className={`w-full border ${error && isWithdrawal && description.length < 10 ? 'border-red-500' : 'border-gray-300'} rounded px-3 py-2 text-sm focus:border-[#0099FF] focus:outline-none`}
                            placeholder={isWithdrawal ? "Justificativa da retirada" : "Motivo (opcional)"}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                    <button onClick={onClose} className="px-6 py-2 rounded-md font-bold text-gray-600 hover:bg-gray-200 transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="bg-[#0099FF] text-white px-6 py-2 rounded-md font-bold hover:bg-blue-600 transition-colors"
                    >
                        {buttonLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CashierTransactionModal;
