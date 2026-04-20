import { ChevronDown, Edit, GripVertical, Trash2, Copy, PlusCircle, Layers, Settings } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import ImportAddonGroupModal from './ImportAddonGroupModal';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface CategoryCardProps {
    id: number;
    name: string;
    isPromo?: boolean;
    itemsCount?: number;
    onDelete?: () => void;
    onAddProduct?: () => void;
    onEditProduct?: (product: any, step?: number) => void;
    onEditCategory?: () => void;
    dragAttributes?: any;
    dragListeners?: any;
}

const ProductItem = ({ product, onEditProduct, onRefresh, addonRefreshTrigger }: { product: any; onEditProduct?: (product: any, step?: number) => void; onRefresh?: () => void; addonRefreshTrigger?: number }) => {
    // Sortable Hook
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: product.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        position: isDragging ? 'relative' as 'relative' : undefined,
    };

    const [isExpanded, setIsExpanded] = useState(false);
    const [addonGroups, setAddonGroups] = useState<any[]>([]);
    const [isLoadingAddons, setIsLoadingAddons] = useState(false);
    const [hasFetchedAddons, setHasFetchedAddons] = useState(false);


    // Custom Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Dropdown Actions State
    const [showActions, setShowActions] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowActions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Effect to handle external refresh triggers for addons
    useEffect(() => {
        if (addonRefreshTrigger !== undefined) {
            setHasFetchedAddons(false);
            if (isExpanded) {
                fetchAddons();
            }
        }
    }, [addonRefreshTrigger]);

    const toggleExpand = async () => {
        const newState = !isExpanded;
        setIsExpanded(newState);

        if (newState && !hasFetchedAddons) {
            fetchAddons();
        }
    };

    const fetchAddons = async () => {
        setIsLoadingAddons(true);
        try {
            const { data: linkedGroups, error: groupsError } = await supabase
                .from('product_addon_groups')
                .select('*')
                .eq('product_id', product.id)
                .order('display_order', { ascending: true });

            if (groupsError) throw groupsError;

            if (!linkedGroups || linkedGroups.length === 0) {
                setAddonGroups([]);
                setHasFetchedAddons(true);
                return;
            }

            const groupIds = linkedGroups.map((g: any) => g.id);
            const { data: addons, error: addonsError } = await supabase
                .from('product_addons')
                .select('*')
                .in('group_id', groupIds)
                .order('price', { ascending: true });

            if (addonsError) throw addonsError;

            const groupsWithAddons = linkedGroups.map((group: any) => ({
                ...group,
                addons: addons?.filter((a: any) => a.group_id === group.id) || []
            }));

            setAddonGroups(groupsWithAddons);
            setHasFetchedAddons(true);
        } catch (error) {
            console.error('Error fetching addons:', error);
        } finally {
            setIsLoadingAddons(false);
        }
    };


    const handleToggleAvailability = async () => {
        const newAvailability = !product.is_available;
        try {
            const { error } = await supabase
                .from('products')
                .update({ is_available: newAvailability })
                .eq('id', product.id);

            if (error) throw error;
            product.is_available = newAvailability;
            onRefresh?.();
        } catch (error) {
            console.error('Error updating availability:', error);
            alert('Erro ao atualizar disponibilidade');
        }
    };

    const handleDuplicate = async (e?: any) => {
        if (e && e.stopPropagation) e.stopPropagation();
        if (!window.confirm('Deseja realmente duplicar este item?')) return;
        setShowActions(false);

        try {
            const { data: sourceGroups } = await supabase
                .from('product_addon_groups')
                .select('*')
                .eq('product_id', product.id)
                .order('display_order');

            let deepGroups = [];
            if (sourceGroups && sourceGroups.length > 0) {
                const groupIds = sourceGroups.map((g: any) => g.id);
                const { data: addons } = await supabase
                    .from('product_addons')
                    .select('*')
                    .in('group_id', groupIds);

                deepGroups = sourceGroups.map((g: any) => ({
                    ...g,
                    addons: addons?.filter((a: any) => a.group_id === g.id) || []
                }));
            }

            const { data: newProduct, error: prodError } = await supabase
                .from('products')
                .insert({
                    category_id: product.category_id,
                    name: `${product.name} (Cópia)`,
                    description: product.description,
                    is_sold_by_kg: product.is_sold_by_kg,
                    price: product.price,
                    image_url: product.image_url,
                    has_addons: product.has_addons,
                    type: product.type,
                    is_vegetarian: product.is_vegetarian,
                    is_vegan: product.is_vegan,
                    is_organic: product.is_organic,
                    is_gluten_free: product.is_gluten_free,
                    is_sugar_free: product.is_sugar_free,
                    is_lactose_free: product.is_lactose_free,
                    is_cold_drink: product.is_cold_drink,
                    is_alcoholic: product.is_alcoholic,
                    is_natural: product.is_natural,
                    availability_mode: product.availability_mode
                })
                .select()
                .single();

            if (prodError) throw prodError;

            if (deepGroups.length > 0) {
                for (const group of deepGroups) {
                    const { data: newGroup, error: grpError } = await supabase
                        .from('product_addon_groups')
                        .insert({
                            product_id: newProduct.id,
                            name: group.name,
                            min_quantity: group.min_quantity,
                            max_quantity: group.max_quantity,
                            is_required: group.is_required,
                            display_order: group.display_order
                        })
                        .select()
                        .single();

                    if (grpError) continue;

                    if (group.addons.length > 0) {
                        const addonPayload = group.addons.map((a: any) => ({
                            group_id: newGroup.id,
                            name: a.name,
                            price: a.price,
                            max_quantity: a.max_quantity,
                            is_available: a.is_available
                        }));
                        await supabase.from('product_addons').insert(addonPayload);
                    }
                }
            }

            alert('Item duplicado com sucesso!');
            onRefresh?.();
        } catch (error: any) {
            console.error('Error duplicating:', error);
            alert('Erro ao duplicar: ' + error.message);
        }
    };

    const handleDelete = (e?: any) => {
        if (e && e.stopPropagation) e.stopPropagation();
        setShowActions(false);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (isDeleting) return;
        setIsDeleting(true);
        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', product.id);

            if (error) throw error;
            setShowDeleteModal(false);
            onRefresh?.();
        } catch (error: any) {
            console.error('Error deleting:', error);
            alert('Erro ao excluir: ' + error.message);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCopyLink = async (e?: any) => {
        if (e && e.stopPropagation) e.stopPropagation();
        setShowActions(false);
        const link = `${window.location.origin}/item/${product.id}`;
        try {
            await navigator.clipboard.writeText(link);
            alert('Link copiado!');
        } catch (err) {
            prompt('Copie o link:', link);
        }
    };

    const handleToggleStock = async () => {
        const newTrackStock = !product.track_stock;
        try {
            const { error } = await supabase
                .from('products')
                .update({ track_stock: newTrackStock })
                .eq('id', product.id);
            if (error) throw error;
            product.track_stock = newTrackStock;
            onRefresh?.();
        } catch (error) {
            console.error('Error updating stock tracking:', error);
        }
    };

    const handleToggleQuantity = async () => {
        const newHasQuantity = !product.has_quantity;
        try {
            const { error } = await supabase
                .from('products')
                .update({ has_quantity: newHasQuantity })
                .eq('id', product.id);
            if (error) throw error;
            product.has_quantity = newHasQuantity;
            onRefresh?.();
        } catch (error) {
            console.error('Error updating quantity control:', error);
        }
    };

    return (
        <div ref={setNodeRef} style={style} className={`border-b border-gray-100 last:border-b-0 ${isDragging ? 'opacity-50 bg-blue-50' : ''}`}>
            <div className="p-4 flex items-start md:items-center gap-2 md:gap-4">
                <div className="md:hidden w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-100 flex-shrink-0 shadow-sm">
                    <img src="https://cdn-icons-png.flaticon.com/512/3075/3075977.png" alt="Burger" className="w-6 h-6 grayscale opacity-80" />
                </div>

                <div className="hidden md:block cursor-grab text-gray-300 hover:text-gray-500 outline-none p-1" {...attributes} {...listeners}>
                    <GripVertical size={20} />
                </div>

                <div className="hidden md:flex w-12 h-12 bg-gray-50 rounded-lg items-center justify-center border border-gray-200 flex-shrink-0">
                    {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-8 h-8 object-cover" />
                    ) : (
                        <img src="https://cdn-icons-png.flaticon.com/512/3075/3075977.png" alt="Burger" className="w-8 h-8 opacity-40 grayscale" />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between md:justify-start gap-2">
                        <span className="font-bold md:font-medium text-gray-800 md:text-gray-700 truncate text-sm md:text-base pr-4">
                            {product.name}
                        </span>

                        <div className="md:hidden relative" ref={dropdownRef}>
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowActions(!showActions); }}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${showActions ? 'bg-[#0099FF] text-white shadow-lg shadow-blue-200' : 'bg-white text-gray-400 border border-gray-200'}`}
                            >
                                <Settings size={16} />
                            </button>

                            {showActions && (
                                <div className="fixed right-6 top-1/2 -translate-y-1/2 w-64 bg-white border border-gray-200 rounded-xl shadow-2xl z-[100] overflow-hidden">
                                    <div className="py-1">
                                        <button onClick={() => { setShowActions(false); onEditProduct?.(product, 1); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-gray-700 text-sm font-medium border-b border-gray-50">
                                            <Edit className="w-4 h-4" />
                                            <span>Editar item</span>
                                        </button>
                                        <button onClick={handleDuplicate} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-gray-700 text-sm font-medium border-b border-gray-50">
                                            <Copy className="w-4 h-4" />
                                            <span>Duplicar item</span>
                                        </button>
                                        <button onClick={handleCopyLink} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-gray-700 text-sm font-medium border-b border-gray-50">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                                            <span>Copiar link</span>
                                        </button>
                                        <button onClick={() => { setShowActions(false); onEditProduct?.(product, 2); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-gray-700 text-sm font-medium border-b border-gray-50">
                                            <PlusCircle className="w-4 h-4" />
                                            <span>Editar adicionais</span>
                                        </button>
                                        <button onClick={(e) => handleDelete(e)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-red-500 text-sm font-medium border-b border-gray-50 text-red-500">
                                            <Trash2 className="w-4 h-4" />
                                            <span>Excluir item</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="hidden md:flex items-center gap-8 flex-shrink-0">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 font-medium whitespace-nowrap">Controle Qtd</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={product.has_quantity} onChange={handleToggleQuantity} />
                                    <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-blue-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                                </label>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 font-medium whitespace-nowrap">Estoque</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={product.track_stock} onChange={handleToggleStock} />
                                    <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-blue-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                                </label>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 font-medium whitespace-nowrap">Esgotar item</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={!product.is_available} onChange={handleToggleAvailability} />
                                    <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-gray-400 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                                </label>
                            </div>
                            <button onClick={() => onEditProduct?.(product, 1)} className="text-gray-400 hover:text-gray-600"><Edit size={20} /></button>
                        </div>
                    </div>

                    <div className="md:hidden bg-white border border-gray-100 rounded-xl p-3 flex items-center justify-between shadow-sm mt-3">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 uppercase font-bold">A partir de</span>
                            <span className="font-bold text-gray-800">R$ {Number(product.price).toFixed(2).replace('.', ',')}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={() => onEditProduct?.(product, 1)} className="w-10 h-10 border border-gray-200 rounded-xl flex items-center justify-center text-gray-400"><Edit size={16} /></button>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={!product.is_available} onChange={handleToggleAvailability} />
                                <div className="w-10 h-5.5 bg-gray-200 rounded-full peer peer-checked:bg-gray-400 after:content-[''] after:absolute after:top-[2.5px] after:left-[2px] after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:after:translate-x-full"></div>
                            </label>
                        </div>
                    </div>
                </div>

                <button onClick={toggleExpand} className={`hidden md:block transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''} text-[#0099FF]`}>
                    <ChevronDown size={24} />
                </button>
            </div>

            <div className={`md:hidden px-4 pb-4 ${isExpanded ? 'hidden' : 'block'}`}>
                <button onClick={toggleExpand} className="w-full py-2.5 rounded-lg font-bold text-sm bg-white border border-gray-200 text-gray-500 uppercase flex items-center justify-center gap-2">
                    <ChevronDown size={18} />
                    Ver Adicionais
                </button>
            </div>

            {isExpanded && (
                <div className="bg-gray-50 p-3 md:p-4 border-t border-gray-100">
                    <div className="md:hidden mb-3">
                        <button onClick={toggleExpand} className="w-full py-2.5 rounded-lg font-bold text-sm bg-[#0099FF] text-white flex items-center justify-center gap-2 shadow-lg shadow-blue-100">
                            <ChevronDown size={18} className="rotate-180" />
                            Esconder Adicionais
                        </button>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        {isLoadingAddons ? (
                            <div className="p-4 text-center text-gray-500 text-sm italic">Carregando...</div>
                        ) : addonGroups.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm italic">Nenhum adicional.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/50 border-b border-gray-100">
                                            <th className="px-4 py-2 text-[10px] text-gray-400 uppercase font-bold">Adicional</th>
                                            <th className="hidden md:table-cell px-4 py-2 text-[10px] text-gray-400 uppercase font-bold text-center">Qtd</th>
                                            <th className="px-4 py-2 text-[10px] text-gray-400 uppercase font-bold text-center">Preço</th>
                                            <th className="px-4 py-2 text-[10px] text-gray-400 uppercase font-bold text-center">Esgotar</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {addonGroups.map(group => (
                                            <React.Fragment key={group.id}>
                                                <tr className="bg-gray-50/30">
                                                    <td colSpan={4} className="px-4 py-2 text-xs font-bold text-gray-700">
                                                        {group.name} <span className="text-[10px] text-gray-400 font-normal">({group.min_quantity}-{group.max_quantity})</span>
                                                    </td>
                                                </tr>
                                                {group.addons.map((addon: any) => (
                                                    <tr key={addon.id} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-4 py-3 text-sm text-gray-700 font-medium">{addon.name}</td>
                                                        <td className="hidden md:table-cell px-4 py-3 text-center text-xs text-gray-500">Máx. {addon.max_quantity}</td>
                                                        <td className="px-4 py-3 text-center text-sm font-bold text-gray-700">R$ {Number(addon.price).toFixed(2).replace('.', ',')}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <label className="relative inline-flex items-center cursor-pointer">
                                                                <input type="checkbox" className="sr-only peer" checked={!addon.is_available} readOnly />
                                                                <div className="w-9 h-5 bg-gray-200 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full peer-checked:bg-gray-400"></div>
                                                            </label>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showDeleteModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center space-y-4">
                        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 mx-auto"><Trash2 size={24} /></div>
                        <h3 className="text-lg font-bold text-gray-900">Excluir Produto?</h3>
                        <p className="text-gray-500 text-sm">Você tem certeza que deseja excluir <strong>{product.name}</strong>?</p>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg">Cancelar</button>
                            <button onClick={confirmDelete} className="flex-1 px-4 py-2 bg-red-500 text-white font-medium rounded-lg">{isDeleting ? 'Excluindo...' : 'Excluir'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const CategoryCard = ({ id, name, isPromo = false, onDelete, onAddProduct, onEditProduct, onEditCategory, dragAttributes, dragListeners }: CategoryCardProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showActions, setShowActions] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);
    const [addonRefreshVersion, setAddonRefreshVersion] = useState(0);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('category_id', id)
                .order('order_index', { ascending: true, nullsFirst: false })
                .order('created_at', { ascending: false });
            if (error) throw error;
            setProducts(data || []);
            setHasFetched(true);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleOpen = async () => {
        const newState = !isOpen;
        setIsOpen(newState);
        if (newState && !hasFetched) fetchProducts();
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setProducts((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                const newItems = arrayMove(items, oldIndex, newIndex);
                updateOrder(newItems);
                return newItems;
            });
        }
    };

    const updateOrder = async (newItems: any[]) => {
        try {
            const updates = newItems.map((item, index) =>
                supabase.from('products').update({ order_index: index }).eq('id', item.id)
            );
            await Promise.all(updates);
        } catch (error) { console.error('Order Error:', error); }
    };

    const [isBulkAddonsModalOpen, setIsBulkAddonsModalOpen] = useState(false);
    const [isBulkRemoveConfirmOpen, setIsBulkRemoveConfirmOpen] = useState(false);
    const [isBulkAdding, setIsBulkAdding] = useState(false);

    const handleBulkAddAddons = async (selectedGroups: any[]) => {
        if (!selectedGroups || selectedGroups.length === 0) return;
        setIsBulkAdding(true);
        try {
            const groupIds = selectedGroups.map(g => g.id);
            const { data: templateItems } = await supabase.from('addon_items').select('*').in('group_id', groupIds);
            const { data: categoryProducts } = await supabase.from('products').select('id').eq('category_id', id);

            if (!categoryProducts || categoryProducts.length === 0) {
                alert('Sem produtos nesta categoria.');
                return;
            }

            for (const prod of categoryProducts) {
                for (const group of selectedGroups) {
                    const { data: newGroup, error: groupInsertError } = await supabase
                        .from('product_addon_groups')
                        .insert({
                            product_id: prod.id,
                            name: group.name,
                            min_quantity: group.min_quantity,
                            max_quantity: group.max_quantity,
                            is_required: group.is_required,
                            display_order: 0
                        }).select().single();

                    if (groupInsertError) continue;

                    const itemsForGroup = templateItems?.filter((i: any) => i.group_id === group.id) || [];
                    if (itemsForGroup.length > 0) {
                        const itemsToInsert = itemsForGroup.map((item: any) => ({
                            group_id: newGroup.id,
                            name: item.name,
                            price: item.price,
                            max_quantity: item.max_quantity !== undefined ? item.max_quantity : (item.is_max ? 1 : 0),
                            is_available: true
                        }));
                        await supabase.from('product_addons').insert(itemsToInsert);
                    }
                }
            }
            alert('Adicionais aplicados!');
            if (isOpen) {
                setAddonRefreshVersion(prev => prev + 1);
                fetchProducts();
            }
        } catch (error) { console.error('Bulk Error:', error); } finally { setIsBulkAdding(false); }
    };

    const confirmBulkRemove = async () => {
        setIsBulkRemoveConfirmOpen(false);
        setIsBulkAdding(true);
        try {
            const { data: categoryProducts } = await supabase.from('products').select('id').eq('category_id', id);
            const productIds = categoryProducts?.map(p => p.id) || [];
            if (productIds.length > 0) {
                const { data: groupsToDelete } = await supabase.from('product_addon_groups').select('id').in('product_id', productIds);
                const gIds = groupsToDelete?.map(g => g.id) || [];
                if (gIds.length > 0) {
                    await supabase.from('product_addons').delete().in('group_id', gIds);
                    await supabase.from('product_addon_groups').delete().in('id', gIds);
                    alert('Adicionais removidos!');
                    if (isOpen) {
                        setAddonRefreshVersion(prev => prev + 1);
                        fetchProducts();
                    }
                }
            }
        } catch (error) { console.error('Bulk Delete Error:', error); } finally { setIsBulkAdding(false); }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setShowActions(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <>
            <div className="rounded-lg shadow-sm border border-gray-200 bg-white mb-4 relative overflow-hidden">
                {isPromo && <div className="bg-[#FFA502] text-white text-[10px] font-bold text-center py-1 uppercase tracking-wider">Promoção</div>}

                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="cursor-grab text-gray-300 hover:text-gray-500" {...dragAttributes} {...dragListeners}><GripVertical size={20} /></div>
                        <div className="flex-1">
                            <h3 className="text-gray-700 font-bold text-lg">{name}</h3>
                            <div className="flex gap-2 mt-1">
                                <span className="bg-blue-50 text-[#0099FF] text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-tight">Itens da categoria</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="md:hidden relative" ref={dropdownRef}>
                            <button onClick={() => setShowActions(!showActions)} className={`w-10 h-10 rounded-xl flex items-center justify-center border ${showActions ? 'bg-[#0099FF] text-white' : 'bg-white text-gray-400 border-gray-200'}`}><Settings size={20} /></button>
                            {showActions && (
                                <div className="fixed right-6 top-1/2 -translate-y-1/2 w-64 bg-white border border-gray-200 rounded-xl shadow-2xl z-[110] overflow-hidden">
                                    <div className="py-1">
                                        <button onClick={() => { setShowActions(false); onEditCategory?.(); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-gray-700 text-sm font-medium border-b border-gray-50"><Edit size={16} /><span>Editar</span></button>
                                        <button onClick={() => { setShowActions(false); setIsBulkAddonsModalOpen(true); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-gray-700 text-sm font-medium border-b border-gray-50"><Layers size={16} /><span>Editar adicionais</span></button>
                                        <button onClick={() => { setShowActions(false); setIsBulkRemoveConfirmOpen(true); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-red-500 text-sm font-medium border-b border-gray-50"><Trash2 size={16} /><span>Excluir adicionais</span></button>
                                        <button onClick={() => { setShowActions(false); onDelete?.(); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-red-500 text-sm font-medium text-red-500"><Trash2 size={16} /><span>Excluir</span></button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="hidden md:block relative" ref={dropdownRef}>
                            <button onClick={() => setShowActions(!showActions)} className={`p-1.5 border border-gray-300 rounded text-gray-500 hover:bg-gray-50 bg-white ${showActions ? 'border-[#0099FF] text-[#0099FF]' : ''}`}><Settings size={20} /></button>
                            {showActions && (
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-[50] overflow-hidden py-1">
                                    <button onClick={() => { setShowActions(false); onEditCategory?.(); }} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-blue-50 hover:text-[#0099FF] text-left transition-colors"><Edit size={16} /><span>Editar</span></button>
                                    <button onClick={() => { setShowActions(false); setIsBulkAddonsModalOpen(true); }} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-blue-50 hover:text-[#0099FF] text-left transition-colors"><Layers size={16} /><span>Editar adicionais</span></button>
                                    <button onClick={() => { setShowActions(false); setIsBulkRemoveConfirmOpen(true); }} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 hover:text-red-500 text-left transition-colors"><Trash2 size={16} /><span>Excluir adicionais</span></button>
                                    <button onClick={() => { setShowActions(false); onDelete?.(); }} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 hover:text-red-500 text-left transition-colors"><Trash2 size={16} /><span>Excluir</span></button>
                                </div>
                            )}
                        </div>

                        <button onClick={toggleOpen} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all ${isOpen ? 'bg-[#0099FF] text-white' : 'bg-gray-50 text-gray-400 border border-gray-200'}`}>
                            <ChevronDown size={18} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                            <span>Ver itens</span>
                        </button>
                    </div>
                </div>

                {isOpen && (
                    <div className="bg-white border-t border-gray-100">
                        {isLoading ? (
                            <div className="p-10 text-center text-gray-500 italic">Carregando itens...</div>
                        ) : products.length === 0 ? (
                            <div className="p-10 text-center text-gray-400 italic">Nenhum item nesta categoria.</div>
                        ) : (
                            <div>
                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                    <SortableContext items={products.map(p => p.id)} strategy={verticalListSortingStrategy}>
                                        {products.map((product) => (
                                            <ProductItem key={product.id} product={product} onEditProduct={onEditProduct} onRefresh={fetchProducts} addonRefreshTrigger={addonRefreshVersion} />
                                        ))}
                                    </SortableContext>
                                </DndContext>
                                <div className="md:hidden flex justify-center py-6 border-t border-gray-50">
                                    <button onClick={onAddProduct} className="flex items-center gap-2 text-[#0099FF] font-bold uppercase text-sm active:scale-95 transition-all">
                                        <PlusCircle size={20} strokeWidth={3} />
                                        <span>Adicionar Item</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <ImportAddonGroupModal isOpen={isBulkAddonsModalOpen} onClose={() => setIsBulkAddonsModalOpen(false)} onImport={handleBulkAddAddons} existingGroupIds={[]} />

            {isBulkRemoveConfirmOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center space-y-4">
                        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 mx-auto"><Trash2 size={24} /></div>
                        <h3 className="text-lg font-bold text-gray-900">Excluir todos os adicionais?</h3>
                        <p className="text-gray-500 text-sm">Isso removerá <strong>TODOS</strong> os grupos de adicionais de <strong>TODOS</strong> os produtos desta categoria.</p>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setIsBulkRemoveConfirmOpen(false)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg">Cancelar</button>
                            <button onClick={confirmBulkRemove} className="flex-1 px-4 py-2 bg-red-500 text-white font-medium rounded-lg">{isBulkAdding ? 'Excluindo...' : 'Sim, excluir'}</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default CategoryCard;
