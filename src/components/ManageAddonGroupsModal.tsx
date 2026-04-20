import { X, Search, Plus, ChevronDown, ChevronUp, Edit3, Copy, Trash2, Image as ImageIcon, Minus, GripVertical } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useEstablishment } from '../contexts/EstablishmentContext';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import toast from 'react-hot-toast';

// Sortable Row Component
const SortableGroupRow = ({ group, children, isDropdownOpen }: any) => {
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
        zIndex: isDragging ? 50 : (isDropdownOpen ? 40 : 'auto'),
        position: 'relative' as const,
        opacity: isDragging ? 0.8 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className={`border border-gray-200 rounded-lg transition-colors bg-white mb-3 ${isDragging ? 'shadow-xl ring-2 ring-blue-500 border-blue-500' : 'hover:border-gray-300'}`}>
            <div className="flex items-stretch bg-white rounded-lg">
                {/* Drag Handle - Full Height */}
                <div
                    {...attributes}
                    {...listeners}
                    className="flex flex-col justify-center px-2 bg-gray-50 border-r border-gray-100 text-gray-400 hover:text-[#0099FF] hover:bg-blue-50 cursor-grab active:cursor-grabbing touch-none transition-colors rounded-l-lg"
                    title="Arrastar para reordenar"
                >
                    <GripVertical size={20} />
                </div>

                <div className="flex-1 p-4">
                    {children}
                </div>
            </div>
        </div>
    );
};

// Sortable Item Component
const SortableAddonItem = ({ item, children }: any) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        position: 'relative' as const,
        opacity: isDragging ? 0.8 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className={`flex items-start gap-3 p-2 rounded-lg transition-colors bg-white ${isDragging ? 'shadow-lg ring-2 ring-blue-500 bg-blue-50' : ''}`}>
            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className="mt-8 text-gray-400 hover:text-[#0099FF] cursor-grab active:cursor-grabbing p-1 rounded hover:bg-blue-50 transition-colors"
                title="Arrastar para reordenar"
            >
                <GripVertical size={20} />
            </div>
            {children}
        </div>
    );
};

interface ManageAddonGroupsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface AddonItem {
    id: number;
    name: string;
    price: string;
    isMax?: boolean; // The toggle in the UI
}

interface AddonGroup {
    id: number;
    name: string;
    description: string;
    isRequired: boolean;
    min: number;
    max: number;
    selectionMode: 'QUANTITY' | 'SELECTION' | 'BOX';
    items: AddonItem[];
}

