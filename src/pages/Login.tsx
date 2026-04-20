import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, User } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            console.log('Login successful:', data);

            // Get logged in user email
            const userEmail = data.user.email;

            // 1. Find collaborator entry for this user
            const { data: collaborator, error: collabError } = await supabase
                .from('collaborators')
                .select('establishment_id')
                .eq('email', userEmail)
                .single();

            if (collabError || !collaborator) {
                console.error('Collaborator not found:', collabError);
                throw new Error('Este usuário não está vinculado a nenhum estabelecimento.');
            }

            // 2. Fetch establishment slug
            const { data: establishment, error: estError } = await supabase
                .from('establishment_settings')
                .select('slug')
                .eq('id', collaborator.establishment_id)
                .single();

            if (estError || !establishment) {
                console.error('Establishment not found:', estError);
                throw new Error('Estabelecimento não encontrado para este usuário.');
            }

            const redirectSlug = establishment.slug;

            // Navigate to the correct establishment dashboard
            navigate(`/${redirectSlug}/admin/orders`);

        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || 'Falha no login. Verifique suas credenciais.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900">Painel Admin</h1>
                    <p className="text-gray-500 mt-2">Faça login para acessar o sistema</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-500 text-sm rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Usuário / Email</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User size={20} className="text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                    placeholder="admin"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock size={20} className="text-gray-400" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                        Entrar
                    </button>

                    <div className="text-center mt-4">
                        <p className="text-sm text-gray-600">
                            Não tem uma conta?{' '}
                            <Link to="/signup" className="text-blue-600 hover:text-blue-500 font-medium">
                                Cadastre-se agora
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
