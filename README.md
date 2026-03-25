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

The platform transforms the farmhouse into a data-driven operation by generating strategic business roadmaps, diagnosing crop diseases through image recognition, detecting pests with real-time object detection, planning full crop lifecycles from sowing to harvest, and converting agricultural waste into identified revenue streams. All capabilities are accessible in English, Hindi, and Marathi through both text and voice, with full Unicode PDF export support for Devanagari scripts.

---

## Problem Statement

Indian agriculture sustains over 700 million people yet remains one of the most underserved sectors for technology adoption. Farmers face compounding, simultaneous challenges that no existing single tool addresses adequately:

**Lack of strategic guidance.** The majority of farmers plant based on tradition rather than market intelligence, soil science, or capital efficiency. The result is chronic income stagnation and susceptibility to price shocks.

**No lifecycle planning tools.** Farmers lack access to phase-by-phase crop management plans that guide them from sowing through harvest with specific irrigation, fertilization, and pest control instructions for each stage.

**Delayed disease and pest response.** Crop loss due to undetected disease and pest infestation amounts to an estimated 15–25% of annual yield nationally. Laboratory diagnosis and expert consultation are geographically and financially inaccessible for most farmers.

**Wasted agricultural residue.** Post-harvest residue, stalks, husks, and stems, is routinely burned, contributing to air pollution and representing a destroyed secondary income source. Farmers lack the knowledge to convert this waste into compostable material, biofuel, or industrial inputs.

**Digital and literacy barriers.** Existing agri-tech platforms are English-first, text-heavy, and require reliable internet and modern hardware. They are built for an agronomist, not a farmer standing in a field.

**Information fragmentation.** Weather data, commodity prices, government schemes, and pest alerts exist across dozens of disconnected sources. There is no unified intelligence layer that synthesizes this information for a specific farm's context.

---

## Our Solution

KrishiSahAI Advisory is a unified intelligence platform that addresses every dimension of this problem within a single, consistent interface.

The system provides farmers with a **conversational AI Business Advisor** that understands the farmer's land, capital, soil, and location to generate actionable multi-year strategies. A **CropCycle Planner** provides detailed phase-by-phase lifecycle management, from sowing and pre-planting through vegetative growth, flowering, and harvest, with specific actions tailored to the farmer's crop and soil conditions. It provides a **Precision Diagnostics suite** powered by a TensorFlow-based disease classifier and a YOLO v8-powered pest detector that operate directly on images captured by any smartphone camera. A **Waste-to-Value Engine** driven by a large language model identifies specific industrial and biological conversion pathways for the farmer's specific residue type. A **Farm Health Engine** provides AI-driven soil and crop health assessments with actionable interventions. A **multilingual voice interface** using OpenAI Whisper and gTTS ensures that neither literacy nor language is ever a barrier to access. A **Knowledge Hub** aggregates expert agricultural articles and resources for continuous learning.

The platform is built for India's farmers while being architecturally production-ready for enterprise and government deployment.

---

## Core Features

### CropCycle Planner (Home Dashboard)

Phase-by-phase lifecycle management for any crop.

The CropCycle Planner is the farmer's primary dashboard. It generates a detailed lifecycle roadmap for the farmer's selected crop, breaking the entire growing season into logical phases (Sowing, Vegetative Growth, Flowering & Fruiting, Harvest & Post-Harvest). Each phase includes critical focus areas, required actions with specific irrigation, fertilization, and pest control steps, and projected yield values. Quick-action buttons on each phase card allow farmers to jump directly to the AI Chatbot, Fertilizer Advisor, Disease/Pest Scanner, or Waste-to-Value Engine with pre-loaded context for that specific phase. Plans are cached in both Firestore and LocalStorage for instant loading on return visits.

---

### Business Advisory Engine

Contextual AI strategy generation grounded in the farmer's actual profile.

The engine accepts a comprehensive farmer profile, land size, soil type, water availability, capital, skills, market access, and risk preference, and generates a ranked list of viable agri-business ventures with projected ROI timelines. Each recommendation includes a detailed assessment and a full 10-year sustainability roadmap. The advisor maintains full conversational memory across sessions, allowing farmers to refine plans through dialogue. Responses are generated in the farmer's preferred language without any language blending.

