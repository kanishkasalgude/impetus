<p align="center">
  <img src="./Logo/KrishiSahAI.png" width="120" alt="KrishiSahAI Logo" />
</p>

<h1 align="center">KrishiSahAI Advisory</h1>

<p align="center">
  <strong>The Definitive Artificial Intelligence Platform for the Indian Farmer</strong>
</p>

<p align="center">
  <a href="https://krishisahai-advisory.web.app/">Live Platform</a> &nbsp;&bull;&nbsp;
  <a href="./DETAIL.md">Technical Documentation</a> &nbsp;&bull;&nbsp;
  <a href="./INSTALLATION.md">Installation Guide</a>
</p>

---

KrishiSahAI Advisory is an end-to-end intelligent agricultural platform that brings together generative AI, computer vision, real-time environmental data, and multilingual voice interaction into a single cohesive system. It is designed to serve every Indian farmer, from the smallholder with a single acre to the progressive agripreneur scaling toward mechanized enterprise.

The platform transforms the farmhouse into a data-driven operation by providing a persistent AI chatbot as the primary interface, generating strategic business roadmaps, diagnosing crop diseases through image recognition, detecting pests with real-time object detection, planning full crop lifecycles from sowing to harvest, converting agricultural waste into identified revenue streams, and delivering curated expert agricultural knowledge through an integrated Knowledge Hub. All capabilities are accessible in English, Hindi, and Marathi through both text and voice, with full Unicode PDF export support for Devanagari scripts.

---

## Problem Statement

Indian agriculture sustains over 700 million people yet remains one of the most underserved sectors for technology adoption. Farmers face compounding, simultaneous challenges that no existing single tool addresses adequately:

**Lack of strategic guidance.** The majority of farmers plant based on tradition rather than market intelligence, soil science, or capital efficiency. The result is chronic income stagnation and susceptibility to price shocks.

**No lifecycle planning tools.** Farmers lack access to phase-by-phase crop management plans that guide them from sowing through harvest with specific irrigation, fertilization, and pest control instructions for each stage.

**Delayed disease and pest response.** Crop loss due to undetected disease and pest infestation amounts to an estimated 15–25% of annual yield nationally. Laboratory diagnosis and expert consultation are geographically and financially inaccessible for most farmers.

**Wasted agricultural residue.** Post-harvest residue, stalks, husks, and stems, is routinely burned, contributing to air pollution and representing a destroyed secondary income source. Farmers lack the knowledge to convert this waste into compostable material, biofuel, or industrial inputs.

**Digital and literacy barriers.** Existing agri-tech platforms are English-first, text-heavy, and require reliable internet and modern hardware. They are built for an agronomist, not a farmer standing in a field.

**Information fragmentation.** Weather data, commodity prices, government schemes, and pest alerts exist across dozens of disconnected sources. There is no unified intelligence layer that synthesizes this information for a specific farm's context.

**Knowledge gap.** Farmers lack access to structured, expert-curated educational content on modern agricultural techniques, innovations, and best practices, leaving them dependent on word-of-mouth and outdated methods.

---

## Our Solution

KrishiSahAI Advisory is a unified intelligence platform that addresses every dimension of this problem within a single, consistent interface.

The system opens to a **persistent AI Chatbot** as the default home screen, providing farmers with instant, contextual conversational intelligence powered by LangChain and streaming Server-Sent Events. A **CropCycle Planner** generates detailed phase-by-phase lifecycle management plans, from sowing and pre-planting through vegetative growth, flowering, and harvest, with specific actions tailored to the farmer's crop, soil, and location. A **Business Advisory Engine** understands the farmer's land, capital, soil, and location to generate actionable multi-year strategies with ranked venture recommendations. A **10-Year Growth & Sustainability Roadmap** provides long-term strategic planning for agri-business ventures. A **Precision Diagnostics suite** powered by a TensorFlow-based disease classifier and a YOLO v8-powered pest detector operates directly on images captured by any smartphone camera. A **Waste-to-Value Engine** driven by a large language model identifies specific industrial and biological conversion pathways for the farmer's specific residue type. A **Farm Health Engine** provides AI-driven soil and crop health assessments with actionable fertilizer recommendations and market advice. A **Knowledge Hub** aggregates curated, expert-authored agricultural articles with multilingual support, hero imagery, and rich markdown rendering for continuous learning. A **multilingual voice interface** using OpenAI Whisper and gTTS ensures that neither literacy nor language is ever a barrier to access.

