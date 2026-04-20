import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Check, Store } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useEstablishment } from '../../contexts/EstablishmentContext';

const WaiterLogin = () => {
    const navigate = useNavigate();
    const { establishment } = useEstablishment();
    const [showSplash, setShowSplash] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loginSuccess, setLoginSuccess] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowSplash(false);
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Fail fast if establishment is not loaded
        if (!establishment?.id) {
            alert('Erro: Estabelecimento não identificado. Verifique a URL.');
            setIsLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .rpc('waiter_login', {
                    p_email: email,
                    p_password: password,
                    p_establishment_id: establishment.id
                });

            if (error) {
                console.error('Login Query Error:', error);
                alert(`Erro no login: ${error.message}`);
                setIsLoading(false);
                return;
            }

            if (!data || data.length === 0) {
                alert('E-mail ou senha inválidos, ou usuário não é um garçom ativo neste estabelecimento.');
                setIsLoading(false);
                return;
            }

            setLoginSuccess(true);
            const waiterData = data[0];

            setTimeout(() => {
                localStorage.setItem(`waiter_session_${establishment.slug}`, JSON.stringify(waiterData));
                navigate(`/${establishment.slug}/garcom/app`);
            }, 1000);

        } catch (err) {
            console.error('Login error:', err);
            alert('Erro ao processar login.');
            setIsLoading(false);
        }
    };

    if (showSplash) {
        return (
            <div className="fixed inset-0 bg-[#003152] flex flex-col items-center justify-center z-50">
                <div className="flex flex-col items-center animate-fade-in">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl mb-4 relative overflow-hidden border-4 border-[#0099FF]">
                        {establishment?.logo_url ? (
                            <img src={establishment.logo_url} alt={establishment.name} className="w-full h-full object-cover" />
                        ) : (
                            <Store size={40} className="text-[#0099FF]" />
                        )}
                    </div>
                    <div className="text-white text-opacity-80 text-sm font-medium">Aplicativo do</div>
                    <h1 className="text-white text-3xl font-bold tracking-tight">Garçom</h1>
                </div>
                <div className="absolute bottom-8 text-white/30 text-xs flex items-center gap-1">
                    <span>Via</span>
                    <span className="font-bold">{establishment?.name || 'Carregando...'}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#003152] flex flex-col items-center justify-center p-4 relative">
            {loginSuccess && (
                <div className="fixed top-0 left-0 right-0 z-50 animate-slide-down">
                    <div className="bg-[#D1FADF] border-b-4 border-[#32D583] text-[#027A48] px-4 py-3 flex items-center justify-between shadow-md">
                        <div className="flex items-center gap-2">
                            <div className="bg-[#32D583] rounded-full p-0.5">
                                <Check size={12} className="text-white" strokeWidth={3} />
                            </div>
                            <span className="font-medium text-sm">Login efetuado com sucesso!</span>
                        </div>
                        <button onClick={() => setLoginSuccess(false)} className="text-[#027A48]">
                            <XIcon />
                        </button>
                    </div>
                </div>
            )}

            <div className="w-full max-w-sm flex flex-col items-center">
                <div className="mb-8 flex flex-col items-center">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg mb-3 border-4 border-[#004D80] overflow-hidden">
                        {establishment?.logo_url ? (
                            <img src={establishment.logo_url} alt={establishment.name} className="w-full h-full object-cover" />
                        ) : (
                            <Store size={32} className="text-[#004D80]" />
                        )}
                    </div>
                    <div className="text-white/70 text-xs text-center">Aplicativo do</div>
                    <div className="text-white text-xl font-bold text-center">Garçom</div>
                </div>

                <div className="w-full space-y-6">
                    <div className="text-center">
                        <h2 className="text-white text-lg font-bold">Boas-vindas, {establishment?.name || 'Estabelecimento'}!</h2>
                        <p className="text-white/60 text-xs">Identifique-se para acessar</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-white text-xs font-bold mb-1 ml-1">E-mail:</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Seu e-mail"
                                className="w-full bg-white rounded-md px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0099FF]"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-white text-xs font-bold mb-1 ml-1">Senha:</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Sua senha"
                                    className="w-full bg-white rounded-md px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0099FF] pr-10"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-[#0099FF] hover:bg-blue-500 text-white font-bold py-3 rounded-md transition-colors text-sm disabled:opacity-70"
                        >
                            {isLoading ? 'Entrando...' : 'Entrar'}
                        </button>

                        <div className="text-center">
                            <button type="button" className="text-white/60 text-xs hover:text-white transition-colors flex items-center justify-center gap-1 mx-auto">
                                <div className="w-3 h-3 rounded-full border border-white/60 flex items-center justify-center text-[8px] font-serif">?</div>
                                Esqueceu sua senha?
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="absolute bottom-6 flex items-center gap-1 opacity-40">
                <span className="text-white text-[10px]">Via</span>
                <span className="text-white text-[10px] font-bold">{establishment?.name || 'VAPT Food'}</span>
            </div>
        </div>
    );
};

const XIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

export default WaiterLogin;
