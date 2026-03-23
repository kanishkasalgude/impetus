import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserProfile } from '../types';
import { useLanguage } from '../src/context/LanguageContext';
import { useFarm } from '../src/context/FarmContext';
import { api } from '../src/services/api';
import { auth, db } from '../firebase';
import { onSnapshot, doc, collection, addDoc, query, orderBy, limit } from 'firebase/firestore';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { createPortal } from 'react-dom';
import {
    Briefcase,
    ArrowRight,
    ArrowLeft,
    CheckCircle,
    MessageCircle,
    Info,
    DollarSign,
    Droplets,
    User,
    TrendingUp,
    Ruler,
    Loader2,
    X,
    Download,
    Phone,
    MapPin,
    Star,
    Award,
    Users,
    ChevronRight,
    Sprout,
    Target
} from 'lucide-react';
import { getUserProfile } from '../src/services/firebase_db';
import { ChatLayout } from '../components/ChatLayout';
import { AdvisorySidebar } from '../components/AdvisorySidebar';
import { Menu } from 'lucide-react';

interface FormData {
    // A. Financial
    budget: string;
    currentProfit: string;
    runningPlan: string;

    // B. Land & Infra
    spaceType: string;
    // Branch A
    totalLand: string;
    businessLand: string;
    soilCondition: string;
    waterSource: string;
    // Branch B
    coveredSpace: string;
    infraType: string;
    electricity: string;

    // C. Workforce & Experience
    experience: string;
    animalHandling: string;
    dailyLabor: string;
    handsOnWork: string;

    // D. Market
    marketAccess: string;
    sellingPreference: string;

    // E. Risk
    incomeComfort: string;
    investmentRecovery: string;
    lossAttitude: string;
    riskPreference: string;

    // F. Goals
    mainGoal: string;
    interests: string[];
    selectedFarmNickname: string;
    agreement: boolean;
}

interface Recommendation {
    id: string;
    title: string;
    reason: string;
    match_score: number;
    estimated_cost: string;
    profit_potential: string;
    requirements: string[];
    risk_factors?: string[];
    market_demand?: string;
    detailed_description?: string;
    timeline?: string;
    implementation_steps?: string[];
}