The platform is built for India's farmers while being architecturally production-ready for enterprise and government deployment.

---

## Core Features

### AI Business Chatbot (Default Home)

A persistent, language-aware, streaming conversational advisor that serves as the platform's primary interface.

Built on LangChain with state managed through conversation buffer memory, the chatbot operates over both standard and Server-Sent Event streaming connections. It enforces language purity through system-level prompt engineering, a technique internally called the Iron Curtain strategy, ensuring Hindi and Marathi responses do not include English fallbacks. The chatbot is context-aware, consuming the farmer's profile data (crops, location, soil type, farm size) and real-time weather data to deliver personalized, situation-specific advice. Conversation titles are AI-generated based on the session content, and sessions are identified by UUID for stateless server-side management. Chat history is persistently saved in Firestore with a dedicated sidebar for session management, including session switching, deletion with confirmation dialogs, and real-time updates via Firestore snapshots. A floating chatbot FAB (Floating Action Button) is available on every page except the chat and planner views, providing one-tap access to the AI assistant from anywhere in the app. Rotating agricultural tips are displayed during loading states, changing every 10 seconds to educate farmers while they wait.

---

### CropCycle Planner (Roadmap Dashboard)

Phase-by-phase lifecycle management for any crop.

The CropCycle Planner generates a detailed lifecycle plan for the farmer's selected crop, breaking the entire growing season into logical phases (Sowing, Vegetative Growth, Flowering & Fruiting, Harvest & Post-Harvest). Each phase includes critical focus areas, required actions with specific irrigation, fertilization, and pest control steps, and projected yield values. Quick-action buttons on each phase card allow farmers to jump directly to the AI Chatbot, Fertilizer Advisor, Disease/Pest Scanner, or Waste-to-Value Engine with pre-loaded context for that specific phase. The chatbot integration pre-fills a detailed prompt with the phase's goals, focus areas, and required actions for instant contextual advice. Plans are cached in both Firestore and LocalStorage for instant loading on return visits, with a three-tier retrieval strategy: LocalStorage first, then Firestore, then API generation as a fallback. A dedicated Plan Sidebar allows switching between crops registered to the active farm.

---

### Business Advisory Engine

Contextual AI strategy generation grounded in the farmer's actual profile.

The engine accepts a comprehensive farmer profile, land size, soil type, water availability, capital, skills, market access, and risk preference, and generates a ranked list of viable agri-business ventures with projected ROI timelines. Each recommendation includes a detailed assessment accessible through a dedicated Business Detail view and a full 10-year sustainability roadmap. The advisor maintains full conversational memory across sessions, allowing farmers to refine plans through dialogue. Responses are generated in the farmer's preferred language without any language blending. An Advisory Sidebar tracks and displays history of previous advisory sessions powered by Firestore real-time subscriptions.

---

### 10-Year Growth & Sustainability Roadmap

Long-term strategic planning for agri-business ventures.

Accessible from the Business Advisory module, the roadmap generator creates a detailed 10-year plan broken into annual phases with strategic focus areas, key actions, and expected profit projections in Indian Rupees. The roadmap includes dedicated sections for Labor & Aging Analysis, Sustainability & Succession Planning, Financial Resilience Strategy, and a Final Strategic Verdict. Server-side PDF generation via ReportLab produces professional-quality downloadable reports with full Devanagari script support.

---

### Disease Detection System

Computer vision-based crop disease identification from a single photograph.

A multi-class convolutional neural network trained on the New Plant Diseases Dataset classifies 38 distinct disease conditions across crops including tomatoes, apples, corn, and potatoes. The inference pipeline includes severity scoring based on model confidence, and a curated CSV database provides specific home remedies and chemical treatment protocols for each detected disease. Images are processed and discarded after inference to preserve user privacy and server disk space.

---

### Pest Detection Module

Real-time object detection for destructive agricultural pests.