const ManageAddonGroupsModal = ({ isOpen, onClose }: ManageAddonGroupsModalProps) => {
    const { establishment } = useEstablishment();
    // Data State
    const [groups, setGroups] = useState<AddonGroup[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // View State
    const [view, setView] = useState<'list' | 'edit' | 'create'>('list');
    const [, setEditingGroup] = useState<AddonGroup | null>(null);

    // Form State
    const [formData, setFormData] = useState<AddonGroup>({
        id: 0,
        name: '',
        description: '',
        isRequired: false,
        min: 0,
        max: 1,
        selectionMode: 'QUANTITY',
        items: []
    });

    // List State
    const [expandedGroupIds, setExpandedGroupIds] = useState<number[]>([]);
    const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null);
    const [deleteConfirmationId, setDeleteConfirmationId] = useState<number | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch Groups
    const fetchGroups = async () => {
        if (!establishment?.id) return;
        setIsLoading(true);
        try {
            const { data: groupsData, error: groupsError } = await supabase
                .from('addon_groups')
                .select('*')
                .eq('establishment_id', establishment.id)
                .order('display_order', { ascending: true })
                .order('created_at', { ascending: false });

            if (groupsError) throw groupsError;

            if (groupsData) {
                // Fetch items for all groups
                const groupIds = groupsData.map(g => g.id);
                const { data: itemsData, error: itemsError } = await supabase
                    .from('addon_items')
                    .select('*')
                    .in('group_id', groupIds)
                    .order('display_order', { ascending: true });

                if (itemsError) throw itemsError;

                const formattedGroups: AddonGroup[] = groupsData.map(g => ({
                    id: g.id,
                    name: g.name,
                    description: g.description || '',
                    isRequired: g.is_required,
                    min: g.min_quantity,
                    max: g.max_quantity,
                    selectionMode: (g.selection_mode as 'QUANTITY' | 'SELECTION' | 'BOX') || 'QUANTITY',
                    items: itemsData?.filter(i => i.group_id === g.id).map(i => ({
                        id: i.id,
                        name: i.name,
                        price: Number(i.price).toFixed(2).replace('.', ','),
                        isMax: i.is_max
                    })) || []
                }));

                setGroups(formattedGroups);
            }
        } catch (error) {
            console.error('Error fetching groups:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && establishment?.id) {
            fetchGroups();
        }
    }, [isOpen, establishment?.id]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setActiveDropdownId(null);
            }
        };
        if (activeDropdownId !== null) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeDropdownId]);

    const toggleGroup = (id: number) => {
        setExpandedGroupIds(prev => prev.includes(id) ? prev.filter(gId => gId !== id) : [...prev, id]);
    };

    const handleEdit = (group: AddonGroup) => {
        setEditingGroup(group);
        setFormData({ ...group });
        setView('edit');
        setActiveDropdownId(null);
    };



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

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = groups.findIndex((i) => i.id === active.id);
            const newIndex = groups.findIndex((i) => i.id === over.id);

            if (oldIndex === -1 || newIndex === -1) return;

            const newGroups = arrayMove(groups, oldIndex, newIndex);

            // Optimistic update
            setGroups(newGroups);

            try {
                // Update Display Order in Database
                const updates = newGroups.map((item, index) => ({
                    id: item.id,
                    display_order: index
                }));

                // Run updates in parallel
                const { error } = await supabase.from('addon_groups').upsert(
                    updates.map(u => ({
                        id: u.id,
                        display_order: u.display_order,
                        establishment_id: establishment?.id // Upsert needs full model or we use standard update loop
                    }))
                );

                if (error) {
                    // If upsert fails or is complex (missing fields), use sequential update
                    for (const update of updates) {
                        await supabase
                            .from('addon_groups')
                            .update({ display_order: update.display_order })
                            .eq('id', update.id);
                    }
                }
            } catch (err) {
                console.error('Error saving new order:', err);
                toast.error('Erro ao salvar nova ordem');
                // Optional: rollback state if needed
            }
        }
    };

    const handleDelete = async (groupId: number) => {
        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('addon_groups')
                .delete()
                .eq('id', groupId);

            if (error) throw error;
            fetchGroups();
            toast.success('Grupo excluído com sucesso!');
        } catch (error) {
            console.error('Error deleting group:', error);
            toast.error('Erro ao excluir grupo');
        } finally {
            setIsLoading(false);
            setDeleteConfirmationId(null);
        }
    };

    const handleCreate = () => {
        setEditingGroup(null);
        setFormData({
            id: 0,
            name: '',
            description: '',
            isRequired: false,
            min: 0,
            max: 1,
            selectionMode: 'QUANTITY',
            items: [
                { id: Date.now(), name: '', price: '0,00', isMax: false }
            ]
        });
        setView('create');
    };

    // Handle drag end for items
    const handleDragEndItems = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setFormData((prev) => {
                const oldIndex = prev.items.findIndex((item) => item.id === active.id);
                const newIndex = prev.items.findIndex((item) => item.id === over?.id);

                return {
                    ...prev,
                    items: arrayMove(prev.items, oldIndex, newIndex),
                };
            });
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            // 1. Upsert Group
            const groupData = {
                name: formData.name,
                description: formData.description,
                is_required: formData.isRequired,
                min_quantity: formData.min,
                max_quantity: formData.max,
                selection_mode: formData.selectionMode
            };

            let groupId = formData.id;

            if (view === 'create') {
                if (!establishment?.id) throw new Error('Missing establishment ID');
                const { data, error } = await supabase
                    .from('addon_groups')
                    .insert({ ...groupData, establishment_id: establishment.id })
                    .select()
                    .single();

                if (error) throw error;
                groupId = data.id;
            } else {
                const { error } = await supabase
                    .from('addon_groups')
                    .update(groupData)
                    .eq('id', groupId);

                if (error) throw error;

                // PROPAGATION: Update Linked Product Groups
                await supabase.from('product_addon_groups')
                    .update({
                        name: groupData.name,
                        min_quantity: groupData.min_quantity,
                        max_quantity: groupData.max_quantity,
                        is_required: groupData.is_required,
                        selection_mode: groupData.selection_mode
                    })
                    .eq('original_group_id', groupId);
            }

            // 2. Handle Items with Diff & Propagation
            // Fetch current DB items to identify deletions
            const { data: currentDbItems } = await supabase
                .from('addon_items')
                .select('id')
                .eq('group_id', groupId);

            const currentDbIds = currentDbItems?.map(i => i.id) || [];

            // Identify IDs from form (exclude temp IDs which are timestamps)
            // Assuming IDs < 1000000000000 are DB IDs (auto-increment usually small, timestamps huge)
            const isTempId = (id: number) => id > 1000000000000;

            const formItemIds = formData.items
                .filter(i => !isTempId(i.id))
                .map(i => i.id);

            // DELETE
            const idsToDelete = currentDbIds.filter(id => !formItemIds.includes(id));
            if (idsToDelete.length > 0) {
                // Delete from master
                await supabase.from('addon_items').delete().in('id', idsToDelete);
                // Propagate delete to products
                await supabase.from('product_addons').delete().in('original_item_id', idsToDelete);
            }

            // UPDATE EXISTING
            const itemsToUpdate = formData.items.filter(i => !isTempId(i.id));

            // Sequential update to avoid race conditions and use index
            for (let index = 0; index < itemsToUpdate.length; index++) {
                const item = itemsToUpdate[index];
                const priceVal = parseFloat(item.price.replace(/\./g, '').replace(',', '.'));
                const isMax = !!item.isMax;

                // Update Master
                await supabase.from('addon_items').update({
                    name: item.name,
                    price: priceVal,
                    is_max: isMax,
                    display_order: index
                }).eq('id', item.id);

                // Propagate Update
                await supabase.from('product_addons').update({
                    name: item.name,
                    price: priceVal,
                    max_quantity: isMax ? 1 : 0
                }).eq('original_item_id', item.id);
            }

            // INSERT NEW
            const itemsToInsert = formData.items.filter(i => isTempId(i.id));
            for (const item of itemsToInsert) {
                // Find global index in formData.items
                const index = formData.items.findIndex(fi => fi.id === item.id);
                const priceVal = parseFloat(item.price.replace(/\./g, '').replace(',', '.'));
                const isMax = !!item.isMax;

                const { data: newDbItem, error: insertError } = await supabase
                    .from('addon_items')
                    .insert({
                        group_id: groupId,
                        name: item.name,
                        price: priceVal,
                        is_max: isMax,
                        display_order: index
                    })
                    .select()
                    .single();

                if (insertError) throw insertError;

                // Propagate Insert: Add to all products that have this group linked
                if (newDbItem) {
                    const { data: linkedGroups } = await supabase
                        .from('product_addon_groups')
                        .select('id')
                        .eq('original_group_id', groupId);

                    if (linkedGroups && linkedGroups.length > 0) {
                        const newProductAddons = linkedGroups.map(lg => ({
                            group_id: lg.id,
                            name: newDbItem.name,
                            price: priceVal,
                            max_quantity: isMax ? 1 : 0,
                            original_item_id: newDbItem.id,
                            is_available: true
                        }));

                        await supabase.from('product_addons').insert(newProductAddons);
                    }
                }
            }

            await fetchGroups();
            setView('list');

        } catch (error) {
            console.error('Error saving group:', error);
            alert('Erro ao salvar grupo. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { id: Date.now(), name: '', price: '0,00', isMax: false }]
        });
    };

    const handleRemoveItem = (itemId: number) => {
        setFormData({
            ...formData,
            items: formData.items.filter(i => i.id !== itemId)
        });
    };

    const updateItem = (itemId: number, field: keyof AddonItem, value: any) => {
        setFormData({
            ...formData,
            items: formData.items.map(i => i.id === itemId ? { ...i, [field]: value } : i)
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <div className={`bg-white rounded-lg shadow-xl w-full ${view === 'list' ? 'max-w-3xl' : 'max-w-5xl'} flex flex-col max-h-[90vh] transition-all`}>

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">
                        {view === 'list' ? 'Gerenciar grupos de adicionais' : (view === 'edit' ? 'Editar grupo de adicionais' : 'Criar grupo de adicionais')}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading && view === 'list' && groups.length === 0 ? (
                        <div className="flex justify-center p-8"><span className="text-gray-500">Carregando...</span></div>
                    ) : (
                        <>
                            {/* LIST VIEW */}
                            {view === 'list' && (
                                <>
                                    {/* Controls */}
                                    <div className="flex items-center justify-between mb-6 gap-4">
                                        <div className="relative flex-1">
                                            <input
                                                type="text"
                                                placeholder="Pesquisar"
                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-600"
                                            />
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                                <Search size={18} />
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleCreate}
                                            className="px-6 py-2.5 bg-[#0099FF] text-white font-medium rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                                        >
                                            <div className="rounded-full border border-white/40 p-0.5">
                                                <Plus size={14} />
                                            </div>
                                            Criar Novo Grupo
                                        </button>
                                    </div>

                                    {/* Groups List */}
                                    <div className="mb-4">
                                        <h3 className="text-lg font-bold text-gray-700 mb-4">Grupos de adicionais</h3>
                                        <DndContext
                                            sensors={sensors}
                                            collisionDetection={closestCenter}
                                            onDragEnd={handleDragEnd}
                                        >
                                            <SortableContext
                                                items={groups.map(g => g.id)}
                                                strategy={verticalListSortingStrategy}
                                            >
                                                <div className="space-y-3">
                                                    {groups.map((group) => {
                                                        const isExpanded = expandedGroupIds.includes(group.id);
                                                        const isDropdownOpen = activeDropdownId === group.id;

                                                        return (
                                                            <SortableGroupRow key={group.id} group={group} isDropdownOpen={isDropdownOpen}>
                                                                <div className="flex items-start justify-between w-full">
                                                                    <div>
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <h4 className="font-bold text-gray-700 text-lg leading-tight">{group.name}</h4>
                                                                            {group.isRequired ? (
                                                                                <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200 uppercase tracking-wide">
                                                                                    Obrigatório
                                                                                </span>
                                                                            ) : (
                                                                                <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-200 uppercase tracking-wide">
                                                                                    Opcional
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <p className="text-gray-500 text-sm">{group.description}</p>

                                                                        {isExpanded && (
                                                                            <div className="mt-4 space-y-2">
                                                                                {group.items.map(item => (
                                                                                    <div key={item.id} className="flex items-center gap-8 text-sm font-medium text-gray-700 p-2 bg-gray-50 rounded">
                                                                                        <span className="flex-1">{item.name}</span>
                                                                                        <span className="font-bold text-gray-900">
                                                                                            {Number(item.price.replace(',', '.')) > 0 ? `+ R$ ${item.price}` : 'Grátis'}
                                                                                        </span>
                                                                                    </div>
                                                                                ))}
                                                                                {group.items.length === 0 && (
                                                                                    <div className="text-sm text-gray-400 italic py-2">Nenhum item cadastrado neste grupo</div>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    <div className="flex gap-2 relative">
                                                                        <div className="relative" ref={isDropdownOpen ? dropdownRef : null}>
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    // Prevent drag interference
                                                                                    setActiveDropdownId(isDropdownOpen ? null : group.id);
                                                                                }}
                                                                                onPointerDown={(e) => e.stopPropagation()} // Stop drag start
                                                                                className={`px-4 py-2 bg-white border rounded text-sm font-medium flex items-center gap-2 transition-colors
                                                                                ${isDropdownOpen ? 'bg-[#0099FF] text-white border-[#0099FF]' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}
                                                                            `}
                                                                            >
                                                                                Ações
                                                                                <ChevronDown size={14} className={isDropdownOpen ? 'rotate-180' : ''} />
                                                                            </button>

                                                                            {isDropdownOpen && (
                                                                                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10 overflow-hidden" onPointerDown={(e) => e.stopPropagation()}>
                                                                                    {deleteConfirmationId === group.id ? (
                                                                                        <div className="px-4 py-3 bg-red-50">
                                                                                            <p className="text-xs font-bold text-red-700 mb-2">Tem certeza?</p>
                                                                                            <div className="flex gap-2">
                                                                                                <button
                                                                                                    onClick={(e) => {
                                                                                                        e.stopPropagation();
                                                                                                        // Logic to delete is separate
                                                                                                        // But we need to handle delete logic here or pass it down
                                                                                                        setDeleteConfirmationId(null);
                                                                                                        // Actually call delete
                                                                                                        handleDelete(group.id);
                                                                                                    }}
                                                                                                    className="flex-1 bg-red-600 text-white text-xs py-1.5 rounded hover:bg-red-700 font-bold"
                                                                                                >
                                                                                                    Sim
                                                                                                </button>
                                                                                                <button
                                                                                                    onClick={(e) => {
                                                                                                        e.stopPropagation();
                                                                                                        setDeleteConfirmationId(null);
                                                                                                    }}
                                                                                                    className="flex-1 bg-white text-gray-600 border border-gray-300 text-xs py-1.5 rounded hover:bg-gray-50 font-bold"
                                                                                                >
                                                                                                    Não
                                                                                                </button>
                                                                                            </div>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <>
                                                                                            <button
                                                                                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition-colors text-left"
                                                                                                onClick={() => handleEdit(group)}
                                                                                            >
                                                                                                <Edit3 size={16} />
                                                                                                Editar
                                                                                            </button>
                                                                                            <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition-colors text-left" onClick={() => setActiveDropdownId(null)}>
                                                                                                <Copy size={16} /> Duplicar
                                                                                            </button>
                                                                                            <button
                                                                                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors text-left"
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    setDeleteConfirmationId(group.id);
                                                                                                }}
                                                                                            >
                                                                                                <Trash2 size={16} /> Excluir
                                                                                            </button>
                                                                                        </>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        <button
                                                                            onClick={() => toggleGroup(group.id)}
                                                                            onPointerDown={(e) => e.stopPropagation()}
                                                                            className="p-2 border border-gray-300 rounded text-gray-400 hover:bg-gray-50 transition-colors"
                                                                        >
                                                                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </SortableGroupRow>
                                                        );
                                                    })}
                                                </div>
                                            </SortableContext>
                                        </DndContext>
                                        <div className="text-center text-sm text-gray-500 mt-4">
                                            Exibindo {groups.length} de {groups.length} adicionais
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* EDIT / CREATE VIEW */}
                            {(view === 'edit' || view === 'create') && (
                                <div className="space-y-8">
                                    {/* Top Inputs */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Nome do grupo *</label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700"
                                                placeholder="Ex: Turbine seu lanche"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Apelido</label>
                                            <input
                                                type="text"
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700"
                                                placeholder="Ex: Turbine seu lanche"
                                            />
                                        </div>
                                    </div>

                                    {/* ... rest of your form ... */}
                                    {/* For brevity, I'm assuming the toggle/radio/limits sections are similar but need to bound to formData */}

                                    {/* Options Radio */}
                                    <div>
                                        <div className="space-y-3">
                                            <label className="flex items-start gap-3 cursor-pointer">
                                                <div className="relative mt-1">
                                                    <input
                                                        type="radio"
                                                        name="requirement"
                                                        className="hidden"
                                                        checked={!formData.isRequired}
                                                        onChange={() => setFormData({ ...formData, isRequired: false })}
                                                    />
                                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${!formData.isRequired ? 'border-[#0099FF]' : 'border-gray-300'}`}>
                                                        {!formData.isRequired && <div className="w-2.5 h-2.5 bg-[#0099FF] rounded-full" />}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="block font-bold text-gray-700">Opcional</span>
                                                    <span className="block text-sm text-gray-500">Seu cliente pode optar por não escolher adicionais</span>
                                                </div>
                                            </label>

                                            <label className="flex items-start gap-3 cursor-pointer">
                                                <div className="relative mt-1">
                                                    <input
                                                        type="radio"
                                                        name="requirement"
                                                        className="hidden"
                                                        checked={formData.isRequired}
                                                        onChange={() => setFormData({ ...formData, isRequired: true })}
                                                    />
                                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${formData.isRequired ? 'border-[#0099FF]' : 'border-gray-300'}`}>
                                                        {formData.isRequired && <div className="w-2.5 h-2.5 bg-[#0099FF] rounded-full" />}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="block font-bold text-gray-700">Obrigatório</span>
                                                    <span className="block text-sm text-gray-500">Seu cliente precisa escolher adicionais</span>
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    <hr className="border-gray-100" />

                                    {/* Quantity Limits */}
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-400 mb-4">Quantos adicionais seu cliente pode escolher?</h4>
                                        <div className="flex gap-12">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Mínimo</label>
                                                <div className="flex items-center border border-gray-300 rounded-lg">
                                                    <button
                                                        onClick={() => setFormData(prev => ({ ...prev, min: Math.max(0, prev.min - 1) }))}
                                                        className="p-3 text-gray-400 hover:bg-gray-50 hover:text-gray-600 border-r border-gray-300"
                                                    >
                                                        <Minus size={16} />
                                                    </button>
                                                    <input
                                                        type="number"
                                                        value={formData.min}
                                                        readOnly
                                                        className="w-16 text-center text-gray-700 font-medium focus:outline-none"
                                                    />
                                                    <button
                                                        onClick={() => setFormData(prev => ({ ...prev, min: prev.min + 1 }))}
                                                        className="p-3 text-gray-400 hover:bg-gray-50 hover:text-gray-600 border-l border-gray-300"
                                                    >
                                                        <Plus size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Máximo</label>
                                                <div className="flex items-center border border-gray-300 rounded-lg">
                                                    <button
                                                        onClick={() => setFormData(prev => ({ ...prev, max: Math.max(0, prev.max - 1) }))}
                                                        className="p-3 text-gray-400 hover:bg-gray-50 hover:text-gray-600 border-r border-gray-300"
                                                    >
                                                        <Minus size={16} />
                                                    </button>
                                                    <input
                                                        type="number"
                                                        value={formData.max}
                                                        readOnly
                                                        className="w-16 text-center text-gray-700 font-medium focus:outline-none"
                                                    />
                                                    <button
                                                        onClick={() => setFormData(prev => ({ ...prev, max: prev.max + 1 }))}
                                                        className="p-3 text-gray-400 hover:bg-gray-50 hover:text-gray-600 border-l border-gray-300"
                                                    >
                                                        <Plus size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <hr className="border-gray-100" />

                                    {/* Selection Mode */}
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-400 mb-4">Como o cliente escolhe?</h4>
                                        <div className="space-y-3">
                                            <label className="flex items-start gap-3 cursor-pointer">
                                                <div className="relative mt-1">
                                                    <input
                                                        type="radio"
                                                        name="selectionMode"
                                                        className="hidden"
                                                        checked={formData.selectionMode === 'QUANTITY'}
                                                        onChange={() => setFormData({ ...formData, selectionMode: 'QUANTITY' })}
                                                    />
                                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${formData.selectionMode === 'QUANTITY' ? 'border-[#0099FF]' : 'border-gray-300'}`}>
                                                        {formData.selectionMode === 'QUANTITY' && <div className="w-2.5 h-2.5 bg-[#0099FF] rounded-full" />}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="block font-bold text-gray-700">Por Quantidade (+ / -)</span>
                                                    <span className="block text-sm text-gray-500">Ideal para adicionais que podem ter múltiplas porções (Ex: Bacon x2)</span>
                                                </div>
                                            </label>

                                            <label className="flex items-start gap-3 cursor-pointer">
                                                <div className="relative mt-1">
                                                    <input
                                                        type="radio"
                                                        name="selectionMode"
                                                        className="hidden"
                                                        checked={formData.selectionMode === 'SELECTION'}
                                                        onChange={() => setFormData({ ...formData, selectionMode: 'SELECTION' })}
                                                    />
                                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${formData.selectionMode === 'SELECTION' ? 'border-[#0099FF]' : 'border-gray-300'}`}>
                                                        {formData.selectionMode === 'SELECTION' && <div className="w-2.5 h-2.5 bg-[#0099FF] rounded-full" />}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="block font-bold text-gray-700">Seleção Simples (Check/Radio)</span>
                                                    <span className="block text-sm text-gray-500">Ideal para sabores ou opções únicas (Ex: Sabores de Tapioca)</span>
                                                </div>
                                            </label>

                                            <label className="flex items-start gap-3 cursor-pointer">
                                                <div className="relative mt-1">
                                                    <input
                                                        type="radio"
                                                        name="selectionMode"
                                                        className="hidden"
                                                        checked={formData.selectionMode === 'BOX'}
                                                        onChange={() => setFormData({ ...formData, selectionMode: 'BOX' })}
                                                    />
                                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${formData.selectionMode === 'BOX' ? 'border-[#0099FF]' : 'border-gray-300'}`}>
                                                        {formData.selectionMode === 'BOX' && <div className="w-2.5 h-2.5 bg-[#0099FF] rounded-full" />}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="block font-bold text-gray-700">Caixa de Seleção (Box / Grid)</span>
                                                    <span className="block text-sm text-gray-500">Exibe opções em caixas lado a lado. Ideal para categorias visuais (Ex: Caldas).</span>
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    <hr className="border-gray-100" />

                                    {/* Addons List */}
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-400 mb-4">Adicionais</h4>
                                        <DndContext
                                            sensors={sensors}
                                            collisionDetection={closestCenter}
                                            onDragEnd={handleDragEndItems}
                                        >
                                            <SortableContext
                                                items={formData.items.map(i => i.id)}
                                                strategy={verticalListSortingStrategy}
                                            >
                                                <div className="space-y-4">
                                                    {formData.items.map((item) => (
                                                        <SortableAddonItem key={item.id} item={item}>
                                                            <div className="flex-1 flex gap-4 items-center">
                                                                {/* Image Placeholder */}
                                                                <div className="w-32 h-26 rounded-lg border-2 border-dashed border-blue-200 bg-blue-50/20 flex flex-col items-center justify-center text-center p-2 cursor-pointer hover:bg-blue-50 transition-colors">
                                                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-500 mb-1">
                                                                        <ImageIcon size={20} />
                                                                    </div>
                                                                    <span className="text-[10px] font-bold text-gray-500">Escolha a foto</span>
                                                                    <span className="text-[9px] text-gray-400 leading-tight">Clique aqui ou arraste a foto para cá.</span>
                                                                </div>

                                                                {/* Inputs */}
                                                                <div className="flex-1 flex gap-4 items-center">
                                                                    <div className="flex-1">
                                                                        <label className="block text-xs font-bold text-gray-700 mb-1">Nome do adicional *</label>
                                                                        <div className="relative">
                                                                            <input
                                                                                type="text"
                                                                                value={item.name}
                                                                                onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                                                                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700"
                                                                            />
                                                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                                                                <Copy size={16} />
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="w-40">
                                                                        <label className="block text-xs font-bold text-gray-700 mb-1">Preço *</label>
                                                                        <div className="relative">
                                                                            <div className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center border-r border-gray-300 text-gray-500 font-bold bg-gray-50 rounded-l-lg">
                                                                                $
                                                                            </div>
                                                                            <input
                                                                                type="text"
                                                                                value={`R$ ${item.price}`}
                                                                                onChange={(e) => updateItem(item.id, 'price', e.target.value.replace(/[^0-9,]/g, ''))}
                                                                                className="w-full pl-12 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700"
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex items-center gap-2 mt-5">
                                                                        <button
                                                                            onClick={() => updateItem(item.id, 'isMax', !item.isMax)}
                                                                            className={`w-10 h-5 rounded-full relative transition-colors ${item.isMax ? 'bg-gray-400' : 'bg-gray-200'}`}
                                                                        >
                                                                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${item.isMax ? 'left-6' : 'left-1'}`} />
                                                                        </button>
                                                                        <span className="text-sm font-bold text-gray-700">Máximo</span>
                                                                    </div>

                                                                    <button
                                                                        onClick={() => handleRemoveItem(item.id)}
                                                                        className="mt-5 text-gray-400 hover:text-red-500 transition-colors"
                                                                    >
                                                                        <Trash2 size={20} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </SortableAddonItem>
                                                    ))}
                                                </div>
                                            </SortableContext>
                                        </DndContext>      <button
                                            onClick={handleAddItem}
                                            className="w-full py-3 bg-[#0099FF] text-white font-bold rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <div className="rounded-full border-2 border-white p-0.5">
                                                <Plus size={14} className="stroke-[3]" />
                                            </div>
                                            Novo Adicional
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                {view !== 'list' && (
                    <div className="p-6 border-t border-gray-100 flex gap-3">
                        <button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="px-8 py-2.5 bg-[#0099FF] text-white font-bold rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                        >
                            {isLoading ? 'Salvando...' : 'Salvar'}
                        </button>
                        <button
                            onClick={() => setView('list')}
                            className="px-8 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageAddonGroupsModal;
