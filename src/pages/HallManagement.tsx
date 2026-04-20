import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Settings, Printer, Plus, Search, MessageCircle, Edit2, Share2, Copy, Download, Trash2, PenLine, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { useEstablishment } from '../contexts/EstablishmentContext';
import CreateTablesModal from '../components/CreateTablesModal';
import DeleteTablesModal from '../components/DeleteTablesModal';
import Tooltip from '../components/Tooltip';
import WaiterModal from '../components/WaiterModal';

type Tab = 'mesas' | 'comandas' | 'garcons' | 'taxa';

interface Table {
    id: number;
    name: string;
    status: string;
    table_number?: number;
}

import { useLocation } from 'react-router-dom';

const HallManagement = () => {
    const { establishment } = useEstablishment();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState<Tab>('mesas');
    const [tables, setTables] = useState<Table[]>([]);
    const [waiters, setWaiters] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isWaiterModalOpen, setIsWaiterModalOpen] = useState(false);

    // Handle navigation state actions
    useEffect(() => {
        if (location.state?.action === 'create-table') {
            setActiveTab('mesas');
            setIsCreateModalOpen(true);
            // Clear state to prevent reopening on refresh? 
            // Ideally we'd replace history but for now this is fine.
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    // Fetch tables on mount and set up Realtime
    useEffect(() => {
        if (activeTab === 'mesas' || activeTab === 'comandas') {
            fetchTables();
        } else if (activeTab === 'garcons') {
            fetchWaiters();
        }

        if (!establishment?.id) return;

        const channel = supabase
            .channel(`hall_management_${establishment.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'restaurant_tables',
                    filter: `establishment_id=eq.${establishment.id}`
                },
                () => {
                    if (activeTab === 'mesas') fetchTables();
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'restaurant_comandas',
                    filter: `establishment_id=eq.${establishment.id}`
                },
                () => {
                    if (activeTab === 'comandas') fetchTables();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [activeTab, establishment?.id]);

    const fetchWaiters = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('collaborators')
                .select('*')
                .eq('role', 'Garçom');

            if (establishment?.id) {
                query = query.eq('establishment_id', establishment.id);
            }

            query = query.order('created_at', { ascending: false });

            const { data, error } = await query;

            if (error) throw error;
            setWaiters(data || []);
        } catch (error) {
            console.error('Error fetching waiters:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateWaiterStatus = async (id: number, active: boolean) => {
        try {
            const { error } = await supabase
                .from('collaborators')
                .update({ active })
                .eq('id', id);

            if (error) throw error;
            setWaiters(prev => prev.map(w => w.id === id ? { ...w, active } : w));
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const fetchTables = async () => {
        try {
            setLoading(true);
            const tableName = activeTab === 'comandas' ? 'restaurant_comandas' : 'restaurant_tables';

            let query = supabase
                .from(tableName)
                .select('*');

            if (establishment?.id) {
                query = query.eq('establishment_id', establishment.id);
            }

            query = query.order('id', { ascending: true });

            // No longer need to filter by name prefix as tables are separate

            const { data, error } = await query;

            if (error) throw error;
            setTables(data || []);
        } catch (error) {
            console.error('Error fetching items:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTables = async (count: number, startNumber: number = 1) => {
        try {
            const start = startNumber;
            const newTables = Array.from({ length: count }, (_, i) => ({
                name: `Mesa ${start + i}`,
                status: 'active',
                establishment_id: establishment?.id,
                table_number: start + i
            }));

            const { error } = await supabase
                .from('restaurant_tables')
                .insert(newTables);

            if (error) throw error;
            fetchTables();
        } catch (error) {
            console.error('Error creating tables:', error);
        }
    };

    const handleCreateComandas = async (count: number, startNumber: number = 1) => {
        try {
            const start = startNumber;
            const newComandas = Array.from({ length: count }, (_, i) => ({
                name: `${start + i}`,
                status: 'active',
                establishment_id: establishment?.id
            }));

            const { error } = await supabase
                .from('restaurant_comandas')
                .insert(newComandas);

            if (error) throw error;
            fetchTables();
        } catch (error) {
            console.error('Error creating comandas:', error);
        }
    };

    const handleBulkDeleteTables = async (count: number) => {
        try {
            const tablesToDelete = [...tables]
                .sort((a, b) => b.id - a.id)
                .slice(0, count);

            const idsToDelete = tablesToDelete.map(t => t.id);
            const tableName = activeTab === 'comandas' ? 'restaurant_comandas' : 'restaurant_tables';

            const { error } = await supabase
                .from(tableName)
                .delete()
                .eq('establishment_id', establishment?.id)
                .in('id', idsToDelete);

            if (error) throw error;
            fetchTables();
        } catch (error: any) {
            console.error('Error bulk deleting tables:', error);
            toast.error(error.message?.includes('foreign key')
                ? 'Não é possível excluir mesas que possuem pedidos vinculados.'
                : 'Erro ao excluir mesas.');
        }
    };

    const handleDeleteTable = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir este item?')) return;
        try {
            const tableName = activeTab === 'comandas' ? 'restaurant_comandas' : 'restaurant_tables';
            const { error } = await supabase
                .from(tableName)
                .delete()
                .eq('id', id)
                .eq('establishment_id', establishment?.id);

            if (error) throw error;
            fetchTables();
        } catch (error: any) {
            console.error('Error deleting item:', error);
            toast.error(error.message?.includes('foreign key')
                ? 'Não é possível excluir uma mesa que possui pedidos vinculados.'
                : 'Erro ao excluir mesa.');
        }
    };

    const [serviceFeeEnabled, setServiceFeeEnabled] = useState(true);
    const [serviceFeePercentage, setServiceFeePercentage] = useState(10);

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');

    const startEditing = (table: Table) => {
        setEditingId(table.id);
        setEditName(table.name);
    };

    const saveEditing = async () => {
        if (!editingId) return;

        try {
            const tableName = activeTab === 'comandas' ? 'restaurant_comandas' : 'restaurant_tables';
            const { error } = await supabase
                .from(tableName)
                .update({ name: editName })
                .eq('id', editingId);

            if (error) throw error;

            setTables(tables.map(t => t.id === editingId ? { ...t, name: editName } : t));
            setEditingId(null);
            setEditName('');
        } catch (error) {
            console.error('Error updating item:', error);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            saveEditing();
        } else if (e.key === 'Escape') {
            setEditingId(null);
            setEditName('');
        }
    };

    const handleDownloadQRCode = (id: number, name: string) => {
        const svg = document.getElementById(`qrcode-${id}`);
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.download = `${name}-QRCode.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
        };
        img.src = "data:image/svg+xml;base64," + btoa(svgData);
    };

    const handlePrintQRCode = (id: number, name: string) => {
        const svg = document.getElementById(`qrcode-${id}`);
        if (!svg) return;

        const printWindow = window.open('', '', 'width=600,height=600');
        if (!printWindow) return;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Imprimir ${name}</title>
                    <style>
                        body {
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            height: 100vh;
                            margin: 0;
                            font-family: sans-serif;
                        }
                        h1 { font-size: 24px; margin-bottom: 20px; }
                        svg { width: 300px; height: 300px; }
                    </style>
                </head>
                <body>
                    <h1>${name}</h1>
                    ${svg.outerHTML}
                    <script>
                        window.onload = () => {
                            window.print();
                            window.onafterprint = () => window.close();
                        }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'mesas':
                return (
                    <div>
                        <CreateTablesModal
                            isOpen={isCreateModalOpen}
                            onClose={() => setIsCreateModalOpen(false)}
                            onConfirm={handleCreateTables}
                            mode="tables"
                            initialStartNumber={1}
                        />

                        <DeleteTablesModal
                            isOpen={isDeleteModalOpen}
                            onClose={() => setIsDeleteModalOpen(false)}
                            onConfirm={handleBulkDeleteTables}
                            maxDeletable={tables.length}
                        />

                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-1">1. Mesas - QR Code</h2>
                            <p className="text-gray-500 text-sm">Configure as Mesas - QR Code para receber pedidos</p>
                        </div>

                        <div className="flex gap-2 mb-6">
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="px-4 py-2 bg-white text-[#0099FF] border border-[#0099FF] rounded-md text-sm font-medium hover:bg-blue-50 transition-colors"
                            >
                                Criar mesas
                            </button>
                            <button
                                onClick={() => setIsDeleteModalOpen(true)}
                                className="px-4 py-2 bg-white text-[#0099FF] border border-[#0099FF] rounded-md text-sm font-medium hover:bg-blue-50 transition-colors"
                            >
                                Excluir mesas
                            </button>
                            <button className="px-4 py-2 bg-[#0099FF] text-white rounded-md text-sm font-medium flex items-center gap-2 hover:bg-blue-600 transition-colors">
                                <Printer size={16} />
                                Imprimir
                            </button>
                        </div>

                        {loading ? (
                            <div className="p-8 text-center text-gray-400">Carregando mesas...</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                {tables.map(table => (
                                    <div key={table.id} className="group relative bg-white p-4 rounded-lg border border-gray-200 flex items-center gap-4 transition-all hover:bg-gray-50 hover:shadow-md">

                                        {/* Overlay with actions on hover - Only show if NOT editing this table */}
                                        {editingId !== table.id && (
                                            <div className="absolute inset-0 bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10 backdrop-blur-[1px]">
                                                <Tooltip text="Editar">
                                                    <button
                                                        onClick={() => startEditing(table)}
                                                        className="p-2 bg-white text-gray-600 rounded hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                    >
                                                        <PenLine size={18} />
                                                    </button>
                                                </Tooltip>
                                                <Tooltip text="Baixar PNG">
                                                    <button
                                                        onClick={() => handleDownloadQRCode(table.id, table.name)}
                                                        className="p-2 bg-white text-gray-600 rounded hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                    >
                                                        <Download size={18} />
                                                    </button>
                                                </Tooltip>
                                                <Tooltip text="Imprimir">
                                                    <button
                                                        onClick={() => handlePrintQRCode(table.id, table.name)}
                                                        className="p-2 bg-white text-gray-600 rounded hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                    >
                                                        <Printer size={18} />
                                                    </button>
                                                </Tooltip>
                                                <Tooltip text="Excluir">
                                                    <button
                                                        onClick={() => handleDeleteTable(table.id)}
                                                        className="p-2 bg-white text-gray-600 rounded hover:text-red-600 hover:bg-red-50 transition-colors"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </Tooltip>
                                            </div>
                                        )}

                                        <div className="bg-white p-1 border border-gray-100 rounded shrink-0">
                                            <QRCodeSVG id={`qrcode-${table.id}`} value={`https://app.vaptfood.com.br/table/${table.id}`} size={64} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            {editingId === table.id ? (
                                                <input
                                                    type="text"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    onBlur={saveEditing}
                                                    onKeyDown={handleKeyDown}
                                                    autoFocus
                                                    className="w-full border-2 border-[#0099FF] rounded px-2 py-1 text-sm font-medium outline-none text-gray-700 bg-white"
                                                />
                                            ) : (
                                                <div className="border border-gray-200 rounded px-3 py-1.5 bg-gray-50 text-gray-700 text-sm mb-1 truncate font-medium">
                                                    {table.name}
                                                </div>
                                            )}
                                            <div className="text-xs text-gray-400">3 a 15 caracteres</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="w-full md:w-auto px-6 py-8 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-[#0099FF] hover:text-[#0099FF] transition-colors bg-gray-50/50 group"
                        >
                            <Plus size={24} className="mb-2 group-hover:scale-110 transition-transform" />
                            <span className="font-medium">Criar Mesa com QR Code</span>
                            <span className="text-sm">Adicione novas Mesas - QR Code</span>
                        </button>
                    </div>
                );

            case 'comandas':
                return (
                    <div>
                        <CreateTablesModal
                            isOpen={isCreateModalOpen}
                            onClose={() => setIsCreateModalOpen(false)}
                            onConfirm={handleCreateComandas}
                            mode="comandas"
                            initialStartNumber={1}
                        />

                        <DeleteTablesModal
                            isOpen={isDeleteModalOpen}
                            onClose={() => setIsDeleteModalOpen(false)}
                            onConfirm={handleBulkDeleteTables}
                            maxDeletable={tables.length}
                        />

                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-1">2. Comandas</h2>
                            <p className="text-gray-500 text-sm">Configure as Comandas para separar os pedidos por cliente.</p>
                        </div>

                        <div className="flex gap-2 mb-6">
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="px-4 py-2 bg-white text-[#0099FF] border border-[#0099FF] rounded-md text-sm font-medium hover:bg-blue-50 transition-colors"
                            >
                                Criar comandas
                            </button>
                            <button
                                onClick={() => setIsDeleteModalOpen(true)}
                                className="px-4 py-2 bg-white text-[#0099FF] border border-[#0099FF] rounded-md text-sm font-medium hover:bg-blue-50 transition-colors"
                            >
                                Excluir comandas
                            </button>
                            <button className="px-4 py-2 bg-[#0099FF] text-white rounded-md text-sm font-medium flex items-center gap-2 hover:bg-blue-600 transition-colors">
                                <Printer size={16} />
                                Imprimir
                            </button>
                        </div>

                        {loading ? (
                            <div className="p-8 text-center text-gray-400">Carregando comandas...</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                {tables.map(comanda => (
                                    <div key={comanda.id} className="group relative bg-white p-4 rounded-lg border border-gray-200 flex items-center gap-4 transition-all hover:bg-gray-50 hover:shadow-md">
                                        {editingId !== comanda.id && (
                                            <div className="hidden group-hover:flex absolute inset-0 bg-white/90 z-10 items-center justify-center gap-2 rounded-lg backdrop-blur-[1px]">
                                                <Tooltip text="Editar">
                                                    <button onClick={() => startEditing(comanda)} className="p-2 bg-gray-900 text-white rounded-md hover:bg-gray-700 transition-colors">
                                                        <PenLine size={18} />
                                                    </button>
                                                </Tooltip>
                                                <Tooltip text="Baixar PNG">
                                                    <button
                                                        onClick={() => handleDownloadQRCode(comanda.id, comanda.name)}
                                                        className="p-2 bg-gray-900 text-white rounded-md hover:bg-gray-700 transition-colors"
                                                    >
                                                        <Download size={18} />
                                                    </button>
                                                </Tooltip>
                                                <Tooltip text="Excluir">
                                                    <button onClick={() => handleDeleteTable(comanda.id)} className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </Tooltip>
                                            </div>
                                        )}

                                        <div className="shrink-0 bg-white p-1 rounded border border-gray-100">
                                            <QRCodeSVG id={`qrcode-${comanda.id}`} value={`https://noia-delivery.com/comanda/${comanda.id}`} size={64} />
                                        </div>
                                        <div className="flex-1">
                                            {editingId === comanda.id ? (
                                                <input
                                                    type="text"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    onKeyDown={handleKeyDown}
                                                    onBlur={saveEditing}
                                                    autoFocus
                                                    className="w-full px-2 py-1 border-2 border-[#0099FF] rounded focus:outline-none text-sm font-bold text-gray-800 bg-white"
                                                />
                                            ) : (
                                                <div className="font-bold text-gray-800 text-lg">
                                                    {comanda.name}
                                                </div>
                                            )}
                                            <div className="text-xs text-gray-400">1 a 5 dígitos</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );

            case 'garcons':
                return (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 mb-1">3. Garçons</h2>
                            </div>
                            <div className="flex gap-2 w-full max-w-md ml-auto">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Busque por nome, e-mail ou telefone"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <button
                                    onClick={() => setIsWaiterModalOpen(true)}
                                    className="px-4 py-2 bg-[#0099FF] text-white rounded-md text-sm font-medium flex items-center gap-2 hover:bg-blue-600"
                                >
                                    <Plus size={16} />
                                    Garçom
                                </button>
                            </div>
                        </div>

                        <WaiterModal
                            isOpen={isWaiterModalOpen}
                            onClose={() => setIsWaiterModalOpen(false)}
                            onSuccess={fetchWaiters}
                        />

                        <div className="border-b border-gray-200 mb-6">
                            <div className="flex gap-6">
                                <button className="pb-2 border-b-2 border-[#0099FF] text-[#0099FF] font-medium flex items-center gap-1">
                                    Ativos <span className="bg-[#0099FF] text-white text-xs px-1.5 py-0.5 rounded-full">1</span>
                                </button>
                                <button className="pb-2 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1">
                                    Inativos <span className="bg-gray-200 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">0</span>
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
                            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 grid grid-cols-12 text-xs font-bold text-gray-500 uppercase">
                                <div className="col-span-2">Status</div>
                                <div className="col-span-3">Nome</div>
                                <div className="col-span-3">E-mail</div>
                                <div className="col-span-3">Número WhatsApp</div>
                                <div className="col-span-1"></div>
                            </div>

                            {waiters.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 text-sm">
                                    Nenhum garçom cadastrado.
                                </div>
                            ) : (
                                waiters.map(waiter => (
                                    <div key={waiter.id} className="px-4 py-3 grid grid-cols-12 items-center text-sm text-gray-700 border-b border-gray-100 last:border-none">
                                        <div className="col-span-2">
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={waiter.active}
                                                    onChange={() => {
                                                        // Toggle logic could be added here
                                                        updateWaiterStatus(waiter.id, !waiter.active);
                                                    }}
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0099FF]"></div>
                                            </label>
                                        </div>
                                        <div className="col-span-3 font-medium">{waiter.name}</div>
                                        <div className="col-span-3 text-gray-500 truncate pr-2">{waiter.email || '--'}</div>
                                        <div className="col-span-3 text-gray-500">{waiter.phone || '--'}</div>
                                        <div className="col-span-1 flex justify-end gap-2 text-gray-400">
                                            <button className="hover:text-blue-600"><Edit2 size={16} /></button>
                                            <button className="hover:text-green-600"><MessageCircle size={16} /></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-center justify-between">
                            <div>
                                <h4 className="font-bold text-gray-800 text-sm">Compartilhe o App</h4>
                                <p className="text-xs text-gray-600">Copie o link do app para compartilhar com sua equipe.</p>
                            </div>
                            <div className="flex gap-2">
                                <button className="px-3 py-1.5 border border-[#0099FF] text-[#0099FF] bg-white rounded-md text-sm font-medium flex items-center gap-1 hover:bg-blue-50">
                                    <Copy size={14} /> Copiar
                                </button>
                                <button className="px-3 py-1.5 border border-[#0099FF] text-[#0099FF] bg-white rounded-md text-sm font-medium flex items-center gap-1 hover:bg-blue-50">
                                    <Share2 size={14} /> Compartilhar
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case 'taxa':
                return (
                    <div>
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-1">4. Taxa de serviço</h2>
                            <p className="text-gray-500 text-sm">Configure as opção de taxa de serviço para pedidos em mesas e comandas.</p>
                        </div>

                        {/* Dashed Border Container */}
                        <div className="mb-8">
                            <div className="border-2 border-dashed border-[#0099FF] rounded-lg p-6 bg-blue-50/50 flex items-start gap-4 mb-8">
                                <label className="relative inline-flex items-center cursor-pointer mt-0.5 shrink-0">
                                    <input type="checkbox" className="sr-only peer" checked={serviceFeeEnabled} onChange={() => setServiceFeeEnabled(!serviceFeeEnabled)} />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0099FF]"></div>
                                </label>
                                <div>
                                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                        Permitir taxa de serviço para pedidos mesa e comandas
                                        <div className="group relative">
                                            <Info size={16} className="text-gray-400 cursor-help" />
                                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                                A taxa será aplicada automaticamente.
                                            </div>
                                        </div>
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">A taxa de serviço será aplicada no fechamento da conta de todos os pedidos da mesa independente da origem do pedido.</p>
                                </div>
                            </div>

                            <div className={`transition-opacity duration-200 ${serviceFeeEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Qual é a porcentagem da taxa de serviço?</label>
                                <div className="flex items-center gap-2">
                                    <button
                                        className="h-9 w-9 bg-gray-100 rounded flex items-center justify-center text-gray-600 hover:bg-gray-200 border border-gray-200 font-bold text-lg"
                                        onClick={() => setServiceFeePercentage(p => Math.max(0, p - 1))}
                                    >
                                        -
                                    </button>
                                    <div className="h-9 w-20 bg-white border border-gray-300 rounded flex items-center justify-center font-medium text-gray-700">
                                        {serviceFeePercentage}
                                    </div>
                                    <button
                                        className="h-9 w-9 bg-gray-100 rounded flex items-center justify-center text-gray-600 hover:bg-gray-200 border border-gray-200 font-bold text-lg"
                                        onClick={() => setServiceFeePercentage(p => Math.min(100, p + 1))}
                                    >
                                        +
                                    </button>
                                </div>
                                <p className="text-xs text-gray-400 mt-2">Máximo de 20% segundo o Decreto Lei 13.419/17.</p>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-gray-100">
                            <button className="px-6 py-2.5 bg-[#0099FF] text-white rounded-md font-bold hover:bg-blue-600 shadow-sm text-sm">
                                Salvar Alterações
                            </button>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Gestão de salão</h1>
                        <div className="text-sm text-gray-500 mt-1">
                            <span>Início</span>
                            <span className="mx-2">›</span>
                            <span>Gestão de salão</span>
                            <span className="mx-2">›</span>
                            <span className="font-medium text-gray-800 capitalize">{activeTab === 'taxa' ? 'Taxa de serviço' : activeTab}</span>
                        </div>
                    </div>

                    {/* Banner CTA Removed */}
                </div>

                {/* Main Layout */}
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Sidebar Tabs */}
                    <div className="w-full lg:w-64 shrink-0 space-y-1">
                        <button
                            onClick={() => setActiveTab('mesas')}
                            className={`w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-colors ${activeTab === 'mesas' ? 'bg-white text-[#0099FF] shadow-sm border border-gray-100' : 'text-gray-500 hover:bg-white hover:text-gray-700'}`}
                        >
                            Mesas - QR Code
                        </button>
                        <button
                            onClick={() => setActiveTab('comandas')}
                            className={`w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-colors ${activeTab === 'comandas' ? 'bg-white text-[#0099FF] shadow-sm border border-gray-100' : 'text-gray-500 hover:bg-white hover:text-gray-700'}`}
                        >
                            Comandas
                        </button>
                        <button
                            onClick={() => setActiveTab('garcons')}
                            className={`w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-colors ${activeTab === 'garcons' ? 'bg-white text-[#0099FF] shadow-sm border border-gray-100' : 'text-gray-500 hover:bg-white hover:text-gray-700'}`}
                        >
                            Garçons
                        </button>
                        <button
                            onClick={() => setActiveTab('taxa')}
                            className={`w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-colors ${activeTab === 'taxa' ? 'bg-white text-[#0099FF] shadow-sm border border-gray-100' : 'text-gray-500 hover:bg-white hover:text-gray-700'}`}
                        >
                            Taxa de serviço
                        </button>

                        {/* Help Box */}
                        <div className="mt-8 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                Dúvidas sobre o App Garçom?
                            </h4>
                            <button className="w-full border border-[#0099FF] text-[#0099FF] px-4 py-2 rounded-md font-medium text-sm hover:bg-blue-50 flex items-center justify-center gap-2">
                                <Share2 size={16} /> Acessar ajuda
                            </button>
                        </div>

                        <div className="mt-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                                <Settings className="text-[#0099FF]" size={32} />
                            </div>
                            <h4 className="font-bold text-gray-800 text-sm">Personalize suas comandas</h4>
                            <p className="text-xs text-gray-500 mb-3">adaptando ao seu negócio</p>
                            <button className="w-full border border-[#0099FF] text-[#0099FF] px-4 py-1.5 rounded-md font-medium text-xs hover:bg-blue-50">
                                acesse e configure
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1">
                        {renderContent()}
                    </div>
                </div>
            </div>

            {/* Chat Widget */}
            <div className="fixed bottom-6 right-6 z-50">
                <button className="bg-[#0099FF] w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-600 transition-colors">
                    <MessageCircle size={24} />
                </button>
            </div>
        </div>
    );
};

export default HallManagement;
