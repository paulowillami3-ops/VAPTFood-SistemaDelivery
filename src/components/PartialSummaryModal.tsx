import { useState, useEffect } from 'react';
import { X, Info } from 'lucide-react';
import { useCashier } from '../contexts/CashierContext';

interface PartialSummaryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PartialSummaryModal = ({ isOpen, onClose }: PartialSummaryModalProps) => {
    const { getSummary, currentSession } = useCashier();
    const [summary, setSummary] = useState<any>(null);

    useEffect(() => {
        if (isOpen) {
            getSummary().then(setSummary);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">Resumo parcial</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="flex justify-between items-center text-xs text-gray-500 mb-6 font-medium">
                        <span>Data e hora de abertura: {new Date(currentSession?.opened_at || Date.now()).toLocaleDateString()} - {new Date(currentSession?.opened_at || Date.now()).toLocaleTimeString()}</span>
                        <span>ID: {currentSession?.id?.slice(0, 8) || '---'}</span>
                    </div>

                    <h3 className="text-sm font-bold text-gray-700 mb-2">Detalhes sobre as vendas até o momento</h3>

                    <div className="border border-gray-100 rounded-lg overflow-hidden mb-6">
                        <div className="flex justify-between items-center bg-white p-3 border-b border-gray-50 text-xs font-bold text-gray-800">
                            <span>Forma de pagamento</span>
                            <span>Saldo</span>
                        </div>
                        <div className="bg-gray-50 px-3 py-2 flex flex-col gap-1 text-sm text-gray-600">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-gray-700">Dinheiro</span>
                                <span className="font-bold text-green-600">{formatCurrency(summary?.cash_balance || 0)}</span>
                            </div>
                            {/* Breakdown */}
                            <div className="pl-4 text-xs text-gray-500 space-y-1 border-l-2 border-gray-200 mt-1">
                                <div className="flex justify-between">
                                    <span>Abertura:</span>
                                    <span>{formatCurrency(currentSession?.initial_balance || 0)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Vendas:</span>
                                    <span>{formatCurrency((summary?.transactions?.filter((t: any) => t.type === 'SALE' && t.payment_method === 'money').reduce((acc: number, t: any) => acc + Number(t.amount), 0)) || 0)}</span>
                                </div>
                                {(summary?.transactions?.some((t: any) => t.type === 'SUPPLY') || false) && (
                                    <div className="flex justify-between text-blue-500">
                                        <span>Suprimentos:</span>
                                        <span>+ {formatCurrency(summary?.transactions?.filter((t: any) => t.type === 'SUPPLY').reduce((acc: number, t: any) => acc + Number(t.amount), 0) || 0)}</span>
                                    </div>
                                )}
                                {(summary?.transactions?.some((t: any) => t.type === 'WITHDRAWAL') || false) && (
                                    <div className="flex justify-between text-red-500">
                                        <span>Retiradas:</span>
                                        <span>- {formatCurrency(summary?.transactions?.filter((t: any) => t.type === 'WITHDRAWAL').reduce((acc: number, t: any) => acc + Number(t.amount), 0) || 0)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="bg-white px-3 py-2 flex justify-between items-center text-sm text-gray-600">
                            <span>Máquina de Cartão</span>
                            <span className="font-medium">{formatCurrency(summary?.card_balance || 0)}</span>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 flex gap-3 items-start relative pr-8">
                        <Info size={20} className="text-gray-500 shrink-0 mt-0.5" />
                        <div className="text-xs text-gray-600 leading-relaxed">
                            <span className="font-bold">Melhore sua experiência com Frente de caixa</span><br />
                            Você ainda não configurou suas bandeiras de cartão. <a href="#" className="text-gray-800 underline">Acesse aqui</a> ou vá em "Configurações", "Estabelecimento", "Pagamento na entrega" para configurar.
                        </div>
                        <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                            <X size={14} />
                        </button>
                    </div>

                    <div className="mt-4 text-xs">
                        <a href="#" className="text-[#0099FF] underline hover:text-blue-700">Saiba mais sobre Resumo parcial na central de ajuda.</a>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-white">
                    <button
                        onClick={onClose}
                        className="bg-[#0099FF] text-white px-8 py-2 rounded-md font-bold hover:bg-blue-600 transition-colors"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PartialSummaryModal;
