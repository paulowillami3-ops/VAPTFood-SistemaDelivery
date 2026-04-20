import { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Filter, Settings, RefreshCw, ShoppingCart, Plus, Minus, Check, ChevronRight, X, ShoppingBag, MessageSquare, Trash2, Edit2 } from 'lucide-react';
import { useEstablishment } from '../contexts/EstablishmentContext';
import { supabase } from '../lib/supabase';
import TableSelectionModal from '../components/TableSelectionModal';
import DeliveryMethodModal from '../components/DeliveryMethodModal';
import PaymentEditSidebar from '../components/PaymentEditSidebar';
import ResumeOrderModal from '../components/ResumeOrderModal';
import { toast } from 'react-hot-toast';

// Interfaces matching the improved flow
interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    image_url: string | null;
    category_id: number;
    is_available: boolean;
}

interface Category {
    id: number;
    name: string;
    products: Product[];
}

interface AddonGroup {
    id: number;
    name: string;
    min_quantity: number;
    max_quantity: number;
    is_required: boolean;
    items: AddonItem[];
}

interface AddonItem {
    id: number;
    name: string;
    price: number;
    is_available: boolean;
}

interface CartItem {
    tempId: string;
    product: Product;
    quantity: number;
    addons: { groupId: number; group_name: string; item: AddonItem }[];
    totalPrice: number;
    notes?: string;
}

interface PDVState {
    cart: CartItem[];
    orderType: 'DELIVERY' | 'DINE_IN';
    selectedTable: { id: number; number: string; name: string } | null;
    customerName: string;
    customerPhone: string;
    deliveryFee: number;
}

type Step = 'SELECT_PRODUCT' | 'SELECT_ADDONS' | 'CART_MOBILE';

const PDV_STORAGE_KEY = '@noia-burguer:pdv-state';

