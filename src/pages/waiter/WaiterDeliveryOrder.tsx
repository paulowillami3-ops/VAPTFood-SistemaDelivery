import { useEstablishment } from '../../contexts/EstablishmentContext';

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Search, Utensils, ChevronDown, ChevronUp, ShoppingBag, Bike, CreditCard, X, Check } from 'lucide-react';
import { formatCurrency, formatPhone, formatZipCode } from '../../utils/format';

// Types
interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    image_url: string;
    category_id: number;
    establishment_id: number;
    is_available: boolean;
}

interface Category {
    id: number;
    name: string;
    display_order: number;
}

interface AddonGroup {
    id: number;
    name: string;
    min_quantity: number;
    max_quantity: number;
    selection_mode: 'SELECTION' | 'BOX';
    is_required: boolean;
}

interface Addon {
    id: number;
    name: string;
    price: number;
    group_id: number;
    is_available: boolean;
}

interface CartItem {
    cartId: string;
    id: number;
    name: string;
    price: number;
    quantity: number;
    addons: any[];
    observation: string;
}

type ViewStep = 'MENU' | 'IDENTIFY' | 'DETAILS' | 'SUCCESS';

const WaiterDeliveryOrder = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { establishment } = useEstablishment(); // Use Context

    // --- Global State ---
    const [step, setStep] = useState<ViewStep>('MENU');
    const [loading, setLoading] = useState(true);
    // const [establishment, setEstablishment] = useState<any>(null); // Removed local state

    // --- Delivery Details State ---
    const [deliveryMethod, setDeliveryMethod] = useState<'DELIVERY' | 'PICKUP'>(
        (location.state as any)?.initialMode || 'DELIVERY'
    );

    // --- Menu State ---
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);

    // --- Product Modal State ---
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [addonGroups, setAddonGroups] = useState<AddonGroup[]>([]);
    const [addons, setAddons] = useState<Addon[]>([]);
    const [currentAddons, setCurrentAddons] = useState<Record<number, number>>({});
    const [observation, setObservation] = useState('');
    const [collapsedGroups, setCollapsedGroups] = useState<Record<number, boolean>>({});

    // --- Identify State ---
    const [phone, setPhone] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [loadingCustomer, setLoadingCustomer] = useState(false);
    const [foundCustomer, setFoundCustomer] = useState<any>(null);
    const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
    const [isNewCustomer, setIsNewCustomer] = useState(false);

    // --- Address State ---
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [selectedAddressIndex, setSelectedAddressIndex] = useState<number | null>(null);
    const [address, setAddress] = useState({
        cep: '',
        street: '',
        number: '',
        neighborhood: '',
        city: '',
        state: '',
        complement: ''
    });

    // --- Payment & Checkout State ---
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'money' | 'card' | null>(null);
    const [showChangeModal, setShowChangeModal] = useState(false);
    const [changeFor, setChangeFor] = useState('');
    const [orderObservation, setOrderObservation] = useState('');

    useEffect(() => {
        if (establishment?.id) {
            fetchMenu();
        }
    }, [establishment?.id]);

    const fetchMenu = async () => {
        try {
            setLoading(true);

            // 2. Get Attributes (Using establishment.id from context)
            const [catRes, prodRes] = await Promise.all([
                supabase.from('categories')
                    .select('*')
                    .eq('establishment_id', establishment.id)
                    .order('display_order', { ascending: true }),
                supabase.from('products')
                    .select('*')
                    .eq('establishment_id', establishment.id)
                    .eq('is_available', true)
            ]);

            setCategories(catRes.data || []);
            setProducts(prodRes.data || []);
            if (catRes.data && catRes.data.length > 0) {
                setSelectedCategoryId(catRes.data[0].id);
            }

        } catch (err) {
            console.error(err);
            toast.error('Erro ao carregar cardápio');
        } finally {
            setLoading(false);
        }
    };

    // --- MENU LOGIC --- 

    const openProductModal = async (product: Product) => {
        setSelectedProduct(product);
        setCurrentAddons({});
        setObservation('');
        setIsProductModalOpen(true);

        // Fetch addons
        try {
            const { data: groups } = await supabase
                .from('product_addon_groups')
                .select('id, name, min_quantity, max_quantity, selection_mode, is_required')
                .eq('product_id', product.id)
                .order('display_order');

            setAddonGroups(groups || []);

            if (groups && groups.length > 0) {
                const groupIds = groups.map(g => g.id);
                const { data: ads } = await supabase
                    .from('product_addons')
                    .select('*')
                    .in('group_id', groupIds)
                    .eq('is_available', true)
                    .order('name');
                setAddons(ads || []);

                const initialCollapsed: Record<number, boolean> = {};
                groups.forEach(g => { initialCollapsed[g.id] = false; });
                setCollapsedGroups(initialCollapsed);
            } else {
                setAddons([]);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleAddAddon = (addonId: number) => {
        const addon = addons.find(a => a.id === addonId);
        if (!addon) return;
        const group = addonGroups.find(g => g.id === addon.group_id);
        if (!group) return;

        const currentCount = addons.filter(a => a.group_id === group.id)
            .reduce((acc, a) => acc + (currentAddons[a.id] || 0), 0);

        setCurrentAddons(prev => {
            if (group.selection_mode === 'SELECTION' && group.max_quantity === 1) {
                // Radio behavior
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

            if (group.max_quantity > 0 && currentCount >= group.max_quantity) return prev;
            return { ...prev, [addonId]: (prev[addonId] || 0) + 1 };
        });
    };

    const handleRemoveAddon = (addonId: number) => {
        setCurrentAddons(prev => {
            const val = prev[addonId] || 0;
            if (val <= 0) return prev;
            return { ...prev, [addonId]: val - 1 };
        });
    };

    const getValidationErrors = () => {
        const errors: string[] = [];
        addonGroups.forEach(group => {
            if (group.min_quantity > 0) {
                const count = addons.filter(a => a.group_id === group.id)
                    .reduce((acc, a) => acc + (currentAddons[a.id] || 0), 0);
                if (count < group.min_quantity) {
                    errors.push(`"${group.name}": selecione no mínimo ${group.min_quantity}.`);
                }
            }
        });
        return errors;
    };

    const confirmAddToCart = () => {
        if (!selectedProduct) return;
        const errors = getValidationErrors();
        if (errors.length > 0) {
            toast.error(errors[0]);
            return;
        }

        const selectedAddonsList = Object.entries(currentAddons)
            .filter(([_, qty]) => qty > 0)
            .map(([id, qty]) => {
                const a = addons.find(ad => ad.id === Number(id))!;
                return { ...a, quantity: qty };
            });

        const itemTotal = selectedProduct.price + selectedAddonsList.reduce((acc, a) => acc + (a.price * a.quantity), 0);

        setCart(prev => [...prev, {
            cartId: Date.now().toString(),
            id: selectedProduct.id,
            name: selectedProduct.name,
            price: itemTotal,
            quantity: 1,
            addons: selectedAddonsList,
            observation
        }]);
        setIsProductModalOpen(false);
        toast.success('Item adicionado!');
    };

    // --- IDENTIFY LOGIC ---

    const handlePhoneChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = formatPhone(e.target.value);
        setPhone(val);

        const raw = val.replace(/\D/g, '');
        if (raw.length === 11) {
            setLoadingCustomer(true);
            try {
                const { data } = await supabase.from('customers').select('*').eq('phone', raw).single();
                if (data) {
                    setFoundCustomer(data);
                    setCustomerName(data.name);
                    setSavedAddresses(data.addresses || []);
                    setIsNewCustomer(false);
                } else {
                    setFoundCustomer(null);
                    setCustomerName('');
                    setSavedAddresses([]);
                    setIsNewCustomer(true);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingCustomer(false);
            }
        } else {
            setIsNewCustomer(true);
            setFoundCustomer(null);
        }
    };

    const handleIdentifyNext = () => {
        if (phone.replace(/\D/g, '').length < 10) {
            toast.error('Informe um telefone válido');
            return;
        }
        if (!customerName.trim()) {
            toast.error('Informe o nome do cliente');
            return;
        }
        setStep('DETAILS');
    };

    // --- ADDRESS LOGIC ---

    const fetchCep = async (cepVal: string) => {
        const clean = cepVal.replace(/\D/g, '');
        if (clean.length !== 8) return;
        try {
            const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
            const data = await res.json();
            if (!data.erro) {
                setAddress(prev => ({
                    ...prev,
                    street: data.logradouro,
                    neighborhood: data.bairro,
                    city: data.localidade,
                    state: data.uf
                }));
            }
        } catch (e) { console.error(e); }
    };

    const handleSaveAddress = () => {
        if (!address.street || !address.number || !address.neighborhood) {
            toast.error('Preencha os campos obrigatórios');
            return;
        }
        const newAddresses = [...savedAddresses, address];
        setSavedAddresses(newAddresses);
        setShowAddressForm(false);
        setSelectedAddressIndex(newAddresses.length - 1); // Auto select new address
    };

    // --- SUBMIT ORDER ---

    const handleSubmitOrder = async () => {
        if (!establishment) return;
        if (deliveryMethod === 'DELIVERY' && selectedAddressIndex === null && savedAddresses.length === 0) {
            toast.error('Selecione ou cadastre um endereço');
            return;
        }
        if (!paymentMethod) {
            toast.error('Selecione a forma de pagamento');
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Identify/Update Customer
            const rawPhone = phone.replace(/\D/g, '');
            let customerId = foundCustomer?.id;

            // Always update addresses if modified/new
            if (isNewCustomer) {
                const { data: newCust, error: createError } = await supabase.from('customers').insert([{
                    name: customerName,
                    phone: rawPhone,
                    addresses: savedAddresses,
                    visit_count: 1,
                    last_order_at: new Date()
                }]).select().single();
                if (createError) throw createError;
                customerId = newCust.id;
            } else {
                await supabase.from('customers').update({
                    name: customerName, // Update name just in case
                    addresses: savedAddresses,
                    last_order_at: new Date(),
                    // visit_count: foundCustomer!.visit_count + 1 // Ideally RPC
                }).eq('phone', rawPhone);
            }

            // 2. Create Order
            const finalAddress = deliveryMethod === 'DELIVERY'
                ? (selectedAddressIndex !== null ? savedAddresses[selectedAddressIndex] : address)
                : null;

            const total = cart.reduce((acc, i) => acc + i.price, 0); // + Delivery Fee if logic exists

            const orderPayload = {
                establishment_id: establishment.id,
                customer_id: customerId,
                customer_name: customerName,
                customer_phone: rawPhone,
                items: cart.map(i => ({
                    id: i.id,
                    name: i.name,
                    quantity: i.quantity,
                    price: i.price,
                    total: i.price * i.quantity,
                    addons: i.addons,
                    observation: i.observation
                })),
                total_amount: total,
                status: 'PENDING',
                type: deliveryMethod,
                payment_method: paymentMethod,
                change_for: paymentMethod === 'money' ? changeFor : null,
                delivery_address: finalAddress,
                created_at: new Date().toISOString()
            };

            const { error: orderError } = await supabase.from('orders').insert([orderPayload]);
            if (orderError) throw orderError;

            setCart([]);
            setStep('SUCCESS');
            toast.success('Pedido enviado com sucesso!');

        } catch (e: any) {
            console.error(e);
            toast.error('Erro ao enviar pedido: ' + e.message);
        } finally {
            setIsSubmitting(false);
        }
    };


    // --- RENDERS ---

    const renderHeader = (title: string, onBack?: () => void) => (
        <div className="bg-[#00223A] border-b border-white/10 p-4 flex items-center gap-3 text-white sticky top-0 z-20 shadow-md">
            <button onClick={onBack || (() => navigate(-1))} className="p-1 hover:bg-white/10 rounded-full">
                <ArrowLeft size={24} />
            </button>
            {step === 'MENU' ? (
                <div className="flex-1 relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar produto..."
                        className="w-full bg-[#003152] text-white rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#0099FF] placeholder:text-gray-500"
                    />
                    <Search size={16} className="absolute left-3.5 top-2.5 text-gray-500" />
                </div>
            ) : (
                <span className="font-bold text-lg flex-1">{title}</span>
            )}
        </div>
    );

    if (loading) return <div className="min-h-screen bg-[#003152] flex items-center justify-center text-white">Carregando...</div>;

    // 1. MENU VIEW
    if (step === 'MENU') {
        const filteredProducts = products
            .filter(p => p.category_id === selectedCategoryId)
            .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

        return (
            <div className="min-h-screen bg-[#003152] flex flex-col font-sans">
                {renderHeader('Pedido delivery', () => navigate(`/${slug}/garcom/app`))}

                {/* Categories */}
                <div className="flex bg-[#00223A] overflow-x-auto hide-scrollbar border-b border-white/5">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategoryId(cat.id)}
                            className={`flex-1 min-w-[100px] py-3.5 px-4 whitespace-nowrap text-sm font-bold text-center relative ${selectedCategoryId === cat.id ? 'text-white' : 'text-gray-400'}`}
                        >
                            {cat.name}
                            {selectedCategoryId === cat.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0099FF]" />}
                        </button>
                    ))}
                </div>

                {/* Products */}
                <div className="flex-1 overflow-y-auto pb-24">
                    {filteredProducts.map(p => (
                        <div key={p.id} onClick={() => openProductModal(p)} className="p-4 flex justify-between border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors">
                            <div className="flex gap-4">
                                {p.image_url ? (
                                    <img src={p.image_url} className="w-16 h-16 rounded-md object-cover bg-gray-800" />
                                ) : (
                                    <div className="w-16 h-16 rounded-md bg-[#00223A] flex items-center justify-center text-white/20"><Utensils size={24} /></div>
                                )}
                                <div>
                                    <div className="font-bold text-white text-sm">{p.name}</div>
                                    <div className="text-gray-400 text-xs mt-1 line-clamp-2">{p.description}</div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end justify-center">
                                <span className="text-[#0099FF] font-bold text-sm">{formatCurrency(p.price)}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                {cart.length > 0 && (
                    <div className="fixed bottom-0 w-full p-4 bg-[#00223A] border-t border-white/10 z-30">
                        <button onClick={() => setStep('IDENTIFY')} className="w-full bg-[#0099FF] text-white font-bold py-3.5 rounded-lg flex justify-between px-4">
                            <span>Gerar pedido ({cart.reduce((a, b) => a + b.quantity, 0)})</span>
                            <span>{formatCurrency(cart.reduce((a, b) => a + b.price, 0))}</span>
                        </button>
                    </div>
                )}

                {/* Product Modal */}
                {isProductModalOpen && selectedProduct && (
                    <div className="fixed inset-0 z-50 bg-[#003152] animate-in slide-in-from-bottom duration-200 flex flex-col text-white">
                        <div className="p-4 bg-[#00223A] flex items-center gap-3 border-b border-white/10">
                            <button onClick={() => setIsProductModalOpen(false)}><ArrowLeft size={24} /></button>
                            <span className="font-bold">{selectedProduct.name}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-6">
                            {addonGroups.map(group => {
                                const count = addons.filter(a => a.group_id === group.id).reduce((acc, a) => acc + (currentAddons[a.id] || 0), 0);
                                const isSatisfied = group.min_quantity === 0 || count >= group.min_quantity;
                                return (
                                    <div key={group.id} className={`rounded-xl border ${!isSatisfied ? 'border-red-500/30' : 'border-white/10'} bg-[#002840] overflow-hidden`}>
                                        <div onClick={() => setCollapsedGroups(p => ({ ...p, [group.id]: !p[group.id] }))} className="p-4 flex justify-between items-center cursor-pointer">
                                            <div>
                                                <div className="font-bold text-sm flex items-center gap-2">
                                                    {group.name}
                                                    {!isSatisfied && <span className="text-[10px] bg-red-500/20 text-red-400 px-2 rounded">Obrigatório</span>}
                                                </div>
                                                <div className="text-xs text-gray-400">Min: {group.min_quantity} - Máx: {group.max_quantity}</div>
                                            </div>
                                            {collapsedGroups[group.id] ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                                        </div>
                                        {!collapsedGroups[group.id] && (
                                            <div className="border-t border-white/5">
                                                {addons.filter(a => a.group_id === group.id).map(addon => (
                                                    <div key={addon.id} className="p-3 border-b border-white/5 flex justify-between items-center last:border-0 hover:bg-white/5" onClick={() => handleAddAddon(addon.id)}>
                                                        <div>
                                                            <div className="text-sm">{addon.name}</div>
                                                            <div className="text-xs text-[#0099FF] font-bold">+{formatCurrency(addon.price)}</div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            {(currentAddons[addon.id] || 0) > 0 && (
                                                                <>
                                                                    <button onClick={(e) => { e.stopPropagation(); handleRemoveAddon(addon.id); }} className="w-7 h-7 rounded-full border border-white/20 flex items-center justify-center">-</button>
                                                                    <span className="text-sm font-bold">{currentAddons[addon.id]}</span>
                                                                </>
                                                            )}
                                                            <button onClick={(e) => { e.stopPropagation(); handleAddAddon(addon.id); }} className={`w-7 h-7 rounded-full bg-[#0099FF] flex items-center justify-center ${currentAddons[addon.id] && currentAddons[addon.id] >= group.max_quantity ? 'opacity-50' : ''}`}>+</button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                            <div className="bg-[#002840] p-4 rounded-xl border border-white/10">
                                <label className="block text-sm font-bold mb-2">Observação</label>
                                <textarea
                                    value={observation}
                                    onChange={(e) => setObservation(e.target.value)}
                                    className="w-full bg-[#00223A] rounded-lg p-3 text-sm h-20 resize-none focus:outline-none border border-white/5"
                                    placeholder="Ex: Sem cebola..."
                                />
                            </div>
                        </div>
                        <div className="p-4 bg-[#00223A] border-t border-white/10">
                            <button onClick={confirmAddToCart} className="w-full bg-[#0099FF] py-3.5 rounded-lg font-bold text-white shadow-lg">
                                Adicionar
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // 2. IDENTIFY VIEW
    if (step === 'IDENTIFY') {
        return (
            <div className="min-h-screen bg-[#003152] flex flex-col font-sans text-white animate-in slide-in-from-right duration-300">
                {renderHeader('Identifique o cliente', () => setStep('MENU'))}
                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-bold mb-2">Digite o celular:</label>
                        <div className="relative">
                            <input
                                type="tel"
                                value={phone}
                                onChange={handlePhoneChange}
                                placeholder="(__) _____-____"
                                className="w-full bg-white text-gray-900 rounded-lg py-3 px-4 focus:outline-none font-medium"
                                maxLength={15}
                            />
                            {loadingCustomer && <div className="absolute right-3 top-3.5 animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full" />}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2">Nome do cliente:</label>
                        <input
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="Nome do cliente"
                            className="w-full bg-white text-gray-900 rounded-lg py-3 px-4 focus:outline-none font-medium"
                        />
                    </div>
                    <button
                        onClick={handleIdentifyNext}
                        className="w-full bg-gray-400 text-white font-bold py-3.5 rounded-lg mt-8 hover:bg-[#0099FF] transition-colors"
                        style={{ backgroundColor: (phone.length >= 14 && customerName.length > 2) ? '#0099FF' : undefined }}
                    >
                        Avançar
                    </button>
                    <p className="text-center text-xs text-gray-400 mt-4 leading-relaxed">
                        Finalize o pedido delivery com as informações do cliente, endereço de entrega e forma de pagamento.
                    </p>
                </div>
            </div>
        )
    }

    // 3. DETAILS VIEW
    if (step === 'DETAILS') {
        const subtotal = cart.reduce((acc, i) => acc + i.price, 0);
        const total = subtotal; // add fee later

        return (
            <div className="min-h-screen bg-[#003152] flex flex-col font-sans text-white animate-in slide-in-from-right duration-300">
                {renderHeader('Cliente delivery', () => setStep('IDENTIFY'))}

                <div className="flex-1 overflow-y-auto pb-32 space-y-1">
                    {/* Header Info */}
                    <div className="p-4 bg-[#002840] mb-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="font-bold text-lg">{customerName}</h2>
                                <p className="text-gray-400 text-sm">{phone}</p>
                            </div>
                            <button onClick={() => setStep('IDENTIFY')} className="px-3 py-1.5 bg-[#003A5C] hover:bg-[#004A70] rounded-md text-xs font-bold border border-white/5 transition-colors">
                                Editar
                            </button>
                        </div>
                    </div>

                    {/* Delivery Method */}
                    <div className="p-4 bg-[#00223A] border-y border-white/5">
                        <h3 className="text-sm font-bold mb-3 text-[#0099FF]">Escolha a forma de entrega</h3>
                        <div className="space-y-3">
                            <label className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${deliveryMethod === 'PICKUP' ? 'bg-[#003152] border-[#0099FF]' : 'bg-[#002840] border-transparent hover:bg-white/5'}`}>
                                <div className="flex items-center gap-3">
                                    <ShoppingBag size={20} className={deliveryMethod === 'PICKUP' ? 'text-[#0099FF]' : 'text-gray-500'} />
                                    <span className="font-bold">Retirar no local</span>
                                </div>
                                <input type="radio" checked={deliveryMethod === 'PICKUP'} onChange={() => setDeliveryMethod('PICKUP')} className="w-5 h-5 accent-[#0099FF]" />
                            </label>

                            <label className={`flex flex-col p-4 rounded-lg border cursor-pointer transition-all ${deliveryMethod === 'DELIVERY' ? 'bg-[#003152] border-[#0099FF]' : 'bg-[#002840] border-transparent hover:bg-white/5'}`}>
                                <div className="flex items-center justify-between w-full mb-2">
                                    <div className="flex items-center gap-3">
                                        <Bike size={20} className={deliveryMethod === 'DELIVERY' ? 'text-[#0099FF]' : 'text-gray-500'} />
                                        <span className="font-bold">Entrega</span>
                                    </div>
                                    <input type="radio" checked={deliveryMethod === 'DELIVERY'} onChange={() => setDeliveryMethod('DELIVERY')} className="w-5 h-5 accent-[#0099FF]" />
                                </div>

                                {deliveryMethod === 'DELIVERY' && (
                                    <div className="mt-2 space-y-3 pl-2 border-l-2 border-[#0099FF]/20 animate-in fade-in slide-in-from-top-2">
                                        <button onClick={() => { setShowAddressForm(true); setSelectedAddressIndex(null); }} className="w-full py-2 border border-[#0099FF] text-[#0099FF] rounded-md text-sm font-bold hover:bg-[#0099FF]/10 transition-colors">
                                            Novo endereço
                                        </button>

                                        {savedAddresses.map((addr, idx) => (
                                            <div key={idx} onClick={() => setSelectedAddressIndex(idx)} className={`p-3 rounded-md border cursor-pointer transition-colors ${selectedAddressIndex === idx ? 'bg-[#0099FF]/10 border-[#0099FF] text-white' : 'bg-black/20 border-transparent text-gray-400'}`}>
                                                <div className="text-sm font-bold text-white">{addr.street}, {addr.number}</div>
                                                <div className="text-xs">{addr.neighborhood} - {addr.city}/{addr.state}</div>
                                                <div className="flex gap-4 mt-2 text-xs font-bold text-gray-500">
                                                    <span className="hover:text-white">Editar</span>
                                                    <span className="hover:text-red-400">Excluir</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="p-4 bg-[#00223A] border-b border-white/5">
                        <h3 className="text-sm font-bold mb-3 text-gray-400">Forma de pagamento</h3>
                        <div className="space-y-2">
                            <label className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${paymentMethod === 'money' ? 'bg-[#003152] border-[#0099FF]' : 'bg-[#002840] border-transparent'}`}>
                                <div className="flex items-center gap-3">
                                    <BanknoteIcon /> <span className="font-bold">Dinheiro</span>
                                </div>
                                <input type="radio" checked={paymentMethod === 'money'} onChange={() => { setPaymentMethod('money'); setShowChangeModal(true); }} className="w-5 h-5 accent-[#0099FF]" />
                            </label>
                            <label className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${paymentMethod === 'card' ? 'bg-[#003152] border-[#0099FF]' : 'bg-[#002840] border-transparent'}`}>
                                <div className="flex items-center gap-3">
                                    <CreditCard size={20} className="text-gray-400" /> <span className="font-bold">Cartão</span>
                                </div>
                                <input type="radio" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="w-5 h-5 accent-[#0099FF]" />
                            </label>
                        </div>
                    </div>

                    {/* Order Obs */}
                    <div className="p-4 bg-[#00223A]">
                        <h3 className="text-sm font-bold mb-2 text-white">Observação do pedido</h3>
                        <textarea
                            value={orderObservation}
                            onChange={e => setOrderObservation(e.target.value)}
                            className="w-full bg-[#002840] border border-white/5 rounded-lg p-3 text-sm h-20 text-white focus:outline-none placeholder:text-gray-600"
                            placeholder="Ex: Troco para 100..."
                        />
                    </div>

                    {/* Summary */}
                    <div className="p-4 space-y-2 text-sm">
                        <div className="flex justify-between text-gray-400">
                            <span>Subtotal</span>
                            <span>{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                            <span>Taxa de serviço</span>
                            <span>R$ 0,00</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg text-white pt-2 border-t border-white/10">
                            <span>Total</span>
                            <span>{formatCurrency(total)}</span>
                        </div>
                    </div>
                </div>

                {/* Footer Submit */}
                <div className="fixed bottom-0 w-full p-4 bg-[#00223A] border-t border-white/10 z-20">
                    <button
                        onClick={handleSubmitOrder}
                        disabled={isSubmitting}
                        className="w-full bg-slate-400 text-white font-bold py-4 rounded-lg hover:bg-[#0099FF] disabled:opacity-50 transition-colors"
                        style={{ backgroundColor: (deliveryMethod && paymentMethod) ? '#0099FF' : undefined }}
                    >
                        {isSubmitting ? 'Enviando...' : 'Selecione a forma de entrega'}
                    </button>
                    <div className="text-center text-[10px] text-gray-500 mt-2">
                        Ao continuar, você concorda com os termos
                    </div>
                </div>

                {/* Address Form Modal */}
                {showAddressForm && (
                    <div className="fixed inset-0 z-50 bg-black/80 flex items-end justify-center">
                        <div className="bg-[#00223A] w-full max-w-lg rounded-t-2xl p-6 animate-in slide-in-from-bottom duration-300">
                            <div className="flex justify-between mb-4 text-white">
                                <h3 className="font-bold text-lg">Novo Endereço</h3>
                                <button onClick={() => setShowAddressForm(false)}><X /></button>
                            </div>
                            <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                                <div className="flex gap-3">
                                    <input
                                        value={address.cep}
                                        onChange={e => {
                                            const formattedCep = formatZipCode ? formatZipCode(e.target.value) : e.target.value;
                                            setAddress({ ...address, cep: formattedCep });
                                            if (e.target.value.replace(/\D/g, '').length >= 8) fetchCep(e.target.value);
                                        }}
                                        placeholder="CEP"
                                        className="bg-white text-black p-3 rounded-lg w-1/3"
                                    />
                                    <input value={address.state} readOnly placeholder="UF" className="bg-gray-200 text-black p-3 rounded-lg w-20" />
                                    <input value={address.city} readOnly placeholder="Cidade" className="bg-gray-200 text-black p-3 rounded-lg flex-1" />
                                </div>
                                <input value={address.street} onChange={e => setAddress({ ...address, street: e.target.value })} placeholder="Rua / Logradouro" className="w-full bg-white text-black p-3 rounded-lg" />
                                <div className="flex gap-3">
                                    <input value={address.number} onChange={e => setAddress({ ...address, number: e.target.value })} placeholder="Número" className="bg-white text-black p-3 rounded-lg w-1/3" />
                                    <input value={address.neighborhood} onChange={e => setAddress({ ...address, neighborhood: e.target.value })} placeholder="Bairro" className="bg-white text-black p-3 rounded-lg flex-1" />
                                </div>
                                <input value={address.complement} onChange={e => setAddress({ ...address, complement: e.target.value })} placeholder="Complemento" className="w-full bg-white text-black p-3 rounded-lg" />
                                <button onClick={handleSaveAddress} className="w-full bg-[#0099FF] text-white font-bold py-3.5 rounded-lg mt-4">Salvar Endereço</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Change Modal */}
                {showChangeModal && (
                    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-sm rounded-xl p-4 animate-in zoom-in-95">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-900">Precisa de troco?</h3>
                                <button onClick={() => setShowChangeModal(false)} className="text-gray-500"><X size={20} /></button>
                            </div>
                            <p className="text-sm text-gray-600 mb-4">O pedido fechou em <span className="font-bold">{formatCurrency(total)}</span></p>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">Troco para (opcional)</label>
                            <input
                                autoFocus
                                value={changeFor}
                                onChange={e => setChangeFor(e.target.value)}
                                placeholder="R$ 0,00"
                                className="w-full border rounded-lg p-3 mb-4 text-gray-900"
                            />
                            <div className="space-y-2">
                                <button onClick={() => { setChangeFor(''); setShowChangeModal(false); }} className="w-full border border-[#0099FF] text-[#0099FF] font-bold py-3 rounded-lg">Não preciso de troco</button>
                                <button onClick={() => setShowChangeModal(false)} className="w-full bg-gray-400 text-white font-bold py-3 rounded-lg hover:bg-[#0099FF]">Sim, preciso de troco</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // 4. SUCCESS VIEW
    if (step === 'SUCCESS') {
        return (
            <div className="min-h-screen bg-[#003152] flex flex-col items-center justify-center p-6 animate-in zoom-in-95">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white mb-6 shadow-xl shadow-green-900/20">
                    <Check size={40} strokeWidth={3} />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Pedido gerado com sucesso!</h2>
                <p className="text-gray-400 text-center mb-8">O pedido foi enviado para a cozinha e pode ser acompanhado no painel.</p>
                <button onClick={() => navigate(`/${slug}/garcom/app`)} className="w-full max-w-xs bg-[#0099FF] text-white font-bold py-4 rounded-xl shadow-lg">
                    Voltar para o Início
                </button>
            </div>
        )
    }

    return null;
};

const BanknoteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><rect width="20" height="12" x="2" y="6" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" /></svg>
)

export default WaiterDeliveryOrder;
