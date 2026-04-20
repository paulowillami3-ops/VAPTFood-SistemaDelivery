import { type ReactNode } from 'react';

interface TooltipProps {
    text: string;
    children: ReactNode;
}

export const Tooltip = ({ text, children }: TooltipProps) => (
    <div className="relative group/tooltip flex flex-col items-center">
        {children}
        <div className="absolute top-full mt-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
            {text}
            {/* Arrow pointing up */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900"></div>
        </div>
    </div>
);

export default Tooltip;
