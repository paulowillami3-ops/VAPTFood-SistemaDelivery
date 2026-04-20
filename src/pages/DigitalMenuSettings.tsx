import React, { useState, useEffect } from 'react';
import { ChevronDown, Copy, Check, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';

const MENU_STEPS = [
    { id: 1, label: 'Configurações' },
    { id: 2, label: 'Cor e capa da loja' },
    { id: 3, label: 'Descrição e Rodapé' },
    { id: 4, label: 'Produtos em destaque' },
    { id: 5, label: 'Adicionar descartáveis' },
    { id: 6, label: 'Produtos esgotados' },
    { id: 7, label: 'Link do Cardápio' },
    { id: 8, label: 'Clonagem de cardápio iFood' }
];

const COLORS = [
    { name: 'Azul Padrão', value: '#0099ff' },
    { name: 'Vermelho', value: '#FF4444' },
    { name: 'Verde', value: '#00C851' },
    { name: 'Laranja', value: '#FF8800' },
    { name: 'Roxo', value: '#AA66CC' },
    { name: 'Preto', value: '#212121' },
];

const DigitalMenuSettings: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [activeStep, setActiveStep] = useState(1);
    const [copied, setCopied] = useState(false);

    // State mirroring all wizard fields
    const [settings, setSettings] = useState({
        // Step 1
        menu_enabled: true,
        show_order_observation: true,
        show_reorder: true,
        click_to_edit_quantity: false,
        // Step 2
        primary_color: '#0099ff',
        banner_url: '',
        // Step 3
        description: '',
        footer_text: '',
        // Step 4
        highlight_mode: 'promotional' as 'most_ordered' | 'promotional',
        // Step 5
        ask_disposables: false,
        // Step 6
        show_unavailable_items: false
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const { data } = await supabase
                .from('digital_menu_settings')
                .select('*')
                .single();

            if (data) {
                setSettings({
                    menu_enabled: data.menu_enabled !== false,
                    show_order_observation: data.show_order_observation !== false,
                    show_reorder: data.show_reorder !== false,
                    click_to_edit_quantity: data.click_to_edit_quantity === true,
                    primary_color: data.primary_color || '#0099ff',
                    banner_url: data.banner_url || '',
                    description: data.description || '',
                    footer_text: data.footer_text || '',
                    highlight_mode: data.highlight_mode || 'promotional',
                    ask_disposables: data.ask_disposables === true,
                    show_unavailable_items: data.show_unavailable_items === true
                });
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            // Assuming we upsert to ID 1 or based on auth context in real app
            const { error } = await supabase
                .from('digital_menu_settings')
                .upsert({
                    id: 1,
                    ...settings,
                    updated_at: new Date()
                });

            if (error) throw error;
            alert('Configurações salvas!');
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Erro ao salvar. Verifique se o banco de dados suporta todos os campos.');
        } finally {
            setLoading(false);
        }
    };



    const ToggleCard = ({ title, description, checked, onChange }: any) => (
        <div className={`p-6 rounded-lg border-2 mb-4 flex items-start gap-4 transition-all ${checked ? 'border-[#0099FF] bg-[#0099FF]/5 border-dashed' : 'border-gray-200 bg-white'}`}>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input type="checkbox" className="sr-only peer" checked={checked} onChange={(e) => onChange(e.target.checked)} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0099FF]"></div>
            </label>
            <div>
                <h3 className="text-gray-900 font-bold text-base">{title}</h3>
                {description && <p className="text-gray-500 text-sm mt-1">{description}</p>}
            </div>
        </div>
    );

    const PhonePreview = ({ children, headerColor }: { children: React.ReactNode, headerColor?: string }) => (
        <div className="w-[260px] h-[520px] border-[6px] border-[#1e1e1e] rounded-[32px] bg-white overflow-hidden shadow-xl relative mx-auto font-sans">
            {/* Dynamic Header */}
            <div className={`h-16 relative flex items-center justify-center transition-colors duration-300`} style={{ backgroundColor: headerColor || settings.primary_color }}>
                <div className="w-12 h-12 bg-white rounded-full border-2 border-white absolute -bottom-6 left-4 shadow-sm z-10 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-gray-400">LOGO</span>
                </div>
            </div>
            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-gray-50 pt-8 px-3">
                {children}
            </div>
            {/* Home indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-1.5 bg-black/20 rounded-full"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F4F5F7] p-4 md:p-6 font-sans pb-24">
            {/* Breadcrumb */}
            <div className="text-xs text-gray-400 mb-4 md:mb-6 font-medium flex flex-wrap gap-1">
                Início <span className="mx-1">▸</span> Configurações <span className="mx-1">▸</span> Cardápio Digital <span className="mx-1">▸</span> <span className="text-gray-600 font-bold">{MENU_STEPS.find(s => s.id === activeStep)?.label}</span>
            </div>

            <h1 className="text-2xl font-bold text-gray-800 mb-4 md:mb-8">Cardápio Digital</h1>

            {/* Mobile: Horizontal scrollable tabs */}
            <div className="md:hidden -mx-4 mb-4 bg-white border-b border-gray-200 overflow-x-auto">
                <div className="flex w-max px-2">
                    {MENU_STEPS.map((step) => (
                        <button
                            key={step.id}
                            onClick={() => setActiveStep(step.id)}
                            className={`flex items-center gap-1 px-3 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${activeStep === step.id
                                    ? 'border-[#0099FF] text-[#0099FF]'
                                    : 'border-transparent text-gray-500'
                                }`}
                        >
                            {step.id}. {step.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex gap-6 items-start">
                {/* Sidebar Navigation — desktop only */}
                <div className="hidden md:block w-64 bg-white rounded-lg shadow-sm overflow-hidden shrink-0">
                    {MENU_STEPS.map((step) => (
                        <button
                            key={step.id}
                            onClick={() => setActiveStep(step.id)}
                            className={`w-full text-left px-5 py-4 text-sm font-medium border-l-4 transition-colors flex items-center justify-between group ${activeStep === step.id
                                ? 'border-[#0099FF] text-[#0099FF] bg-blue-50'
                                : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                                }`}
                        >
                            <span className="flex gap-2">
                                <span>{step.id}.</span>
                                <span>{step.label}</span>
                            </span>
                        </button>
                    ))}
                </div>

                {/* Main Content */}
                <div className="flex-1 min-w-0 bg-white rounded-lg shadow-sm p-4 md:p-8 min-h-[400px] md:min-h-[600px] flex gap-8">
                    {/* Input Area */}
                    <div className="flex-1 min-w-0">
                        {activeStep === 1 && (
                            <>
                                <h2 className="text-2xl font-bold text-gray-900 mb-1">1. Configurações</h2>
                                <p className="text-gray-500 text-sm mb-8">Configurações do seu cardápio</p>
                                <div className="space-y-4">
                                    <ToggleCard title="Cardápio ativado" description="Você receberá pedidos do cardápio digital." checked={settings.menu_enabled} onChange={(v: boolean) => setSettings({ ...settings, menu_enabled: v })} />
                                    <ToggleCard title="Observação do pedido" description="O campo de observações será exibido no final do pedido." checked={settings.show_order_observation} onChange={(v: boolean) => setSettings({ ...settings, show_order_observation: v })} />
                                    <ToggleCard title="Peça de novo" description="Peça de novo será exibido em seu cardápio." checked={settings.show_reorder} onChange={(v: boolean) => setSettings({ ...settings, show_reorder: v })} />
                                    <ToggleCard title="Edição por clique na quantidade do produto" description="Facilite a personalização dos pedidos." checked={settings.click_to_edit_quantity} onChange={(v: boolean) => setSettings({ ...settings, click_to_edit_quantity: v })} />
                                </div>
                            </>
                        )}

                        {activeStep === 2 && (
                            <>
                                <div className="mb-8">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-1">2. Cor e capa da loja</h2>
                                    <p className="text-gray-500 text-sm">Personalize a cor do cabeçalho do seu Cardápio</p>
                                </div>

                                <div className="mb-8">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Cor e capa da loja *</label>
                                    <div className="relative">
                                        <select
                                            value={COLORS.find(c => c.value === settings.primary_color) ? settings.primary_color : 'custom'}
                                            onChange={(e) => {
                                                if (e.target.value !== 'custom') setSettings({ ...settings, primary_color: e.target.value })
                                            }}
                                            className="w-full appearance-none bg-white border border-gray-300 rounded-md px-4 py-3 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {COLORS.map(c => <option key={c.value} value={c.value}>{c.name}</option>)}
                                            <option value="custom">Personalizada...</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-3.5 text-gray-500 pointer-events-none" size={16} />
                                    </div>
                                    <div className="mt-2 flex items-center gap-2">
                                        <input type="color" value={settings.primary_color} onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })} className="h-8 w-16 cursor-pointer rounded border border-gray-200" />
                                        <span className="text-sm text-gray-500">{settings.primary_color}</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Imagem da capa da loja</label>
                                    <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 flex flex-col items-center justify-center bg-blue-50/50 cursor-pointer hover:bg-blue-50 transition-colors">
                                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-3 shadow-sm border border-blue-100">
                                            <div className="w-6 h-6 rounded-full border-2 border-blue-400"></div>
                                        </div>
                                        <span className="text-blue-500 text-sm font-bold mb-1">Escolha a foto</span>
                                        <span className="text-gray-400 text-xs text-center">Clique aqui ou arraste a<br />foto para cá.</span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">Formatos: .png, .jpg, .jpeg<br />Peso máximo: 1mb<br />Resolução mínima: 800x200px</p>
                                </div>
                            </>
                        )}

                        {activeStep === 3 && (
                            <>
                                <div className="mb-8">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-1">3. Descrição e Rodapé</h2>
                                    <p className="text-gray-500 text-sm">Adicione uma descrição e um rodapé no seu cardápio</p>
                                </div>

                                <div className="mb-8">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Descrição</label>
                                    <textarea
                                        className="w-full border border-gray-300 rounded-md p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none h-24"
                                        placeholder="Ex: Pizzaria mais tradicional da cidade..."
                                        maxLength={40}
                                        value={settings.description}
                                        onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                                    />
                                    <div className="text-right text-xs text-gray-400 mt-1">{settings.description.length}/40</div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Rodapé</label>
                                    <textarea
                                        className="w-full border border-gray-300 rounded-md p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none h-24"
                                        placeholder="Ex: CNPJ 01.001.001/0001-01"
                                        maxLength={40}
                                        value={settings.footer_text}
                                        onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })}
                                    />
                                    <div className="text-right text-xs text-gray-400 mt-1">{settings.footer_text.length}/40</div>
                                </div>
                            </>
                        )}

                        {activeStep === 4 && (
                            <>
                                <div className="mb-8">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-1">4. Produtos em destaque</h2>
                                    <p className="text-gray-500 text-sm">Incentive a compra na sua loja destacando seus produtos</p>
                                </div>

                                <div className="space-y-4">
                                    <label className={`block p-4 rounded-lg border-2 cursor-pointer transition-all ${settings.highlight_mode === 'most_ordered' ? 'border-[#0099FF] bg-[#0099FF]/5 border-dashed' : 'border-gray-200 hover:border-blue-200'}`}>
                                        <div className="flex items-start gap-3">
                                            <input type="radio" name="highlight" className="mt-1" checked={settings.highlight_mode === 'most_ordered'} onChange={() => setSettings({ ...settings, highlight_mode: 'most_ordered' })} />
                                            <div>
                                                <div className="font-bold text-gray-900">Os mais pedidos</div>
                                                <div className="text-sm text-gray-500 mt-1">Os seis produtos mais pedidos da sua loja aparecerão em destaque</div>
                                            </div>
                                        </div>
                                    </label>

                                    <label className={`block p-4 rounded-lg border-2 cursor-pointer transition-all ${settings.highlight_mode === 'promotional' ? 'border-[#0099FF] bg-[#0099FF]/5 border-dashed' : 'border-gray-200 hover:border-blue-200'}`}>
                                        <div className="flex items-start gap-3">
                                            <input type="radio" name="highlight" className="mt-1" checked={settings.highlight_mode === 'promotional'} onChange={() => setSettings({ ...settings, highlight_mode: 'promotional' })} />
                                            <div>
                                                <div className="font-bold text-gray-900">Destaques promocionais</div>
                                                <div className="text-sm text-gray-500 mt-1">Os seis produtos com os maiores descontos cadastrados por você no gestor aparecerão em destaque</div>
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </>
                        )}

                        {activeStep === 5 && (
                            <>
                                <div className="mb-8">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-1">5. Adicionar descartáveis</h2>
                                    <p className="text-gray-500 text-sm">De a opção de seus clientes adicionarem descartáveis ao final do pedido</p>
                                </div>
                                <div className="bg-white rounded-lg">
                                    <ToggleCard
                                        title="Adicionar descartáveis"
                                        description=""
                                        checked={settings.ask_disposables}
                                        onChange={(v: boolean) => setSettings({ ...settings, ask_disposables: v })}
                                    />
                                </div>
                            </>
                        )}

                        {activeStep === 6 && (
                            <>
                                <div className="mb-8">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-1">6. Produtos esgotados</h2>
                                    <p className="text-gray-500 text-sm">Exibir ou não produtos esgotados no cardápio</p>
                                </div>
                                <div className="bg-white rounded-lg">
                                    <ToggleCard
                                        title="Exibir produtos esgotados"
                                        description=""
                                        checked={settings.show_unavailable_items}
                                        onChange={(v: boolean) => setSettings({ ...settings, show_unavailable_items: v })}
                                    />
                                </div>
                            </>
                        )}

                        {activeStep === 7 && (
                            <>
                                <div className="mb-8">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-1">7. Link do Cardápio</h2>
                                    <p className="text-gray-500 text-sm">Este é o link do seu cardápio digital. Compartilhe com quem quiser!</p>
                                </div>

                                <label className="block text-sm font-bold text-gray-700 mb-2">Copie e compartilhe seu link</label>
                                <div className="flex gap-2">
                                    <div className="flex-1 bg-gray-50 border border-gray-300 rounded-md px-4 py-3 text-sm text-gray-600 font-mono">
                                        {`${window.location.protocol}//${window.location.host}/${window.location.pathname.split('/')[1]}/menu`}
                                    </div>
                                    <button
                                        onClick={() => {
                                            const url = `${window.location.protocol}//${window.location.host}/${window.location.pathname.split('/')[1]}/menu`;
                                            navigator.clipboard.writeText(url);
                                            setCopied(true);
                                            setTimeout(() => setCopied(false), 2000);
                                        }}
                                        className="px-4 py-2 border border-gray-200 rounded-md bg-white hover:bg-gray-50 text-gray-600 transition-colors flex items-center justify-center min-w-[50px]"
                                        title="Copiar"
                                    >
                                        {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                                    </button>
                                </div>
                            </>
                        )}

                        {activeStep === 8 && (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4 mt-20">
                                <Info size={48} className="opacity-20" />
                                <p>Integração com iFood em breve.</p>
                            </div>
                        )}
                    </div>

                    {/* Right Preview Area — desktop only */}
                    <div className="hidden md:block w-[300px] shrink-0 pt-12">
                        {activeStep <= 4 && (
                            <PhonePreview>
                                {activeStep === 1 && (
                                    <div className="space-y-3">
                                        <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                                        <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
                                        <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                                    </div>
                                )}
                                {activeStep === 2 && (
                                    <div className="text-center mt-4">
                                        <span className="inline-block px-3 py-1 bg-gray-100 rounded text-[10px] text-gray-500 mb-4 font-bold tracking-wide">SOBRE O ESTABELECIMENTO</span>
                                        <div className="space-y-2">
                                            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white rounded-lg border border-gray-100 shadow-sm mx-1"></div>)}
                                        </div>
                                    </div>
                                )}
                                {activeStep === 3 && (
                                    <div className="flex flex-col h-full">
                                        <div className="border-2 border-[#0099FF] dashed bg-blue-50/30 p-3 rounded-lg relative mb-4 mx-1">
                                            <div className="text-[10px] text-[#0099FF] mb-1 font-bold">DESCRIÇÃO</div>
                                            <div className="text-xs text-gray-600 font-medium break-words leading-relaxed">{settings.description || 'Sua descrição aqui...'}</div>
                                        </div>
                                        <div className="space-y-2 opacity-50 flex-1">
                                            {[1, 2, 3].map(i => <div key={i} className="h-14 bg-white rounded border border-gray-100 mx-1"></div>)}
                                        </div>
                                        <div className="border-2 border-[#0099FF] dashed bg-blue-50/30 p-3 rounded-lg mt-auto mb-4 mx-1">
                                            <div className="text-[10px] text-[#0099FF] mb-1 font-bold">RODAPÉ</div>
                                            <div className="text-xs text-gray-600 font-medium break-words">{settings.footer_text || 'Seu rodapé aqui...'}</div>
                                        </div>
                                    </div>
                                )}
                                {activeStep === 4 && (
                                    <div className="space-y-4 pt-2">
                                        <div className="flex gap-2 overflow-x-hidden pb-2 mx-1">
                                            {[1, 2].map(i => (
                                                <div key={i} className="min-w-[100px] h-32 bg-white border border-gray-100 rounded-lg shadow-sm flex flex-col p-2">
                                                    <div className="bg-orange-100 flex-1 rounded mb-2 bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200)' }}></div>
                                                    <div className="h-2 bg-gray-200 rounded w-full mb-1"></div>
                                                    <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="space-y-2 opacity-50 mx-1">
                                            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white rounded border border-gray-100"></div>)}
                                        </div>
                                    </div>
                                )}
                            </PhonePreview>
                        )}

                        {activeStep === 5 && (
                            <div className={`transition-opacity duration-300 ${!settings.ask_disposables ? 'opacity-50 grayscale' : 'opacity-100'}`}>
                                <PhonePreview>
                                    <div className="absolute inset-0 bg-black/60 z-20 flex items-end justify-center">
                                        <div className="bg-white w-full rounded-t-2xl p-4 animate-in slide-in-from-bottom duration-300">
                                            <h3 className="text-sm font-bold text-center mb-2">Precisa de itens descartáveis?</h3>
                                            <p className="text-center text-[10px] text-gray-500 mb-4 px-4">Itens como: canudos, talheres, guardanapos ou outros.</p>
                                            <div className="space-y-2">
                                                <button className="w-full py-2 border border-[#0099FF] text-[#0099FF] rounded-full text-xs font-bold">Não preciso</button>
                                                <button className="w-full py-2 bg-[#0099FF] text-white rounded-full text-xs font-bold shadow-lg shadow-blue-500/30">Sim, por favor</button>
                                            </div>
                                            <p className="text-[9px] text-center text-gray-400 mt-3">Sua resposta vale para todos os itens deste pedido.</p>
                                        </div>
                                    </div>
                                    <div className="p-2 space-y-4">
                                        <div className="h-40 bg-gray-100 rounded-lg"></div>
                                        <div className="h-4 bg-gray-200 w-3/4 rounded"></div>
                                    </div>
                                </PhonePreview>
                            </div>
                        )}

                        {activeStep === 6 && (
                            <div className="transition-opacity duration-300">
                                <PhonePreview>
                                    <div className="p-2 space-y-2">
                                        <div className="h-8 bg-gray-100 rounded-full w-full mb-4"></div>
                                        <div className="bg-white border rounded-lg p-2 flex gap-2">
                                            <div className="w-16 h-16 bg-gray-200 rounded shrink-0"></div>
                                            <div className="flex-1 space-y-2 pt-1">
                                                <div className="h-3 bg-gray-200 w-3/4 rounded"></div>
                                                <div className="h-3 bg-gray-200 w-1/4 rounded"></div>
                                            </div>
                                        </div>
                                        {/* Esgotado Item */}
                                        <div className={`bg-white border rounded-lg p-2 flex gap-2 relative overflow-hidden ${settings.show_unavailable_items ? 'opacity-60' : 'hidden'}`}>
                                            {settings.show_unavailable_items && (
                                                <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
                                                    <span className="bg-gray-800 text-white text-[10px] px-2 py-1 rounded font-bold">ESGOTADO</span>
                                                </div>
                                            )}
                                            <div className="w-16 h-16 bg-gray-200 rounded shrink-0 grayscale"></div>
                                            <div className="flex-1 space-y-2 pt-1">
                                                <div className="h-3 bg-gray-200 w-3/4 rounded"></div>
                                                <div className="h-3 bg-gray-200 w-1/4 rounded"></div>
                                            </div>
                                        </div>
                                        {/* Normal Item */}
                                        <div className="bg-white border rounded-lg p-2 flex gap-2">
                                            <div className="w-16 h-16 bg-gray-200 rounded shrink-0"></div>
                                            <div className="flex-1 space-y-2 pt-1">
                                                <div className="h-3 bg-gray-200 w-3/4 rounded"></div>
                                                <div className="h-3 bg-gray-200 w-1/4 rounded"></div>
                                            </div>
                                        </div>
                                    </div>
                                </PhonePreview>
                            </div>
                        )}

                        {activeStep === 7 && (
                            <PhonePreview>
                                <div className="absolute top-16 left-4 right-4 h-8 bg-white rounded-full shadow-lg flex items-center px-3 gap-2 z-20">
                                    <div className="w-4 h-4 rounded-full bg-gray-200"></div>
                                    <div className="h-2 w-24 bg-gray-100 rounded"></div>
                                </div>
                                <div className="mt-8 space-y-2 p-2 opacity-50">
                                    {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-white rounded border border-gray-100"></div>)}
                                </div>
                            </PhonePreview>
                        )}
                    </div>
                </div>
            </div>

            {/* Sticky Footer */}
            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 flex justify-end z-10 px-8">
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-[#0099FF] hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-md transition-colors shadow-lg shadow-blue-500/30 flex items-center gap-2"
                >
                    {loading ? 'Salvando...' : 'Salvar Configurações'}
                </button>
            </div>
            <div className="h-20"></div>
        </div>
    );
};

export default DigitalMenuSettings;
