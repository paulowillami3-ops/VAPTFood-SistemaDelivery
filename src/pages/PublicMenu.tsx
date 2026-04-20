import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Share2, ShoppingCart, Home, ClipboardList, ChevronLeft, ChevronDown, Plus, Minus, X, AlertCircle, Check, Heart, ShoppingBag, Trash2, MilkOff, CandyOff, Snowflake, Martini, Leaf, User, Smartphone, CreditCard, Banknote, MapPin, ChevronRight, Copy, QrCode } from 'lucide-react';
// ... (skip down to remove handleAdvanceToConfirmation if truly unused, or comment it out if it was intended for something)

// ... fixing specific unused vars content logic below ...
import { useEstablishment } from '../contexts/EstablishmentContext';

interface Addon {
    id: number;
    name: string;
    price: number;
    is_available: boolean;
}

interface AddonGroup {
    id: number;
    name: string;
    min_quantity: number;
    max_quantity: number;
    is_required: boolean;
    addons: Addon[];
}

interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    image_url: string | null;
    is_available: boolean;
    has_addons: boolean;
    addon_groups?: AddonGroup[];
    is_sugar_free?: boolean;
    is_lactose_free?: boolean;
    is_cold_drink?: boolean;
    is_alcoholic?: boolean;
    is_artificial_preservative_free?: boolean;
    is_natural?: boolean;
    sold_count?: number;
    original_price?: number;
}

interface Category {
    id: number;
    name: string;
    display_order: number;
    products: Product[];
}

interface Order {
    id: number;
    items: any[];
    total_amount: number;
    status: string;
    created_at: string;
    payment_method: string;
}

interface CartItem {
    product: Product;
    quantity: number;
    addons: { [key: number]: any[] }; // group_id -> addon[]
    observation: string;
    totalPrice: number;
}

// Simple Phone Mask
const formatPhone = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/^(\d{2})(\d)/g, '($1) $2')
        .replace(/(\d)(\d{4})$/, '$1-$2')
        .slice(0, 15);
};

