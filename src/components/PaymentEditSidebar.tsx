import { useState, useEffect } from 'react';
import { X, ChevronRight, CreditCard, Banknote, Split, Trash2, Check, ArrowLeft } from 'lucide-react';


interface PaymentEditSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (methods: any[]) => void;
    order: any; // Type strictly if possible
}

type PaymentMethod = {
    id: string;
    type: 'money' | 'card';
    cardType?: 'credit' | 'debit';
    amount: number;
    changeFor?: number;
};

export default function PaymentEditSidebar({ isOpen, onClose, order, onSave }: PaymentEditSidebarProps) {
    const [view, setView] = useState<'MAIN' | 'SPLIT'>('MAIN');
    const [splitPayments, setSplitPayments] = useState<PaymentMethod[]>([]);

    // Split Input States
    const [selectedType, setSelectedType] = useState<'money' | 'card'>('money');
    const [amountStr, setAmountStr] = useState('');
    const [changeStr, setChangeStr] = useState('');
    const [showSuccessToast, setShowSuccessToast] = useState(false);

    useEffect(() => {
        if (isOpen && order) {
            setView('MAIN');
            setSplitPayments([]);
            setAmountStr('');
            setChangeStr('');
        }
    }, [isOpen, order]);

    const totalOrder = order?.total_amount || 0;
    const totalPaid = splitPayments.reduce((acc, p) => acc + p.amount, 0);
    const remaining = Math.max(0, totalOrder - totalPaid);

    const handleAddPayment = () => {
        const amount = parseFloat(amountStr.replace(',', '.'));
        if (!amount || amount <= 0) return;

        // Use user input change if provided, otherwise 0
        const change = changeStr ? parseFloat(changeStr.replace(',', '.')) : 0;

        const newPayment: PaymentMethod = {
            id: Math.random().toString(36).substr(2, 9),
            type: selectedType,
            amount: amount,
            changeFor: change
        };

        setSplitPayments([...splitPayments, newPayment]);
        setAmountStr('');
        setChangeStr('');

        // Show toast
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);

        // Auto-focus logic or reset could go here
    };

    const handleRemovePayment = (id: string) => {
        setSplitPayments(splitPayments.filter(p => p.id !== id));
    };

    const handleConclude = async () => {
        onSave(splitPayments);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={onClose} />
            <div className={`fixed right-0 top-0 h-full w-[400px] bg-white z-[110] shadow-2xl transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        {view === 'SPLIT' && (
                            <button onClick={() => setView('MAIN')} className="p-1 hover:bg-gray-100 rounded">
                                <ArrowLeft size={20} className="text-gray-500" />
                            </button>
                        )}
                        <h2 className="text-lg font-bold text-gray-800">
                            {view === 'MAIN' ? 'Forma de pagamento' : 'Pagamento Dividido'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col h-[calc(100%-60px)] overflow-y-auto">

                    {view === 'MAIN' ? (
                        <div className="space-y-3">
                            <p className="text-gray-500 mb-4">Selecione como o cliente irá pagar</p>

                            <button
                                onClick={() => {
                                    onSave([{ id: 'single', type: 'money', amount: order?.total_amount || 0 }]);
                                    onClose();
                                }}
                                className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                        <Banknote size={20} />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-gray-800 group-hover:text-blue-600">[D] Dinheiro</div>
                                        <div className="text-xs text-gray-500">em espécie no balcão</div>
                                    </div>
                                </div>
                                <ChevronRight size={20} className="text-gray-300 group-hover:text-blue-500" />
                            </button>

                            <button
                                onClick={() => {
                                    onSave([{ id: 'single', type: 'card', amount: order?.total_amount || 0 }]);
                                    onClose();
                                }}
                                className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                        <CreditCard size={20} />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-gray-800 group-hover:text-blue-600">[C] Cartão</div>
                                        <div className="text-xs text-gray-500">débito ou crédito na máquina</div>
                                    </div>
                                </div>
                                <ChevronRight size={20} className="text-gray-300 group-hover:text-blue-500" />
                            </button>

                            <button
                                onClick={() => setView('SPLIT')}
                                className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center text-cyan-600">
                                        <Split size={20} />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-gray-800 group-hover:text-blue-600">[R] Dividir</div>
                                        <div className="text-xs text-gray-500">combinar formas de pagamento</div>
                                    </div>
                                </div>
                                <ChevronRight size={20} className="text-gray-300 group-hover:text-blue-500" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full relative">
                            {/* Summary Stats */}
                            <div className="grid grid-cols-3 gap-4 mb-6 border border-gray-100 rounded-lg p-3 bg-gray-50 text-center">
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Total</div>
                                    <div className="font-bold text-gray-800">R$ {totalOrder.toFixed(2).replace('.', ',')}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Pago</div>
                                    <div className="font-bold text-green-600">R$ {totalPaid.toFixed(2).replace('.', ',')}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Falta</div>
                                    <div className="font-bold text-red-500">R$ {remaining.toFixed(2).replace('.', ',')}</div>
                                </div>
                            </div>

                            {/* Toast Notification */}
                            {showSuccessToast && (
                                <div className="absolute top-20 right-0 left-0 bg-green-500 text-white px-4 py-3 rounded shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2 z-10">
                                    <div className="flex items-center gap-2">
                                        <Check size={18} />
                                        <span className="font-medium">Pagamento adicionado!</span>
                                    </div>
                                    <button onClick={() => setShowSuccessToast(false)} className="text-white/80 hover:text-white">
                                        <X size={16} />
                                    </button>
                                </div>
                            )}

                            {/* Add Payment Form */}
                            {remaining > 0 ? (
                                <div className="mb-6">
                                    <h3 className="text-sm font-bold text-gray-800 mb-3">
                                        Adicione a {splitPayments.length + 1}ª forma de pagamento
                                    </h3>

                                    <div className="flex gap-3 mb-4">
                                        <button
                                            onClick={() => setSelectedType('money')}
                                            className={`flex-1 p-3 rounded border flex items-center justify-center gap-2 transition-all ${selectedType === 'money' ? 'border-green-500 bg-green-50 text-green-700' : 'border-dashed border-gray-300 text-gray-500'}`}
                                        >
                                            <Banknote size={20} />
                                            [D] Dinheiro
                                        </button>
                                        <button
                                            onClick={() => setSelectedType('card')}
                                            className={`flex-1 p-3 rounded border flex items-center justify-center gap-2 transition-all ${selectedType === 'card' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-dashed border-gray-300 text-gray-500'}`}
                                        >
                                            <CreditCard size={20} />
                                            [C] Cartão
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Valor a ser pago</label>
                                            <input
                                                type="text"
                                                value={amountStr}
                                                onChange={(e) => setAmountStr(e.target.value)}
                                                placeholder={remaining > 0 ? remaining.toFixed(2).replace('.', ',') : "0,00"}
                                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                            />
                                        </div>

                                        {selectedType === 'money' && (
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-1">Troco para (opcional)</label>
                                                <input
                                                    type="text"
                                                    value={changeStr}
                                                    onChange={(e) => setChangeStr(e.target.value)}
                                                    placeholder="R$ 0,00"
                                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                                />
                                            </div>
                                        )}

                                        <div className="flex gap-2 mt-4">
                                            <button
                                                onClick={() => {
                                                    setAmountStr('');
                                                    setChangeStr('');
                                                }}
                                                className="flex-1 py-2 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                                            >
                                                [ ESC ] Cancelar
                                            </button>
                                            <button
                                                onClick={handleAddPayment}
                                                className="flex-1 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors font-bold"
                                            >
                                                [ ENTER ] Confirmar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : null}

                            {/* Added list */}
                            <div className="flex-1 overflow-y-auto">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-bold text-gray-800">Pagamentos adicionados</h3>
                                    <div className="text-xs text-gray-400 flex items-center gap-1">
                                        <div className="w-4 h-4 text-[10px] bg-gray-200 rounded flex items-center justify-center">⭡</div>
                                        <div className="w-4 h-4 text-[10px] bg-gray-200 rounded flex items-center justify-center">⭣</div>
                                        Navegação
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {splitPayments.map((p) => (
                                        <div key={p.id} className="p-3 border border-gray-200 rounded text-sm flex items-center justify-between">
                                            <div>
                                                <div className="font-bold text-gray-800">{p.type === 'money' ? 'Dinheiro' : 'Cartão'}</div>
                                                <div className="text-green-600 font-bold">R$ {p.amount.toFixed(2).replace('.', ',')}</div>
                                                {(p.changeFor || 0) > 0 && <div className="text-xs text-gray-400">Troco para R$ {(p.changeFor || 0).toFixed(2).replace('.', ',')}</div>}
                                            </div>
                                            <button onClick={() => handleRemovePayment(p.id)} className="text-gray-400 hover:text-red-500 p-1">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Footer Conclude */}
                            {remaining <= 0 && (
                                <div className="mt-auto pt-4 border-t border-gray-100">
                                    <button
                                        onClick={handleConclude}
                                        className="w-full py-3 bg-[#0099FF] text-white font-bold rounded-lg hover:bg-blue-600 transition-colors shadow-lg shadow-blue-200"
                                    >
                                        [ ENTER ] Concluir
                                    </button>
                                </div>
                            )}

                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
