import { useNavigate } from 'react-router-dom';
import { Store, ArrowRight, CheckCircle, Shield, Zap } from 'lucide-react';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                            V
                        </div>
                        <span className="text-xl font-bold text-gray-900">VAPT Food</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/login')}
                            className="text-gray-600 hover:text-blue-600 font-medium text-sm transition-colors"
                        >
                            Fazer Login
                        </button>
                        <button
                            onClick={() => navigate('/signup')}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm shadow-blue-200"
                        >
                            Começar Agora
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-20 pb-32 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-white -z-10" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold mb-6">
                            <Zap size={14} fill="currentColor" />
                            <span>Sistema para Delivery e Gestão</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6 leading-tight">
                            Gerencie seu delivery <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                                como os gigantes
                            </span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
                            Sistema completo para gestão de pedidos, cardápio digital, KDS e frente de caixa.
                            Tudo que você precisa para escalar sua operação.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-bold transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-1"
                            >
                                <span>Acessar Painel</span>
                                <ArrowRight size={20} />
                            </button>
                            <button
                                onClick={() => navigate('/signup')}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 px-8 py-4 rounded-xl text-lg font-bold transition-all"
                            >
                                <Store size={20} />
                                <span>Criar minha loja</span>
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Preview */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Zap,
                                title: "Frente de Caixa Rápida",
                                description: "PDV otimizado para lançar pedidos em segundos com suporte a múltiplos pagamentos."
                            },
                            {
                                icon: Shield,
                                title: "Gestão Segura",
                                description: "Controle total de permissões, estoque e financeiro com relatórios detalhados."
                            },
                            {
                                icon: CheckCircle,
                                title: "Sem Comissões",
                                description: "Tenha seu próprio canal de vendas e pare de pagar taxas abusivas."
                            }
                        ].map((feature, idx) => (
                            <div key={idx} className="p-6 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-gray-100">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-4">
                                    <feature.icon size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-gray-100 py-12 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white font-bold">V</div>
                        <span className="font-bold text-gray-900">VAPT Food</span>
                    </div>
                    <p className="text-gray-500 text-sm">
                        © {new Date().getFullYear()} VAPT Food. Todos os direitos reservados.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