const PublicMenu = () => {
    const { establishment } = useEstablishment();
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState<number | null>(null);

    // Product Modal State
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [productAddonGroups, setProductAddonGroups] = useState<any[]>([]);
    const [selectedAddons, setSelectedAddons] = useState<{ [key: number]: any[] }>({}); // group_id -> addon[]

    // Confirmation/Cart Logic
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [tempCartItem, setTempCartItem] = useState<Partial<CartItem>>({});
    const [cart, setCart] = useState<CartItem[]>([]);
    const [savedAddresses, setSavedAddresses] = useState<any[]>([]);

    const [isLoadingAddons, setIsLoadingAddons] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState<number[]>([]);
    const [showClosedError, setShowClosedError] = useState(false);

    // Table Selection State
    const [tables, setTables] = useState<any[]>([]);
    const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
    const [selectedTableNumber, setSelectedTableNumber] = useState<string | null>(null);
    const [isLoadingTables, setIsLoadingTables] = useState(false);

    // Navigation & Identity State
    const [activeTab, setActiveTab] = useState<'home' | 'cart' | 'orders' | 'profile'>('home');
    const [customerInfo, setCustomerInfo] = useState<{ name: string; phone: string } | null>(() => {
        const saved = localStorage.getItem('customerInfo');
        return saved ? JSON.parse(saved) : null;
    });
    const [tempName, setTempName] = useState('');
    const [tempPhone, setTempPhone] = useState('');
    const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);
    const [isNewCustomer, setIsNewCustomer] = useState(true);
    const [lookupDone, setLookupDone] = useState(false);
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);
    const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
    const [featuredMode, setFeaturedMode] = useState<'most_sold' | 'promotional'>('most_sold');

    // Search Logic
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Checkout State
    const [isCheckoutFlow, setIsCheckoutFlow] = useState(false);
    const [showCheckout, setShowCheckout] = useState(false);
    const [showDataConfirmation, setShowDataConfirmation] = useState(false);
    const [showChangeModal, setShowChangeModal] = useState(false);
    const [changeFor, setChangeFor] = useState('');
    const [showOrderSuccess, setShowOrderSuccess] = useState(false);
    const [lastOrder, setLastOrder] = useState<any>(null);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
    const [deliveryMethod, setDeliveryMethod] = useState<'DELIVERY' | 'PICKUP' | 'DINE_IN' | null>(null);
    const [address, setAddress] = useState({
        cep: '',
        street: '',
        number: '',
        neighborhood: '',
        city: '',
        state: '',
        complement: '',
        reference: ''
    });
    const [isLoadingAddress, setIsLoadingAddress] = useState(false);
    const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
    const [regions, setRegions] = useState<any[]>([]);
    const [selectedRegion, setSelectedRegion] = useState<any | null>(null);
    const [isLoadingRegions, setIsLoadingRegions] = useState(false);

    useEffect(() => {
        if (activeTab === 'orders' && customerInfo && establishment?.id) {
            fetchOrders();
        }
        window.scrollTo(0, 0);
    }, [activeTab, customerInfo, establishment?.id]);

    const fetchOrders = async () => {
        if (!customerInfo?.phone || !establishment?.id) return;
        setIsLoadingOrders(true);
        try {
            // Remove non-digits for query
            const rawPhone = customerInfo.phone.replace(/\D/g, '');
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('customer_phone', rawPhone)
                .eq('establishment_id', establishment.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setIsLoadingOrders(false);
        }
    };

    useEffect(() => {
        if (establishment?.id) {
            setCart([]);
            fetchMenuData();
            fetchRegions();
        }
    }, [establishment?.id]);

    const fetchRegions = async () => {
        if (!establishment?.id) return;
        setIsLoadingRegions(true);
        try {
            const { data, error } = await supabase
                .from('delivery_regions')
                .select('*')
                .eq('establishment_id', establishment.id)
                .eq('active', true)
                .order('name');
            if (error) throw error;
            setRegions(data || []);
        } catch (error) {
            console.error('Error fetching regions:', error);
        } finally {
            setIsLoadingRegions(false);
        }
    };

    useEffect(() => {
        if (customerInfo?.phone) {
            // Customers are global for now, filtering by phone is unique enough
            // If we wanted per-establishment addresses, we'd need a different relationship (many-to-many customers_establishments)
            const fetchAddresses = async () => {
                const { data } = await supabase
                    .from('customers')
                    .select('addresses')
                    .eq('phone', customerInfo.phone.replace(/\D/g, ''))
                    .single();

                if (data?.addresses) {
                    setSavedAddresses(data.addresses);
                }
            };
            fetchAddresses();
        }
    }, [customerInfo]);

    const fetchMenuData = async () => {
        if (!establishment?.id) return;
        setIsLoading(true);
        try {
            // 1. Fetch Settings (Featured Mode)
            const { data: settings } = await supabase
                .from('establishment_settings')
                .select('featured_products_mode')
                .eq('id', establishment.id)
                .single();

            const mode = settings?.featured_products_mode || 'most_sold';
            setFeaturedMode(mode as any);

            // 2. Fetch Featured Products (Safe pattern: fetch product first)
            let featuredQuery = supabase
                .from('products')
                .select('*')
                .eq('establishment_id', establishment.id)
                .eq('is_available', true);

            if (mode === 'most_sold') {
                featuredQuery = featuredQuery.order('sold_count', { ascending: false }).limit(6);
            } else {
                featuredQuery = featuredQuery.not('original_price', 'is', null);
            }

            const { data: featuredData } = await featuredQuery;
            let finalFeatured = featuredData || [];

            if (finalFeatured.length > 0) {
                const featuredIds = finalFeatured.map(p => p.id);
                // Fetch groups for these featured products
                const { data: fGroups } = await supabase
                    .from('product_addon_groups')
                    .select('*')
                    .in('product_id', featuredIds);

                if (fGroups && fGroups.length > 0) {
                    const fGroupIds = fGroups.map(g => g.id);
                    const { data: fAddons } = await supabase
                        .from('product_addons')
                        .select('*')
                        .in('group_id', fGroupIds)
                        .eq('is_available', true);

                    finalFeatured = finalFeatured.map(p => ({
                        ...p,
                        addon_groups: fGroups
                            .filter(g => g.product_id === p.id)
                            .map(g => ({
                                ...g,
                                addons: fAddons?.filter(a => a.group_id === g.id) || []
                            }))
                            .sort((a, b) => a.display_order - b.display_order)
                    }));
                }
            }

            if (mode === 'promotional') {
                finalFeatured = finalFeatured
                    .filter((p: any) => p.original_price > p.price)
                    .sort((a: any, b: any) => {
                        const discountA = a.original_price - a.price;
                        const discountB = b.original_price - b.price;
                        return discountB - discountA;
                    })
                    .slice(0, 6);
            }

            setFeaturedProducts(finalFeatured);

            // 3. Fetch Categories & All Products
            const { data: cats, error: catError } = await supabase
                .from('categories')
                .select('*')
                .eq('establishment_id', establishment.id)
                .order('display_order', { ascending: true });

            if (catError) throw catError;

            const { data: prods, error: prodError } = await supabase
                .from('products')
                .select('*')
                .eq('establishment_id', establishment.id)
                .eq('is_available', true)
                .order('order_index', { ascending: true, nullsFirst: false }) // Categories order
                .order('name', { ascending: true });

            if (prodError) throw prodError;

            let processedProds = prods || [];

            if (processedProds.length > 0) {
                const prodIds = processedProds.map(p => p.id);
                // Fetch groups for ALL products in the menu
                const { data: allGroups } = await supabase
                    .from('product_addon_groups')
                    .select('*')
                    .in('product_id', prodIds);

                if (allGroups && allGroups.length > 0) {
                    const allGroupIds = allGroups.map(g => g.id);
                    const { data: allAddons } = await supabase
                        .from('product_addons')
                        .select('*')
                        .in('group_id', allGroupIds)
                        .eq('is_available', true);

                    processedProds = processedProds.map(p => ({
                        ...p,
                        addon_groups: allGroups
                            .filter(g => g.product_id === p.id)
                            .map(g => ({
                                ...g,
                                addons: allAddons?.filter(a => a.group_id === g.id) || []
                            }))
                            .sort((a, b) => a.display_order - b.display_order)
                    }));
                }
            }

            const fullMenu: Category[] = cats.map(cat => ({
                ...cat,
                products: processedProds.filter(p => p.category_id === cat.id) || []
            })).filter(cat => cat.products.length > 0);

            setCategories(fullMenu);
            if (fullMenu.length > 0 && !activeCategory) setActiveCategory(fullMenu[0].id);

        } catch (error) {
            console.error('Error loading menu:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleProductClick = async (product: Product) => {
        setSelectedProduct(product);
        setProductAddonGroups([]);
        setSelectedAddons({});
        // Initialize tempCartItem for observation state
        setTempCartItem({
            product: product,
            quantity: 1,
            addons: {},
            observation: '',
            totalPrice: Number(product.price)
        });

        setIsLoadingAddons(true);
        setExpandedGroups([]); // Reset expansion
        setShowClosedError(false);

        try {
            // Fetch groups logic (similar to CategoryCard but optimized for viewing)
            const { data: linkedGroups, error: groupsError } = await supabase
                .from('product_addon_groups')
                .select('*')
                .eq('product_id', product.id)
                .order('display_order', { ascending: true });

            console.log('Linked Groups Fetch:', linkedGroups); // DEBUG LOG

            if (groupsError) throw groupsError;

            if (linkedGroups && linkedGroups.length > 0) {
                console.log('Linked Groups Found (Raw):', linkedGroups); // DEBUG
                const groupIds = linkedGroups.map((g: any) => g.id);
                console.log('Fetching addons for Group IDs:', groupIds); // DEBUG

                const { data: addons, error: addonsError } = await supabase
                    .from('product_addons')
                    .select('*')
                    .in('group_id', groupIds)
                    .eq('is_available', true)
                    .order('price', { ascending: true });

                if (addonsError) {
                    console.error('Addons fetch error:', addonsError);
                    throw addonsError;
                }

                console.log('Addons Fetched (Raw):', addons); // DEBUG

                const groupsWithAddons = linkedGroups.map((group: any) => ({
                    ...group,
                    addons: addons?.filter((a: any) => a.group_id === group.id) || []
                }));

                console.log('Groups BEFORE Filter:', groupsWithAddons); // DEBUG

                // Allow empty groups to show for debugging purposes or visual confirmation
                const finalGroups = groupsWithAddons;

                console.log('Final Groups (No Filter):', finalGroups); // DEBUG

                setProductAddonGroups(finalGroups);

                if (finalGroups.length > 0) {
                    // Expand ALL groups by default
                    setExpandedGroups(finalGroups.map((g: any) => g.id));
                }
            } else {
                console.log('No linked groups found for product ID:', product.id); // DEBUG
                // Helper debug query
                supabase.from('product_addon_groups').select('*').eq('product_id', product.id).then(res => {
                    console.log('Double Check Query Result:', res);
                });
            }
        } catch (error) {
            console.error('Error fetching product details:', error);
        } finally {
            setIsLoadingAddons(false);
        }
    };

    const getAddonQty = (groupId: number, addonId: number) => {
        const list = selectedAddons[groupId] || [];
        return list.filter((a: any) => a.id === addonId).length;
    };

    // ... increment/decrement ...

    const toggleGroup = (groupId: number) => {
        setExpandedGroups(prev => {
            if (prev.includes(groupId)) {
                return prev.filter(id => id !== groupId);
            } else {
                return [...prev, groupId];
            }
        });
    };

    // ... rest of logic ...

    const incrementAddon = (group: any, addon: any) => {
        const currentSelected = selectedAddons[group.id] || [];

        if (group.max_quantity > 0 && currentSelected.length >= group.max_quantity) {
            if (group.max_quantity === 1) {
                // Replace behavior
                setSelectedAddons({
                    ...selectedAddons,
                    [group.id]: [addon]
                });
                return;
            }
            alert(`Máximo de ${group.max_quantity} opções neste grupo.`);
            return;
        }

        setSelectedAddons({
            ...selectedAddons,
            [group.id]: [...currentSelected, addon]
        });
    };

    const decrementAddon = (group: any, addon: any) => {
        const currentSelected = selectedAddons[group.id] || [];
        const index = currentSelected.findIndex((a: any) => a.id === addon.id);

        if (index !== -1) {
            const newSelected = [...currentSelected];
            newSelected.splice(index, 1);
            setSelectedAddons({
                ...selectedAddons,
                [group.id]: newSelected
            });
        }
    };

    const calculateTotal = (product: Product | null, addons: { [key: number]: any[] }, qty: number) => {
        if (!product) return 0;
        let total = product.price;

        // Add addons price
        Object.values(addons).flat().forEach((addon: any) => {
            total += Number(addon.price);
        });

        return total * qty;
    };

    /* 
    const handleAdvanceToConfirmation = () => {
         // ... unused logic commented out or removed ...
    }; 
    */

    const confirmAddToCart = (goToCart: boolean) => {
        if (tempCartItem.product && tempCartItem.quantity) {
            const newItem: CartItem = {
                product: tempCartItem.product,
                quantity: tempCartItem.quantity,
                addons: tempCartItem.addons || {},
                observation: tempCartItem.observation || '',
                totalPrice: calculateTotal(tempCartItem.product, tempCartItem.addons || {}, tempCartItem.quantity)
            };

            setCart([...cart, newItem]);
            setShowConfirmation(false);

            if (goToCart) {
                setActiveTab('cart');
            }
        }
    };

    const handleCartAdvance = () => {
        if (!customerInfo) {
            setIsCheckoutFlow(true);
            // The render logic will pick this up and show Identity Screen
        } else {
            // Already identified - Show Checkout
            setShowCheckout(true);
        }
    };

    useEffect(() => {
        if (establishment?.id && deliveryMethod === 'DINE_IN') {
            fetchTables();
        }
    }, [establishment?.id, deliveryMethod]);

    const fetchTables = async () => {
        if (!establishment?.id) return;
        try {
            setIsLoadingTables(true);
            const { data, error } = await supabase
                .from('restaurant_tables')
                .select('*')
                .eq('establishment_id', establishment.id)
                .eq('status', 'active')
                .order('name', { ascending: true });

            if (error) throw error;
            setTables(data || []);
        } catch (error) {
            console.error('Error fetching tables:', error);
        } finally {
            setIsLoadingTables(false);
        }
    };

    const handleCreateOrder = async () => {
        if (!deliveryMethod) {
            alert('Por favor, selecione uma forma de entrega/consumo.');
            return;
        }

        if (deliveryMethod === 'DINE_IN' && !selectedTableId) {
            alert('Por favor, selecione uma mesa.');
            return;
        }

        if (deliveryMethod === 'DELIVERY' && (!address.street || !address.number || !selectedRegion)) {
            alert('Por favor, preencha todos os campos do endereço de entrega.');
            return;
        }

        if (!selectedPaymentMethod) {
            alert('Por favor, selecione uma forma de pagamento.');
            setIsSubmittingOrder(false);
            return;
        }

        if (!customerInfo || !establishment?.id) return;

        setIsSubmittingOrder(true);
        try {
            // Save Address to Customer if Delivery
            if (deliveryMethod === 'DELIVERY') {
                const cleanPhone = customerInfo!.phone.replace(/\D/g, '');
                const currentAddresses = savedAddresses;

                // Check if address already exists to avoid duplicates
                const exists = currentAddresses.some(a =>
                    a.street === address.street &&
                    a.number === address.number &&
                    a.neighborhood === address.neighborhood
                );

                if (!exists) {
                    const newAddresses = [...currentAddresses, address];
                    await supabase
                        .from('customers')
                        .update({ addresses: newAddresses })
                        .eq('phone', cleanPhone);
                }
            }

            const subtotal = cart.reduce((acc, i) => acc + i.totalPrice, 0);
            const deliveryFee = deliveryMethod === 'DELIVERY' ? (selectedRegion?.fee || 0) : 0;
            const total = subtotal + deliveryFee;


            const orderPayload = {
                establishment_id: establishment.id, // VITAL: Link order to establishment
                customer_name: customerInfo!.name,
                customer_phone: customerInfo!.phone.replace(/\D/g, ''),
                items: cart.map(i => ({
                    id: i.product.id,
                    name: i.product.name,
                    quantity: i.quantity,
                    price: i.product.price,
                    total: i.totalPrice,
                    addons: Object.values(i.addons || {}).flat(),
                    observation: i.observation
                })),
                total_amount: total,
                status: 'PENDING',
                type: deliveryMethod,
                payment_method: selectedPaymentMethod,
                change_for: selectedPaymentMethod === 'money' ? changeFor : null,
                delivery_address: deliveryMethod === 'DELIVERY' ? address : null, // JSONB or Text
                delivery_fee: deliveryMethod === 'DELIVERY' ? deliveryFee : 0,
                table_id: deliveryMethod === 'DINE_IN' ? selectedTableId : null,
                table_number: deliveryMethod === 'DINE_IN' ? selectedTableNumber : null,
                created_at: new Date().toISOString(),
            };

            const { data: insertedOrder, error } = await supabase.from('orders').insert([orderPayload]).select('*').single();

            if (error) throw error;


            // Success!
            setLastOrder(insertedOrder);
            setShowOrderSuccess(true);
            setCart([]);
            setShowCheckout(false);
            setDeliveryMethod(null);
            setAddress({
                cep: '', street: '', number: '', neighborhood: '',
                city: '', state: '', complement: '', reference: ''
            });

            // Optionally clear selected payment method
            setSelectedPaymentMethod('');
            // setDeliveryMethod('DELIVERY'); // This is now handled by clearing deliveryMethod to null

        } catch (error: any) {
            console.error('Error creating order:', error);
            alert(`Erro ao criar pedido: ${error.message || 'Tente novamente'}`);
        } finally {
            setIsSubmittingOrder(false);
        }
    };

    const fetchCep = async (cep: string) => {
        const cleanCep = cep.replace(/\D/g, '');
        if (cleanCep.length !== 8) return;

        setIsLoadingAddress(true);
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
            const data = await response.json();
            if (!data.erro) {
                setAddress(prev => ({
                    ...prev,
                    street: data.logradouro,
                    neighborhood: data.bairro,
                    city: data.localidade,
                    state: data.uf
                }));
            }
        } catch (error) {
            console.error('Error fetching CEP:', error);
        } finally {
            setIsLoadingAddress(false);
        }
    };

    const scrollToCategory = (catId: number) => {
        setActiveCategory(catId);
        const element = document.getElementById(`category-${catId}`);
        if (element) {
            const headerOffset = 180;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
        }
    };



    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0099FF]"></div>
            </div>
        );
    }




    // Customer Lookup Logic
    const handlePhoneChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const formatted = formatPhone(val);
        setTempPhone(formatted);

        // Check if phone is valid (14 or 15 chars: (XX) XXXX-XXXX or (XX) XXXXX-XXXX)
        const rawPhone = formatted.replace(/\D/g, '');
        if (rawPhone.length === 11) {
            checkCustomer(rawPhone);
        } else {
            setLookupDone(false);
            setIsNewCustomer(true);
        }
    };

    const checkCustomer = async (phone: string) => {
        if (isLoadingCustomer) return;
        setIsLoadingCustomer(true);
        try {
            const { data } = await supabase
                .from('customers')
                .select('*')
                .eq('phone', phone)
                .single();

            if (data) {
                // Found!
                setTempName(data.name);
                setIsNewCustomer(false);
                setLookupDone(true);
                // Optional: Auto-login if we trust the phone input
                // For now, just show name and allow "Advance" or auto-advance
                // auto-advance might be jarring, let's show "Welcome back"
            } else {
                // Not found
                setIsNewCustomer(true);
                setLookupDone(true);
                setTempName('');
            }
        } catch (error) {
            // Likely not found (row count 0) or error
            setIsNewCustomer(true);
            setLookupDone(true);
        } finally {
            setIsLoadingCustomer(false);
        }
    };

    const handleIdentifySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const rawPhone = tempPhone.replace(/\D/g, '');

        if (tempName.length < 3 || rawPhone.length < 10) {
            alert('Por favor, preencha seu nome e telefone corretamente.');
            return;
        }

        // Save/Update Customer in DB
        if (isNewCustomer) {
            const { error } = await supabase.from('customers').insert([{
                name: tempName,
                phone: rawPhone,
                visit_count: 1,
                last_order_at: new Date()
            }]);
            if (error) console.error('Error saving customer:', error);
        } else {
            // Update visit count/last order
            // Update last_order_at
            const { error } = await supabase.from('customers')
                .update({ last_order_at: new Date() })
                .eq('phone', rawPhone);

            if (error) console.error('Error updating customer:', error);
            // If RPC doesn't exist yet, we can simple update:
            /*
            const { error } = await supabase.from('customers')
               .update({ last_order_at: new Date() }) // simplification
               .eq('phone', rawPhone);
            */
        }

        const info = { name: tempName, phone: tempPhone };
        setCustomerInfo(info);
        localStorage.setItem('customerInfo', JSON.stringify(info));

        if (isCheckoutFlow) {
            // Instead of going straight to checkout, show data confirmation
            setShowDataConfirmation(true);
            // We stay on the current tab or move to cart?
            // If we move to cart, `renderIdentityScreen` condition in render might fail because customerInfo is now set.
            // But checking render logic:
            // if ((activeTab === 'orders' && !customerInfo) || (activeTab === 'cart' && isCheckoutFlow && !customerInfo))
            // Since customerInfo IS set now, it will fall through to normal render (e.g. Cart tab).

            // So we go to 'cart' Tab to show the modal overlay on top of Cart
            setActiveTab('cart');
        } else {
            setActiveTab('orders'); // Auto-navigate to orders/menu after identity
        }
    };

    // Extracted IdentityScreen Render Logic
    const renderIdentityScreen = () => (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Header */}
            <div className="p-4 flex items-center border-b border-gray-100">
                <button onClick={() => setActiveTab('home')} className="p-2 -ml-2 text-gray-600">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="flex-1 text-center font-medium text-gray-700">Identifique-se</h1>
                <div className="w-10"></div> {/* Spacer */}
            </div>

            {/* Form */}
            <div className="flex-1 p-6 flex flex-col items-center pt-10">
                <form onSubmit={handleIdentifySubmit} className="w-full max-w-sm space-y-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700">Seu número de WhatsApp é:</label>
                        <input
                            type="text"
                            value={tempPhone}
                            onChange={handlePhoneChange}
                            placeholder="(__) _____-____"
                            className="w-full px-4 py-3 rounded-lg border border-[#0099FF] focus:border-[#0099FF] focus:ring-1 focus:ring-[#0099FF] outline-none text-lg text-gray-700 placeholder-gray-300 transition-shadow"
                            disabled={isLoadingCustomer}
                        />
                        {isLoadingCustomer && (
                            <div className="flex items-center gap-2 text-sm text-[#0099FF] animate-pulse">
                                <div className="w-4 h-4 border-2 border-[#0099FF] border-t-transparent rounded-full animate-spin"></div>
                                Buscando cadastro...
                            </div>
                        )}
                    </div>

                    {(lookupDone || !isLoadingCustomer) && (
                        <div className={`space-y-2 transition-all duration-300 ${lookupDone ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-4'}`}>
                            <label className="block text-sm font-bold text-gray-700">
                                {isNewCustomer ? 'Seu nome e sobrenome:' : 'Confirme seu nome:'}
                            </label>
                            <input
                                type="text"
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                placeholder="Nome e sobrenome"
                                className={`w-full px-4 py-3 rounded-lg border focus:ring-1 outline-none text-lg transition-colors
                                ${isNewCustomer
                                        ? 'border-gray-200 focus:border-[#0099FF] focus:ring-[#0099FF] bg-gray-50'
                                        : 'border-green-200 bg-green-50 text-green-700 focus:border-green-500 focus:ring-green-500'}`}
                                readOnly={!isNewCustomer && lookupDone}
                            />
                            {!isNewCustomer && (
                                <p className="text-xs text-green-600">
                                    👋 Que bom te ver de volta!
                                    <button type="button" onClick={() => { setIsNewCustomer(true); setTempName(''); }} className="ml-2 underline text-gray-500 hover:text-gray-700">
                                        Não é você?
                                    </button>
                                </p>
                            )}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-[#0099FF] hover:bg-blue-600 text-white font-bold py-3.5 rounded-lg transition-colors mt-8 shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isLoadingCustomer || (isNewCustomer && tempName.length < 3)}
                    >
                        {isLoadingCustomer ? 'Verificando...' : 'Avançar'}
                    </button>

                    <p className="text-xs text-center text-gray-400 px-4">
                        Para realizar seu pedido vamos precisar de suas informações, este é um ambiente protegido.
                    </p>
                </form>
            </div>
        </div>
    );

    const renderMyOrdersScreen = () => (
        <div className="min-h-screen bg-gray-50 pb-20 pt-16 px-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Olá, {customerInfo?.name?.split(' ')[0]}!</h2>
                    <p className="text-xs text-gray-500">Histórico de pedidos</p>
                </div>
                <button
                    onClick={() => {
                        if (confirm('Deseja realmente sair?')) {
                            localStorage.removeItem('customerInfo');
                            setCustomerInfo(null);
                            setOrders([]);
                            // Clear all temp state
                            setTempName('');
                            setTempPhone('');
                            setIsNewCustomer(true);
                            setLookupDone(false);
                            // Redirect to home
                            setActiveTab('home');
                        }
                    }}
                    className="text-xs text-red-500 hover:text-red-700 font-medium px-3 py-1 border border-red-200 rounded-full"
                >
                    Sair
                </button>
            </div>

            {isLoadingOrders ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0099FF]"></div>
                    <p className="text-gray-500 text-sm">Carregando seus pedidos...</p>
                </div>
            ) : orders.length === 0 ? (
                <div className="text-center py-12 rounded-xl border border-dashed border-gray-300 bg-white">
                    <ClipboardList size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-600 font-medium">Você ainda não fez nenhum pedido.</p>
                    <button
                        onClick={() => setActiveTab('home')}
                        className="mt-4 text-[#0099FF] text-sm font-bold hover:underline"
                    >
                        Fazer meu primeiro pedido
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map(order => (
                        <div key={order.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase mb-1
                                        ${order.status === 'completed' ? 'bg-green-100 text-green-700' :
                                            order.status === 'canceled' ? 'bg-red-100 text-red-700' :
                                                'bg-blue-50 text-blue-600'}`}>
                                        {order.status === 'pending' ? 'Pendente' :
                                            order.status === 'preparing' ? 'Preparando' :
                                                order.status === 'delivering' ? 'Em rota' :
                                                    order.status === 'completed' ? 'Entregue' : order.status}
                                    </span>
                                    <p className="text-xs text-gray-400">
                                        {new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                <span className="font-bold text-gray-800">R$ {Number(order.total_amount).toFixed(2).replace('.', ',')}</span>
                            </div>

                            <div className="border-t border-gray-50 pt-3 mt-3">
                                <p className="text-xs text-gray-500 line-clamp-2">
                                    {(order.items || []).map((i: any) => {
                                        const addons = Array.isArray(i.addons) ? i.addons : Object.values(i.addons || {}).flat();
                                        const addonsText = addons.length > 0 ? ` (+ ${addons.map((a: any) => a.name).join(', ')})` : '';
                                        return `${i.quantity}x ${i.name}${addonsText}`;
                                    }).join(' | ')}
                                </p>
                            </div>

                            <div className="mt-4 flex gap-3">
                                <button className="flex-1 py-2 text-xs font-bold text-gray-600 border border-gray-200 rounded hover:bg-gray-50">
                                    Detalhes
                                </button>
                                <button className="flex-1 py-2 text-xs font-bold text-[#0099FF] bg-blue-50 rounded hover:bg-blue-100">
                                    Repetir Pedido
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    // Render Product Details Modal
    const renderProductModal = () => {
        if (!selectedProduct) return null;

        const currentTotal = (Number(selectedProduct.price) + Object.values(selectedAddons).flat().reduce((acc: number, addon: any) => acc + Number(addon.price), 0));

        return (
            <div className="fixed inset-0 z-[60] bg-white flex flex-col animate-in slide-in-from-bottom-5 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white sticky top-0 z-10">
                    <button onClick={() => setSelectedProduct(null)} className="p-2 -ml-2 text-gray-600 hover:bg-gray-50 rounded-full">
                        <ChevronLeft size={24} />
                    </button>
                    <span className="font-semibold text-gray-700">Detalhes do produto</span>
                    <div className="flex gap-2">
                        <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-full">
                            <Search size={20} />
                        </button>
                        <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-full">
                            <Share2 size={20} />
                        </button>
                    </div>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto pb-32">
                    {/* Product Info - Horizontal Layout */}
                    <div className="p-6">
                        <div className="flex gap-6 items-start">
                            {selectedProduct.image_url ? (
                                <div className="w-32 h-32 bg-gray-100 rounded-full flex-shrink-0 overflow-hidden border-2 border-white shadow-sm">
                                    <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className="w-32 h-32 bg-gray-100 rounded-full flex-shrink-0 flex items-center justify-center text-gray-300">
                                    <ShoppingBag size={40} />
                                </div>
                            )}

                            <div className="flex-1 pt-2">
                                <h2 className="text-xl font-bold text-gray-900 mb-1 leading-tight">{selectedProduct.name}</h2>
                                <p className="text-lg font-medium text-gray-500 mb-2">
                                    R$ {Number(selectedProduct.price).toFixed(2).replace('.', ',')}
                                </p>
                                <p className="text-sm text-gray-400 leading-relaxed line-clamp-3">
                                    {selectedProduct.description || "Delicioso e feito na hora para você."}
                                </p>

                                <div className="flex gap-4 mt-3">
                                    {selectedProduct.is_lactose_free && (
                                        <div className="flex items-center gap-1.5 text-gray-400" title="Zero lactose">
                                            <MilkOff size={16} strokeWidth={1.5} />
                                            <span className="text-xs font-medium">Zero lactose</span>
                                        </div>
                                    )}
                                    {selectedProduct.is_sugar_free && (
                                        <div className="flex items-center gap-1.5 text-gray-400" title="Sem açúcar">
                                            <CandyOff size={16} strokeWidth={1.5} />
                                            <span className="text-xs font-medium">Sem açúcar</span>
                                        </div>
                                    )}
                                    {selectedProduct.is_cold_drink && (
                                        <div className="flex items-center gap-1.5 text-gray-400" title="Bebida gelada">
                                            <Snowflake size={16} strokeWidth={1.5} />
                                            <span className="text-xs font-medium">Bebida gelada</span>
                                        </div>
                                    )}
                                    {selectedProduct.is_alcoholic && (
                                        <div className="flex items-center gap-1.5 text-gray-400" title="Bebida alcoólica">
                                            <Martini size={16} strokeWidth={1.5} />
                                            <span className="text-xs font-medium">Bebida alcoólica</span>
                                        </div>
                                    )}
                                    {selectedProduct.is_natural && (
                                        <div className="flex items-center gap-1.5 text-gray-400" title="Natural">
                                            <Leaf size={16} strokeWidth={1.5} />
                                            <span className="text-xs font-medium">Natural</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search Bar Inner */}
                    <div className="px-6 mb-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Pesquise pelo nome"
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-lg text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-gray-400"
                            />
                            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <X size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Addons Sections */}
                    <div className="space-y-1 bg-gray-50/50 pb-8 border-t border-gray-100">
                        {isLoadingAddons ? (
                            <div className="p-8 text-center text-gray-400">
                                <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                                Carregando opções...
                            </div>
                        ) : productAddonGroups.map(group => {
                            // const selectedCount = (selectedAddons[group.id] || []).length;

                            return (
                                <div key={group.id} className="bg-white border-b border-gray-100 last:border-b-0">
                                    <button
                                        onClick={() => toggleGroup(group.id)}
                                        className="w-full px-6 py-4 flex items-center justify-between bg-gray-200 hover:bg-gray-300 transition-colors"
                                    >
                                        <div className="text-left">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-gray-800 text-sm">{group.name}</h3>
                                                {group.description && (
                                                    <>
                                                        <span className="text-gray-300 mx-2">|</span>
                                                        <span className="text-gray-600 text-sm font-medium">{group.description}</span> {/* Assuming nickname acts as description or similar */}
                                                    </>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Escolha até {group.max_quantity} itens
                                            </p>
                                        </div>
                                        <ChevronDown size={20} className={`text-gray-400 transition-transform ${expandedGroups.includes(group.id) ? 'rotate-180' : ''}`} />
                                    </button>

                                    {expandedGroups.includes(group.id) && (
                                        <div className={`px-6 pb-6 pt-2 animate-in slide-in-from-top-2 duration-200 ${group.selection_mode === 'BOX' ? 'flex flex-wrap gap-3' : 'space-y-4'}`}>
                                            {group.addons.map((addon: any) => {
                                                const qty = getAddonQty(group.id, addon.id);
                                                const isSelected = qty > 0;
                                                const isQuantityMode = group.selection_mode === 'QUANTITY' && group.max_quantity !== 1;
                                                const isBoxMode = group.selection_mode === 'BOX';

                                                // Default to SELECTION if not Quantity or Box

                                                if (!isQuantityMode) {
                                                    const isRadio = group.max_quantity === 1;

                                                    const handleSelect = () => {
                                                        if (isRadio) {
                                                            // If already selected AND group is optional, deselect it
                                                            if (isSelected && !group.is_required) {
                                                                setSelectedAddons({
                                                                    ...selectedAddons,
                                                                    [group.id]: []
                                                                });
                                                            } else {
                                                                // Otherwise select (replace)
                                                                setSelectedAddons({
                                                                    ...selectedAddons,
                                                                    [group.id]: [addon]
                                                                });
                                                            }
                                                        } else {
                                                            if (isSelected) {
                                                                decrementAddon(group, addon);
                                                            } else {
                                                                incrementAddon(group, addon);
                                                            }
                                                        }
                                                    };

                                                    if (isBoxMode) {
                                                        return (
                                                            <div
                                                                key={addon.id}
                                                                onClick={handleSelect}
                                                                className={`
                                                                    border rounded-lg px-4 py-3 flex items-center gap-3 cursor-pointer transition-all select-none
                                                                    ${isSelected
                                                                        ? 'border-[#0099FF] bg-blue-50/50 text-[#0099FF] ring-1 ring-[#0099FF] ring-opacity-50'
                                                                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'}
                                                                `}
                                                            >
                                                                <div className={`
                                                                    w-5 h-5 rounded border flex items-center justify-center transition-colors
                                                                    ${isSelected ? 'bg-[#0099FF] border-[#0099FF]' : 'bg-white border-gray-300'}
                                                                `}>
                                                                    {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium text-sm leading-tight">{addon.name}</span>
                                                                    {Number(addon.price) > 0 && (
                                                                        <span className="text-xs font-bold mt-0.5">
                                                                            + R$ {Number(addon.price).toFixed(2).replace('.', ',')}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    }

                                                    // Standard Selection Mode (List)
                                                    return (
                                                        <div
                                                            key={addon.id}
                                                            onClick={handleSelect}
                                                            className={`flex items-center justify-between group py-3 px-3 -mx-3 rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-blue-50 border border-blue-100' : 'hover:bg-gray-50 border border-transparent'}`}
                                                        >
                                                            <div className="flex-1">
                                                                <span className={`block text-gray-800 text-sm ${isSelected ? 'font-bold' : 'font-medium'}`}>{addon.name}</span>
                                                                {Number(addon.price) > 0 && (
                                                                    <span className="text-gray-500 font-medium text-xs">
                                                                        + R$ {Number(addon.price).toFixed(2).replace('.', ',')}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div className="flex items-center justify-center pl-4">
                                                                {/* Custom Radio/Checkbox UI */}
                                                                <div className={`w-6 h-6 flex items-center justify-center border-2 transition-all ${isRadio ? 'rounded-full' : 'rounded-md'} ${isSelected ? 'border-[#0099FF] bg-[#0099FF]' : 'border-gray-300 bg-white'}`}>
                                                                    {isSelected && (
                                                                        isRadio ? (
                                                                            <div className="w-2.5 h-2.5 bg-white rounded-full" />
                                                                        ) : (
                                                                            <Check size={14} className="text-white" strokeWidth={3} />
                                                                        )
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                // QUANTITY MODE RENDERING (+/- Buttons)
                                                return (
                                                    <div key={addon.id} className="flex items-center justify-between group py-2 hover:bg-gray-50 rounded px-2 -mx-2 transition-colors">
                                                        <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => incrementAddon(group, addon)}>
                                                            {/* Placeholder Icon */}
                                                            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center opacity-50 grayscale">
                                                                <img src="https://cdn-icons-png.flaticon.com/512/3075/3075977.png" alt="" className="w-6 h-6" />
                                                            </div>
                                                            <div>
                                                                <span className={`block text-gray-700 text-sm ${isSelected ? 'font-bold' : 'font-medium'}`}>{addon.name}</span>
                                                                <span className="text-gray-500 font-medium text-xs">
                                                                    R$ {Number(addon.price).toFixed(2).replace('.', ',')}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3">
                                                            {qty > 0 ? (
                                                                <>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); decrementAddon(group, addon); }}
                                                                        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                                    >
                                                                        <Minus size={18} />
                                                                    </button>
                                                                    <span className="font-bold text-gray-800 w-4 text-center">{qty}</span>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); incrementAddon(group, addon); }}
                                                                        className="w-8 h-8 flex items-center justify-center text-[#0099FF] hover:bg-blue-50 rounded transition-colors"
                                                                    >
                                                                        <Plus size={18} />
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); incrementAddon(group, addon); }}
                                                                    className="w-8 h-8 flex items-center justify-center text-[#0099FF] hover:bg-blue-50 rounded transition-colors"
                                                                >
                                                                    <Plus size={20} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Observations */}
                    <div className="p-6 bg-gray-50 mt-4">
                        <label className="font-bold text-gray-700 text-sm mb-2 block">Observações</label>
                        <textarea
                            value={tempCartItem.observation || ''}
                            onChange={(e) => setTempCartItem({ ...tempCartItem, observation: e.target.value })}
                            placeholder="Ex.: Tirar cebola, ovo, etc."
                            className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:border-[#0099FF] focus:ring-1 focus:ring-[#0099FF] outline-none text-sm resize-none shadow-sm"
                            rows={4}
                        />
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] safe-area-bottom z-20">
                    <div className="max-w-md mx-auto">
                        {(() => {
                            // Check if all required groups have minimum selections
                            const requiredGroupsNotMet = productAddonGroups.filter(group => {
                                if (!group.is_required) return false;
                                const selectedCount = (selectedAddons[group.id] || []).length;
                                return selectedCount < group.min_quantity;
                            });

                            const canAddToCart = !isLoadingAddons && requiredGroupsNotMet.length === 0;
                            const missingGroupName = requiredGroupsNotMet[0]?.name;

                            // Debug logging
                            console.log('Validation Check:', {
                                isLoadingAddons,
                                productAddonGroups: productAddonGroups.length,
                                requiredGroupsNotMet: requiredGroupsNotMet.length,
                                canAddToCart,
                                selectedAddons
                            });

                            return (
                                <>
                                    <button
                                        onClick={() => {
                                            if (!establishment.isOpen) {
                                                setShowClosedError(true);
                                                return;
                                            }
                                            if (!canAddToCart) {
                                                console.log('Cannot add to cart - validation failed');
                                                return; // Validation prevents action
                                            }

                                            // CRITICAL: Update tempCartItem with selected addons before proceeding
                                            setTempCartItem({
                                                ...tempCartItem,
                                                addons: selectedAddons
                                            });

                                            // Close product modal and show confirmation
                                            setSelectedProduct(null);
                                            setShowConfirmation(true);
                                        }}
                                        disabled={!canAddToCart || !establishment.isOpen}
                                        className={`w-full ${!canAddToCart || !establishment.isOpen ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#0099FF] hover:bg-blue-600 active:scale-[0.98]'} text-white font-bold h-12 rounded-lg transition-all flex items-center justify-between px-6 shadow-lg ${canAddToCart ? 'shadow-blue-200' : ''}`}
                                    >
                                        <span>{isLoadingAddons ? 'Carregando...' : 'Adicionar'}</span>
                                        <span>R$ {currentTotal.toFixed(2).replace('.', ',')}</span>
                                    </button>
                                    {!canAddToCart && !isLoadingAddons && requiredGroupsNotMet.length > 0 && (
                                        <p className="text-xs text-red-500 text-center mt-2 font-medium">
                                            Selecione pelo menos {requiredGroupsNotMet[0]?.min_quantity} {requiredGroupsNotMet[0]?.min_quantity === 1 ? 'opção' : 'opções'} em "{missingGroupName}"
                                        </p>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                </div>

                {/* Closed Store Toast Error */}
                {
                    showClosedError && (
                        <div className="fixed bottom-24 left-4 right-4 z-50 animate-in slide-in-from-bottom-2 duration-300">
                            <div className="bg-red-600 text-white p-4 rounded-lg shadow-lg flex items-start gap-3">
                                <AlertCircle size={24} className="flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <h4 className="font-bold text-sm mb-1">Estamos fechados.</h4>
                                    <p className="text-xs opacity-90">Clique para conhecer nossos horários de funcionamento.</p>
                                </div>
                                <button onClick={() => setShowClosedError(false)} className="text-white/80 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                    )
                }
            </div >
        );
    };

    // Special Full Screen for Identity
    // Special Full Screen for Identity
    // Special Full Screen for Identity
    if ((activeTab === 'orders' && !customerInfo) || (activeTab === 'cart' && isCheckoutFlow && !customerInfo)) {
        return renderIdentityScreen();
    }

    const renderStoreProfile = () => {
        const weekDays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
        const fullAddress = `${establishment.street}, ${establishment.number} - ${establishment.neighborhood}, ${establishment.city} - ${establishment.state}`;

        let mapTitle = encodeURIComponent(fullAddress); // Used for marker text/search if needed
        let mapSrc = '';

        if (establishment.manual_coordinates && establishment.latitude && establishment.longitude) {
            mapSrc = `https://maps.google.com/maps?q=${establishment.latitude},${establishment.longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
        } else {
            mapSrc = `https://maps.google.com/maps?q=${mapTitle}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
        }

        return (
            <div className="min-h-screen bg-gray-50 pb-20 pt-16 px-4 animate-in slide-in-from-right-10 duration-300">
                {/* Header */}
                <div className="fixed top-0 left-0 right-0 bg-white z-40 p-4 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setActiveTab('home')} className="text-gray-500 hover:bg-gray-100 p-1 rounded-full">
                            <ChevronLeft size={24} />
                        </button>
                        <h2 className="font-bold text-gray-800">Sobre a loja</h2>
                    </div>
                </div>

                <div className="space-y-6 max-w-md mx-auto">
                    {/* Store Header Info */}
                    <div className="bg-gray-800 text-white p-4 rounded-xl shadow-sm mt-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden border-2 border-white/20">
                                {establishment.logo_url ? (
                                    <img src={establishment.logo_url} alt="Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="font-bold text-xl">{establishment.name?.charAt(0)}</span>
                                )}
                            </div>
                            <h2 className="font-bold text-lg">{establishment.name}</h2>
                            <button className="ml-auto p-2 bg-white/10 rounded-full hover:bg-white/20">
                                <Share2 size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Status Banner */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center space-y-2">
                        <div className="text-sm font-medium text-gray-600 flex justify-center gap-2">
                            <span className={establishment.isOpen ? 'text-green-600' : 'text-red-500'}>
                                {establishment.isOpen ? 'Aberto hoje' : 'Fechado agora'}
                            </span>
                            <span>•</span>
                            <span>Pedido mín. R$ {Number(establishment.minimum_order_fee_value || 0).toFixed(2).replace('.', ',')}</span>
                        </div>
                        {!establishment.isOpen && (
                            <div className="bg-red-50 text-red-600 text-xs font-bold py-2 rounded">
                                Loja fechada, {establishment.nextOpenText?.toLowerCase()}
                            </div>
                        )}
                    </div>

                    {/* Operating Hours */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
                            <h3 className="font-bold text-gray-700">Horário de atendimento</h3>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {weekDays.map((day, index) => {
                                const shifts = establishment.work_shifts?.[index.toString()] || [];
                                const isToday = new Date().getDay() === index;
                                return (
                                    <div key={day} className={`flex justify-between p-4 text-sm ${isToday ? 'bg-blue-50' : ''}`}>
                                        <span className={`font-medium ${isToday ? 'text-[#0099FF]' : 'text-gray-600'}`}>{day}:</span>
                                        <span className="text-gray-500">
                                            {shifts.length > 0
                                                ? shifts.map(s => `${s.start} às ${s.end}`).join(' / ')
                                                : 'Fechado'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
                            <h3 className="font-bold text-gray-700">Formas de pagamento</h3>
                        </div>
                        <div className="p-4 space-y-4">
                            {establishment.payment_methods_on_delivery?.cash && (
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                                        <Banknote size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800 text-sm">Dinheiro</p>
                                        <p className="text-xs text-gray-400">Pagamento na entrega</p>
                                    </div>
                                </div>
                            )}
                            {establishment.payment_methods_on_delivery?.card && (
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                        <CreditCard size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800 text-sm">Cartão de Crédito/Débito</p>
                                        <p className="text-xs text-gray-400">Pagamento na entrega (Maquininha)</p>
                                    </div>
                                </div>
                            )}
                            {/* Static Online Payment for visually matching screenshot style, if implemented later */}
                        </div>
                    </div>

                    {/* Address */}
                    {!establishment.hide_address && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
                                <h3 className="font-bold text-gray-700">Endereço</h3>
                            </div>
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-4">
                                    <p className="text-sm text-gray-600 leading-relaxed pr-4">
                                        {fullAddress}
                                    </p>
                                    <ChevronRight size={16} className="text-gray-400 flex-shrink-0 mt-1" />
                                </div>
                                {/* Map Embed */}
                                <div className="w-full h-40 bg-gray-200 rounded-lg overflow-hidden relative">
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        style={{ border: 0 }}
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                        src={mapSrc}
                                    ></iframe>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Filter Categories based on Search
    const filteredCategories = categories.map(cat => ({
        ...cat,
        products: cat.products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    })).filter(cat => cat.products.length > 0);

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Conditional Main View */}
            {activeTab === 'home' && (
                <>
                    {/* Header */}
                    <header className="fixed top-0 left-0 right-0 bg-[#0099FF] z-50 text-white shadow-md transition-all duration-300">
                        <div className="max-w-md mx-auto px-4 py-3">
                            {isSearchOpen ? (
                                <div className="flex items-center gap-2 animate-in fade-in duration-200">
                                    <div className="flex-1 relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            autoFocus
                                            placeholder="O que você quer comprar hoje?"
                                            className="w-full pl-10 pr-10 py-2 rounded text-sm text-gray-800 outline-none"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                        {searchQuery && (
                                            <button
                                                onClick={() => setSearchQuery('')}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                <X size={16} />
                                            </button>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
                                        className="text-white font-medium text-sm hover:bg-white/10 p-2 rounded"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 truncate pr-4">
                                        {establishment?.logo_url ? (
                                            <div className="w-10 h-10 rounded-full bg-white border-2 border-white/20 overflow-hidden flex-shrink-0">
                                                <img
                                                    src={establishment.logo_url}
                                                    alt="Logo"
                                                    className={`w-full h-full object-cover ${!establishment.isOpen ? 'grayscale' : ''}`}
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                                                <ShoppingBag size={20} />
                                            </div>
                                        )}
                                        <h1 className="font-bold text-xl truncate">{establishment?.name || 'Cardápio Digital'}</h1>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setIsSearchOpen(true)}
                                            className="p-2 hover:bg-white/10 rounded-full transition-colors order-last md:order-first"
                                        >
                                            <Search size={20} />
                                        </button>
                                        {/* <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                            <Share2 size={20} />
                                        </button> */}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sub-Header Info - White Bar */}
                        <div className="bg-white border-b border-gray-100 py-3 px-4">
                            <div className="max-w-md mx-auto flex items-center justify-between text-xs text-gray-500">
                                <div className="flex items-center gap-2">
                                    <span className={establishment.isOpen ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
                                        {establishment.isOpen ? 'Aberto agora' : (establishment.nextOpenText || 'Fechado')}
                                    </span>
                                    <span>•</span>
                                    <span>
                                        {establishment.minimum_order_fee_enabled && establishment.minimum_order_fee_value
                                            ? `Pedido mín. R$ ${Number(establishment.minimum_order_fee_value).toFixed(2).replace('.', ',')}`
                                            : 'Sem pedido mínimo'}
                                    </span>
                                </div>
                                <button onClick={() => setActiveTab('profile')} className="text-[#0099FF] font-medium hover:underline">Perfil da loja</button>
                            </div>
                        </div>

                        {/* Closed Banner */}
                        {!establishment.isOpen && (
                            <div className="bg-red-50 border-b border-red-100 py-2 px-4 animate-in slide-in-from-top-2">
                                <div className="max-w-md mx-auto text-center text-xs font-bold text-red-600">
                                    Loja fechada, {establishment.nextOpenText?.toLowerCase() || 'volte mais tarde'}
                                </div>
                            </div>
                        )}

                        {/* Categories Tab (Scrollable) - Only show if NO search */}
                        {!isSearchOpen && (
                            <div className="bg-white border-b border-gray-100 pb-2">
                                <div className="max-w-md mx-auto flex whitespace-nowrap px-4 overflow-x-auto custom-scrollbar">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            onClick={() => scrollToCategory(cat.id)}
                                            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeCategory === cat.id
                                                ? 'border-[#0099FF] text-[#0099FF]'
                                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </header>

                    {/* Main Content Spacer */}
                    <div className="pt-40 max-w-md mx-auto px-4 space-y-8 min-h-[calc(100vh-160px)]">
                        {/* Featured Section */}
                        {featuredProducts.length > 0 && (
                            <div className="mb-2">
                                <div className="flex items-center gap-2 mb-4">
                                    <h2 className="text-xl font-bold text-[#0099FF]">Destaques</h2>
                                    {featuredMode === 'most_sold' ? (
                                        <span className="bg-[#0099FF] text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Mais Pedidos</span>
                                    ) : (
                                        <span className="bg-red-500 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Promoções</span>
                                    )}
                                </div>

                                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x -mx-4 px-4">
                                    {featuredProducts.map(product => (
                                        <div
                                            key={product.id}
                                            onClick={() => handleProductClick(product)}
                                            className="snap-start flex-shrink-0 w-44 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col cursor-pointer active:scale-95 transition-transform"
                                        >
                                            <div className="h-32 bg-gray-100 relative">
                                                {product.image_url ? (
                                                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                        <ShoppingBag size={24} />
                                                    </div>
                                                )}
                                                {/* Discount Badge */}
                                                {product.original_price && product.original_price > product.price && (
                                                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-sm">
                                                        -{Math.round(((product.original_price - product.price) / product.original_price) * 100)}%
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-3 flex flex-col flex-1">
                                                <h3 className="text-sm font-bold text-gray-800 line-clamp-2 leading-tight mb-1">{product.name}</h3>
                                                <div className="mt-auto">
                                                    {product.original_price && product.original_price > product.price && (
                                                        <div className="text-xs text-gray-400 line-through">R$ {product.original_price.toFixed(2).replace('.', ',')}</div>
                                                    )}
                                                    <div className="font-bold text-[#0099FF]">
                                                        {product.price === 0 && (product as any).addon_groups?.[0]?.addons?.[0] && (
                                                            <span className="text-[10px] block font-medium text-gray-400 leading-none mb-0.5">A partir de</span>
                                                        )}
                                                        R$ {(product.price === 0 && (product as any).addon_groups?.[0]?.addons?.[0])
                                                            ? Number((product as any).addon_groups[0].addons[0].price).toFixed(2).replace('.', ',')
                                                            : Number(product.price).toFixed(2).replace('.', ',')
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {filteredCategories.length === 0 && searchQuery ? (
                            <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-300">
                                <div className="bg-blue-50 p-6 rounded-full mb-4 relative">
                                    <Search size={48} className="text-[#0099FF]" strokeWidth={2.5} />
                                    <div className="absolute top-2 right-2 flex bg-white rounded-full p-1 shadow-sm">
                                        <div className="w-2 h-2 bg-gray-300 rounded-full mx-0.5"></div>
                                        <div className="w-2 h-2 bg-gray-300 rounded-full mx-0.5"></div>
                                    </div>
                                </div>
                                <h3 className="font-bold text-gray-800 text-lg mb-2">Não encontramos o item que procura</h3>
                                <p className="text-gray-500 text-center text-sm max-w-xs">
                                    Confira se digitou corretamente e tente novamente
                                </p>
                            </div>
                        ) : (
                            filteredCategories.map((cat) => (
                                <div id={`category-${cat.id}`} key={cat.id} className="scroll-mt-44">
                                    <h2 className="text-xl font-bold text-[#0099FF] mb-4 flex items-center gap-2">
                                        {cat.name}
                                        {/* <span className="text-xs bg-blue-50 text-[#0099FF] px-2 py-0.5 rounded uppercase">Promoção</span> */}
                                    </h2>

                                    <div className="space-y-4">
                                        {cat.products.map((product) => (
                                            <div
                                                key={product.id}
                                                onClick={() => handleProductClick(product)}
                                                className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 flex gap-4 hover:shadow-md transition-shadow cursor-pointer active:scale-[0.99] duration-100 min-h-[100px]"
                                            >
                                                {/* Text Content */}
                                                <div className="flex-1 flex flex-col justify-between">
                                                    <div>
                                                        <h3 className="font-medium text-gray-800 line-clamp-2 leading-tight mb-1">{product.name}</h3>
                                                        <p className="text-xs text-gray-500 line-clamp-2 mb-2">{product.description}</p>

                                                        {/* Classification Icons on Card */}
                                                        <div className="flex gap-2 mb-2">
                                                            {product.is_lactose_free && <MilkOff size={14} className="text-gray-400" strokeWidth={1.5} />}
                                                            {product.is_sugar_free && <CandyOff size={14} className="text-gray-400" strokeWidth={1.5} />}
                                                            {product.is_cold_drink && <Snowflake size={14} className="text-gray-400" strokeWidth={1.5} />}
                                                            {product.is_alcoholic && <Martini size={14} className="text-gray-400" strokeWidth={1.5} />}
                                                            {product.is_natural && <Leaf size={14} className="text-gray-400" strokeWidth={1.5} />}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col mt-auto">
                                                        {product.price === 0 && product.addon_groups?.[0]?.addons?.[0] && (
                                                            <p className="text-[10px] font-medium text-gray-400 leading-none mb-0.5">A partir de</p>
                                                        )}
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-bold text-gray-800">
                                                                R$ {(product.price === 0 && product.addon_groups?.[0]?.addons?.[0])
                                                                    ? Number(product.addon_groups[0].addons[0].price).toFixed(2).replace('.', ',')
                                                                    : Number(product.price).toFixed(2).replace('.', ',')
                                                                }
                                                            </p>
                                                            {product.original_price && product.original_price > product.price && (
                                                                <>
                                                                    <p className="text-xs text-gray-400 line-through">
                                                                        R$ {Number(product.original_price).toFixed(2).replace('.', ',')}
                                                                    </p>
                                                                    <div className="bg-gray-800 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                                                        {Math.round(((product.original_price - product.price) / product.original_price) * 100)}%
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Image - Always Render */}
                                                <div className="w-24 h-24 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden relative">
                                                    {product.image_url ? (
                                                        <img
                                                            src={product.image_url}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover"
                                                            loading="lazy"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full opacity-10 bg-[url('https://cdn-icons-png.flaticon.com/512/204/204278.png')] bg-repeat bg-[length:50px_50px]"></div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                        {categories.length === 0 && !isLoading && (
                            <div className="text-center py-20 text-gray-500">
                                <p>Nenhum produto disponível no momento :(</p>
                            </div>
                        )}
                    </div>
                </>
            )}

            {activeTab === 'orders' && renderMyOrdersScreen()}
            {activeTab === 'profile' && renderStoreProfile()}

            {
                activeTab === 'cart' && (
                    <div className="min-h-screen bg-gray-50 pb-28 pt-20 px-4">
                        {/* Cart Header */}
                        <div className="fixed top-0 left-0 right-0 bg-white z-40 p-4 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <button onClick={() => setActiveTab('home')} className="text-gray-500 hover:bg-gray-100 p-1 rounded-full">
                                    <ChevronLeft size={24} />
                                </button>
                                <h2 className="font-bold text-gray-800">Carrinho</h2>
                            </div>
                            {cart.length > 0 && (
                                <button onClick={() => { if (confirm('Limpar carrinho?')) setCart([]) }} className="text-red-500 text-sm font-medium flex items-center gap-1">
                                    <span className="opacity-80 hover:opacity-100">Limpar</span>
                                </button>
                            )}
                        </div>

                        {/* Empty State */}
                        {cart.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full pt-10 px-4">
                                <div className="mb-6">
                                    <ShoppingCart size={48} className="text-gray-400" />
                                </div>
                                <h2 className="text-lg font-bold text-gray-800 mb-1">Seu carrinho está vazio</h2>
                                <p className="text-sm text-gray-500 mb-8">Adicione produtos ao carrinho e faça o pedido</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {cart.map((item, index) => (
                                    <div key={index} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative">
                                        <div className="flex gap-4">
                                            {/* Image */}
                                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                                                {item.product.image_url ? (
                                                    <img src={item.product.image_url} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                        <ShoppingBag size={24} />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <h3 className="font-bold text-gray-800 text-sm">{item.quantity}x {item.product.name}</h3>
                                                    <span className="font-bold text-[#0099FF] text-sm">
                                                        R$ {item.totalPrice.toFixed(2).replace('.', ',')}
                                                    </span>
                                                </div>

                                                {/* Addons List */}
                                                {Object.values(item.addons).flat().length > 0 && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        + {Object.values(item.addons).flat().map((a: any) => a.name).join(', ')}
                                                    </p>
                                                )}

                                                {/* Obs */}
                                                {item.observation && (
                                                    <p className="text-[10px] text-gray-400 mt-1 italic">
                                                        "{item.observation}"
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-50">
                                            {/* Edit/Remove - For now just remove */}
                                            <button
                                                onClick={() => setCart(cart.filter((_, i) => i !== index))}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded bg-gray-50"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            <div className="flex items-center border border-gray-200 rounded px-2">
                                                <span className="text-xs font-bold text-gray-700">{item.quantity}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Add More */}
                                <button
                                    onClick={() => setActiveTab('home')}
                                    className="w-full py-4 text-[#0099FF] font-bold text-sm bg-white border border-blue-100 rounded-xl hover:bg-blue-50 transition-colors"
                                >
                                    Adicionar mais produtos
                                </button>
                            </div>
                        )}

                        {/* Footer Checkout or Empty State Action */}
                        <div className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] safe-area-bottom z-20">
                            {cart.length > 0 ? (
                                <div
                                    onClick={handleCartAdvance}
                                    className="max-w-md mx-auto flex justify-between items-center bg-[#0099FF] text-white p-4 rounded-xl shadow-lg shadow-blue-200 cursor-pointer hover:bg-blue-600 transition-colors"
                                >
                                    <span className="font-bold">Avançar</span>
                                    <span className="font-bold">
                                        R$ {cart.reduce((acc, item) => acc + item.totalPrice, 0).toFixed(2).replace('.', ',')}
                                    </span>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setActiveTab('home')}
                                    className="w-full max-w-md mx-auto bg-[#0099FF] text-white font-bold py-3.5 rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
                                >
                                    Ver cardápio
                                </button>
                            )}
                        </div>
                    </div>
                )
            }

            {/* Confirmation Modal - Success Addition */}
            {
                showConfirmation && tempCartItem.product && (
                    <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 relative">

                            {/* Close Button */}
                            <button
                                onClick={() => setShowConfirmation(false)}
                                className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 z-10"
                            >
                                <X size={20} />
                            </button>

                            <div className="p-6 pt-8 text-center">
                                {/* Illustration */}
                                <div className="mb-4 flex justify-center">
                                    <img
                                        src="https://cdn-icons-png.flaticon.com/512/7518/7518748.png"
                                        alt="Sucesso"
                                        className="w-32 h-32 object-contain animate-bounce-slow"
                                    />
                                </div>

                                <h3 className="text-xl font-bold text-gray-800 leading-tight mb-6">
                                    {tempCartItem.product.name} adicionado ao carrinho!
                                </h3>

                                {/* Quantity Control */}
                                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                                    <span className="font-bold text-gray-700">Quantidade</span>
                                    <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1 border border-gray-200">
                                        <button
                                            onClick={() => setTempCartItem({ ...tempCartItem, quantity: Math.max(1, (tempCartItem.quantity || 1) - 1) })}
                                            className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-red-500 disabled:opacity-50 transition-colors"
                                            disabled={tempCartItem.quantity === 1}
                                        >
                                            <Minus size={16} />
                                        </button>
                                        <span className="font-bold text-lg min-w-[20px] text-center text-gray-800">{tempCartItem.quantity}</span>
                                        <button
                                            onClick={() => setTempCartItem({ ...tempCartItem, quantity: (tempCartItem.quantity || 1) + 1 })}
                                            className="w-8 h-8 flex items-center justify-center bg-[#0099FF] rounded shadow-sm text-white hover:bg-blue-600 transition-colors"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Observations */}
                                <div className="text-left space-y-2 mb-6">
                                    <label className="font-bold text-gray-700 text-sm">Observações</label>
                                    <textarea
                                        value={tempCartItem.observation || ''}
                                        onChange={(e) => setTempCartItem({ ...tempCartItem, observation: e.target.value })}
                                        placeholder="Ex: Tirar cebola, ovo, etc."
                                        className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:border-[#0099FF] focus:ring-1 focus:ring-[#0099FF] outline-none text-sm resize-none transition-shadow"
                                        rows={3}
                                    />
                                </div>

                                {/* Actions */}
                                <div className="space-y-3">
                                    <button
                                        onClick={() => confirmAddToCart(false)}
                                        className="w-full py-3.5 border-2 border-[#0099FF] text-[#0099FF] font-bold rounded-xl hover:bg-blue-50 transition-colors"
                                    >
                                        Continuar comprando
                                    </button>
                                    <button
                                        onClick={() => confirmAddToCart(true)}
                                        className="w-full py-3.5 bg-[#0099FF] text-white font-bold rounded-xl hover:bg-blue-600 shadow-lg shadow-blue-200 transition-colors"
                                    >
                                        Avançar para o carrinho
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Bottom Nav (Hide on Cart?) - Keep for now */}

            {/* Bottom Nav */}
            {
                activeTab !== 'cart' && (
                    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
                        <div className="max-w-md mx-auto flex justify-around items-center h-16">
                            <button
                                onClick={() => setActiveTab('home')}
                                className={`flex flex-col items-center justify-center w-full h-full ${activeTab === 'home' ? 'text-[#0099FF]' : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                <Home size={22} className="mb-0.5" />
                                <span className="text-[10px] font-medium">Início</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('orders')}
                                className={`flex flex-col items-center justify-center w-full h-full ${activeTab === 'orders' ? 'text-[#0099FF]' : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                <ClipboardList size={22} className="mb-0.5" />
                                <span className="text-[10px] font-medium">Pedidos</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('cart')}
                                className={`flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-gray-600 relative`}
                            >
                                <div className="relative">
                                    <ShoppingCart size={22} className="mb-0.5" />
                                    {/* <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] font-bold px-1 rounded-full min-w-[14px] h-[14px] flex items-center justify-center">0</span> */}
                                </div>
                                <span className="text-[10px] font-medium">Carrinho</span>
                            </button>
                        </div>
                    </nav>
                )
            }

            {/* Product Modal Portal/Overlay */}
            {renderProductModal()}

            {/* Checkout Modal (Simple Version for Confirmation) */}
            {
                showCheckout && (
                    <div className="fixed inset-0 z-[80] bg-white flex flex-col animate-in slide-in-from-bottom-10 duration-300">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white">
                            <button onClick={() => setShowCheckout(false)} className="p-2 -ml-2 text-gray-600 hover:bg-gray-50 rounded-full">
                                <ChevronLeft size={24} />
                            </button>
                            <span className="font-semibold text-gray-700">Finalizar Pedido</span>
                            <div className="w-10"></div>
                        </div>

                        {/* Main Content Scrollable */}
                        <div className="flex-1 overflow-y-auto bg-[#F9F9F9] p-4 space-y-4">

                            {/* 1. Header Info */}
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                <p className="text-gray-500 text-xs mb-1">Este pedido será entregue a:</p>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-sm">{customerInfo?.name}</h3>
                                        <p className="text-xs text-gray-500">{formatPhone(customerInfo?.phone || '')}</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            // Trigger logout logic reused
                                            localStorage.removeItem('customerInfo');
                                            setCustomerInfo(null);
                                            // ... clear other states
                                            setShowCheckout(false);
                                            setActiveTab('orders'); // or home?
                                            // Ideally call the logout function, but duplicating for now for speed
                                            setTempName('');
                                            setTempPhone('');
                                            setIsNewCustomer(true);
                                        }}
                                        className="text-[#0099FF] text-xs font-bold border border-[#0099FF] px-3 py-1.5 rounded hover:bg-blue-50 transition-colors"
                                    >
                                        Trocar
                                    </button>
                                </div>
                            </div>

                            {/* 2. Choose Delivery Method */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="bg-[#0099FF] p-3">
                                    <h3 className="text-white font-bold text-sm">Escolha como receber o pedido</h3>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {savedAddresses.map((addr, idx) => (
                                        <label key={`saved-${idx}`} className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-700">{addr.street}, {addr.number}</span>
                                                <span className="text-xs text-gray-500">{addr.neighborhood} - {addr.city}</span>
                                            </div>
                                            <input
                                                type="radio"
                                                name="deliveryMethod"
                                                value={`SAVED_${idx}`}
                                                checked={JSON.stringify(address) === JSON.stringify(addr) && deliveryMethod === 'DELIVERY'}
                                                onChange={() => {
                                                    setAddress(addr);
                                                    setDeliveryMethod('DELIVERY');
                                                }}
                                                className="w-5 h-5 text-[#0099FF] border-gray-300 focus:ring-[#0099FF]"
                                            />
                                        </label>
                                    ))}

                                    {[
                                        { id: 'DELIVERY', label: 'Cadastrar endereço' },
                                        { id: 'PICKUP', label: 'Buscar o pedido' },
                                        { id: 'DINE_IN', label: 'Consumir no local' }
                                    ].map((method) => (
                                        <label key={method.id} className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                                            <span className="text-sm font-medium text-gray-700">{method.label}</span>
                                            <input
                                                type="radio"
                                                name="deliveryMethod"
                                                value={method.id}
                                                checked={deliveryMethod === method.id && (method.id !== 'DELIVERY' || !savedAddresses.some(a => JSON.stringify(a) === JSON.stringify(address)))}
                                                onChange={() => {
                                                    if (method.id === 'DELIVERY') {
                                                        // Clear address if clicking "New Address"
                                                        setAddress({
                                                            cep: '', street: '', number: '', neighborhood: '',
                                                            city: '', state: '', complement: '', reference: ''
                                                        });
                                                    }
                                                    setDeliveryMethod(method.id as any);
                                                }}
                                                className="w-5 h-5 text-[#0099FF] border-gray-300 focus:ring-[#0099FF]"
                                            />
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* 2.5 Dynamic Content based on Selection */}
                            {deliveryMethod === 'DELIVERY' && (
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 animate-in slide-in-from-top-2">
                                    <h4 className="font-bold text-gray-800 text-sm mb-3">Endereço de Entrega</h4>
                                    <div className="space-y-3">

                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="CEP"
                                                className="w-1/3 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#0099FF]"
                                                value={address.cep}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                                                    setAddress({ ...address, cep: val });
                                                    if (val.length === 8) fetchCep(val);
                                                }}
                                            />
                                            <div className="flex-1 relative">
                                                <input
                                                    type="text"
                                                    placeholder="Rua / Avenida"
                                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#0099FF]"
                                                    value={address.street}
                                                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                                                />
                                                {isLoadingAddress && <div className="absolute right-3 top-3 animate-spin w-4 h-4 border-2 border-[#0099FF] border-t-transparent rounded-full"></div>}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Número"
                                                className="w-1/3 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#0099FF]"
                                                value={address.number}
                                                onChange={(e) => setAddress({ ...address, number: e.target.value })}
                                            />
                                            <div className="relative flex-1">
                                                {isLoadingRegions ? (
                                                    <div className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-400 flex items-center justify-between">
                                                        <span>Carregando...</span>
                                                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <select
                                                            value={selectedRegion?.id || ''}
                                                            onChange={(e) => {
                                                                const region = regions.find(r => r.id === Number(e.target.value));
                                                                setSelectedRegion(region || null);
                                                                if (region) {
                                                                    setAddress(prev => ({ ...prev, neighborhood: region.name }));
                                                                }
                                                            }}
                                                            className="w-full p-3 pr-8 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#0099FF] appearance-none cursor-pointer"
                                                            style={{ color: selectedRegion ? 'inherit' : '#9CA3AF' }}
                                                        >
                                                            <option value="" disabled>Bairro</option>
                                                            {regions.map(region => (
                                                                <option key={region.id} value={region.id} className="text-gray-900">
                                                                    {region.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Cidade"
                                                className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#0099FF]"
                                                value={address.city}
                                                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                                            />
                                            <input
                                                type="text"
                                                placeholder="UF"
                                                className="w-16 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#0099FF]"
                                                value={address.state}
                                                onChange={(e) => setAddress({ ...address, state: e.target.value })}
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Complemento (Opcional)"
                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#0099FF]"
                                            value={address.complement}
                                            onChange={(e) => setAddress({ ...address, complement: e.target.value })}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Ponto de Referência (Opcional)"
                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#0099FF]"
                                            value={address.reference}
                                            onChange={(e) => setAddress({ ...address, reference: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            {deliveryMethod === 'PICKUP' && (
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 animate-in slide-in-from-top-2">
                                    <h4 className="font-bold text-gray-800 text-sm mb-2">Retirar em:</h4>
                                    <div className="flex items-start gap-3">
                                        <div className="bg-blue-50 p-2 rounded-full text-[#0099FF]">
                                            <MapPin size={20} />
                                        </div>
                                        <div>
                                            {/* Ideally these should come from establishment context */}
                                            <p className="text-sm font-bold text-gray-800">{establishment.street || 'Endereço não configurado'}, {establishment.number || 'S/N'}</p>
                                            <p className="text-xs text-gray-500">{establishment.neighborhood || ''} - {establishment.city || ''}/{establishment.state || ''}</p>
                                            {establishment.complement && <p className="text-xs text-gray-500 mt-1">Complemento: {establishment.complement}</p>}
                                            {establishment.reference && <p className="text-xs text-gray-500">Ref: {establishment.reference}</p>}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {deliveryMethod === 'DINE_IN' && (
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 animate-in slide-in-from-top-2">
                                    <h4 className="font-bold text-gray-800 text-sm mb-3">Selecione sua mesa:</h4>
                                    {isLoadingTables ? (
                                        <div className="flex items-center justify-center py-8">
                                            <div className="w-8 h-8 border-4 border-[#0099FF] border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    ) : tables.length === 0 ? (
                                        <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                                            Nenhuma mesa disponível no momento.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-4 gap-3">
                                            {tables.map((table) => (
                                                <button
                                                    key={table.id}
                                                    onClick={() => {
                                                        setSelectedTableId(table.id);
                                                        setSelectedTableNumber(table.name);
                                                    }}
                                                    className={`aspect-square flex flex-col items-center justify-center rounded-xl transition-all border-2 ${selectedTableId === table.id
                                                        ? 'bg-[#0099FF] text-white border-[#0099FF] shadow-md scale-105'
                                                        : 'bg-white text-gray-600 border-gray-100 hover:border-blue-200'
                                                        }`}
                                                >
                                                    <span className="text-[10px] uppercase font-bold opacity-80">Mesa</span>
                                                    <span className="text-lg font-black leading-tight">
                                                        {table.name.replace(/\D/g, '') || table.name}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 3. Payment Method */}
                            <div className={`bg-gray-100 p-4 rounded-xl transition-all ${deliveryMethod ? 'bg-white shadow-sm border border-gray-100' : 'opacity-70 pointer-events-none'}`}>
                                <h3 className="font-bold text-gray-500 text-sm mb-3">Escolha a forma de pagamento</h3>
                                {deliveryMethod ? (
                                    <div className="space-y-3">
                                        {(establishment.payment_methods_on_delivery?.cash !== false) && (
                                            <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedPaymentMethod === 'money' ? 'border-[#0099FF] bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                                                <input
                                                    type="radio"
                                                    name="payment"
                                                    value="money"
                                                    checked={selectedPaymentMethod === 'money'}
                                                    onChange={() => {
                                                        setSelectedPaymentMethod('money');
                                                        setShowChangeModal(true);
                                                    }}
                                                    className="text-[#0099FF] focus:ring-[#0099FF]"
                                                />
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-green-100 text-green-600 p-1.5 rounded-md">
                                                        <Banknote size={18} />
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-700">Dinheiro / Pix</span>
                                                </div>
                                            </label>
                                        )}

                                        {(establishment.payment_methods_on_delivery?.card !== false) && (
                                            <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedPaymentMethod === 'card' ? 'border-[#0099FF] bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                                                <input
                                                    type="radio"
                                                    name="payment"
                                                    value="card"
                                                    checked={selectedPaymentMethod === 'card'}
                                                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                                                    className="text-[#0099FF] focus:ring-[#0099FF]"
                                                />
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-orange-100 text-orange-600 p-1.5 rounded-md">
                                                        <CreditCard size={18} />
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-700">Cartão (Maquininha)</span>
                                                </div>
                                            </label>
                                        )}

                                        {(establishment.payment_methods_on_delivery?.pix === true) && (
                                            <div className="space-y-3">
                                                <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedPaymentMethod === 'pix' ? 'border-[#0099FF] bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                                                    <input
                                                        type="radio"
                                                        name="payment"
                                                        value="pix"
                                                        checked={selectedPaymentMethod === 'pix'}
                                                        onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                                                        className="text-[#0099FF] focus:ring-[#0099FF]"
                                                    />
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-purple-100 text-purple-600 p-1.5 rounded-md">
                                                            <QrCode size={18} />
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-700">PIX (Pagamento na entrega/retirada)</span>
                                                    </div>
                                                </label>

                                                {/* PIX Key Display */}
                                                {selectedPaymentMethod === 'pix' && establishment.payment_methods_on_delivery.pix_key && (
                                                    <div className="bg-white p-3 rounded-lg border border-blue-100 animate-in slide-in-from-top-2 ml-7">
                                                        <p className="text-xs text-gray-500 mb-1">Chave PIX da loja:</p>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 bg-gray-50 p-2 rounded border border-gray-200 font-mono text-sm text-gray-700 break-all">
                                                                {establishment.payment_methods_on_delivery.pix_key}
                                                            </div>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault(); // Prevent label click
                                                                    navigator.clipboard.writeText(establishment.payment_methods_on_delivery?.pix_key || '');
                                                                    // Could add toast here
                                                                    alert('Chave PIX copiada!');
                                                                }}
                                                                className="p-2 text-[#0099FF] hover:bg-blue-50 rounded bg-white border border-blue-100 transition-colors"
                                                                title="Copiar Chave"
                                                            >
                                                                <Copy size={18} />
                                                            </button>
                                                        </div>
                                                        <p className="text-[10px] text-gray-400 mt-1">
                                                            Faça o pagamento e apresente o comprovante na entrega.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400 text-center py-2">Selecione a forma de entrega para continuar</p>
                                )}
                            </div>

                            {/* 4. Observations */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <button className="w-full flex justify-between items-center p-4 bg-white" onClick={() => {/* Toggle obs? For now static open/close or just label */ }}>
                                    <span className="font-bold text-gray-800 text-sm">Observações</span>
                                    <ChevronDown size={16} className="text-gray-400" />
                                </button>
                                {/* Collapsible content if we want */}
                            </div>

                            {/* 5. Summary */}
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-2">
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>Subtotal</span>
                                    <span>R$ {cart.reduce((acc, i) => acc + i.totalPrice, 0).toFixed(2).replace('.', ',')}</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>Taxa de entrega</span>
                                    <span className={deliveryMethod === 'DELIVERY' ? 'text-gray-800' : 'text-green-500 font-bold'}>
                                        {deliveryMethod === 'DELIVERY'
                                            ? (selectedRegion ? `R$ ${selectedRegion.fee.toFixed(2).replace('.', ',')}` : 'R$ 0,00')
                                            : 'Grátis'}
                                    </span>
                                </div>
                                <div className="flex justify-between font-bold text-lg text-gray-800 pt-2 border-t border-gray-100">
                                    <span>Total</span>
                                    <span>R$ {(cart.reduce((acc, i) => acc + i.totalPrice, 0) + (deliveryMethod === 'DELIVERY' && selectedRegion ? selectedRegion.fee : 0)).toFixed(2).replace('.', ',')}</span>
                                </div>
                            </div>

                        </div>

                        <div className="p-4 border-t border-gray-100 pb-8 safe-area-bottom">
                            <button
                                onClick={handleCreateOrder}
                                disabled={isSubmittingOrder}
                                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSubmittingOrder ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Enviando...</span>
                                    </>
                                ) : (
                                    <>
                                        {/* <Check size={20} /> */}
                                        <span>Escolha como receber o pedido</span>
                                        {/* Ideally dynamic: "Continuar" or "Confirmar Pedido" based on scroll state? 
                                    Actually the user requested specific buttons. 
                                    The "Confirmar Pedido" should be the final action.
                                    Let's keep "Confirmar Pedido" but disabled if invalid. */}
                                        <span className="flex-1">Confirmar Pedido</span>
                                        <span className="text-xs opacity-80 font-normal">R$ {cart.reduce((acc, i) => acc + i.totalPrice, 0).toFixed(2).replace('.', ',')}</span>
                                    </>
                                )}
                            </button>
                        </div>

                    </div>
                )
            }

            {/* Order Success Modal */}
            {
                showOrderSuccess && (
                    <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
                        <div className="w-full max-w-md flex flex-col items-center text-center space-y-6">

                            {/* Success Icon */}
                            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-200 mb-2 animate-in zoom-in duration-300 delay-100">
                                <Check size={40} className="text-white" strokeWidth={3} />
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-gray-800">Pedido realizado!</h2>
                                <div className="flex items-center justify-center gap-2 text-red-500 font-bold">
                                    <Heart size={20} fill="currentColor" />
                                    <span>Muito obrigado!</span>
                                </div>
                            </div>

                            {/* Banner - Using a placeholder or potentially one of the uploaded images if accessible, strict placeholder for now per instructions */}
                            <div className="w-full h-32 md:h-40 bg-blue-600 rounded-xl overflow-hidden shadow-md my-4 relative group cursor-pointer">
                                <img
                                    src="https://images.unsplash.com/photo-1626082927389-e60913375b4e?w=800&auto=format&fit=crop&q=60"
                                    alt="Promo Banner"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-transparent flex items-center p-6">
                                    <div className="text-left text-white">
                                        <p className="font-bold text-lg leading-tight">30% MENOS CALORIAS</p>
                                        <p className="text-sm opacity-90">É PURO EQUILÍBRIO</p>
                                        <button className="mt-2 bg-white text-blue-900 text-xs font-bold px-3 py-1 rounded-full uppercase">Comprar Agora</button>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="w-full space-y-3 pt-4">
                                <button
                                    onClick={() => {
                                        // Open WhatsApp with order details or tracking link
                                        const message = `Olá, acabei de fazer o pedido #${lastOrder?.id || 'NOVO'}. Gostaria de acompanhar.`;
                                        window.open(`https://wa.me/55${establishment.contacts?.[0]?.replace(/\D/g, '') || ''}?text=${encodeURIComponent(message)}`, '_blank');
                                    }}
                                    className="w-full bg-[#40C351] hover:bg-[#36a845] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-100 transition-all flex items-center justify-center gap-2"
                                >
                                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                                    Acompanhar pedido
                                </button>

                                <button
                                    onClick={() => {
                                        setShowOrderSuccess(false);
                                        setActiveTab('orders'); // Go to orders tab
                                    }}
                                    className="text-[#0099FF] font-bold text-sm py-2 hover:underline"
                                >
                                    Ver detalhes
                                </button>
                            </div>

                        </div>
                    </div>
                )
            }

            {
                showChangeModal && (
                    <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 relative p-6 space-y-4">
                            <div className="space-y-1">
                                <h3 className="font-bold text-gray-800 text-lg">Precisa de troco?</h3>
                                <p className="text-sm text-gray-500">
                                    Seu pedido fechou em <span className="font-bold text-gray-800">R$ {cart.reduce((acc, i) => acc + i.totalPrice, 0).toFixed(2).replace('.', ',')}</span>
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Troco para (opcional)</label>
                                <input
                                    type="text"
                                    value={changeFor}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        const formatted = (Number(val) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                                        setChangeFor(formatted);
                                    }}
                                    placeholder="R$ 0,00"
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-lg outline-none focus:border-[#0099FF] focus:ring-1 focus:ring-[#0099FF] transition-all"
                                />
                            </div>

                            <div className="space-y-3 pt-2">
                                <button
                                    onClick={() => {
                                        setChangeFor('');
                                        setShowChangeModal(false);
                                    }}
                                    className="w-full py-3 border-2 border-[#0099FF] text-[#0099FF] font-bold rounded-xl hover:bg-blue-50 transition-colors"
                                >
                                    Não preciso de troco
                                </button>
                                <button
                                    onClick={() => setShowChangeModal(false)}
                                    disabled={!changeFor || changeFor === 'R$ 0,00'}
                                    className="w-full py-3 bg-[#e5e7eb] text-gray-500 font-bold rounded-xl hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors data-[active=true]:bg-[#0099FF] data-[active=true]:text-white data-[active=true]:shadow-lg"
                                    data-active={!!changeFor && changeFor !== 'R$ 0,00'}
                                >
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Data Confirmation Modal */}
            {
                showDataConfirmation && (
                    <div className="fixed inset-0 z-[75] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 relative">
                            {/* Header */}
                            <div className="p-4 flex items-center justify-center border-b border-gray-100 relative">
                                <h3 className="font-bold text-gray-800">Confirme seus dados</h3>
                                <button
                                    onClick={() => setShowDataConfirmation(false)}
                                    className="absolute top-1/2 -translate-y-1/2 right-4 text-gray-400 hover:text-gray-600"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Name Block */}
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-blue-500 shrink-0">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium mb-0.5">Eu sou</p>
                                        <p className="font-bold text-gray-800 text-lg leading-tight">{customerInfo?.name}</p>
                                    </div>
                                </div>

                                {/* Phone Block */}
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-blue-500 shrink-0">
                                        <Smartphone size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium mb-0.5">Meu telefone é</p>
                                        <p className="font-bold text-gray-800 text-lg leading-tight">{formatPhone(customerInfo?.phone || '')}</p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="space-y-3 pt-4">
                                    <button
                                        onClick={() => {
                                            // Edit: Log out (so Identity screen shows again) and pre-fill data.
                                            setShowDataConfirmation(false);
                                            setCustomerInfo(null);
                                            localStorage.removeItem('customerInfo');
                                            setIsCheckoutFlow(true); // Ensure we stay in checkout flow
                                            // Active tab should remain 'cart', allowing renderIdentityScreen to take over next render
                                        }}
                                        className="w-full py-3.5 border border-[#0099FF] text-[#0099FF] font-bold rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                                    >
                                        {/* <Pen size={16} /> */}
                                        Editar informações
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowDataConfirmation(false);
                                            setIsCheckoutFlow(false);
                                            setShowCheckout(true);
                                        }}
                                        className="w-full py-3.5 bg-[#0099FF] text-white font-bold rounded-xl hover:bg-blue-600 shadow-lg shadow-blue-200 transition-colors"
                                    >
                                        Confirmar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default PublicMenu;
