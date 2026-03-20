import React, { useState } from 'react';
import { Menu } from 'lucide-react';

interface ChatLayoutProps {
    sidebar?: React.ReactNode;
    children: React.ReactNode;
}

export const ChatLayout: React.FC<ChatLayoutProps> = ({ sidebar, children }) => {
    return (
        <div className="flex h-full w-full bg-white/40 backdrop-blur-xl md:rounded-[32px] md:border border-[#E6E6E6] shadow-xl overflow-hidden relative">
            {/* Sidebar Wrapper - Only if sidebar exists */}
            {sidebar && (
                <div className="absolute inset-y-0 left-0 z-20 md:relative md:w-[280px] lg:w-[320px] h-full">
                    {sidebar}
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full w-full relative z-10 bg-transparent min-w-0">
                {children}
            </div>
        </div>
    );
};