---

### 10-Year Growth & Sustainability Roadmap

Long-term strategic planning for agri-business ventures.

Accessible from the Business Advisory module, the roadmap generator creates a detailed 10-year plan broken into annual phases with strategic focus areas, key actions, and expected profit projections in Indian Rupees. The roadmap includes dedicated sections for Labor & Aging Analysis, Sustainability & Succession Planning, Financial Resilience Strategy, and a Final Strategic Verdict. Server-side PDF generation via ReportLab produces professional-quality downloadable reports.

---

### Disease Detection System

Computer vision-based crop disease identification from a single photograph.

A multi-class convolutional neural network trained on the PlantVillage dataset classifies 38 distinct disease conditions across crops including tomatoes, apples, corn, and potatoes. The inference pipeline includes severity scoring based on model confidence, and a curated CSV database provides specific home remedies and chemical treatment protocols for each detected disease. Images are processed and discarded after inference to preserve user privacy and server disk space.

---

### Pest Detection Module

Real-time object detection for destructive agricultural pests.

Powered by YOLO v8, this module identifies common agricultural pests, including the Rice Leaf Roller, Brown Planthopper, and others, directly from field photographs. The model maps neural network integer outputs to a human-readable pest registry and returns a confidence score, a severity classification, and a contextual description. Like the disease pipeline, images are automatically discarded post-inference.

---

### AI Business Chatbot

A persistent, language-aware, streaming conversational advisor.

Built on LangChain with state managed through conversation buffer memory, the chatbot operates over both standard and Server-Sent Event streaming connections. It enforces language purity through system-level prompt engineering, a technique internally called the Iron Curtain strategy, ensuring Hindi and Marathi responses do not include English fallbacks. Conversation titles are AI-generated based on the session content, and sessions are identified by UUID for stateless server-side management. Chat history is persistently saved in Firestore with a dedicated sidebar for session management.

---

### Waste-to-Value Engine

Transforming post-harvest residue into identified revenue streams.

The engine accepts a crop type and language parameter and returns a structured analysis identifying viable conversion pathways: vermicomposting, briquette production for biofuel, paper pulp processing, or bioplastic pre-treatment. Each pathway includes technical basis, manufacturing options (DIY vs. third-party), equipment requirements, average recovery values, and action urgency assessment. The engine supports follow-up chat and streaming for extended advisory sessions on circular agriculture. Full analysis history is saved to Firestore for future reference.

---

### Farm Health Analysis

AI-driven soil and crop health assessment with actionable recommendations.

The Farm Health Engine accepts crop name, soil parameters, soil type, and farm location to generate a holistic health report with actionable interventions. It supports streaming chat for follow-up questions and adapts its recommendations based on the user's preferred language.

---

### Crop Care Hub

Unified entry point for plant health diagnostics.

The Crop Care Hub provides a streamlined interface for farmers to access both the Disease Detection and Pest Detection modules from a single page, with detection history tracking through a dedicated sidebar powered by Firestore.

---

### Weather Integration

Real-time meteorological intelligence tied to the farm's actual location.

The system connects to WeatherAPI to retrieve location-specific forecasts, pre-processing the nested JSON response into actionable parameters including rainfall probability, daily temperature extremes, and humidity. Weather data is displayed through a dedicated modal accessible from the header and is consumed by the chatbot to ensure recommendations account for current and forecasted conditions.

---

### Agriculture News & Article System

Personalized, crop-specific news aggregation with bookmarking.

The news service constructs targeted boolean queries combining crop names, district names, and economic keywords to filter out generic national news in favor of alerts directly relevant to the farmer's operation. The system uses a tiered fallback strategy to ensure results are always returned. Farmers can star/bookmark articles for later reference, with starred articles persisted in LocalStorage and accessible through a dedicated sidebar. Full article detail views with rich formatting are available.

---

### Knowledge Hub

Curated expert agricultural knowledge base.

