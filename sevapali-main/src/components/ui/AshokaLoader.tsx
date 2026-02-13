import React from 'react';
import { cn } from '@/lib/utils';

interface AshokaLoaderProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

const AshokaLoader: React.FC<AshokaLoaderProps> = ({ className, size = 'md' }) => {
    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-12 h-12',
        lg: 'w-24 h-24',
        xl: 'w-32 h-32',
    };

    return (
        <div className={cn("relative flex items-center justify-center", className)}>
            <div className={cn("animate-spin text-primary", sizeClasses[size])}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" className="opacity-25" />
                    <path d="M12 2v20 M2 12h20 M4.93 4.93l14.14 14.14 M19.07 4.93L4.93 19.07" className="opacity-75" />
                    <path d="M12 12 m-8 0 a 8 8 0 1 0 16 0 a 8 8 0 1 0 -16 0" className="opacity-90" strokeWidth="1" />

                    {/* 24 Spokes Representation - Simplified for SVG clarity at small sizes */}
                    {/* Using a few crossing lines to simulate the wheel effect */}
                    <path d="M12 2 L12 22" />
                    <path d="M2 12 L22 12" />
                    <path d="M4.93 4.93 L19.07 19.07" />
                    <path d="M19.07 4.93 L4.93 19.07" />
                    <path d="M7 3.34 L17 20.66" />
                    <path d="M17 3.34 L7 20.66" />
                    <path d="M3.34 7 L20.66 17" />
                    <path d="M20.66 7 L3.34 17" />
                </svg>
            </div>
        </div>
    );
};

export default AshokaLoader;
