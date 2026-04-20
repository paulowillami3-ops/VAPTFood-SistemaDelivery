import { Search, ChevronDown, Plus } from 'lucide-react';
import CategoryCard from '../components/CategoryCard';
import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';
import NewCategoryModal from '../components/NewCategoryModal';
import DeleteCategoryModal from '../components/DeleteCategoryModal';
import ProductForm from '../components/ProductForm';

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Category {
    id: number;
    name: string;
    is_promo: boolean;
    display_order: number;
}

const SortableCategoryItem = ({ category, ...props }: any) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: category.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.5 : 1,
        position: 'relative' as const,
    };

    return (
        <div ref={setNodeRef} style={style}>
            <CategoryCard
                {...props}
                id={category.id}
                name={category.name}
                isPromo={category.is_promo}
                dragAttributes={attributes}
                dragListeners={listeners}
            />
        </div>
    );
};

import { useEstablishment } from '../contexts/EstablishmentContext';

const MenuManager = () => {
    const { establishment } = useEstablishment();
    const [categories, setCategories] = useState<Category[]>([]);
    const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    // Product Wizard State
    const [showProductWizard, setShowProductWizard] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
    const [editingProduct, setEditingProduct] = useState<any | null>(null);
    const [initialStep, setInitialStep] = useState(1);

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Refresh Trigger for Product Lists within Categories
    const [productsRefreshTrigger, setProductsRefreshTrigger] = useState(0);

    const [isLoading, setIsLoading] = useState(true);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const fetchCategories = async () => {
        if (!establishment?.id) return;
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .eq('establishment_id', establishment.id)
                .order('display_order', { ascending: true }); // Ordered by display_order

            if (error) throw error;
            setCategories(data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setCategories((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over?.id);

                const newItems = arrayMove(items, oldIndex, newIndex);

                // Update order in Supabase asynchronously
                const updates = newItems.map((cat, index) => ({
                    id: cat.id,
                    display_order: index,
                    name: cat.name // Required for upsert if not partial, but update is better.
                    // Actually let's use a loop or upsert.
                }));

                // Fire and forget update (or handle error strictly)
                updateCategoriesOrder(updates);

                return newItems;
            });
        }
    };

    const updateCategoriesOrder = async (orderedCategories: any[]) => {
        try {
            // We can prepare a set of promises for better parallelism or use upsert if we select all columns.
            // Since we only want to update display_order, promise.all is safest.
            // Or we use upsert with all fields.
            // Let's use Promise.all to update each row.
            const updates = orderedCategories.map(cat =>
                supabase.from('categories').update({ display_order: cat.display_order }).eq('id', cat.id)
            );

            await Promise.all(updates);
        } catch (err) {
            console.error('Error updating order:', err);
        }
    };

    const confirmDelete = (category: Category) => {
        setCategoryToDelete(category);
        setDeleteModalOpen(true);
    };

    const handleDeleteCategory = async () => {
        if (!categoryToDelete) return;

        setIsDeleting(true);
        try {
            // 1. Fetch Products in this category to handle deep cleanup
            const { data: products } = await supabase
                .from('products')
                .select('id')
                .eq('category_id', categoryToDelete.id);

            if (products && products.length > 0) {
                const productIds = products.map(p => p.id);

                // 2. Delete Product Addon Groups (Cascade should handle items, but let's be safe)
                // Note: If you have FK constraints with cascade in Postgres, this is auto. 
                // If not, we must delete child rows first. 
                // Assuming we might not have cascading set up on relationships:
                await supabase.from('product_addons').delete().in('group_id',
                    (await supabase.from('product_addon_groups').select('id').in('product_id', productIds)).data?.map(g => g.id) || []
                );

                await supabase.from('product_addon_groups').delete().in('product_id', productIds);

                // 3. Delete Products
                const { error: prodError } = await supabase
                    .from('products')
                    .delete()
                    .eq('category_id', categoryToDelete.id);

                if (prodError) throw prodError;
            }

            // 4. Delete Category
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', categoryToDelete.id);

            if (error) throw error;

            // Update list and close modal
            setCategories(prev => prev.filter(cat => cat.id !== categoryToDelete.id));
            setDeleteModalOpen(false);
            setCategoryToDelete(null);
        } catch (error) {
            console.error('Error deleting category:', error);
            alert('Erro ao excluir categoria. Verifique se existem itens vinculados que impedem a exclusão.');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEditCategory = (category: Category) => {
        setEditingCategory(category);
        setIsNewCategoryModalOpen(true);
    };

    useEffect(() => {
        if (establishment?.id) {
            fetchCategories();
        }
    }, [establishment?.id]);

    const handleOpenProductWizard = (categoryId?: number, productToEdit?: any, step: number = 1) => {
        setSelectedCategoryId(categoryId);
        setEditingProduct(productToEdit || null);
        setInitialStep(step);
        setShowProductWizard(true);
    };

    return (
        <div className="p-6 h-[calc(100vh-64px)] overflow-y-auto bg-gray-100 font-sans relative">
            {/* Breadcrumb */}
            <div className="text-xs text-gray-500 mb-6">
                Início <span className="mx-1">›</span> Gestor de cardápio <span className="mx-1">›</span> <span className="font-bold text-gray-700">Gestor</span>
            </div>

            {/* Header */}
            <h1 className="text-2xl font-bold text-gray-700 mb-6 hidden md:block">Gestor de cardápio</h1>

            {/* Mobile Add Category Button */}
            <div className="md:hidden mt-2 mb-6">
                <button
                    onClick={() => setIsNewCategoryModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#0099FF] text-white rounded-lg font-bold shadow-md active:scale-95 transition-all uppercase text-sm"
                >
                    <Plus size={20} strokeWidth={3} />
                    <span>Categoria</span>
                </button>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between mb-6 gap-4">
                {/* Search with Category Dropdown */}
                <div className="flex items-stretch md:items-center flex-1 max-w-lg bg-white rounded shadow-sm border border-gray-200">
                    <button className="flex items-center gap-2 px-3 md:px-4 py-2.5 text-gray-600 border-r border-gray-200 hover:bg-gray-50 flex-shrink-0">
                        <Search size={18} />
                        <span className="text-xs md:text-sm">Categorias</span>
                        <ChevronDown size={14} className="text-gray-400" />
                    </button>
                    <input
                        type="text"
                        placeholder="Pesquisar"
                        className="flex-1 px-3 md:px-4 py-2 text-xs md:text-sm outline-none text-gray-600 placeholder-gray-400"
                    />
                </div>

                {/* Right Controls - Hidden on Mobile, replaced by simpler actions or context-specific buttons */}
                <div className="hidden md:flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-blue-200 text-[#0099FF] rounded hover:bg-blue-50 font-medium shadow-sm">
                        <span>Ações</span>
                        <ChevronDown size={16} />
                    </button>

                    <button
                        onClick={() => handleOpenProductWizard()}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0099FF] text-white rounded hover:bg-blue-600 font-medium shadow-sm active:transform active:scale-95 transition-all"
                    >
                        <Plus size={18} />
                        <span>Novo Item</span>
                    </button>
                    <button
                        onClick={() => setIsNewCategoryModalOpen(true)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 border border-[#0099FF] text-[#0099FF] rounded hover:bg-blue-50 font-medium shadow-sm active:transform active:scale-95 transition-all"
                    >
                        <Plus size={18} />
                        <span>Nova categoria</span>
                    </button>
                </div>
            </div>

            {/* Categories List */}
            <div className="space-y-4">
                {categories.length === 0 && !isLoading ? (
                    <div className="text-center text-gray-500 py-10 bg-white rounded-lg border border-gray-200 border-dashed">
                        Nenhuma categoria encontrada. Crie sua primeira categoria!
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={categories.map(c => c.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {categories.map((cat) => (
                                <SortableCategoryItem
                                    key={cat.id}
                                    category={cat}
                                    onDelete={() => confirmDelete(cat)}
                                    onEditCategory={() => handleEditCategory(cat)}
                                    onAddProduct={() => handleOpenProductWizard(cat.id)}
                                    onEditProduct={(product: any, step: number) => handleOpenProductWizard(cat.id, product, step)}
                                    refreshTrigger={productsRefreshTrigger}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                )}
            </div>

            {/* Footer Count */}
            <div className="text-center text-sm text-gray-600 mt-8 mb-20">
                Exibindo {categories.length} de {categories.length} categorias
            </div>



            {/* Modals */}
            <NewCategoryModal
                isOpen={isNewCategoryModalOpen}
                onClose={() => {
                    setIsNewCategoryModalOpen(false);
                    setEditingCategory(null);
                }}
                onSuccess={fetchCategories}
                categoryToEdit={editingCategory}
            />

            <DeleteCategoryModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDeleteCategory}
                categoryName={categoryToDelete?.name || ''}
                isLoading={isDeleting}
            />

            {/* Product Creation Wizard */}
            {showProductWizard && (
                <ProductForm
                    onClose={() => setShowProductWizard(false)}
                    onSuccess={() => {
                        setShowProductWizard(false);
                        setProductsRefreshTrigger(prev => prev + 1);
                    }}
                    categories={categories}
                    initialCategoryId={selectedCategoryId}
                    initialProduct={editingProduct}
                    initialStep={initialStep}
                />
            )}
        </div>
    );
};

export default MenuManager;