The Knowledge Hub replaces the previous notification system with a centralized resource center for agricultural articles, guides, and expert insights. Accessible from the main navigation header and profile menu, it provides farmers with structured learning materials organized by topic.

---

### Multilingual Voice Interaction

Full speech-to-text and text-to-speech support across three languages.

Powered by OpenAI Whisper for transcription and gTTS for synthesis, the voice module supports English, Hindi, and Marathi across both input and output. Audio blobs are received as temporary files, transcribed, and deleted. The response is synthesized as an audio stream and returned for playback, enabling hands-free, screen-free access for farmers in the field.

---

### PDF Report Generation

Structured downloadable reports with full Unicode/Devanagari support.

Client-side PDF generation using jsPDF with a custom-loaded Hind font provides full Latin and Devanagari script rendering in a single document. PDF exports are available across three modules:

- **Chatbot**: Exports the complete conversation with styled user and AI message bubbles, dynamically calculated background rectangles, and proper text wrapping.
- **Waste-to-Value**: Exports the full analysis with section-wise formatting, green accent bars, and content blocks.
- **Business Advisory**: Exports the advisory plan including the 10-year roadmap with year-wise breakdowns.

Server-side PDF generation via ReportLab is available for the Roadmap module, producing professional-quality documents.

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React 19 + TypeScript + Vite)      │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │   Home   │ │ Chatbot  │ │ Advisory │ │  Waste   │            │
│  │ CropCycle│ │  (SSE)   │ │  Engine  │ │ ToValue  │            │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ Disease  │ │   Pest   │ │  Farm    │ │Knowledge │            │
│  │ Detector │ │ Detector │ │  Health  │ │   Hub    │            │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │  News    │ │ Planner  │ │ Roadmap  │ │  Profile │            │
│  │  Page    │ │          │ │          │ │  Editor  │            │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
│                                                                  │
│  Context: LanguageContext (EN/HI/MR) │ FarmContext (Active Farm) │
│  Styling: TailwindCSS  │  PDF: jsPDF + Hind Font (Unicode)      │
│  Icons: Lucide React   │  Markdown: react-markdown + remark-gfm │
└────────────────────────────┬─────────────────────────────────────┘
                             │ REST API + SSE Streams
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                     BACKEND (Flask + Python)                     │
│                                                                  │
│  ┌────────────────────┐  ┌────────────────────┐                  │
│  │  BusinessAdvisor   │  │   CropPlanner      │                  │
│  │  (LangChain +      │  │   (LangChain +     │                  │
│  │   Ollama/Gemini)   │  │    Ollama)          │                  │
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
│  └────────────────────┘  │    GNews)           │                  │
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
| React Router v7 | Client-side routing and navigation |
| Firebase SDK | Authentication (Google Sign-In) and Firestore data persistence |
| jsPDF | Client-side PDF generation with custom Unicode font support |
| Lucide React | Icon library |
| react-markdown + remark-gfm | Markdown rendering with GitHub Flavored Markdown |

### Backend

