import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Plus, Trash2, Check, Utensils, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

type ViewState = 'MENU' | 'DETAILS' | 'CART' | 'SUCCESS_MODAL';

interface CartItem {
    cartId: string;
    id: number;
    name: string;
    price: number;
    quantity: number;
    addons: { id: number, name: string, price: number, quantity: number }[];
    observation: string;
}

interface Category {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
    price: number;
    description: string;
    category_id: number;
    is_available: boolean;
    image_url?: string;
}

interface Addon {
    id: number;
    name: string;
    price: number;
    group_id: number;
}

interface AddonGroup {
    id: number;
    name: string;
    min_quantity: number;
    max_quantity: number;
    selection_mode: 'BOX' | 'SELECTION' | 'QUANTITY';
    is_required: boolean;
}

const WaiterOrder = () => {
    const { id: tableId, slug } = useParams();
    const navigate = useNavigate();

    const [view, setView] = useState<ViewState>('MENU');
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [addons, setAddons] = useState<Addon[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [tableName, setTableName] = useState('');
    const [establishmentId, setEstablishmentId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [addonGroups, setAddonGroups] = useState<AddonGroup[]>([]);
    const [collapsedGroups, setCollapsedGroups] = useState<Record<number, boolean>>({});

    // Details State
    const [currentAddons, setCurrentAddons] = useState<Record<number, number>>({});
    const [observation, setObservation] = useState('');

    // Cart State
    const [cart, setCart] = useState<CartItem[]>([]);

    // Preferences State
    const [showDescriptions, setShowDescriptions] = useState(true);
    const [showSoldOut, setShowSoldOut] = useState(true);
    const [navigationMode, setNavigationMode] = useState<'items' | 'categories'>('items');
    const [showPhotos, setShowPhotos] = useState(true);


    useEffect(() => {
        // Load preferences
        const prefs = localStorage.getItem('waiter_preferences');
        if (prefs) {
            const parsed = JSON.parse(prefs);
            if (parsed.showDescriptions !== undefined) setShowDescriptions(parsed.showDescriptions);
            if (parsed.showSoldOut !== undefined) setShowSoldOut(parsed.showSoldOut);
            if (parsed.navigationMode !== undefined) setNavigationMode(parsed.navigationMode);
            if (parsed.showPhotos !== undefined) setShowPhotos(parsed.showPhotos);
        }
    }, []);

    // Reload prefs on view change
    useEffect(() => {
        const prefs = localStorage.getItem('waiter_preferences');
        if (prefs) {
            const parsed = JSON.parse(prefs);
            if (parsed.navigationMode !== undefined) setNavigationMode(parsed.navigationMode);
            if (parsed.showPhotos !== undefined) setShowPhotos(parsed.showPhotos);
        }
    }, [view]);


    useEffect(() => {
        setCart([]);
        fetchMenuData();
    }, [tableId]);

    const fetchMenuData = async () => {
        if (!tableId) return;
        setLoading(true);
        try {
            // 1. Get establishment_id from the table
            const { data: tableData, error: tableError } = await supabase
                .from('restaurant_tables')
                .select('establishment_id, name')
                .eq('id', tableId)
                .single();

            if (tableError) {
                console.error('[Waiter] Error fetching table:', tableError);
                return;
            }

            if (tableData) {
                setTableName(tableData.name);
                setEstablishmentId(tableData.establishment_id);
            }

            const currentEstablishmentId = tableData.establishment_id;
            if (!currentEstablishmentId) return;

            // 2. Fetch filtered menu data
            const [catRes, prodRes] = await Promise.all([
                supabase.from('categories')
                    .select('*')
                    .eq('establishment_id', currentEstablishmentId)
                    .order('id'),
                supabase.from('products')
                    .select('*')
                    .eq('establishment_id', currentEstablishmentId)
                    .eq('is_available', true)
            ]);

            if (catRes.error) console.error('[Waiter] Categories error:', catRes.error);
            if (prodRes.error) console.error('[Waiter] Products error:', prodRes.error);

            setCategories(catRes.data || []);
            setProducts(prodRes.data || []);

            // Logic for default selection based on prefs
            const prefs = localStorage.getItem('waiter_preferences');
            let currentMode = 'items';
            if (prefs) {
                const parsed = JSON.parse(prefs);
                if (parsed.navigationMode) currentMode = parsed.navigationMode;
            }

            if (currentMode === 'items' && catRes.data && catRes.data.length > 0) {
                setSelectedCategoryId(catRes.data[0].id);
            } else {
                // Categories mode starts with grid (null)
                setSelectedCategoryId(null);
            }

        } catch (error) {
            console.error('[Waiter] Error fetching menu:', error);
            const { data: tableData } = await supabase.from('restaurant_tables').select('name').eq('id', tableId).single();
            if (tableData) setTableName(tableData.name);
        } finally {
            setLoading(false);
        }
    };

    // Fetch addons
    useEffect(() => {
        if (selectedProduct) {
            fetchAddonsForProduct(selectedProduct.id);
        } else {
            setAddons([]);
        }
    }, [selectedProduct]);

    const fetchAddonsForProduct = async (productId: number) => {
        try {
            const { data: groups, error: groupsError } = await supabase
                .from('product_addon_groups')
                .select('id, name, min_quantity, max_quantity, selection_mode, is_required')
                .eq('product_id', productId)
                .order('display_order', { ascending: true });

            if (groupsError) throw groupsError;
            setAddonGroups(groups || []);

            const initialCollapsed: Record<number, boolean> = {};
            groups?.forEach(g => { initialCollapsed[g.id] = false; });
            setCollapsedGroups(initialCollapsed);

            const groupIds = groups?.map(g => g.id) || [];
            if (groupIds.length === 0) {
                setAddons([]);
                return;
            }

            const { data: addonsData, error: addonsError } = await supabase
                .from('product_addons')
                .select('*')
                .in('group_id', groupIds)
                .eq('is_available', true)
                .order('name', { ascending: true });

            if (addonsError) throw addonsError;

            setAddons(addonsData.map(a => ({
                id: a.id,
                name: a.name,
                price: a.price,
                group_id: a.group_id
            })));

        } catch (error) {
            console.error('[Waiter] Error fetching addons:', error);
            setAddons([]);
            setAddonGroups([]);
        }
    };

    const toggleGroup = (groupId: number) => {
        setCollapsedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
    };

    const handleProductClick = (product: Product) => {
        setSelectedProduct(product);
        setCurrentAddons({});
        setObservation('');
        setView('DETAILS');
    };

    const getGroupSelectionCount = (groupId: number) => {
        const groupAddonIds = addons.filter(a => a.group_id === groupId).map(a => a.id);
        return Object.entries(currentAddons)
            .filter(([id]) => groupAddonIds.includes(Number(id)))
            .reduce((acc, [_, qty]) => acc + qty, 0);
    };

    const handleAddAddon = (addonId: number) => {
        const addon = addons.find(a => a.id === addonId);
        if (!addon) return;

        const group = addonGroups.find(g => g.id === addon.group_id);
        if (!group) return;

        const currentCount = getGroupSelectionCount(group.id);

        setCurrentAddons(prev => {
            if (group.selection_mode === 'SELECTION' && group.max_quantity === 1) {
                const groupAddonIds = addons.filter(a => a.group_id === group.id).map(a => a.id);
                const newAddons = { ...prev };
                groupAddonIds.forEach(id => delete newAddons[id]);
                return { ...newAddons, [addonId]: 1 };
            }

            if (group.selection_mode === 'BOX' && group.max_quantity === 1) {
                const newAddons = { ...prev };
                if (newAddons[addonId]) {
                    delete newAddons[addonId];
                } else {
                    if (currentCount >= 1) {
                        const groupAddonIds = addons.filter(a => a.group_id === group.id).map(a => a.id);
                        groupAddonIds.forEach(id => delete newAddons[id]);
                    }
                    newAddons[addonId] = 1;
                }
                return newAddons;
            }

            if (group.max_quantity > 0 && currentCount >= group.max_quantity) {
                return prev;
            }

            return { ...prev, [addonId]: (prev[addonId] || 0) + 1 };
        });
    };

    const handleRemoveAddon = (addonId: number) => {
        setCurrentAddons(prev => {
            const current = prev[addonId] || 0;
            if (current <= 0) return prev;
            return { ...prev, [addonId]: current - 1 };
        });
    };

    const getValidationErrors = () => {
        const errors: string[] = [];
        addonGroups.forEach(group => {
            if (group.min_quantity > 0) {
                const count = getGroupSelectionCount(group.id);
                if (count < group.min_quantity) {
                    errors.push(`"${group.name}": selecione pelo menos ${group.min_quantity}.`);
                }
            }
        });
        return errors;
    };

    const calculateItemTotal = (product: Product, addonsQty: Record<number, number>) => {
        let total = product.price;
        Object.entries(addonsQty).forEach(([addonId, qty]) => {
            const addon = addons.find(a => a.id === Number(addonId));
            if (addon) total += addon.price * qty;
        });
        return total;
    };

    const addToCart = () => {
        if (!selectedProduct) return;
        const errors = getValidationErrors();
        if (errors.length > 0) {
            toast.error(errors[0]);
            return;
        }

        const addonsList = Object.entries(currentAddons)
            .filter(([_, qty]) => qty > 0)
            .map(([addonId, qty]) => {
                const addon = addons.find(a => a.id === Number(addonId))!;
                return { ...addon, quantity: qty };
            });

        const cartItem: CartItem = {
            cartId: Date.now().toString(),
            id: selectedProduct.id,
            name: selectedProduct.name,
            price: calculateItemTotal(selectedProduct, currentAddons),
            quantity: 1,
            addons: addonsList,
            observation
        };

        setCart([...cart, cartItem]);
        setView('CART');
    };

    const removeFromCart = (cartId: string) => {
        setCart(cart.filter(item => item.cartId !== cartId));
    };

    const handleFinishOrder = async () => {
        if (cart.length === 0) {
            toast.error('Adicione itens ao pedido');
            return;
        }
        if (!establishmentId) {
            toast.error('Erro: Estabelecimento não encontrado');
            return;
        }

        setIsSubmitting(true);
        try {
            const cartTotal = cart.reduce((acc, item) => acc + item.price, 0);

            const orderPayload = {
                establishment_id: establishmentId,
                customer_name: tableName || `Mesa ${tableId}`,
                items: cart.map(i => ({
                    id: i.id,
                    name: i.name,
                    quantity: i.quantity,
                    price: i.price,
                    total: i.price * i.quantity,
                    addons: i.addons,
                    observation: i.observation
                })),
                total_amount: cartTotal,
                status: 'PENDING',
                type: 'DINE_IN',
                payment_method: 'PENDING',
                table_id: tableId ? parseInt(tableId) : null,
                table_number: tableName ? tableName.replace(/\D/g, '') : null,
            };

            const { error: orderError } = await supabase.from('orders').insert([orderPayload]);
            if (orderError) throw orderError;

            // Update table
            if (tableId) {
                await supabase.from('restaurant_tables').update({ status: 'OCCUPIED' }).eq('id', tableId);
            }

            toast.success('Pedido enviado!');
            setView('SUCCESS_MODAL');
            setCart([]);
        } catch (error: any) {
            console.error('Error:', error);
            toast.error('Erro ao enviar pedido');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatCurrency = (val: number) => {
        return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    // --- Navigation Handlers ---

    const handleBack = () => {
        if (view === 'DETAILS' || view === 'CART') {
            setView('MENU');
            return;
        }

        // Logic for MENU view back button
        if (navigationMode === 'categories') {
            if (selectedCategoryId !== null) {
                // If viewing Product List, go back to Categories
                setSelectedCategoryId(null);
            } else {
                // If viewing Categories, go Home
                navigate(`/${slug}/garcom/app`);
            }
        } else {
            // 'items' mode always goes back home
            navigate(`/${slug}/garcom/app`);
        }
    };

    const renderHeader = (title: string, backAction: () => void, rightIcon?: React.ReactNode) => (
        <div className="bg-[#00223A] border-b border-white/10 p-4 flex justify-between items-center text-white shadow-md sticky top-0 z-20">
            <div className="flex items-center gap-3">
                <button onClick={backAction} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <span className="font-bold text-lg max-w-[200px] truncate">{title}</span>
            </div>
            <div>
                {rightIcon || <button className="p-2"><Search size={22} /></button>}
            </div>
        </div>
    );

    // Filter products
    const filteredProducts = products.filter(p => p.category_id === selectedCategoryId);

    if (view === 'MENU') {
        if (loading) {
            return <div className="min-h-screen bg-[#003152] flex items-center justify-center text-white">Carregando...</div>;
        }

        // --- RENDER: Category Grid View (Only in 'categories' mode when no category selected) ---
        if (navigationMode === 'categories' && selectedCategoryId === null) {
            return (
                <div className="min-h-screen bg-[#003152] flex flex-col font-sans">
                    {renderHeader(tableName, handleBack)}

                    <div className="p-4 grid grid-cols-2 gap-4 animate-in fade-in zoom-in-95 duration-300">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategoryId(cat.id)}
                                className="bg-[#002840] hover:bg-[#003B5C] border border-white/5 active:scale-95 transition-all p-4 rounded-2xl flex flex-col items-center justify-center gap-3 aspect-square shadow-lg"
                            >
                                <div className="w-14 h-14 rounded-full bg-[#0099FF]/10 flex items-center justify-center text-[#0099FF]">
                                    <Utensils size={28} />
                                </div>
                                <span className="text-white font-bold text-lg text-center leading-tight line-clamp-2">{cat.name}</span>
                            </button>
                        ))}
                    </div>

                    {/* Cart Float */}
                    {cart.length > 0 && (
                        <div className="fixed bottom-0 w-full p-4 bg-[#00223A] border-t border-white/10 z-30">
                            <button
                                onClick={() => setView('CART')}
                                className="w-full bg-[#0099FF] text-white font-bold py-3 rounded-md flex justify-between px-4"
                            >
                                <span>Ver carrinho ({cart.length})</span>
                                <span>{formatCurrency(cart.reduce((acc, item) => acc + item.price, 0))}</span>
                            </button>
                        </div>
                    )}
                </div>
            )
        }

        // --- RENDER: Products List View ---
        return (
            <div className="min-h-screen bg-[#003152] flex flex-col font-sans">
                {renderHeader(tableName, handleBack)}

                {/* Categories Tabs */}
                <div className="flex bg-[#00223A] overflow-x-auto hide-scrollbar border-b border-white/5 shadow-inner px-2 gap-2">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategoryId(cat.id)}
                            className={`flex-none px-6 py-3.5 whitespace-nowrap text-sm font-bold text-center relative transition-colors ${selectedCategoryId === cat.id ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            {cat.name}
                            {selectedCategoryId === cat.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0099FF]" />
                            )}
                        </button>
                    ))}
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto pb-24">
                    {filteredProducts.length === 0 ? (
                        <div className="p-10 text-center text-white/40 flex flex-col items-center gap-4">
                            <Utensils size={40} className="opacity-20" />
                            <p>Nenhum item nesta categoria.</p>
                        </div>
                    ) : (
                        filteredProducts.map(product => {
                            if (!showSoldOut && !product.is_available) return null;

                            return (
                                <div
                                    key={product.id}
                                    onClick={() => handleProductClick(product)}
                                    className={`bg-[#003152] p-4 flex items-center justify-between border-b border-white/5 active:bg-[#002840] transition-colors cursor-pointer ${!product.is_available ? 'opacity-60 grayscale' : ''}`}
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        {/* Photo - Only if enabled */}
                                        {showPhotos && (
                                            <div className="w-16 h-16 bg-[#00223A] rounded-lg shrink-0 flex items-center justify-center text-white/20 overflow-hidden relative border border-white/5">
                                                {product.image_url ? (
                                                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Utensils size={24} />
                                                )}
                                                {!product.is_available && (
                                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                        <span className="text-white text-[10px] uppercase font-bold tracking-wider">Esgotado</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex-1 min-w-0">
                                            <span className="text-white font-bold text-sm block truncate pr-2">{product.name}</span>
                                            {showDescriptions && product.description && (
                                                <span className="text-gray-400 text-xs block mt-1 line-clamp-2 leading-relaxed">{product.description}</span>
                                            )}
                                            {!product.is_available && !showPhotos && (
                                                <span className="text-red-400 text-[10px] font-bold uppercase mt-1 block">Item esgotado</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 ml-2">
                                        <span className="text-[#0099FF] font-bold text-sm">{formatCurrency(product.price)}</span>
                                        <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-white/50">
                                            <Plus size={14} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Cart Float */}
                {cart.length > 0 && (
                    <div className="fixed bottom-0 w-full p-4 bg-[#00223A] border-t border-white/10 z-30">
                        <button
                            onClick={() => setView('CART')}
                            className="w-full bg-[#0099FF] text-white font-bold py-3.5 rounded-lg flex justify-between px-4 shadow-lg shadow-blue-900/20 active:scale-[0.98] transition-all"
                        >
                            <span>Ver carrinho ({cart.length})</span>
                            <span>{formatCurrency(cart.reduce((acc, item) => acc + item.price, 0))}</span>
                        </button>
                    </div>
                )}
            </div>
        );
    }

    if (view === 'DETAILS') {
        const total = selectedProduct ? calculateItemTotal(selectedProduct, currentAddons) : 0;

        return (
            <div className="min-h-screen bg-[#003152] flex flex-col font-sans text-white animate-in slide-in-from-right duration-300">
                {renderHeader(tableName, handleBack)}

                <div className="flex-1 overflow-y-auto pb-24">
                    {/* Hero */}
                    <div className="bg-[#00223A] p-6 flex flex-col items-center gap-4 text-center border-b border-white/5">
                        <div className="w-24 h-24 bg-[#003152] rounded-full flex items-center justify-center text-[#0099FF] border-2 border-[#0099FF]/20 shadow-xl">
                            <Utensils size={40} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">{selectedProduct?.name}</h2>
                            <p className="text-gray-400 text-sm mt-2 max-w-[250px] mx-auto">{selectedProduct?.description}</p>
                        </div>
                        <span className="text-2xl font-bold text-[#0099FF]">{formatCurrency(selectedProduct?.price || 0)}</span>
                    </div>

                    {/* Addons */}
                    <div className="p-4 space-y-6">
                        {addonGroups.map(group => {
                            const count = getGroupSelectionCount(group.id);
                            const isSatisfied = group.min_quantity === 0 || count >= group.min_quantity;
                            const isCollapsed = collapsedGroups[group.id];

                            return (
                                <div key={group.id} className={`rounded-xl overflow-hidden border ${!isSatisfied ? 'border-red-500/30 bg-red-500/5' : 'border-white/10 bg-[#002840]'}`}>
                                    <div
                                        onClick={() => toggleGroup(group.id)}
                                        className="p-4 flex justify-between items-center cursor-pointer active:bg-white/5"
                                    >
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-sm">{group.name}</h3>
                                                {group.min_quantity > 0 && !isSatisfied && (
                                                    <span className="text-[10px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">OBRIGATÓRIO</span>
                                                )}
                                                {isSatisfied && count > 0 && (
                                                    <span className="text-[10px] font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                        <Check size={10} /> OK
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-400">
                                                {group.min_quantity > 0 ? `Escolha ${group.min_quantity} a ${group.max_quantity}` : `Opcional (máx ${group.max_quantity})`}
                                            </p>
                                        </div>
                                        <div className="text-white/40">
                                            {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                                        </div>
                                    </div>

                                    {!isCollapsed && (
                                        <div className="border-t border-white/5">
                                            {addons.filter(a => a.group_id === group.id).map(addon => (
                                                <div key={addon.id} className="p-4 flex items-center justify-between border-b border-white/5 last:border-0 hover:bg-white/5">
                                                    <div>
                                                        <div className="font-bold text-sm">{addon.name}</div>
                                                        <div className="text-xs text-[#0099FF] font-bold mt-0.5">
                                                            {addon.price > 0 ? `+ ${formatCurrency(addon.price)}` : 'Grátis'}
                                                        </div>
                                                    </div>

                                                    {/* Controls */}
                                                    <div className="flex items-center gap-3">
                                                        {group.selection_mode === 'QUANTITY' || group.max_quantity > 1 ? (
                                                            <>
                                                                {(currentAddons[addon.id] || 0) > 0 && (
                                                                    <>
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); handleRemoveAddon(addon.id); }}
                                                                            className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 active:scale-90 transition-transform"
                                                                        >
                                                                            -
                                                                        </button>
                                                                        <span className="font-bold w-4 text-center">{currentAddons[addon.id]}</span>
                                                                    </>
                                                                )}
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleAddAddon(addon.id); }}
                                                                    className={`w-8 h-8 rounded-full bg-[#0099FF] flex items-center justify-center text-white active:scale-90 transition-transform ${currentAddons[addon.id] && currentAddons[addon.id] >= group.max_quantity ? 'opacity-50' : ''}`}
                                                                >
                                                                    +
                                                                </button>
                                                            </>
                                                        ) : (
                                                            // Radio/Checkbox Mode
                                                            <div onClick={(e) => { e.stopPropagation(); handleAddAddon(addon.id); }} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all ${currentAddons[addon.id] ? 'bg-green-500 border-green-500' : 'border-gray-500'}`}>
                                                                {currentAddons[addon.id] ? <Check size={14} className="text-white" /> : null}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Obs */}
                        <div className="bg-[#002840] p-4 rounded-xl border border-white/10">
                            <label className="block font-bold text-sm mb-2 text-gray-300">Observações do pedido</label>
                            <textarea
                                value={observation}
                                onChange={(e) => setObservation(e.target.value)}
                                placeholder="Alguma preferência? Ex: Sem cebola, ponto da carne..."
                                className="w-full bg-[#00223A] rounded-lg p-3 text-white text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-[#0099FF] border border-white/5 placeholder:text-white/20"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-[#00223A] border-t border-white/10 sticky bottom-0 z-20">
                    <button
                        onClick={addToCart}
                        className={`w-full font-bold py-4 rounded-xl flex justify-between px-6 transition-all shadow-lg active:scale-[0.98] ${getValidationErrors().length === 0 ? 'bg-[#0099FF] text-white hover:bg-blue-500 shadow-blue-900/20' : 'bg-gray-600 text-white/40 cursor-not-allowed'}`}
                    >
                        <span>Adicionar</span>
                        <span>{formatCurrency(total)}</span>
                    </button>
                </div>
            </div>
        );
    }

    if (view === 'CART') {
        const cartTotal = cart.reduce((acc, item) => acc + item.price, 0);

        return (
            <div className="min-h-screen bg-[#003152] flex flex-col font-sans text-white">
                {renderHeader('Seu Pedido', handleBack, (
                    <button onClick={() => setCart([])} className="text-red-400 p-2 hover:bg-red-400/10 rounded-lg transition-colors">
                        <Trash2 size={20} />
                    </button>
                ))}

                <div className="flex-1 overflow-y-auto pb-24 p-4 space-y-4">
                    {cart.map((item) => (
                        <div key={item.cartId} className="bg-[#002840] rounded-xl overflow-hidden border border-white/5 shadow-sm">
                            <div className="p-4 flex gap-4">
                                <div className="w-16 h-16 bg-[#00223A] rounded-lg shrink-0 flex items-center justify-center text-[#0099FF]">
                                    <Utensils size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-base truncate">{item.name}</h3>
                                        <span className="font-bold text-[#0099FF]">{formatCurrency(item.price)}</span>
                                    </div>

                                    {item.addons.length > 0 && (
                                        <div className="mt-2 space-y-1">
                                            {item.addons.map((addon, idx) => (
                                                <div key={idx} className="text-xs text-gray-400 flex justify-between">
                                                    <span>• {addon.quantity}x {addon.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {item.observation && (
                                        <div className="mt-2 p-2 bg-[#00223A] rounded text-xs text-gray-300 italic border border-white/5">
                                            "{item.observation}"
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="bg-[#00223A] p-2 flex justify-end gap-3 border-t border-white/5">
                                <button
                                    onClick={() => removeFromCart(item.cartId)}
                                    className="p-2 text-gray-400 hover:text-red-400 flex items-center gap-2 text-xs font-bold transition-colors"
                                >
                                    <Trash2 size={14} /> Remover
                                </button>
                                {/* <button className="p-2 text-[#0099FF] hover:text-blue-400 flex items-center gap-2 text-xs font-bold transition-colors">
                                    <Edit2 size={14} /> Editar
                                </button> */}
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={handleBack}
                        className="w-full py-4 border-2 border-dashed border-white/10 rounded-xl text-gray-400 font-bold hover:bg-white/5 hover:border-white/20 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={20} /> Adicionar mais itens
                    </button>
                </div>

                <div className="p-4 bg-[#00223A] border-t border-white/10 sticky bottom-0 z-20">
                    <button
                        onClick={handleFinishOrder}
                        disabled={isSubmitting}
                        className="w-full bg-[#0099FF] text-white font-bold py-4 rounded-xl flex justify-between px-6 shadow-lg shadow-blue-900/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span>{isSubmitting ? 'Enviando...' : 'Confirmar Pedido'}</span>
                        <span>{formatCurrency(cartTotal)}</span>
                    </button>
                </div>
            </div>
        );
    }

    if (view === 'SUCCESS_MODAL') {
        return (
            <div className="min-h-screen bg-[#003152] flex flex-col items-center justify-center p-8 relative overflow-hidden">
                {/* Background Confetti/Decor */}
                <div className="absolute inset-0 pointer-events-none opacity-20">
                    <div className="absolute top-10 left-10 w-32 h-32 bg-[#0099FF] rounded-full blur-[100px]" />
                    <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-500 rounded-full blur-[100px]" />
                </div>

                <div className="bg-[#002840] border border-white/10 p-8 rounded-3xl w-full max-w-sm flex flex-col items-center text-center shadow-2xl relative z-10 animate-in zoom-in-95 duration-500">
                    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/20 animate-bounce">
                        <Check size={40} className="text-white" strokeWidth={4} />
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2">Pedido Recebido!</h2>
                    <p className="text-gray-400 mb-8 leading-relaxed">
                        A cozinha já começou a preparar seu pedido. Aguarde, em breve levaremos até você.
                    </p>

                    <div className="w-full space-y-3">
                        <button
                            onClick={() => {
                                setView('MENU');
                                setCategories([]);
                                setProducts([]);
                                fetchMenuData();
                            }}
                            className="w-full bg-[#0099FF] hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-900/20 active:scale-[0.98] transition-all"
                        >
                            Fazer novo pedido
                        </button>
                        <button
                            onClick={() => navigate(`/${slug}/garcom/app`)}
                            className="w-full bg-[#00223A] hover:bg-[#003152] text-white font-bold py-3.5 rounded-xl border border-white/10 active:scale-[0.98] transition-all"
                        >
                            Voltar a tela inicial
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default WaiterOrder;
