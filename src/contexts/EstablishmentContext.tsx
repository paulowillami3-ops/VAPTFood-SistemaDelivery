import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface WorkShift {
    start: string;
    end: string;
}

interface WorkShifts {
    [key: string]: WorkShift[]; // 0-6 for days of week
}

interface EstablishmentData {
    id?: number; // Actually bigint, but number in JS usually fine for small IDs or use string
    slug?: string;
    name: string;
    logo_url?: string;
    timezone?: string;
    operation_mode?: 'always_open' | 'specific_hours' | 'scheduled_only' | 'permanently_closed';
    work_shifts?: WorkShifts;
    isOpen: boolean;
    nextOpenText?: string;
    auto_accept_orders?: boolean;
    auto_accept_modal_seen?: boolean;
    contacts?: string[];
    // Address Fields
    cep?: string;
    street?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    complement?: string;
    reference?: string;
    hide_address?: boolean;
    manual_coordinates?: boolean;
    latitude?: string;
    longitude?: string;
    payment_methods_on_delivery?: {
        cash: boolean;
        card: boolean;
        pix?: boolean;
        pix_key?: string;
        card_brands?: string[];
    };
    // Time Estimates (Minutes)
    delivery_time_min?: number;
    delivery_time_max?: number;
    pickup_time_min?: number;
    pickup_time_max?: number;
    minimum_order_fee_enabled?: boolean;
    minimum_order_fee_value?: number;
    legal_representative_name?: string;
}

interface EstablishmentContextType {
    establishment: EstablishmentData;
    updateEstablishment: (data: Partial<EstablishmentData>) => void;
    refreshEstablishment: () => Promise<void>;
}

const defaultEstablishment: EstablishmentData = {
    name: 'Carregando...',
    isOpen: true
};

const EstablishmentContext = createContext<EstablishmentContextType>({
    establishment: defaultEstablishment,
    updateEstablishment: () => { },
    refreshEstablishment: async () => { },
});

