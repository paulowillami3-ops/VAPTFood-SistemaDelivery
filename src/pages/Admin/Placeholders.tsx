

const AdminPlaceholder = ({ title }: { title: string }) => {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <h1 className="text-xl font-bold text-gray-800">{title}</h1>
            <div className="bg-white p-20 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                </div>
                <p className="text-gray-400 font-medium">A página de {title} está sendo preparada.</p>
            </div>
        </div>
    );
};

export const Finance = () => <AdminPlaceholder title="Financeiro" />;
export const Invoices = () => <AdminPlaceholder title="Notas Fiscais" />;
export const Purchases = () => <AdminPlaceholder title="Compras" />;
export const Reports = () => <AdminPlaceholder title="Relatórios" />;
export const Users = () => <AdminPlaceholder title="Usuários" />;