| Technology | Purpose |
|---|---|
| Flask 3 | REST API gateway with CORS and security headers |
| LangChain + langchain-ollama | LLM orchestration for advisory, planning, and analysis |
| Ollama | Local LLM inference (llama3.2) for privacy-preserving AI |
| TensorFlow | CNN-based crop disease classification (PlantVillage dataset) |
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
│       ├── Planner/                    # CropCycle lifecycle planner
│       ├── VoiceText/                  # Whisper STT + gTTS TTS
│       ├── WasteToValue/               # Agricultural waste conversion engine
│       ├── WeatherNewsIntegration/     # Weather API + GNews integration
│       └── pdfGeneration/              # Server-side PDF rendering (ReportLab)
│
├── Frontend/
│   ├── App.tsx                         # Root component with routing and header
│   ├── firebase.ts                     # Firebase client configuration
│   ├── pages/
│   │   ├── Home.tsx                    # CropCycle Planner dashboard
│   │   ├── Chatbot.tsx                 # AI conversational advisor
│   │   ├── BusinessAdvisory.tsx        # Business plan generator + assessment
│   │   ├── WasteToValue.tsx            # Waste analysis with chat follow-up
│   │   ├── FarmHealth.tsx              # Soil/crop health analysis
│   │   ├── CropCare.tsx                # Disease/pest detection hub
│   │   ├── DiseaseDetector.tsx         # Image-based disease scan
│   │   ├── PestDetector.tsx            # Image-based pest identification
│   │   ├── NewsPage.tsx                # Agriculture news with bookmarks
│   │   ├── ArticleDetail.tsx           # Full news article view
│   │   ├── KnowledgeHub.tsx            # Expert knowledge resource center
│   │   ├── Planner.tsx                 # Crop plan viewer
│   │   ├── Roadmap.tsx                 # 10-year roadmap viewer
│   │   ├── BusinessDetail.tsx          # Business recommendation detail view
│   │   └── EditProfile.tsx             # User/farm profile editor
│   ├── components/
│   │   ├── ChatLayout.tsx              # Shared chat UI wrapper
│   │   ├── ChatSidebar.tsx             # Chat session history sidebar
│   │   ├── AdvisorySidebar.tsx         # Advisory history sidebar
│   │   ├── PlanSidebar.tsx             # Crop plan selection sidebar
│   │   ├── DetectionHistorySidebar.tsx # Disease/pest scan history
│   │   ├── WeatherModal.tsx            # Weather forecast overlay
│   │   ├── DeleteConfirmationModal.tsx # Confirmation dialog component
│   │   ├── FeatureConfirmationModal.tsx# Feature access confirmation
│   │   ├── Home/                       # Home page sub-components
│   │   └── KnowledgeHub/              # Knowledge Hub sub-components
│   ├── src/
│   │   ├── context/
│   │   │   ├── LanguageContext.tsx      # i18n provider (EN/HI/MR)
│   │   │   └── FarmContext.tsx          # Active farm state provider
│   │   ├── locales/
│   │   │   ├── en.json                 # English translations
│   │   │   ├── hi.json                 # Hindi translations
│   │   │   └── mr.json                 # Marathi translations
│   │   ├── services/
│   │   │   └── api.ts                  # Centralized API client
│   │   ├── hooks/
│   │   │   └── useLoadingTips.ts       # Rotating loading tip hook
│   │   ├── utils/                      # Utility functions (localization, etc.)
│   │   └── articles/                   # Knowledge Hub article content
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

Language switching is instant and affects all UI labels (via JSON locale files), AI-generated content (via system prompt engineering), voice input/output, and PDF exports. The platform uses the Hind font family for PDF generation, which supports both Latin and Devanagari glyphs in a single typeface, ensuring exported documents correctly render text in any supported language.

---

## Scalability and Production Readiness

The API layer is fully stateless with respect to persistent data, session state is UUID-keyed in memory or persisted to Firestore. All services are independently deployable Python modules with no circular dependencies at the routing layer. CORS is environment-aware, enforcing strict origin whitelisting in production while permitting wildcard access during development. The Flask server is Talisman-compatible for HTTP security header enforcement in production. The frontend is Firebase Hosting-deployed as a static production bundle with environment-separated configuration.

The modular service architecture allows individual components, the disease detector, pest detector, business advisor, or any other module, to be extracted, containerized, and deployed as independent microservices without restructuring the API contract.

---

## Real-World Impact

**Economic.** By replacing intuition-based planting with data-driven strategy selection and lifecycle planning, the platform is estimated to increase farmer net income by 30–50% over a three-year horizon through better crop selection, reduced loss from disease and pest damage, and monetization of previously wasted residue.

**Social.** Multilingual voice interaction removes the literacy and language barriers that have historically excluded smallholder farmers from agri-tech adoption. The platform democratizes access to expert-level agricultural intelligence without requiring human intermediaries.

**Environmental.** The Waste-to-Value engine directly reduces agricultural waste burning, a major contributor to seasonal air quality deterioration in northern India. Promotion of organic treatments over chemical intervention supports long-term soil health.

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
