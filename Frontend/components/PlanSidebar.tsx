import React from 'react';
import { MapPin, Sprout, X } from 'lucide-react';
import { useFarm } from '../src/context/FarmContext';
import { useLanguage } from '../src/context/LanguageContext';
import { getLocalizedValue, normalizeValue } from '../src/utils/localizationUtils';

interface PlanSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    selectedCrop: string | null;
    setSelectedCrop: (crop: string) => void;
    isDrawer?: boolean;
}

export const PlanSidebar: React.FC<PlanSidebarProps> = ({
    isOpen,
    onClose,
    selectedCrop,
    setSelectedCrop,
    isDrawer = false
}) => {
    const { activeFarm, setActiveFarm, farms } = useFarm();
    const { t, language } = useLanguage();

    const uniqueCrops = activeFarm?.crops 
        ? [...new Set(activeFarm.crops)]
        : [];

    return (
        <>
            {isOpen && (
                <div 
                    className={`fixed inset-0 bg-black/50 z-[100] ${isDrawer ? '' : 'md:hidden'}`}
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <div className={`
                fixed inset-y-0 left-0 bg-white shadow-2xl z-[110]
                w-[280px] md:w-[320px] h-full border-r border-[#E0E6E6] flex flex-col
                transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-4 flex items-center justify-between border-b border-[#E0E6E6]">
                    <h2 className="text-lg font-bold text-[#002105]">CropCycle Options</h2>
                    <button onClick={onClose} className={`${isDrawer ? '' : 'md:hidden'} p-2 text-stone-500 hover:text-stone-800`}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Farm Options */}
                    <div>
                        <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest mb-3">Your Farms</h3>
                        <div className="space-y-2">
                            {farms.length === 0 ? (
                                <p className="text-sm text-stone-500">No farms added yet.</p>
                            ) : (
                                farms.map((f, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            setActiveFarm(f);
                                            onClose();
                                        }}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all font-bold ${activeFarm?.nickname === f.nickname ? 'bg-[#1B5E20] text-white shadow-md' : 'bg-stone-50 text-stone-700 hover:bg-stone-100'}`}
                                    >
                                        <MapPin className={`w-5 h-5 flex-shrink-0 ${activeFarm?.nickname === f.nickname ? 'text-white' : 'text-stone-400'}`} />
                                        <span className="truncate">{f.nickname || `Farm ${i+1}`}</span>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Crop Options */}
                    <div>
                        <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest mb-3">Crops in Farm</h3>
                        <div className="space-y-2">
                            {uniqueCrops.length === 0 ? (
                                <p className="text-sm text-stone-500">No crops in active farm.</p>
                            ) : (
                                uniqueCrops.map(crop => (
                                    <button
                                        key={crop}
                                        onClick={() => {
                                            setSelectedCrop(crop);
                                            onClose();
                                        }}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all font-bold ${selectedCrop === crop ? 'bg-[#E8F5E9] text-[#1B5E20] border-2 border-[#1B5E20]' : 'bg-white border-2 border-transparent text-stone-700 hover:border-stone-200 shadow-sm'}`}
                                    >
                                        <Sprout className={`w-5 h-5 flex-shrink-0 ${selectedCrop === crop ? 'text-[#1B5E20]' : 'text-stone-400'}`} />
                                        <span className="truncate">{getLocalizedValue(crop, 'crops', language)}</span>
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
