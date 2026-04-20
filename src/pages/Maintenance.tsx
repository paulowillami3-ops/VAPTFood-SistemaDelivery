import { Construction } from 'lucide-react';

const Maintenance = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center p-8 bg-white rounded-xl shadow-sm border border-gray-100 animate-fade-in">
            <div className="w-24 h-24 bg-yellow-50 rounded-full flex items-center justify-center mb-6">
                <Construction size={48} className="text-yellow-500" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-3">Em Construção</h1>
            <p className="text-gray-500 max-w-md mx-auto text-lg leading-relaxed">
                Estamos trabalhando duro para trazer esta funcionalidade para você.
                <br />
                <span className="text-sm font-medium text-blue-500 mt-2 block">Novidades em breve!</span>
            </p>
        </div>
    );
};

export default Maintenance;