Powered by YOLO v8, this module identifies common agricultural pests, including the Rice Leaf Roller, Brown Planthopper, and others, directly from field photographs. The model maps neural network integer outputs to a human-readable pest registry and returns a confidence score, a severity classification, and a contextual description. Like the disease pipeline, images are automatically discarded post-inference.

---

### Crop Care Hub

Unified entry point for plant health diagnostics.

The Crop Care Hub provides a streamlined interface for farmers to access both the Disease Detection and Pest Detection modules from a single page. It includes a Detection History Sidebar powered by Firestore that tracks previous scans, enabling farmers to review past diagnoses, compare results over time, and maintain a record of crop health issues across sessions.

---

### Waste-to-Value Engine

Transforming post-harvest residue into identified revenue streams.

The engine accepts a crop type and language parameter and returns a structured analysis identifying viable conversion pathways: vermicomposting, briquette production for biofuel, paper pulp processing, or bioplastic pre-treatment. Each pathway includes technical basis, manufacturing options (DIY vs. third-party), equipment requirements, average recovery values, and action urgency assessment. The engine supports follow-up chat and streaming for extended advisory sessions on circular agriculture. Full analysis history is saved to Firestore for future reference, with a dedicated sidebar for viewing and managing previous Waste-to-Value analyses.

---

### Farm Health Analysis

AI-driven soil and crop health assessment with actionable recommendations.

The Farm Health Engine accepts crop name, soil parameters, soil type, and farm location to generate a holistic health report. It returns structured data including multiple fertilizer options (with name, action, quantity, timing, and advantages for each), market advice with timing and confidence scoring, and actionable insights. Each fertilizer recommendation includes a "Deep Dive" button that opens the AI Chatbot with a pre-filled expert consultation prompt specific to that fertilizer and crop combination. An aggregate "What's Best For You" AI recommendation section synthesizes all options into a top pick with rationale. The module auto-loads analysis when a crop is selected, with session-cached results for instant revisits. It adapts its recommendations based on the user's preferred language.

---

### Knowledge Hub

Curated expert agricultural knowledge base with full multilingual article system.

The Knowledge Hub is a centralized resource center providing farmers with structured, expert-authored educational content on modern agricultural techniques, innovations, and best practices. Accessible from the main navigation header and the profile dropdown menu, it features a grid-based article catalog with 8 curated articles covering topics including tissue culture, AI-powered farming, cattle health monitoring, drone services, ancient grains (emmer wheat), smart irrigation controllers, laser weed destroyers, and mango floating techniques.

Each article is stored as a self-contained directory with a JSON manifest (`index.json`) containing fully trilingual content (English, Hindi, and Marathi), hero images, gallery images, metadata (author, date), and excerpts. The ArticleCard component displays each article with a hero image, localized title, excerpt (auto-derived from content if not explicitly provided), and a "Read More" link with hover animations and image zoom effects.

The Article Detail view renders full-length articles using ReactMarkdown with GitHub Flavored Markdown support (`remark-gfm`) and line break handling (`remark-breaks`). Articles feature a full-bleed hero image header (50–60% viewport height), gradient overlays, author and date metadata, a professionally typeset body with semantic heading hierarchy, styled blockquotes and lists, and an image gallery section at the bottom. Content is keyed by language to force complete re-renders on language switch, ensuring seamless multilingual transitions. Navigation includes a back button to return to the Knowledge Hub grid.

---

### Weather Integration

Real-time meteorological intelligence tied to the farm's actual location.

The system connects to WeatherAPI to retrieve location-specific forecasts, pre-processing the nested JSON response into actionable parameters including rainfall probability, daily temperature extremes, humidity, wind speed, and UV index. Weather data is displayed through a dedicated Weather Modal accessible from the header, featuring current conditions, hourly forecasts, and multi-day outlooks. Weather data auto-fetches when the active farm changes and is consumed by the chatbot to ensure recommendations account for current and forecasted conditions. The weather display is refreshable on demand from the header.

---

### Agriculture News & Article System

Personalized, crop-specific news aggregation with bookmarking.

