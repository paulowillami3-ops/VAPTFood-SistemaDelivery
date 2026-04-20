export interface EstablishmentSettings {
    id?: number;
    name: string;
    legal_representative_cpf: string;
    legal_representative_name: string;
    no_cnpj: boolean;
    cnpj: string;
    business_name: string;
    segment: string;
    logo_url: string;
    contacts: string[];
    instagram: string;
    // Address Section
    cep: string;
    street: string;
    number: string;
    city: string;
    state: string;
    reference: string;
    neighborhood: string;
    complement: string;
    hide_address: boolean;
    manual_coordinates: boolean;
    latitude?: number;
    longitude?: number;
    timezone?: string;
    operation_mode?: 'always_open' | 'specific_hours' | 'scheduled_only' | 'permanently_closed';
    work_shifts?: any; // Using any for now to match original
    // New Fields
    delivery_time_min?: number;
    delivery_time_max?: number;
    pickup_time_min?: number;
    pickup_time_max?: number;
    enable_delivery?: boolean;
    enable_pickup?: boolean;
    enable_on_site?: boolean;
    minimum_order_fee_enabled?: boolean;
    minimum_order_fee_value?: number;
    payment_methods_on_delivery?: {
        cash: boolean;
        card: boolean;
        pix?: boolean;
        pix_key?: string;
        card_brands?: string[];
    };
}

export interface DeliveryRegion {
    id: number;
    name: string;
    fee: number;
    active: boolean;
}

// Dummy export to prevent "does not provide an export" runtime error if types are stripped
export const _runtime_check = true;
