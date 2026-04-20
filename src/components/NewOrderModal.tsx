import { X, Search, ChevronRight, Plus, Minus, ShoppingBag, Check, MessageSquare, RefreshCw, ChevronLeft, Trash2, Edit2, Settings } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import DeliveryMethodModal from './DeliveryMethodModal';
import PaymentEditSidebar from './PaymentEditSidebar';
// TableSelectionModal intentionally omitted as it is for Dine In specific logic often handled differently in Edit, but we can add if needed.
// For now, focusing on the requested footer actions.

import { toast } from 'react-hot-toast';

interface NewOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    order?: any;
    onSave?: (order: any) => void;
}

// Types
interface Category {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
    price: number;
    image_url?: string;
    category_id: number;
    description?: string;
    isStartingPrice?: boolean;
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
    tempId: string; // Unique ID for cart item
    product: Product;
    quantity: number;
    addons: { group_name: string; item: AddonItem }[];
    totalPrice: number;
    notes?: string;
}

type Step = 'SELECT_PRODUCT' | 'SELECT_ADDONS' | 'CART_MOBILE';

import { useEstablishment } from '../contexts/EstablishmentContext';

const NewOrderModal = ({ isOpen, onClose, order, onSave = () => { } }: NewOrderModalProps) => {
    const { establishment } = useEstablishment();
    // Data State
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Flow State
    const [currentStep, setCurrentStep] = useState<Step>('SELECT_PRODUCT');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [tempQuantity, setTempQuantity] = useState(1);
    const [currentAddonGroups, setCurrentAddonGroups] = useState<AddonGroup[]>([]);
    const [selectedAddons, setSelectedAddons] = useState<{ [groupId: number]: AddonItem[] }>({});

    // Cart State
    const [cart, setCart] = useState<CartItem[]>([]);
    const [customerName, setCustomerName] = useState('');
    const [phone, setPhone] = useState('');

    // New State for Additional Actions (Matched with PDV)
    const [cpfCnpj, setCpfCnpj] = useState('');
    const [totalAdjustment, setTotalAdjustment] = useState(0);
    const [isCpfModalOpen, setIsCpfModalOpen] = useState(false);
    const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
    const [tempAdjustment, setTempAdjustment] = useState('');
    const [tempCpf, setTempCpf] = useState('');

    const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
    const [deliveryAddress, setDeliveryAddress] = useState<any>(null); // To store address if needed for delivery
    const [deliveryFee, setDeliveryFee] = useState(0);

    const [isPaymentSidebarOpen, setIsPaymentSidebarOpen] = useState(false);
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Edit/Delete modes for cart items
    const [isEditMode, setIsEditMode] = useState(false);
    const [isDeleteMode, setIsDeleteMode] = useState(false);

    // Item Observation/Notes
    const [itemNotes, setItemNotes] = useState('');
    const [isItemNotesModalOpen, setIsItemNotesModalOpen] = useState(false);
    const [tempNotes, setTempNotes] = useState('');

    useEffect(() => {
        if (isOpen && establishment?.id) {
            fetchInitialData();
            if (order) {
                setCustomerName(order.customer_name || '');
                setPhone(order.customer_phone || '');
                // Populate new states
                setCpfCnpj(order.cpf_cnpj || '');
                setTotalAdjustment(0); // Adjustments are usually transient or need specific logic, keeping 0 for now unless we store it
                setDeliveryFee(order.delivery_fee || 0);
                setPaymentMethods(order.payment_methods || (order.payment_method ? [{ method: order.payment_method, amount: order.total_amount, type: order.payment_method === 'DINHEIRO' ? 'money' : 'card' }] : []));

                // If address logic exists in order, map it here. For now keeping it simple.
            }
        } else {
            // Reset state on close
            setCart([]);
            setCustomerName('');
            setPhone('');
            // Reset new states
            setCpfCnpj('');
            setTotalAdjustment(0);
            setDeliveryFee(0);
            setPaymentMethods([]);
            setDeliveryAddress(null);

            resetSelection();
            setItemNotes('');
        }
    }, [isOpen, establishment?.id, order]);

    const fetchInitialData = async () => {
        if (!establishment?.id) return;

        const { data: cats } = await supabase
            .from('categories')
            .select('*')
            .eq('establishment_id', establishment.id)
            .order('display_order');

        const { data: prods } = await supabase
            .from('products')
            .select('*')
            .eq('establishment_id', establishment.id)
            .eq('is_available', true);

        if (cats) {
            setCategories(cats);
            if (cats.length > 0) setSelectedCategoryId(cats[0].id);
        }
        if (prods) {
            // --- Logic to calculate "Starting From" price for zero-priced items (matched with PDV.tsx) ---
            const processedProds = prods.map(p => ({ ...p })); // Clone to avoid mutation
            const zeroPricedProducts = processedProds.filter(p => p.price === 0);

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
                            product.isStartingPrice = true;
                        }
                    });
                }
            }
            // -----------------------------------------------------------------------------------------

            setProducts(processedProds);

            // If editing, populate cart
            if (order) {
                setCustomerName(order.customer_name || '');
                setPhone(order.customer_phone || '');

                // Parse items if string
                try {
                    const orderItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items || [];

                    const mappedCart: CartItem[] = orderItems.map((item: any) => {
                        // Find product in the NEW processed list
                        let product = processedProds.find((p: any) => p.name === item.name || p.id === item.product_id);

                        // Fallback product if not found
                        if (!product) {
                            product = {
                                id: item.product_id || 0,
                                name: item.name,
                                price: item.unit_price || item.price || 0,
                                category_id: 0
                            };
                        }

                        // Map addons with improved parsing
                        const addons = (item.addons || []).map((addon: any) => ({
                            group_name: addon.group_name || 'Adicional',
                            item: {
                                id: addon.id || 0,
                                name: addon.name || addon.item?.name,
                                price: typeof addon.price === 'number' ? addon.price : (addon.item?.price || 0),
                                is_available: true
                            }
                        }));

                        // Calculate total price if missing or zero
                        const itemUnitPrice = Number(product?.price || 0);
                        const addonsPrice = Array.isArray(addons) ? addons.reduce((sum: number, a: any) => sum + (Number(a.item?.price) || 0), 0) : 0;
                        const calculatedTotal = item.total_price || item.total || (itemUnitPrice + addonsPrice) * (Number(item.quantity) || 1);

                        return {
                            tempId: Math.random().toString(36).substr(2, 9),
                            product,
                            quantity: Number(item.quantity) || 1,
                            addons,
                            totalPrice: calculatedTotal,
                            notes: item.notes || item.observation
                        };
                    });

                    console.log('NewOrderModal: Mapped cart items:', mappedCart.length);
                    setCart(mappedCart);
                } catch (err) {
                    console.error('NewOrderModal: Error mapping order items:', err);
                }
            }
        }
    };

    const fetchAddonsForProduct = async (productId: number) => {
        if (!establishment?.id) return;

        // Fetch Groups (matching PDV.tsx)
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

        // Fetch Items for these groups
        const groupIds = groups.map(g => g.id);
        const { data: items, error: itemsError } = await supabase
            .from('product_addons')
            .select('*')
            .in('group_id', groupIds)
            .eq('is_available', true);

        if (itemsError) throw itemsError;

        // Combine them
        const processedGroups = groups.map(g => ({
            ...g,
            items: items?.filter((i: any) => i.group_id === g.id) || []
        }));

        setCurrentAddonGroups(processedGroups);
    };

    const resetSelection = () => {
        setCurrentStep('SELECT_PRODUCT');
        setSelectedProduct(null);
        setTempQuantity(1);
        setSelectedAddons({});
        setCurrentAddonGroups([]);
        setItemNotes('');
    };

    const handleProductClick = async (product: Product) => {
        console.log('Product clicked:', product);

        // If already selected, just toggle (or maybe do nothing if we want them to use the buttons)
        if (selectedProduct?.id === product.id) {
            console.log('Product already selected, doing nothing');
            return;
        }

        try {
            setSelectedProduct(product);
            setTempQuantity(1);
            console.log('Set selected product, fetching addons...');
            await fetchAddonsForProduct(product.id);
            console.log('Addons fetched');
        } catch (error) {
            console.error('Error selecting product:', error);
            toast.error('Erro ao selecionar produto');
        }
    };

    const handleNextStep = () => {
        if (!selectedProduct) return;

        // Check if there are addons to select
        if (currentAddonGroups.length > 0) {
            setCurrentStep('SELECT_ADDONS');
        } else {
            // No addons, add directly
            handleAddToCart();
        }
    };

    const handleAddonToggle = (group: AddonGroup, item: AddonItem) => {
        setSelectedAddons(prev => {
            const current = prev[group.id] || [];
            const exists = current.find(i => i.id === item.id);

            if (exists) {
                // Remove
                return { ...prev, [group.id]: current.filter(i => i.id !== item.id) };
            } else {
                // Add (check max)
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

        // Calculate total
        let addonTotal = 0;
        const flatAddons: { group_name: string; item: AddonItem }[] = [];

        Object.entries(selectedAddons).forEach(([groupId, items]) => {
            const group = currentAddonGroups.find(g => g.id === Number(groupId));
            items.forEach(item => {
                addonTotal += item.price;
                flatAddons.push({ group_name: group?.name || 'Adicional', item });
            });
        });

        const newItem: CartItem = {
            tempId: Math.random().toString(36).substr(2, 9),
            product: selectedProduct,
            quantity: tempQuantity,
            addons: flatAddons,
            totalPrice: (selectedProduct.price + addonTotal) * tempQuantity,
            notes: itemNotes
        };

        setCart(prev => [...prev, newItem]);
        resetSelection();
        setItemNotes('');
        toast.success('Item adicionado!');
    };

    const handleRemoveFromCart = (tempId: string) => {
        setCart(prev => prev.filter(i => i.tempId !== tempId));
    };

    const filteredProducts = useMemo(() => {
        let list = products;
        if (selectedCategoryId) {
            list = list.filter(p => p.category_id === selectedCategoryId);
        }
        if (searchTerm) {
            list = list.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        return list;
    }, [products, selectedCategoryId, searchTerm]);

    const cartTotal = cart.reduce((acc, item) => acc + item.totalPrice, 0);
    const finalTotal = cartTotal + deliveryFee + totalAdjustment;

    const handleCreateOrder = async () => {
        if (!establishment?.id) return;
        if (cart.length === 0) {
            toast.error('O carrinho está vazio');
            return;
        }

        try {
            setIsSubmitting(true);
            // Calculate final total (including delivery fee and adjustments)
            // const finalTotal = cartTotal + deliveryFee + totalAdjustment; // Now at component level

            const orderData: any = {
                establishment_id: establishment.id,
                customer_name: customerName,
                customer_phone: phone,
                total_amount: finalTotal,
                total: finalTotal, // Sync both columns as in PDV.tsx
                status: order ? order.status : 'PENDING',
                cpf_cnpj: cpfCnpj,
                delivery_fee: deliveryFee,
                adjustment_amount: totalAdjustment,
                payment_methods: paymentMethods.length > 0 ? paymentMethods : null,
                payment_method: paymentMethods.length === 1 ? (paymentMethods[0].type === 'money' ? 'DINHEIRO' : 'CARTAO') : (paymentMethods.length > 1 ? 'MULTIPLE' : null),
                delivery_address: deliveryAddress,
                items: cart.map(item => ({
                    product_id: item.product.id,
                    id: item.product.id, // Compatibility with PDV.tsx
                    name: item.product.name,
                    quantity: item.quantity,
                    price: item.product.price, // unit price
                    unit_price: item.product.price,
                    total: item.totalPrice, // total price for the item (standard in this app)
                    total_price: item.totalPrice,
                    notes: item.notes,
                    addons: item.addons.map(addon => ({
                        id: addon.item.id,
                        name: addon.item.name,
                        price: addon.item.price
                    }))
                }))
            };

            let result;
            if (order) {
                // UPDATE
                const { data, error: updateError } = await supabase
                    .from('orders')
                    .update(orderData)
                    .eq('id', order.id)
                    .select()
                    .single();

                if (updateError) throw updateError;
                result = data;
                toast.success('Pedido atualizado com sucesso!');
            } else {
                // CREATE
                const { data, error } = await supabase
                    .from('orders')
                    .insert([orderData])
                    .select()
                    .single();

                if (error) throw error;
                result = data;
                toast.success('Pedido criado com sucesso!');
            }

            onSave(result);
            onClose();
        } catch (error) {
            console.error('Error creating order:', error);
            toast.error('Erro ao salvar pedido');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-gray-100 w-full h-full max-w-7xl rounded-xl shadow-2xl overflow-hidden flex flex-col font-sans">

                {/* Desktop Header */}
                <div className="hidden md:flex bg-white px-6 py-3 items-center justify-between border-b border-gray-200 shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors group">
                            <div className="w-8 h-8 bg-orange-500 text-white flex items-center justify-center rounded-lg shadow-sm group-hover:scale-105 transition-transform">
                                <ChevronLeft size={24} strokeWidth={3} />
                            </div>
                        </button>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            {order ? 'Editar Pedido' : 'Pedidos balcão (PDV)'}
                        </h2>
                    </div>

                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button className="bg-blue-500 text-white px-6 py-2 rounded-md font-bold text-sm shadow-sm transition-all">
                            Delivery e Balcão
                        </button>
                        <button className="text-gray-500 px-6 py-2 rounded-md font-medium text-sm hover:bg-gray-200 transition-colors">
                            Mesas e Comandas
                        </button>
                    </div>
                </div>

                {/* Custom Mobile Header (PDV Style) */}
                <div className="bg-white border-b border-gray-200 shrink-0 md:hidden">
                    <div className="flex items-center justify-between p-4 pb-2">
                        <div className="flex items-center gap-3">
                            <button onClick={onClose} className="p-2 -ml-2 text-gray-600">
                                <ChevronLeft size={24} />
                            </button>
                            <h1 className="text-lg font-bold text-gray-800">{order ? 'Editar Pedido' : 'PDV'}</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg border border-gray-200">
                                <Settings size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Inputs Row (Phone/Name) - Only show in SELECT_PRODUCT */}
                    {currentStep === 'SELECT_PRODUCT' && (
                        <div className="px-4 pb-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                            <div className="bg-white border border-gray-300 rounded-lg px-3 py-2 flex items-center shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                                <span className="text-gray-500 font-medium mr-2 shrink-0 text-xs uppercase tracking-wide">Fone:</span>
                                <input
                                    type="tel"
                                    className="flex-1 outline-none text-gray-800 placeholder-gray-400 bg-transparent text-sm font-medium"
                                    placeholder="(XX) X XXXX-XXXX"
                                    value={phone}
                                    onChange={(e) => {
                                        let v = e.target.value.replace(/\D/g, '');
                                        if (v.length > 11) v = v.slice(0, 11);
                                        if (v.length > 10) v = v.replace(/^(\d\d)(\d{5})(\d{4}).*/, '($1) $2-$3');
                                        else if (v.length > 5) v = v.replace(/^(\d\d)(\d{4})(\d{0,4}).*/, '($1) $2-$3');
                                        else if (v.length > 2) v = v.replace(/^(\d\d)(\d{0,5}).*/, '($1) $2');
                                        setPhone(v);
                                    }}
                                />
                            </div>
                            <div className="bg-white border border-gray-300 rounded-lg px-3 py-2 flex items-center shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                                <span className="text-gray-500 font-medium mr-2 shrink-0 text-xs uppercase tracking-wide">Cliente:</span>
                                <input
                                    type="text"
                                    placeholder="Nome do cliente"
                                    className="flex-1 outline-none text-gray-800 placeholder-gray-400 bg-transparent text-sm font-medium"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Content */}
                <div className="flex flex-1 overflow-hidden">

                    <div className="w-full md:w-2/3 bg-gray-50 flex flex-col border-r border-gray-200 relative mb-0 md:mb-0">

                        {/* Step 1: Product Selection */}
                        {currentStep === 'SELECT_PRODUCT' && (
                            <div className="flex flex-col h-full animate-in fade-in slide-in-from-left-4 duration-300 pb-36 md:pb-0">
                                {/* Filters & Search */}
                                <div className="p-4 bg-white/50 border-b border-gray-200 flex flex-col gap-3 shrink-0">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="[P] Pesquisar por produto..."
                                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" // Added border
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>

                                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                        <button
                                            onClick={() => setSelectedCategoryId(null)}
                                            className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${!selectedCategoryId ? 'bg-gray-800 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                        >
                                            Todos
                                        </button>
                                        {categories.map(cat => (
                                            <button
                                                key={cat.id}
                                                onClick={() => setSelectedCategoryId(cat.id)}
                                                className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${selectedCategoryId === cat.id ? 'bg-gray-800 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                            >
                                                {cat.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Products Grid */}
                                <div className="p-4 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 content-start flex-1 bg-gray-50">
                                    {filteredProducts.map(product => {
                                        const isSelected = selectedProduct?.id === product.id;
                                        return (
                                            <div
                                                key={product.id}
                                                onClick={() => handleProductClick(product)}
                                                className={`
                                                    group relative bg-white rounded-xl shadow-sm border-2 transition-all cursor-pointer overflow-hidden flex flex-col
                                                    ${isSelected ? 'border-blue-600 ring-4 ring-blue-500/10 scale-[1.02] z-10' : 'border-gray-100 hover:border-blue-300 hover:shadow-md'}
                                                    h-[240px] // Reduced height slightly
                                                `}
                                            >
                                                {/* Image */}
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

                                                {/* Content */}
                                                <div className="p-3 flex flex-col flex-1">
                                                    <h3 className={`font-bold text-sm leading-tight line-clamp-2 mb-1 ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>
                                                        {product.name}
                                                    </h3>
                                                    <div className="mt-auto flex flex-col">
                                                        {product.isStartingPrice && (
                                                            <span className="text-[10px] text-gray-400 font-bold uppercase leading-none mb-1">A partir de</span>
                                                        )}
                                                        <span className="text-lg font-extrabold text-green-600 leading-none">
                                                            R$ {product.price.toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Selection Controls */}
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
                                    })}
                                </div>

                                {/* Desktop Footer (Hidden Mobile) */}
                                <div className="hidden md:flex p-4 bg-white border-t border-gray-200 items-center justify-between shrink-0">
                                    <button className="px-6 py-3 border border-blue-500 text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition-colors uppercase text-sm flex items-center gap-2">
                                        <MessageSquare size={18} />
                                        [ O ] Observação do item
                                    </button>

                                    <div className="flex gap-4">
                                        {selectedProduct && (
                                            <>
                                                <button onClick={resetSelection} className="px-6 py-3 border border-gray-300 text-gray-600 font-bold rounded-lg hover:bg-gray-100 transition-colors uppercase text-sm">
                                                    [ V ] Voltar
                                                </button>
                                                <button onClick={handleNextStep} className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg shadow-lg shadow-blue-200 transition-all uppercase text-sm flex items-center gap-2">
                                                    [ A ] Próximo
                                                    <ChevronRight size={18} />
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
                                {/* Header */}
                                <div className="p-6 bg-white border-b border-gray-200">
                                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                                        <span>{selectedProduct.name}</span>
                                        <ChevronRight size={14} />
                                        <span className="font-bold text-gray-800">Adicionais</span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-800">Turbine seu lanche</h2>
                                    <p className="text-gray-500 text-sm">Selecione as opções desejadas</p>
                                </div>

                                {/* Addons List */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-36">
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

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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

                                    {currentAddonGroups.length === 0 && (
                                        <div className="text-center py-20 text-gray-400">
                                            <p>Nenhum adicional disponível para este item.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Footer Actions (Step 2) */}
                                <div className="p-4 bg-white border-t border-gray-200 flex items-center justify-between">
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

                        {/* Mobile Footer Actions */}
                        <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 pb-6 bg-white border-t border-gray-200 z-[110] shadow-[0_-8px_30px_rgb(0,0,0,0.08)]">
                            {currentStep === 'SELECT_PRODUCT' ? (
                                selectedProduct ? (
                                    <div className="flex flex-col gap-2 animate-in slide-in-from-bottom-2 duration-200">
                                        <button
                                            onClick={() => { setTempNotes(itemNotes); setIsItemNotesModalOpen(true); }}
                                            className={`w-full py-3.5 border-2 rounded-xl uppercase text-xs font-bold flex items-center justify-center gap-2 transition-all ${itemNotes ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-blue-500 bg-white text-blue-500'}`}
                                        >
                                            <MessageSquare size={16} />
                                            <span>[ O ] Observação do item</span>
                                        </button>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={resetSelection}
                                                className="flex-1 py-3.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl uppercase text-xs flex items-center justify-center gap-2"
                                            >
                                                <span>[ V ] Voltar</span>
                                            </button>
                                            <button
                                                onClick={handleNextStep}
                                                className="flex-1 py-3.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl uppercase text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-100 active:scale-95"
                                            >
                                                <span>Próximo</span>
                                                <ChevronRight size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {/* PDV Style Floating Cart Footer (Main Action when item not selected) */}
                                        {cart.length > 0 && (
                                            <div
                                                className="bg-[#0B1E34] text-white p-4 rounded-2xl shadow-2xl cursor-pointer transition-all duration-300 transform fixed bottom-[86px] left-4 right-4 z-[40] border border-white/10 flex items-center justify-between px-6 active:scale-95 animate-in slide-in-from-bottom-4"
                                                onClick={() => setCurrentStep('CART_MOBILE')}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                                                        <ShoppingBag size={24} className="text-blue-400" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-1.5">Seu pedido</span>
                                                        <span className="font-extrabold text-sm leading-none">{cart.length} {cart.length === 1 ? 'item' : 'itens'}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-1.5">Total</span>
                                                        <span className="font-extrabold text-lg leading-none text-blue-400">R$ {finalTotal.toFixed(2).replace('.', ',')}</span>
                                                    </div>
                                                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                                                        <ChevronRight size={24} className="text-gray-300" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex justify-between items-center gap-4 pb-20">
                                            <button
                                                onClick={() => {
                                                    if (cart.length > 0) setCurrentStep('CART_MOBILE');
                                                    else toast.error('Seu carrinho está vazio');
                                                }}
                                                className="flex-1 py-4 bg-gray-50 text-gray-700 font-bold rounded-2xl flex items-center justify-center gap-2 border border-gray-100"
                                            >
                                                <ShoppingBag size={20} />
                                                <span className="text-sm uppercase tracking-wide">Pedido</span>
                                            </button>
                                            <button
                                                onClick={handleCreateOrder}
                                                disabled={cart.length === 0 || isSubmitting}
                                                className="flex-2 py-4 bg-[#0099FF] text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-100 transition-all uppercase text-sm tracking-widest px-8"
                                            >
                                                {isSubmitting ? <RefreshCw size={20} className="animate-spin" /> : <Check size={20} />}
                                                <span>{order ? 'Finalizar' : 'Salvar'}</span>
                                            </button>
                                        </div>
                                    </>
                                )
                            ) : currentStep === 'SELECT_ADDONS' ? (
                                <div className="flex flex-col gap-2 animate-in slide-in-from-bottom-2 duration-200">
                                    <button
                                        onClick={() => { setTempNotes(itemNotes); setIsItemNotesModalOpen(true); }}
                                        className={`w-full py-3.5 border-2 rounded-xl uppercase text-xs font-bold flex items-center justify-center gap-2 transition-all ${itemNotes ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-blue-500 bg-white text-blue-500'}`}
                                    >
                                        <MessageSquare size={16} />
                                        <span>[ O ] Observação do item</span>
                                    </button>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setCurrentStep('SELECT_PRODUCT')}
                                            className="flex-1 py-3.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl uppercase text-xs flex items-center justify-center gap-2"
                                        >
                                            <span>[ V ] Voltar</span>
                                        </button>
                                        <button
                                            onClick={handleAddToCart}
                                            className="flex-1 py-3.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl uppercase text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-100 active:scale-95"
                                        >
                                            <span>Confirmar</span>
                                            <Check size={18} />
                                        </button>
                                    </div>
                                </div>
                            ) : ( // CART_MOBILE
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={handleCreateOrder}
                                        disabled={isSubmitting || cart.length === 0}
                                        className="w-full py-4 bg-blue-500 text-white font-extrabold text-lg rounded-2xl shadow-xl shadow-blue-100 transition-all uppercase active:scale-[0.98] flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <RefreshCw size={20} className="animate-spin" />
                                                <span>SALVANDO...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Check size={24} />
                                                <span>{order ? 'ATUALIZAR PEDIDO' : 'SALVAR PEDIDO'}</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT SIDE: Cart (Desktop) */}
                    <div className="hidden md:flex w-1/3 bg-white flex-col border-l border-gray-200 shadow-xl z-20">
                        {/* Desktop Cart Header */}
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h3 className="font-bold text-gray-700">Resumo do Pedido</h3>
                            <button className="p-1 hover:bg-gray-200 rounded text-gray-500"><Settings size={18} /></button>
                        </div>

                        {/* Desktop Cart Content - Same as before but wrapped */}
                        <div className="bg-gray-100 px-4 py-2 flex justify-between text-xs font-bold text-gray-500 uppercase tracking-wide">
                            <span>Itens</span>
                            <span>Total</span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                        <ShoppingBag size={32} />
                                    </div>
                                    <p className="text-sm font-medium">Seu carrinho está vazio</p>
                                    <p className="text-xs">Selecione produtos ao lado</p>
                                </div>
                            ) : (
                                cart.map((item) => (
                                    <div
                                        key={item.tempId}
                                        className="group relative bg-white border border-gray-100 rounded-lg p-3 hover:bg-[#0099FF] hover:border-[#0099FF] hover:text-white transition-all cursor-pointer shadow-sm"
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-sm group-hover:text-white text-gray-800">
                                                {item.quantity}x {item.product.name}
                                            </span>
                                            <span className="font-bold text-sm group-hover:text-white text-gray-800">
                                                R$ {item.totalPrice.toFixed(2)}
                                            </span>
                                        </div>

                                        {item.addons.length > 0 && (
                                            <div className="pl-2 space-y-0.5 mt-1 border-l-2 border-gray-100 group-hover:border-white/30">
                                                {item.addons.map((addon, idx) => (
                                                    <div key={idx} className="flex justify-between text-xs group-hover:text-blue-50 text-gray-500">
                                                        <span>{addon.item.name}</span>
                                                        <span>+ R$ {addon.item.price.toFixed(2)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveFromCart(item.tempId);
                                            }}
                                            className="absolute top-2 right-2 p-1.5 text-red-500 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-sm"
                                            title="Remover item"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Desktop Cart Footer (PDV Style) */}
                        <div className="p-4 bg-gray-50 border-t border-gray-200">
                            <div className="space-y-3 mb-4">
                                {/* Totals */}
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Subtotal</span>
                                        <span>R$ {cart.reduce((acc, item) => acc + item.totalPrice, 0).toFixed(2).replace('.', ',')}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Entrega</span>
                                        <span className="text-green-600">{deliveryFee > 0 ? `R$ ${deliveryFee.toFixed(2).replace('.', ',')}` : 'Grátis'}</span>
                                    </div>
                                    {totalAdjustment !== 0 && (
                                        <div className="flex justify-between text-orange-600">
                                            <span>Ajustes</span>
                                            <span>{totalAdjustment > 0 ? '+' : ''} R$ {totalAdjustment.toFixed(2).replace('.', ',')}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center bg-gray-200/50 p-3 rounded-lg mt-2">
                                        <span className="font-bold text-gray-800 text-lg">Total</span>
                                        <span className="font-bold text-xl text-gray-900">R$ {(cart.reduce((acc, item) => acc + item.totalPrice, 0) + deliveryFee + totalAdjustment).toFixed(2).replace('.', ',')}</span>
                                    </div>
                                </div>

                                {/* Inputs Grid */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-white border border-gray-200 rounded px-3 py-2 flex items-center shadow-sm">
                                        <input
                                            type="tel"
                                            className="w-full outline-none text-gray-700 placeholder-gray-400 bg-transparent text-sm"
                                            placeholder="(XX) X XXXX-XXXX"
                                            value={phone}
                                            onChange={(e) => {
                                                let v = e.target.value.replace(/\D/g, '');
                                                if (v.length > 11) v = v.slice(0, 11);
                                                if (v.length > 10) v = v.replace(/^(\d\d)(\d{5})(\d{4}).*/, '($1) $2-$3');
                                                else if (v.length > 5) v = v.replace(/^(\d\d)(\d{4})(\d{0,4}).*/, '($1) $2-$3');
                                                else if (v.length > 2) v = v.replace(/^(\d\d)(\d{0,5}).*/, '($1) $2');
                                                setPhone(v);
                                            }}
                                        />
                                    </div>
                                    <div className="bg-white border border-gray-200 rounded px-3 py-2 flex items-center shadow-sm">
                                        <input
                                            type="text"
                                            placeholder="Nome do cliente..."
                                            className="w-full outline-none text-gray-700 placeholder-gray-400 bg-transparent text-sm"
                                            value={customerName}
                                            onChange={(e) => setCustomerName(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Action Buttons Grid (PDV Matches) */}
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setIsDeliveryModalOpen(true)}
                                        className={`flex items-center justify-center py-3 bg-white border-2 rounded-lg font-bold text-xs hover:bg-blue-50 transition-colors uppercase gap-2 ${deliveryFee > 0 ? 'border-[#0099FF] text-[#0099FF]' : 'border-[#0099FF] text-[#0099FF]'}`}
                                    >
                                        [E] ENTREGA
                                    </button>
                                    <button
                                        onClick={() => setIsPaymentSidebarOpen(true)}
                                        className={`flex items-center justify-center py-3 border-2 rounded-lg font-bold text-xs transition-colors uppercase gap-2 ${paymentMethods.length > 0
                                            ? 'bg-green-500 border-green-500 text-white shadow-sm'
                                            : 'bg-white border-[#0099FF] text-[#0099FF] hover:bg-blue-50'
                                            }`}
                                    >
                                        {paymentMethods.length === 0
                                            ? '[R] PAGAMENTOS'
                                            : paymentMethods.length > 1
                                                ? '[R] MÚLTIPLOS'
                                                : `[R] ${paymentMethods[0].type === 'money' ? 'DINHEIRO' : 'CARTÃO'}`
                                        }
                                    </button>
                                    <button
                                        onClick={() => {
                                            setTempCpf(cpfCnpj);
                                            setIsCpfModalOpen(true);
                                        }}
                                        className={`flex items-center justify-center py-3 bg-white border-2 rounded-lg font-bold text-xs hover:bg-blue-50 transition-colors uppercase gap-2 ${cpfCnpj ? 'border-green-500 text-green-600' : 'border-[#0099FF] text-[#0099FF]'}`}
                                    >
                                        [T] CPF/CNPJ
                                    </button>
                                    <button
                                        onClick={() => {
                                            setTempAdjustment(totalAdjustment.toString());
                                            setIsAdjustmentModalOpen(true);
                                        }}
                                        className={`flex items-center justify-center py-3 bg-white border-2 rounded-lg font-bold text-xs hover:bg-blue-50 transition-colors uppercase gap-2 ${totalAdjustment !== 0 ? 'border-orange-500 text-orange-600' : 'border-[#0099FF] text-[#0099FF]'}`}
                                    >
                                        [Y] VALOR
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={handleCreateOrder}
                                disabled={cart.length === 0 || isSubmitting}
                                className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg shadow-green-200 transition-all uppercase flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>PROCESSANDO...</span>
                                    </>
                                ) : (
                                    <>
                                        <Check size={24} />
                                        <span>{order ? 'ATUALIZAR PEDIDO' : 'FINALIZAR PEDIDO'}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Full Screen Cart Overlay */}
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
                                                                handleRemoveFromCart(item.tempId);
                                                            } else {
                                                                // Edit item
                                                                handleProductClick(item.product);
                                                                // Logic to populate addons could go here, but for now just resets to product selection
                                                            }
                                                        }}
                                                        className="absolute right-4 top-4 p-2 rounded-full z-10 bg-white shadow-md border"
                                                    >
                                                        {isDeleteMode ? <Trash2 size={18} className="text-red-500" /> : <Edit2 size={18} className="text-blue-500" />}
                                                    </button>
                                                )}
                                                <div className="flex justify-between items-start">
                                                    <div className="flex gap-3">
                                                        <span className="font-extrabold text-blue-500">{item.quantity}x</span>
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
                                        <span>R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-500">
                                        <span>Entrega</span>
                                        <span className="text-green-600 font-medium">{deliveryFee > 0 ? `R$ ${deliveryFee.toFixed(2).replace('.', ',')}` : 'Grátis'}</span>
                                    </div>
                                    {totalAdjustment !== 0 && (
                                        <div className="flex justify-between text-sm text-orange-600 font-medium">
                                            <span>Ajuste manual</span>
                                            <span>{totalAdjustment > 0 ? '+' : ''} R$ {totalAdjustment.toFixed(2).replace('.', ',')}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center font-extrabold text-gray-900 pt-2 border-t text-lg">
                                        <span>Total</span>
                                        <span className="text-blue-500">R$ {finalTotal.toFixed(2).replace('.', ',')}</span>
                                    </div>
                                </div>

                                {/* Mobile Action Buttons Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setIsDeliveryModalOpen(true)}
                                        className="flex flex-col items-center justify-center p-4 bg-white border-2 border-blue-500 rounded-2xl hover:bg-blue-50 transition-all gap-2"
                                    >
                                        <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
                                            <ShoppingBag size={20} />
                                        </div>
                                        <span className="font-bold text-[11px] text-blue-500 uppercase">Entrega</span>
                                    </button>
                                    <button
                                        onClick={() => setIsPaymentSidebarOpen(true)}
                                        className="flex flex-col items-center justify-center p-4 border-2 rounded-2xl transition-all gap-2 bg-white border-blue-500 hover:bg-blue-50"
                                    >
                                        <div className="p-2 rounded-lg bg-blue-50 text-blue-500">
                                            <RefreshCw size={20} />
                                        </div>
                                        <span className="font-bold text-[11px] uppercase text-blue-500">
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
                                        className="flex flex-col items-center justify-center p-4 bg-white border-2 rounded-2xl hover:bg-blue-50 transition-all gap-2 border-blue-500"
                                    >
                                        <div className={`p-2 rounded-lg ${cpfCnpj ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-500'}`}>
                                            <Edit2 size={20} />
                                        </div>
                                        <span className={`font-bold text-[11px] uppercase ${cpfCnpj ? 'text-green-600' : 'text-blue-500'}`}>CPF/CNPJ</span>
                                    </button>
                                    <button
                                        onClick={() => { setTempAdjustment(totalAdjustment.toString()); setIsAdjustmentModalOpen(true); }}
                                        className={`flex flex-col items-center justify-center p-4 bg-white border-2 rounded-2xl hover:bg-blue-50 transition-all gap-2 ${totalAdjustment !== 0 ? 'border-orange-500' : 'border-blue-500'}`}
                                    >
                                        <div className={`p-2 rounded-lg ${totalAdjustment !== 0 ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-500'}`}>
                                            <Plus size={20} />
                                        </div>
                                        <span className={`font-bold text-[11px] uppercase ${totalAdjustment !== 0 ? 'text-orange-600' : 'text-blue-500'}`}>Ajustar valor</span>
                                    </button>
                                </div>

                                {/* Padding for fixed footer */}
                                <div className="h-20 shrink-0"></div>
                            </div>

                            {/* Fixed Footer */}
                            <div className="p-4 bg-white border-t shrink-0 pb-safe z-[70]">
                                <button
                                    onClick={handleCreateOrder}
                                    disabled={isSubmitting || cart.length === 0}
                                    className={`w-full py-4 bg-blue-500 text-white font-extrabold text-lg rounded-2xl shadow-xl shadow-blue-100 transition-all uppercase active:scale-[0.98] flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70' : ''}`}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <RefreshCw size={20} className="animate-spin" />
                                            <span>SALVANDO...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Check size={24} />
                                            <span>{order ? 'ATUALIZAR PEDIDO' : 'SALVAR PEDIDO'}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                    {/* End of Main Content flex container */}
                </div>

                {/* MODALS */}

                {/* CPF/CNPJ Modal */}
                {
                    isCpfModalOpen && (
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
                    )
                }

                {/* Adjustment Modal */}
                {
                    isAdjustmentModalOpen && (
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
                    )
                }

                {/* Delivery Method Modal */}
                <DeliveryMethodModal
                    isOpen={isDeliveryModalOpen}
                    onClose={() => setIsDeliveryModalOpen(false)}
                    onConfirm={(data) => {
                        // Assuming data contains: { type, fee, address? }
                        // Based on PDV usage, we might need to adjust logic.
                        // For now mapping what we expect:
                        if (data) {
                            setDeliveryAddress(data.address || null);
                            // Parse fee if string
                            const fee = typeof data.fee === 'string' ? parseFloat(data.fee.replace(',', '.')) : (data.fee || 0);
                            setDeliveryFee(fee);
                            // Update order type if needed (e.g. delivery vs pickup)
                        }
                        setIsDeliveryModalOpen(false);
                        toast.success('Dados de entrega atualizados');
                    }}
                    customerName={customerName}
                    customerPhone={phone}
                    initialData={deliveryAddress} // Pass current address as initial data
                />

                {/* Payment Edit Sidebar */}
                <PaymentEditSidebar
                    isOpen={isPaymentSidebarOpen}
                    onClose={() => setIsPaymentSidebarOpen(false)}
                    order={{
                        ...order,
                        total_amount: cartTotal + deliveryFee + totalAdjustment
                    }}
                    onSave={(methods) => {
                        setPaymentMethods(methods);
                        setIsPaymentSidebarOpen(false);
                        toast.success('Pagamento atualizado');
                    }}
                />
            </div >

            {/* Item Notes Modal (Mobile) */}
            {isItemNotesModalOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center border-b pb-3">
                            <h3 className="text-lg font-bold text-gray-900">Observação do item</h3>
                            <button onClick={() => setIsItemNotesModalOpen(false)} className="text-gray-400">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Notas / Observações</label>
                            <textarea
                                value={tempNotes}
                                onChange={(e) => setTempNotes(e.target.value)}
                                placeholder="Ex: Sem cebola, bem passado, etc..."
                                className="w-full h-32 p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm resize-none"
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setIsItemNotesModalOpen(false)}
                                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    setItemNotes(tempNotes);
                                    setIsItemNotesModalOpen(false);
                                    toast.success('Observação salva');
                                }}
                                className="flex-1 px-4 py-3 bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-100 transition-all active:scale-95"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default NewOrderModal;