The news service constructs targeted boolean queries combining crop names, district names, and economic keywords to filter out generic national news in favor of alerts directly relevant to the farmer's operation. The system uses a tiered fallback strategy to ensure results are always returned. Farmers can star/bookmark articles for later reference, with starred articles persisted in LocalStorage and accessible through a dedicated sidebar. Starred articles are saved as headlines that persist even after the session ends or the original news disappears. Full article detail views with rich formatting, free of unnecessary recommended actions, are available. The API interface ensures robust CORS handling and gracefully manages connectivity edge-cases.

---

### Multilingual Voice Interaction

Full speech-to-text and text-to-speech support across three languages.

Powered by OpenAI Whisper for transcription and gTTS for synthesis, the voice module supports English, Hindi, and Marathi across both input and output. Audio blobs are received as temporary files, transcribed, and deleted. The response is synthesized as an audio stream and returned for playback, enabling hands-free, screen-free access for farmers in the field.

---

### Authentication & User Management

Phone-based authentication with 6-digit PIN security.

The platform uses Firebase Authentication with a phone number-based identity system (phone numbers are converted to synthetic email addresses for Firebase compatibility). Users authenticate with a 6-digit numeric PIN entered through individual digit input boxes with auto-focus navigation between digits, arrow key support, and backspace handling. The signup flow is a two-step wizard: Step 1 collects personal information (name, age, gender, phone, language preference, farming experience, PIN, and optional email), and Step 2 collects farm information. The registration form supports the farmer's preferred language from the start, with the entire UI dynamically switching as the language is selected during signup.

---

### Multi-Farm Management

Support for multiple farm profiles with instant switching.

Farmers can register and manage multiple farms, each with its own nickname, location (state, district, village), land type (Irrigated, Rainfed, Semi-Irrigated, Organic Certified, Greenhouse, Polyhouse, Mixed), water resource (Borewell, Canal, River, Rainfed, Tank, Drip, Sprinkler), soil type (Black, Red, Loamy, Sandy, Clay, Alluvial, Laterite), land size, and crop selections. Farms can be switched instantly from the profile dropdown in the header, and switching the active farm automatically refreshes all context-dependent features (weather, planner, farm health, chatbot context). The Edit Profile page allows adding, removing, and modifying farm details, including adding custom crops not in the pre-built crop list.

---

### Seamless Navigation and Clean UI

Consistent UX with global back buttons, sidebars, and a distraction-free interface.

Navigation across nested views (Knowledge Hub, Article Detail, Chatbot, Business Detail, Roadmap, Edit Profile, Planner) is streamlined with persistent, intuitive back buttons. Feature pages display context-aware quick-navigation icons in the header for Crop Care, Planner, Advisory, and Waste-to-Value. The profile dropdown adapts its menu items based on the current page, showing Knowledge Hub, News, and Weather links when on feature pages. A hamburger menu triggers context-specific sidebars (Chat History, Plan Sidebar, Advisory Sidebar, Detection History) across different modules. The entire UI is designed to be highly readable without unnecessary visual noise, stripping out all emojis and confidence footers for a professional, distraction-free experience.

---

### PDF Report Generation

Structured downloadable reports with full Unicode/Devanagari support.

Client-side PDF generation using jsPDF with a custom-loaded Hind font provides full Latin and Devanagari script rendering in a single document. PDF exports are available across three modules:

- **Chatbot**: Exports the complete conversation with styled user and AI message bubbles, dynamically calculated background rectangles, and proper text wrapping.
- **Waste-to-Value**: Exports the full analysis with section-wise formatting, green accent bars, and content blocks.
- **Business Advisory**: Exports the advisory plan including the 10-year roadmap with year-wise breakdowns.

Server-side PDF generation via ReportLab is available for the Roadmap module, producing professional-quality documents.

---

### Loading Tips System

Rotating agricultural tips displayed during AI processing.

