


const SkeletonCard = () => {
    return (
        <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-200 h-[140px] flex flex-col animate-pulse">
            {/* Header */}
            <div className="flex justify-between items-start mb-1.5">
                <div className="flex items-center gap-2">
                    <div className="bg-gray-200 w-6 h-6 rounded-md"></div>
                    <div className="bg-gray-200 h-4 w-20 rounded"></div>
                </div>
                <div className="bg-gray-200 h-4 w-12 rounded"></div>
            </div>

            {/* Timer */}
            <div className="bg-gray-200 h-6 w-full rounded mb-1.5"></div>

            {/* Customer */}
            <div className="flex justify-between items-baseline mb-2">
                <div className="bg-gray-200 h-4 w-24 rounded"></div>
                <div className="bg-gray-200 h-4 w-16 rounded"></div>
            </div>

            {/* Address line */}
            <div className="bg-gray-200 h-8 w-full rounded flex-1"></div>
        </div>
    );
};

export default SkeletonCard;
