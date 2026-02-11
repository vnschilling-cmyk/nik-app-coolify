import React from 'react';

interface StatsRingProps {
    percentage: number;
    label: string;
    subLabel?: string;
    gradeLabel?: string;
    colorClass: string;
    size?: number;
    strokeWidth?: number;
}

export const StatsRing: React.FC<StatsRingProps> = ({
    percentage,
    label,
    subLabel,
    gradeLabel,
    colorClass,
    size = 80,
    strokeWidth = 6
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    // Extract color from Tailwind class (rough mapping for the SVG stroke)
    // We'll use a CSS variable or a standard hex if needed, 
    // but for now, we'll let the class handle the color if possible via currentColor.
    return (
        <div className="flex flex-col items-center gap-2">
            <div
                className="relative flex flex-col items-center justify-center"
                style={{ width: `${size}px`, height: `${size}px` }}
            >
                <svg
                    width={size}
                    height={size}
                    viewBox={`0 0 ${size} ${size}`}
                    className={`transform -rotate-90 ${colorClass}`}
                >
                    {/* Background Circle */}
                    <circle
                        className="text-slate-100 dark:text-slate-800"
                        strokeWidth={strokeWidth}
                        stroke="currentColor"
                        strokeOpacity={0.2}
                        fill="transparent"
                        r={radius}
                        cx={size / 2}
                        cy={size / 2}
                    />
                    {/* Progress Circle */}
                    <circle
                        className="transition-all duration-1000 ease-out"
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx={size / 2}
                        cy={size / 2}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                    <span className="text-xl font-bold text-slate-900 dark:text-white">{label}</span>
                    {gradeLabel && <span className="text-sm font-bold mt-1 text-current">{gradeLabel}</span>}
                </div>
            </div>
            {subLabel && (
                <div className="px-2.5 py-1 bg-zinc-100 dark:bg-white/5 rounded-full shadow-sm">
                    <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{subLabel}</span>
                </div>
            )}
        </div>
    );
};