While the platform processes AI requests (chatbot responses, farm health analysis, crop roadmap generation), a rotating tips system displays curated agricultural wisdom. Tips rotate every 10 seconds and cover topics including soil testing, crop rotation, organic pest control, drip irrigation, companion planting, precision agriculture, post-harvest storage, and record keeping, educating farmers during wait times.

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React 19 + TypeScript + Vite)      │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│  │ Chatbot  │ │CropCycle │ │ Advisory │ │  Waste   │             │ 
│  │  (Home)  │ │ Planner  │ │  Engine  │ │ ToValue  │             │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│  │ Disease  │ │   Pest   │ │  Farm    │ │Knowledge │             │
│  │ Detector │ │ Detector │ │  Health  │ │   Hub    │             │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│  │  News    │ │ CropCare │ │ Roadmap  │ │  Profile │             │
│  │  Page    │ │   Hub    │ │          │ │  Editor  │             │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                          │
│  │ Business │ │ Article  │ │ Weather  │                          │
│  │  Detail  │ │  Detail  │ │  Modal   │                          │
│  └──────────┘ └──────────┘ └──────────┘                          │
│                                                                  │
│  Context: LanguageContext (EN/HI/MR) │ FarmContext (Active Farm) │
│  Styling: TailwindCSS  │  PDF: jsPDF + Hind Font (Unicode)       │
│  Icons: Lucide React   │  Markdown: react-markdown + remark-gfm  │
│  Chat: chatService (Firestore) │ Sidebars: Chat/Plan/Advisory    │
└────────────────────────────┬─────────────────────────────────────┘
                             │ REST API + SSE Streams
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                     BACKEND (Flask + Python)                     │
│                                                                  │
│  ┌────────────────────┐  ┌────────────────────┐                  │
│  │  BusinessAdvisor   │  │   CropPlanner      │                  │
│  │  (LangChain +      │  │   (LangChain +     │                  │
│  │   Ollama/Gemini)   │  │    Ollama)          │                 │
│  └────────────────────┘  └────────────────────┘                  │
│  ┌────────────────────┐  ┌────────────────────┐                  │
│  │  DiseaseDetector   │  │   PestDetector     │                  │
│  │  (TensorFlow CNN)  │  │   (YOLOv8)         │                  │
│  └────────────────────┘  └────────────────────┘                  │
│  ┌────────────────────┐  ┌────────────────────┐                  │
│  │  WasteToValue      │  │   FarmHealth       │                  │
│  │  (Ollama LLM)      │  │   (Ollama LLM)     │                  │
│  └────────────────────┘  └────────────────────┘                  │
│  ┌────────────────────┐  ┌────────────────────┐                  │
│  │  VoiceText         │  │   WeatherNews      │                  │
│  │  (Whisper + gTTS)  │  │   (WeatherAPI +    │                  │
│  └────────────────────┘  │    GNews)           │                 │
│                          └────────────────────┘                  │
│  ┌────────────────────┐  ┌────────────────────┐                  │
│  │  FiveToTenYear     │  │  pdfGeneration     │                  │
│  │  Roadmap Generator │  │  (ReportLab)       │                  │
│  └────────────────────┘  └────────────────────┘                  │
│                                                                  │
│  Auth: Firebase Admin  │  DB: Firestore  │  AI: Ollama (local)   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| React 19 | UI framework with hooks and functional components |
| TypeScript | Type-safe development |
| Vite | Build tool and development server |
| TailwindCSS | Utility-first CSS framework |
| React Router v7 | Client-side routing and navigation (HashRouter) |
| Firebase SDK | Authentication (Phone + PIN) and Firestore data persistence |
| jsPDF | Client-side PDF generation with custom Unicode font support |
| Lucide React | Icon library |
| react-markdown + remark-gfm + remark-breaks | Markdown rendering with GitHub Flavored Markdown and line breaks |

### Backend

| Technology | Purpose |
|---|---|
| Flask 3 | REST API gateway with CORS and security headers |
| LangChain + langchain-ollama | LLM orchestration for advisory, planning, and analysis |
| Ollama | Local LLM inference (llama3.2) for privacy-preserving AI |
| TensorFlow | CNN-based crop disease classification (New Plant Diseases Dataset) |
| Ultralytics YOLOv8 | Real-time pest object detection |
| OpenAI Whisper | Speech-to-text transcription (EN/HI/MR) |
| gTTS | Text-to-speech synthesis |
| Firebase Admin | Server-side authentication and Firestore operations |
| ReportLab | Server-side PDF generation for roadmaps |
| APScheduler | Background task scheduling |
| WeatherAPI | Real-time weather data |
| GNews | Agriculture news aggregation |

---

