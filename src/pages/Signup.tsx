import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, User, Store, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generateSlug } from '../utils/format';
import { toast } from 'react-hot-toast';

const Signup = () => {
    const [storeName, setStoreName] = useState('');
    const [ownerName, setOwnerName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Generate and verify slug
            const slug = generateSlug(storeName);

            const { data: existingStores } = await supabase
                .from('establishment_settings')
                .select('id')
                .eq('slug', slug)
                .limit(1);

            if (existingStores && existingStores.length > 0) {
                throw new Error('Este nome de loja já está em uso. Tente outro nome.');
            }

            // 2. Sign up user in Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: ownerName,
                    }
                }
            });

            if (authError) {
                if (authError.status === 429) {
                    throw new Error('Limite de tentativas excedido. Por favor, aguarde alguns minutos antes de tentar novamente.');
                }
                throw authError;
            }
            if (!authData.user) throw new Error('Falha ao criar usuário. Tente novamente.');

            // 3. Create Establishment
            await supabase
                .from('establishment_settings')
                .select()
                .limit(1); // Just to check connection if needed, but we insert next

            const { data: newStore, error: insertError } = await supabase
                .from('establishment_settings')
                .insert([{
                    name: storeName,
                    slug: slug,
                    business_name: storeName
                }])
                .select()
                .single();

            if (insertError) throw insertError;

            // 4. Create Collaborator
            const { error: collabError } = await supabase
                .from('collaborators')
                .insert([{
                    name: ownerName,
                    email: email,
                    establishment_id: newStore.id,
                    role: 'Proprietário',
                    active: true,
                    permissions: 'all'
                }]);

            if (collabError) throw collabError;

            toast.success('Loja criada com sucesso! Verifique seu email se necessário.');

            // Auto login or redirect to login
            navigate('/login');

        } catch (err: any) {
            console.error('Signup error:', err);
            toast.error(err.message || 'Falha ao criar conta. Verifique os dados.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-blue-200">
                        V
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Crie sua loja no VAPT Food
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Ou{' '}
                    <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                        faça login se já tiver uma conta
                    </Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl shadow-gray-200/50 sm:rounded-2xl sm:px-10 border border-gray-100">
                    <form className="space-y-6" onSubmit={handleSignup}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Nome da Loja
                            </label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Store size={18} className="text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={storeName}
                                    onChange={(e) => setStoreName(e.target.value)}
                                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                                    placeholder="Ex: Pizzaria do Vale"
                                />
                            </div>
                            {storeName && (
                                <p className="mt-1 text-xs text-gray-400">
                                    Seu link será: vaptfood.com/{generateSlug(storeName)}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Seu Nome Completo
                            </label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User size={18} className="text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={ownerName}
                                    onChange={(e) => setOwnerName(e.target.value)}
                                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                                    placeholder="João Silva"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail size={18} className="text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                                    placeholder="joao@email.com"
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Senha
                            </label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock size={18} className="text-gray-400" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                                    placeholder="••••••••"
                                    minLength={6}
                                    autoComplete="new-password"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <span className="flex items-center gap-2">
                                        Criar minha loja agora
                                        <ArrowRight size={18} />
                                    </span>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate('/login')}
                                className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                            >
                                Já tenho uma conta? Fazer Login
                            </button>
                        </div>
                    </form>

                    <div className="mt-8">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">
                                    Segurança garantida
                                </span>
                            </div>
                        </div>
                        <p className="mt-4 text-xs text-center text-gray-400">
                            Ao se cadastrar, você concorda com nossos Termos de Uso e Política de Privacidade.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
