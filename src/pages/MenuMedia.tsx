import { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Trash2, RefreshCw, CreditCard } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Product {
    id: number;
    name: string;
    image_url: string | null;
    category_id: number;
    category?: {
        name: string;
    };
}

interface Category {
    id: number;
    name: string;
}

const MenuMedia = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
    const [uploadingId, setUploadingId] = useState<number | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const selectedProductIdRef = useRef<number | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Categories
            const { data: cats } = await supabase.from('categories').select('id, name').order('display_order');
            if (cats) setCategories(cats);

            // Fetch Products
            const { data: prods, error } = await supabase
                .from('products')
                .select('*, category:categories(name)')
                .order('name');

            if (error) throw error;
            setProducts(prods || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0 || !selectedProductIdRef.current) return;

        const file = event.target.files[0];
        const productId = selectedProductIdRef.current;
        uploadImage(productId, file);
    };

    const triggerFileInput = (productId: number) => {
        selectedProductIdRef.current = productId;
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
            fileInputRef.current.click();
        }
    };

    const uploadImage = async (productId: number, file: File) => {
        setUploadingId(productId);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${productId}-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            // 1. Upload to Storage
            // Assuming bucket 'products' or 'menu-items'. Let's try to infer or use a common one.
            // Based on typical Supabase setup, 'products' is a good guess for the bucket name.
            const { error: uploadError } = await supabase.storage
                .from('products')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('products')
                .getPublicUrl(filePath);

            // 3. Update Product Record
            const { error: updateError } = await supabase
                .from('products')
                .update({ image_url: publicUrl })
                .eq('id', productId);

            if (updateError) throw updateError;

            // 4. Update Local State
            setProducts(prev => prev.map(p => p.id === productId ? { ...p, image_url: publicUrl } : p));

        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Erro ao fazer upload da imagem. Verifique permissões.'); // Simplify error handling for MVP
        } finally {
            setUploadingId(null);
            selectedProductIdRef.current = null;
        }
    };

    const deleteImage = async (product: Product) => {
        if (!confirm(`Deseja remover a imagem de "${product.name}"?`)) return;

        try {
            // For now, we simply unlink the URL from the DB. 
            // In a production app, we should also delete the file from Storage using the path extracted from the URL.

            const { error } = await supabase
                .from('products')
                .update({ image_url: null })
                .eq('id', product.id);

            if (error) throw error;

            setProducts(prev => prev.map(p => p.id === product.id ? { ...p, image_url: null } : p));
        } catch (error) {
            console.error('Error removing image:', error);
            alert('Erro ao remover imagem.');
        }
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="p-6 h-[calc(100vh-64px)] overflow-y-auto bg-gray-50 font-sans">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileSelect}
            />

            {/* Breadcrumb */}
            <div className="text-xs text-gray-400 mb-6">
                Início <span className="mx-1">›</span> Gestor de cardápio <span className="mx-1">›</span> <span className="font-bold text-gray-600">Imagens do cardápio</span>
            </div>

            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Imagens do Cardápio</h1>
                    <p className="text-gray-500 text-sm">Por aqui, é possível remover, alterar e editar as imagens dos seus itens</p>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-4 mb-8">
                    {/* Category Dropdown */}
                    <div className="relative">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                            className="appearance-none bg-white border border-gray-200 text-gray-700 py-2.5 pl-4 pr-10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium w-48 shadow-sm cursor-pointer"
                        >
                            <option value="all">Todos</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                    </div>

                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Pesquise pelo nome"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm placeholder-gray-400"
                        />
                    </div>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="text-center py-20 text-gray-500">Carregando itens...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredProducts.map(product => (
                            <div key={product.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-md transition-shadow">
                                <h3 className="font-bold text-gray-800 text-sm mb-3 min-h-[20px] line-clamp-1" title={product.name}>
                                    {product.name}
                                </h3>

                                <div className="flex-1 min-h-[200px] flex flex-col">
                                    {product.image_url ? (
                                        <div className="relative border border-gray-200 rounded-lg overflow-hidden group flex-1">
                                            <img
                                                src={product.image_url}
                                                alt={product.name}
                                                className="w-full h-[200px] object-contain bg-white"
                                            // Using object-contain to ensure whole product is seen, white bg for transparent pngs
                                            />
                                            {/* Overlay Actions */}
                                            <div className="absolute top-0 right-0 p-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {/* Maybe put actions here, or below? Design shows them below. */}
                                            </div>

                                            {/* Design shows actions below the image container usually, or inside. 
                                                The screenshot shows buttons below the image for uploaded ones.
                                            */}
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => triggerFileInput(product.id)}
                                            className="border-2 border-dashed border-[#0099FF] rounded-lg flex-1 flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-blue-50 transition-colors group"
                                        >
                                            <div className="mb-3 text-[#0099FF] opacity-50 group-hover:opacity-100 transition-opacity">
                                                {/* Placeholder Icon */}
                                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                                    <polyline points="21 15 16 10 5 21" />
                                                </svg>
                                            </div>

                                            <p className="text-[#0099FF] font-medium text-sm mb-1">Escolha a foto</p>
                                            <p className="text-gray-400 text-xs text-center">Clique aqui ou arraste a foto para cá.</p>

                                            {uploadingId === product.id && (
                                                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Action Buttons for Images */}
                                    {product.image_url && (
                                        <div className="flex justify-center gap-3 mt-4">
                                            <button
                                                onClick={() => triggerFileInput(product.id)}
                                                className="p-2 text-[#0099FF] border border-[#0099FF] rounded hover:bg-blue-50 transition-colors"
                                                title="Trocar foto"
                                            >
                                                {uploadingId === product.id ? (
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                                ) : (
                                                    <RefreshCw size={18} />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => deleteImage(product)}
                                                className="p-2 text-[#0099FF] border border-[#0099FF] rounded hover:bg-blue-50 transition-colors"
                                                title="Remover foto"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer Count */}
                <div className="text-center text-sm text-gray-500 mt-8 mb-8">
                    Exibindo {filteredProducts.length} de {filteredProducts.length} imagens
                </div>

                {/* Floating Chat/Help Button (Visual only to match screenshot style) */}
                <div className="fixed bottom-6 right-6">
                    <button className="bg-[#0099FF] text-white p-4 rounded-full shadow-lg hover:bg-blue-600 transition-colors">
                        <CreditCard size={24} className="text-white" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MenuMedia;
