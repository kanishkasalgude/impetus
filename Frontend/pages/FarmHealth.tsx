import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useLanguage } from '../src/context/LanguageContext';
import { useFarm } from '../src/context/FarmContext';
import { useNavigate } from 'react-router-dom';
import {
    Cloud,
    TrendingUp,
    AlertTriangle,
    MapPin,
    Info,
    Calendar,
    CheckCircle2,
    Sparkles,
    Search,
    X,
    MessageSquare,
    Send,
    Loader2,
    ArrowLeft,
    Menu
} from 'lucide-react';
import { PlanSidebar } from '../components/PlanSidebar';

interface AIResult {
    fertilizer_options?: {
        name: string;
        action: string;
        quantity: string;
        timing: string;
        advantages: string[];
    }[];
    market_advice?: {
        timing: string;
        rationale: string;
        confidence_percentage: number;
        confidence_label: string;
    };
    insights?: string[];
}

const FarmHealth: React.FC = () => {
    const { t } = useLanguage();
    const { farms, activeFarm } = useFarm();
    const navigate = useNavigate();

    // AI Integration States
    const initialAiResults = useMemo(() => {
        const saved = sessionStorage.getItem('farmHealthResults');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { return {}; }
        }
        return {};
    }, []);

    const [aiResults, setAiResults] = useState<Record<string, AIResult>>(initialAiResults);
    const [analyzing, setAnalyzing] = useState<Record<string, boolean>>({});
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedCrop, setSelectedCrop] = useState<string | null>(null);

    // Sync selected crop
    useEffect(() => {
        if (activeFarm && activeFarm.crops && activeFarm.crops.length > 0) {
            if (!selectedCrop || !activeFarm.crops.includes(selectedCrop)) {
                setSelectedCrop(activeFarm.crops[0]);
            }
        } else {
            setSelectedCrop(null);
        }
    }, [activeFarm, selectedCrop]);

    useEffect(() => {
        sessionStorage.setItem('farmHealthResults', JSON.stringify(aiResults));
    }, [aiResults]);

    // Listen for hamburger menu toggle from the global header
    useEffect(() => {
        const handleToggle = () => setIsSidebarOpen(prev => !prev);
        window.addEventListener('toggle-sidebar', handleToggle as EventListener);
        return () => window.removeEventListener('toggle-sidebar', handleToggle as EventListener);
    }, []);

    const initialLoadTriggered = useRef<Set<string>>(new Set(Object.keys(initialAiResults)));

    const analyzeSoil = async (farm: any, cropIndex: number, crop: string, key: string) => {
        setAnalyzing(prev => ({ ...prev, [key]: true }));

        try {
            const inputs = { n: 'N/A', p: 'N/A', k: 'N/A', ph: 'N/A' };
            const token = localStorage.getItem('token');
            const location = farm.district && farm.state ? `${farm.district}, ${farm.state}` : (farm.state || 'India');
            const soilType = farm.soilType || farm.landType || 'Unknown Soil Type';

            const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const res = await fetch(`${API_BASE_URL}/farm-health/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ crop, soil_data: inputs, location, soil_type: soilType })
            });
            const data = await res.json();
            if (data.success && data.result) {
                setAiResults(prev => ({ ...prev, [key]: data.result }));
            }
        } catch (error) {
            console.error("AI Analysis failed", error);
        } finally {
            setAnalyzing(prev => ({ ...prev, [key]: false }));
        }
    };

    const openDeepDive = (result: AIResult, crop: string) => {
        const fertilizers = result.fertilizer_options?.map(opt => opt.name || opt.action).filter(Boolean).join(', ') || '';
        const prompt = `Please provide an expert consultation on the fertilizer recommendations for ${crop}, specifically focusing on the use of ${fertilizers}. I require a detailed explanation of the rationale behind this selection, its impact on the growth cycle, and best practices for sustainable application.`;
        navigate('/chat', { state: { initialMessage: prompt, fromFarmHealth: true } });
    };

    // Auto-load analysis
    useEffect(() => {
        if (activeFarm && selectedCrop) {
            const cIndex = activeFarm.crops.indexOf(selectedCrop);
            if (cIndex !== -1) {
                const key = `active-${cIndex}`;
                if (!initialLoadTriggered.current.has(key)) {
                    initialLoadTriggered.current.add(key);
                    // Fire and forget analyze call
                    analyzeSoil(activeFarm, cIndex, selectedCrop, key).catch(console.error);
                }
            }
        }
    }, [activeFarm, selectedCrop]); // Trigger when activeFarm or selectedCrop changes

    return (
        <div className="min-h-screen bg-[#FBFBFA] pb-20">
            {/* Sidebar */}
            <PlanSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                selectedCrop={selectedCrop}
                setSelectedCrop={setSelectedCrop}
                isDrawer={true}
            />



            <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
                {!activeFarm ? (
                    <div className="text-center py-20 text-gray-400 font-bold uppercase tracking-widest text-sm">No active farm selected. Please add a farm in your Profile.</div>
                ) : (
                    [activeFarm].map((farm, fIndex) => (
                        <div key={fIndex} className="space-y-6">
                            {/* Farm and Crop Header */}
                            <div className="px-2">
                                <h2 className="text-2xl font-black text-[#1B5E20] uppercase tracking-tight flex items-center gap-2">
                                    <MapPin className="w-6 h-6" /> {farm.nickname} {selectedCrop && `• ${selectedCrop}`}
                                </h2>
                                <p className="text-[#1B5E20]/70 font-bold text-sm mt-1 uppercase tracking-wider">
                                    {farm.landSize} {farm.unit} • {farm.landType}
                                </p>
                            </div>

                            <div>
                                {(!farm.crops || farm.crops.length === 0) ? (
                                    <div className="bg-yellow-50 border-2 border-dashed border-yellow-200 rounded-2xl p-8 text-center">
                                        <AlertTriangle className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
                                        <p className="text-yellow-800 font-bold text-sm uppercase">{t.noCropSelected || "No crops selected for this farm."}</p>
                                    </div>
                                ) : !selectedCrop ? (
                                    <div className="bg-yellow-50 border-2 border-dashed border-yellow-200 rounded-2xl p-6 text-center">
                                        <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                                        <p className="text-yellow-800 font-bold text-sm uppercase">Please select a crop from the sidebar.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {(() => {
                                            const cIndex = farm.crops.indexOf(selectedCrop);
                                            const cropKey = `active-${cIndex}`;
                                            const result = aiResults[cropKey];

                                            return (
                                                <div key={cIndex} className="space-y-4">
                                                    <h4 className="text-sm font-black text-[#1E1E1E] uppercase tracking-widest flex items-center gap-2 px-2 mb-3">
                                                        <TrendingUp className="w-4 h-4 text-[#1B5E20]" /> {t.fertilizerRec || "Fertilizer Recommendation"}
                                                    </h4>

                                                    <div className="w-full">
                                                        {!result ? (
                                                                <div className="flex flex-col items-center justify-center py-10 px-4 text-center rounded-3xl border border-emerald-100/50 bg-gradient-to-b from-transparent to-emerald-50/30">
                                                                    <div className="relative mb-5">
                                                                        <div className="absolute inset-0 bg-emerald-200 rounded-full blur-xl opacity-50 animate-pulse"></div>
                                                                        <div className="relative bg-white p-3 rounded-2xl shadow-sm border border-emerald-50">
                                                                            <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
                                                                        </div>
                                                                    </div>
                                                                    <h4 className="text-sm font-black uppercase tracking-widest text-emerald-800 mb-1">Analyzing Crop Context...</h4>
                                                                    <p className="text-xs font-medium text-emerald-600/70 max-w-xs leading-relaxed">Cross-referencing your soil type and location with the latest agrinomic AI models.</p>
                                                                </div>
                                                            ) : (
                                                                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-3">
                                                                    {result.fertilizer_options?.map((option, optIdx) => (
                                                                        <div key={optIdx} className="border border-emerald-100 rounded-2xl p-4 md:p-5 bg-white shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden mb-4">
                                                                            {/* Subtle Background Accent */}
                                                                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-10 opacity-60"></div>

                                                                            <div className="flex items-start gap-4 mb-4">
                                                                                <div className="w-10 h-10 bg-gradient-to-br from-[#1B5E20] to-emerald-600 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-sm shrink-0">
                                                                                    {optIdx + 1}
                                                                                </div>
                                                                                <div className="flex-1 pt-0.5">
                                                                                    <h5 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">Option {optIdx + 1}</h5>
                                                                                    <h4 className="text-lg md:text-xl font-black text-gray-900 leading-tight">
                                                                                        {option.name ? option.name : option.action}
                                                                                    </h4>
                                                                                    {option.name && option.action && (
                                                                                        <p className="text-sm font-medium text-gray-600 mt-0.5">{option.action}</p>
                                                                                    )}
                                                                                </div>
                                                                            </div>

                                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                                                                <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100">
                                                                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                                                                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Quantity
                                                                                    </p>
                                                                                    <p className="text-sm font-bold text-gray-800">{option.quantity}</p>
                                                                                </div>
                                                                                <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100">
                                                                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                                                                        <span className="w-2 h-2 rounded-full bg-blue-400"></span> Timing
                                                                                    </p>
                                                                                    <p className="text-sm font-bold text-gray-800">{option.timing}</p>
                                                                                </div>
                                                                            </div>

                                                                            {option.advantages && option.advantages.length > 0 && (
                                                                                <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100/50">
                                                                                    <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                                                                        <Sparkles className="w-3.5 h-3.5" /> Advantages & Benefits
                                                                                    </p>
                                                                                    <ul className="space-y-2">
                                                                                        {option.advantages.map((adv, idx) => (
                                                                                            <li key={idx} className="text-sm font-medium text-gray-700 flex items-start gap-2">
                                                                                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                                                                                <span className="leading-relaxed">{adv}</span>
                                                                                            </li>
                                                                                        ))}
                                                                                    </ul>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}

                                                                    <button
                                                                        onClick={() => openDeepDive(result, selectedCrop)}
                                                                        className="w-full mt-2 group relative flex items-center justify-center gap-3 bg-gray-900 text-white px-5 py-3 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-emerald-900/20 active:scale-[0.98]">
                                                                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                                                        <Sparkles className="w-4 h-4 relative z-10 text-emerald-400 group-hover:text-white transition-colors" />
                                                                        <span className="relative z-10 text-sm font-black uppercase tracking-[0.2em]">Deep Dive Analysis</span>
                                                                    </button>
                                                                </div>
                                                            )}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default FarmHealth;
