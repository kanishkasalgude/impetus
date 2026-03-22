import React from 'react';
import { useLanguage } from '../src/context/LanguageContext';

interface WeatherData {
    temperature: number;
    condition: string;
    humidity: number;
    wind_speed: number;
    daily_max_temp: number;
    daily_min_temp: number;
    rainfall_probability: number;
}

interface WeatherModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: WeatherData | null;
    loading: boolean;
    location: string;
}

const WeatherModal: React.FC<WeatherModalProps> = ({ isOpen, onClose, data, loading, location }) => {
    const { t } = useLanguage();
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-[var(--border-color)]">

                {/* Header - Changed to White Background */}
                <div className="bg-white p-6 pb-2 text-[var(--text-primary)] flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2 text-[var(--color-primary)]">
                            <span className="text-3xl"></span> {location}
                        </h2>
                        <p className="text-[var(--text-tertiary)] text-sm font-medium mt-1">{t.weather.liveUpdates}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded-full transition-colors border border-[var(--border-color)]"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 pt-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-10 space-y-4">
                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--color-primary)]"></div>
                            <p className="text-[var(--text-tertiary)] font-medium">{t.weather.fetching}</p>
                        </div>
                    ) : data ? (
                        <div className="space-y-8">
                            {/* Main Temp */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-5xl font-extrabold text-[var(--text-primary)]">{data.temperature}°C</div>
                                    <div className="text-[var(--color-accent)] font-bold text-lg mt-1">{data.condition}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-[var(--text-tertiary)] font-bold uppercase tracking-widest mb-1">{t.weather.highLow}</div>
                                    <div className="text-xl font-bold text-[var(--text-primary)]">{data.daily_max_temp}° / {data.daily_min_temp}°</div>
                                </div>
                            </div>

                            {/* Grid Stats */}
                            <div className="grid grid-cols-3 gap-2 sm:gap-4">
                                <div className="bg-[var(--bg-secondary)] p-2 sm:p-4 rounded-2xl border border-[var(--border-color)] flex flex-col items-center text-center hover:border-[var(--color-primary)] transition-colors group">
                                    <span className="text-xl sm:text-2xl mb-1 sm:mb-2"></span>
                                    <span className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider group-hover:text-[var(--color-primary)] transition-colors">{t.weather.humidity}</span>
                                    <span className="text-lg font-extrabold text-[var(--text-primary)] mt-1">{data.humidity}%</span>
                                </div>
                                <div className="bg-[var(--bg-secondary)] p-2 sm:p-4 rounded-2xl border border-[var(--border-color)] flex flex-col items-center text-center hover:border-[var(--color-primary)] transition-colors group">
                                    <span className="text-xl sm:text-2xl mb-1 sm:mb-2"></span>
                                    <span className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider group-hover:text-[var(--color-primary)] transition-colors">{t.weather.wind}</span>
                                    <span className="text-lg font-extrabold text-[var(--text-primary)] mt-1">{data.wind_speed} <span className="text-xs font-bold">km/h</span></span>
                                </div>
                                <div className="bg-[var(--bg-secondary)] p-2 sm:p-4 rounded-2xl border border-[var(--border-color)] flex flex-col items-center text-center hover:border-[var(--color-primary)] transition-colors group">
                                    <span className="text-xl sm:text-2xl mb-1 sm:mb-2"></span>
                                    <span className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider group-hover:text-[var(--color-primary)] transition-colors">{t.weather.rain}</span>
                                    <span className="text-lg font-extrabold text-[var(--text-primary)] mt-1">{data.rainfall_probability}%</span>
                                </div>
                            </div>

                            {/* Advisory Tip */}
                            <div className="bg-[var(--color-primary-light)] p-4 rounded-2xl border border-[var(--color-primary)]/20 flex gap-3 items-start">
                                <div className="bg-[var(--color-primary)] text-white p-1.5 rounded-lg mt-0.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5c0-2 2-4 2-4s-4-2-4-2z" /></svg>
                                </div>
                                <div>
                                    <p className="text-sm text-[var(--color-primary)] font-bold">{t.weather.farmingTip}</p>
                                    <p className="text-xs text-[var(--text-secondary)] font-medium mt-1 leading-relaxed">
                                        {data.rainfall_probability > 50
                                            ? t.weather.rainWarning
                                            : t.weather.goodConditions}
                                    </p>
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-red-500 font-bold">{t.weather.loadError}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WeatherModal;

