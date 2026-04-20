import { useRef } from 'react';

export const useAudioAlert = () => {
    const audioContextRef = useRef<AudioContext | null>(null);

    const initAudioContext = () => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        return ctx;
    };

    const playShortBell = () => {
        try {
            const ctx = initAudioContext();
            const now = ctx.currentTime;

            // --- "DING" (High Tone) ---
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(987.77, now); // B5
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            osc.start(now);
            osc.stop(now + 0.5);

            console.log("Short Bell played.");
        } catch (error) {
            console.error("Short Bell play failed", error);
        }
    };

    const playLongBell = () => {
        try {
            const ctx = initAudioContext();
            const now = ctx.currentTime;

            // --- "DING" (High Tone) ---
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(987.77, now); // B5
            gain1.gain.setValueAtTime(0, now);
            gain1.gain.linearRampToValueAtTime(0.2, now + 0.02);
            gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
            osc1.start(now);
            osc1.stop(now + 0.8);

            // --- "DONG" (Low Tone) ---
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(783.99, now + 0.4); // G5
            gain2.gain.setValueAtTime(0, now + 0.4);
            gain2.gain.linearRampToValueAtTime(0.15, now + 0.42);
            gain2.gain.exponentialRampToValueAtTime(0.01, now + 2.0);
            osc2.start(now + 0.4);
            osc2.stop(now + 2.0);

            console.log("Long Bell played.");
        } catch (error) {
            console.error("Long Bell play failed", error);
        }
    };

    const playNotification = (type: 'long' | 'short' | 'none' = 'long') => {
        if (type === 'none') return;

        console.log(`Attempting to play ${type} notification sound...`);
        try {
            if (type === 'short') {
                playShortBell();
            } else {
                playLongBell();
                // Optional layered MP3 for richness (usually a longer sound)
                const audio = new Audio('/notification.mp3');
                audio.volume = 0.4;
                audio.play().catch(e => console.warn("MP3 fallback/layer failed", e));
            }
        } catch (error) {
            console.error("Audio initialization failed", error);
        }
    };

    return { playShortBell, playLongBell, playNotification };
};
