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

The platform transforms the farmhouse into a data-driven operation by generating strategic business roadmaps, diagnosing crop diseases through image recognition, detecting pests with real-time object detection, and converting agricultural waste into identified revenue streams. All capabilities are accessible in English, Hindi, and Marathi through both text and voice.

---

## Problem Statement

Indian agriculture sustains over 700 million people yet remains one of the most underserved sectors for technology adoption. Farmers face compounding, simultaneous challenges that no existing single tool addresses adequately:

**Lack of strategic guidance.** The majority of farmers plant based on tradition rather than market intelligence, soil science, or capital efficiency. The result is chronic income stagnation and susceptibility to price shocks.

**Delayed disease and pest response.** Crop loss due to undetected disease and pest infestation amounts to an estimated 15–25% of annual yield nationally. Laboratory diagnosis and expert consultation are geographically and financially inaccessible for most farmers.

**Wasted agricultural residue.** Post-harvest residue, stalks, husks, and stems, is routinely burned, contributing to air pollution and representing a destroyed secondary income source. Farmers lack the knowledge to convert this waste into compostable material, biofuel, or industrial inputs.

**Digital and literacy barriers.** Existing agri-tech platforms are English-first, text-heavy, and require reliable internet and modern hardware. They are built for an agronomist, not a farmer standing in a field.

**Information fragmentation.** Weather data, commodity prices, government schemes, and pest alerts exist across dozens of disconnected sources. There is no unified intelligence layer that synthesizes this information for a specific farm's context.

---

## Our Solution

KrishiSahAI Advisory is a unified intelligence platform that addresses every dimension of this problem within a single, consistent interface.

The system provides farmers with a **conversational AI Business Advisor** that understands the farmer's land, capital, soil, and location to generate actionable multi-year strategies. It provides a **Precision Diagnostics suite** powered by a TensorFlow-based disease classifier and a YOLO v8-powered pest detector that operate directly on images captured by any smartphone camera. A **Waste-to-Value Engine** driven by a large language model identifies specific industrial and biological conversion pathways for the farmer's specific residue type. A **multilingual voice interface** using OpenAI Whisper and gTTS ensures that neither literacy nor language is ever a barrier to access.

The platform is built for India's farmers while being architecturally production-ready for enterprise and government deployment.

---

## Core Features

### Business Advisory Engine

Contextual AI strategy generation grounded in the farmer's actual profile.

The engine accepts a comprehensive farmer profile, land size, soil type, water availability, capital, skills, market access, and risk preference, and generates a ranked list of viable agri-business ventures with projected ROI timelines. Each recommendation includes a multi-year strategic roadmap broken into four executable phases. The advisor maintains full conversational memory across sessions, allowing farmers to refine plans through dialogue. Responses are generated in the farmer's preferred language without any language blending.

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

Built on LangChain with state managed through conversation buffer memory, the chatbot operates over both standard and Server-Sent Event streaming connections. It enforces language purity through system-level prompt engineering, a technique internally called the Iron Curtain strategy, ensuring Hindi and Marathi responses do not include English fallbacks. Conversation titles are AI-generated based on the session content, and sessions are identified by UUID for stateless server-side management.

---

### Waste-to-Value Engine

Transforming post-harvest residue into identified revenue streams.

The engine accepts a crop type and language parameter and returns a structured analysis identifying viable conversion pathways: vermicomposting, briquette production for biofuel, paper pulp processing, or bioplastic pre-treatment. A value recovery percentage is computed based on market demand and technical complexity. The engine supports follow-up chat and streaming for extended advisory sessions on circular agriculture.

---

### Farm Health Analysis

AI-driven soil and crop health assessment with actionable recommendations.

The Farm Health Engine accepts crop name, soil parameters, soil type, and farm location to generate a holistic health report with actionable interventions. It supports streaming chat for follow-up questions and adapts its recommendations based on the user's preferred language.

---

### Weather Integration

Real-time meteorological intelligence tied to the farm's actual location.

The system connects to WeatherAPI to retrieve location-specific forecasts, pre-processing the nested JSON response into actionable parameters including rainfall probability, daily temperature extremes, and humidity. Weather context is consumed by both the notification engine and the business advisor to ensure recommendations account for the next 48-hour forecast.

