import { X } from 'lucide-react';

interface ResumeOrderModalProps {
    isOpen: boolean;
    onResume: () => void;
    onNew: () => void;
    onClose: () => void;
}

const ResumeOrderModal = ({ isOpen, onResume, onNew, onClose }: ResumeOrderModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 pb-4 flex items-start justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Deseja continuar de onde parou?</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="px-6 pb-6 space-y-6">
                    <p className="text-gray-600 text-sm leading-relaxed">
                        Você fechou o PDV com um pedido em andamento, deseja retomar esse pedido ou começar um novo?
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={onResume}
                            className="w-full py-3.5 bg-[#0099FF] hover:bg-blue-600 text-white font-bold rounded-lg transition-colors text-base"
                        >
                            Retomar pedido
                        </button>

                        <button
                            onClick={onNew}
                            className="w-full py-3.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg transition-colors text-base"
                        >
                            Novo pedido
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResumeOrderModal;