const PDV = () => {
    const location = useLocation();
    const { establishment } = useEstablishment();
    const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
    const [savedState, setSavedState] = useState<PDVState | null>(null);

    // Left Column State
    const [categories, setCategories] = useState<Category[]>([]);
    const [activeCategory, setActiveCategory] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Flow State
    const [currentStep, setCurrentStep] = useState<Step>('SELECT_PRODUCT');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [tempQuantity, setTempQuantity] = useState(1);
    const [currentAddonGroups, setCurrentAddonGroups] = useState<AddonGroup[]>([]);
    const [selectedAddons, setSelectedAddons] = useState<{ [groupId: number]: AddonItem[] }>({});
    const [isFetchingAddons, setIsFetchingAddons] = useState(false);

    // Right Column State (Cart)
    const [cart, setCart] = useState<CartItem[]>([]);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [orderType, setOrderType] = useState<'DELIVERY' | 'DINE_IN'>('DELIVERY');
    const [deliveryFee, setDeliveryFee] = useState(5.00);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Payment State
    const [isPaymentSidebarOpen, setIsPaymentSidebarOpen] = useState(false);
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

    // Table State
    const [selectedTable, setSelectedTable] = useState<any | null>(null);
    const [isTableModalOpen, setIsTableModalOpen] = useState(false);

    const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
    const [deliveryAddress, setDeliveryAddress] = useState<any>(null);

    // New State for Additional Actions
    const [cpfCnpj, setCpfCnpj] = useState('');
    const [totalAdjustment, setTotalAdjustment] = useState(0);
    const [isCpfModalOpen, setIsCpfModalOpen] = useState(false);
    const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
    const [tempAdjustment, setTempAdjustment] = useState('');
    const [tempCpf, setTempCpf] = useState('');

    // Refs
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Persistence Logic
    useEffect(() => {
        const stored = localStorage.getItem(PDV_STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                // Only show modal if there are items in the cart
                if (parsed && parsed.cart && parsed.cart.length > 0) {
                    setSavedState(parsed);
                    setIsResumeModalOpen(true);
                }
            } catch (e) {
                console.error('Failed to parse saved PDV state', e);
                localStorage.removeItem(PDV_STORAGE_KEY);
            }
        }
    }, []);

    useEffect(() => {
        // Save state whenever relevant fields change
        // Debounce could be added here for performance if needed, but for now simple effect is fine
        if (cart.length > 0 || customerName || selectedTable) {
            const stateToSave: PDVState = {
                cart,
                orderType,
                selectedTable,
                customerName,
                customerPhone,
                deliveryFee
            };
            localStorage.setItem(PDV_STORAGE_KEY, JSON.stringify(stateToSave));
        } else if (cart.length === 0 && !customerName && !selectedTable) {
            // Clear storage if cart is empty and no customer/table selected (clean slate)
            localStorage.removeItem(PDV_STORAGE_KEY);
        }
    }, [cart, orderType, selectedTable, customerName, customerPhone, deliveryFee]);

    const handleResumeOrder = () => {
        if (savedState) {
            setCart(savedState.cart || []);
            setOrderType(savedState.orderType || 'DELIVERY');
            setSelectedTable(savedState.selectedTable || null);
            setCustomerName(savedState.customerName || '');
            setCustomerPhone(savedState.customerPhone || '');
            setDeliveryFee(savedState.deliveryFee || 5.00);
            toast.success('Pedido retomado com sucesso!');
        }
        setIsResumeModalOpen(false);
    };

    const handleNewOrder = () => {
        localStorage.removeItem(PDV_STORAGE_KEY);
        setSavedState(null);
        setIsResumeModalOpen(false);
        setCart([]);
        setCustomerName('');
        setCustomerPhone('');
        setSelectedTable(null);
        toast.success('Novo pedido iniciado!');
    };


    useEffect(() => {
        if (establishment?.id) {
            // Only clear cart if NOT resuming (which is handled by the modal logic)
            // But here fetchCatalog runs on mount/id change.
            // We should be careful not to wipe the cart if we just restored it.
            // Ideally fetchCatalog shouldn't depend on cart state.
            // And we shouldn't wipe cart here unless it's a new establishment load/switch.
            // For now, let's keep fetchCatalog logic but remove setCart([]) from here to allow persistence.
            fetchCatalog();
        }
    }, [establishment?.id]);

    useEffect(() => {
        if (location.state?.table) {
            setSelectedTable(location.state.table);
            setOrderType('DINE_IN');
        }
    }, [location.state]);

    const fetchCatalog = async () => {
        if (!establishment?.id) return;

        setIsLoading(true);
        try {
            const { data: cats, error: catError } = await supabase
                .from('categories')
                .select('*')
                .eq('establishment_id', establishment.id)
                .order('display_order');
            if (catError) throw catError;

            const { data: prods, error: prodError } = await supabase
                .from('products')
                .select('*')
                .eq('establishment_id', establishment.id)
                .eq('is_available', true);
            if (prodError) throw prodError;

            // --- Logic to calculate "Starting From" price for zero-priced items ---
            const zeroPricedProducts = prods?.filter(p => p.price === 0) || [];
            if (zeroPricedProducts.length > 0) {
                const zeroPricedIds = zeroPricedProducts.map(p => p.id);

                // 1. Fetch ALL addon groups for these products
                const { data: groups } = await supabase
                    .from('product_addon_groups')
                    .select('id, product_id, is_required')
                    .in('product_id', zeroPricedIds);

                if (groups && groups.length > 0) {
                    const groupIds = groups.map(g => g.id);

                    // 2. Fetch ALL items for these groups
                    const { data: items } = await supabase
                        .from('product_addons')
                        .select('id, group_id, price')
                        .in('group_id', groupIds)
                        .eq('is_available', true);

                    // 3. Calculate min price per product
                    zeroPricedProducts.forEach(product => {
                        const productGroups = groups.filter(g => g.product_id === product.id && g.is_required);

                        let minAddonTotal = 0;
                        productGroups.forEach(group => {
                            const groupItems = items?.filter(i => i.group_id === group.id) || [];
                            if (groupItems.length > 0) {
                                const minPrice = Math.min(...groupItems.map(i => i.price));
                                minAddonTotal += minPrice;
                            }
                        });

                        // Update product price in memory only for display
                        if (minAddonTotal > 0) {
                            product.price = minAddonTotal;
                            (product as any).isStartingPrice = true; // Flag for UI if needed
                        }
                    });
                }
            }
            // ---------------------------------------------------------------------

            const fullMenu = cats.map(cat => ({
                ...cat,
                products: prods?.filter(p => p.category_id === cat.id) || []
            })).filter(cat => cat.products.length > 0);

            setCategories(fullMenu);
            if (fullMenu.length > 0) setActiveCategory(fullMenu[0].id);

        } catch (error) {
            console.error('Error loading PDV catalog:', error);
            toast.error('Erro ao carregar cardápio');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAddonsForProduct = async (productId: number) => {
        setIsFetchingAddons(true);
        try {
            // Step 1: Fetch Groups
            const { data: groups, error: groupsError } = await supabase
                .from('product_addon_groups')
                .select('*')
                .eq('product_id', productId)
                .order('display_order', { ascending: true });

            if (groupsError) throw groupsError;

            if (!groups || groups.length === 0) {
                setCurrentAddonGroups([]);
                return;
            }

            // Step 2: Fetch Items for these groups
            const groupIds = groups.map(g => g.id);
            const { data: items, error: itemsError } = await supabase
                .from('product_addons')
                .select('*')
                .in('group_id', groupIds)
                .eq('is_available', true);

            if (itemsError) throw itemsError;

            // Step 3: Combine them
            const processedGroups = groups.map(g => ({
                ...g,
                items: items?.filter((i: any) => i.group_id === g.id) || []
            }));

            setCurrentAddonGroups(processedGroups);
        } catch (error) {
            console.error('Error fetching addons:', error);
            setCurrentAddonGroups([]);
        } finally {
            setIsFetchingAddons(false);
        }
    };

    const handleProductClick = async (product: Product) => {
        if (selectedProduct?.id === product.id) return;

        setSelectedProduct(product);
        setTempQuantity(1);
        setCurrentAddonGroups([]); // Clear previous addons immediately
        await fetchAddonsForProduct(product.id);
    };

    const handleNextStep = () => {
        if (!selectedProduct) return;
        if (currentAddonGroups.length > 0) {
            setCurrentStep('SELECT_ADDONS');
        } else {
            handleAddToCart();
        }
    };

    const handleAddonToggle = (group: AddonGroup, item: AddonItem) => {
        setSelectedAddons(prev => {
            const current = prev[group.id] || [];
            const exists = current.find(i => i.id === item.id);

            if (exists) {
                return { ...prev, [group.id]: current.filter(i => i.id !== item.id) };
            } else {
                if (group.max_quantity > 0 && current.length >= group.max_quantity) {
                    toast.error(`Máximo de ${group.max_quantity} opções neste grupo`);
                    return prev;
                }
                return { ...prev, [group.id]: [...current, item] };
            }
        });
    };

    const handleAddToCart = () => {
        if (!selectedProduct) return;

        // Validation for required addons
        for (const group of currentAddonGroups) {
            if (group.is_required) {
                const count = selectedAddons[group.id]?.length || 0;
                if (count < group.min_quantity) {
                    toast.error(`Selecione pelo menos ${group.min_quantity} opção em ${group.name}`);
                    return;
                }
            }
        }

        let addonTotal = 0;
        const flatAddons: { groupId: number; group_name: string; item: AddonItem }[] = [];

        Object.entries(selectedAddons).forEach(([groupId, items]) => {
            const group = currentAddonGroups.find(g => g.id === Number(groupId));
            items.forEach(item => {
                addonTotal += item.price;
                flatAddons.push({ groupId: Number(groupId), group_name: group?.name || 'Adicional', item });
            });
        });

        const newItem: CartItem = {
            tempId: Math.random().toString(36).substr(2, 9),
            product: selectedProduct,
            quantity: tempQuantity,
            addons: flatAddons,
            totalPrice: (selectedProduct.price + addonTotal) * tempQuantity
        };

        setCart(prev => [...prev, newItem]);
        resetSelection();
        toast.success('Item adicionado!');
    };

    const [isEditMode, setIsEditMode] = useState(false);
    const [isDeleteMode, setIsDeleteMode] = useState(false);

    const resetSelection = () => {
        setCurrentStep('SELECT_PRODUCT');
        setSelectedProduct(null);
        setTempQuantity(1);
        setSelectedAddons({});
        setCurrentAddonGroups([]);
        setIsFetchingAddons(false);
    };


    const subtotal = cart.reduce((acc, item) => acc + item.totalPrice, 0);
    const total = subtotal + (orderType === 'DELIVERY' ? deliveryFee : 0) + totalAdjustment;

    const handleDeliveryMethodConfirm = (data: any) => {
        setOrderType(data.type);
        if (data.type === 'DELIVERY') {
            setDeliveryFee(data.deliveryFee || 0);
            setDeliveryAddress(data.address);
        } else {
            setDeliveryFee(0);
            setDeliveryAddress(null);
        }
    };

    const handleCreateOrder = async () => {
        if (cart.length === 0) {
            toast.error('Adicione itens ao pedido');
            return;
        }

        if (orderType === 'DINE_IN' && !selectedTable) {
            toast.error('Selecione uma mesa');
            return;
        }

        setIsSubmitting(true);
        try {
            const tableNumber = selectedTable ? (selectedTable.number || (selectedTable.name ? selectedTable.name.replace(/\D/g, '') : null)) : null;
            let derivedName = 'Balcão';
            if (selectedTable) {
                const prefix = selectedTable.source === 'comandas' ? 'Comanda' : 'Mesa';
                derivedName = `${prefix} ${tableNumber || (selectedTable.name || '?')}`;
            }


            const orderPayload = {
                establishment_id: establishment.id,
                customer_name: customerName || derivedName,
                customer_phone: customerPhone.replace(/\D/g, ''),
                items: cart.map(i => ({
                    id: i.product.id,
                    name: i.product.name,
                    quantity: i.quantity,
                    price: i.product.price,
                    total: i.totalPrice,
                    addons: i.addons // Adding addons to JSON payload
                })),
                total_amount: total,
                total: total, // Sync both columns
                status: 'PENDING',
                type: orderType,
                payment_method: paymentMethods.length > 0 ? (paymentMethods.length > 1 ? 'MULTIPLE' : paymentMethods[0].type) : 'PENDING',
                payment_methods: paymentMethods,
                table_id: (selectedTable?.source === 'mesas' || !selectedTable?.source) ? selectedTable?.id : null,
                table_number: tableNumber ? String(tableNumber) : null,
                delivery_fee: orderType === 'DELIVERY' ? deliveryFee : 0,
                delivery_address: deliveryAddress,
                cpf_cnpj: cpfCnpj || null,
                adjustment_amount: totalAdjustment || 0
            };

            const { data: newOrder, error } = await supabase.from('orders').insert([orderPayload]).select('order_number').single();
            if (error) throw error;

            toast.success(`Pedido #${newOrder?.order_number || ''} criado com sucesso!`);
            setCart([]);
            setCustomerName('');
            setCustomerPhone('');
            setPaymentMethods([]);
            setDeliveryAddress(null);
            setDeliveryFee(5.00);

        } catch (error: any) {
            console.error('Error creating order:', error);
            toast.error('Erro ao criar pedido');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTableSelection = (table: any) => {
        setSelectedTable(table);
        setIsTableModalOpen(false);
        setOrderType('DINE_IN');
        setDeliveryFee(0);
        setDeliveryAddress(null);
    };


    const filteredCategories = useMemo(() => {
        return categories.map(cat => ({
            ...cat,
            products: cat.products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
        })).filter(cat => cat.products.length > 0);
    }, [categories, searchQuery]);

    const [customerAddresses, setCustomerAddresses] = useState<any[]>([]);

    // Fetch customer addresses when phone changes
    useEffect(() => {
        const fetchCustomerAddresses = async () => {
            const cleanPhone = customerPhone.replace(/\D/g, '');
            if (cleanPhone.length >= 10) {
                try {
                    const { data } = await supabase
                        .from('customers')
                        .select('addresses, name')
                        .eq('phone', cleanPhone)
                        .maybeSingle();

                    if (data) {
                        if (data.addresses) {
                            setCustomerAddresses(data.addresses);
                        }
                        if (data.name && !customerName) {
                            setCustomerName(data.name);
                        }
                    } else {
                        setCustomerAddresses([]);
                    }
                } catch (error) {
                    console.error('Error fetching customer addresses:', error);
                }
            } else {
                setCustomerAddresses([]);
            }
        };

        const timer = setTimeout(() => {
            fetchCustomerAddresses();
        }, 500); // Debounce

        return () => clearTimeout(timer);
    }, [customerPhone]);

    return (
        <div className="h-screen md:h-[calc(100vh-120px)] bg-gray-50 overflow-hidden relative flex flex-col md:flex-row font-sans">
            <ResumeOrderModal
                isOpen={isResumeModalOpen}
                onResume={handleResumeOrder}
                onNew={handleNewOrder}
                onClose={() => setIsResumeModalOpen(false)}
            />
            <TableSelectionModal
                isOpen={isTableModalOpen}
                onClose={() => setIsTableModalOpen(false)}
                onSelect={handleTableSelection}
            />
            <DeliveryMethodModal
                isOpen={isDeliveryModalOpen}
                onClose={() => setIsDeliveryModalOpen(false)}
                onConfirm={handleDeliveryMethodConfirm}
                initialData={{ type: orderType, fee: deliveryFee }}
                customerAddresses={customerAddresses}
                customerName={customerName}
                customerPhone={customerPhone}
            />
            <PaymentEditSidebar
                isOpen={isPaymentSidebarOpen}
                onClose={() => setIsPaymentSidebarOpen(false)}
                order={{ total_amount: total }}
                onSave={(methods) => setPaymentMethods(methods)}
            />

            {/* Main Content (Catalog/Selection) */}
            <div className={`flex-1 flex flex-col md:border-r border-gray-200 overflow-hidden h-full relative transition-all ${currentStep === 'CART_MOBILE' ? 'hidden md:flex' : 'flex'}`}>
                {/* Mobile Header */}
                <div className="bg-white border-b border-gray-200 shrink-0 md:hidden">
                    <div className="flex items-center justify-between p-4 pb-2">
                        <h1 className="text-lg font-bold text-gray-800">Pedidos balcão (PDV)</h1>
                        <div className="flex items-center gap-2">
                            <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg border border-gray-200">
                                <Settings size={20} />
                            </button>
                            <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg border border-gray-200">
                                <Filter size={20} />
                            </button>
                            <button
                                onClick={() => {/* Navigate back or close */ }}
                                className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg border border-gray-200"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mode Toggles (Mobile Only) */}
                <div className="flex px-4 pb-4 gap-0 md:hidden">
                    <button
                        onClick={() => setOrderType('DELIVERY')}
                        className={`flex-1 py-2 text-sm font-medium border transition-colors first:rounded-l-lg border-r-0 ${orderType === 'DELIVERY'
                            ? 'bg-white text-gray-600 border-gray-300 shadow-sm z-10'
                            : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
                            }`}
                    >
                        Delivery e Balcão
                    </button>
                    <button
                        onClick={() => {
                            setOrderType('DINE_IN');
                            if (!selectedTable) setIsTableModalOpen(true);
                        }}
                        className={`flex-1 py-2 text-sm font-medium border transition-colors last:rounded-r-lg ${orderType === 'DINE_IN'
                            ? 'bg-[#0099FF] text-white border-[#0099FF] shadow-sm z-10'
                            : 'bg-white text-[#0099FF] border-gray-200 hover:bg-blue-50'
                            }`}
                    >
                        Mesa e Comandas
                    </button>
                </div>

                {/* Selected Table/Client Info (Mobile Only) */}
                <div className="px-4 py-2 space-y-2 bg-white border-b border-gray-200 md:hidden">
                    {orderType === 'DINE_IN' && (
                        <div
                            onClick={() => setIsTableModalOpen(true)}
                            className={`w-full p-2 border rounded-lg flex items-center justify-between cursor-pointer ${selectedTable ? 'bg-green-50 border-green-200' : 'bg-white border-gray-300'}`}
                        >
                            <span className="font-bold text-gray-700">
                                {selectedTable ? `${selectedTable.name || 'Mesa'} ${selectedTable.number || ''}` : 'Mesa 1'}
                            </span>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-0.5 rounded ${selectedTable ? 'bg-green-200 text-green-800' : 'bg-green-100 text-green-700'}`}>
                                    {selectedTable ? 'Ocupada' : 'Livre'}
                                </span>
                                <button className="flex items-center gap-1 text-xs text-gray-500 border px-2 py-1 rounded bg-white">
                                    <RefreshCw size={12} /> Trocar
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <div className="bg-white border border-gray-300 rounded-lg px-3 py-2 flex items-center shadow-sm">
                            <span className="text-gray-600 font-medium mr-2 shrink-0">Fone:</span>
                            <input
                                type="tel"
                                className="flex-1 outline-none text-gray-700 placeholder-gray-400 bg-transparent text-sm"
                                placeholder="(XX) X XXXX-XXXX"
                                value={customerPhone}
                                onChange={(e) => {
                                    let v = e.target.value.replace(/\D/g, '');
                                    if (v.length > 11) v = v.slice(0, 11);
                                    if (v.length > 10) {
                                        v = v.replace(/^(\d\d)(\d{5})(\d{4}).*/, '($1) $2-$3');
                                    } else if (v.length > 5) {
                                        v = v.replace(/^(\d\d)(\d{4})(\d{0,4}).*/, '($1) $2-$3');
                                    } else if (v.length > 2) {
                                        v = v.replace(/^(\d\d)(\d{0,5}).*/, '($1) $2');
                                    }
                                    setCustomerPhone(v);
                                }}
                            />
                            {customerPhone && (
                                <button onClick={() => setCustomerPhone('')} className="text-gray-400 hover:text-gray-600">
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                        <div className="bg-white border border-gray-300 rounded-lg px-3 py-2 flex items-center shadow-sm">
                            <span className="text-gray-600 font-medium mr-2 shrink-0">Cliente:</span>
                            <input
                                type="text"
                                placeholder="Nome do cliente"
                                className="flex-1 outline-none text-gray-700 placeholder-gray-400 bg-transparent text-sm"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                            />
                            {customerName && (
                                <button onClick={() => setCustomerName('')} className="text-gray-400 hover:text-gray-600">
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Step 1: Product Selection */}
                {currentStep === 'SELECT_PRODUCT' && (
                    <div className="flex flex-col flex-1 overflow-hidden animate-in fade-in slide-in-from-left-4 duration-300">
                        {/* Categories & Search */}
                        <div className="px-4 py-2 bg-white/50 border-b border-gray-100 space-y-3 shrink-0">
                            <div className="flex gap-2">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        placeholder="[P] Pesquisar por produto..."
                                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-white text-gray-600 bg-gray-50 transition-colors">
                                    <Filter size={18} />
                                </button>
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveCategory(cat.id)}
                                        className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeCategory === cat.id
                                            ? 'bg-gray-800 text-white shadow-md'
                                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Products Grid */}
                        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 content-start">
                                {isLoading ? (
                                    <div className="col-span-full text-center py-10 text-gray-500">Carregando catálogo...</div>
                                ) : filteredCategories.map(cat => (
                                    (activeCategory === null || activeCategory === cat.id || searchQuery) && cat.products.map(product => {
                                        const isSelected = selectedProduct?.id === product.id;
                                        return (
                                            <div
                                                key={product.id}
                                                onClick={() => handleProductClick(product)}
                                                className={`
                                                        group relative bg-white rounded-xl shadow-sm border-2 transition-all cursor-pointer overflow-hidden flex flex-col h-[240px]
                                                        ${isSelected ? 'border-blue-600 ring-4 ring-blue-500/10 scale-[1.02] z-10' : 'border-gray-100 hover:border-blue-300 hover:shadow-md'}
                                                    `}
                                            >
                                                <div className="h-[120px] bg-gray-100 w-full relative overflow-hidden">
                                                    {product.image_url ? (
                                                        <img src={product.image_url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={product.name} />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                            <ShoppingBag size={24} />
                                                        </div>
                                                    )}
                                                    {isSelected && (
                                                        <div className="absolute inset-0 bg-blue-600/20 backdrop-blur-[1px] flex items-center justify-center animate-in fade-in duration-200">
                                                            <Check className="text-white drop-shadow-md" size={40} strokeWidth={4} />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="p-3 flex flex-col flex-1">
                                                    <h3 className={`font-bold text-sm leading-tight line-clamp-2 mb-1 ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>
                                                        {product.name}
                                                    </h3>
                                                    <div className="mt-auto">
                                                        {(product as any).isStartingPrice && (
                                                            <span className="text-[10px] uppercase font-bold text-gray-500 block">
                                                                A partir de
                                                            </span>
                                                        )}
                                                        <span className="text-lg font-extrabold text-green-600">
                                                            R$ {product.price.toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {isSelected && (
                                                    <div className="absolute bottom-3 left-3 right-3 bg-white rounded-lg shadow-lg border border-gray-200 p-1 flex items-center justify-between animate-in slide-in-from-bottom-2 duration-200 z-10">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setTempQuantity(Math.max(1, tempQuantity - 1)); }}
                                                            className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded text-gray-700 font-bold"
                                                        >
                                                            <Minus size={16} />
                                                        </button>
                                                        <span className="font-bold text-gray-800">{tempQuantity}</span>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setTempQuantity(tempQuantity + 1); }}
                                                            className="w-8 h-8 flex items-center justify-center bg-blue-100 hover:bg-blue-200 rounded text-blue-700 font-bold"
                                                        >
                                                            <Plus size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                ))}
                            </div>
                        </div>

                        {/* Desktop Footer Only */}
                        <div className="hidden md:flex p-4 bg-white border-t border-gray-200 items-center justify-between shrink-0 h-[80px]">
                            <button className="px-6 py-3 border border-blue-500 text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition-colors uppercase text-sm">
                                [ O ] Observação do item
                            </button>
                            <div className="flex gap-4">
                                {selectedProduct && (
                                    <>
                                        <button onClick={resetSelection} disabled={isFetchingAddons} className="px-6 py-3 border border-gray-300 text-gray-600 font-bold rounded-lg hover:bg-gray-100 transition-colors uppercase text-sm disabled:opacity-50">
                                            [ V ] Voltar
                                        </button>
                                        <button onClick={handleNextStep} disabled={isFetchingAddons} className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg shadow-lg shadow-blue-200 transition-all uppercase text-sm flex items-center gap-2 disabled:opacity-50">
                                            {isFetchingAddons ? 'Carregando...' : '[ A ] Próximo'}
                                            {!isFetchingAddons && <ChevronRight size={18} />}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Addon Selection */}
                {currentStep === 'SELECT_ADDONS' && selectedProduct && (
                    <div className="flex flex-col h-full animate-in slide-in-from-right-8 duration-300">
                        <div className="p-6 bg-white border-b border-gray-200 shrink-0">
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                                <span>{selectedProduct.name}</span>
                                <ChevronRight size={14} />
                                <span className="font-bold text-gray-800">Adicionais</span>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800">Turbine seu lanche</h2>
                            <p className="text-gray-500 text-sm">Selecione as opções desejadas</p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50 mb-[100px] md:mb-0">
                            {currentAddonGroups.map(group => (
                                <div key={group.id} className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-bold text-gray-800 uppercase text-sm tracking-wide">{group.name}</h3>
                                            <span className="text-xs text-gray-400">
                                                {group.min_quantity > 0 ? `Obrigatório: escolha pelo menos ${group.min_quantity}` : 'Opcional'}
                                                {group.max_quantity > 0 && ` | Máximo: ${group.max_quantity}`}
                                            </span>
                                        </div>
                                        {group.is_required && (
                                            <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded">Obrigatório</span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                        {group.items.map(item => {
                                            const isSelected = selectedAddons[group.id]?.some(i => i.id === item.id);
                                            return (
                                                <div
                                                    key={item.id}
                                                    onClick={() => handleAddonToggle(group, item)}
                                                    className={`
                                                                    cursor-pointer p-4 rounded-lg border-2 transition-all flex items-center justify-between
                                                                    ${isSelected
                                                            ? 'py-6 bg-[#0B3B69] border-[#0B3B69] text-white shadow-lg'
                                                            : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                                                        }
                                                                `}
                                                >
                                                    <span className="font-bold text-sm">{item.name}</span>
                                                    <div className={`text-sm font-bold ${isSelected ? 'text-blue-200' : 'text-green-600'}`}>
                                                        + R$ {item.price.toFixed(2)}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop Footer Only */}
                        <div className="hidden md:flex p-4 bg-white border-t border-gray-200 flex items-center justify-between shrink-0 h-[80px]">
                            <button className="px-6 py-3 border border-blue-500 text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition-colors uppercase text-sm">
                                [ O ] Observação do item
                            </button>
                            <div className="flex gap-4">
                                <button onClick={() => setCurrentStep('SELECT_PRODUCT')} className="px-6 py-3 border border-gray-300 text-gray-600 font-bold rounded-lg hover:bg-gray-100 transition-colors uppercase text-sm">
                                    [ V ] Voltar
                                </button>
                                <button onClick={handleAddToCart} className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg shadow-lg shadow-blue-200 transition-all uppercase text-sm flex items-center gap-2">
                                    [ F ] Finalizar item
                                    <Check size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Column - Cart */}
            <div className="hidden md:flex w-[380px] xl:w-[420px] bg-white flex-col shadow-xl z-20 transition-all border-l border-gray-200 shrink-0">

                {/* Desktop Header & Tabs */}
                <div className="hidden md:flex px-4 py-3 border-b border-gray-100 items-center justify-between bg-gray-50/50 shrink-0">
                    <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider">Resumo do Pedido</h3>
                    <button className="p-1 hover:bg-gray-200 rounded text-gray-500"><Settings size={18} /></button>
                </div>

                {/* Tabs - Desktop Only */}
                <div className="hidden md:flex border-b border-gray-200 shrink-0">
                    <button
                        onClick={() => setOrderType('DELIVERY')}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${orderType === 'DELIVERY'
                            ? 'border-[#0099FF] text-[#0099FF] bg-blue-50/50'
                            : 'border-transparent text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        [D] Delivery e Balcão
                    </button>
                    <button
                        onClick={() => {
                            setOrderType('DINE_IN');
                            if (!selectedTable) setIsTableModalOpen(true);
                        }}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${orderType === 'DINE_IN'
                            ? 'border-[#0099FF] text-[#0099FF] bg-blue-50/50'
                            : 'border-transparent text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        [M] Mesas e Comandas
                    </button>
                </div>

                {/* List Header */}
                <div className="bg-gray-200/60 px-4 py-2 flex justify-between text-xs font-bold text-gray-600 shrink-0">
                    <span>Itens do pedido</span>
                    <span>Subtotal</span>
                </div>

                {/* Cart Items List */}
                <div className="flex-1 overflow-y-auto bg-white">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60 p-8">
                            <ShoppingCart size={40} className="mb-4 text-gray-300" />
                            <p className="text-sm font-medium">Seu carrinho está vazio</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {cart.map((item) => (
                                <div
                                    key={item.tempId}
                                    className="px-4 py-3 hover:bg-[#0099FF] transition-all cursor-pointer group relative overflow-hidden border-b border-gray-100"
                                >
                                    <div className="flex justify-between items-start mb-1 transition-colors group-hover:text-white">
                                        <div className="flex gap-2">
                                            <span className="text-gray-500 font-medium group-hover:text-white/80">{item.quantity}x</span>
                                            <span className="font-medium text-gray-800 group-hover:text-white">{item.product.name}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-gray-700 group-hover:text-white">
                                                R$ {item.totalPrice.toFixed(2).replace('.', ',')}
                                            </span>
                                            {/* Mobile-only toggle buttons */}
                                            <div className="md:hidden">
                                                {(isEditMode || isDeleteMode) && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (isDeleteMode) {
                                                                setCart(cart.filter(i => i.tempId !== item.tempId));
                                                            } else {
                                                                handleProductClick(item.product);
                                                            }
                                                        }}
                                                        className={`p-1.5 rounded-full transition-colors ${isDeleteMode ? 'text-red-500 hover:bg-red-50' : 'text-blue-500 hover:bg-blue-50'}`}
                                                    >
                                                        {isDeleteMode ? <Trash2 size={16} /> : <Edit2 size={16} />}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {item.addons.length > 0 && (
                                        <div className="pl-6 space-y-0.5 mt-1">
                                            {item.addons.map((addon, idx) => (
                                                <div key={idx} className="flex justify-between text-xs text-gray-500 group-hover:text-white/70">
                                                    <span>+ {addon.item.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Desktop Hover Actions */}
                                    <div className="hidden md:flex absolute inset-x-0 bottom-0 top-[60%] translate-y-full group-hover:translate-y-0 transition-transform duration-200 bg-black/10 backdrop-blur-sm border-t border-white/10 items-stretch">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // Load into editor
                                                setSelectedProduct(item.product);
                                                setTempQuantity(item.quantity);
                                                const reconstructed: { [key: number]: AddonItem[] } = {};
                                                item.addons.forEach(a => {
                                                    if (!reconstructed[a.groupId]) reconstructed[a.groupId] = [];
                                                    reconstructed[a.groupId].push(a.item);
                                                });
                                                setSelectedAddons(reconstructed);
                                                fetchAddonsForProduct(item.product.id);
                                                setCart(prev => prev.filter(i => i.tempId !== item.tempId));
                                                setCurrentStep('SELECT_ADDONS');
                                            }}
                                            className="flex-1 flex items-center justify-center gap-1.5 bg-[#0088EE] text-white font-bold text-xs hover:bg-[#0077DD] transition-colors border-r border-white/10 uppercase"
                                        >
                                            <Edit2 size={14} />
                                            Editar
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setCart(prev => prev.filter(i => i.tempId !== item.tempId));
                                                toast.success('Item removido');
                                            }}
                                            className="flex-1 flex items-center justify-center gap-1.5 bg-[#EE4444] text-white font-bold text-xs hover:bg-[#DD3333] transition-colors uppercase"
                                        >
                                            <Trash2 size={14} />
                                            Excluir
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Section */}
                <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-3 shrink-0 pb-safe">
                    {/* Totals */}
                    <div className="space-y-1 text-sm mb-2 pt-2">
                        <div className="flex justify-between text-gray-600">
                            <span>Subtotal</span>
                            <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                        </div>
                        {orderType === 'DELIVERY' && (
                            <div className="flex justify-between text-gray-600">
                                <span>Entrega</span>
                                <span className="text-green-600">{deliveryFee > 0 ? `R$ ${deliveryFee.toFixed(2).replace('.', ',')}` : 'Grátis'}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center bg-gray-200/50 p-2 rounded mt-2">
                            <span className="font-bold text-gray-700">Total</span>
                            <span className="font-bold text-lg text-gray-900">R$ {total.toFixed(2).replace('.', ',')}</span>
                        </div>
                    </div>

                    {/* Desktop Only: Table Selection & Customer Input */}
                    <div className="hidden md:block space-y-2 mb-3">
                        {orderType === 'DINE_IN' && (
                            <div className="bg-white border rounded p-2 flex items-center justify-between">
                                {selectedTable ? (
                                    <>
                                        <div className="font-bold text-gray-800 text-sm">{selectedTable.name} #{selectedTable.number}</div>
                                        <button onClick={() => setIsTableModalOpen(true)} className="flex items-center gap-1 text-xs border px-2 py-1 rounded hover:bg-gray-50 text-gray-600">
                                            <RefreshCw size={12} /> Trocar
                                        </button>
                                    </>
                                ) : (
                                    <button onClick={() => setIsTableModalOpen(true)} className="w-full text-center text-[#0099FF] text-sm font-bold py-1">Selecionar Mesa...</button>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-white border border-gray-200 rounded px-2 py-1.5 flex items-center shadow-sm">
                                <input
                                    type="tel"
                                    className="w-full outline-none text-gray-700 placeholder-gray-400 bg-transparent text-xs"
                                    placeholder="(XX) X XXXX-XXXX"
                                    value={customerPhone}
                                    onChange={(e) => {
                                        let v = e.target.value.replace(/\D/g, '');
                                        if (v.length > 11) v = v.slice(0, 11);
                                        if (v.length > 10) {
                                            v = v.replace(/^(\d\d)(\d{5})(\d{4}).*/, '($1) $2-$3');
                                        } else if (v.length > 5) {
                                            v = v.replace(/^(\d\d)(\d{4})(\d{0,4}).*/, '($1) $2-$3');
                                        } else if (v.length > 2) {
                                            v = v.replace(/^(\d\d)(\d{0,5}).*/, '($1) $2');
                                        }
                                        setCustomerPhone(v);
                                    }}
                                />
                            </div>
                            <div className="bg-white border border-gray-200 rounded px-2 py-1.5 flex items-center shadow-sm">
                                <input
                                    type="text"
                                    placeholder="Nome do cliente..."
                                    className="w-full outline-none text-gray-700 placeholder-gray-400 bg-transparent text-xs"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Action Buttons Grid */}
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            <button
                                onClick={() => setIsDeliveryModalOpen(true)}
                                className={`flex items-center justify-center py-2 bg-white border-2 rounded font-bold text-[10px] hover:bg-blue-50 transition-colors uppercase px-1 gap-1 ${orderType === 'DELIVERY' ? 'border-[#0099FF]' : 'border-[#0099FF]'}`}
                            >
                                <span className="text-[#0099FF]">[E] Entrega</span>
                            </button>
                            <button
                                onClick={() => setIsPaymentSidebarOpen(true)}
                                className={`flex items-center justify-center py-2 border-2 rounded font-bold text-[10px] transition-colors uppercase px-1 gap-1 ${paymentMethods.length > 0
                                    ? 'bg-green-500 border-green-500 text-white shadow-sm'
                                    : 'bg-white border-[#0099FF] text-[#0099FF] hover:bg-blue-50'
                                    }`}
                            >
                                {paymentMethods.length === 0
                                    ? '[R] Pagamentos'
                                    : paymentMethods.length > 1
                                        ? '[R] Múltiplos'
                                        : `[R] ${paymentMethods[0].type === 'money' ? 'Dinheiro' : 'Cartão'}`
                                }
                            </button>
                            <button
                                onClick={() => {
                                    setTempCpf(cpfCnpj);
                                    setIsCpfModalOpen(true);
                                }}
                                className={`flex items-center justify-center py-2 bg-white border-2 rounded font-bold text-[10px] hover:bg-blue-50 transition-colors uppercase px-1 gap-1 ${cpfCnpj ? 'border-green-500 text-green-600' : 'border-[#0099FF] text-[#0099FF]'}`}
                            >
                                [T] CPF/CNPJ
                            </button>
                            <button
                                onClick={() => {
                                    setTempAdjustment(totalAdjustment.toString());
                                    setIsAdjustmentModalOpen(true);
                                }}
                                className={`flex items-center justify-center py-2 bg-white border-2 rounded font-bold text-[10px] hover:bg-blue-50 transition-colors uppercase px-1 gap-1 ${totalAdjustment !== 0 ? 'border-orange-500 text-orange-600' : 'border-[#0099FF] text-[#0099FF]'}`}
                            >
                                [Y] Valor
                            </button>
                        </div>
                    </div>

                    {/* Main Action */}
                    <button
                        onClick={handleCreateOrder}
                        disabled={isSubmitting}
                        className="w-full py-4 bg-[#0099FF] text-white font-bold text-base rounded shadow hover:bg-blue-600 disabled:opacity-70 transition-colors uppercase active:scale-[0.98]"
                    >
                        {isSubmitting ? 'Gerando...' : '[ENTER] GERAR PEDIDO'}
                    </button>
                </div>
            </div>

            {/* Mobile Fixed Footer Actions */}
            <div className="md:hidden fixed bottom-[70px] left-0 right-0 z-30 px-4">
                {selectedProduct ? (
                    /* Product Actions Footer */
                    <div className="bg-white border text-gray-800 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] flex flex-col gap-2 p-3 animate-in slide-in-from-bottom-4 duration-300">
                        <button className="w-full py-2.5 border border-blue-200 bg-blue-50 text-blue-600 font-bold rounded-lg hover:bg-blue-100 transition-colors uppercase text-xs flex items-center justify-center gap-2">
                            <MessageSquare size={16} />
                            [ O ] Observação do item
                        </button>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => currentStep === 'SELECT_ADDONS' ? setCurrentStep('SELECT_PRODUCT') : resetSelection()}
                                className="py-2.5 border border-gray-300 text-gray-600 font-bold rounded-lg hover:bg-gray-100 transition-colors uppercase text-xs"
                            >
                                [ V ] Voltar
                            </button>
                            <button
                                onClick={currentStep === 'SELECT_PRODUCT' ? handleNextStep : handleAddToCart}
                                className="py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold rounded-lg shadow-lg shadow-blue-200 transition-all uppercase text-xs flex items-center justify-center gap-2"
                            >
                                {currentStep === 'SELECT_PRODUCT' ? 'Próximo' : 'Finalizar'}
                                {currentStep === 'SELECT_PRODUCT' && <ChevronRight size={16} />}
                                {currentStep === 'SELECT_ADDONS' && <Check size={16} />}
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Minimized Cart Footer (When Cart item selected but not in Review) */
                    <div
                        className={`bg-[#0F2236] text-white p-2.5 rounded-full shadow-xl cursor-pointer transition-all duration-300 transform fixed bottom-[80px] left-1/2 -translate-x-1/2 z-[40] border border-white/10 flex items-center gap-3 px-6 active:scale-95 ${currentStep === 'CART_MOBILE' ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
                        onClick={() => setCurrentStep('CART_MOBILE')}
                    >
                        <ShoppingBag size={18} className="text-[#0099FF]" />
                        <div className="flex flex-col border-r border-white/10 pr-3">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-none">Total</span>
                            <span className="font-bold text-sm leading-none">R$ {total.toFixed(2).replace('.', ',')}</span>
                        </div>
                        <span className="font-bold text-sm text-[#0099FF]">Ver pedido ({cart.length})</span>
                        <ChevronRight size={16} className="text-gray-500" />
                    </div>
                )}
            </div>

            {/* Step 3: Mobile Full-Screen Cart Review */}
            {currentStep === 'CART_MOBILE' && (
                <div className="md:hidden fixed inset-0 z-[60] bg-white flex flex-col animate-in slide-in-from-right duration-300">
                    {/* Header */}
                    <div className="p-4 border-b flex items-center gap-3 bg-white shrink-0">
                        <button onClick={() => setCurrentStep('SELECT_PRODUCT')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <X size={24} className="text-gray-600" />
                        </button>
                        <h2 className="text-xl font-bold text-gray-800">Resumo do Pedido</h2>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {/* Quick View Actions */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setIsEditMode(!isEditMode)}
                                className={`flex-1 py-3 text-sm font-bold rounded-xl border transition-all flex items-center justify-center gap-2 ${isEditMode ? 'bg-blue-600 border-blue-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                            >
                                <Edit2 size={16} />
                                {isEditMode ? 'Sair Editar' : 'Editar itens'}
                            </button>
                            <button
                                onClick={() => setIsDeleteMode(!isDeleteMode)}
                                className={`flex-1 py-3 text-sm font-bold rounded-xl border transition-all flex items-center justify-center gap-2 ${isDeleteMode ? 'bg-red-600 border-red-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                            >
                                <Trash2 size={16} />
                                {isDeleteMode ? 'Sair Excluir' : 'Excluir itens'}
                            </button>
                        </div>

                        {/* Items Section */}
                        <div className="space-y-3">
                            <div className="bg-gray-100 px-3 py-2 flex justify-between text-[11px] font-bold text-gray-500 rounded-lg uppercase tracking-wider">
                                <span>Itens adicionados</span>
                                <span>Subtotal</span>
                            </div>
                            <div className="divide-y border rounded-xl overflow-hidden bg-white shadow-sm">
                                {cart.map(item => (
                                    <div key={item.tempId} className="p-4 flex flex-col space-y-2 relative">
                                        {(isEditMode || isDeleteMode) && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (isDeleteMode) {
                                                        setCart(cart.filter(i => i.tempId !== item.tempId));
                                                    } else {
                                                        handleProductClick(item.product);
                                                    }
                                                }}
                                                className="absolute right-4 top-4 p-2 rounded-full z-10 bg-white shadow-md border"
                                            >
                                                {isDeleteMode ? <Trash2 size={18} className="text-red-500" /> : <Edit2 size={18} className="text-blue-500" />}
                                            </button>
                                        )}
                                        <div className="flex justify-between items-start">
                                            <div className="flex gap-3">
                                                <span className="font-extrabold text-[#0099FF]">{item.quantity}x</span>
                                                <div className="flex flex-col">
                                                    <span className="text-gray-800 font-bold">{item.product.name}</span>
                                                    {item.addons.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {item.addons.map((a, idx) => (
                                                                <span key={idx} className="text-[10px] bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded border">
                                                                    + {a.item.name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="text-gray-900 font-bold">R$ {item.totalPrice.toFixed(2).replace('.', ',')}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Totals Section */}
                        <div className="bg-white border rounded-2xl p-4 space-y-3 shadow-sm border-dashed">
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>Subtotal</span>
                                <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                            </div>
                            {orderType === 'DELIVERY' && (
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>Entrega</span>
                                    <span className="text-green-600 font-medium">{deliveryFee > 0 ? `R$ ${deliveryFee.toFixed(2).replace('.', ',')}` : 'Grátis'}</span>
                                </div>
                            )}
                            {totalAdjustment !== 0 && (
                                <div className="flex justify-between text-sm text-orange-600 font-medium">
                                    <span>Ajuste manual</span>
                                    <span>{totalAdjustment > 0 ? '+' : ''} R$ {totalAdjustment.toFixed(2).replace('.', ',')}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center font-extrabold text-gray-900 pt-2 border-t text-lg">
                                <span>Total</span>
                                <span className="text-[#0099FF]">R$ {total.toFixed(2).replace('.', ',')}</span>
                            </div>
                        </div>

                        {/* Mobile Action Buttons Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setIsDeliveryModalOpen(true)}
                                className="flex flex-col items-center justify-center p-4 bg-white border-2 border-[#0099FF] rounded-2xl hover:bg-blue-50 transition-all gap-2"
                            >
                                <div className="p-2 bg-blue-50 text-[#0099FF] rounded-lg">
                                    <ShoppingBag size={20} />
                                </div>
                                <span className="font-bold text-[11px] text-[#0099FF] uppercase">Entrega</span>
                            </button>
                            <button
                                onClick={() => setIsPaymentSidebarOpen(true)}
                                className="flex flex-col items-center justify-center p-4 border-2 rounded-2xl transition-all gap-2 bg-white border-[#0099FF] hover:bg-blue-50"
                            >
                                <div className="p-2 rounded-lg bg-blue-50 text-[#0099FF]">
                                    <RefreshCw size={20} />
                                </div>
                                <span className="font-bold text-[11px] uppercase text-[#0099FF]">
                                    {paymentMethods.length === 0
                                        ? '[ R ] Pagamentos'
                                        : paymentMethods.length > 1
                                            ? '[ R ] Múltiplos'
                                            : `[ R ] ${paymentMethods[0].type === 'money' ? 'Dinheiro' : 'Cartão'}`
                                    }
                                </span>
                            </button>
                            <button
                                onClick={() => { setTempCpf(cpfCnpj); setIsCpfModalOpen(true); }}
                                className="flex flex-col items-center justify-center p-4 bg-white border-2 rounded-2xl hover:bg-blue-50 transition-all gap-2 border-[#0099FF]"
                            >
                                <div className={`p-2 rounded-lg ${cpfCnpj ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-[#0099FF]'}`}>
                                    <Edit2 size={20} />
                                </div>
                                <span className={`font-bold text-[11px] uppercase ${cpfCnpj ? 'text-green-600' : 'text-[#0099FF]'}`}>CPF/CNPJ</span>
                            </button>
                            <button
                                onClick={() => { setTempAdjustment(totalAdjustment.toString()); setIsAdjustmentModalOpen(true); }}
                                className={`flex flex-col items-center justify-center p-4 bg-white border-2 rounded-2xl hover:bg-blue-50 transition-all gap-2 ${totalAdjustment !== 0 ? 'border-orange-500' : 'border-[#0099FF]'}`}
                            >
                                <div className={`p-2 rounded-lg ${totalAdjustment !== 0 ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-[#0099FF]'}`}>
                                    <Plus size={20} />
                                </div>
                                <span className={`font-bold text-[11px] uppercase ${totalAdjustment !== 0 ? 'text-orange-600' : 'text-[#0099FF]'}`}>Ajustar valor</span>
                            </button>
                        </div>
                    </div>

                    {/* Fixed Footer */}
                    <div className="p-4 bg-white border-t shrink-0 pb-safe">
                        <button
                            onClick={handleCreateOrder}
                            disabled={isSubmitting || cart.length === 0}
                            className={`w-full py-4 bg-[#0099FF] text-white font-extrabold text-lg rounded-2xl shadow-xl shadow-blue-100 transition-all uppercase active:scale-[0.98] ${isSubmitting ? 'opacity-70' : ''}`}
                        >
                            {isSubmitting ? 'Gerando...' : 'Finalizar Pedido'}
                        </button>
                    </div>
                </div>
            )}

            {/* CPF/CNPJ Modal */}
            {isCpfModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
                        <h3 className="text-lg font-bold text-gray-900">CPF ou CNPJ na Nota</h3>
                        <input
                            type="text"
                            value={tempCpf}
                            onChange={(e) => setTempCpf(e.target.value)}
                            placeholder="000.000.000-00"
                            className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex gap-3">
                            <button onClick={() => setIsCpfModalOpen(false)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg">Cancelar</button>
                            <button
                                onClick={() => {
                                    setCpfCnpj(tempCpf);
                                    setIsCpfModalOpen(false);
                                    toast.success('CPF/CNPJ atualizado');
                                }}
                                className="flex-1 px-4 py-2 bg-blue-500 text-white font-medium rounded-lg"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Adjustment Modal */}
            {isAdjustmentModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
                        <h3 className="text-lg font-bold text-gray-900">Ajustar Valor do Pedido</h3>
                        <p className="text-xs text-gray-500">Use valores negativos para desconto (ex: -5.50) e positivos para acréscimo.</p>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">R$</span>
                            <input
                                type="number"
                                step="0.01"
                                value={tempAdjustment}
                                onChange={(e) => setTempAdjustment(e.target.value)}
                                placeholder="0,00"
                                className="w-full pl-10 pr-3 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setIsAdjustmentModalOpen(false)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg">Cancelar</button>
                            <button
                                onClick={() => {
                                    const val = parseFloat(tempAdjustment.replace(',', '.'));
                                    setTotalAdjustment(isNaN(val) ? 0 : val);
                                    setIsAdjustmentModalOpen(false);
                                    toast.success('Ajuste aplicado');
                                }}
                                className="flex-1 px-4 py-2 bg-blue-500 text-white font-medium rounded-lg"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PDV;
