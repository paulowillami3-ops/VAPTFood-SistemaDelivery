import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useEstablishment } from './EstablishmentContext';
import { useAudioAlert } from '../hooks/useAudioAlert';

interface OrderSoundSettings {
    sound_delivery: 'long' | 'short' | 'none';
    sound_dinein: 'long' | 'short' | 'none';
}

interface NotificationContextType {
    triggerTestNotification: (type?: 'long' | 'short') => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { establishment } = useEstablishment();
    const { playNotification } = useAudioAlert();
    const [soundSettings, setSoundSettings] = useState<OrderSoundSettings>({
        sound_delivery: 'long',
        sound_dinein: 'long'
    });

    // Fetch sound settings
    useEffect(() => {
        if (!establishment?.id) return;

        const fetchSettings = async () => {
            const { data } = await supabase
                .from('order_settings')
                .select('sound_delivery, sound_dinein')
                .eq('establishment_id', establishment.id)
                .maybeSingle();

            if (data) {
                setSoundSettings({
                    sound_delivery: data.sound_delivery || 'long',
                    sound_dinein: data.sound_dinein || 'long'
                });
            }
        };

        fetchSettings();

        // Subscribe to settings changes
        const settingsChannel = supabase
            .channel(`order_settings_notify_${establishment.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'order_settings',
                    filter: `establishment_id=eq.${establishment.id}`
                },
                (payload: any) => {
                    if (payload.new) {
                        setSoundSettings({
                            sound_delivery: payload.new.sound_delivery || 'long',
                            sound_dinein: payload.new.sound_dinein || 'long'
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(settingsChannel);
        };
    }, [establishment?.id]);

    useEffect(() => {
        if (!establishment?.id) return;

        console.log('NotificationProvider: Subscribing to global order notifications for establishment:', establishment.id);

        const channel = supabase
            .channel(`global_orders_${establishment.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                    filter: `establishment_id=eq.${establishment.id}`
                },
                (payload: any) => {
                    const isNew = payload.eventType === 'INSERT';
                    const isTransitionToActive = payload.eventType === 'UPDATE' &&
                        payload.old?.status !== payload.new?.status &&
                        (payload.new.status === 'PENDING' || payload.new.status === 'PREPARING');

                    if (isNew || isTransitionToActive) {
                        const order = payload.new;
                        if (order.status === 'PENDING' || order.status === 'PREPARING') {
                            // Determine sound type
                            const isDelivery = order.type === 'DELIVERY' || order.type === 'PICKUP';
                            const soundType = isDelivery ? soundSettings.sound_delivery : soundSettings.sound_dinein;

                            console.log(`>>> New ${order.type} order! Playing ${soundType} sound...`);
                            playNotification(soundType);
                        }
                    }
                }
            )
            .subscribe((status) => {
                console.log('Global order notification subscription status:', status);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [establishment?.id, playNotification, soundSettings]);

    const triggerTestNotification = (type: 'long' | 'short' = 'long') => {
        console.log(`Manual ${type} notification test triggered.`);
        playNotification(type);
    };

    return (
        <NotificationContext.Provider value={{ triggerTestNotification }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};
