import { useState, useEffect } from 'react';
import { ChevronDown, AlertCircle, Search, Plus, Leaf, Sprout, Ban, Snowflake, Martini, Loader2, GripVertical } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ManageAddonGroupsModal from './ManageAddonGroupsModal';
import ImportAddonGroupModal from './ImportAddonGroupModal';
import { useEstablishment } from '../contexts/EstablishmentContext';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ProductFormProps {
    onClose: () => void;
    onSuccess?: () => void;
    categories: { id: number; name: string }[];
    initialCategoryId?: number;
    initialProduct?: any; // Product to edit
    initialStep?: number; // Step to start on
}

const STEPS = [
    { number: 1, label: 'Item' },
    { number: 2, label: 'Adicionais' },
    { number: 3, label: 'Classificações' },
    { number: 4, label: 'Disponibilidade' }
];

// Sortable Row Component for Product Form
const SortableProductGroupRow = ({ group, onDelete }: any) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: group.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        position: 'relative' as const,
        opacity: isDragging ? 0.8 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className={`flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm group hover:border-blue-200 transition-colors ${isDragging ? 'shadow-xl ring-2 ring-blue-500 border-blue-500 z-50' : ''}`}>
            <div className="flex items-center gap-4 flex-1">
                <div
                    {...attributes}
                    {...listeners}
                    className="text-gray-400 hover:text-[#0099FF] cursor-grab active:cursor-grabbing touch-none p-1 -ml-1 border-r border-gray-100 pr-2 mr-0"
                    title="Arrastar para reordenar"
                >
                    <GripVertical size={20} />
                </div>
                <div>
                    <h4 className="font-bold text-gray-700">{group.name}</h4>
                    <p className="text-sm text-gray-500">
                        {group.min_quantity} a {group.max_quantity} opções • {group.is_required ? 'Obrigatório' : 'Opcional'}
                    </p>
                </div>
            </div>
            <button
                onClick={onDelete}
                className="text-gray-400 hover:text-red-500 p-2"
                onPointerDown={(e) => e.stopPropagation()} // Prevent drag conflict
                title="Desvincular grupo"
            >
                <div className="sr-only">Remover</div>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
        </div>
    );
};