## Project Structure

```
impetus/
├── Backend/
│   ├── app.py                          # Flask API gateway (all routes)
│   ├── middleware/                      # Auth middleware (Firebase token verification)
│   ├── requirements.txt                # Python dependencies
│   └── services/
│       ├── BusinessAdvisor/            # AI chatbot + business recommendation engine
│       ├── DiseaseDetector/            # TensorFlow CNN disease classifier
│       ├── FarmHealth/                 # AI-driven soil/crop health analysis
│       ├── FiveToTenYear/              # 10-year business roadmap generator
│       ├── PestDetector/               # YOLOv8 pest detection
│       ├── Planner/                    # CropCycle phase planner
│       ├── VoiceText/                  # Whisper STT + gTTS TTS
│       ├── WasteToValue/               # Agricultural waste conversion engine
│       ├── WeatherNewsIntegration/     # Weather API + GNews integration
│       └── pdfGeneration/              # Server-side PDF rendering (ReportLab)
│
├── Frontend/
│   ├── App.tsx                         # Root component with routing, auth, and header
│   ├── firebase.ts                     # Firebase client configuration
│   ├── contexts/
│   │   └── ThemeContext.tsx            # Theme provider
│   ├── pages/
│   │   ├── Chatbot.tsx                 # AI conversational advisor (default home /)
│   │   ├── Home.tsx                    # CropCycle Planner dashboard (/plan)
│   │   ├── BusinessAdvisory.tsx        # Business plan generator + assessment
│   │   ├── BusinessDetail.tsx          # Business recommendation detail view
│   │   ├── Roadmap.tsx                 # 10-year roadmap viewer
│   │   ├── WasteToValue.tsx            # Waste analysis with chat follow-up
│   │   ├── FarmHealth.tsx              # Soil/crop health analysis with fertilizer recs
│   │   ├── CropCare.tsx                # Disease/pest detection hub
│   │   ├── DiseaseDetector.tsx         # Image-based disease scan
│   │   ├── PestDetector.tsx            # Image-based pest identification
│   │   ├── KnowledgeHub.tsx            # Expert knowledge article grid (/hub)
│   │   ├── ArticleDetail.tsx           # Full article view with markdown (/knowledge/:slug)
│   │   ├── NewsPage.tsx                # Agriculture news with bookmarks
│   │   ├── Planner.tsx                 # Crop plan viewer
│   │   └── EditProfile.tsx             # User/farm profile editor
│   ├── components/
│   │   ├── ChatLayout.tsx              # Shared chat UI wrapper
│   │   ├── ChatSidebar.tsx             # Chat session history sidebar
│   │   ├── AdvisorySidebar.tsx         # Advisory history sidebar
│   │   ├── PlanSidebar.tsx             # Crop plan/farm selection sidebar
│   │   ├── DetectionHistorySidebar.tsx # Disease/pest scan history
│   │   ├── WeatherModal.tsx            # Weather forecast overlay modal
│   │   ├── DeleteConfirmationModal.tsx # Confirmation dialog component
│   │   ├── FeatureConfirmationModal.tsx# Feature access confirmation
│   │   ├── Home/                       # CropCycle page sub-components
│   │   └── KnowledgeHub/
│   │       └── ArticleCard.tsx         # Article card with hero image and excerpt
│   ├── src/
│   │   ├── context/
│   │   │   ├── LanguageContext.tsx      # i18n provider (EN/HI/MR)
│   │   │   └── FarmContext.tsx          # Active farm state provider
│   │   ├── locales/
│   │   │   ├── en.json                 # English translations
│   │   │   ├── hi.json                 # Hindi translations
│   │   │   └── mr.json                 # Marathi translations
│   │   ├── services/
│   │   │   ├── api.ts                  # Centralized API client
│   │   │   └── chatService.ts          # Firestore chat session management
│   │   ├── hooks/
│   │   │   └── useLoadingTips.ts       # Rotating loading tip hook (10s cycle)
│   │   ├── types/
│   │   │   └── article.ts             # Article and LocalizedContent types
│   │   ├── utils/                      # Utility functions (localization, etc.)
│   │   └── articles/                   # Knowledge Hub article content
│   │       ├── ai-powered-farming/     # Article: AI-Powered Farming
│   │       ├── cattle-health-monitoring/ # Article: Cattle Health Monitoring
│   │       ├── drone-services/         # Article: Drone Services in Agriculture
│   │       ├── emmer-wheat/            # Article: Emmer Wheat (Ancient Grains)
│   │       ├── irrigation-controller/  # Article: Smart Irrigation Controllers
│   │       ├── laser-weed-destroyer/   # Article: Laser Weed Destroyer
│   │       ├── mango-floater/          # Article: Mango Floating Techniques
│   │       └── KNOWLEDGE_HUB_ARTICLE_1_TISSUECULTURE/ # Article: Tissue Culture
│   └── public/
│       └── fonts/
│           └── Hind-Regular.ttf        # Unicode font (Latin + Devanagari)
│
├── Logo/                               # Brand assets
├── DETAIL.md                           # Comprehensive technical documentation
├── INSTALLATION.md                     # Setup and deployment guide
├── MOBILE_APP.md                       # Mobile app documentation
└── firebase.json                       # Firebase hosting configuration
```