export const EstablishmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [establishment, setEstablishment] = useState<EstablishmentData>(defaultEstablishment);
    const location = useLocation();

    // Calculate if open based on shifts
    const calculateStatus = (data: Partial<EstablishmentData>): { isOpen: boolean, nextOpenText?: string } => {
        if (!data.operation_mode || data.operation_mode === 'always_open') return { isOpen: true };
        if (data.operation_mode === 'permanently_closed') return { isOpen: false, nextOpenText: 'Fechado permanentemente' };
        if (data.operation_mode === 'scheduled_only') return { isOpen: false, nextOpenText: 'Apenas agendamento' };

        if (data.operation_mode === 'specific_hours' && data.work_shifts) {
            const now = new Date();
            // TODO: Handle timezone correctly. For now assuming browser time roughly matches or server time
            // In a real app, use 'date-fns-tz' or similar to convert 'now' to establishment timezone

            const day = now.getDay().toString();
            const shifts = data.work_shifts[day];

            if (!shifts || shifts.length === 0) return { isOpen: false, nextOpenText: 'Fechado hoje' };

            const currentMinutes = now.getHours() * 60 + now.getMinutes();

            const isOpenNow = shifts.some(shift => {
                const [startH, startM] = shift.start.split(':').map(Number);
                const [endH, endM] = shift.end.split(':').map(Number);
                const startTotal = startH * 60 + startM;
                const endTotal = endH * 60 + endM;

                // Handle overnight shifts if needed (end < start), but simple for now
                return currentMinutes >= startTotal && currentMinutes < endTotal;
            });

            if (isOpenNow) return { isOpen: true };

            // Find next open time today
            const nextShift = shifts.find(shift => {
                const [startH, startM] = shift.start.split(':').map(Number);
                const startTotal = startH * 60 + startM;
                return startTotal > currentMinutes;
            });

            if (nextShift) {
                return { isOpen: false, nextOpenText: `Abre hoje às ${nextShift.start}` };
            } else {
                return { isOpen: false, nextOpenText: 'Fechado agora' };
            }
        }

        return { isOpen: true };
    };

    const refreshEstablishment = async (retries = 3, delay = 1000) => {
        try {
            // Extract slug from URL (path-based multi-tenancy)
            // Format: /:slug/...
            const pathParts = window.location.pathname.split('/');
            const slug = pathParts[1]; // Index 1 because [0] is empty string

            let query = supabase
                .from('establishment_settings')
                .select('id, slug, name, logo_url, timezone, operation_mode, work_shifts, auto_accept_orders, auto_accept_modal_seen, cep, street, number, neighborhood, city, state, complement, reference, hide_address, manual_coordinates, latitude, longitude, payment_methods_on_delivery, contacts, delivery_time_min, delivery_time_max, pickup_time_min, pickup_time_max, minimum_order_fee_enabled, minimum_order_fee_value, legal_representative_name');

            // Security Fix: Do not fallback to default. Only fetch if slug is present.
            if (!slug || slug === 'login' || slug === 'signup' || slug === 'admin' || slug === 'menu') {
                return;
            }

            query = query.eq('slug', slug);

            const { data, error } = await query.single();

            if (error) {
                console.error('Error fetching establishment:', error);

                // Retry logic for network errors
                if (retries > 0 && (error.message?.includes('Failed to fetch') || error.message?.includes('Network request failed'))) {
                    console.log(`Retrying fetch... attempts left: ${retries}`);
                    setTimeout(() => refreshEstablishment(retries - 1, delay * 2), delay);
                    return;
                } else if (retries === 0 && (error.message?.includes('Failed to fetch') || error.message?.includes('Network request failed'))) {
                    toast.error('Erro de conexão. Verifique sua internet ou bloqueadores de anúncio.');
                }

                if (error.code === 'PGRST116') {
                    setEstablishment({ ...defaultEstablishment, name: 'Estabelecimento não encontrado' });
                }
                return;
            }

            if (data) {
                const status = calculateStatus(data);
                setEstablishment({
                    id: data.id, // ID is crucial for other queries
                    slug: data.slug,
                    name: data.name || 'Meu Estabelecimento',
                    logo_url: data.logo_url,
                    timezone: data.timezone,
                    operation_mode: data.operation_mode,
                    work_shifts: data.work_shifts,
                    auto_accept_orders: data.auto_accept_orders,
                    auto_accept_modal_seen: data.auto_accept_modal_seen,
                    contacts: data.contacts,
                    // Address
                    cep: data.cep,
                    street: data.street,
                    number: data.number,
                    neighborhood: data.neighborhood,
                    city: data.city,
                    state: data.state,
                    complement: data.complement,
                    reference: data.reference,
                    hide_address: data.hide_address,
                    manual_coordinates: data.manual_coordinates,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    payment_methods_on_delivery: data.payment_methods_on_delivery,
                    // Times
                    delivery_time_min: data.delivery_time_min,
                    delivery_time_max: data.delivery_time_max,
                    pickup_time_min: data.pickup_time_min,
                    pickup_time_max: data.pickup_time_max,
                    minimum_order_fee_enabled: data.minimum_order_fee_enabled,
                    minimum_order_fee_value: data.minimum_order_fee_value,
                    legal_representative_name: data.legal_representative_name,
                    ...status
                });
            }
        } catch (err: any) {
            console.error('Establishment context error:', err);
            if (retries === 0 && (err.message?.includes('NetworkError') || err.message?.includes('Failed to fetch'))) {
                toast.error('Erro de conexão com o servidor. Verifique se o projeto Supabase está ativo.');
            }
            // Retry for caught exceptions too
            if (retries > 0) {
                console.log(`Retrying fetch (catch)... attempts left: ${retries}`);
                setTimeout(() => refreshEstablishment(retries - 1, delay * 2), delay);
            }
        }
    };

    useEffect(() => {
        refreshEstablishment();
    }, [location.pathname]);

    const checkIsOpen = () => {
        // Find today's rule
        // Assuming operation_mode and work_shifts are populated
        // This is a simplified check. Real check involves timezones.

        // If always open
        if (!establishment.operation_mode || establishment.operation_mode === 'always_open') {
            if (!establishment.isOpen) setEstablishment(prev => ({ ...prev, isOpen: true }));
            return;
        }

        if (establishment.operation_mode === 'permanently_closed') {
            if (establishment.isOpen) setEstablishment(prev => ({ ...prev, isOpen: false }));
            return;
        }

        // Specific hours
        if (establishment.operation_mode === 'specific_hours' && establishment.work_shifts) {
            const now = new Date();
            const day = now.getDay().toString();
            const shifts = establishment.work_shifts[day] || [];

            const currentMinutes = now.getHours() * 60 + now.getMinutes();

            const isOpenNow = shifts.some(shift => {
                const [startH, startM] = shift.start.split(':').map(Number);
                const [endH, endM] = shift.end.split(':').map(Number);

                let startTotal = startH * 60 + startM;
                let endTotal = endH * 60 + endM;

                // Handle overnight (cross midnight)
                if (endTotal < startTotal) {
                    // e.g. 18:00 to 02:00
                    // Open if current > start OR current < end
                    return currentMinutes >= startTotal || currentMinutes < endTotal;
                }

                return currentMinutes >= startTotal && currentMinutes < endTotal;
            });

            if (isOpenNow !== establishment.isOpen) {
                setEstablishment(prev => ({ ...prev, isOpen: isOpenNow }));
            }
        }
    };

    // Check status every minute
    useEffect(() => {
        checkIsOpen();
        const interval = setInterval(checkIsOpen, 60000);
        return () => clearInterval(interval);
    }, [establishment.operation_mode, establishment.work_shifts]); // Re-run if rules change

    const updateEstablishment = (data: Partial<EstablishmentData>) => {
        setEstablishment(prev => {
            const newData = { ...prev, ...data };
            const status = calculateStatus(newData);
            return { ...newData, ...status };
        });
    };

    return (
        <EstablishmentContext.Provider value={{ establishment, updateEstablishment, refreshEstablishment }}>
            {children}
        </EstablishmentContext.Provider>
    );
};

export const useEstablishment = () => useContext(EstablishmentContext);
