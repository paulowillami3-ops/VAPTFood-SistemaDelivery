import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Search, Utensils, Plus } from 'lucide-react';

const TABS = [
    { id: 'navegacao', label: 'Navegação' },
    { id: 'fotos', label: 'Fotos' },
    { id: 'descricoes', label: 'Descrições' },
    { id: 'esgotados', label: 'Esgotados' },
    { id: 'telainicial', label: 'Tela inicial' }
];

interface WaiterPreferences {
    showDescriptions: boolean;
    showSoldOut: boolean;
    startScreen: string;
    navigationMode: 'items' | 'categories';
    showPhotos: boolean;
}

const DEFAULT_PREFS: WaiterPreferences = {
    showDescriptions: true,
    showSoldOut: true,
    startScreen: 'mesas',
    navigationMode: 'items',
    showPhotos: true
};

const WaiterSettings = () => {
    const navigate = useNavigate();
    const { slug } = useParams();
    const [activeTab, setActiveTab] = useState('navegacao');

    // State
    const [prefs, setPrefs] = useState<WaiterPreferences>(DEFAULT_PREFS);
    const [initialPrefs, setInitialPrefs] = useState<WaiterPreferences>(DEFAULT_PREFS);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        const loadPrefs = () => {
            const saved = localStorage.getItem('waiter_preferences');
            let loadedPrefs = DEFAULT_PREFS;
            if (saved) {
                const parsed = JSON.parse(saved);
                // Ensure navigationMode is valid (migration)
                let mode: 'items' | 'categories' = 'items';
                if (parsed.navigationMode === 'categories') mode = 'categories';

                loadedPrefs = {
                    showDescriptions: parsed.showDescriptions ?? DEFAULT_PREFS.showDescriptions,
                    showSoldOut: parsed.showSoldOut ?? DEFAULT_PREFS.showSoldOut,
                    startScreen: parsed.startScreen ?? DEFAULT_PREFS.startScreen,
                    navigationMode: mode,
                    showPhotos: parsed.showPhotos ?? DEFAULT_PREFS.showPhotos
                };
            }
            setPrefs(loadedPrefs);
            setInitialPrefs(loadedPrefs);
        };
        loadPrefs();
    }, []);

    useEffect(() => {
        const changed = JSON.stringify(prefs) !== JSON.stringify(initialPrefs);
        setHasChanges(changed);
    }, [prefs, initialPrefs]);

    const updatePref = <K extends keyof WaiterPreferences>(key: K, value: WaiterPreferences[K]) => {
        setPrefs(prev => ({ ...prev, [key]: value }));
    };

    // --- Components for Visual Previews ---

    const PhonePreview = ({ mode, showPhotos, showDescriptions, showSoldOut, highlightSoldOut, startScreen }: { mode?: 'items' | 'categories', showPhotos?: boolean, showDescriptions?: boolean, showSoldOut?: boolean, highlightSoldOut?: boolean, startScreen?: 'mesas' | 'comandas' }) => {
        return (
            <div className="w-[280px] h-[500px] border-4 border-[#00223A] rounded-[30px] bg-[#003152] overflow-hidden flex flex-col relative shadow-xl">
                {/* Notch/Status Bar Mock */}
                <div className="h-6 bg-[#00223A] w-full flex justify-end px-4 items-center">
                    <div className="w-12 h-2 bg-gray-600 rounded-full opacity-50"></div>
                </div>

                {/* Header Mock */}
                <div className="bg-[#00223A] p-3 flex items-center justify-between text-white border-b border-white/10">
                    {startScreen ? (
                        <div className="flex items-center gap-2 w-full">
                            <div className="flex-1">
                                <span className="font-bold text-xs block">Mapa de mesas e comandas</span>
                            </div>
                            <Search size={16} />
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-2">
                                <ArrowLeft size={16} />
                                <span className="font-bold text-xs">Mesa 4</span>
                            </div>
                            <Search size={16} />
                        </>
                    )}
                </div>

                {/* Tabs Mock for Start Screen */}
                {startScreen && (
                    <div className="flex bg-[#00223A] border-b border-white/5">
                        <div className={`flex-1 py-2 text-[10px] font-bold text-center border-b-2 ${startScreen === 'mesas' ? 'border-[#0099FF] text-white bg-[#0099FF]/10' : 'border-transparent text-gray-500'}`}>Mesas</div>
                        <div className={`flex-1 py-2 text-[10px] font-bold text-center border-b-2 ${startScreen === 'comandas' ? 'border-[#0099FF] text-white bg-[#0099FF]/10' : 'border-transparent text-gray-500'}`}>Comandas</div>
                    </div>
                )}

                {/* Search Bar Mock for Start Screen */}
                {startScreen && (
                    <div className="p-3 pb-0">
                        <div className="bg-white/10 rounded-md p-2 flex items-center gap-2">
                            <Search size={12} className="text-gray-400" />
                            <div className="h-2 w-24 bg-gray-400/20 rounded-full"></div>
                        </div>

                        {/* Stats Mock */}
                        <div className="flex gap-2 mt-2 text-[8px] text-gray-400">
                            <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>Livres</div>
                            <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>Ocupadas</div>
                            <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>Fechando</div>
                        </div>
                    </div>
                )}

                {/* Tabs Mock for Menu Navigation (Only if NOT start screen) */}
                {!startScreen && mode !== 'categories' && (
                    <div className="flex bg-[#00223A] border-b border-white/5">
                        <div className="flex-1 py-2 text-[10px] font-bold text-center border-b-2 border-[#0099FF] text-white bg-[#0099FF]/10">Categoria 1</div>
                        <div className="flex-1 py-2 text-[10px] font-bold text-center border-b-2 border-transparent text-gray-500">Categoria 2</div>
                        <div className="flex-1 py-2 text-[10px] font-bold text-center border-b-2 border-transparent text-gray-500">Categoria 3</div>
                    </div>
                )}

                {/* Content Mock */}
                <div className="p-3 space-y-3 overflow-hidden flex-1 overflow-y-auto hide-scrollbar">
                    {startScreen ? (
                        <div className="grid grid-cols-3 gap-2">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => {
                                return (
                                    <div key={i} className={`aspect-square rounded-lg flex flex-col items-center justify-center p-1 gap-1 border border-white/5 ${i === 9 ? 'bg-transparent border-dashed border-gray-500' : 'bg-[#002840]'}`}>
                                        {i === 9 ? (
                                            <>
                                                <div className="text-gray-400"><Plus size={12} /></div>
                                                <span className="text-[8px] text-gray-400 text-center leading-tight">Criar {startScreen === 'mesas' ? 'Mesas' : 'Comanda'}</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="text-[10px] font-bold text-white text-center leading-tight">{startScreen === 'mesas' ? `Mesa ${i}` : `Comanda ${i}`}</span>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : mode === 'categories' ? (
                        <div className="grid grid-cols-2 gap-2">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="bg-[#002840] aspect-square rounded-lg flex flex-col items-center justify-center p-2 gap-2 border border-white/5">
                                    <div className="w-8 h-8 rounded-full bg-[#0099FF]/20 flex items-center justify-center text-[#0099FF]">
                                        <Utensils size={14} />
                                    </div>
                                    <div className="w-16 h-2 bg-gray-500 rounded-full"></div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        // List Items
                        <>
                            {/* Section Header */}
                            <div className="bg-[#002840] p-1.5 px-3 -mx-3 mb-2 flex justify-between items-center">
                                <span className="text-[10px] font-bold text-white">Categoria 1</span>
                            </div>

                            {[1, 2, 3].map(i => {
                                // Logic for sold out preview
                                const isSoldOutItem = i === 1 && highlightSoldOut; // Make the first item sold out if highlighting

                                if (isSoldOutItem && !showSoldOut) return null; // Skip if sold out items are hidden

                                return (
                                    <div key={i} className={`flex justify-between items-start border-b border-white/5 pb-2 ${isSoldOutItem ? 'opacity-50 grayscale' : ''}`}>
                                        <div className="flex gap-2 items-start">
                                            {showPhotos && (
                                                <div className="w-10 h-10 rounded-md bg-gray-600 shrink-0 relative overflow-hidden flex items-center justify-center">
                                                    {/* Placeholder IMG */}
                                                    <div className="text-white/20 text-[8px] flex flex-col items-center">
                                                        <Utensils size={12} />
                                                    </div>
                                                    {isSoldOutItem && (
                                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                            <span className="text-[6px] text-white font-bold uppercase tracking-wider">Esgotado</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="flex flex-col gap-1 min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="text-[10px] text-white font-bold leading-tight">Item {i}</div>
                                                    {isSoldOutItem && !showPhotos && (
                                                        <span className="text-[8px] text-red-400 font-bold uppercase">Esgotado</span>
                                                    )}
                                                </div>

                                                {showDescriptions && (
                                                    <div className="text-[8px] text-gray-400 leading-tight w-24 line-clamp-2">
                                                        Descrição do item {i} com detalhes saborosos e ingredientes frescos.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[8px] text-gray-400">à partir de</span>
                                            <div className="text-[10px] text-white font-bold">R$ {25 + (i * 10)},90</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    )}
                </div>
            </div>
        );
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'navegacao':
                return (
                    <div className="space-y-8">
                        {/* Options */}
                        <div className="bg-[#002840] p-6 rounded-lg">
                            <h3 className="text-white font-bold text-lg mb-6">Modo de navegação do cardápio:</h3>
                            <div className="space-y-4">
                                <label className={`flex items-center gap-4 p-5 rounded-lg border-2 cursor-pointer transition-all ${prefs.navigationMode === 'items' ? 'border-[#0099FF] bg-[#0099FF]/10' : 'border-white/10 hover:bg-white/5'}`}>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${prefs.navigationMode === 'items' ? 'border-[#0099FF]' : 'border-gray-500'}`}>
                                        {prefs.navigationMode === 'items' && <div className="w-3 h-3 rounded-full bg-[#0099FF]" />}
                                    </div>
                                    <div className="flex-1">
                                        <span className="text-white font-bold block text-base mb-1">Iniciar pelos itens</span>
                                        <span className="text-gray-400 text-sm">Abre direto a lista de produtos da primeira categoria.</span>
                                    </div>
                                    <input
                                        type="radio"
                                        name="navMode"
                                        className="hidden"
                                        checked={prefs.navigationMode === 'items'}
                                        onChange={() => updatePref('navigationMode', 'items')}
                                    />
                                </label>

                                <label className={`flex items-center gap-4 p-5 rounded-lg border-2 cursor-pointer transition-all ${prefs.navigationMode === 'categories' ? 'border-[#0099FF] bg-[#0099FF]/10' : 'border-white/10 hover:bg-white/5'}`}>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${prefs.navigationMode === 'categories' ? 'border-[#0099FF]' : 'border-gray-500'}`}>
                                        {prefs.navigationMode === 'categories' && <div className="w-3 h-3 rounded-full bg-[#0099FF]" />}
                                    </div>
                                    <div className="flex-1">
                                        <span className="text-white font-bold block text-base mb-1">Iniciar pela categoria</span>
                                        <span className="text-gray-400 text-sm">Mostra todas as categorias primeiro, para o cliente escolher.</span>
                                    </div>
                                    <input
                                        type="radio"
                                        name="navMode"
                                        className="hidden"
                                        checked={prefs.navigationMode === 'categories'}
                                        onChange={() => updatePref('navigationMode', 'categories')}
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Previews (Side by Side) */}
                        <div className="flex flex-wrap justify-center gap-12 mt-8 opacity-80">
                            <div className="flex flex-col items-center gap-4">
                                <span className={`text-sm font-bold ${prefs.navigationMode === 'items' ? 'text-[#0099FF]' : 'text-gray-500'}`}>Iniciar pelos itens</span>
                                <PhonePreview mode="items" showPhotos={prefs.showPhotos} showDescriptions={prefs.showDescriptions} />
                            </div>
                            <div className="flex flex-col items-center gap-4">
                                <span className={`text-sm font-bold ${prefs.navigationMode === 'categories' ? 'text-[#0099FF]' : 'text-gray-500'}`}>Iniciar pela categoria</span>
                                <PhonePreview mode="categories" showPhotos={prefs.showPhotos} showDescriptions={prefs.showDescriptions} />
                            </div>
                        </div>
                    </div>
                );

            case 'fotos':
                return (
                    <div className="space-y-8">
                        <div className="bg-[#002840] p-6 rounded-lg">
                            <h3 className="text-white font-bold text-lg mb-6">Exibir a foto dos itens:</h3>
                            <div className="space-y-4">
                                <label className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all ${prefs.showPhotos ? 'bg-[#0099FF]/10' : 'hover:bg-white/5'}`}>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${prefs.showPhotos ? 'border-[#0099FF]' : 'border-gray-500'}`}>
                                        {prefs.showPhotos && <div className="w-3 h-3 rounded-full bg-[#0099FF]" />}
                                    </div>
                                    <span className="text-white font-bold">Exibir fotos</span>
                                    <input
                                        type="radio"
                                        name="showPhotos"
                                        className="hidden"
                                        checked={prefs.showPhotos}
                                        onChange={() => updatePref('showPhotos', true)}
                                    />
                                </label>

                                <label className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all ${!prefs.showPhotos ? 'bg-[#0099FF]/10' : 'hover:bg-white/5'}`}>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${!prefs.showPhotos ? 'border-[#0099FF]' : 'border-gray-500'}`}>
                                        {!prefs.showPhotos && <div className="w-3 h-3 rounded-full bg-[#0099FF]" />}
                                    </div>
                                    <span className="text-white font-bold">Não exibir fotos</span>
                                    <input
                                        type="radio"
                                        name="showPhotos"
                                        className="hidden"
                                        checked={!prefs.showPhotos}
                                        onChange={() => updatePref('showPhotos', false)}
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Previews */}
                        <div className="flex flex-wrap justify-center gap-12 mt-8">
                            {/* Preview WITH photos */}
                            <div className={`flex flex-col items-center gap-4 transition-opacity ${prefs.showPhotos ? 'opacity-100 scale-105' : 'opacity-40 grayscale scale-95'}`}>
                                <PhonePreview mode="items" showPhotos={true} showDescriptions={prefs.showDescriptions} />
                            </div>

                            {/* Preview WITHOUT photos */}
                            <div className={`flex flex-col items-center gap-4 transition-opacity ${!prefs.showPhotos ? 'opacity-100 scale-105' : 'opacity-40 grayscale scale-95'}`}>
                                <PhonePreview mode="items" showPhotos={false} showDescriptions={prefs.showDescriptions} />
                            </div>
                        </div>

                    </div>
                );

            case 'descricoes':
                return (
                    <div className="space-y-8">
                        <div className="bg-[#002840] p-6 rounded-lg">
                            <h3 className="text-white font-bold text-lg mb-6">Exibir a descrição dos itens:</h3>
                            <div className="space-y-4">
                                <label className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all ${prefs.showDescriptions ? 'bg-[#0099FF]/10' : 'hover:bg-white/5'}`}>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${prefs.showDescriptions ? 'border-[#0099FF]' : 'border-gray-500'}`}>
                                        {prefs.showDescriptions && <div className="w-3 h-3 rounded-full bg-[#0099FF]" />}
                                    </div>
                                    <span className="text-white font-bold">Exibir descrições</span>
                                    <input
                                        type="radio"
                                        name="showDescriptions"
                                        className="hidden"
                                        checked={prefs.showDescriptions}
                                        onChange={() => updatePref('showDescriptions', true)}
                                    />
                                </label>

                                <label className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all ${!prefs.showDescriptions ? 'bg-[#0099FF]/10' : 'hover:bg-white/5'}`}>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${!prefs.showDescriptions ? 'border-[#0099FF]' : 'border-gray-500'}`}>
                                        {!prefs.showDescriptions && <div className="w-3 h-3 rounded-full bg-[#0099FF]" />}
                                    </div>
                                    <span className="text-white font-bold">Não exibir descrições</span>
                                    <input
                                        type="radio"
                                        name="showDescriptions"
                                        className="hidden"
                                        checked={!prefs.showDescriptions}
                                        onChange={() => updatePref('showDescriptions', false)}
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Previews */}
                        <div className="flex flex-wrap justify-center gap-12 mt-8">
                            {/* Preview WITH descriptions */}
                            <div className={`flex flex-col items-center gap-4 transition-opacity ${prefs.showDescriptions ? 'opacity-100 scale-105' : 'opacity-40 grayscale scale-95'}`}>
                                <PhonePreview mode="items" showPhotos={prefs.showPhotos} showDescriptions={true} />
                            </div>

                            {/* Preview WITHOUT descriptions */}
                            <div className={`flex flex-col items-center gap-4 transition-opacity ${!prefs.showDescriptions ? 'opacity-100 scale-105' : 'opacity-40 grayscale scale-95'}`}>
                                <PhonePreview mode="items" showPhotos={prefs.showPhotos} showDescriptions={false} />
                            </div>
                        </div>
                    </div>
                );
            case 'esgotados':
                return (
                    <div className="space-y-8">
                        <div className="bg-[#002840] p-6 rounded-lg">
                            <h3 className="text-white font-bold text-lg mb-6">Exibir itens e adicionais esgotados:</h3>
                            <div className="space-y-4">
                                <label className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all ${prefs.showSoldOut ? 'bg-[#0099FF]/10' : 'hover:bg-white/5'}`}>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${prefs.showSoldOut ? 'border-[#0099FF]' : 'border-gray-500'}`}>
                                        {prefs.showSoldOut && <div className="w-3 h-3 rounded-full bg-[#0099FF]" />}
                                    </div>
                                    <span className="text-white font-bold">Exibir itens e adicionais esgotados</span>
                                    <input
                                        type="radio"
                                        name="showSoldOut"
                                        className="hidden"
                                        checked={prefs.showSoldOut}
                                        onChange={() => updatePref('showSoldOut', true)}
                                    />
                                </label>

                                <label className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all ${!prefs.showSoldOut ? 'bg-[#0099FF]/10' : 'hover:bg-white/5'}`}>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${!prefs.showSoldOut ? 'border-[#0099FF]' : 'border-gray-500'}`}>
                                        {!prefs.showSoldOut && <div className="w-3 h-3 rounded-full bg-[#0099FF]" />}
                                    </div>
                                    <span className="text-white font-bold">Não exibir itens esgotados</span>
                                    <input
                                        type="radio"
                                        name="showSoldOut"
                                        className="hidden"
                                        checked={!prefs.showSoldOut}
                                        onChange={() => updatePref('showSoldOut', false)}
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Previews */}
                        <div className="flex flex-wrap justify-center gap-12 mt-8">
                            {/* Preview WITH sold out (simulating one sold out) */}
                            <div className={`flex flex-col items-center gap-4 transition-opacity ${prefs.showSoldOut ? 'opacity-100 scale-105' : 'opacity-40 grayscale scale-95'}`}>
                                <PhonePreview mode="items" showPhotos={prefs.showPhotos} showDescriptions={prefs.showDescriptions} highlightSoldOut={true} showSoldOut={true} />
                            </div>

                            {/* Preview WITHOUT sold out (hide the sold out one) */}
                            <div className={`flex flex-col items-center gap-4 transition-opacity ${!prefs.showSoldOut ? 'opacity-100 scale-105' : 'opacity-40 grayscale scale-95'}`}>
                                {/* We set highlightSoldOut=true BUT showSoldOut=false, so the item disappears */}
                                <PhonePreview mode="items" showPhotos={prefs.showPhotos} showDescriptions={prefs.showDescriptions} highlightSoldOut={true} showSoldOut={false} />
                            </div>
                        </div>
                    </div>
                );
            case 'telainicial':
                return (
                    <div className="space-y-8">
                        <div className="bg-[#002840] p-6 rounded-lg">
                            <h3 className="text-white font-bold text-lg mb-6">Visualização padrão da Home:</h3>
                            <div className="space-y-4">
                                <label className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all ${prefs.startScreen === 'mesas' ? 'bg-[#0099FF]/10' : 'hover:bg-white/5'}`}>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${prefs.startScreen === 'mesas' ? 'border-[#0099FF]' : 'border-gray-500'}`}>
                                        {prefs.startScreen === 'mesas' && <div className="w-3 h-3 rounded-full bg-[#0099FF]" />}
                                    </div>
                                    <span className="text-white font-bold">Mapa de Mesas</span>
                                    <input
                                        type="radio"
                                        name="startScreen"
                                        className="hidden"
                                        checked={prefs.startScreen === 'mesas'}
                                        onChange={() => updatePref('startScreen', 'mesas')}
                                    />
                                </label>

                                <label className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all ${prefs.startScreen === 'comandas' ? 'bg-[#0099FF]/10' : 'hover:bg-white/5'}`}>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${prefs.startScreen === 'comandas' ? 'border-[#0099FF]' : 'border-gray-500'}`}>
                                        {prefs.startScreen === 'comandas' && <div className="w-3 h-3 rounded-full bg-[#0099FF]" />}
                                    </div>
                                    <span className="text-white font-bold">Mapa de Comandas</span>
                                    <input
                                        type="radio"
                                        name="startScreen"
                                        className="hidden"
                                        checked={prefs.startScreen === 'comandas'}
                                        onChange={() => updatePref('startScreen', 'comandas')}
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Previews */}
                        <div className="flex flex-wrap justify-center gap-12 mt-8">
                            {/* Preview Mesas */}
                            <div className={`flex flex-col items-center gap-4 transition-opacity ${prefs.startScreen === 'mesas' ? 'opacity-100 scale-105' : 'opacity-40 grayscale scale-95'}`}>
                                <PhonePreview startScreen="mesas" />
                            </div>

                            {/* Preview Comandas */}
                            <div className={`flex flex-col items-center gap-4 transition-opacity ${prefs.startScreen === 'comandas' ? 'opacity-100 scale-105' : 'opacity-40 grayscale scale-95'}`}>
                                <PhonePreview startScreen="comandas" />
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const handleSave = () => {
        localStorage.setItem('waiter_preferences', JSON.stringify(prefs));
        setInitialPrefs(prefs);
        navigate(`/${slug}/garcom/app`);
    };

    return (
        <div className="flex flex-col h-screen bg-[#003152]">
            {/* Header */}
            <div className="bg-[#00223A] border-b border-white/10 p-4 flex items-center gap-4 text-white shadow-md sticky top-0 z-20">
                <button onClick={() => navigate(`/${slug}/garcom/app`)}>
                    <ArrowLeft size={24} />
                </button>
                <h1 className="font-bold text-lg">Configurações</h1>
            </div>

            {/* Tabs */}
            <div className="bg-[#002840] flex overflow-x-auto hide-scrollbar">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 min-w-[100px] py-4 text-sm font-bold text-center border-b-2 transition-colors ${activeTab === tab.id
                            ? 'border-[#0099FF] bg-[#0099FF]/10 text-white'
                            : 'border-transparent text-gray-400 hover:text-gray-200'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#003152]">
                <div className="max-w-4xl mx-auto">
                    {renderContent()}
                </div>
            </div>

            {/* Footer */}
            <div className="bg-[#00223A] border-t border-white/10 p-4 sticky bottom-0 z-20">
                <button
                    onClick={handleSave}
                    disabled={!hasChanges}
                    className={`w-full font-bold py-3 rounded-md transition-colors ${hasChanges
                        ? 'bg-[#0099FF] hover:bg-blue-600 text-white'
                        : 'bg-gray-600/50 text-white/50 cursor-not-allowed'
                        }`}
                >
                    Salvar
                </button>
            </div>
        </div>
    );
};

export default WaiterSettings;
