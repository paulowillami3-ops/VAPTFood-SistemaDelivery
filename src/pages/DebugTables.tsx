import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const DebugTables = () => {
    const [tables, setTables] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchTables();
    }, []);

    const fetchTables = async () => {
        try {
            console.log('Fetching tables...');
            const { data, error } = await supabase.from('restaurant_tables').select('*');
            if (error) throw error;
            console.log('Tables fetched:', data);
            setTables(data || []);
        } catch (err: any) {
            console.error('Error fetching tables:', err);
            setError(err.message || 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-white text-black p-8 flex items-center justify-center">
            <div className="text-xl">Carregando tabelas para debug...</div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-white text-red-600 p-8 flex flex-col items-center justify-center">
            <div className="text-xl font-bold mb-2">Erro ao carregar tabelas</div>
            <div>{error}</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-white text-black p-8">
            <h1 className="text-2xl font-bold mb-6">Debug Tables ({tables.length})</h1>
            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-gray-300 p-2 text-left">ID</th>
                            <th className="border border-gray-300 p-2 text-left">Internal ID</th>
                            <th className="border border-gray-300 p-2 text-left">Name</th>
                            <th className="border border-gray-300 p-2 text-left">Establishment ID</th>
                            <th className="border border-gray-300 p-2 text-left">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tables.map(t => (
                            <tr key={t.id} className="hover:bg-gray-50">
                                <td className="border border-gray-300 p-2">{t.id}</td>
                                <td className="border border-gray-300 p-2 text-gray-400 text-xs">{t.id}</td>
                                <td className="border border-gray-300 p-2 font-bold">{t.name}</td>
                                <td className="border border-gray-300 p-2">{t.establishment_id}</td>
                                <td className="border border-gray-300 p-2">{t.status || 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="mt-8 text-sm text-gray-500">
                <p>Verifique se o ID na URL corresponde ao ID listado aqui para a mesa desejada.</p>
            </div>
        </div>
    );
};

export default DebugTables;
