import { Info } from 'lucide-react';

export const SettingsDineIn = () => {
    return (
        <div className="p-12 text-center text-gray-500">
            <Info size={48} className="mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium">Operação em Salão</h3>
            <p>Configurações para Mesas e Comandas estarão disponíveis aqui.</p>
        </div>
    );
};
