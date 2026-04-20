import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface WaiterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

type ModalMode = 'invite' | 'manual';

const WaiterModal: React.FC<WaiterModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [mode, setMode] = useState<ModalMode>('manual');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Form states
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Password criteria state
    const [criteria, setCriteria] = useState({
        minChar: false,
        upperLower: false,
        number: false,
        symbol: false
    });

    const resetForm = () => {
        setMode('invite');
        setName('');
        setEmail('');
        setPassword('');
        setShowPassword(false);
        setIsLoading(false);
    };

    useEffect(() => {
        if (!isOpen) {
            resetForm();
        }
    }, [isOpen]);

    useEffect(() => {
        setCriteria({
            minChar: password.length >= 8,
            upperLower: /[a-z]/.test(password) && /[A-Z]/.test(password),
            number: /\d/.test(password),
            symbol: /[$#@]/.test(password)
        });
    }, [password]);


    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const validateManualForm = () => {
        if (!name.trim()) return "Nome é obrigatório";
        if (!email.trim()) return "E-mail é obrigatório";
        if (!password) return "Senha é obrigatória";

        // Check password criteria
        if (!criteria.minChar || !criteria.upperLower || !criteria.number || !criteria.symbol) {
            return "A senha não atende aos critérios de segurança";
        }
        return null;
    };

    const handleSave = async () => {
        const error = validateManualForm();
        if (error) {
            alert(error);
            return;
        }

        setIsLoading(true);
        try {
            const { error: dbError } = await supabase
                .from('collaborators')
                .insert({
                    name,
                    email,
                    role: 'Garçom',
                    active: true,
                    // If the backend handles password hashing via trigger or if we send it raw (unlikely safe but matching previous code)
                    // The previous CollaboratorModal sent 'password' field directly, so we follow that pattern.
                    password,
                    permissions: JSON.stringify([]) // Default no specific permissions, or maybe some waiter defaults
                });

            if (dbError) throw dbError;

            alert('Garçom cadastrado com sucesso!');
            if (onSuccess) onSuccess();
            handleClose();
        } catch (err) {
            console.error('Error saving waiter:', err);
            alert('Erro ao cadastrar garçom. Verifique se o CPF ou E-mail já estão cadastrados.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInvite = async () => {
        if (!name.trim()) {
            alert('Preencha o nome para enviar o convite.');
            return;
        }

        setIsLoading(true);
        try {
            // For invite, we arguably still create a record, maybe without password?
            // Or maybe we treat it as a different flow. 
            // For now, let's create the record with a status or just basic info
            const { error: dbError } = await supabase
                .from('collaborators')
                .insert({
                    name,
                    role: 'Garçom',
                    active: true, // or false until they accept? Let's check CollaboratorModal behavior. It used active boolean.
                    permissions: JSON.stringify([])
                });

            if (dbError) throw dbError;

            alert(`Convite enviado para ${name}! (Simulação)`);
            if (onSuccess) onSuccess();
            handleClose();
        } catch (err) {
            console.error('Error inviting waiter:', err);
            alert('Erro ao enviar convite.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">
                        {mode === 'invite' ? 'Convidar Garçom' : 'Cadastrar Garçom'}
                    </h2>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto">
                    {mode === 'invite' ? (
                        <div className="space-y-6">
                            <p className="text-sm text-gray-600">
                                Preencha os campos abaixo com as informações do seu garçom e clique no botão enviar convite.
                            </p>
                            <p className="text-sm text-gray-600">
                                Após clicar em enviar, este número receberá uma mensagem com o link para finalizar o cadastro e acessar o aplicativo.
                            </p>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Nome *</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Everaldo Santos"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0099FF] focus:border-transparent text-sm placeholder-gray-400"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>


                            <div className="relative flex items-center gap-4 py-2">
                                <div className="h-px bg-gray-200 flex-1"></div>
                                <span className="text-gray-500 text-sm">ou</span>
                                <div className="h-px bg-gray-200 flex-1"></div>
                            </div>

                            <button
                                onClick={() => setMode('manual')}
                                className="w-full text-[#0099FF] font-bold text-sm hover:underline"
                            >
                                Cadastrar garçom manualmente
                            </button>

                            <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                                <span>Dúvidas com o convite? <a href="#" className="text-[#0099FF] hover:underline">Acesse nossa Central de Ajuda</a></span>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Nome *</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Everaldo Santos"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0099FF] focus:border-transparent text-sm placeholder-gray-400"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>


                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">E-mail *</label>
                                <input
                                    type="email"
                                    placeholder="E-mail do garçom"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0099FF] focus:border-transparent text-sm placeholder-gray-400"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    Este e-mail será utilizado pelo garçom para acessar o Aplicativo do Garçom.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Senha do garçom *</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Senha do garçom"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0099FF] focus:border-transparent text-sm placeholder-gray-400 pr-10"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-400 mt-1 mb-2">
                                    Senha para acessar o app garçom. Crie uma senha forte com os critérios:
                                </p>
                                <ul className="space-y-1 text-xs text-gray-500">
                                    <li className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full border ${criteria.minChar ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}></div>
                                        No mínimo 8 caracteres
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full border ${criteria.upperLower ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}></div>
                                        Letras maiúsculas e minúsculas
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full border ${criteria.number ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}></div>
                                        Pelo menos 1 número
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full border ${criteria.symbol ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}></div>
                                        Símbolo ou caractere especial ($#@)
                                    </li>
                                </ul>
                            </div>



                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 flex items-center justify-between gap-4">
                    {mode === 'invite' ? (
                        <>
                            <div className="flex-1">
                                <button
                                    onClick={handleInvite}
                                    disabled={isLoading}
                                    className="bg-[#0099FF] text-white px-6 py-2 rounded-md font-bold text-sm hover:bg-blue-600 w-full md:w-auto disabled:opacity-70"
                                >
                                    {isLoading ? 'Enviando...' : 'Enviar convite'}
                                </button>
                            </div>
                            <button
                                onClick={handleClose}
                                disabled={isLoading}
                                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md font-bold text-sm hover:bg-gray-200 disabled:opacity-70"
                            >
                                Cancelar
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={handleSave}
                                disabled={isLoading}
                                className="flex-1 bg-[#0099FF] text-white px-6 py-2 rounded-md font-bold text-sm hover:bg-blue-600 disabled:opacity-70"
                            >
                                {isLoading ? 'Salvando...' : 'Salvar'}
                            </button>
                            <button
                                onClick={handleClose}
                                disabled={isLoading}
                                className="flex-1 bg-gray-100 text-gray-700 px-6 py-2 rounded-md font-bold text-sm hover:bg-gray-200 disabled:opacity-70"
                            >
                                Cancelar
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WaiterModal;
