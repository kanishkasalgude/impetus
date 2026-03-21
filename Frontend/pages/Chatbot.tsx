import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { useLanguage } from '../src/context/LanguageContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Language, ChatMessage } from '../types';
import {
    Send,
    ArrowLeft,
    Menu,
    Bot,
    User,
    Map,
    Briefcase,
    Newspaper,

    Mic,
    Volume2,
    Square,
    Trash2,
    Recycle,
    BookOpen,
    Sprout,
    Wheat
} from 'lucide-react';
import { api } from '../src/services/api';
import { auth, onAuthStateChanged } from '../firebase';
import { useFarm } from '../src/context/FarmContext';






import { getUserProfile } from '../src/services/firebase_db';
import { chatService, ChatSession, Message } from '../src/services/chatService';
import { ChatLayout } from '../components/ChatLayout';
import { ChatSidebar } from '../components/ChatSidebar';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { FeatureConfirmationModal } from '../components/FeatureConfirmationModal';


const AGRICULTURE_FACTS = [
    { crop: "Sugarcane", fact: "The English word 'candy' actually comes from the ancient Indian word 'khanda,' which was the name for the world's first crystallized sugar invented by Indian farmers around 500 BC." },
    { crop: "Mango", fact: "The sap that oozes from a freshly plucked mango stem contains urushiol—the exact same highly acidic and allergenic oil that makes poison ivy so itchy." },
    { crop: "Rice", fact: "Indian agricultural scientists helped develop a special 'Sub1' gene variant of rice that acts like scuba gear, allowing the plant to survive completely submerged underwater for over two weeks without drowning." },
    { crop: "Cotton", fact: "Farmers in the Indus Valley were spinning and weaving cotton into fabric over 5,000 years ago, making it one of the oldest continuous textile traditions on Earth." },
    { crop: "Mango, Cashew, Pistachio", fact: "Botanically speaking, mangoes, cashews, and pistachios are all close cousins that belong to the exact same plant family (Anacardiaceae)." },
    { crop: "Soybeans", fact: "The smooth, non-toxic colors found in many modern children's crayons are actually manufactured using oil pressed directly from soybeans." },
    { crop: "Mango", fact: "A single mango tree can produce hundreds of thousands of flowers during its blooming season, but only about 1% of those flowers will actually pollinate and turn into fruit." },
    { crop: "General Soil Science", fact: "Over 2,500 years ago, ancient Indian Sanskrit texts already possessed advanced soil science, classifying farmland into 12 specific categories like 'ushara' (barren) and 'sharkara' (pebble-filled)." },
    { crop: "Black Pepper", fact: "Grown largely on the Malabar Coast, black pepper was once so highly prized in the ancient world that it was used to pay rent and was literally worth its weight in solid gold." },
    { crop: "Fruit Trees", fact: "Many Indian fruit crops naturally practice 'alternate bearing'—producing a massive yield one year, and then taking a 'rest' by producing almost nothing the following year." },
    { crop: "Mango", fact: "Some individual mango trees planted in the Konkan coastal belt have been actively bearing fruit for over 300 years." },
    { crop: "General Agriculture", fact: "Indian agricultural scientists use stable nuclear isotopes, like Nitrogen-15, to track exactly how crops absorb fertilizers at a microscopic level to optimize organic farming." },
    { crop: "Saffron", fact: "It takes the hand-plucked stigmas of approximately 75,000 individual saffron blossoms to produce just a single pound of the spice." },
    { crop: "General Agriculture", fact: "Archaeologists found evidence at Kalibangan in Rajasthan showing that Indian farmers were using complex perpendicular furrowing for multi-crop rotation as early as 2800 BCE." },
    { crop: "Jute", fact: "Jute is known as the 'golden fiber' not just because of its high industrial value, but because the raw, freshly extracted fibers physically shine like gold." }
];