const BusinessAdvisory: React.FC = () => {
    const { language: lang, t } = useLanguage();

    useEffect(() => {
        const handleToggle = () => setIsSidebarOpen(prev => !prev);
        window.addEventListener('toggle-sidebar', (handleToggle as EventListener));
        return () => window.removeEventListener('toggle-sidebar', (handleToggle as EventListener));
    }, []);

    const EXPERTS = [
        {
            id: 1,
            name: "Dr. Ramesh Patil",
            title: t.advisory.experts.ramesh.title,
            specialization: t.advisory.experts.ramesh.specialization,
            experience: t.advisory.experts.ramesh.experience,
            location: t.advisory.experts.ramesh.location,
            rating: 4.9,
            consultations: 1240,
            bio: t.advisory.experts.ramesh.bio,
            expertise: t.advisory.experts.ramesh.expertise,
            photo: "/experts/expert_1.png",
            available: true
        },
        {
            id: 2,
            name: "Dr. Sunita Deshmukh",
            title: t.advisory.experts.sunita.title,
            specialization: t.advisory.experts.sunita.specialization,
            experience: t.advisory.experts.sunita.experience,
            location: t.advisory.experts.sunita.location,
            rating: 4.8,
            consultations: 890,
            bio: t.advisory.experts.sunita.bio,
            expertise: t.advisory.experts.sunita.expertise,
            photo: "/experts/expert_2.png",
            available: true
        },
        {
            id: 3,
            name: "Arvind Kulkarni",
            title: t.advisory.experts.arvind.title,
            specialization: t.advisory.experts.arvind.specialization,
            experience: t.advisory.experts.arvind.experience,
            location: t.advisory.experts.arvind.location,
            rating: 4.7,
            consultations: 2150,
            bio: t.advisory.experts.arvind.bio,
            expertise: t.advisory.experts.arvind.expertise,
            photo: "/experts/expert_3.png",
            available: false
        },
        {
            id: 4,
            name: "Priya Sharma",
            title: t.advisory.experts.priya.title,
            specialization: t.advisory.experts.priya.specialization,
            experience: t.advisory.experts.priya.experience,
            location: t.advisory.experts.priya.location,
            rating: 4.9,
            consultations: 560,
            bio: t.advisory.experts.priya.bio,
            expertise: t.advisory.experts.priya.expertise,
            photo: "/experts/expert_4.png",
            available: true
        }
    ];

    const handleDownloadPDF = async () => {
        if (!selectedBusiness) return;
        setIsExporting(true);
        try {
            // Fetch Roadmap
            const response = await api.generateRoadmap(selectedBusiness.title, lang);
            const roadmap = response?.success ? response.roadmap : null;

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pWidth = pdf.internal.pageSize.getWidth();
            const pHeight = pdf.internal.pageSize.getHeight();
            const margin = 15;
            let y = 0;

            const GREEN: [number, number, number] = [27, 94, 32];
            const LIGHT_GREEN: [number, number, number] = [232, 245, 233];
            const GREY: [number, number, number] = [120, 120, 120];

            const addFooter = () => {
                const total = (pdf as any).internal.getNumberOfPages();
                for (let p = 1; p <= total; p++) {
                    pdf.setPage(p);
                    pdf.setFontSize(8);
                    pdf.setFont('helvetica', 'normal');
                    pdf.setTextColor(...GREY);
                    pdf.text('Generated by KrishiSahAI — Impetus', margin, pHeight - 8);
                    pdf.text(`Page ${p} of ${total}`, pWidth - margin, pHeight - 8, { align: 'right' });
                }
            };

            const checkPage = (needed = 8) => {
                if (y + needed > pHeight - 18) { pdf.addPage(); y = margin; }
            };

            // Replace ₹ with Rs. because jsPDF helvetica doesn't support the Rupee symbol
            const sanitizeText = (text: string): string =>
                text ? String(text).replace(/₹/g, 'Rs.') : '';

            const addText = (text: string, fontSize: number, isBold: boolean = false, textColor: number[] = [30, 30, 30], x = margin) => {
                pdf.setFontSize(fontSize);
                pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
                pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
                const safeText = sanitizeText(text);
                const lines = pdf.splitTextToSize(safeText, pWidth - margin - x);
                lines.forEach((line: string) => {
                    checkPage(fontSize * 0.35 + 2);
                    pdf.text(line, x, y);
                    y += fontSize * 0.35 + 1.5;
                });
                y += 2;
            };

            const addSectionHeading = (title: string, size: number = 14, textColor: number[] = GREEN as number[]) => {
                checkPage(12);
                pdf.setFillColor(...GREEN);
                pdf.rect(margin, y - 4, 2.5, size * 0.35 + 3, 'F');
                addText(title, size, true, textColor, margin + 5);
            };

            // ── Header Banner ──────────────────────────────────────────────
            pdf.setFillColor(...GREEN);
            pdf.rect(0, 0, pWidth, 30, 'F');
            pdf.setFontSize(18);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(255, 255, 255);
            pdf.text('KrishiSahAI — Business Advisory Plan', margin, 13);
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(200, 230, 200);
            pdf.text(new Date().toLocaleString(), margin, 22);
            y = 38;

            // ── Business Title & Key Metrics ──────────────────────────────
            addText(selectedBusiness.title, 20, true, GREEN as number[]);
            y += 2;

            // Metrics row on light-green background
            pdf.setFillColor(...LIGHT_GREEN);
            pdf.roundedRect(margin, y - 2, pWidth - margin * 2, 26, 2, 2, 'F');
            addText(`Match Score: ${selectedBusiness.match_score}%`, 11, true, [30, 30, 30], margin + 4);
            addText(`Estimated Investment: ${selectedBusiness.estimated_cost}`, 10, false, [60, 60, 60], margin + 4);
            addText(`Profit Potential: ${selectedBusiness.profit_potential}`, 10, false, [60, 60, 60], margin + 4);
            addText(`Timeline: ${selectedBusiness.timeline || '3-6 months'}`, 10, false, [60, 60, 60], margin + 4);
            y += 4;

            // Divider
            pdf.setDrawColor(...LIGHT_GREEN);
            pdf.setLineWidth(0.5);
            pdf.line(margin, y, pWidth - margin, y);
            y += 6;

            // ── Business Overview ─────────────────────────────────────────
            addSectionHeading('Business Overview', 14);
            const detailsData = getKnowMoreData(selectedBusiness);
            detailsData.basicIdea.forEach(p => addText(p, 10, false, [60, 60, 60], margin + 5));
            y += 4;

            // ── Detail Sections ───────────────────────────────────────────
            detailsData.sections.forEach(sec => {
                addSectionHeading(sec.title, 13);
                // Content on light green block
                const secLines: string[] = [];
                sec.content.forEach(point => {
                    const wrapped = pdf.splitTextToSize(`• ${point}`, pWidth - margin * 2 - 10);
                    secLines.push(...wrapped);
                });
                const blockH = secLines.length * 5 + 8;
                checkPage(blockH);
                pdf.setFillColor(...LIGHT_GREEN);
                pdf.roundedRect(margin, y - 2, pWidth - margin * 2, blockH, 2, 2, 'F');
                sec.content.forEach(point => addText(`• ${point}`, 10, false, [40, 80, 40], margin + 5));
                y += 4;
            });

            // ── 10-Year Roadmap ───────────────────────────────────────────
            if (roadmap) {
                pdf.addPage();
                y = margin;

                // Sub-banner for roadmap page
                pdf.setFillColor(...GREEN);
                pdf.rect(0, 0, pWidth, 20, 'F');
                pdf.setFontSize(15);
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(255, 255, 255);
                pdf.text('10-Year Growth & Sustainability Plan', margin, 13);
                y = 28;

                addSectionHeading('Overview', 13);
                addText(roadmap.overview, 10, false, [60, 60, 60], margin + 5);
                y += 4;

                if (roadmap.years) {
                    roadmap.years.forEach((yr: any) => {
                        checkPage(28);
                        // Year heading
                        pdf.setFillColor(...GREEN);
                        pdf.rect(margin, y - 4, pWidth - margin * 2, 8, 'F');
                        pdf.setFontSize(12);
                        pdf.setFont('helvetica', 'bold');
                        pdf.setTextColor(255, 255, 255);
                        pdf.text(`${yr.year}: ${yr.goal}`, margin + 3, y);
                        y += 8;
                        addText(`Focus: ${yr.focus}`, 10, true, [30, 30, 30], margin + 4);
                        if (yr.actions && Array.isArray(yr.actions)) {
                            yr.actions.forEach((act: string) => addText(`• ${act}`, 10, false, [60, 60, 60], margin + 4));
                        }
                        addText(`Expected Profit: ${yr.profit}`, 10, true, [0, 120, 0] as number[], margin + 4);
                        y += 4;
                    });
                }

                pdf.addPage();
                y = margin;
                addSectionHeading('Labor Analysis', 14);
                addText(roadmap.labor_analysis, 10, false, [60, 60, 60], margin + 5);
                y += 4;

                addSectionHeading('Sustainability Plan', 14);
                addText(roadmap.sustainability_plan, 10, false, [60, 60, 60], margin + 5);
                y += 4;

                addSectionHeading('Financial Resilience', 14);
                addText(roadmap.resilience_strategy, 10, false, [60, 60, 60], margin + 5);
                y += 4;

                addSectionHeading('Final Verdict', 14);
                addText(roadmap.verdict, 10, false, [60, 60, 60], margin + 5);
            }

            addFooter();
            pdf.save(`Comprehensive_Business_Plan_${selectedBusiness.title.replace(/\s+/g, '_')}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    const getKnowMoreData = (rec: Recommendation) => ({
        title: rec.title,
        matchScore: rec.match_score,
        investment: rec.estimated_cost,
        profit: rec.profit_potential,
        timeline: rec.timeline || '3–6 months',
        basicIdea: [
            rec.detailed_description || rec.reason,
            t.advisory.knowMore.investmentExplanation
                .replace('{{cost}}', rec.estimated_cost)
                .replace('{{profit}}', rec.profit_potential),
            t.advisory.knowMore.timelineExplanation
                .replace('{{timeline}}', rec.timeline || '3–6 months'),
            t.advisory.knowMore.matchExplanation
                .replace('{{score}}', rec.match_score?.toString() || '0'),
            t.advisory.agreementText
        ],
        sections: [
            {
                title: t.advisory.knowMore.marketDemand,
                content: [
                    rec.market_demand || `${rec.title} products enjoy consistent year-round demand in local mandis, urban retail chains and online grocery platforms.`,
                    "Rising consumer preference for farm-fresh, locally sourced and traceable produce drives prices 15–30% above commodity rates.",
                    "District-level FPOs (Farmer Producer Organisations) provide direct market linkage — bypassing middlemen and improving margin by up to 20%.",
                    "Export opportunities exist for certified organic variants; APEDA provides subsidised assistance for export registration.",
                    "Festival and seasonal demand spikes (Oct–Jan) can boost revenue by 40–60% if production is timed correctly."
                ]
            },
            {
                title: t.advisory.knowMore.keyRequirements,
                content: [
                    ...(Array.isArray(rec.requirements) && rec.requirements.length > 0 ? rec.requirements : ["Land", "Water access", "Basic equipment", "Skilled labour"]),
                    `Minimum working capital buffer of 20% of ${rec.estimated_cost} recommended for first 2 months.`,
                    "Basic record-keeping or a mobile app like eNAM or AgriBazaar is helpful for price discovery and sales tracking.",
                    "FSSAI registration may be required if processing or packaging farm produce for direct consumer sale."
                ]
            },
            {
                title: t.advisory.knowMore.riskAndMitigation,
                content: [
                    ...(Array.isArray(rec.risk_factors) && rec.risk_factors.length > 0 ? rec.risk_factors : [
                        "Market price volatility during harvest season — mitigate via forward contracts or FPO tie-ups.",
                        "Pest or disease outbreaks — adopt IPM (Integrated Pest Management) and maintain crop insurance.",
                        "Weather dependency (drought/flood) — consider drip irrigation and PM Fasal Bima Yojana coverage."
                    ]),
                    "Labour availability risk during peak seasons — train 2–3 local youth in advance for reliable workforce.",
                    "Input cost inflation (seeds, fertilizers) — reduce exposure by bulk purchasing via Kisan cooperative or e-Kisan Mandi."
                ]
            },
            {
                title: t.advisory.knowMore.investmentBreakdown,
                content: [
                    `Total estimated capital required: ${rec.estimated_cost}.`,
                    `Expected monthly revenue once operational: ${rec.profit_potential}.`,
                    "Infrastructure setup (land preparation, fencing, shed): approx. 30–40% of total investment.",
                    "Inputs (seeds / livestock / raw materials) and recurring monthly costs: approx. 40–50% of total.",
                    "Working capital buffer and contingency reserve: 10–20% recommended for the first operating quarter."
                ]
            },
            {
                title: t.advisory.knowMore.stepsToStart,
                content: [
                    ...(Array.isArray(rec.implementation_steps) && rec.implementation_steps.length > 0 ? rec.implementation_steps : [
                        "Step 1 — Conduct a local market survey: identify 3–5 potential buyers (mandis, retailers, hotels).",
                        "Step 2 — Prepare land or infrastructure: clear, level, and set up basic facilities.",
                        "Step 3 — Register with APMC or nearest FPO to access subsidies and fair pricing.",
                        "Step 4 — Procure quality inputs (seeds / stock / equipment) from certified dealers.",
                        "Step 5 — Launch a small-scale trial batch (20–30% capacity) to validate quality and buyer interest.",
                        "Step 6 — Scale to full capacity after the first successful sales cycle and reinvest profits."
                    ]),
                ]
            },
            {
                title: t.advisory.knowMore.govSchemes,
                content: [
                    "PM Kisan Sampada Yojana — provides grants up to ₹10L for agri-processing units.",
                    "NABARD RIDF Loans — low-interest rural infrastructure finance at 5.5–7% per annum.",
                    "PM Fasal Bima Yojana — crop insurance covering weather, pest and price risk.",
                    "National Livestock Mission — livestock-based businesses eligible for 50% capital subsidy.",
                    "State Horticulture Mission — greenhouse and nursery setups get 40–50% subsidy on infrastructure."
                ]
            }
        ]
    });
    const { activeFarm, farms } = useFarm();
    const [user, setUser] = useState<UserProfile | null>(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((u: any) => {
            if (u) {
                onSnapshot(doc(db, 'users', u.uid), (snap: any) => {
                    if (snap.exists()) setUser(snap.data() as UserProfile);
                });
            } else {
                setUser(null);
            }
        });
        return () => unsubscribe();
    }, []);

    const navigate = useNavigate();
    const location = useLocation();
    const [step, setStep] = useState(0);
    const [subStep, setSubStep] = useState(1);
    const totalSubSteps = 3;
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [advisoryHistory, setAdvisoryHistory] = useState<any[]>([]);

    useEffect(() => {
        if (user) {
            const uid = (user as any).uid || auth.currentUser?.uid;
            if (!uid) return;
            const q = query(
                collection(db, 'users', uid, 'advisory_history'),
                orderBy('createdAt', 'desc'),
                limit(20)
            );
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const fetched = snapshot.docs.map(d => ({
                    id: d.id,
                    ...d.data()
                }));
                setAdvisoryHistory(fetched);
            });
            return () => unsubscribe();
        }
    }, [user]);

    const [loading, setLoading] = useState(false);
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

    // Modal states
    const [selectedBusiness, setSelectedBusiness] = useState<Recommendation | null>(null);
    const [showExpertModal, setShowExpertModal] = useState(false);
    const [connectingExpert, setConnectingExpert] = useState<number | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [backendSessionId, setBackendSessionId] = useState<string | null>(null);
    const [formData, setFormData] = useState<FormData>({
        budget: '',
        currentProfit: '',
        runningPlan: '',
        spaceType: '',
        totalLand: '',
        businessLand: '',
        soilCondition: '',
        waterSource: '',
        coveredSpace: '',
        infraType: '',
        electricity: '',
        experience: '',
        animalHandling: '',
        dailyLabor: '',
        handsOnWork: '',
        interests: [],
        marketAccess: '',
        sellingPreference: '',
        incomeComfort: '',
        investmentRecovery: '',
        lossAttitude: '',
        riskPreference: '',
        mainGoal: '',
        selectedFarmNickname: '',
        agreement: false
    });

    // Restore state if returning from Chatbot or Detail
    useEffect(() => {
        const state = location.state as { formData?: FormData; recommendations?: Recommendation[]; step?: number } | null;
        if (state?.recommendations) {
            setRecommendations(state.recommendations);
            setStep(state.step || 2);
        }
        if (state?.formData) {
            setFormData(state.formData);
        }
    }, [location.state]);

    // Set total land from all farms and experience from user profile
    useEffect(() => {
        if (user) {
            // Default to aggregate total initially, but will be overridden by farm selection
            const totalLandSize = user.farms?.reduce((acc, farm) => {
                const size = parseFloat(farm.landSize);
                return isNaN(size) ? acc : acc + size;
            }, 0) || 0;

            setFormData(prev => ({
                ...prev,
                totalLand: prev.totalLand || totalLandSize.toString(),
                experience: prev.experience || user.experience_years || ''
            }));
        }
    }, [user]);

    // Update form fields when a farm is selected
    useEffect(() => {
        if (user && formData.selectedFarmNickname) {
            const farm = user.farms?.find(f => f.nickname === formData.selectedFarmNickname);
            if (farm) {
                setFormData(prev => ({
                    ...prev,
                    totalLand: farm.landSize,
                    soilCondition: farm.soilType,
                    waterSource: farm.waterResource,
                    // Respect the user's manual plot size if they already entered it, but cap it?
                    // For now, let's keep businessLand as is unless it's empty
                    businessLand: prev.businessLand || ''
                }));
            }
        }
    }, [formData.selectedFarmNickname, user]);


    const interestOptions = t.advisoryForm.interestOptions;

    const handleInterestToggle = (interest: string) => {
        setFormData(prev => ({
            ...prev,
            interests: prev.interests.includes(interest)
                ? prev.interests.filter(i => i !== interest)
                : [...prev.interests, interest]
        }));
    };

    const handleAnalyze = async () => {
        if (!formData.agreement) {
            alert(t.advisoryForm.agreement);
            return;
        }

        const total = parseFloat(formData.totalLand);
        const business = parseFloat(formData.businessLand);

        if (formData.spaceType === 'Agri' && (isNaN(business) || business <= 0)) {
            alert(t.advisoryForm.invalidLand);
            return;
        }

        if (formData.spaceType === 'Agri' && !isNaN(total) && total > 0 && business > total) {
            alert(t.landExceedsTotal);
            return;
        }

        // Budget string to numeric mapping
        const budgetMap: Record<string, number> = {
            '< 1 lakh': 50000,
            '1-3 lakh': 200000,
            '3-6 lakh': 450000,
            '6-10 lakh': 800000,
            '10+ lakh': 1500000
        };

        const capitalValue = budgetMap[formData.budget] || 100000;

        const selectedFarm = user?.farms?.find(f => f.nickname === formData.selectedFarmNickname);

        setLoading(true);
        try {
            // Fetch fresh profile to ensure we have the absolute latest language preference
            const profile = await getUserProfile(auth.currentUser?.uid || '') as any;
            const preferredLang = (profile?.language || lang).toLowerCase();

            const payload = {
                // A. Financial
                capital: capitalValue,
                current_profit: formData.currentProfit,
                running_plan: formData.runningPlan,

                // B. Land & Infra
                space_type: formData.spaceType,
                // Agricultural branch
                land_size: formData.businessLand,
                soil_condition: formData.soilCondition,
                water_availability: formData.waterSource,
                soil_type: formData.soilCondition, // Redundancy for backend matching
                crops_grown: selectedFarm?.crops || [], // Isolated farm crops
                // Non-Agri branch
                covered_space: formData.coveredSpace,
                infra_type: formData.infraType,
                electricity: formData.electricity,

                // C. Workforce
                experience_years: parseInt(formData.experience) || 0,
                animal_handling: formData.animalHandling,
                daily_labor: formData.dailyLabor,
                hands_on_work: formData.handsOnWork,

                // D, E, F
                market_access: formData.marketAccess,
                selling_preference: formData.sellingPreference,
                income_comfort: formData.incomeComfort,
                recovery_timeline: formData.investmentRecovery,
                loss_tolerance: formData.lossAttitude,
                risk_preference: formData.riskPreference,
                main_goal: formData.mainGoal,
                interests: formData.interests,

                total_land: parseFloat(formData.totalLand) || 0,
                farm_name: formData.selectedFarmNickname,
                language: preferredLang
            };

            const response = await api.post('/business-advisor/init', payload);
            if (response.success && response.recommendations) {
                setRecommendations(response.recommendations);
                
                if (user) {
                    try {
                        const title = `Advisory: ${response.recommendations[0]?.title || 'Assessment'}`;
                        const uid = (user as any).uid || auth.currentUser?.uid;
                        if (uid) {
                            await addDoc(collection(db, 'users', uid, 'advisory_history'), {
                                title: title,
                                recommendations: response.recommendations,
                                formData: payload,
                                createdAt: new Date()
                            });
                        }
                    } catch (err) {
                        console.error("Failed to save advisory history:", err);
                    }
                }

                if (response.session_id) setBackendSessionId(response.session_id);
                setStep(2);
            } else {
                alert(t.advisoryForm.analysisFailed);
            }
        } catch (error) {
            console.error("Analysis Error:", error);
            alert(t.advisoryForm.genericError);
        } finally {
            setLoading(false);
        }
    };

    const handleAskChatbot = (businessName: string) => {
        navigate('/chat', {
            state: {
                initialMessage: t.prompts.businessPrompt.replace('{business}', businessName),
                backendSessionId: backendSessionId,
                fromAdvisory: true,
                previousState: { formData, recommendations, step }
            }
        });
    };

    const handleConnect = (expertId: number) => {
        setConnectingExpert(expertId);
        // Simulate connecting
        setTimeout(() => {
            setConnectingExpert(null);
            // Show success feedback
            alert(t.advisoryForm.connectionSent);
        }, 1500);
    };

    const renderContent = () => {
    //  STEP 0: LANDING 
    if (step === 0) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-start pt-24 md:pt-32 p-4">
                <AdvisorySidebar
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    recentAdvisories={advisoryHistory}
                    onSelectAdvisory={(adv: any) => {
                        if (adv.recommendations) {
                            setRecommendations(adv.recommendations);
                            setStep(2);
                        }
                    }}
                />
                <div className="w-full max-w-7xl flex justify-start mb-6 -mt-10">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E6E6E6] text-[#1B5E20] font-bold rounded-xl hover:bg-[#F5F5F5] transition-all shadow-sm"
                    >
                        <ArrowLeft className="w-4 h-4" /> {t.back || "Back"}
                    </button>
                </div>
                <div className="text-center py-10 md:py-20 px-6 md:px-10 bg-white rounded-[32px] md:rounded-[48px] border border-[#E6E6E6] shadow-xl max-w-3xl w-full mx-auto">
                    <div className="w-16 h-16 md:w-24 md:h-24 bg-[#E8F5E9] rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-sm">
                        <Briefcase className="w-8 h-8 md:w-12 md:h-12 text-[#1B5E20]" />
                    </div>
                    <h1 className="text-2xl md:text-4xl font-extrabold text-[#1E1E1E] mb-4">{t.businessAdvisorTitle}</h1>
                    <p className="text-[#555555] font-medium text-base md:text-lg max-w-xl mx-auto mb-8 md:mb-10">
                        {t.businessAdvisorSub}
                    </p>
                    <button
                        onClick={() => setStep(1)}
                        className="px-6 md:px-8 py-3 md:py-4 bg-[#1B5E20] text-white rounded-2xl font-bold text-base md:text-xl hover:bg-[#000D0F] transition-all shadow-lg hover:scale-105 flex items-center justify-center gap-3 mx-auto"
                    >
                        {t.startAssessment} <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                </div>
            </div>
        );
    }

    //  STEP 1: ASSESSMENT FORM 
    if (step === 1) {
        const totalSubSteps = 4;
        const progress = (subStep / totalSubSteps) * 100;

        const handleNext = () => {
            // Step 1 Validation
            if (subStep === 1) {
                const total = parseFloat(formData.totalLand);
                const business = parseFloat(formData.businessLand);

                if (formData.spaceType === 'Agri' && (isNaN(business) || business <= 0)) {
                    alert("Please enter a valid land size for your business.");
                    return;
                }

                if (formData.spaceType === 'Agri' && !isNaN(total) && total > 0 && business > total) {
                    alert(t.landExceedsTotal);
                    return;
                }
            }
            if (subStep < totalSubSteps) setSubStep(subStep + 1);
        };

        const handleBack = () => {
            if (subStep > 1) setSubStep(subStep - 1);
            else setStep(0);
        };

        return (
            <div className="p-4 md:p-8 max-w-4xl mx-auto">
                <AdvisorySidebar
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    recentAdvisories={advisoryHistory}
                    onSelectAdvisory={(adv: any) => {
                        if (adv.recommendations) {
                            setRecommendations(adv.recommendations);
                            setStep(2);
                        }
                    }}
                />
                
                {/* Navigation Header */}
                <div className="mb-8 flex items-center justify-between">
                    <button onClick={handleBack} className="flex items-center gap-2 text-[#555] hover:text-[#1B5E20] transition-colors font-bold text-sm bg-white border border-gray-200 px-4 py-2 rounded-xl shadow-sm w-fit">
                        <ArrowLeft className="w-4 h-4" /> {t.back || "Back"}
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="hidden md:block w-48 h-2 bg-[#E6E6E6] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[#1B5E20] transition-all duration-500 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <span className="text-sm font-bold text-[#1B5E20]">{t.signupFlow?.step || 'Step'} {subStep} {t.signupFlow?.of || 'of'} {totalSubSteps}</span>
                    </div>
                </div>

                <div className="bg-white rounded-[32px] md:rounded-[40px] border border-[#E6E6E6] shadow-2xl p-5 md:p-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
                    <h1 className="text-2xl md:text-4xl font-extrabold text-[#1E1E1E] mb-6 md:mb-10 tracking-tight">
                        {subStep === 1 && t.advisory.steps.step1}
                        {subStep === 2 && t.advisory.steps.step2}
                        {subStep === 3 && t.advisory.steps.step3}
                        {subStep === 4 && t.advisory.steps.step5}
                    </h1>

                    <div className="space-y-12">
                        {/* SUB-STEP 1: FINANCIAL BASELINE & INTENT */}
                        {subStep === 1 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-10">
                                {/* Farm Selection (Dynamic) */}
                                {user && user.farms && user.farms.length > 0 && (
                                    <div className="space-y-6">
                                        <label className="block text-lg font-bold text-[#1E1E1E]">{t.advisoryForm.farmSelection}</label>
                                        <div className="flex flex-wrap gap-4">
                                            {user.farms.map(farm => (
                                                <button
                                                    key={farm.nickname}
                                                    onClick={() => setFormData({ ...formData, selectedFarmNickname: farm.nickname })}
                                                    className={`px-6 py-3 rounded-2xl border-2 font-bold transition-all flex items-center gap-3 ${formData.selectedFarmNickname === farm.nickname
                                                        ? 'bg-[#E8F5E9] border-[#1B5E20] text-[#1B5E20] shadow-md'
                                                        : 'bg-[#F8FAFC] border-[#F1F5F9] text-[#64748B] hover:border-gray-300'
                                                        }`}
                                                >
                                                    <MapPin className="w-4 h-4" />
                                                    {farm.nickname}
                                                </button>
                                            ))}
                                            <button
                                                onClick={() => setFormData({ ...formData, selectedFarmNickname: '' })}
                                                className={`px-6 py-3 rounded-2xl border-2 font-bold transition-all flex items-center gap-3 ${!formData.selectedFarmNickname
                                                    ? 'bg-[#E8F5E9] border-[#1B5E20] text-[#1B5E20] shadow-md'
                                                    : 'bg-[#F8FAFC] border-[#F1F5F9] text-[#64748B] hover:border-gray-300'
                                                    }`}
                                            >
                                                <Target className="w-4 h-4" />
                                                {t.advisoryForm.otherCustom}
                                            </button>
                                        </div>
                                        {formData.selectedFarmNickname && (
                                            <p className="text-xs text-[#1B5E20] font-bold animate-pulse flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" /> {t.advisoryForm.autoFilling.replace('{farm}', formData.selectedFarmNickname)}
                                            </p>
                                        )}
                                    </div>
                                )}
                                <div className="space-y-6">
                                    <label className="block text-lg font-bold text-[#1E1E1E]">{t.advisoryForm.budgetLabel}</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                        {['< 1 lakh', '1-3 lakh', '3-6 lakh', '6-10 lakh', '10+ lakh'].map(opt => (
                                            <label key={opt} className={`flex flex-col items-center justify-center p-3 md:p-4 text-center rounded-xl md:rounded-2xl border-2 cursor-pointer transition-all duration-300 ${formData.budget === opt ? 'border-[#1B5E20] bg-[#E8F5E9] shadow-md ring-1 ring-[#1B5E20]/20 scale-105' : 'border-[#F1F5F9] bg-[#F8FAFC] hover:border-gray-300 hover:bg-white'}`}>
                                                <input type="radio" name="budget" value={opt} checked={formData.budget === opt} onChange={e => setFormData({ ...formData, budget: e.target.value })} className="sr-only" />
                                                <DollarSign className={`w-6 h-6 mb-2 transition-colors ${formData.budget === opt ? 'text-[#1B5E20]' : 'text-gray-400'}`} />
                                                <span className={`text-sm font-bold ${formData.budget === opt ? 'text-[#1B5E20]' : 'text-[#64748B]'}`}>{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <label className="block text-lg font-bold text-[#1E1E1E]">{t.advisoryForm.profitLabel}</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {['< ₹10,000', '₹10,000 - ₹20,000', '₹20,000 - ₹50,000', 'Above ₹50,000'].map(opt => (
                                            <label key={opt} className={`flex items-center p-3 md:p-4 rounded-xl md:rounded-2xl border-2 cursor-pointer transition-all duration-300 ${formData.currentProfit === opt ? 'border-[#1B5E20] bg-[#E8F5E9] shadow-sm' : 'border-[#F1F5F9] bg-[#F8FAFC] hover:border-gray-300'}`}>
                                                <input type="radio" name="currentProfit" value={opt} checked={formData.currentProfit === opt} onChange={e => setFormData({ ...formData, currentProfit: e.target.value })} className="w-4 h-4 accent-[#1B5E20] mr-3" />
                                                <span className={`text-sm md:text-base font-bold ${formData.currentProfit === opt ? 'text-[#1B5E20]' : 'text-[#64748B]'}`}>{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <label className="block text-lg font-bold text-[#1E1E1E]">{t.advisoryForm.intentLabel}</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {[
                                            { label: t.advisoryForm.intentFull.title, sub: t.advisoryForm.intentFull.sub, value: 'Full Replacement' },
                                            { label: t.advisoryForm.intentSide.title, sub: t.advisoryForm.intentSide.sub, value: 'Side Income' }
                                        ].map(opt => (
                                            <label key={opt.value} className={`flex flex-col p-4 rounded-xl md:rounded-2xl border-2 cursor-pointer transition-all duration-300 ${formData.runningPlan === opt.value ? 'border-[#1B5E20] bg-[#E8F5E9] shadow-sm scale-[1.02]' : 'border-[#F1F5F9] bg-[#F8FAFC] hover:border-gray-300'}`}>
                                                <div className="flex items-center mb-1">
                                                    <input type="radio" name="runningPlan" value={opt.value} checked={formData.runningPlan === opt.value} onChange={e => setFormData({ ...formData, runningPlan: e.target.value })} className="w-4 h-4 accent-[#1B5E20] mr-3" />
                                                    <span className={`text-sm font-extrabold ${formData.runningPlan === opt.value ? 'text-[#1B5E20]' : 'text-[#1E1E1E]'}`}>{opt.label}</span>
                                                </div>
                                                <span className="text-xs text-[#64748B] ml-7 font-medium">{opt.sub}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-6 pt-6 border-t border-[#F1F5F9]">
                                    <div className="flex justify-between items-center">
                                        <label className="block text-lg font-bold text-[#1E1E1E]">{t.advisoryForm.plotSizeLabel} <span className="text-sm font-medium text-[#64748B] ml-2">({t.advisoryForm.acres})</span></label>
                                        {formData.totalLand && parseFloat(formData.totalLand) > 0 && (
                                            <span className="text-[10px] font-bold text-[#1B5E20] bg-[#E8F5E9] px-4 py-2 rounded-full border border-[#1B5E20]/10 shadow-sm">{t.advisoryForm.availableLand.replace('{size}', formData.totalLand)}</span>
                                        )}
                                    </div>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                            <Ruler className={`h-6 w-6 ${(formData.totalLand && parseFloat(formData.businessLand) > parseFloat(formData.totalLand)) ? 'text-red-500' : 'text-[#1B5E20]'}`} />
                                        </div>
                                        <input
                                            type="number"
                                            step="0.1"
                                            max={formData.totalLand || undefined}
                                            value={formData.businessLand}
                                            onChange={e => {
                                                const val = e.target.value;
                                                const numVal = parseFloat(val);
                                                const maxVal = parseFloat(formData.totalLand);
                                                // We allow the input but handle validation styling
                                                setFormData({ ...formData, businessLand: val });
                                            }}
                                            placeholder={t.advisoryForm.plotPlaceholder}
                                            className={`block w-full pl-16 pr-24 py-6 bg-[#F8FAFC] border-2 rounded-[24px] text-xl font-bold transition-all outline-none ${(formData.totalLand && parseFloat(formData.businessLand) > parseFloat(formData.totalLand))
                                                ? 'border-red-500 text-red-600 focus:border-red-600'
                                                : 'border-[#F1F5F9] text-[#1E1E1E] focus:border-[#1B5E20] focus:shadow-md focus:bg-white'
                                                }`}
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-8 flex items-center pointer-events-none">
                                            <span className={`text-lg font-bold ${(formData.totalLand && parseFloat(formData.businessLand) > parseFloat(formData.totalLand)) ? 'text-red-500' : 'text-[#1B5E20]'}`}>{t.advisoryForm.acres}</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className={`text-xs font-medium italic ${(formData.totalLand && parseFloat(formData.businessLand) > parseFloat(formData.totalLand))
                                            ? 'text-red-500 font-bold'
                                            : 'text-[#64748B]'
                                            }`}>
                                            {(formData.totalLand && parseFloat(formData.businessLand) > parseFloat(formData.totalLand))
                                                ? t.advisoryForm.plotError.replace('{size}', formData.totalLand)
                                                : t.advisoryForm.plotHint.replace('{size}', formData.totalLand || 'total')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {subStep === 2 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-10">
                                <div className="space-y-6">
                                    <label className="block text-lg font-bold text-[#1E1E1E]">{t.advisoryForm.locationLabel}</label>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-10">
                                        {[
                                            { label: t.advisoryForm.spaceOptions.agri.label, sub: t.advisoryForm.spaceOptions.agri.sub, value: 'Agri', icon: Sprout },
                                            { label: t.advisoryForm.spaceOptions.nonAgri.label, sub: t.advisoryForm.spaceOptions.nonAgri.sub, value: 'Non-Agri', icon: Briefcase },
                                            { label: t.advisoryForm.spaceOptions.water.label, sub: t.advisoryForm.spaceOptions.water.sub, value: 'Water', icon: Droplets }
                                        ].map(opt => (
                                            <label key={opt.value} className={`flex flex-col p-6 rounded-[28px] border-2 cursor-pointer transition-all duration-300 ${formData.spaceType === opt.value ? 'border-[#1B5E20] bg-[#E8F5E9] shadow-lg ring-2 ring-[#1B5E20]/10' : 'border-[#F1F5F9] bg-[#F8FAFC] hover:border-gray-300'}`}>
                                                <input type="radio" name="spaceType" value={opt.value} checked={formData.spaceType === opt.value} onChange={e => setFormData({ ...formData, spaceType: e.target.value })} className="sr-only" />
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors ${formData.spaceType === opt.value ? 'bg-white text-[#1B5E20]' : 'bg-gray-100 text-gray-400'}`}>
                                                    <opt.icon className="w-6 h-6" />
                                                </div>
                                                <span className={`font-bold mb-1 ${formData.spaceType === opt.value ? 'text-[#1B5E20]' : 'text-[#1E1E1E]'}`}>{opt.label}</span>
                                                <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider">{opt.sub}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {formData.spaceType === 'Agri' && (
                                    <div className="p-8 bg-[#F8FAFC] rounded-[32px] border-2 border-dashed border-[#1B5E20]/20 space-y-8 animate-in slide-in-from-left duration-500">
                                        <div className="flex items-center gap-3 pb-4 border-b border-[#E6E6E6]">
                                            <div className="w-10 h-10 bg-[#E8F5E9] rounded-xl flex items-center justify-center">
                                                <Ruler className="text-[#1B5E20] w-5 h-5" />
                                            </div>
                                            <h4 className="font-bold text-[#1B5E20]">{t.advisoryForm.agriDetails}</h4>
                                        </div>
                                        <div className="space-y-12">
                                            <div className="space-y-6">
                                                <label className="block text-lg font-bold text-[#1E1E1E]">{t.advisoryForm.soilLabel}</label>
                                                <div className="flex flex-col gap-4">
                                                    {t.advisoryForm.soilOptions.map(opt => (
                                                        <label key={opt} className={`flex items-center p-5 rounded-[24px] border-2 cursor-pointer transition-all ${formData.soilCondition === opt ? 'border-[#1B5E20] bg-[#E8F5E9] shadow-sm' : 'border-[#F1F5F9] bg-[#F8FAFC] hover:border-gray-300'}`}>
                                                            <input type="radio" name="soilCondition" value={opt} checked={formData.soilCondition === opt} onChange={e => setFormData({ ...formData, soilCondition: e.target.value })} className="w-5 h-5 accent-[#1B5E20] mr-4" />
                                                            <span className="text-sm font-bold text-[#64748B]">{opt}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-6">
                                                <label className="block text-lg font-bold text-[#1E1E1E]">{t.advisoryForm.waterLabel}</label>
                                                <div className="flex flex-col gap-4">
                                                    {t.advisoryForm.waterOptions.map(opt => (
                                                        <label key={opt} className={`flex items-center p-5 rounded-[24px] border-2 cursor-pointer transition-all ${formData.waterSource === opt ? 'border-[#1B5E20] bg-[#E8F5E9] shadow-sm' : 'border-[#F1F5F9] bg-[#F8FAFC] hover:border-gray-300'}`}>
                                                            <input type="radio" name="waterSource" value={opt} checked={formData.waterSource === opt} onChange={e => setFormData({ ...formData, waterSource: e.target.value })} className="w-5 h-5 accent-[#1B5E20] mr-4" />
                                                            <span className="text-sm font-bold text-[#64748B]">{opt}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {formData.spaceType === 'Non-Agri' && (
                                    <div className="p-8 bg-[#F8FAFC] rounded-[32px] border-2 border-dashed border-[#1B5E20]/20 space-y-8 animate-in slide-in-from-right duration-500">
                                        <div className="flex items-center gap-3 pb-4 border-b border-[#E6E6E6]">
                                            <div className="w-10 h-10 bg-[#E8F5E9] rounded-xl flex items-center justify-center">
                                                <Briefcase className="text-[#1B5E20] w-5 h-5" />
                                            </div>
                                            <h4 className="font-bold text-[#1B5E20]">{t.advisoryForm.infraTitle}</h4>
                                        </div>
                                        <div className="space-y-8">
                                            <label className="block text-lg font-bold text-[#1E1E1E]">{t.advisoryForm.spaceLabel}</label>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                {t.advisoryForm.spaceOptionsList.map(opt => (
                                                    <label key={opt} className={`flex items-center p-6 rounded-2xl border-2 cursor-pointer transition-all ${formData.coveredSpace === opt ? 'border-[#1B5E20] bg-[#E8F5E9] shadow-md ring-2 ring-[#1B5E20]/5' : 'border-transparent bg-white/50 hover:bg-white'}`}>
                                                        <input type="radio" name="coveredSpace" value={opt} checked={formData.coveredSpace === opt} onChange={e => setFormData({ ...formData, coveredSpace: e.target.value })} className="w-5 h-5 accent-[#1B5E20] mr-4" />
                                                        <span className="text-sm font-bold text-[#64748B]">{opt}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-12">
                                            <div className="space-y-6">
                                                <label className="block text-lg font-bold text-[#1E1E1E]">{t.advisoryForm.electricityLabel}</label>
                                                <div className="flex flex-col gap-4">
                                                    {t.advisoryForm.electricityOptions.map(opt => (
                                                        <label key={opt} className={`flex items-center p-5 rounded-[24px] border-2 cursor-pointer transition-all ${formData.electricity === opt ? 'border-[#1B5E20] bg-[#E8F5E9] shadow-sm' : 'border-[#F1F5F9] bg-[#F8FAFC] hover:border-gray-300'}`}>
                                                            <input type="radio" name="electricity" value={opt} checked={formData.electricity === opt} onChange={e => setFormData({ ...formData, electricity: e.target.value })} className="w-5 h-5 accent-[#1B5E20] mr-4" />
                                                            <span className="text-sm font-bold text-[#64748B]">{opt}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-6">
                                                <label className="block text-lg font-bold text-[#1E1E1E]">{t.advisoryForm.infraTypeLabel}</label>
                                                <div className="grid grid-cols-2 gap-4">
                                                    {t.advisoryForm.infraTypeOptions.map(opt => (
                                                        <label key={opt} className={`flex flex-col items-center justify-center p-8 rounded-[32px] border-2 cursor-pointer transition-all ${formData.infraType === opt ? 'border-[#1B5E20] bg-[#E8F5E9] shadow-lg scale-[1.02]' : 'border-[#F1F5F9] bg-[#F8FAFC] hover:border-gray-300'}`}>
                                                            <input type="radio" name="infraType" value={opt} checked={formData.infraType === opt} onChange={e => setFormData({ ...formData, infraType: e.target.value })} className="sr-only" />
                                                            <span className="text-xs font-black uppercase tracking-[0.2em] text-[#64748B] text-center w-full leading-relaxed">{opt}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* SUB-STEP 3: WORKFORCE & MARKET */}
                        {subStep === 3 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-12">
                                <section className="space-y-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-[#E8F5E9] rounded-xl flex items-center justify-center">
                                            <User className="text-[#1B5E20] w-5 h-5" />
                                        </div>
                                        <h3 className="text-xl font-bold text-[#1E1E1E]">{t.advisoryForm.workforceTitle}</h3>
                                    </div>

                                    <div className="flex flex-col gap-12">
                                        <div className="space-y-4">
                                            <label className="text-lg font-bold text-[#1E1E1E]">{t.advisoryForm.laborLabel}</label>
                                            <div className="flex flex-col gap-3">
                                                {t.advisoryForm.laborOptions.map(opt => (
                                                    <label key={opt} className={`flex items-center p-5 rounded-2xl border-2 cursor-pointer transition-all ${formData.dailyLabor === opt ? 'border-[#1B5E20] bg-[#E8F5E9] font-bold' : 'border-[#F1F5F9] bg-[#F8FAFC]'}`}>
                                                        <input type="radio" name="dailyLabor" value={opt} checked={formData.dailyLabor === opt} onChange={e => setFormData({ ...formData, dailyLabor: e.target.value })} className="w-5 h-5 accent-[#1B5E20] mr-4" />
                                                        <span className="text-sm font-bold">{opt}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-lg font-bold text-[#1E1E1E]">{t.advisoryForm.animalLabel}</label>
                                            <div className="flex flex-col gap-3">
                                                {t.advisoryForm.animalOptions.map(opt => (
                                                    <label key={opt} className={`flex items-center p-5 rounded-2xl border-2 cursor-pointer transition-all ${formData.animalHandling === opt ? 'border-[#1B5E20] bg-[#E8F5E9] font-bold' : 'border-[#F1F5F9] bg-[#F8FAFC]'}`}>
                                                        <input type="radio" name="animalHandling" value={opt} checked={formData.animalHandling === opt} onChange={e => setFormData({ ...formData, animalHandling: e.target.value })} className="w-5 h-5 accent-[#1B5E20] mr-4" />
                                                        <span className="text-sm font-bold">{opt}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-8 pt-8 border-t border-[#F1F5F9]">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-[#FEF3F2] rounded-xl flex items-center justify-center">
                                            <MapPin className="text-[#B91C1C] w-5 h-5" />
                                        </div>
                                        <h3 className="text-xl font-bold text-[#1E1E1E]">{t.advisoryForm.marketTitle}</h3>
                                    </div>

                                    <div className="space-y-6">
                                        <label className="block text-lg font-bold text-[#1E1E1E]">{t.advisoryForm.distanceLabel}</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            {t.advisoryForm.distanceOptions.map(opt => (
                                                <label key={opt} className={`flex items-center justify-center p-6 rounded-[24px] border-2 cursor-pointer text-center transition-all ${formData.marketAccess === opt ? 'border-[#1B5E20] bg-[#E8F5E9] font-bold' : 'border-[#F1F5F9] bg-[#F8FAFC]'}`}>
                                                    <input type="radio" name="marketAccess" value={opt} checked={formData.marketAccess === opt} onChange={e => setFormData({ ...formData, marketAccess: e.target.value })} className="sr-only" />
                                                    <span className="text-base leading-tight">{opt}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}

                        {/* SUB-STEP 4: RISK & GOALS */}
                        {subStep === 4 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-16">
                                <section className="space-y-12">
                                    <div className="space-y-8">
                                        <h3 className="text-xl font-bold text-[#1E1E1E]">{t.advisory.options.mindset.balanced}</h3>
                                        <div className="space-y-10">
                                            <div className="space-y-4">
                                                <label className="text-xs font-bold text-[#64748B] uppercase tracking-widest leading-none">{t.advisoryForm.lossLabel}</label>
                                                <div className="flex flex-col gap-3">
                                                    {t.advisoryForm.lossOptions.map(opt => (
                                                        <label key={opt} className={`flex items-center p-5 rounded-2xl border-2 cursor-pointer transition-all ${formData.lossAttitude === opt ? 'border-[#1B5E20] bg-[#E8F5E9] font-bold' : 'border-[#F1F5F9] bg-[#F8FAFC]'}`}>
                                                            <input type="radio" name="lossAttitude" value={opt} checked={formData.lossAttitude === opt} onChange={e => setFormData({ ...formData, lossAttitude: e.target.value })} className="w-5 h-5 accent-[#1B5E20] mr-4" />
                                                            <span className="text-sm font-medium">{opt}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <label className="text-xs font-bold text-[#64748B] uppercase tracking-widest">{t.advisoryForm.goalLabel}</label>
                                                <div className="flex flex-col gap-3">
                                                    {t.advisoryForm.goalOptions.map(opt => (
                                                        <label key={opt} className={`flex items-center p-5 rounded-2xl border-2 cursor-pointer transition-all ${formData.mainGoal === opt ? 'border-[#1B5E20] bg-[#E8F5E9] font-bold' : 'border-[#F1F5F9] bg-[#F8FAFC]'}`}>
                                                            <input type="radio" name="mainGoal" value={opt} checked={formData.mainGoal === opt} onChange={e => setFormData({ ...formData, mainGoal: e.target.value })} className="w-5 h-5 accent-[#1B5E20] mr-4" />
                                                            <span className="text-sm font-medium">{opt}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-8 pt-8 border-t border-[#F1F5F9]">
                                        <h3 className="text-xl font-bold text-[#1E1E1E]">{t.advisoryForm.interestLabel}</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {t.advisoryForm.interestOptions.map(interest => (
                                                <button
                                                    key={interest}
                                                    onClick={() => handleInterestToggle(interest)}
                                                    className={`p-5 rounded-2xl border-2 text-sm font-bold transition-all text-left flex items-center gap-4 ${formData.interests.includes(interest)
                                                        ? 'bg-[#E8F5E9] border-[#1B5E20] text-[#1B5E20] shadow-sm'
                                                        : 'bg-[#F8FAFC] border-[#F1F5F9] text-[#64748B] hover:bg-white'
                                                        }`}
                                                >
                                                    <div className={`w-4 h-4 rounded-full border-2 transition-colors ${formData.interests.includes(interest) ? 'bg-[#1B5E20] border-[#1B5E20]' : 'border-gray-300'}`} />
                                                    {interest}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </section>

                                {/* Final Agreement & Send */}
                                <div className="mt-12 bg-[#F8FAFC] border-2 border-[#1B5E20]/5 rounded-[32px] p-8 space-y-8 animate-in zoom-in-95 duration-500">
                                    <label className="flex items-start gap-4 cursor-pointer group">
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                className="w-6 h-6 text-[#1B5E20] rounded-lg border-2 border-gray-300 focus:ring-[#1B5E20] accent-[#1B5E20] transition-all cursor-pointer"
                                                checked={formData.agreement}
                                                onChange={e => setFormData({ ...formData, agreement: e.target.checked })}
                                            />
                                        </div>
                                        <span className="text-sm text-[#64748B] font-medium leading-relaxed group-hover:text-[#1E1E1E] transition-colors pt-0.5">
                                            {t.agreementText}
                                        </span>
                                    </label>

                                    <button
                                        onClick={handleAnalyze}
                                        disabled={loading || !formData.agreement}
                                        className={`w-full py-5 bg-[#1B5E20] text-white rounded-2xl font-black text-xl transition-all shadow-xl shadow-[#1B5E20]/20 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-4 ${loading || !formData.agreement ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:bg-[#000D0F]'}`}
                                    >
                                        {loading ? <><Loader2 className="animate-spin w-6 h-6" /> {t.advisory.steps.analyzing}</> : <>{t.advisory.steps.generate} <ArrowRight className="w-6 h-6" /></>}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sub-step Controls (Only for steps before final) */}
                    {subStep < totalSubSteps && (
                        <div className="mt-8 md:mt-16 flex justify-end">
                            <button
                                onClick={handleNext}
                                className="w-full md:w-auto px-8 md:px-12 py-4 bg-[#1B5E20] text-white rounded-2xl font-bold text-lg hover:bg-[#000D0F] transition-all shadow-lg hover:shadow-[#1B5E20]/20 flex items-center justify-center gap-2 group"
                            >
                                {t.common.continue} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    )}
                </div>
            </div >
        );
    }

    //  STEP 2: RECOMMENDATIONS 
    if (step === 2) {
        const knowMoreData = selectedBusiness ? getKnowMoreData(selectedBusiness) : null;

        return (
            <div className="p-4 md:p-8 max-w-7xl mx-auto">
                <AdvisorySidebar
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    recentAdvisories={advisoryHistory}
                    onSelectAdvisory={(adv: any) => {
                        if (adv.recommendations) {
                            setRecommendations(adv.recommendations);
                            setStep(2);
                        }
                    }}
                />
                
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <button onClick={() => setStep(1)} className="flex items-center gap-2 text-[#555] hover:text-[#1B5E20] transition-colors font-bold text-sm bg-white border border-gray-200 px-4 py-2 rounded-xl shadow-sm w-fit">
                        <ArrowLeft className="w-4 h-4" /> {t.back || "Back"}
                    </button>
                    <button onClick={() => setStep(1)} className="text-[#1B5E20] font-bold hover:underline text-sm">
                        {t.retakeAssessment}
                    </button>
                </div>

                {/* Title + Contact Expert side by side */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-6 md:mb-10">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-[#1E1E1E]">{t.recommendedBusinesses}</h1>
                    <button
                        onClick={() => setShowExpertModal(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#1B5E20] text-white rounded-xl font-bold text-sm hover:bg-[#000D0F] transition-all shadow-md hover:scale-105 active:scale-95 flex-shrink-0"
                    >
                        <Users className="w-4 h-4" />
                        {t.advisory.experts.contactExpertBtn}
                    </button>
                </div>

                {/* Business Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {recommendations.map((rec) => (
                        <div key={rec.id} className="bg-white rounded-[32px] border border-[#E6E6E6] overflow-hidden flex flex-col hover:shadow-2xl transition-all duration-300 group">
                            {/* Card Header */}
                            <div className="bg-[#1B5E20] p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-20">
                                    <Briefcase className="w-16 h-16 text-white" />
                                </div>
                                <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-bold mb-4">
                                    {rec.match_score}% {t.matchScore}
                                </div>
                                <h2 className="text-xl font-extrabold text-white leading-tight uppercase tracking-wide">
                                    {rec.title}
                                </h2>
                            </div>

                            {/* Card Body */}
                            <div className="p-6 flex-grow flex flex-col">
                                <p className="text-[#555555] text-sm mb-6 min-h-[40px] leading-relaxed">
                                    {rec.reason}
                                </p>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t.investmentLabel}</p>
                                        <p className="text-[#1E1E1E] font-bold text-sm">{rec.estimated_cost}</p>
                                    </div>
                                    <div className="bg-[#E8F5E9] rounded-xl p-3 border border-[#E6E6E6]">
                                        <p className="text-[10px] font-bold text-[#1B5E20] uppercase tracking-widest mb-1">{t.advisory.steps.profitLabel}</p>
                                        <p className="text-[#2E7D32] font-bold text-sm">{rec.profit_potential}</p>
                                    </div>
                                </div>

                                <div className="mb-8 flex-grow">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{t.advisory.steps.requirementsLabel}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {rec.requirements.map((req, i) => (
                                            <span key={i} className="px-2 py-1 bg-[#E8F5E9] border border-[#E6E6E6] rounded-lg text-xs text-[#555555] font-medium">
                                                {req}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="mt-auto flex flex-col gap-3">
                                    <button
                                        onClick={() => navigate(`/roadmap/${encodeURIComponent(rec.title)}`, {
                                            state: {
                                                businessName: rec.title,
                                                previousState: { formData, recommendations, step }
                                            }
                                        })}
                                        className="w-full py-5 bg-[#1B5E20] text-white rounded-xl font-bold text-xl hover:bg-[#000D0F] transition-all shadow-lg flex items-center justify-center gap-2 transform hover:scale-[1.02]"
                                    >
                                        <TrendingUp className="w-6 h-6" /> {t.advisory.steps.simulateBtn}
                                    </button>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleAskChatbot(rec.title)}
                                            className="flex-1 py-3 bg-white border border-[#1B5E20] text-[#1B5E20] rounded-xl font-bold text-sm hover:bg-[#E8F5F5] transition-colors flex items-center justify-center gap-2"
                                        >
                                            <MessageCircle className="w-4 h-4" /> {t.common.askChatbot}
                                        </button>
                                        <button
                                            onClick={() => setSelectedBusiness(rec)}
                                            className="flex-1 py-3 bg-white border-2 border-[#1B5E20] text-[#1B5E20] rounded-xl font-bold text-sm hover:bg-[#1B5E20] hover:text-white transition-all flex items-center justify-center gap-2 group-hover:shadow-md"
                                        >
                                            <Info className="w-4 h-4" /> {t.advisory.knowMore.button}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Best of 3 Businesses Verdict */}
                {recommendations.length > 0 && (
                    <div className="mt-12 bg-[#F8FAFC] border-2 border-[#1B5E20]/20 rounded-[32px] p-8 space-y-6">
                        <div className="flex items-center gap-3 border-b border-[#E6E6E6] pb-4">
                            <div className="w-12 h-12 bg-[#E8F5E9] rounded-xl flex items-center justify-center">
                                <TrendingUp className="text-[#1B5E20] w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-extrabold text-[#1E1E1E]">KrishiSahAI's Top Recommendation</h3>
                                <p className="text-[#555555] text-sm font-bold">Based on your resources and goals</p>
                            </div>
                        </div>
                        
                        <div className="bg-white p-6 rounded-2xl border border-[#E6E6E6] shadow-sm flex flex-col md:flex-row gap-6 items-center md:items-start">
                            <div className="flex-1 space-y-4">
                                <h4 className="text-xl font-bold text-[#1B5E20]">{recommendations[0]?.title}</h4>
                                <p className="text-[#555555] text-sm leading-relaxed">
                                    Among the top three options, <strong>{recommendations[0]?.title}</strong> offers the best balance for your profile. It aligns perfectly with your goals, requiring {recommendations[0]?.estimated_cost} while yielding robust profit potential.
                                </p>
                            </div>
                            <button
                                onClick={() => navigate(`/roadmap/${encodeURIComponent(recommendations[0]?.title)}`, {
                                    state: {
                                        businessName: recommendations[0]?.title,
                                        previousState: { formData, recommendations, step }
                                    }
                                })}
                                className="w-full md:w-auto px-8 py-4 bg-[#1B5E20] text-white rounded-xl font-bold hover:bg-[#000D0F] transition-all shadow-md flex items-center justify-center gap-2 whitespace-nowrap"
                            >
                                Generate Roadmap <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/*  KNOW MORE MODAL (WasteToValue format)  */}
                {selectedBusiness && knowMoreData && createPortal(
                    <div
                        className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/70 backdrop-blur-md transition-all animate-in fade-in duration-200"
                        onClick={() => setSelectedBusiness(null)}
                    >
                        <div
                            className="bg-white w-full h-[100vh] max-w-none rounded-none shadow-2xl overflow-hidden flex flex-col"
                            onClick={e => e.stopPropagation()}
                            id="advisory-modal-content"
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-[#E6E6E6] flex justify-between items-center bg-[#1B5E20] data-html2canvas-ignore">
                                <div>
                                    <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">{t.advisory.knowMore.businessDetails}</p>
                                    <h3 className="text-2xl font-extrabold text-white leading-tight">
                                        {knowMoreData.title}
                                    </h3>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={handleDownloadPDF}
                                        disabled={isExporting}
                                        className={`flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl font-bold transition-colors text-sm ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} 
                                        {isExporting ? "Exporting..." : "Export PDF"}
                                    </button>
                                    <button
                                        onClick={() => setSelectedBusiness(null)}
                                        className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                                    >
                                        <X className="w-5 h-5 text-white" />
                                    </button>
                                </div>
                            </div>


                            {/* Modal Content */}
                            <div className="p-8 overflow-y-auto space-y-8 bg-white">
                                {/* Stats bar */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-[#E8F5E9] rounded-2xl p-4 text-center border border-[#E6E6E6]">
                                        <p className="text-[10px] font-bold text-[#555555] uppercase tracking-widest mb-1">{t.advisory.knowMore.matchScore}</p>
                                        <p className="text-2xl font-extrabold text-[#1B5E20]">{knowMoreData.matchScore}%</p>
                                    </div>
                                    <div className="bg-[#FFFBEB] rounded-2xl p-4 text-center border border-[#FCD34D]/40">
                                        <p className="text-[10px] font-bold text-[#555555] uppercase tracking-widest mb-1">{t.advisory.knowMore.investment}</p>
                                        <p className="text-lg font-extrabold text-[#92400E]">{knowMoreData.investment}</p>
                                    </div>
                                    <div className="bg-green-50 rounded-2xl p-4 text-center border border-green-100">
                                        <p className="text-[10px] font-bold text-[#555555] uppercase tracking-widest mb-1">{t.advisory.knowMore.monthlyProfit}</p>
                                        <p className="text-lg font-extrabold text-[#1B5E20]">{knowMoreData.profit}</p>
                                    </div>
                                </div>

                                {/* Basic Idea */}
                                <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
                                    <h4 className="text-lg font-bold text-[#1B5E20] mb-3 flex items-center gap-2">
                                        <Sprout className="w-5 h-5" /> {t.advisory.knowMore.overview}
                                    </h4>
                                    <ul className="space-y-2">
                                        {knowMoreData.basicIdea.map((line, idx) => (
                                            <li key={idx} className="text-[#555555] text-sm leading-relaxed flex items-start gap-2">
                                                <span className="mt-1.5 w-1.5 h-1.5 bg-[#1B5E20]/60 rounded-full flex-shrink-0"></span>
                                                <span>{line}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Detailed sections grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">
                                    {knowMoreData.sections.map((section, idx) => (
                                        <div key={idx} className="bg-[#E8F5E9] p-5 rounded-2xl border border-[#E6E6E6]">
                                            <h5 className="font-bold text-[#1E1E1E] mb-3 uppercase text-xs tracking-widest border-b border-[#E6E6E6] pb-2 flex items-center justify-between">
                                                {section.title}
                                                <div className="w-1.5 h-1.5 bg-[#1B5E20] rounded-full"></div>
                                            </h5>
                                            <ul className="space-y-2.5">
                                                {section.content.map((item, i) => (
                                                    <li key={i} className="text-[#555555] text-sm leading-relaxed flex items-start gap-2">
                                                        <span className="mt-1.5 w-1.5 h-1.5 bg-[#1B5E20]/40 rounded-full flex-shrink-0"></span>
                                                        <span>{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>

                                {/* Bottom action */}
                                <div className="flex gap-3 pt-2 border-t border-gray-100">
                                    <button
                                        onClick={() => { setSelectedBusiness(null); handleAskChatbot(selectedBusiness.title); }}
                                        className="flex-1 py-3 bg-[#1B5E20] text-white rounded-xl font-bold text-sm hover:bg-[#000D0F] transition-all flex items-center justify-center gap-2 shadow-md"
                                    >
                                        <MessageCircle className="w-4 h-4" /> {t.askChatbotBtn}
                                    </button>
                                    <button
                                        onClick={() => { setSelectedBusiness(null); setShowExpertModal(true); }}
                                        className="flex-1 py-3 bg-white border-2 border-[#1B5E20] text-[#1B5E20] rounded-xl font-bold text-sm hover:bg-[#E8F5E9] transition-all flex items-center justify-center gap-2"
                                    >
                                        <Users className="w-4 h-4" /> {t.advisory.experts.contactExpertBtn}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>, document.body
                )}

                {/*  CONTACT TO EXPERT MODAL  */}
                {showExpertModal && (
                    <div
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md transition-all animate-in fade-in duration-200"
                        onClick={() => setShowExpertModal(false)}
                    >
                        <div
                            className="bg-white w-full max-w-5xl max-h-[92vh] rounded-[2rem] shadow-2xl border border-[#E6E6E6] overflow-hidden flex flex-col"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Expert Modal Header */}
                            <div className="p-6 border-b border-[#E6E6E6] flex justify-between items-center bg-[#1B5E20]">
                                <div>
                                    <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">{t.advisory.experts.expertNetwork}</p>
                                    <h3 className="text-2xl font-extrabold text-white">{t.advisory.experts.connectWithExperts}</h3>
                                    <p className="text-white/80 text-sm mt-1">{t.advisory.experts.verifiedSpecialists}</p>
                                </div>
                                <button
                                    onClick={() => setShowExpertModal(false)}
                                    className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>

                            {/* Expert Cards */}
                            <div className="p-6 overflow-y-auto space-y-5 bg-[#FAFAF7]">
                                {EXPERTS.map((expert) => (
                                    <div
                                        key={expert.id}
                                        className="bg-white rounded-2xl border border-[#E6E6E6] overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
                                    >
                                        <div className="p-5 flex flex-col md:flex-row gap-5">
                                            {/* Photo */}
                                            <div className="flex-shrink-0">
                                                <div className="relative">
                                                    <img
                                                        src={expert.photo}
                                                        alt={expert.name}
                                                        className="w-24 h-24 rounded-2xl object-cover border-2 border-[#E6E6E6] shadow-sm"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(expert.name)}&background=1B5E20&color=fff&size=96`;
                                                        }}
                                                    />
                                                    <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${expert.available ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                                </div>
                                            </div>

                                            {/* Info */}
                                            <div className="flex-grow">
                                                <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                                                    <div>
                                                        <h4 className="text-lg font-extrabold text-[#1E1E1E]">{expert.name}</h4>
                                                        <p className="text-[#1B5E20] font-bold text-sm">{expert.title}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1 bg-[#FFF8E1] px-3 py-1 rounded-full border border-[#FCD34D]">
                                                        <Star className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B]" />
                                                        <span className="text-xs font-bold text-[#92400E]">{expert.rating}</span>
                                                    </div>
                                                </div>

                                                {/* Meta row */}
                                                <div className="flex flex-wrap gap-3 mb-3 text-xs text-[#555555]">
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="w-3.5 h-3.5 text-[#1B5E20]" />
                                                        {expert.location}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Award className="w-3.5 h-3.5 text-[#1B5E20]" />
                                                        {expert.experience} {t.advisory.experts.experience}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Users className="w-3.5 h-3.5 text-[#1B5E20]" />
                                                        {expert.consultations.toLocaleString()} {t.advisory.experts.consultations}
                                                    </span>
                                                    {expert.available ? (
                                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E8F5E9] text-[#1B5E20] text-[10px] font-black rounded-full uppercase tracking-widest">
                                                            <div className="w-1.5 h-1.5 bg-[#1B5E20] rounded-full animate-pulse" />
                                                            {t.advisory.experts.availableNow}
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-500 text-[10px] font-black rounded-full uppercase tracking-widest">
                                                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                                                            {t.advisory.experts.busy}
                                                        </div>
                                                    )}
                                                </div>

                                                <p className="text-[#555555] text-sm leading-relaxed mb-3">{expert.bio}</p>

                                                {/* Expertise tags */}
                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    {expert.expertise.map((tag, i) => (
                                                        <span key={i} className="px-2.5 py-1 bg-[#E8F5E9] border border-[#E6E6E6] rounded-lg text-xs text-[#1B5E20] font-bold">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>

                                                {/* Connect Button */}
                                                <button
                                                    onClick={() => handleConnect(expert.id)}
                                                    disabled={!expert.available || connectingExpert === expert.id}
                                                    className={`w-full md:w-auto px-8 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md
                                                        ${!expert.available
                                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                                            : connectingExpert === expert.id
                                                                ? 'bg-[#1B5E20]/80 text-white cursor-wait'
                                                                : 'bg-[#1B5E20] text-white hover:bg-[#000D0F] hover:scale-105 active:scale-95'
                                                        }`}
                                                >
                                                    {connectingExpert === expert.id ? (
                                                        <><Loader2 className="w-4 h-4 animate-spin" /> {t.advisory.experts.connecting}</>
                                                    ) : !expert.available ? (
                                                        <><Phone className="w-4 h-4" /> {t.advisory.experts.unavailable}</>
                                                    ) : (
                                                        <><Phone className="w-4 h-4" /> {t.advisory.experts.connect}</>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return null;
    };

    return (
        <div className={step === 2 ? "h-[calc(100vh-68px)] p-0 md:p-4 lg:p-6 bg-gray-50" : "min-h-screen bg-gray-50 p-0 md:p-4 lg:p-6"}>
            <AdvisorySidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                recentAdvisories={recommendations}
            />
            {step === 2 ? (
                <ChatLayout>
                    <div className="flex flex-col h-full w-full">
                        <div className="flex-1 overflow-y-auto w-full">
                            {renderContent()}
                        </div>
                    </div>
                </ChatLayout>
            ) : (
                <div className="w-full">
                    {renderContent()}
                </div>
            )}
        </div>
    );
};

export default BusinessAdvisory;
