import { Trash2, Plus } from 'lucide-react';
import type { EstablishmentSettings } from '../../types/establishment';

interface SettingsHoursProps {
    settings: EstablishmentSettings;
    onChange: (field: keyof EstablishmentSettings, value: any) => void;
}

export const SettingsHours = ({ settings, onChange }: SettingsHoursProps) => {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800">3. Horários</h2>
                <p className="text-sm text-gray-500">Personalize o horário de funcionamento do seu estabelecimento</p>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Fuso horário *</label>
                    <select
                        value={settings.timezone || 'America/Sao_Paulo'}
                        onChange={(e) => onChange('timezone', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500 max-w-sm"
                    >
                        <option value="America/Sao_Paulo">América/São Paulo</option>
                        <option value="America/Manaus">América/Manaus</option>
                        <option value="America/Belem">América/Belém</option>
                        <option value="America/Fortaleza">América/Fortaleza</option>
                        <option value="America/Recife">América/Recife</option>
                    </select>
                </div>

                <div className="space-y-4">
                    <label className="block text-sm font-bold text-gray-700">Horário de funcionamento</label>

                    <div className="space-y-3">
                        <label className="flex items-start gap-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                            <input
                                type="radio"
                                name="operation_mode"
                                checked={settings.operation_mode === 'always_open'}
                                onChange={() => onChange('operation_mode', 'always_open')}
                                className="mt-1 text-blue-500 focus:ring-blue-500"
                            />
                            <div>
                                <span className="block text-sm font-bold text-gray-800">Sempre disponível</span>
                                <span className="text-xs text-gray-500">Seu estabelecimento sempre aparecerá aberto</span>
                            </div>
                        </label>

                        <label className="flex items-start gap-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                            <input
                                type="radio"
                                name="operation_mode"
                                checked={settings.operation_mode === 'specific_hours'}
                                onChange={() => onChange('operation_mode', 'specific_hours')}
                                className="mt-1 text-blue-500 focus:ring-blue-500"
                            />
                            <div>
                                <span className="block text-sm font-bold text-gray-800">Disponível em dias e horários específicos</span>
                                <span className="text-xs text-gray-500">Escolha quando seu estabelecimento aparecerá aberto</span>
                            </div>
                        </label>

                        <label className="flex items-start gap-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                            <input
                                type="radio"
                                name="operation_mode"
                                checked={settings.operation_mode === 'scheduled_only'}
                                onChange={() => onChange('operation_mode', 'scheduled_only')}
                                className="mt-1 text-blue-500 focus:ring-blue-500"
                            />
                            <div>
                                <span className="block text-sm font-bold text-gray-800">Disponível apenas para agendamento</span>
                                <span className="text-xs text-gray-500">Apenas pedidos agendados em horários específicos</span>
                            </div>
                        </label>

                        <label className="flex items-start gap-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                            <input
                                type="radio"
                                name="operation_mode"
                                checked={settings.operation_mode === 'permanently_closed'}
                                onChange={() => onChange('operation_mode', 'permanently_closed')}
                                className="mt-1 text-blue-500 focus:ring-blue-500"
                            />
                            <div>
                                <span className="block text-sm font-bold text-gray-800">Fechado permanentemente</span>
                                <span className="text-xs text-gray-500">Seu estabelecimento aparecerá como fechado</span>
                            </div>
                        </label>
                    </div>
                </div>

                {settings.operation_mode === 'specific_hours' && (
                    <div className="mt-6 border-t pt-6">
                        <h3 className="text-sm font-bold text-gray-700 mb-4">Configurar turnos</h3>
                        <div className="space-y-4">
                            {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map((dayName, index) => {
                                const dayIndex = index.toString();
                                const shifts = settings.work_shifts?.[dayIndex] || [];

                                // Helper to update shifts for a day
                                const updateShifts = (newShifts: any[]) => {
                                    const newWorkShifts = { ...settings.work_shifts, [dayIndex]: newShifts };
                                    onChange('work_shifts', newWorkShifts);
                                };

                                const addShift = () => {
                                    updateShifts([...shifts, { start: '08:00', end: '18:00' }]);
                                };

                                const removeShift = (shiftIndex: number) => {
                                    const newShifts = shifts.filter((_: any, i: number) => i !== shiftIndex);
                                    updateShifts(newShifts);
                                };

                                const updateShiftTime = (shiftIndex: number, field: 'start' | 'end', time: string) => {
                                    const newShifts = [...shifts];
                                    newShifts[shiftIndex] = { ...newShifts[shiftIndex], [field]: time };
                                    updateShifts(newShifts);
                                };

                                return (
                                    <div key={dayName} className="flex flex-col md:flex-row md:items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="w-24 pt-2 font-medium text-gray-700">{dayName}</div>
                                        <div className="flex-1 space-y-3">
                                            {shifts.map((shift: any, i: number) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <input
                                                        type="time"
                                                        value={shift.start}
                                                        onChange={(e) => updateShiftTime(i, 'start', e.target.value)}
                                                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                                                    />
                                                    <span className="text-gray-400">às</span>
                                                    <input
                                                        type="time"
                                                        value={shift.end}
                                                        onChange={(e) => updateShiftTime(i, 'end', e.target.value)}
                                                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                                                    />
                                                    <button onClick={() => removeShift(i)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                            <button onClick={addShift} className="text-sm text-blue-500 hover:text-blue-700 flex items-center gap-1">
                                                <Plus size={14} /> Adicionar turno
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
