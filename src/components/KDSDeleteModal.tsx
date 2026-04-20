import { X } from 'lucide-react';

interface KDSDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const KDSDeleteModal = ({ isOpen, onClose, onConfirm }: KDSDeleteModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-[1px] animate-fade-in p-4">
            <div className="absolute inset-0 transition-opacity" onClick={onClose} />

            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-scale-in">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Tem certeza que quer excluir a tela?</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
                        <X size={20} />
                    </button>
                </div>

                <p className="text-gray-600 mb-8 text-sm border-t border-gray-100 pt-4">
                    Você não poderá recuperar essa tela após excluir.
                </p>

                <div className="flex items-center justify-center gap-3 border-t border-gray-100 pt-4">
                    <button
                        onClick={onConfirm}
                        className="px-8 py-2.5 bg-[#0099FF] text-white font-medium rounded-lg hover:bg-blue-600 transition-colors flex-1"
                    >
                        Excluir
                    </button>
                    <button
                        onClick={onClose}
                        className="px-8 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors flex-1"
                    >
                        Voltar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default KDSDeleteModal;
