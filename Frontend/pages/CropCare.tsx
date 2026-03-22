import React, { useState, useEffect } from 'react';
import { useLanguage } from '../src/context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Sprout, Bug, ArrowRight, ArrowLeft } from 'lucide-react';
import DetectionHistorySidebar, { getDetectionHistory, clearDetectionHistory } from '../components/DetectionHistorySidebar';

const CropCare: React.FC = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();

    // Sidebar State
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        // Load combined history
        const diseaseHistory = getDetectionHistory('disease');
        const pestHistory = getDetectionHistory('pest');
        const combined = [...diseaseHistory, ...pestHistory].sort((a, b) => b.timestamp - a.timestamp);
        setHistory(combined);
    }, [isSidebarOpen]);

    // Listen for toggle-sidebar event
    useEffect(() => {
        const handleToggle = () => setIsSidebarOpen(prev => !prev);
        window.addEventListener('toggle-sidebar', (handleToggle as EventListener));
        return () => window.removeEventListener('toggle-sidebar', (handleToggle as EventListener));
    }, []);

    const handleHistorySelect = (entry: any) => {
        setIsSidebarOpen(false);
        if (entry.type === 'disease') {
            navigate('/crop-care/disease');
        } else {
            navigate('/crop-care/pest');
        }
    };

    const handleClearHistory = () => {
        clearDetectionHistory('disease');
        clearDetectionHistory('pest');
        setHistory([]);
    };

    return (
        <React.Fragment>
        <DetectionHistorySidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            type="aggregate"
            entries={history}
            onSelect={handleHistorySelect}
            onClear={handleClearHistory}
        />
        <div className="max-w-6xl mx-auto p-4 md:p-8 pb-32 relative">
            <div className="mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E6E6E6] text-[#1B5E20] font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm group"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    {t.back || "Back"}
                </button>
            </div>

            <div className="mb-12 text-center border-b-4 border-deep-green pb-6">
                <h1 className="text-4xl md:text-5xl font-extrabold text-deep-green tracking-tight mb-4 uppercase">
                    {t.cropCareTitle}
                </h1>
                <p className="text-text-secondary font-medium max-w-2xl mx-auto text-lg">
                    {t.cropCareSubtitle}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Disease Detector Card */}
                <div className="bg-white border-2 border-[#E6E6E6] p-8 md:p-12 hover:border-deep-green transition-all shadow-md rounded-3xl flex flex-col items-center text-center group">
                    <div className="w-20 h-20 bg-light-green text-deep-green flex items-center justify-center font-bold rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                        <Sprout className="w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-deep-green uppercase tracking-tight mb-4">{t.diseaseDetector}</h2>
                    <p className="text-gray-600 mb-8 font-medium">
                        Upload a photo of your crop to instantly identify diseases and get treatment recommendations.
                    </p>
                    <button
                        onClick={() => navigate('/crop-care/disease')}
                        className="mt-auto px-8 py-4 bg-deep-green text-white font-bold rounded-xl hover:bg-deep-green/90 transition-all flex items-center gap-2 uppercase tracking-wider shadow-lg hover:shadow-xl active:scale-95"
                    >
                        {t.getStarted || "Get Started"} <ArrowRight className="w-5 h-5" />
                    </button>
                </div>

                {/* Pest Detector Card */}
                <div className="bg-white border-2 border-[#E6E6E6] p-8 md:p-12 hover:border-[#D97706] transition-all shadow-md rounded-3xl flex flex-col items-center text-center group">
                    <div className="w-20 h-20 bg-[#FFF4E6] text-[#D97706] flex items-center justify-center font-bold rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                        <Bug className="w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-deep-green uppercase tracking-tight mb-4">{t.pestDetector}</h2>
                    <p className="text-gray-600 mb-8 font-medium">
                        Identify pests affecting your crops and receive immediate control solutions.
                    </p>
                    <button
                        onClick={() => navigate('/crop-care/pest')}
                        className="mt-auto px-8 py-4 bg-[#D97706] text-white font-bold rounded-xl hover:bg-[#B45309] transition-all flex items-center gap-2 uppercase tracking-wider shadow-lg hover:shadow-xl active:scale-95"
                    >
                        {t.getStarted || "Get Started"} <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
        </React.Fragment>
    );
};

export default CropCare;
