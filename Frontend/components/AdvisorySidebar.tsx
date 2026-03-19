import React from 'react';
import { Briefcase, Clock, X } from 'lucide-react';
import { useLanguage } from '../src/context/LanguageContext';

interface Recommendation {
    id: string;
    title: string;
}

interface AdvisorySidebarProps {
    isOpen: boolean;
    onClose: () => void;
    recentAdvisories?: Recommendation[];
    onSelectAdvisory?: (advisory: Recommendation) => void;
}

export const AdvisorySidebar: React.FC<AdvisorySidebarProps> = ({
    isOpen,
    onClose,
    recentAdvisories = [],
    onSelectAdvisory
}) => {
    const { t } = useLanguage();

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-20 md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <div className={`
                fixed md:absolute inset-y-0 left-0 bg-white md:bg-transparent z-30
                w-[280px] md:w-full h-full border-r border-[#E0E6E6] flex flex-col
                transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="p-4 flex items-center justify-between border-b border-[#E0E6E6]">
                    <h2 className="text-lg font-bold text-[#002105]">Advisory History</h2>
                    <button onClick={onClose} className="md:hidden p-2 text-stone-500 hover:text-stone-800">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    <div>
                        <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Clock className="w-4 h-4" /> Previous Businesses
                        </h3>
                        <div className="space-y-2">
                            {recentAdvisories.length === 0 ? (
                                <p className="text-sm text-stone-500 font-medium p-3 bg-stone-50 rounded-xl border border-stone-100 italic">
                                    No previous advisories found.
                                </p>
                            ) : (
                                recentAdvisories.map((adv, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            if (onSelectAdvisory) onSelectAdvisory(adv);
                                            onClose();
                                        }}
                                        className="w-full text-left p-3 rounded-xl hover:bg-[#E8F5E9] transition-colors border-2 border-transparent hover:border-[#1B5E20] group"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="mt-1 w-8 h-8 rounded-lg bg-[#F1F8E9] text-[#1B5E20] flex items-center justify-center group-hover:bg-[#1B5E20] group-hover:text-white transition-colors">
                                                <Briefcase className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-[#002105] text-sm truncate">{adv.title}</p>
                                                <p className="text-xs text-stone-500 truncate">Generated Advisory</p>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