const ProductForm = ({ onClose, onSuccess, categories, initialCategoryId, initialProduct, initialStep = 1 }: ProductFormProps) => {
    const { establishment } = useEstablishment();
    const [currentStep, setCurrentStep] = useState(initialStep);
    const [formData, setFormData] = useState({
        categoryId: initialCategoryId || (initialProduct?.category_id) || (categories[0]?.id || ''),
        name: initialProduct?.name || '',
        description: initialProduct?.description || '',
        isSoldByKg: initialProduct?.is_sold_by_kg || false,
        price: initialProduct?.price ? Number(initialProduct.price).toFixed(2).replace('.', ',') : '0,00',
        originalPrice: initialProduct?.original_price ? Number(initialProduct.original_price).toFixed(2).replace('.', ',') : '',
        imageUrl: initialProduct?.image_url || '',
        hasAddons: initialProduct?.has_addons || false,
        // Step 3: Classifications
        type: initialProduct?.type || 'food', // 'food' | 'drink'
        isVegetarian: initialProduct?.is_vegetarian || false,
        isVegan: initialProduct?.is_vegan || false,
        isOrganic: initialProduct?.is_organic || false,
        isGlutenFree: initialProduct?.is_gluten_free || false,
        isSugarFree: initialProduct?.is_sugar_free || false,
        isLactoseFree: initialProduct?.is_lactose_free || false,
        // Drink specific
        isColdDrink: initialProduct?.is_cold_drink || false,
        isAlcoholic: initialProduct?.is_alcoholic || false,
        isNatural: initialProduct?.is_natural || false,
        // Step 4: Availability
        availabilityMode: initialProduct?.availability_mode || 'always', // 'always' | 'paused' | 'scheduled'
    });

    const [isManageAddonsOpen, setIsManageAddonsOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [touchedName, setTouchedName] = useState(false);
    const [showClassificationAlert, setShowClassificationAlert] = useState(true);

    // Linked Addon Groups (Selected for this product)
    const [linkedGroups, setLinkedGroups] = useState<any[]>([]);

    // Drag and Drop Logic
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setLinkedGroups((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    useEffect(() => {
        // If editing, fetch existing linked groups
        if (initialProduct?.id) {
            const fetchLinkedGroups = async () => {
                const { data: groupsData, error: groupsError } = await supabase
                    .from('product_addon_groups')
                    .select('*')
                    .eq('product_id', initialProduct.id)
                    .order('display_order');

                if (groupsError) {
                    console.error('Error fetching linked groups:', groupsError);
                    return;
                }

                if (groupsData && groupsData.length > 0) {
                    const groupIds = groupsData.map((g: any) => g.id);

                    const { data: itemsData, error: itemsError } = await supabase
                        .from('product_addons')
                        .select('*')
                        .in('group_id', groupIds)
                        .order('price');

                    if (itemsError) console.error('Error fetching linked items:', itemsError);

                    const mappedGroups = groupsData.map((group: any) => ({
                        ...group,
                        items: itemsData?.filter((i: any) => i.group_id === group.id) || [],
                        isTemplate: false
                    }));
                    setLinkedGroups(mappedGroups);

                    // Force hasAddons to true if we found linked groups
                    setFormData(prev => ({ ...prev, hasAddons: true }));
                } else {
                    setLinkedGroups([]);
                }
            };
            fetchLinkedGroups();
        }
    }, [initialProduct]);

    const handleImportGroups = async (newGroups: any[]) => {
        // Fetch items for the imported groups (templates)
        const groupsWithItems = await Promise.all(newGroups.map(async (group) => {
            const { data: items } = await supabase
                .from('addon_items')
                .select('*')
                .eq('group_id', group.id);

            return {
                ...group,
                id: group.id, // Keep template ID for reference if needed, but we will create new IDs on save
                items: items?.map((i: any) => ({
                    ...i,
                    original_item_id: i.id // Track original item ID
                })) || [],
                isTemplate: true,
                original_group_id: group.id // Track original group ID
            };
        }));

        setLinkedGroups(prev => [...prev, ...groupsWithItems]);
    };

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) {
            return;
        }

        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        setIsUploadingImage(true);

        try {
            const { error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage
                .from('product-images')
                .getPublicUrl(filePath);

            setFormData({ ...formData, imageUrl: data.publicUrl });
        } catch (error: any) {
            console.error('Error uploading image:', error);
            alert('Erro ao fazer upload da imagem. Verifique se o bucket "product-images" existe e é público.');
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleNext = () => {
        // Step 1 Validation
        if (currentStep === 1) {
            if (!formData.name.trim()) {
                setTouchedName(true);
                return;
            }
        }

        if (currentStep < 4) {
            setCurrentStep(currentStep + 1);
        } else {
            if (isSubmitting) return;

            // Submit
            const saveProduct = async () => {
                // Validation: Check for empty addon groups which would cause data loss
                if (formData.hasAddons && linkedGroups.length > 0) {
                    const emptyGroups = linkedGroups.filter(g => !g.items || g.items.length === 0);
                    if (emptyGroups.length > 0) {
                        const confirmSave = window.confirm(
                            `ATENÇÃO: Os seguintes grupos de adicionais não possuem itens carregados e serão salvos vazios (perda de dados):\n\n` +
                            emptyGroups.map(g => `- ${g.name}`).join('\n') +
                            `\n\nDeseja continuar mesmo assim? Isso apagará os itens existentes destes grupos.`
                        );
                        if (!confirmSave) return;
                    }
                }

                setIsSubmitting(true);
                try {
                    const priceValue = parseFloat(formData.price.replace(/[R$\s.]/g, '').replace(',', '.'));
                    const originalPriceValue = formData.originalPrice ? parseFloat(formData.originalPrice.replace(/[R$\s.]/g, '').replace(',', '.')) : null;

                    const productPayload = {
                        category_id: formData.categoryId,
                        name: formData.name,
                        description: formData.description,
                        is_sold_by_kg: formData.isSoldByKg,
                        price: isNaN(priceValue) ? 0 : priceValue,
                        original_price: originalPriceValue,
                        image_url: formData.imageUrl,
                        has_addons: formData.hasAddons,
                        // New fields
                        type: formData.type,
                        is_vegetarian: formData.isVegetarian,
                        is_vegan: formData.isVegan,
                        is_organic: formData.isOrganic,
                        is_gluten_free: formData.isGlutenFree,
                        is_sugar_free: formData.isSugarFree,
                        is_lactose_free: formData.isLactoseFree,
                        is_cold_drink: formData.isColdDrink,
                        is_alcoholic: formData.isAlcoholic,
                        is_natural: formData.isNatural,
                        availability_mode: formData.availabilityMode,
                        establishment_id: establishment?.id, // VITAL
                    };

                    let savedProduct = null;

                    if (initialProduct?.id) {
                        // UPDATE
                        const { data: updatedProduct, error } = await supabase
                            .from('products')
                            .update(productPayload)
                            .eq('id', initialProduct.id)
                            .select()
                            .single();

                        if (error) throw error;
                        savedProduct = updatedProduct;

                        // For addons in edit mode:
                        // Simplest strategy: Delete all existing links and re-insert current ones
                        // This handles re-ordering and removals easily.
                        const { error: deleteError } = await supabase
                            .from('product_addon_groups')
                            .delete()
                            .eq('product_id', initialProduct.id);

                        if (deleteError) throw deleteError;

                    } else {
                        // INSERT
                        const { data: newProduct, error } = await supabase
                            .from('products')
                            .insert(productPayload)
                            .select()
                            .single();

                        if (error) throw error;
                        savedProduct = newProduct;
                    }

                    // Insert Linked Groups (Copy strategy)
                    if (savedProduct && formData.hasAddons && linkedGroups.length > 0) {
                        for (const [idx, group] of linkedGroups.entries()) {
                            // 1. Insert the Key Group Definition into product_addon_groups
                            const { data: newGroup, error: groupError } = await supabase
                                .from('product_addon_groups')
                                .insert({
                                    product_id: savedProduct.id,
                                    name: group.name,
                                    min_quantity: group.min_quantity,
                                    max_quantity: group.max_quantity,
                                    is_required: group.is_required,
                                    display_order: idx,
                                    original_group_id: group.original_group_id || null, // Save reference for sync
                                    selection_mode: group.selection_mode || 'QUANTITY'
                                })
                                .select()
                                .single();

                            if (groupError) {
                                console.error('Error creating addon group:', groupError);
                                continue;
                            }

                            // 2. Insert the items for this group
                            if (group.items && group.items.length > 0) {
                                const itemsToInsert = group.items.map((item: any) => ({
                                    group_id: newGroup.id,
                                    name: item.name,
                                    price: item.price,
                                    // FIX: product_addons table uses 'max_quantity' (int), not 'is_max' (bool)
                                    // Mapping: if comes from addon_items(is_max), convert to 1 or 0. If existing product_addon, use its max_quantity.
                                    max_quantity: item.max_quantity !== undefined ? item.max_quantity : (item.is_max ? 1 : 0),
                                    is_available: true,
                                    original_item_id: item.original_item_id || (item.isTemplate ? item.id : null) // If coming from template item, item.id is original. If existing, it might be in item.original_item_id
                                }));

                                const { error: itemsError } = await supabase
                                    .from('product_addons')
                                    .insert(itemsToInsert);

                                if (itemsError) {
                                    console.error('Error creating addon items:', itemsError);
                                }
                            }
                            //
                            // FIX: When we fetch 'linkedGroups' in useEffect, we should preserve the 'original' template ID or fetch the options THEN.
                            // But wait, the previous code fetched from 'product_addon_groups'.
                            // If we delete those rows, we lose the source of the options if we didn't fetch them!
                            //
                            // We need to fetch the options for existing groups into state *before* we delete them?
                            // OR, simpler:
                            // The 'linkedGroups' state should populate with the options too.
                            //
                            // However, strictly speaking, if we just imported from 'addon_groups', 'group.id' is the template ID.
                            // If we loaded from existing product, 'group.id' was the 'product_addon_groups' ID.
                            //
                            // If we delete the rows in DB, we can't query their options anymore if they weren't template-based.
                            // But usually systems like this either link to a template OR copy.
                            // If it's a copy, we must read the options into memory before deleting.
                            //
                            // Let's check how 'linkedGroups' is populated in useEffect.
                            // val mappedGroups = data.map...
                            // It didn't fetch options.
                            //
                            // CRITICAL FIX: We must fetch options for existing groups when loading the form.
                            // And for Imported groups, we need to fetch options from the template.

                            // Let's Try to fetch options right now if they are missing?
                            // No, if we deleted the parent row, the options might satisfy cascade delete or become orphaned.
                            // SAFEST: Fetch options using the group.id BEFORE deleting anything.
                            // But we are inside the 'save' loop, and deletion happened above.

                            // REVERT STRATEGY: Do NOT delete all groups first.
                            // Instead, handle updates/inserts/deletes more granularly OR load everything into memory first.

                            // Given the complexity and current bug, I will implement a "Load all options into memory" approach during Save, BEFORE delete.

                        }
                    }

                    if (onSuccess) {
                        onSuccess();
                    } else {
                        onClose();
                    }
                } catch (err: any) {
                    console.error('Error saving product:', err);
                    alert('Erro ao salvar produto: ' + (err.message || 'Erro desconhecido'));
                    setIsSubmitting(false);
                }
            };

            saveProduct();
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-50 z-50 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-bold text-gray-800">Gestor de cardápio</h1>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        Fechar
                    </button>
                </div>

                <div className="flex gap-8 flex-1">
                    {/* Sidebar */}
                    <div className="w-64 flex-shrink-0">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            {STEPS.map((step) => (
                                <button
                                    key={step.number}
                                    onClick={() => {
                                        // Only allow jumping back, or jumping forward if validation passes
                                        if (step.number < currentStep) {
                                            setCurrentStep(step.number);
                                        } else if (step.number > currentStep) {
                                            if (currentStep === 1 && !formData.name.trim()) {
                                                setTouchedName(true);
                                                return;
                                            }
                                            setCurrentStep(step.number);
                                        }
                                    }}
                                    className={`w-full flex items-center px-6 py-4 border-b border-gray-100 last:border-b-0 text-left transition-colors relative
                                        ${currentStep === step.number ? 'bg-blue-50/50' : 'hover:bg-gray-50'}
                                    `}
                                >
                                    <div className={`
                                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mr-3 transition-colors
                                        ${currentStep === step.number ? 'bg-[#0099FF] text-white' : 'text-gray-400 bg-gray-100'}
                                    `}>
                                        {step.number}
                                    </div>
                                    <span className={`font-medium ${currentStep === step.number ? 'text-[#0099FF]' : 'text-gray-500'}`}>
                                        {step.label}
                                    </span>
                                    {currentStep === step.number && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0099FF]" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 flex-1">
                            {/* Step 1: Item */}
                            {currentStep === 1 && (
                                <div className="max-w-4xl">
                                    <div className="mb-8">
                                        <h2 className="text-xl font-bold text-gray-800 mb-1">1. Item</h2>
                                        <p className="text-gray-500">Defina as informações que serão dadas ao seu item</p>
                                    </div>

                                    <div className="flex gap-12">
                                        {/* Form Fields */}
                                        <div className="flex-1 space-y-6">
                                            {/* Category */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Categoria *
                                                </label>
                                                <div className="relative">
                                                    <select
                                                        value={formData.categoryId}
                                                        onChange={(e) => setFormData({ ...formData, categoryId: Number(e.target.value) })}
                                                        className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                    >
                                                        {categories.map((cat) => (
                                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                                        <ChevronDown size={16} />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Name */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Nome do item *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.name}
                                                    onChange={(e) => {
                                                        setFormData({ ...formData, name: e.target.value });
                                                        if (touchedName) setTouchedName(false);
                                                    }}
                                                    onBlur={() => setTouchedName(true)}
                                                    placeholder="Ex.: X-Tudo, Batata Frita, Água mineral etc."
                                                    className={`w-full bg-white border rounded-lg px-4 py-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder:text-gray-400
                                                        ${touchedName && !formData.name.trim() ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}
                                                    `}
                                                    maxLength={100}
                                                />
                                                {touchedName && !formData.name.trim() && (
                                                    <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                                                        <AlertCircle size={12} />
                                                        <span>O nome do item é obrigatório</span>
                                                    </div>
                                                )}
                                                <div className="text-right mt-1">
                                                    <span className="text-xs text-gray-400">0/100</span>
                                                </div>
                                            </div>

                                            {/* Description */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Descrição
                                                </label>
                                                <textarea
                                                    value={formData.description}
                                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                    placeholder="Ex.: Molho, mussarela, tomate finalizado com orégano e azeite."
                                                    rows={4}
                                                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-gray-400 resize-none"
                                                    maxLength={1000}
                                                />
                                                <div className="flex justify-between mt-1">
                                                    <span className="text-xs text-gray-400">Descreva os ingredientes deste item.</span>
                                                    <span className="text-xs text-gray-400">0/1000</span>
                                                </div>
                                            </div>

                                            {/* Sold by Kg */}
                                            <div>
                                                <label className="flex items-start gap-3 cursor-pointer">
                                                    <div className="relative flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.isSoldByKg}
                                                            onChange={(e) => setFormData({ ...formData, isSoldByKg: e.target.checked })}
                                                            className="w-5 h-5 border-gray-300 rounded text-blue-600 focus:ring-blue-500 mt-0.5"
                                                        />
                                                    </div>
                                                    <div>
                                                        <span className="block text-sm font-medium text-gray-700">Item vendido por kg</span>
                                                        <span className="block text-xs text-gray-500 mt-0.5">Para itens que devem ser pesados e vendidos por kg.</span>
                                                    </div>
                                                </label>
                                            </div>

                                            {/* Original Price */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Preço Original (opcional)
                                                </label>
                                                <div className="relative w-48">
                                                    <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center bg-gray-50 border border-r-0 border-gray-300 rounded-l-lg text-gray-500 font-medium">
                                                        $
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={formData.originalPrice ? `R$ ${formData.originalPrice}` : ''}
                                                        onChange={(e) => {
                                                            const val = e.target.value.replace(/[^0-9,]/g, '');
                                                            setFormData({ ...formData, originalPrice: val });
                                                        }}
                                                        placeholder="R$ 0,00"
                                                        className="w-full pl-14 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">Preencha para exibir como "De/Por" (promoção)</p>
                                            </div>

                                            {/* Price */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Preço
                                                </label>
                                                <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 text-sm font-medium mb-2 transition-colors">
                                                    Configurações de preço
                                                </button>
                                                <div className="relative w-48">
                                                    <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center bg-gray-50 border border-r-0 border-gray-300 rounded-l-lg text-gray-500 font-medium">
                                                        $
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={`R$ ${formData.price}`}
                                                        onChange={(e) => {
                                                            const val = e.target.value.replace(/[^0-9,]/g, '');
                                                            setFormData({ ...formData, price: val });
                                                        }}
                                                        className="w-full pl-14 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Image Upload */}
                                        <div className="w-64">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Foto do item
                                            </label>

                                            <div className="relative group">
                                                {formData.imageUrl ? (
                                                    /* Preview State */
                                                    <div className="h-80 w-full rounded-lg border border-gray-200 overflow-hidden relative bg-white">
                                                        <img
                                                            src={formData.imageUrl}
                                                            alt="Preview"
                                                            className="w-full h-full object-contain p-2"
                                                        />

                                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                            <label className="p-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors shadow-sm" title="Trocar foto">
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    className="hidden"
                                                                    onChange={handleImageUpload}
                                                                    disabled={isUploadingImage}
                                                                />
                                                                <div className="w-5 h-5 flex items-center justify-center">
                                                                    {isUploadingImage ? <Loader2 className="animate-spin" size={16} /> : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>}
                                                                </div>
                                                            </label>
                                                            <button
                                                                onClick={() => setFormData({ ...formData, imageUrl: '' })}
                                                                className="p-2 bg-white text-red-500 rounded-lg hover:bg-red-50 transition-colors shadow-sm"
                                                                title="Remover foto"
                                                                type="button"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    /* Empty State */
                                                    <label className={`border-2 border-dashed border-blue-200 rounded-lg p-6 flex flex-col items-center justify-center text-center bg-blue-50/20 h-80 hover:bg-blue-50/50 transition-colors cursor-pointer group relative overflow-hidden ${isUploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={handleImageUpload}
                                                            disabled={isUploadingImage}
                                                        />

                                                        {isUploadingImage ? (
                                                            <div className="flex flex-col items-center">
                                                                <Loader2 className="w-8 h-8 text-[#0099FF] animate-spin mb-2" />
                                                                <span className="text-sm font-medium text-gray-500">Enviando...</span>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className="w-20 h-20 bg-blue-100 rounded-xl flex items-center justify-center text-blue-500 mb-4 group-hover:scale-110 transition-transform">
                                                                    <div className="relative">
                                                                        <div className="absolute inset-0 bg-blue-500 opacity-20 blur-xl rounded-full"></div>
                                                                        <img src="https://cdn-icons-png.flaticon.com/512/3075/3075977.png" alt="Burger" className="w-10 h-10 opacity-50 block mx-auto" />
                                                                    </div>
                                                                </div>
                                                                <span className="text-sm font-medium text-gray-700 mb-1">
                                                                    Escolha a foto
                                                                </span>
                                                                <span className="text-xs text-gray-500 mb-4">
                                                                    Clique aqui ou arraste a foto para cá.
                                                                </span>
                                                                <div className="text-[10px] text-gray-400 space-y-1 text-left w-full">
                                                                    <p>Formatos: .png, .jpg, .jpeg, .webp</p>
                                                                    <p>Peso máximo: 1mb</p>
                                                                    <p>Resolução mínima: 200px</p>
                                                                </div>
                                                            </>
                                                        )}
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Addons */}
                            {currentStep === 2 && (
                                <div className="max-w-4xl">
                                    <div className="flex items-start justify-between mb-8">
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-800 mb-1">2. Adicionais</h2>
                                            <p className="text-gray-500">Defina os adicionais do seu item</p>
                                        </div>
                                        <button
                                            onClick={() => setIsManageAddonsOpen(true)}
                                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            Gerenciar grupos de adicionais
                                        </button>
                                    </div>

                                    <div className="space-y-6 bg-white rounded-lg">
                                        {/* Options */}
                                        <label className="flex items-center gap-3 cursor-pointer p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center
                                                ${!formData.hasAddons ? 'border-[#0099FF]' : 'border-gray-300'}`}>
                                                {!formData.hasAddons && <div className="w-2.5 h-2.5 bg-[#0099FF] rounded-full" />}
                                            </div>
                                            <input
                                                type="radio"
                                                name="addons_option"
                                                className="hidden"
                                                checked={!formData.hasAddons}
                                                onChange={() => setFormData({ ...formData, hasAddons: false })}
                                            />
                                            <span className="font-medium text-gray-700">Sem Adicionais</span>
                                        </label>

                                        <label className="flex items-center gap-3 cursor-pointer p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center
                                                ${formData.hasAddons ? 'border-[#0099FF]' : 'border-gray-300'}`}>
                                                {formData.hasAddons && <div className="w-2.5 h-2.5 bg-[#0099FF] rounded-full" />}
                                            </div>
                                            <input
                                                type="radio"
                                                name="addons_option"
                                                className="hidden"
                                                checked={formData.hasAddons}
                                                onChange={() => setFormData({ ...formData, hasAddons: true })}
                                            />
                                            <span className="font-medium text-gray-700">Com Adicionais</span>
                                        </label>
                                    </div>

                                    {/* Addon Groups Management */}
                                    {formData.hasAddons && (
                                        <div className="mt-8 animate-in slide-in-from-top-2 duration-200">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="font-bold text-gray-800">Adicionais do Item</h3>
                                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                                    <div className="flex flex-col items-center">
                                                        <ChevronDown size={12} className="rotate-180" />
                                                        <ChevronDown size={12} />
                                                    </div>
                                                    <span>Arraste o bloco e defina a ordem no cardápio digital.</span>
                                                </div>
                                            </div>

                                            <div className="flex gap-4 mb-6">
                                                <button
                                                    onClick={() => setIsManageAddonsOpen(true)}
                                                    className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors"
                                                >
                                                    <div className="rounded-full border border-gray-400 p-0.5">
                                                        <Search size={12} className="opacity-0" /> {/* Spacer mock */}
                                                        <Plus size={12} className="absolute ml-[-1px] mt-[-1px]" />
                                                    </div>
                                                    Criar Novo Grupo
                                                </button>
                                                <button
                                                    onClick={() => setIsImportModalOpen(true)}
                                                    className="flex items-center gap-2 px-4 py-2.5 bg-[#0099FF] text-white font-bold rounded-lg hover:bg-blue-600 transition-colors"
                                                >
                                                    <div className="rounded-full border border-white/50 p-0.5">
                                                        <ChevronDown size={12} className="rotate-0" /> {/* Icon placeholder */}
                                                    </div>
                                                    Importar Grupo
                                                </button>
                                            </div>

                                            {/* Linked Groups List */}
                                            <div className="space-y-3">
                                                <DndContext
                                                    sensors={sensors}
                                                    collisionDetection={closestCenter}
                                                    onDragEnd={handleDragEnd}
                                                >
                                                    <SortableContext
                                                        items={linkedGroups.map(g => g.id)}
                                                        strategy={verticalListSortingStrategy}
                                                    >
                                                        {linkedGroups.map((group) => (
                                                            <SortableProductGroupRow
                                                                key={group.id}
                                                                group={group}
                                                                onDelete={() => setLinkedGroups(prev => prev.filter(g => g.id !== group.id))}
                                                            />
                                                        ))}
                                                    </SortableContext>
                                                </DndContext>

                                                {linkedGroups.length === 0 && (
                                                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center text-gray-400 bg-gray-50/50">
                                                        Nenhum grupo vinculado. Importe ou crie um novo grupo.
                                                    </div>
                                                )}

                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Step 3: Classifications Placeholder */}
                            {currentStep === 3 && (
                                <div className="max-w-4xl">
                                    <div className="mb-8">
                                        <h2 className="text-xl font-bold text-gray-800 mb-1">3. Classificações</h2>
                                        <p className="text-gray-500">Selecione o tipo de item para classificar</p>
                                    </div>

                                    <div className="space-y-8">
                                        {showClassificationAlert && (
                                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3 relative">
                                                <AlertCircle className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
                                                <div className="flex-1 pr-6">
                                                    <p className="text-sm text-blue-700">
                                                        Lembre-se que você é responsável por todas as informações sobre os itens, conforme nossos <a href="#" className="underline hover:text-blue-800">Termos e Condições</a>
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => setShowClassificationAlert(false)}
                                                    className="absolute right-4 top-4 text-blue-400 hover:text-blue-600 p-1 rounded-full hover:bg-blue-100/50 transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                                </button>
                                            </div>
                                        )}

                                        {/* Item Type */}
                                        <div>
                                            <h3 className="font-bold text-gray-700 mb-4">Qual item está sendo classificado?</h3>
                                            <div className="flex gap-6">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center
                                                        ${formData.type === 'food' ? 'border-[#0099FF]' : 'border-gray-300'}`}>
                                                        {formData.type === 'food' && <div className="w-2.5 h-2.5 bg-[#0099FF] rounded-full" />}
                                                    </div>
                                                    <input
                                                        type="radio"
                                                        name="item_type"
                                                        className="hidden"
                                                        checked={formData.type === 'food'}
                                                        onChange={() => setFormData({ ...formData, type: 'food' })}
                                                    />
                                                    <span className="text-gray-700 font-medium">Comida</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center
                                                        ${formData.type === 'drink' ? 'border-[#0099FF]' : 'border-gray-300'}`}>
                                                        {formData.type === 'drink' && <div className="w-2.5 h-2.5 bg-[#0099FF] rounded-full" />}
                                                    </div>
                                                    <input
                                                        type="radio"
                                                        name="item_type"
                                                        className="hidden"
                                                        checked={formData.type === 'drink'}
                                                        onChange={() => setFormData({ ...formData, type: 'drink' })}
                                                    />
                                                    <span className="text-gray-700 font-medium">Bebida</span>
                                                </label>
                                            </div>
                                        </div>

                                        {/* Dietary Restrictions */}
                                        <div>
                                            <p className="text-gray-500 mb-6">
                                                Indique se seu item se adequa a restrições alimentares diversas, para alertar clientes com esse perfil
                                            </p>

                                            <div className="space-y-4">
                                                {formData.type === 'food' ? (
                                                    [
                                                        { key: 'isVegetarian', label: 'Vegetariano', desc: 'Sem carne de nenhum tipo, como carne bovina, suína, frango, peixes, presunto ou salame', icon: <Leaf size={20} /> },
                                                        { key: 'isVegan', label: 'Vegano', desc: 'Sem produtos de origem animal, como carne, ovo, queijo ou leite', icon: <Sprout size={20} /> },
                                                        { key: 'isOrganic', label: 'Orgânico', desc: 'Cultivado sem agrotóxicos, segunda a lei 10.831', icon: <Leaf size={20} className="text-green-600" /> },
                                                        { key: 'isGlutenFree', label: 'Sem glúten', desc: 'Não contém trigo, cevada ou centeio', icon: <Ban size={20} className="text-gray-400" /> },
                                                        { key: 'isSugarFree', label: 'Sem açúcar', desc: 'Não contém nenhum tipo de açúcar (cristal, orgânico, mascavo etc.)', icon: <Ban size={20} className="text-gray-400" /> },
                                                        { key: 'isLactoseFree', label: 'Zero lactose', desc: 'Não contém lactose, ou seja, leite e seus derivados', icon: <Ban size={20} className="text-gray-400" /> },
                                                    ].map((item: any) => (
                                                        <label key={item.key} className="flex items-start gap-3 cursor-pointer group">
                                                            <div className="mt-1 text-gray-400 group-hover:text-gray-600">
                                                                {item.icon}
                                                            </div>
                                                            <div className="relative flex items-center mt-1">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={(formData as any)[item.key]}
                                                                    onChange={(e) => setFormData({ ...formData, [item.key]: e.target.checked })}
                                                                    className="w-5 h-5 border-gray-300 rounded text-blue-600 focus:ring-blue-500"
                                                                />
                                                            </div>
                                                            <div>
                                                                <span className="block font-medium text-gray-700">{item.label}</span>
                                                                <span className="block text-sm text-gray-500">{item.desc}</span>
                                                            </div>
                                                        </label>
                                                    ))
                                                ) : (
                                                    <>
                                                        {[
                                                            { key: 'isLactoseFree', label: 'Zero lactose', desc: 'Não contém lactose, ou seja, leite e seus derivados', icon: <Ban size={20} className="text-gray-400" /> },
                                                            { key: 'isSugarFree', label: 'Diet | Zero', desc: 'Sem adição de açúcares', icon: <Ban size={20} className="text-gray-400" /> },
                                                        ].map((item: any) => (
                                                            <label key={item.key} className="flex items-start gap-3 cursor-pointer group">
                                                                <div className="mt-1 text-gray-400 group-hover:text-gray-600">
                                                                    {item.icon}
                                                                </div>
                                                                <div className="relative flex items-center mt-1">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={(formData as any)[item.key]}
                                                                        onChange={(e) => setFormData({ ...formData, [item.key]: e.target.checked })}
                                                                        className="w-5 h-5 border-gray-300 rounded text-blue-600 focus:ring-blue-500"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <span className="block font-medium text-gray-700">{item.label}</span>
                                                                    <span className="block text-sm text-gray-500">{item.desc}</span>
                                                                </div>
                                                            </label>
                                                        ))}

                                                        <div className="flex items-center gap-4 py-4">
                                                            <span className="text-sm font-bold text-gray-400 whitespace-nowrap">Outras classificações</span>
                                                            <div className="h-px bg-gray-200 w-full" />
                                                        </div>

                                                        {[
                                                            { key: 'isColdDrink', label: 'Bebida gelada', desc: 'Da geladeira direto para o consumidor', icon: <Snowflake size={20} /> },
                                                            { key: 'isAlcoholic', label: 'Bebida alcoólica', desc: 'De 0,5% a 54% em volume, destilados, fermentados etc', icon: <Martini size={20} /> },
                                                            { key: 'isNatural', label: 'Natural', desc: 'Preparados na hora com frutas frescas', icon: <Leaf size={20} /> },
                                                        ].map((item: any) => (
                                                            <label key={item.key} className="flex items-start gap-3 cursor-pointer group">
                                                                <div className="mt-1 text-gray-400 group-hover:text-gray-600">
                                                                    {item.icon}
                                                                </div>
                                                                <div className="relative flex items-center mt-1">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={(formData as any)[item.key]}
                                                                        onChange={(e) => setFormData({ ...formData, [item.key]: e.target.checked })}
                                                                        className="w-5 h-5 border-gray-300 rounded text-blue-600 focus:ring-blue-500"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <span className="block font-medium text-gray-700">{item.label}</span>
                                                                    <span className="block text-sm text-gray-500">{item.desc}</span>
                                                                </div>
                                                            </label>
                                                        ))}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Availability Placeholder */}
                            {currentStep === 4 && (
                                <div className="max-w-4xl">
                                    <div className="mb-8">
                                        <h2 className="text-xl font-bold text-gray-800 mb-1">4. Disponibilidade</h2>
                                        <p className="text-gray-500">Defina qual disponibilidade seu item terá</p>
                                    </div>



                                    <div className="space-y-6">
                                        <label className="flex items-start gap-3 cursor-pointer">
                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0
                                                ${formData.availabilityMode === 'always' ? 'border-[#0099FF]' : 'border-gray-300'}`}>
                                                {formData.availabilityMode === 'always' && <div className="w-2.5 h-2.5 bg-[#0099FF] rounded-full" />}
                                            </div>
                                            <input
                                                type="radio"
                                                name="availability_mode"
                                                className="hidden"
                                                checked={formData.availabilityMode === 'always'}
                                                onChange={() => setFormData({ ...formData, availabilityMode: 'always' })}
                                            />
                                            <div>
                                                <span className="block font-bold text-gray-700">Sempre disponível</span>
                                                <span className="block text-sm text-gray-500">O item ficará disponível sempre que o estabelecimento estiver aberto em todos os canais de venda</span>
                                            </div>
                                        </label>

                                        <label className="flex items-start gap-3 cursor-pointer">
                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0
                                                ${formData.availabilityMode === 'paused' ? 'border-[#0099FF]' : 'border-gray-300'}`}>
                                                {formData.availabilityMode === 'paused' && <div className="w-2.5 h-2.5 bg-[#0099FF] rounded-full" />}
                                            </div>
                                            <input
                                                type="radio"
                                                name="availability_mode"
                                                className="hidden"
                                                checked={formData.availabilityMode === 'paused'}
                                                onChange={() => setFormData({ ...formData, availabilityMode: 'paused' })}
                                            />
                                            <div>
                                                <span className="block font-bold text-gray-700">Pausado e não disponível no cardápio</span>
                                                <span className="block text-sm text-gray-500">Não aparecerá nos seus canais de venda</span>
                                            </div>
                                        </label>

                                        <label className="flex items-start gap-3 cursor-pointer">
                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0
                                                ${formData.availabilityMode === 'scheduled' ? 'border-[#0099FF]' : 'border-gray-300'}`}>
                                                {formData.availabilityMode === 'scheduled' && <div className="w-2.5 h-2.5 bg-[#0099FF] rounded-full" />}
                                            </div>
                                            <input
                                                type="radio"
                                                name="availability_mode"
                                                className="hidden"
                                                checked={formData.availabilityMode === 'scheduled'}
                                                onChange={() => setFormData({ ...formData, availabilityMode: 'scheduled' })}
                                            />
                                            <div>
                                                <span className="block font-bold text-gray-700">Disponível em dias e horários específicos</span>
                                                <span className="block text-sm text-gray-500">Escolha quando o item aparece nos seus canais de venda</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Action */}
                        <div className="flex justify-end gap-3 mt-6">
                            {currentStep > 1 && (
                                <button
                                    onClick={handleBack}
                                    className="px-8 py-3 border border-[#0099FF] text-[#0099FF] hover:bg-blue-50 font-bold rounded-lg shadow-sm transition-colors text-sm"
                                >
                                    Voltar
                                </button>
                            )}
                            {currentStep === 4 ? (
                                <div className="flex items-center shadow-sm rounded-lg overflow-hidden">
                                    <button
                                        onClick={handleNext}
                                        disabled={isSubmitting}
                                        className={`px-8 py-3 bg-[#0099FF] hover:bg-blue-600 text-white font-bold transition-colors text-sm border-r border-blue-400/30 flex items-center
                                            ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}
                                        `}
                                    >
                                        {isSubmitting ? 'Salvando...' : 'Finalizar'}
                                    </button>
                                    <button
                                        className="px-3 py-3 bg-[#0099FF] hover:bg-blue-600 text-white transition-colors"
                                    >
                                        <ChevronDown size={20} />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleNext}
                                    className="px-8 py-3 bg-[#0099FF] hover:bg-blue-600 text-white font-bold rounded-lg shadow-sm transition-colors text-sm"
                                >
                                    Avançar
                                </button>
                            )}
                        </div>
                    </div>
                </div>



                {/* Modals */}
                <ManageAddonGroupsModal
                    isOpen={isManageAddonsOpen}
                    onClose={() => setIsManageAddonsOpen(false)}
                />

                <ImportAddonGroupModal
                    isOpen={isImportModalOpen}
                    onClose={() => setIsImportModalOpen(false)}
                    onImport={handleImportGroups}
                    existingGroupIds={linkedGroups.map(g => g.id)}
                    establishmentId={establishment?.id}
                />
            </div>
        </div>
    );
};

export default ProductForm;
