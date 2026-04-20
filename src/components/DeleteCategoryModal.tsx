import { X } from 'lucide-react';

interface DeleteCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    categoryName: string;
    isLoading?: boolean;
}

const DeleteCategoryModal = ({ isOpen, onClose, onConfirm, categoryName, isLoading = false }: DeleteCategoryModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-2">
                    <h2 className="text-xl font-bold text-gray-800">
                        Deseja excluir a categoria {categoryName} ?
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-4">
                    <p className="text-gray-600">
                        Os itens e adicionais da categoria também serão excluídos.
                    </p>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 flex justify-center gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 font-medium transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="px-8 py-2 bg-[#0099FF] text-white rounded hover:bg-blue-600 font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isLoading ? 'Excluindo...' : 'Excluir'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteCategoryModal;
