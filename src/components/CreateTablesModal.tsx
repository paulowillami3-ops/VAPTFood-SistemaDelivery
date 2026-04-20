import React, { useState, useEffect } from 'react';
import { X, Plus, Minus } from 'lucide-react';

interface CreateTablesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (count: number, startNumber?: number) => void;
    mode?: 'tables' | 'comandas';
    initialStartNumber?: number;
}

const CreateTablesModal: React.FC<CreateTablesModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    mode = 'tables',
    initialStartNumber = 1
}) => {
    const [count, setCount] = useState(1);
    const [startNumber, setStartNumber] = useState(1);

    useEffect(() => {
        if (isOpen) {
            setStartNumber(initialStartNumber);
            setCount(1);
        }
    }, [isOpen, initialStartNumber]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm(count, startNumber);
        onClose();
    };

    const isComandas = mode === 'comandas';
    const title = isComandas ? 'Criar comandas' : 'Criar várias mesas';
    const labelQty = isComandas ? 'Quantidade de Comandas' : 'Quantas mesas deseja criar?';
    const btnLabel = isComandas ? 'Criar comandas' : 'Criar mesas';

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md animate-fadeIn">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Start Number Input (Mainly for Comandas as per request, but useful for Tables too) */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Criar a partir de qual número?
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={startNumber}
                            onChange={(e) => setStartNumber(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                            Insira um número acima de zero
                        </p>
                    </div>

                    {/* Quantity Input */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            {labelQty}
                        </label>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setCount(Math.max(1, count - 1))}
                                className="bg-gray-100 p-2 rounded hover:bg-gray-200 text-gray-600 transition-colors"
                            >
                                <Minus size={20} />
                            </button>

                            <div className="flex-1 text-center py-2 bg-white border border-gray-200 rounded font-bold text-lg">
                                {count}
                            </div>

                            <button
                                onClick={() => setCount(count + 1)}
                                className="bg-gray-100 p-2 rounded hover:bg-gray-200 text-gray-600 transition-colors"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 rounded-b-lg border-t border-gray-100 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-md font-bold hover:bg-gray-300 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 bg-[#0099FF] text-white py-2.5 rounded-md font-bold hover:bg-blue-600 transition-colors"
                    >
                        {btnLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateTablesModal;
