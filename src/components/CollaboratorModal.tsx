import { useState, useEffect, useRef } from 'react';
import { X, Eye, EyeOff, Check, User, Trash2, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useEstablishment } from '../contexts/EstablishmentContext';

interface Collaborator {
    id?: number;
    name: string;
    role: string;
    phone: string;
    active: boolean;
    cpf?: string;
    email?: string;
    permissions?: string;
    image_url?: string;
    establishment_id?: number;
}

interface CollaboratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    collaboratorToEdit?: Collaborator | null;
    defaultRole?: string;
}

const CollaboratorModal = ({ isOpen, onClose, onSuccess, collaboratorToEdit, defaultRole }: CollaboratorModalProps) => {
    const { establishment } = useEstablishment();
    const [name, setName] = useState('');
    const [cpf, setCpf] = useState('');
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
    const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const availablePermissions = [
        "Relatórios",
        "Assistente virtual",
        "Aumente suas vendas",
        "Assinatura",
        "Configurações",
        "Ponto de venda",
        "Estabelecimento",
        "Cupom",
        "Pesquisa de satisfação",
        "Itens do menu",
        "Configurações - Região de atendimento",
        "Aba - Compre + Ganhe +",
        "Aba - Cashback",
        "Aba - Recuperador de vendas",
        "Aba - Mesas e garçom",
        "Gestor de cardápio - edição",
        "Frente de caixa - aberto",
        "Edição de pedidos prontos",
        "Emissão de nota fiscal",
        "Emissão de nota fiscal (NFC-e)",
        "Financeiro",
        "Compras",
        "Controle de estoque"
    ];

    // Password criteria state
    const [criteria, setCriteria] = useState({
        minChar: false,
        upperLower: false,
        number: false,
        symbol: false
    });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsPermissionsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (collaboratorToEdit) {
            setName(collaboratorToEdit.name);
            setRole(collaboratorToEdit.role || '');
            setPhone(collaboratorToEdit.phone || '');
            setCpf(collaboratorToEdit.cpf || '');
            setEmail(collaboratorToEdit.email || '');
            setImagePreview(collaboratorToEdit.image_url || null);

            try {
                if (collaboratorToEdit.permissions) {
                    try {
                        const parsed = JSON.parse(collaboratorToEdit.permissions);
                        if (Array.isArray(parsed)) setSelectedPermissions(parsed);
                        else setSelectedPermissions([collaboratorToEdit.permissions]);
                    } catch {
                        // Fallback for legacy simple string permissions
                        setSelectedPermissions([collaboratorToEdit.permissions]);
                    }
                } else {
                    setSelectedPermissions([]);
                }
            } catch (e) {
                setSelectedPermissions([]);
            }
        } else {
            resetForm();
        }
    }, [collaboratorToEdit, isOpen]);

    useEffect(() => {
        // Update password criteria
        setCriteria({
            minChar: password.length >= 8,
            upperLower: /[a-z]/.test(password) && /[A-Z]/.test(password),
            number: /\d/.test(password),
            symbol: /[$#@]/.test(password)
        });
    }, [password]);

    const resetForm = () => {
        setName('');
        setCpf('');
        setSelectedPermissions([]);
        setEmail('');
        setPassword('');
        setPhone('');
        setRole(defaultRole || '');
        setImage(null);
        setImagePreview(null);
        setCriteria({
            minChar: false,
            upperLower: false,
            number: false,
            symbol: false
        });
    };

    const handlePermissionToggle = (permission: string) => {
        setSelectedPermissions(prev => {
            if (prev.includes(permission)) {
                return prev.filter(p => p !== permission);
            } else {
                return [...prev, permission];
            }
        });
    };

    const handleCpfChange = (value: string) => {
        const v = value.replace(/\D/g, '');
        if (v.length <= 11) {
            let masked = v;
            if (v.length > 9) masked = `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6, 9)}-${v.slice(9)}`;
            else if (v.length > 6) masked = `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6)}`;
            else if (v.length > 3) masked = `${v.slice(0, 3)}.${v.slice(3)}`;
            setCpf(masked);
        }
    };

    const handlePhoneChange = (value: string) => {
        const v = value.replace(/\D/g, '');
        if (v.length <= 11) {
            let masked = v;
            if (v.length > 2) masked = `(${v.slice(0, 2)}) ${v.slice(2)}`;
            if (v.length > 3) masked = `(${v.slice(0, 2)}) ${v.slice(2, 3)} ${v.slice(3)}`;
            if (v.length > 7) masked = `(${v.slice(0, 2)}) ${v.slice(2, 3)} ${v.slice(3, 7)}-${v.slice(7)}`;
            setPhone(masked);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            const objectUrl = URL.createObjectURL(file);
            setImagePreview(objectUrl);
        }
    };

    const handleSave = async () => {
        if (!name || !email) {
            alert('Preencha os campos obrigatórios');
            return;
        }

        setIsSaving(true);
        try {
            let publicUrl = imagePreview;

            // Upload image if selected
            if (image) {
                const fileExt = image.name.split('.').pop();
                const fileName = `collaborator_${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('collaborators')
                    .upload(fileName, image);

                if (!uploadError) {
                    const { data } = supabase.storage.from('collaborators').getPublicUrl(fileName);
                    publicUrl = data.publicUrl;
                }
            }

            const payload = {
                name,
                role: role || '--',
                phone,
                cpf,
                email,
                permissions: JSON.stringify(selectedPermissions),
                image_url: publicUrl,
                establishment_id: establishment?.id,
                ...(password ? { password } : {})
            };

            let error;
            if (collaboratorToEdit?.id) {
                const { error: updateError } = await supabase
                    .from('collaborators')
                    .update(payload)
                    .eq('id', collaboratorToEdit.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('collaborators')
                    .insert(payload);
                error = insertError;
            }

            if (error) throw error;

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving collaborator:', error);
            alert('Erro ao salvar colaborador.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 transition-opacity"
                    onClick={onClose}
                />
            )}

            <div className={`fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>

                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">
                        {collaboratorToEdit
                            ? (defaultRole === 'Garçom' ? 'Editar Garçom' : 'Editar colaborador')
                            : (defaultRole === 'Garçom' ? 'Cadastrar Garçom' : 'Cadastrar colaborador')}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Nome do garçom *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                            placeholder={defaultRole === 'Garçom' ? "Ex: Everaldo Santos" : "Digite o nome do colaborador(a)"}
                        />
                    </div>

                    {defaultRole !== 'Garçom' && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">CPF *</label>
                            <input
                                type="text"
                                value={cpf}
                                onChange={(e) => handleCpfChange(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                                placeholder="Digite o CPF"
                                maxLength={14}
                            />
                        </div>
                    )}

                    {defaultRole !== 'Garçom' && (
                        <div ref={dropdownRef} className="relative">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Permissões *</label>
                            <button
                                type="button"
                                onClick={() => setIsPermissionsOpen(!isPermissionsOpen)}
                                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none text-sm bg-white text-left flex justify-between items-center ${isPermissionsOpen ? 'border-border-custom ring-1 ring-border-custom' : 'border-gray-300'}`}
                            >
                                <span className={selectedPermissions.length > 0 ? "text-gray-800" : "text-gray-400"}>
                                    {selectedPermissions.length > 0 ? `${selectedPermissions.length} selecionado(s)` : "Selecione"}
                                </span>
                                <div className="pointer-events-none">
                                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className={`transform transition-transform ${isPermissionsOpen ? 'rotate-180' : ''}`}>
                                        <path d="M1 1L5 5L9 1" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            </button>

                            {isPermissionsOpen && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                    {availablePermissions.map((perm) => (
                                        <label key={perm} className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-none">
                                            <div className={`w-5 h-5 rounded border mr-3 flex items-center justify-center transition-colors ${selectedPermissions.includes(perm) ? 'bg-[#0099FF] border-[#0099FF]' : 'border-gray-300 bg-white'}`}>
                                                {selectedPermissions.includes(perm) && <Check size={14} className="text-white" />}
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={selectedPermissions.includes(perm)}
                                                onChange={() => handlePermissionToggle(perm)}
                                            />
                                            <span className="text-sm text-gray-700">{perm}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">E-mail *</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                            placeholder={defaultRole === 'Garçom' ? "E-mail do garçom" : "Digite o e-mail"}
                        />
                        {defaultRole === 'Garçom' && (
                            <p className="text-xs text-gray-500 mt-1">Este e-mail será utilizado pelo garçom para acessar o Aplicativo do Garçom.</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            {defaultRole === 'Garçom' ? "Senha do garçom *" : "Senha *"}
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                                placeholder={defaultRole === 'Garçom' ? "Senha do garçom" : "Digite a senha"}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 mb-2">Crie uma senha forte com os critérios abaixo:</p>

                        <div className="space-y-1">
                            <div className={`flex items-center gap-2 text-xs ${criteria.minChar ? 'text-green-500' : 'text-gray-400'}`}>
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${criteria.minChar ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}>
                                    {criteria.minChar ? <Check size={10} /> : <div className="w-2 h-0.5 bg-gray-300" />}
                                </div>
                                No mínimo 8 caracteres
                            </div>
                            <div className={`flex items-center gap-2 text-xs ${criteria.upperLower ? 'text-green-500' : 'text-gray-400'}`}>
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${criteria.upperLower ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}>
                                    {criteria.upperLower ? <Check size={10} /> : <div className="w-2 h-0.5 bg-gray-300" />}
                                </div>
                                Letras maiúsculas e minúsculas
                            </div>
                            <div className={`flex items-center gap-2 text-xs ${criteria.number ? 'text-green-500' : 'text-gray-400'}`}>
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${criteria.number ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}>
                                    {criteria.number ? <Check size={10} /> : <div className="w-2 h-0.5 bg-gray-300" />}
                                </div>
                                Pelo menos 1 número
                            </div>
                            <div className={`flex items-center gap-2 text-xs ${criteria.symbol ? 'text-green-500' : 'text-gray-400'}`}>
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${criteria.symbol ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}>
                                    {criteria.symbol ? <Check size={10} /> : <div className="w-2 h-0.5 bg-gray-300" />}
                                </div>
                                Símbolo ou caractere especial ($#@)
                            </div>
                        </div>
                    </div>

                    {defaultRole !== 'Garçom' && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Número WhatsApp *</label>
                            <input
                                type="text"
                                value={phone}
                                onChange={(e) => handlePhoneChange(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                                placeholder="(_) __-_"
                                maxLength={16}
                            />
                            {defaultRole === 'Garçom' && (
                                <p className="text-xs text-gray-500 mt-1">Número do WhatsApp do garçom para envio do link de finalização do cadastro e mais informações.</p>
                            )}
                        </div>
                    )}

                    {defaultRole !== 'Garçom' && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Cargo *</label>
                            <input
                                type="text"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                                placeholder="-- --"
                            />
                        </div>
                    )}

                    {defaultRole !== 'Garçom' && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Imagem</label>

                            {!imagePreview ? (
                                <div
                                    className="border-2 border-dashed border-[#0099FF] bg-[#0099FF]/5 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-[#0099FF]/10 transition-colors"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <div className="w-16 h-16 border-2 border-[#0099FF] rounded-lg flex items-center justify-center mb-3">
                                        <User size={32} className="text-[#0099FF]" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 text-center">Escolha a foto</span>
                                    <span className="text-xs text-gray-500 text-center mt-1">Clique aqui ou arraste a foto para cá.</span>
                                </div>
                            ) : (
                                <div className="border border-gray-200 rounded-lg p-4 w-fit">
                                    <div className="border border-gray-100 rounded p-1 mb-3">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-32 h-40 object-cover rounded"
                                        />
                                    </div>
                                    <div className="flex gap-2 justify-center">
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="p-2 border border-[#0099FF] rounded hover:bg-blue-50 text-[#0099FF] transition-colors"
                                        >
                                            <RefreshCw size={18} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setImage(null);
                                                setImagePreview(null);
                                            }}
                                            className="p-2 border border-[#0099FF] rounded hover:bg-blue-50 text-[#0099FF] transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                accept="image/png, image/jpeg, image/jpg, image/webp"
                                onChange={handleImageChange}
                            />

                            <div className="mt-2 text-[10px] text-gray-400">
                                <p>Formatos: .png, .jpg, .jpeg, .webp</p>
                                <p>Peso máximo: 20mb</p>
                                <p>Resolução mínima: 200px</p>
                            </div>
                        </div>
                    )}

                    <div className="h-4"></div>
                </div>

                <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-white">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-8 py-2.5 bg-[#0099FF] text-white rounded-lg font-bold hover:bg-blue-600 transition-colors disabled:opacity-70 text-sm shadow-sm"
                    >
                        {isSaving ? 'Salvando...' : 'Salvar'}
                    </button>
                    <button
                        onClick={onClose}
                        className="px-8 py-2.5 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-lg font-bold transition-colors text-sm"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </>
    );
};

export default CollaboratorModal;
