import React, { useState, useEffect } from 'react';
import { useLanguage } from '../src/context/LanguageContext';
import { api } from '../src/services/api';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, X, ExternalLink } from 'lucide-react';

interface NewsArticle {
    headline: string;
    source: string;
    summary: string;
    url: string;
    published_at: string;
    image?: string;
    action?: string;
    category?: string;
}

interface NewsResponse {
    success: boolean;
    news: NewsArticle[];
    weather_summary?: string;
    weather_alerts?: string[];
    advice?: string[];
    next_actions?: string[];
    error?: string;
}

type NewsMode = 'personalized' | 'general';

const STARRED_KEY = 'krishisahai_starred_news';

const NewsPage: React.FC = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newsMode, setNewsMode] = useState<NewsMode>('general');

    // Starred articles state — persisted in localStorage
    const [starredUrls, setStarredUrls] = useState<Set<string>>(() => {
        try {
            const stored = localStorage.getItem(STARRED_KEY);
            return stored ? new Set(JSON.parse(stored)) : new Set();
        } catch {
            return new Set();
        }
    });

    // Starred sidebar — driven by the header hamburger (toggle-sidebar event)
    const [isStarredSidebarOpen, setIsStarredSidebarOpen] = useState(false);

    useEffect(() => {
        const handleToggle = () => setIsStarredSidebarOpen(prev => !prev);
        window.addEventListener('toggle-sidebar', handleToggle as EventListener);
        return () => window.removeEventListener('toggle-sidebar', handleToggle as EventListener);
    }, []);

    // Persist starred to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(STARRED_KEY, JSON.stringify([...starredUrls]));
        } catch { /* ignore */ }
    }, [starredUrls]);

    const fetchNews = async (mode: NewsMode = newsMode) => {
        setLoading(true);
        setError('');
        try {
            let data;
            if (mode === 'personalized') {
                if (!auth.currentUser) {
                    setError('Please login to view personalized news');
                    setLoading(false);
                    return;
                }
                const uid = auth.currentUser.uid;
                data = await api.get(`/news/${uid}`);
            } else {
                data = await api.get('/news/general');
            }

            if (data.success) {
                setNews(data.news);
            } else {
                setError(data.error || 'Failed to load news');
            }
        } catch (err: any) {
            console.error("News Fetch Error:", err);
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNews(newsMode);
    }, [newsMode]);

    const handleRefresh = () => fetchNews(newsMode);
    const handleModeChange = (mode: NewsMode) => setNewsMode(mode);

    const toggleStar = (article: NewsArticle) => {
        setStarredUrls(prev => {
            const next = new Set(prev);
            if (next.has(article.url)) {
                next.delete(article.url);
            } else {
                next.add(article.url);
            }
            return next;
        });
    };

    const starredArticles = news.filter(a => starredUrls.has(a.url));
    const starCount = starredUrls.size;

    return (
        <div className="max-w-7xl mx-auto px-6 py-10 relative">

            {/* Starred Articles Sidebar — triggered by header hamburger */}
            {isStarredSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/30 z-[100] md:hidden"
                    onClick={() => setIsStarredSidebarOpen(false)}
                />
            )}
            <div
                className={`fixed top-0 left-0 h-full w-80 bg-white border-r border-gray-200 shadow-2xl z-[110] transform transition-transform duration-300 ${
                    isStarredSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="flex items-center justify-between p-4 border-b border-[#1B5E20]/20 bg-[#E8F5E9]">
                    <div className="flex items-center gap-2 font-bold text-[#1B5E20]">
                        <Star size={18} className="fill-[#F59E0B] text-[#F59E0B]" />
                        <span>Starred News</span>
                        {starCount > 0 && (
                            <span className="bg-[#1B5E20] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                {starCount}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => setIsStarredSidebarOpen(false)}
                        className="p-1 hover:bg-[#1B5E20]/10 rounded-lg transition-colors"
                    >
                        <X size={18} className="text-[#1B5E20]" />
                    </button>
                </div>

                <div className="overflow-y-auto p-3 space-y-3" style={{ maxHeight: 'calc(100vh - 68px)' }}>
                    {starredArticles.length === 0 ? (
                        <div className="text-center text-gray-400 py-16 px-4">
                            <Star size={40} className="mx-auto mb-3 opacity-30" />
                            <p className="text-sm font-bold text-gray-500">No starred articles yet</p>
                            <p className="text-xs mt-1 text-gray-400">Tap the ★ on any article to save it here</p>
                        </div>
                    ) : (
                        starredArticles.map((article, idx) => (
                            <div
                                key={idx}
                                className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm hover:shadow-md transition-all"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        {article.category && (
                                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full inline-block mb-1 ${
                                                article.category === 'RISK' ? 'bg-red-100 text-red-700' :
                                                article.category === 'MARKET' ? 'bg-blue-100 text-blue-700' :
                                                article.category === 'GOVERNMENT' ? 'bg-purple-100 text-purple-700' :
                                                'bg-[#E8F5E9] text-[#1B5E20]'
                                            }`}>
                                                {article.category || article.source}
                                            </span>
                                        )}
                                        <p className="text-sm font-bold text-[#002105] leading-snug mb-1 line-clamp-2">
                                            {article.headline}
                                        </p>
                                        <p className="text-xs text-gray-400">{article.source}</p>
                                    </div>
                                    <div className="flex flex-col gap-1 flex-shrink-0">
                                        <button
                                            onClick={() => toggleStar(article)}
                                            className="p-1 hover:bg-yellow-50 rounded-lg transition-colors"
                                            title="Remove star"
                                        >
                                            <Star size={14} className="fill-[#F59E0B] text-[#F59E0B]" />
                                        </button>
                                        <a
                                            href={article.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1 hover:bg-[#E8F5E9] rounded-lg transition-colors"
                                            title="Open article"
                                        >
                                            <ExternalLink size={14} className="text-[#1B5E20]" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Page Header */}
            <div className="mb-10">
                {/* Back button row — above title, same style as all feature pages */}
                <div className="flex items-center justify-between mb-5">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E6E6E6] text-[#1B5E20] font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm group"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        {t.back || 'Back'}
                    </button>

                    {/* Refresh Button */}
                    <button
                        onClick={handleRefresh}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-[#1B5E20] text-[#1B5E20] rounded-xl font-bold hover:bg-[#1B5E20] hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={loading ? 'animate-spin' : ''}>
                            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                        </svg>
                        {t.refresh}
                    </button>
                </div>

                {/* Title below back button */}
                <div>
                    <h1 className="text-4xl font-extrabold text-[#002105] tracking-tight mb-2">
                        {t.newsTitle}
                    </h1>
                    <p className="text-lg text-[#1B5E20] font-medium">
                        {newsMode === 'personalized'
                            ? t.newsSubtitlePersonalized
                            : t.newsSubtitleGeneral
                        }
                    </p>
                </div>
            </div>

            {/* Toggle Buttons */}
            <div className="flex gap-4 mb-8">
                <button
                    onClick={() => handleModeChange('personalized')}
                    className={`flex-1 py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 ${newsMode === 'personalized'
                        ? 'bg-[#1B5E20] text-white shadow-lg'
                        : 'bg-white text-[#6B7878] border-2 border-[#E0E6E6] hover:border-[#1B5E20]'
                        }`}
                >
                    {t.personalizedNews}
                </button>
                <button
                    onClick={() => handleModeChange('general')}
                    className={`flex-1 py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 ${newsMode === 'general'
                        ? 'bg-[#1B5E20] text-white shadow-lg'
                        : 'bg-white text-[#6B7878] border-2 border-[#E0E6E6] hover:border-[#1B5E20]'
                        }`}
                >
                    {t.generalNews}
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1B5E20]"></div>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 text-red-600 p-6 rounded-2xl text-center">
                    <p className="font-bold">{error}</p>
                    <button onClick={handleRefresh} className="mt-4 px-4 py-2 bg-white border border-red-200 rounded-lg text-sm hover:bg-gray-50">
                        {t.retry}
                    </button>
                </div>
            ) : news.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-[#E0E6E6]">
                    <p className="text-[#6B7878] text-lg">{t.noNewsFound}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {news.map((item, index) => (
                        <div key={index} className="bg-white border border-[#E0E6E6] rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group">
                            {item.image && (
                                <div className="h-48 overflow-hidden">
                                    <img src={item.image} alt={item.headline} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                </div>
                            )}
                            <div className="p-6 flex flex-col flex-grow">
                                <div className="flex items-center justify-between mb-4">
                                    <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
                                        item.category === 'RISK' ? 'bg-red-100 text-red-700' :
                                        item.category === 'MARKET' ? 'bg-blue-100 text-blue-700' :
                                        item.category === 'GOVERNMENT' ? 'bg-purple-100 text-purple-700' :
                                        'bg-[#E8F5E9] text-[#1B5E20]'
                                    }`}>
                                        {item.category || item.source}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-[#6B7878] font-medium">
                                            {item.published_at ? new Date(item.published_at).toLocaleDateString() : 'Recent'}
                                        </span>
                                        {/* Star Button */}
                                        <button
                                            onClick={() => toggleStar(item)}
                                            className={`p-1.5 rounded-lg transition-all duration-200 ${
                                                starredUrls.has(item.url)
                                                    ? 'bg-[#FFF8E1] hover:bg-yellow-100'
                                                    : 'hover:bg-gray-100'
                                            }`}
                                            title={starredUrls.has(item.url) ? 'Remove bookmark' : 'Bookmark this article'}
                                        >
                                            <Star
                                                className={`w-4 h-4 transition-all duration-200 ${
                                                    starredUrls.has(item.url)
                                                        ? 'fill-[#F59E0B] text-[#F59E0B] scale-110'
                                                        : 'text-gray-300 hover:text-[#F59E0B]'
                                                }`}
                                            />
                                        </button>
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-[#002105] mb-3 leading-tight group-hover:text-[#1B5E20] transition-colors">
                                    {item.headline}
                                </h3>
                                <p className="text-[#1B5E20] text-sm leading-relaxed mb-4">
                                    {item.summary}
                                </p>

                                {item.action && (
                                    <div className="bg-[#FFF9C4] border-l-4 border-[#FBC02D] p-3 mb-6 rounded-r-lg">
                                        <p className="text-xs font-bold text-[#5F4B00] uppercase mb-1">Recommended Action:</p>
                                        <p className="text-sm text-[#002105] font-medium italic">"{item.action}"</p>
                                    </div>
                                )}
                                <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-[#1B5E20] font-bold hover:underline mt-auto"
                                >
                                    {t.readFullArticle}
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7l7 7-7 7" /></svg>
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NewsPage;