---

### Agriculture News Integration

Personalized, crop-specific news aggregation using GNews.

The news service constructs targeted boolean queries combining crop names, district names, and economic keywords to filter out generic national news in favor of alerts directly relevant to the farmer's operation. The system uses a tiered fallback strategy to ensure results are always returned even when primary queries return insufficient results.

---

### Proactive Notification Engine

A background scheduler that generates AI-powered alerts without user initiation.

Running as a cron-scheduled APScheduler task every 30 minutes, the notification engine combines weather trigger rules, news keyword matching, and farmer profile data to generate contextual alerts. Trigger thresholds are deterministic, a predicted rainfall probability exceeding 70% triggers a high-priority weather alert regardless of LLM output, ensuring critical safety information is never silently suppressed.

---

### Multilingual Voice Interaction

Full speech-to-text and text-to-speech support across three languages.

Powered by OpenAI Whisper for transcription and gTTS for synthesis, the voice module supports English, Hindi, and Marathi across both input and output. Audio blobs are received as temporary files, transcribed, and deleted. The response is synthesized as an audio stream and returned for playback, enabling hands-free, screen-free access for farmers in the field.

---

### PDF Report Generation

Structured downloadable reports from advisory sessions.

Using ReportLab, the system can render completed advisory sessions, roadmaps, and analysis results as formatted PDF documents suitable for printing, offline retention, or sharing with agricultural extension officers.

---

## System Overview

KrishiSahAI is architected as a strict client-server system using a Separation of Concerns design. The React 19 + TypeScript frontend communicates exclusively through a centralized Flask REST API gateway. All AI inference, whether LangChain-based text generation, TensorFlow image classification, or YOLO object detection, executes within dedicated Python service modules on the backend. Firebase handles both authentication and structured data persistence via Firestore. Ollama provides low-latency, privacy-preserving local LLM execution, with Google Gemini available as a cloud fallback.

The complete technical architecture, module-level logic, database schema, API specification, and ML pipeline documentation are available in the detailed reference:

**[Read DETAIL.md](./DETAIL.md)**

---

## Scalability and Production Readiness

The API layer is fully stateless with respect to persistent data, session state is UUID-keyed in memory or persisted to Firestore. All services are independently deployable Python modules with no circular dependencies at the routing layer. CORS is environment-aware, enforcing strict origin whitelisting in production while permitting wildcard access during development. The Flask server is Talisman-compatible for HTTP security header enforcement in production. The frontend is Firebase Hosting-deployed as a static production bundle with environment-separated configuration.

The modular service architecture allows individual components, the disease detector, pest detector, business advisor, or any other module, to be extracted, containerized, and deployed as independent microservices without restructuring the API contract.

---

## Real-World Impact

**Economic.** By replacing intuition-based planting with data-driven strategy selection, the platform is estimated to increase farmer net income by 30–50% over a three-year horizon through better crop selection, reduced loss from disease and pest damage, and monetization of previously wasted residue.

**Social.** Multilingual voice interaction removes the literacy and language barriers that have historically excluded smallholder farmers from agri-tech adoption. The platform democratizes access to expert-level agricultural intelligence without requiring human intermediaries.

**Environmental.** The Waste-to-Value engine directly reduces agricultural waste burning, a major contributor to seasonal air quality deterioration in northern India. Promotion of organic treatments over chemical intervention supports long-term soil health.

**Market Opportunity.** With over 120 million farm holdings in India and government-backed agricultural digitization mandates, the platform addresses a market that is structurally underserved and politically prioritized. The architecture supports integration with national programs such as PM-KISAN and the Government e-Marketplace.

---

## Documentation

**Detailed Technical Documentation**
[Read DETAIL.md](./DETAIL.md)

**Installation and Setup Guide**
[Read INSTALLATION.md](./INSTALLATION.md)

---

## Contributing

Contributions are welcome. Please open an issue to discuss proposed changes before submitting a pull request. All contributions must maintain type safety on the frontend and must not introduce breaking changes to the public API contract documented in DETAIL.md.

---

## License

KrishiSahAI Advisory is released under the MIT License.
