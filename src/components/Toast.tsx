import React, { useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface ToastProps {
    message: string;
    onClose: () => void;
    duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, onClose, duration = 3000 }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300); // Wait for fade out animation
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    return (
        <div className={`fixed top-4 right-4 z-[200] transition-all duration-300 transform ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}>
            <div className="bg-[#2ECC71] text-white px-4 py-3 rounded-md shadow-lg flex items-center gap-3 min-w-[300px]">
                <div className="p-1 border-2 border-white rounded-full">
                    <CheckCircle2 size={16} strokeWidth={3} className="text-white" />
                </div>
                <span className="font-medium text-sm flex-1">{message}</span>
                <button onClick={() => { setIsVisible(false); setTimeout(onClose, 300); }} className="text-white/80 hover:text-white transition-colors">
                    <X size={18} />
                </button>
            </div>
        </div>
    );
};

export default Toast;