const Chatbot: React.FC = () => {
    const { t, language: lang } = useLanguage();
    const { activeFarm } = useFarm();
    const location = useLocation();
    const navigate = useNavigate();

    // Auth & User State
    const [user, setUser] = useState<any>(null);
    const [authLoading, setAuthLoading] = useState(true);

    // Chat Data State
    const [chats, setChats] = useState<ChatSession[]>([]);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);

    // UI State
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleToggle = () => setIsSidebarOpen(prev => !prev);
        window.addEventListener('toggle-sidebar', (handleToggle as EventListener));
        return () => window.removeEventListener('toggle-sidebar', (handleToggle as EventListener));
    }, []);

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [chatToDelete, setChatToDelete] = useState<{ id: string; title: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Feature Modal State
    const [featureModalOpen, setFeatureModalOpen] = useState(false);
    const [selectedFeature, setSelectedFeature] = useState<{ id: string; name: string; description: string; path?: string } | null>(null);

    const featureButtons = [
        { id: 'disease-pest', name: 'Disease & Pest', description: 'Detect diseases and pests in your crops using AI.', path: '/crop-care', icon: <Sprout className="w-8 h-8 md:w-10 md:h-10 text-[#1B5E20]" /> },
        { id: 'plan', name: 'Plan', description: 'Create and view 10-year roadmaps for your farm.', path: '/plan', icon: <Map className="w-8 h-8 md:w-10 md:h-10 text-[#1B5E20]" /> },
        { id: 'advisory', name: 'Business Advisory', description: 'Get business recommendations based on your farm and market.', path: '/advisory', icon: <Briefcase className="w-8 h-8 md:w-10 md:h-10 text-[#1B5E20]" /> },
        { id: 'waste', name: 'Waste to Value', description: 'Explore profitable ways to reuse, sell, or compost farm waste.', path: '/waste-to-value', icon: <Recycle className="w-8 h-8 md:w-10 md:h-10 text-[#1B5E20]" /> }
    ];

    const handleFeatureSelect = (feature: any) => {
        if (feature.id === 'plan') {
            setSelectedFeature(feature);
            setFeatureModalOpen(true);
        } else if (feature.path) {
            navigate(feature.path);
        } else {
            (document.querySelector('input[placeholder]') as HTMLInputElement)?.focus();
        }
    };

    const handleFeatureConfirm = () => {
        setFeatureModalOpen(false);
        if (selectedFeature?.path) {
            navigate(selectedFeature.path);
        } else {
            // It's the Chatbot itself - focus input or just close
            (document.querySelector('input[placeholder]') as HTMLInputElement)?.focus();
        }
    };    // Agriculture Fact Loading State
    const [currentFact, setCurrentFact] = useState<{ crop: string; fact: string } | null>(null);
    const lastFactIndexRef = useRef<number>(-1);

    const pickRandomFact = () => {
        let idx;
        do {
            idx = Math.floor(Math.random() * AGRICULTURE_FACTS.length);
        } while (idx === lastFactIndexRef.current && AGRICULTURE_FACTS.length > 1);
        lastFactIndexRef.current = idx;
        setCurrentFact(AGRICULTURE_FACTS[idx]);
    };

    // Backend Session State
    const [backendSessionId, setBackendSessionId] = useState<string | null>(null);
    const hasProcessedInitialMessage = useRef(false);
    const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);

    // Scroll Management
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const isAtBottomRef = useRef(true); // Default to true so it scrolls on first load

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleScroll = () => {
        if (chatContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
            const isBottom = scrollHeight - scrollTop - clientHeight < 100; // 100px threshold
            isAtBottomRef.current = isBottom;
        }
    };

    // Voice State
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [isLoadingTTS, setIsLoadingTTS] = useState<number | null>(null); // message index loading TTS
    const [playingMessageId, setPlayingMessageId] = useState<number | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // --- TTS Functionality ---
    const handleTextToSpeech = async (text: string, messageId: number) => {
        if (playingMessageId === messageId) {
            // Stop playing
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            setPlayingMessageId(null);
            return;
        }

        // Stop any current playback
        if (audioRef.current) {
            audioRef.current.pause();
        }

        setIsLoadingTTS(messageId);
        try {
            const token = await user?.getIdToken();
            const langCode = lang.toLowerCase(); // 'en', 'hi', or 'mr'
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${API_BASE_URL}/voice/tts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Bypass-Tunnel-Reminder': 'true',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({ text, language: langCode })
            });

            const data = await response.json();
            if (data.success && data.audio_url) {
                const ORIGIN_URL = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
                const audio = new Audio(`${ORIGIN_URL}${data.audio_url}`);
                audioRef.current = audio;
                setPlayingMessageId(messageId);

                audio.play();
                audio.onended = () => {
                    setPlayingMessageId(null);
                    audioRef.current = null;
                };
            }
        } catch (error) {
            console.error("TTS Error:", error);
        } finally {
            setIsLoadingTTS(null);
        }
    };

    // --- STT Functionality ---
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks: BlobPart[] = [];

            recorder.ondataavailable = (e) => chunks.push(e.data);
            recorder.onstop = async () => {
                const blob = new Blob(chunks, { type: 'audio/wav' });
                const formData = new FormData();
                formData.append('audio', blob, 'recording.wav');

                setIsLoading(true);
                try {
                    const token = await user?.getIdToken();
                    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                    const response = await fetch(`${API_BASE_URL}/voice/stt`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Bypass-Tunnel-Reminder': 'true',
                            'ngrok-skip-browser-warning': 'true'
                        },
                        body: formData
                    });
                    const data = await response.json();
                    if (data.success) {
                        setInput(prev => prev + " " + data.text);
                    }
                } catch (error) {
                    console.error("STT Error:", error);
                } finally {
                    setIsLoading(false);
                    setIsRecording(false);
                }
            };

            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
        } catch (error) {
            console.error("Microphone access denied:", error);
            alert("Microphone access is required for voice input.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
    };

    // Auto-scroll effect: Only scroll if we were already at bottom
    useEffect(() => {
        if (isAtBottomRef.current) {
            scrollToBottom();
        }
    }, [messages]);

    // 1. Initialize Auth and Load Chats
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                // Subscribe to chats
                const unsubChats = chatService.subscribeToUserChats(currentUser.uid, (data) => {
                    setChats(data);
                });
                setAuthLoading(false);
                return () => unsubChats();
            } else {
                setUser(null);
                setAuthLoading(false);
                setChats([]);
            }
        });
        return () => unsubscribe();
    }, []);

    // 2. Handle Active Chat Selection
    useEffect(() => {
        const loadActiveChat = async () => {
            if (!user || !activeChatId) {
                setMessages([]);
                setBackendSessionId(null);
                return;
            }

            setIsLoading(true);
            try {
                // Find chat object to get backend ID
                const chat = chats.find(c => c.id === activeChatId);
                if (chat?.backendSessionId) {
                    setBackendSessionId(chat.backendSessionId);
                } else {
                    // If no backend ID stored, we might need to init a new one or handle it
                    // For now, let's assume we'll init if missing when sending message
                    setBackendSessionId(null);
                }

                const msgs = await chatService.getChatMessages(user.uid, activeChatId);
                setMessages(msgs);
                // When loading a new chat, force scroll to bottom
                isAtBottomRef.current = true;
            } catch (err) {
                console.error("Failed to load chat:", err);
            } finally {
                setIsLoading(false);
            }
        };

        loadActiveChat();
    }, [activeChatId, user]); // Removing chats dependency to prevent loop, relying on find

    // 3. Handle Navigation State (e.g. "Ask AI" from other pages)
    useEffect(() => {
        if (location.state?.initialMessage && !activeChatId && !isLoading && user && !hasProcessedInitialMessage.current) {
            const initMsg = location.state.initialMessage;
            const stateSessionId = location.state.backendSessionId;

            // Mark as processed immediately to prevent race conditions
            hasProcessedInitialMessage.current = true;

            if (stateSessionId && !backendSessionId) {
                setBackendSessionId(stateSessionId);
            }

            // Clear initial message from state to prevent loop, but keep other flags
            const newState = { ...location.state, initialMessage: undefined };
            window.history.replaceState(newState, document.title);
            handleSend(initMsg);
        }
    }, [location.state, user, activeChatId, isLoading, backendSessionId]);


    // 4. Handle Global Farm Switch
    useEffect(() => {
        if (user && activeFarm) {
            console.log("[Chatbot] Farm switched to:", activeFarm.nickname);
            setBackendSessionId(null);
            // Optionally clear messages if you want a fresh start per farm
            // setMessages([]); 
        }
    }, [activeFarm?.nickname, user]);

    const initBackendSession = async () => {
        try {
            const profile = await getUserProfile(user.uid) as any;

            const data = await api.post('/business-advisor/init', {
                name: profile?.name || "Farmer",
                // Pass active farm details for primary context
                land_size: activeFarm?.landSize || profile?.landSize || profile?.land_size || 5,
                soil_type: activeFarm?.soilType || profile?.soilType || profile?.soil_type,
                water_resource: activeFarm?.waterResource || profile?.waterResource || profile?.water_resource,
                crops_grown: activeFarm?.crops || [], // Ensure farm-specific crops are known
                farm_name: activeFarm?.nickname,
                language: (profile?.language || lang).toLowerCase(),
                // Pass all farms for broad awareness
                farms: profile?.farms || [],
                experience_years: profile?.experience_years || '',
                ...profile
            });

            if (data.success && data.session_id) {
                return data.session_id;
            } else {
                console.error("[Chatbot] Init returned success=false or no session_id");
            }
        } catch (e) {
            console.error("[Chatbot] Init session failed:", e);
        }
        return null;
    };

    const handleNewChat = () => {
        setActiveChatId(null);
        setMessages([]);
        setBackendSessionId(null);
        setInput('');
        setIsSidebarOpen(false); // Close sidebar on mobile
        isAtBottomRef.current = true;
    };

    // 3.5 Handle Greeting from Floating Button
    useEffect(() => {
        if (location.state?.newChatWithGreeting && user) {
            handleNewChat();
            
            const newState = { ...location.state, newChatWithGreeting: undefined };
            window.history.replaceState(newState, document.title);
            
            setTimeout(() => {
                setMessages([
                    { role: 'assistant', content: (t.chatbot as any)?.greeting || "Namaste! I am KrishiSahAI. How can I help you today?", createdAt: new Date() }
                ]);
            }, 50);
        }
    }, [location.state, user]);

    const handleDeleteChat = (chatId: string, chatTitle: string) => {
        setChatToDelete({ id: chatId, title: chatTitle });
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!chatToDelete || !user) return;

        setIsDeleting(true);
        try {
            // Optimistic UI update - remove from list immediately
            setChats(prev => prev.filter(c => c.id !== chatToDelete.id));

            // If deleting active chat, switch to new chat view
            if (activeChatId === chatToDelete.id) {
                handleNewChat();
            }

            // Delete from Firestore
            const success = await chatService.deleteChat(user.uid, chatToDelete.id);

            if (!success) {
                // Revert optimistic update on failure
                console.error('Failed to delete chat');
                // Optionally show error toast here
                // For now, the chat list will refresh from Firestore subscription
            }
        } catch (error) {
            console.error('Error in delete handler:', error);
        } finally {
            setIsDeleting(false);
            setDeleteModalOpen(false);
            setChatToDelete(null);
        }
    };



    const handleSend = async (manualMessage?: string) => {
        const text = manualMessage || input;
        if (!text.trim() || !user) return;

        setInput('');

        // Force scroll to bottom when user sends a message
        isAtBottomRef.current = true;
        scrollToBottom(); // also call immediately for perceived responsiveness

        // Optimistic UI update
        const tempUserMsg: Message = { role: 'user', content: text, createdAt: new Date() };
        setMessages(prev => [...prev, tempUserMsg]);

        let currentChatId = activeChatId;
        let currentBackendId = backendSessionId;

        try {
            // Initialize Chat & Session if needed
            if (!currentChatId) {
                // 1. Init Backend Session
                if (!currentBackendId) {
                    currentBackendId = await initBackendSession();
                    setBackendSessionId(currentBackendId);
                }

                // 2. Create Firestore Chat
                // Generate simple title from first few words
                const title = text.split(' ').slice(0, 5).join(' ') + "...";
                currentChatId = await chatService.createChat(user.uid, title, currentBackendId || undefined);
                setActiveChatId(currentChatId);
            } else if (!currentBackendId) {
                // Resuming a chat that lost its backend session?
                currentBackendId = await initBackendSession();
                setBackendSessionId(currentBackendId);
                // Note: we might want to update the chat doc with this new ID
            }

            // Save User Message to Firestore
            if (currentChatId) {
                await chatService.saveMessage(user.uid, currentChatId, tempUserMsg);
            }

            // Stream Response
            if (!currentBackendId) {
                console.error("[Chatbot] Cannot stream: No backend session ID");
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: "Error: Failed to initialize AI session. Please try refreshing the page.",
                    createdAt: new Date()
                }]);
                return;
            }

            pickRandomFact();
            setMessages(prev => [...prev, { role: 'assistant', content: '', createdAt: new Date() }]);

            let responseText = '';
            let retryCount = 0;
            const MAX_RETRIES = 1;

            const attemptStream = async (): Promise<void> => {
                try {
                    await api.stream(
                        '/business-advisor/chat/stream',
                        {
                            message: text,
                            session_id: currentBackendId,
                            language: lang.toLowerCase()
                        },
                        (chunk) => {
                            responseText += chunk;
                            setMessages(prev => {
                                const newMsgs = [...prev];
                                const last = newMsgs[newMsgs.length - 1];
                                if (last.role === 'assistant') {
                                    last.content = responseText;
                                }
                                return newMsgs;
                            });
                        },
                        async (err) => {
                            // Check if this is an invalid session error
                            if (err?.message?.includes('Invalid session_id') && retryCount < MAX_RETRIES) {
                                retryCount++;
                                console.warn("[Chatbot] Invalid session detected, reinitializing...");

                                // Clear stale session
                                currentBackendId = null;
                                setBackendSessionId(null);

                                // Re-initialize session
                                currentBackendId = await initBackendSession();
                                setBackendSessionId(currentBackendId);

                                // Update Firestore chat with new backend ID
                                if (currentChatId && currentBackendId) {
                                    await chatService.updateChatBackendSession(user.uid, currentChatId, currentBackendId);
                                }


                                if (currentBackendId) {
                                    // Retry the stream
                                    await attemptStream();
                                } else {
                                    throw new Error("Failed to reinitialize session");
                                }
                            } else {
                                throw err;
                            }
                        }
                    );
                } catch (error) {
                    console.error("Stream Error:", error);
                    setMessages(prev => {
                        const newMsgs = [...prev];
                        const last = newMsgs[newMsgs.length - 1];
                        if (last.role === 'assistant') {
                            last.content = "Error: Could not connect to AI. Please try again.";
                        }
                        return newMsgs;
                    });
                }
            };

            await attemptStream();

            // Save Assistant Message to Firestore when done
            if (currentChatId && responseText) {
                await chatService.saveMessage(user.uid, currentChatId, {
                    role: 'assistant',
                    content: responseText,
                    createdAt: new Date()
                });

                // Generate smart title if this was the first exchange of a NEW chat
                if (!activeChatId) {
                    try {
                        setIsGeneratingTitle(true);
                        const token = await user?.getIdToken();
                        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                        const titleRes = await fetch(`${API_BASE_URL}/chat/generate-title`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`,
                                'Bypass-Tunnel-Reminder': 'true',
                                'ngrok-skip-browser-warning': 'true'
                            },
                            body: JSON.stringify({ session_id: currentBackendId })
                        });
                        const titleData = await titleRes.json();
                        if (titleData.success) {
                            await chatService.updateChatTitle(user.uid, currentChatId, titleData.title);
                            setChats(prev => prev.map(c =>
                                c.id === currentChatId ? { ...c, title: titleData.title } : c
                            ));
                        }
                    } catch (tError) {
                        console.error("Title error:", tError);
                    } finally {
                        setIsGeneratingTitle(false);
                    }
                }
            }

        } catch (e) {
            console.error("Send Loop Error:", e);
        }
    };

    if (authLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

    const Sidebar = (
        <ChatSidebar
            chats={chats}
            activeChatId={activeChatId}
            onSelectChat={setActiveChatId}
            onNewChat={handleNewChat}
            onDeleteChat={handleDeleteChat}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
        />
    );

    return (
        <div className="h-[calc(100dvh-80px)] md:h-[calc(100dvh-100px)] max-w-7xl mx-auto md:p-6 p-0">
            {Sidebar}
            <ChatLayout>
                {/* Messages Container */}

                {/* Messages Container */}
                <div
                    ref={chatContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4"
                >
                    {/* Welcome / Empty State */}
                    {messages.length === 0 && !isLoading && (
                        <div className="flex flex-col items-center justify-center h-full text-center py-12 gap-6">
                            <div>
                                <h2 className="text-2xl font-bold text-[#1B5E20]">{t.chatbot?.welcomeTitle || "Welcome to KrishiSahAI"}</h2>
                                <p className="text-stone-500 mt-1 text-sm">{t.chatbot?.welcomeSub || "Ask me anything about farming, crops, weather, or government schemes."}</p>
                            </div>
                            {/* Feature Buttons */}
                            <div className="grid grid-cols-2 gap-4 w-full max-w-lg mt-4 px-2">
                                {featureButtons.map((f) => (
                                    <button
                                        key={f.id}
                                        onClick={() => handleFeatureSelect(f)}
                                        className="flex flex-col items-center justify-center gap-3 p-6 md:p-8 bg-white border-2 border-[#E0E6E6] hover:border-[#1B5E20] rounded-2xl text-center transition-all shadow-sm hover:shadow-lg active:scale-95 min-h-[120px] md:min-h-[140px]"
                                    >
                                        <div className="w-12 h-12 md:w-14 md:h-14 bg-[#E8F5E9] rounded-xl flex items-center justify-center">
                                            {f.icon}
                                        </div>
                                        <span className="text-sm md:text-base font-bold text-[#1B5E20]">{f.name}</span>
                                    </button>
                                ))}
                            </div>
                            {/* Agriculture Fact */}
                            {currentFact && (
                                <div className="max-w-md bg-[#F1F8E9] border border-[#C5E1A5] rounded-xl p-4 text-left">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#558B2F] mb-1">{t.chatbot?.doYouKnow || "Did you know?"} · {currentFact.crop}</p>
                                    <p className="text-sm text-[#33691E]">{currentFact.fact}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Messages */}
                    {messages.length > 0 && (
                        messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`flex items-end gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >


                                <div
                                    className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 ${
                                        msg.role === 'user'
                                            ? 'bg-[#1B5E20] text-white rounded-br-sm'
                                            : 'bg-white border border-gray-200 text-[#002105] rounded-bl-sm shadow-sm'
                                    }`}
                                >
                                    {/* Loading / streaming indicator */}
                                    {msg.role === 'assistant' && !msg.content && isLoading && i === messages.length - 1 ? (
                                        <div className="flex flex-col gap-2 min-w-[180px]">
                                            <div className="flex items-center gap-2">
                                                <span className="flex gap-1">
                                                    <span className="w-2 h-2 bg-[#1B5E20]/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                    <span className="w-2 h-2 bg-[#1B5E20]/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                    <span className="w-2 h-2 bg-[#1B5E20]/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                                </span>
                                                <span className="text-xs text-stone-400">{t.chatbot?.thinking || "Thinking"}...</span>
                                            </div>
                                            {currentFact && (
                                                <div className="mt-2 border-t border-gray-100 pt-2">
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#558B2F] mb-0.5">{t.chatbot?.doYouKnow || "Did you know?"} · {currentFact.crop}</p>
                                                    <p className="text-xs text-stone-500">{currentFact.fact}</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm, remarkBreaks]}
                                                components={{
                                                    code: ({ node, className, children, ...props }) => {
                                                        const isBlock = className?.includes('language-');
                                                        return isBlock ? (
                                                            <pre className="bg-black/10 rounded-lg p-3 my-2 overflow-x-auto text-sm font-mono">
                                                                <code className={className} {...props}>{children}</code>
                                                            </pre>
                                                        ) : (
                                                            <code className="bg-black/10 rounded px-1 py-0.5 text-sm font-mono" {...props}>{children}</code>
                                                        );
                                                    },
                                                    strong: ({ node, ...props }) => <span className={`font-bold ${msg.role === 'user' ? 'text-white' : 'text-[#1B5E20]'}`} {...props} />,
                                                    ul: ({ node, ...props }) => <ul className="list-disc pl-5 my-2 space-y-1" {...props} />,
                                                    ol: ({ node, ...props }) => <ol className="list-decimal pl-5 my-2 space-y-1" {...props} />,
                                                    li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                                                    p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                                    h1: ({ node, ...props }) => <h1 className="text-xl font-bold mt-4 mb-2" {...props} />,
                                                    h2: ({ node, ...props }) => <h2 className="text-lg font-bold mt-3 mb-2" {...props} />,
                                                }}
                                            >
                                                {msg.content || ""}
                                            </ReactMarkdown>
                                            {/* TTS Button */}
                                            {msg.role === 'assistant' && msg.content && (
                                                <button
                                                    onClick={() => handleTextToSpeech(msg.content, i)}
                                                    disabled={isLoadingTTS === i}
                                                    className="mt-2 flex items-center gap-1 text-[10px] text-stone-400 hover:text-[#1B5E20] transition-colors"
                                                >
                                                    {isLoadingTTS === i ? (
                                                        <span className="animate-pulse">Loading...</span>
                                                    ) : playingMessageId === i ? (
                                                        <><Square className="w-3 h-3 fill-current" /> Stop</>
                                                    ) : (
                                                        <><Volume2 className="w-3 h-3" /> Listen</>
                                                    )}
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>


                            </div>
                        ))
                    )}

                    {/* Roadmap Planner Status Message */}
                    {location.state?.isRoadmapPlanner && messages.length > 0 && messages[messages.length - 1].role === 'assistant' && !messages[messages.length - 1].content && (
                        <div className="flex flex-col items-center justify-center p-12 text-center animate-pulse">
                            <div className="w-16 h-16 bg-deep-green/10 rounded-full flex items-center justify-center mb-4">
                                <User className="w-8 h-8 text-deep-green" />
                            </div>
                            <h3 className="text-xl font-bold text-deep-green">
                                {t.chatbot?.makingPlan || 'Making 10-year plan for'} {location.state?.businessName}...
                            </h3>
                            <p className="text-stone-500 mt-2">{t.chatbot?.analyzingMarket || 'Analyzing market trends and regional data.'}</p>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 md:p-6 bg-white border-t-2 border-deep-green/10">
                    <div className="max-w-4xl mx-auto relative flex items-center gap-3">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={t.chatPlaceholder}
                            className="w-full p-4 pr-20 bg-[#FAFCFC] border-2 border-[#E0E6E6] rounded-2xl focus:outline-none focus:border-deep-green focus:ring-0 transition-all font-medium placeholder:text-stone-400 text-[#002105]"
                        />

                        {/* Mic Button */}
                        <div className="absolute right-20 top-1/2 -translate-y-1/2 z-10">
                            <button
                                onClick={isRecording ? stopRecording : startRecording}
                                disabled={isLoading}
                                className={`p-2 transition-all ${isRecording
                                    ? 'text-red-600 animate-pulse'
                                    : 'text-stone-400 hover:text-deep-green'
                                    }`}
                                title={isRecording ? "Stop Recording" : "Voice Input"}
                            >
                                {isRecording ? <Square className="w-5 h-5 fill-current" /> : <Mic className="w-5 h-5" />}
                            </button>
                        </div>

                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isLoading}
                            className="p-4 bg-deep-green text-white hover:bg-deep-green/90 rounded-2xl disabled:opacity-50 disabled:bg-stone-300 transition-all shadow-md min-w-[3.5rem] flex items-center justify-center"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                    <p className="text-center text-[10px] uppercase font-bold tracking-widest text-stone-400 mt-3">
                        {t.aiDisclaimer}
                    </p>
                </div>
            </ChatLayout>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => {
                    if (!isDeleting) {
                        setDeleteModalOpen(false);
                        setChatToDelete(null);
                    }
                }}
                onConfirm={confirmDelete}
                chatTitle={chatToDelete?.title || ''}
                isDeleting={isDeleting}
            />

            <FeatureConfirmationModal
                isOpen={featureModalOpen}
                onClose={() => setFeatureModalOpen(false)}
                onConfirm={handleFeatureConfirm}
                featureName={selectedFeature?.name || ''}
                featureDescription={selectedFeature?.description || ''}
            />
        </div>
    );
};

export default Chatbot;
