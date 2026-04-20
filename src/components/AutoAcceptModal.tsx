import { X } from 'lucide-react';
import { useState } from 'react';

interface AutoAcceptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (dontShowAgain: boolean) => void;
}

const AutoAcceptModal = ({ isOpen, onClose, onConfirm }: AutoAcceptModalProps) => {
    const [dontShowAgain, setDontShowAgain] = useState(false);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg relative animate-fadeIn">

                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">Seus pedidos serão aceitos automaticamente</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                        Todos os seus pedidos sem agendamento, inclusive os que já estão em análise, serão
                        aceitos automaticamente durante o horário de funcionamento de sua loja, <span className="font-bold text-gray-800">mesmo que o
                            aplicativo VAPT Food Desktop não esteja aberto.</span>
                    </p>
                    <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                        Para desativar esta função, basta clicar no botão novamente.
                    </p>

                    <div className="flex items-center gap-2 mb-2 cursor-pointer" onClick={() => setDontShowAgain(!dontShowAgain)}>
                        <div className={`w-5 h-5 border rounded flex items-center justify-center transition-colors ${dontShowAgain ? 'bg-[#0099FF] border-[#0099FF]' : 'border-gray-300'}`}>
                            {dontShowAgain && <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                        </div>
                        <span className="text-sm font-bold text-gray-700 select-none">Não exibir esta mensagem outra vez</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-gray-100 flex justify-center">
                    <button
                        onClick={() => onConfirm(dontShowAgain)}
                        className="bg-[#0099FF] text-white px-12 py-3 rounded-lg font-bold hover:bg-blue-600 transition-colors shadow-sm"
                    >
                        Ok, entendi
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AutoAcceptModal;
