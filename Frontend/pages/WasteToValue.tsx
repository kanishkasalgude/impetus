import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { api } from '../src/services/api';
import { auth, db } from '../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { ChatMessage } from '../types';
import { useLanguage } from '../src/context/LanguageContext';
import { useFarm } from '../src/context/FarmContext';
import {
    ArrowLeft,
    Recycle,
    Leaf,
    Search,
    ArrowRight,
    MessageCircle,
    User,
    Bot,
    Info,
    X,
    Sprout,
    Send,
    Loader2,
    Camera,
    Upload,
    History,
    FileText,
    ChevronRight,
    Search as SearchIcon
} from 'lucide-react';
import { onAuthStateChanged } from '../firebase';
import { chatService } from '../src/services/chatService';
import { useLoadingTips } from '../src/hooks/useLoadingTips';
import jsPDF from 'jspdf';

/* 
  Refactored to have a dedicated Chat View.
  - 'chat' ViewState added.
  - Inline chat removed from 'results'.
  - Back button added to 'chat' view.
*/

type ViewState = 'input' | 'processing' | 'results' | 'chat' | 'intro';

const WasteToValue: React.FC = () => {
    const { t, language: lang } = useLanguage();
    const { activeFarm } = useFarm();
    const navigate = useNavigate();
    const [view, setView] = useState<ViewState>('input');


    // State
    const [cropInput, setCropInput] = useState('');
    const [resultData, setResultData] = useState<any>(null);
    const [selectedOption, setSelectedOption] = useState<any | null>(null); // For Modal
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const loadingTip = useLoadingTips(view === 'processing');

    // History & Auth State
    const [user, setUser] = useState<any>(null);
    const [wasteHistory, setWasteHistory] = useState<any[]>([]);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleToggle = () => setIsHistoryOpen(prev => !prev);
        window.addEventListener('toggle-sidebar', (handleToggle as EventListener));
        return () => window.removeEventListener('toggle-sidebar', (handleToggle as EventListener));
    }, []);

    // Initial Greeting when entering results view
    useEffect(() => {
        if (view === 'results' && messages.length === 0 && resultData) {
            // Initial Greeting removed as per user request
            setMessages([]);
        }
    }, [view, resultData, lang]);

    // Auth & Waste Analysis History Subscription
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                // Subscribe to waste_history collection (analysis results, not chats)
                const q = query(
                    collection(db, 'users', currentUser.uid, 'waste_history'),
                    orderBy('createdAt', 'desc'),
                    limit(20)
                );
                const unsubHistory = onSnapshot(q, (snapshot) => {
                    const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                    setWasteHistory(items);
                });
                return () => unsubHistory();
            } else {
                setUser(null);
                setWasteHistory([]);
            }
        });
        return () => unsubscribe();
    }, []);

    // Helper: save analysis result to Firestore
    const saveWasteHistory = async (crop: string, result: any) => {
        if (!user) return;
        try {
            await addDoc(collection(db, 'users', user.uid, 'waste_history'), {
                title: `${crop} — Waste Analysis`,
                crop,
                result,
                createdAt: new Date()
            });
        } catch (err) {
            console.error('Failed to save waste history:', err);
        }
    };

    // Scroll to bottom of chat
    useEffect(() => {
        if (view === 'chat') {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, view]);


    const formatMessage = (text: string) => {
        if (!text) return '';
        // Replace bullet characters with proper markdown list items
        let formatted = text.replace(/•\s*/g, '\n- ');
        // Clean up excessive blank lines (3+ newlines -> 2)
        formatted = formatted.replace(/\n{3,}/g, '\n\n');
        return formatted.trim();
    };

    const handleAnalyze = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cropInput.trim()) return;

        setView('processing');
        setMessages([]); // Clear previous chat
        setActiveChatId(null); // Reset active chat for new analysis

        try {
            const response = await api.post('/waste-to-value/analyze', {
                crop: cropInput,
                language: lang === 'HI' ? 'Hindi' : lang === 'MR' ? 'Marathi' : 'English'
            });

            if (response.success && response.result) {
                setResultData(response.result);
                setView('results');
                saveWasteHistory(cropInput, response.result);
            } else {
                throw new Error('Invalid data format');
            }
        } catch (error) {
            console.error("Error analyzing waste:", error);
            setView('input');
        }
    };


    const handleActiveCropClick = (crop: string) => {
        setCropInput(crop);
        // Trigger analysis directly
        const langParam = lang === 'HI' ? 'Hindi' : lang === 'MR' ? 'Marathi' : 'English';

        setView('processing');
        setMessages([]);

        api.post('/waste-to-value/analyze', {
            crop: crop,
            language: langParam
        }).then(response => {
            if (response.success && response.result) {
                setResultData(response.result);
                setView('results');
                saveWasteHistory(crop, response.result);
            } else {
                throw new Error('Invalid data format');
            }
        }).catch(error => {
            console.error("Error analyzing waste for active crop:", error);
            setView('input');
        });
    };


    const handleSendMessage = async (textOverride?: string) => {
        const question = textOverride || chatInput;
        if (!question.trim() || isChatLoading) return;

        if (!textOverride) setChatInput('');
        setIsChatLoading(true);

        // Add User Message to UI
        const userMsg: ChatMessage = { role: 'user', text: question };
        setMessages(prev => [...prev, userMsg]);

        let currentChatId = activeChatId;

        // Create Chat in Firestore if it doesn't exist
        if (user && !currentChatId) {
            try {
                const title = `Waste: ${cropInput || 'Analysis'}`;
                currentChatId = await chatService.createChat(user.uid, title, undefined, 'waste');
                setActiveChatId(currentChatId);
            } catch (err) {
                console.error("Failed to create chat in Firestore:", err);
            }
        }

        // Save User Message to Firestore
        if (user && currentChatId) {
            chatService.saveMessage(user.uid, currentChatId, {
                role: 'user',
                content: question,
                createdAt: new Date()
            }).catch(e => console.error("Failed to save user message:", e));
        }

        // Add Placeholder for AI
        const aiMsgPlaceHolder = { role: 'model', text: '' } as ChatMessage;
        setMessages(prev => [...prev, aiMsgPlaceHolder]);

        try {
            const context = JSON.stringify(resultData);
            let accumulatedResponse = '';

            await api.stream(
                '/waste-to-value/chat/stream',
                {
                    context: context,
                    question: question,
                    language: lang
                },
                (chunk) => {
                    accumulatedResponse += chunk;
                    setMessages(prev => {
                        const newMsgs = [...prev];
                        newMsgs[newMsgs.length - 1] = { ...newMsgs[newMsgs.length - 1], text: accumulatedResponse };
                        return newMsgs;
                    });
                },
                (error) => {
                    console.error("Stream error:", error);
                }
            );

            // Save AI Message to Firestore
            if (user && currentChatId && accumulatedResponse) {
                chatService.saveMessage(user.uid, currentChatId, {
                    role: 'assistant',
                    content: accumulatedResponse,
                    createdAt: new Date()
                }).catch(e => console.error("Failed to save AI message:", e));
            }

        } catch (error) {
            console.error("Chat Error:", error);
        } finally {
            setIsChatLoading(false);
        }
    };


    const handleAskChatbot = (title: string) => {
        setView('chat');
        const question = `I want to know about ${title}`;
        // Small delay to ensure view switch happened and state is ready
        setTimeout(() => handleSendMessage(question), 100);
    };

    const handleKnowMore = (option: any) => {
        setSelectedOption(option);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Placeholder for image upload logic - switches to manual input
        setView('input');
    };

    const renderContent = () => {
    // --- RENDER VIEW: INPUT ---
    if (view === 'input' || view === 'intro') { // Modified to handle 'intro' and 'input' within this block
        return (
            <div className="min-h-[calc(100vh-80px)] overflow-hidden flex flex-col md:flex-row max-w-[1600px] mx-auto bg-white">
                {/* LEFT: Hero/Intro Section (40%) */}
                <div className={`w-full md:w-[40%] bg-deep-green text-white p-8 md:p-12 flex flex-col justify-between transition-all duration-500 relative overflow-hidden ${view !== 'intro' ? 'hidden md:flex' : 'flex'}`}>
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>

                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-4 py-2 border border-white/30 bg-white/10 mb-6 backdrop-blur-sm rounded-full">
                            <Recycle className="w-5 h-5" />
                            <span className="text-sm font-bold uppercase tracking-widest">{t.waste?.circularEconomy || "Circular Economy"}</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4 tracking-tight">
                            {t.wasteOptimizer || "Turn Waste into Wealth"}
                        </h1>
                        <p className="text-white/80 text-lg leading-relaxed max-w-md">
                            {t.wasteOptimizerSub || "Upload a photo of your farm waste and discover profitable ways to reuse, sell, or compost it."}
                        </p>
                    </div>

                    <div className="relative z-10 mt-8">
                        <div className="p-6 border border-white/20 bg-white/5 backdrop-blur-sm rounded-2xl">
                            <h3 className="text-sm font-bold uppercase tracking-wide mb-4 border-b border-white/20 pb-2">{t.waste?.recentSuccessStories || "Recent Success Stories"}</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                    <p className="text-sm">{t.waste?.successStory1 || "Ramesh sold 50kg Banana stem for ₹1200"}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                    <p className="text-sm">{t.waste?.successStory2 || "Anita created Bio-enzyme from citrus peel"}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Interaction Area (60%) */}
                <div className="w-full md:w-[60%] flex flex-col relative h-full">
                    {view === 'intro' && (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
                            <div className="w-full max-w-md">
                                <div className="w-20 h-20 bg-light-green text-deep-green flex items-center justify-center mx-auto mb-6 rounded-full">
                                    <Camera className="w-10 h-10" />
                                </div>
                                <h2 className="text-2xl font-bold text-deep-green mb-4 uppercase">{t.waste?.analyzeYourWaste || "Analyze Your Waste"}</h2>
                                <p className="text-gray-600 mb-8">{t.waste?.takePhotoOrUpload || "Take a photo or upload an image to get started."}</p>

                                <label className="block w-full cursor-pointer group">
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                    <div className="w-full py-5 bg-deep-green text-white font-bold text-lg uppercase tracking-widest hover:bg-deep-green/90 transition-all flex items-center justify-center gap-3 shadow-md group-active:scale-95 rounded-2xl">
                                        <Upload className="w-6 h-6" /> {t.waste?.uploadWastePhoto || "Upload Waste Photo"}
                                    </div>
                                </label>

                                <button onClick={() => setView('input')} className="mt-6 text-sm font-bold text-deep-green border-b border-deep-green hover:text-deep-blue hover:border-deep-blue transition-colors">
                                    {t.waste?.skipToManualInput || "Skip to Manual Input"}
                                </button>
                            </div>
                        </div>
                    )}
                    {view === 'input' && (
                        <div className="flex-1 flex flex-col items-start justify-start p-6 md:p-8 bg-white overflow-y-auto">
                            <div className="w-full">
                                <button
                                    onClick={() => navigate(-1)}
                                    className="mb-8 flex items-center gap-2 px-4 py-2 text-[#555555] hover:text-[#1B5E20] transition-colors bg-white rounded-xl hover:bg-gray-50 border border-gray-200 shadow-sm w-fit font-bold text-sm"
                                >
                                    <ArrowLeft className="w-4 h-4" /> {t.back || "Back"}
                                </button>

                                <div className="w-full max-w-xl mx-auto bg-white p-8 md:p-12 rounded-[32px] shadow-xl border border-gray-100">
                                    <div className="w-16 h-16 md:w-20 md:h-20 bg-light-green text-deep-green flex items-center justify-center mx-auto mb-6 rounded-full shadow-inner">
                                        <Leaf className="w-8 h-8 md:w-10 md:h-10" />
                                    </div>
                                    <h2 className="text-xl md:text-2xl font-black text-deep-green mb-4 uppercase text-center tracking-tight">{t.waste?.manualWasteInput || "Manual Waste Input"}</h2>
                                    <p className="text-gray-500 mb-8 text-center font-medium">{t.waste?.describeWaste || "Describe your farm waste to find valuable uses."}</p>

                                    <form onSubmit={handleAnalyze} className="space-y-6">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            required
                                            placeholder={t.selectWaste || "e.g. Tomato, Rice Straw"}
                                            className="w-full p-4 pl-12 text-lg bg-gray-100 border border-gray-300 rounded-2xl focus:border-deep-green focus:ring-1 focus:ring-deep-green outline-none transition-all placeholder-gray-500"
                                            value={cropInput}
                                            onChange={(e) => setCropInput(e.target.value)}
                                        />
                                        <Search className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    </div>

                                    {activeFarm && activeFarm.crops && activeFarm.crops.length > 0 && (
                                        <div className="mt-8 text-left">
                                            <h3 className="text-sm font-bold text-deep-green uppercase tracking-wider mb-4 border-l-4 border-deep-green pl-2">
                                                {activeFarm.nickname ? (t.waste?.farmCrops?.replace('{farm}', activeFarm.nickname) || `${activeFarm.nickname}'s Crops`) : (t.waste?.yourFarmCrops || "Your Farm Crops")}
                                            </h3>
                                            <div className="flex flex-wrap gap-3">
                                                {activeFarm.crops.map((crop, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => handleActiveCropClick(crop)}
                                                        className="px-4 py-2 bg-light-green text-deep-green border border-deep-green/20 font-bold hover:bg-deep-green hover:text-white transition-all transform hover:-translate-y-0.5 rounded-full"
                                                    >
                                                        {crop}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <button

                                        type="submit"
                                        disabled={!cropInput.trim()}
                                        className="w-full py-4 bg-deep-green hover:bg-deep-green/90 text-white text-lg font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-md group-active:scale-95 rounded-2xl"
                                    >
                                        {t.analyze || "Analyze"} <ArrowRight className="w-6 h-6" />
                                    </button>
                                </form>
                            </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- RENDER VIEW: PROCESSING ---
    if (view === 'processing') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[100vh] px-4 text-center">
                <div className="relative mb-6">
                    <div className="w-40 h-40 rounded-full border-4 border-[#E6E6E6] border-t-[#1B5E20] border-r-blue-500 animate-[spin_2s_linear_infinite] shadow-xl"></div>
                    <Recycle className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 text-[#1B5E20]" />
                </div>
                <h2 className="text-3xl font-extrabold text-[#1E1E1E] mt-8 mb-4">
                    {t.analyzingBtn}... {cropInput}
                </h2>
                <div className="max-w-md space-y-4 w-full">
                    <p className="text-[#555555] animate-pulse text-sm mb-4">{t.identifyingOpportunities}</p>
                    <div className="bg-[#E8F5E9] p-4 rounded-xl border border-[#1B5E20]/20 animate-in fade-in zoom-in duration-500">
                        <p className="text-[#1B5E20] font-bold italic text-sm">"{loadingTip}"</p>
                    </div>
                </div>
            </div>
        );
    }

    // --- RENDER VIEW: CHAT ---
    if (view === 'chat') {
        return (
            <div className="max-w-3xl mx-auto py-2 px-4 h-[calc(100vh-100px)] flex flex-col">
                <button
                    onClick={() => setView('results')}
                    className="mb-3 text-[#555555] hover:text-[#1B5E20] flex items-center gap-2 font-bold text-sm transition-colors w-fit"
                >
                    <ArrowLeft className="w-4 h-4" /> {t.back}
                </button>

                <div className="bg-white rounded-2xl shadow-xl border border-[#E6E6E6] overflow-hidden flex flex-col flex-grow">
                    {/* Chat Header */}
                    <div className="bg-white p-4 border-b border-[#E6E6E6] flex items-center gap-3 sticky top-0 z-10">
                        <div className="w-10 h-10 bg-[#E8F5E9] rounded-full flex items-center justify-center border border-[#E6E6E6]">
                            <MessageCircle className="w-5 h-5 text-[#1B5E20]" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base text-[#1E1E1E]">{t.knowledgeAssistant}</h3>
                            <p className="text-xs text-[#555555]">{t.chatPlaceholder}</p>
                        </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-grow p-4 overflow-y-auto bg-[#F5FAF5] scroll-smooth">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 py-10">
                                <MessageCircle className="w-10 h-10 mb-3 opacity-30" />
                                <p className="text-sm font-medium">Ask anything about your waste analysis</p>
                            </div>
                        )}
                        {messages.length > 0 && (
                            <div className="flex flex-col gap-4">
                                {messages.map((msg, index) => (
                                    <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        {/* Bot Avatar (left side) */}
                                        {msg.role !== 'user' && (
                                            <div className="w-8 h-8 rounded-full bg-white border border-[#E6E6E6] flex items-center justify-center flex-shrink-0 shadow-sm">
                                                <Bot className="w-4 h-4 text-[#1B5E20]" />
                                            </div>
                                        )}

                                        {/* Message bubble */}
                                        <div
                                            className={`max-w-[75%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed shadow-sm ${
                                                msg.role === 'user'
                                                    ? 'bg-[#1B5E20] text-white rounded-br-sm'
                                                    : 'bg-white text-[#1E1E1E] rounded-bl-sm border border-[#E6E6E6]'
                                            }`}
                                        >
                                            {msg.role === 'user' ? (
                                                <p className="whitespace-pre-wrap">{msg.text}</p>
                                            ) : (
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm, remarkBreaks]}
                                                    components={{
                                                        p: ({ node, ...props }) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                                                        ul: ({ node, ...props }) => <ul className="list-disc list-outside mb-2 ml-4 space-y-1" {...props} />,
                                                        ol: ({ node, ...props }) => <ol className="list-decimal list-outside mb-2 ml-4 space-y-1" {...props} />,
                                                        li: ({ node, ...props }) => <li className="leading-snug" {...props} />,
                                                        strong: ({ node, ...props }) => <strong className="font-bold text-[#1B5E20]" {...props} />,
                                                        h1: ({ node, ...props }) => <h1 className="text-base font-bold mb-1 text-[#1B5E20] mt-3 first:mt-0 border-b border-green-100 pb-1" {...props} />,
                                                        h2: ({ node, ...props }) => <h2 className="text-sm font-bold mb-1 text-[#1B5E20] mt-2 first:mt-0" {...props} />,
                                                        h3: ({ node, ...props }) => <h3 className="text-sm font-semibold mb-1 text-[#1B5E20] mt-2 first:mt-0" {...props} />,
                                                        hr: () => <hr className="my-2 border-gray-100" />,
                                                    }}
                                                >
                                                    {formatMessage(msg.text)}
                                                </ReactMarkdown>
                                            )}
                                        </div>

                                        {/* User Avatar (right side) */}
                                        {msg.role === 'user' && (
                                            <div className="w-8 h-8 rounded-full bg-[#1B5E20] flex items-center justify-center flex-shrink-0 shadow-sm">
                                                <User className="w-4 h-4 text-white" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {isChatLoading && (
                                    <div className="flex items-end gap-2 justify-start">
                                        <div className="w-8 h-8 rounded-full bg-white border border-[#E6E6E6] flex items-center justify-center flex-shrink-0 shadow-sm">
                                            <Bot className="w-4 h-4 text-[#1B5E20]" />
                                        </div>
                                        <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-sm border border-[#E6E6E6] shadow-sm flex items-center gap-1.5">
                                            <span className="w-2 h-2 bg-[#1B5E20] rounded-full animate-bounce" style={{animationDelay:'0ms'}}></span>
                                            <span className="w-2 h-2 bg-[#1B5E20] rounded-full animate-bounce" style={{animationDelay:'150ms'}}></span>
                                            <span className="w-2 h-2 bg-[#1B5E20] rounded-full animate-bounce" style={{animationDelay:'300ms'}}></span>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-white border-t border-[#E6E6E6]">
                        <div className="flex gap-2 items-center">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder={t.chatPlaceholder}
                                className="flex-grow p-3 bg-[#F5FAF5] rounded-xl border border-[#E6E6E6] focus:border-[#1B5E20] focus:ring-1 focus:ring-[#1B5E20] outline-none transition-all text-sm"
                                disabled={isChatLoading}
                            />
                            <button
                                onClick={() => handleSendMessage()}
                                disabled={!chatInput.trim() || isChatLoading}
                                className="p-3 bg-[#1B5E20] text-white rounded-xl hover:bg-[#145214] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center flex-shrink-0"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- RENDER VIEW: RESULTS ---
    if (!resultData) return null;

    return (
        <div className="max-w-7xl mx-auto space-y-8 pt-6 pb-16 px-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-2">
                <div className="flex flex-col gap-4">
                    <button 
                        onClick={() => setView('input')} 
                        className="flex items-center gap-2 px-4 py-2 text-[#555555] hover:text-[#1B5E20] transition-colors bg-white rounded-xl hover:bg-gray-50 border border-gray-200 shadow-sm w-fit font-bold text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" /> {t.back || "Back"}
                    </button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-[#1E1E1E] flex items-center gap-2">
                            <Recycle className="w-7 h-7 md:w-8 md:h-8 text-[#1B5E20]" /> {t.wasteValue}
                        </h1>
                        <p className="text-[#555555] mt-1 text-sm md:text-base">{t.resultsFor}: <strong className="text-[#1B5E20]">{resultData.crop}</strong></p>
                    </div>
                </div>

                {/* History button removed as per user request */}
            </div>

            {/* SECTION A: Suggestion Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {resultData.options?.map((opt: any, idx: number) => (
                    <div key={idx} className="bg-white rounded-3xl shadow-lg border border-[#E6E6E6] overflow-hidden flex flex-col hover:shadow-xl transition-all hover:-translate-y-1 group">
                        <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 border-b border-[#E6E6E6]">
                            <h3 className="text-xl font-bold text-[#1B5E20] mb-2 leading-tight">
                                {opt.title}
                            </h3>
                            <div className="w-10 h-1 bg-[#1B5E20] rounded-full mb-2"></div>
                        </div>
                        <div className="p-6 flex-grow flex flex-col justify-between">
                            <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                                {opt.subtitle || opt.fullDetails?.basicIdea?.[0] || t.defaultWasteDesc}
                            </p>

                            {/* Dual Buttons */}
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => handleAskChatbot(opt.title)}
                                    className="w-full py-3 bg-[#1B5E20] text-white rounded-xl font-bold text-sm hover:bg-[#000D0F] transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-[#1B5E20]/30"
                                >
                                    <MessageCircle className="w-4 h-4" /> {t.askChatbotBtn}
                                </button>
                                <button
                                    onClick={() => handleKnowMore(opt)}
                                    className="w-full py-3 bg-white border-2 border-[#1B5E20] text-[#1B5E20] rounded-xl font-bold text-sm hover:bg-[#1B5E20] hover:text-white transition-all flex items-center justify-center gap-2 group-hover:shadow-md"
                                >
                                    <Info className="w-4 h-4" /> {t.knowMore}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* SECTION B: Conclusion */}
            {resultData.conclusion && (
                <div className="bg-gradient-to-r from-[#FAFAF7] to-white rounded-3xl p-8 border border-[#1B5E20]/20 relative overflow-hidden shadow-sm">
                    <h2 className="text-2xl font-bold text-[#1B5E20] mb-4 flex items-center gap-2 relative z-10">
                        <Sprout className="w-6 h-6" /> {t.conclusion}
                    </h2>
                    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-[#E6E6E6] relative z-10">
                        <h3 className="text-xl font-bold text-[#1E1E1E] mb-3">
                            {resultData.conclusion.title}
                        </h3>
                        <div className="space-y-3">
                            <p className="text-lg font-bold text-[#1B5E20]">
                                {resultData.conclusion.highlight}
                            </p>
                            <p className="text-[#555555] leading-relaxed">
                                {resultData.conclusion.explanation || resultData.conclusion.rationale}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Know More Modal */}
            {selectedOption && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md transition-all animate-in fade-in duration-200"
                    onClick={() => setSelectedOption(null)}
                >
                    <div
                        className="bg-white w-full h-[100vh] max-w-none rounded-none shadow-2xl overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-6 border-b border-[#E6E6E6] flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-[#E8F5E9] data-html2canvas-ignore">
                            <h3 className="text-2xl font-bold text-[#1E1E1E] leading-tight">
                                {selectedOption.title}
                            </h3>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        const pdf = new jsPDF('p', 'mm', 'a4');
                                        const pW = pdf.internal.pageSize.getWidth();
                                        const pH = pdf.internal.pageSize.getHeight();
                                        const margin = 15;
                                        let y = 0;

                                        const GREEN: [number, number, number] = [27, 94, 32];
                                        const LIGHT_GREEN: [number, number, number] = [232, 245, 233];
                                        const DARK: [number, number, number] = [30, 30, 30];
                                        const MID: [number, number, number] = [80, 80, 80];
                                        const GREY: [number, number, number] = [120, 120, 120];

                                        const checkPage = (needed = 8) => {
                                            if (y + needed > pH - 18) { pdf.addPage(); y = margin; }
                                        };

                                        const addFooter = () => {
                                            const total = (pdf as any).internal.getNumberOfPages();
                                            for (let p = 1; p <= total; p++) {
                                                pdf.setPage(p);
                                                pdf.setFontSize(8);
                                                pdf.setFont('helvetica', 'normal');
                                                pdf.setTextColor(...GREY);
                                                pdf.text('Generated by KrishiSahAI — Impetus', margin, pH - 8);
                                                pdf.text(`Page ${p} of ${total}`, pW - margin, pH - 8, { align: 'right' });
                                            }
                                        };

                                        // Replace ₹ with Rs. because jsPDF helvetica doesn't support the Rupee symbol
                                        const sanitizeText = (text: string): string =>
                                            text ? String(text).replace(/₹/g, 'Rs.') : '';

                                        const addText = (text: string, size: number, bold = false, color: [number, number, number] = DARK, x = margin) => {
                                            pdf.setFontSize(size);
                                            pdf.setFont('helvetica', bold ? 'bold' : 'normal');
                                            pdf.setTextColor(...color);
                                            const lines = pdf.splitTextToSize(sanitizeText(text), pW - margin - x);
                                            lines.forEach((ln: string) => {
                                                checkPage(size * 0.35 + 2);
                                                pdf.text(ln, x, y);
                                                y += size * 0.35 + 1.5;
                                            });
                                            y += 1.5;
                                        };

                                        // ── Header Banner ─────────────────────────────────────
                                        pdf.setFillColor(...GREEN);
                                        pdf.rect(0, 0, pW, 30, 'F');
                                        pdf.setFontSize(18);
                                        pdf.setFont('helvetica', 'bold');
                                        pdf.setTextColor(255, 255, 255);
                                        pdf.text('KrishiSahAI — Waste to Value Analysis', margin, 13);
                                        pdf.setFontSize(9);
                                        pdf.setFont('helvetica', 'normal');
                                        pdf.setTextColor(200, 230, 200);
                                        pdf.text(new Date().toLocaleString(), margin, 22);
                                        y = 38;

                                        // ── Crop Title ────────────────────────────────────────
                                        addText(selectedOption.title, 16, true, GREEN);
                                        if (selectedOption.subtitle) addText(selectedOption.subtitle, 11, false, MID);

                                        // Divider
                                        pdf.setDrawColor(...LIGHT_GREEN);
                                        pdf.setLineWidth(0.5);
                                        pdf.line(margin, y, pW - margin, y);
                                        y += 6;

                                        // ── Basic Idea ────────────────────────────────────────
                                        if (selectedOption.fullDetails?.basicIdea?.length > 0) {
                                            checkPage(12);
                                            // Section heading with left accent bar
                                            pdf.setFillColor(...GREEN);
                                            pdf.rect(margin, y - 4, 2.5, 7, 'F');
                                            addText('Basic Idea', 13, true, GREEN, margin + 5);
                                            selectedOption.fullDetails.basicIdea.forEach((line: string) => {
                                                checkPage(8);
                                                addText(`• ${line}`, 10, false, MID, margin + 5);
                                            });
                                            y += 4;
                                        }

                                        // ── Sections ──────────────────────────────────────────
                                        selectedOption.fullDetails?.sections?.forEach((section: any) => {
                                            checkPage(14);
                                            // Section heading with left accent bar
                                            pdf.setFillColor(...GREEN);
                                            pdf.rect(margin, y - 4, 2.5, 7, 'F');
                                            addText(section.title, 12, true, GREEN, margin + 5);

                                            // Light background block for content
                                            const sectionLines: string[] = [];
                                            section.content?.forEach((item: string) => {
                                                const wrapped = pdf.splitTextToSize(`• ${item}`, pW - margin * 2 - 10);
                                                sectionLines.push(...wrapped);
                                            });
                                            const blockH = sectionLines.length * 5 + 8;
                                            checkPage(blockH);
                                            pdf.setFillColor(...LIGHT_GREEN);
                                            pdf.roundedRect(margin, y - 2, pW - margin * 2, blockH, 2, 2, 'F');

                                            section.content?.forEach((item: string) => {
                                                addText(`• ${item}`, 10, false, [40, 80, 40], margin + 5);
                                            });
                                            y += 4;
                                        });

                                        addFooter();
                                        pdf.save(`KrishiSahAI-WasteAnalysis-${selectedOption.title.replace(/\s+/g, '_')}.pdf`);
                                    }}
                                    className="px-4 py-2 bg-[#1B5E20] text-white rounded-lg font-bold text-sm hover:bg-[#000D0F] transition-colors shadow-sm flex items-center gap-2"
                                >
                                    <FileText className="w-4 h-4" /> Export PDF
                                </button>
                                <button
                                    onClick={() => setSelectedOption(null)}
                                    className="p-2 bg-[#E6E6E6] rounded-full hover:bg-gray-300 transition-colors"
                                >
                                    <X className="w-5 h-5 text-[#555555]" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div id="waste-modal-content" className="p-8 overflow-y-auto space-y-8 custom-scrollbar bg-white">
                            {/* Basic Idea */}
                            {(selectedOption.fullDetails?.basicIdea?.length > 0) && (
                                <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
                                    <h4 className="text-lg font-bold text-[#1B5E20] mb-3 flex items-center gap-2">
                                        <Info className="w-5 h-5" /> {t.basicIdea}
                                    </h4>
                                    <ul className="list-disc list-inside space-y-2 text-[#555555] text-lg">
                                        {selectedOption.fullDetails.basicIdea.map((line: string, idx: number) => (
                                            <li key={idx}>{line}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Detailed Sections */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">
                                {selectedOption.fullDetails?.sections?.map((section: any, idx: number) => (
                                    <div key={idx} className="bg-[#E8F5E9] p-5 rounded-2xl border border-[#E6E6E6]">
                                        <h5 className="font-bold text-[#1E1E1E] mb-3 uppercase text-xs tracking-widest border-b border-[#E6E6E6] pb-2 flex items-center justify-between">
                                            {section.title}
                                            <div className="w-1.5 h-1.5 bg-[#1B5E20] rounded-full"></div>
                                        </h5>
                                        <ul className="space-y-2">
                                            {section.content?.map((item: string, i: number) => (
                                                <li key={i} className="text-[#555555] text-base leading-relaxed flex items-start gap-2">
                                                    <span className="mt-1.5 w-1.5 h-1.5 bg-[#1B5E20]/40 rounded-full flex-shrink-0"></span>
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
    };

    return (
        <React.Fragment>
            {renderContent()}
            {/* History Sidebar - matches DetectionHistorySidebar style */}
            {isHistoryOpen && (
                <div className="fixed inset-0 bg-black/30 z-[100] md:hidden" onClick={() => setIsHistoryOpen(false)} />
            )}
            <div className={`fixed top-0 left-0 h-full w-72 bg-white border-r border-gray-200 shadow-xl z-[110] transform transition-transform duration-300 ${isHistoryOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center justify-between p-4 border-b border-[#1B5E20]/30">
                    <div className="flex items-center gap-2 font-bold text-[#1B5E20]">
                        <History size={18} /> {t.sidebar?.wasteHistory || "Waste History"}
                    </div>
                    <button onClick={() => setIsHistoryOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ maxHeight: 'calc(100vh - 80px)' }}>
                    {wasteHistory.length === 0 ? (
                        <div className="text-center text-gray-400 py-12">
                            <History size={32} className="mx-auto mb-3 opacity-40" />
                            <p className="text-sm font-medium">{t.sidebar?.noWasteHistory || 'No previous waste analysis found.'}</p>
                            <p className="text-xs mt-1">{t.sidebar?.resultsAppearHere || 'Results will appear here'}</p>
                        </div>
                    ) : (
                        wasteHistory.map((item: any) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    // Restore the analysis result and show results view
                                    setCropInput(item.crop || '');
                                    setResultData(item.result);
                                    setMessages([]);
                                    setActiveChatId(null);
                                    setView('results');
                                    setIsHistoryOpen(false);
                                }}
                                className="w-full text-left p-3 rounded-xl hover:bg-gray-50 border border-gray-100 transition-all group"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-[#1B5E2015] text-[#1B5E20]">
                                        <Recycle size={16} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-800 truncate">{item.title}</p>
                                        <p className="text-xs text-gray-400">
                                            {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'Recent'}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </React.Fragment>
    );
};


export default WasteToValue;
