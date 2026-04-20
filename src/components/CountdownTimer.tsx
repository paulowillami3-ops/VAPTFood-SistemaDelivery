import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
    createdAt: string;
    minutes: number;
    isCard?: boolean;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ createdAt, minutes }) => {
    const [timeLeft, setTimeLeft] = useState('');
    const [isLate, setIsLate] = useState(false);

    useEffect(() => {
        const calculateTime = () => {
            const created = new Date(createdAt).getTime();
            const target = created + (minutes * 60 * 1000);
            const now = new Date().getTime();
            const diff = target - now;

            const absDiff = Math.abs(diff);
            const h = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((absDiff % (1000 * 60)) / 1000);

            const formattedTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

            if (diff < 0) {
                setIsLate(true);
                setTimeLeft(`-${formattedTime}`);
            } else {
                setIsLate(false);
                setTimeLeft(formattedTime);
            }
        };

        calculateTime();
        const interval = setInterval(calculateTime, 1000);
        return () => clearInterval(interval);
    }, [createdAt, minutes]);

    if (isLate) {
        return (
            <div className={`w-full py-1 px-2 rounded flex items-center justify-between text-xs font-bold text-white bg-[#D35400]`}>
                <span>Pedido atrasado a</span>
                <span>{timeLeft}</span>
            </div>
        );
    }

    return (
        <div className={`w-full py-1 px-2 rounded flex items-center justify-center text-xs font-bold bg-[#E1F2FF] text-[#0099FF]`}>
            Prepare em até {timeLeft}
        </div>
    );
};

export default CountdownTimer;
