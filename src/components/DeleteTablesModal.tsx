import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Info } from 'lucide-react';

interface DeleteTablesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (count: number) => void;
    maxDeletable: number;
}

const DeleteTablesModal: React.FC<DeleteTablesModalProps> = ({ isOpen, onClose, onConfirm, maxDeletable }) => {
    const [count, setCount] = useState(1);

    // Reset count when modal opens or maxDeletable changes
    useEffect(() => {
        if (isOpen) {
            setCount(1);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm(count);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md animate-fadeIn">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800">Excluir várias mesas</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {/* Alert Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 flex items-start gap-3">
                        <div className="bg-blue-100 p-1 rounded-full text-blue-500 mt-0.5">
                            <Info size={16} />
                        </div>
                        <div className="text-sm text-gray-700">
                            <strong>Atenção!</strong> Apenas as mesas livres serão excluídas.<br />
                            Máximo disponível: <strong>{maxDeletable} mesas</strong>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600 ml-auto">
                            <X size={16} />
                        </button>
                    </div>

                    <label className="block text-sm font-bold text-gray-700 mb-2">
                        Quantas mesas deseja excluir?
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
                            onClick={() => setCount(Math.min(maxDeletable, count + 1))}
                            className="bg-gray-100 p-2 rounded hover:bg-gray-200 text-gray-600 transition-colors"
                        >
                            <Plus size={20} />
                        </button>
                    </div>

                    <p className="text-xs text-gray-400 mt-3 border-t border-gray-100 pt-3">
                        As mesas excluídas serão as últimas criadas, desde que estejam desocupadas.
                    </p>
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
                        Excluir mesas
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteTablesModal;