---

## Multilingual Support

The platform natively supports three languages across the entire interface:

| Language | Script | Code |
|---|---|---|
| English | Latin | `en` |
| Hindi | Devanagari | `hi` |
| Marathi | Devanagari | `mr` |

Language switching is instant and affects all UI labels (via JSON locale files), AI-generated content (via system prompt engineering), voice input/output, Knowledge Hub articles (each article contains full trilingual content), and PDF exports. The platform uses the Hind font family for PDF generation, which supports both Latin and Devanagari glyphs in a single typeface, ensuring exported documents correctly render text in any supported language. Language preference is set during signup and synced to the user's Firestore profile, automatically applied on subsequent logins.

---

## Scalability and Production Readiness

The API layer is fully stateless with respect to persistent data, session state is UUID-keyed in memory or persisted to Firestore. All services are independently deployable Python modules with no circular dependencies at the routing layer. CORS is environment-aware, enforcing strict origin whitelisting in production while permitting wildcard access during development. The Flask server is Talisman-compatible for HTTP security header enforcement in production. The frontend is Firebase Hosting-deployed as a static production bundle with environment-separated configuration.

The modular service architecture allows individual components, the disease detector, pest detector, business advisor, or any other module, to be extracted, containerized, and deployed as independent microservices without restructuring the API contract.

---

## Real-World Impact

**Economic.** By replacing intuition-based planting with data-driven strategy selection and lifecycle planning, the platform is estimated to increase farmer net income by 30–50% over a three-year horizon through better crop selection, reduced loss from disease and pest damage, and monetization of previously wasted residue.

**Social.** Multilingual voice interaction removes the literacy and language barriers that have historically excluded smallholder farmers from agri-tech adoption. The platform democratizes access to expert-level agricultural intelligence without requiring human intermediaries.

**Environmental.** The Waste-to-Value engine directly reduces agricultural waste burning, a major contributor to seasonal air quality deterioration in northern India. Promotion of organic treatments over chemical intervention supports long-term soil health.

**Educational.** The Knowledge Hub bridges the knowledge gap by providing expert-curated, multilingual educational content on modern agricultural techniques, from tissue culture and drone services to AI-powered farming and smart irrigation. Farmers gain access to structured learning resources previously available only through agricultural universities or extension services.

**Market Opportunity.** With over 120 million farm holdings in India and government-backed agricultural digitization mandates, the platform addresses a market that is structurally underserved and politically prioritized. The architecture supports integration with national programs such as PM-KISAN and the Government e-Marketplace.

---

## Documentation

**Detailed Technical Documentation**
[Read DETAIL.md](./DETAIL.md)

**Installation and Setup Guide**
[Read INSTALLATION.md](./INSTALLATION.md)

**Mobile Application Guide**
[Read MOBILE_APP.md](./MOBILE_APP.md)

---

## Contributing

Contributions are welcome. Please open an issue to discuss proposed changes before submitting a pull request. All contributions must maintain type safety on the frontend and must not introduce breaking changes to the public API contract documented in DETAIL.md.

---

## License

KrishiSahAI Advisory is released under the MIT License.
