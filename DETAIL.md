# KrishiSahAI Advisory: Detailed Technical Documentation

This document is the authoritative internal engineering reference for the KrishiSahAI Advisory platform. It covers system architecture, feature-level logic, API specifications, database schemas, AI/ML pipeline internals, security design, performance strategy, and the long-term product roadmap. It is intended for engineers, contributors, technical reviewers, and open-source maintainers.

---

## Table of Contents

1. [Vision and System Philosophy](#1-vision-and-system-philosophy)
2. [System Architecture](#2-system-architecture)
3. [Feature-by-Feature Technical Breakdown](#3-feature-by-feature-technical-breakdown)
4. [API Documentation](#4-api-documentation)
5. [Database Schema Documentation](#5-database-schema-documentation)
6. [AI and ML Documentation](#6-ai-and-ml-documentation)
7. [Security Architecture](#7-security-architecture)
8. [Performance Optimization Strategy](#8-performance-optimization-strategy)
9. [Scalability Strategy](#9-scalability-strategy)
10. [DevOps and Deployment Architecture](#10-devops-and-deployment-architecture)
11. [Risk Analysis and Mitigation](#11-risk-analysis-and-mitigation)
12. [Future Roadmap](#12-future-roadmap)

---

## 1. Vision and System Philosophy

### 1.1 Motivation

The agricultural sector employs over 42% of India's workforce yet accounts for only 17% of GDP, a disparity driven not by the impossibility of scale but by the information asymmetry between farmers and the markets, sciences, and technologies that could benefit them. Access to expert agricultural guidance, crop disease diagnostics, and strategic business planning has historically required either expensive consultants or proximity to government extension services, both scarce resources for the rural smallholder.

KrishiSahAI Advisory was conceived to eliminate that asymmetry by delivering expert-level intelligence directly to any farmer with a smartphone, in the farmer's own language, at zero marginal cost per query.

### 1.2 Design Philosophy

**Separation of Concerns at every layer.** The frontend is purely a presentation and interaction layer. All intelligence, inference, and data persistence happen in the backend. This ensures the system remains testable, replaceable, and scalable at each tier independently.

**Language as a first-class feature.** Multilingualism is not an afterthought localization layer. The LLM prompt engineering, voice pipeline, UI translation system, and API language parameters are designed together as a unified multilingual interface. English, Hindi, and Marathi are equally supported at the inference, synthesis, and display layers.

**Farmer-first UX.** Every design decision is evaluated against the question: does this serve a farmer with intermittent connectivity, limited screen time, and no technical background? This drives the preference for voice interaction, visual diagnostics, and concise streaming responses.

**Modularity over monolithism.** Each backend service, Business Advisor, Disease Detector, Pest Detector, Waste-to-Value, Farm Health, Voice, Weather, News, is an independently deployable Python module. The Flask application layer is an orchestration surface, not a logic repository.

**Integrity over convenience.** The system enforces deterministic safety rules in the notification engine that override LLM outputs when critical thresholds are crossed. AI is used to augment advice, not to replace non-negotiable safety decisions.

### 1.3 Long-Term Direction

The platform is designed to evolve from a farmer-facing advisory tool into a full agricultural intelligence operating system, capable of integrating IoT soil sensors, connecting to national Mandi price APIs, driving drone-based interventions, and serving as a foundation for government agricultural extension programs.

---

## 2. System Architecture

### 2.1 Frontend Architecture

**Runtime:** React 19 with TypeScript, bundled via Vite.

**Structure:**
```
Frontend/
  src/
    components/       # Shared UI primitives
    contexts/         # ThemeContext, FarmContext, LanguageContext
    hooks/            # useLanguage, useTheme, useFarm
    pages/            # Route-level page components
    services/         # api.ts, centralized HTTP + SSE client
  components/         # Feature-level components (ChatSidebar, etc.)
  firebase.ts         # Firebase SDK initialization
  App.tsx             # Root router, auth state, global layout
```

**State Management:** Context API is used for global state (theme, language, active farm). Local component state manages form inputs, loading flags, and transient UI data. No external state library (Redux/Zustand) is used, the current scale does not warrant the overhead.

**Routing:** React Router v6 with route-level lazy loading. Authentication guards redirect unauthenticated users to the login page before reaching any feature route.

**API Client (`api.ts`):** All backend communication is routed through a single centralized module. It exposes `get`, `post`, `postMultipart`, `stream`, and feature-specific methods. Every call retrieves a fresh Firebase ID token from `auth.currentUser.getIdToken(true)` and attaches it as a Bearer token header. The `stream` method implements a custom SSE reader using the Fetch API's `ReadableStream` interface, decoding chunked Server-Sent Event payloads and invoking an `onChunk` callback for each received token, producing a real-time "typing" effect for LLM responses.

**Internationalization:** A `useLanguage` hook backed by a locale file system provides translated strings for every UI label. Locale keys are structured by feature and component. All feature pages and shared components use this hook; hardcoded English strings are not permitted in the component tree.

**Firebase Client Integration:** Firebase Authentication manages token lifecycle. `onAuthStateChanged` in `App.tsx` synchronizes authentication state. Firestore `onSnapshot` listeners maintain real-time profile synchronization without requiring explicit fetch calls after mutation.

### 2.2 Backend Architecture

**Runtime:** Python 3.10+, Flask 3.x.

**Entry Point:** `Backend/app.py`, initializes Firebase Admin SDK, configures CORS and APScheduler, registers all API route handlers, and defines lazy-loading wrappers for ML models.

**Service Module Pattern:**
```
Backend/
  app.py                        # Flask entry point, route registry
  middleware/
    auth.py                     # Firebase token verification decorator
  services/
    BusinessAdvisor/            # LangChain-based chatbot and advisor
    DiseaseDetector/            # TensorFlow CNN inference
    PestDetector/               # YOLO v8 inference + class mapping
    WasteToValue/src/           # LLM-driven residue analysis
    FarmHealth/src/             # Soil and crop health advisory
    FiveToTenYear/              # Multi-year roadmap generator
    Planner/                    # Crop-specific phased planner
    NotificationService/        # Background alert generation
    WeatherNewsIntegration/     # Weather and news API clients
    VoiceText/                  # Whisper STT + gTTS TTS
    pdfGeneration/              # ReportLab PDF rendering
  uploads/                      # Temporary image storage (auto-cleaned)
```

**Lazy Model Loading:** Both the disease model (`plant_disease_model.h5`) and the pest model (YOLO weights) are loaded only on the first inference request, not at server startup. This keeps boot time low and avoids memory allocation for models that may not be used in a given session.

**Scheduler:** APScheduler runs the notification generation job every 30 minutes. The scheduler is initialized before routes are registered and operates within the Flask application context.

### 2.3 Database Architecture

**Primary Database:** Google Cloud Firestore (document-oriented NoSQL).

**Secondary Persistence:** In-memory session dictionary (`advisor_sessions`) for Business Advisor conversational state, keyed by UUID session identifiers. Sessions are ephemeral and do not survive server restarts.

**No relational database is used.** The document model suits the highly variable farmer profile schema and the nested notification data structures without requiring schema migrations.

### 2.4 AI/ML Pipeline Overview

```
User Input (image / text / audio)
        |
        v
  Frontend (React)
        |
        v
  Flask API Gateway (app.py)
        |
        |--- Image ---> DiseaseDetector (TF CNN) ---> result JSON
        |--- Image ---> PestDetector (YOLO v8) -----> result JSON
        |--- Text  ---> BusinessAdvisor (LangChain + Ollama) --> stream / JSON
        |--- Text  ---> WasteToValue (Ollama JSON mode) -------> result JSON
        |--- Audio ---> VoiceText (Whisper STT) ----------------> transcript
        |--- Text  ---> VoiceText (gTTS TTS) -------------------> audio stream
        v
  Firebase Firestore (profile reads / notification writes)
```

### 2.5 Authentication Flow

1. User authenticates via Firebase Authentication (email/password or Google OAuth) on the React frontend.
2. Firebase issues a JWT ID token, automatically refreshed every hour by the client SDK.
3. All API requests from `api.ts` attach `Authorization: Bearer <token>` headers.
4. The `@require_auth` decorator in `middleware/auth.py` calls `firebase_admin.auth.verify_id_token(token)` on every protected endpoint.
5. Verified token claims are attached to `request.user` for downstream use (e.g., extracting `uid` for Firestore writes).
6. In development mode (`FLASK_ENV=development`), auth can be bypassed via the `DISABLE_AUTH=true` environment variable.

### 2.6 Request Lifecycle

```
Client Request
  -> CORS preflight check (Flask-CORS)
  -> @require_auth decorator (token verification)
  -> Route handler invoked
      -> Input validation
      -> Service module call (lazy model load if first call)
      -> Response construction (JSON / SSE stream)
  -> Response returned to client
  -> Temporary files deleted (images, audio)
```

### 2.7 Error Handling Flow

All route handlers wrap service calls in `try/except` blocks. Errors are logged to stdout with a service prefix tag (e.g., `[ADVISOR]`, `[PEST]`, `[SCAN]`) and a full traceback is printed for debug visibility. HTTP error responses use appropriate status codes: 400 for missing/invalid input, 401 for auth failures, 404 for invalid session IDs, 503 for unavailable service modules, and 500 for unexpected internal errors.

---

## 3. Feature-by-Feature Technical Breakdown

### 3.1 Business Advisory Engine

**Objective:** Generate ranked agri-business recommendations and multi-year strategic roadmaps based on a farmer's profile, then maintain a conversational advisory session in the farmer's preferred language.

**User Journey:**
1. Farmer completes onboarding profile (land, soil, water, capital, skills, goals).
2. System initializes an advisory session via `POST /api/business-advisor/init`.
3. Backend constructs a `FarmerProfile` Pydantic model from request data.
4. `KrishiSahAIAdvisor` instance is created, assigned a UUID session ID, and stored in the in-memory `advisor_sessions` dictionary.
5. `generate_recommendations()` is called to produce a JSON-structured list of business options.
6. Farmer selects a business and engages in streaming chat via `POST /api/business-advisor/chat/stream`.
7. AI responses stream back token-by-token via SSE.

**Backend Logic (`krishi_chatbot.py`):**

- `FarmerProfile`: A Pydantic model capturing 30+ fields including `land_size`, `soil_type`, `water_availability`, `capital`, `risk_level`, `experience_years`, `crops_grown`, `state`, `district`, `interests`, `main_goal`, and language preference.
- `to_context()`: Serializes the profile into a high-entropy natural language string used as the system context for LLM sessions.
- `KrishiSahAIAdvisor`: Wraps a `ChatOllama` LangChain chain with `MessagesPlaceholder` for multi-turn memory. Implements `chat()` for synchronous response, `stream_chat()` for token-by-token SSE generation, and `generate_title()` for session titling.
- Iron Curtain prompting: System prompts explicitly prohibit language fallback, enforce the response language, and frame the AI persona as an expert Indian agricultural business consultant.

**Data Flow:**
```
POST /api/business-advisor/init
  -> FarmerProfile constructed from request.json
  -> KrishiSahAIAdvisor(profile) instantiated
  -> generate_recommendations() -> Ollama (JSON mode) -> ranked list
  -> session_id (UUID) returned with recommendations

POST /api/business-advisor/chat/stream
  -> session_id lookup in advisor_sessions
  -> stream_chat(message) -> LangChain -> Ollama stream
  -> SSE: data: {"chunk": "..."} \n\n per token
  -> SSE: data: [DONE] \n\n on completion
```

**Edge Cases:**
- Invalid or expired `session_id`: Returns 404 with descriptive error.
- Ollama unavailable: `generate_recommendations()` falls back to `_get_fallback_recommendations()` which returns a hardcoded high-value business list.
- Missing profile fields: All `FarmerProfile` fields have sensible defaults; the `safe_float()` utility handles malformed numeric inputs.

**Security:** Every endpoint decorated with `@require_auth`. Session IDs are UUIDs, not sequentially guessable. Sessions in the in-memory dictionary are isolated per user by UUID.

**Performance:** Ollama runs locally, eliminating network latency for LLM inference. SSE streaming begins returning tokens within milliseconds of the model starting generation, providing perceived responsiveness even on slow connections.

**Future Enhancements:** Persistent session storage in Firestore; session resumption across server restarts; integration with Mandi price APIs to ground financial projections in real market data.

---

### 3.2 Disease Detection System

**Objective:** Classify plant diseases from uploaded leaf images and return treatment protocols.

**User Journey:**
1. Farmer opens the Disease Detector page and uploads or captures a leaf photograph.
2. Frontend sends the image as multipart form data to `POST /api/disease/detect`.
3. Backend saves the image to `uploads/`, runs inference, deletes the file, and returns a structured result.
4. Frontend displays the detected disease, severity level, confidence percentage, and treatment steps.

**Backend Logic (`disease_detector.py`):**

- **Model:** Multi-layer Convolutional Neural Network (CNN) trained on the PlantVillage dataset. Saved as `plant_disease_model.h5`.
- **Class List:** 38 classes covering Apple (Scab, Black Rot, Cedar Apple Rust, Health), Blueberry (Healthy), Cherry (Powdery Mildew, Healthy), Corn (Cercospora Leaf Spot, Common Rust, Northern Leaf Blight, Healthy), Grape (Black Rot, Esca, Leaf Blight, Healthy), Orange (Haunglongbing), Peach (Bacterial Spot, Healthy), Pepper (Bacterial Spot, Healthy), Potato (Early Blight, Late Blight, Healthy), Raspberry (Healthy), Soybean (Healthy), Squash (Powdery Mildew), Strawberry (Leaf Scorch, Healthy), Tomato (Bacterial Spot, Early Blight, Late Blight, Leaf Mold, Septoria Leaf Spot, Spider Mites, Target Spot, Yellow Leaf Curl Virus, Mosaic Virus, Healthy).
- **Preprocessing:** Image resized to model input dimensions, normalized to [0, 1] float range, expanded to batch dimension.
- **Inference:** `model.predict()` returns softmax probabilities across 38 classes. The argmax index maps to the class name.
- **Severity Algorithm:** Confidence > 0.80 → "high"; 0.50–0.80 → "medium"; < 0.50 → "low".
- **Treatment Lookup:** `crop_disease_data.csv` is joined on (crop, disease) to retrieve `Pathogen`, `Home Remedy`, and `Chemical Recommendation` columns.

**API Endpoint:** `POST /api/disease/detect` (multipart/form-data, field: `image`)

**Response Structure:**
```json
{
  "success": true,
  "result": {
    "crop": "Tomato",
    "disease": "Late Blight",
    "severity": "high",
    "confidence": 0.934,
    "treatment": ["Remove affected leaves", "Chemical: Mancozeb 75 WP"],
    "pathogen": "Phytophthora infestans"
  }
}
```

**Edge Cases:**
- Non-image file type: Rejected at `allowed_file()` check before saving.
- File exceeds 16MB: Rejected by `MAX_CONTENT_LENGTH` Flask config.
- Model returns low-confidence results for non-plant images: Confidence score is surfaced to the frontend, which displays appropriate uncertainty messaging.

---

### 3.3 Pest Detection Module

**Objective:** Detect and identify agricultural pests in field photographs using real-time object detection.

**User Journey:**
1. Farmer uploads a photograph from the field.
2. Image is sent to `POST /api/pest/detect`.
3. YOLO v8 runs detection and returns the highest-confidence detection with pest identity, confidence, and severity.
4. Frontend displays the pest name, severity badge, and remediation description.

**Backend Logic (`pest_detector.py`):**

- **Model:** YOLOv8 via the Ultralytics library. Weights file loaded on first request.
- **Class Mapping:** `classes.txt` maps integer output indices to pest common names (e.g., Rice Leaf Roller, Brown Planthopper, Aphids, Whitefly, etc.).
- **Inference:** `model(image_path)` returns a `Results` object. The detection with the highest confidence score is selected. If no detection meets a minimum threshold, a "Not Detected" result is returned.
- **Severity Assignment:** Mirrors the disease detector's confidence-based threshold logic.

**Edge Cases:**
- YOLO dependency import failure: `pest_predict` is set to `None` and the endpoint returns 503 with a descriptive message.
- Empty results (no pest detected above threshold): Returns a graceful "No pest detected" response rather than an error.

---

### 3.4 AI Business Chatbot

**Objective:** Maintain a persistent, language-consistent, streaming conversational session within the context of a selected agri-business.

This is documented as part of the Business Advisory Engine (Section 3.1). The chat interface, including standard JSON response (`/api/business-advisor/chat`) and SSE streaming (`/api/business-advisor/chat/stream`), is fully described there.

Additional capability: `POST /api/chat/generate-title`, invokes the advisor's `generate_title()` method to produce a descriptive session name based on the conversation history. This is used by the frontend `ChatSidebar` to display meaningful session labels in the conversation history list.

---

### 3.5 Waste-to-Value Engine

**Objective:** Identify commercially viable and ecologically sound conversion pathways for post-harvest agricultural residue.

**User Journey:**
1. Farmer selects a crop from their profile or inputs a crop name.
2. Frontend sends `POST /api/waste-to-value/analyze` with crop name and language.
3. LLM returns a structured JSON analysis identifying conversion pathways, estimated value recovery, and a conclusion.
4. Farmer can ask follow-up questions via `/api/waste-to-value/chat/stream`.

**Backend Logic (`waste_service.py`):**

- `WasteToValueEngine`: Wraps an Ollama-backed LangChain chain configured for JSON-mode output.
- `analyze_waste(crop, language)`: Constructs a prompt requesting structured pathway analysis. Response fields include `pathways` (array of named conversion methods), `value_recovery_percentage`, and `conclusion`.
- `chat_waste(context, question, language)`: Standard synchronous follow-up chat using pre-loaded analysis as context.
- `stream_chat_waste(context, question, language)`: SSE streaming variant.

**Conversion Pathways Identified:**
- Vermicomposting / direct composting (Bio-input)
- Briquette production for biofuel (Energy)
- Shredding and drying for paper pulp or bioplastic pre-treatment (Industrial)
- Biogas digester feedstock (Energy)
- Animal feed processing where applicable

---

### 3.6 Farm Health Analysis

**Objective:** Provide a soil and crop health assessment with specific intervention recommendations.

**Backend Logic (`health_service.py`):**

- `FarmHealthEngine`: Accepts `crop`, `soil_data` (dictionary of measured parameters), `location`, `soil_type`, and `language`.
- Constructs a comprehensive prompt embedding the soil parameters, crop requirements, and regional climate context.
- Returns a structured health report covering deficiency identification, fertilizer recommendations, irrigation advice, and intervention timing.
- Streaming chat via `POST /api/farm-health/chat/stream` supports follow-up questions.

---

### 3.7 Strategic Roadmap Generator (5–10 Year)

**Objective:** Generate a phased multi-year strategic roadmap for a selected agri-business.

**Backend Logic (`roadmap_service.py`, `SustainabilityRoadmapGenerator`):**

- Accepts `business_name`, `user_id`, and `language`.
- Uses Ollama/Gemini to generate a 4-phase roadmap with each phase containing a title, timeline, goals, required actions, investment estimate, and expected outcome.
- Roadmap is returned as a structured JSON object.
- Results are persisted to Firestore under the user's document to avoid regeneration on reload.

**Endpoint:** `POST /api/generate-roadmap`

---

### 3.8 Crop Planner

**Objective:** Generate a crop-specific phased cultivation plan.

**Backend Logic (`planner_service.py`, `CropPlannerGenerator`):**

- Accepts `crop_name`, `user_id`, and `language`.
- Checks Firestore for an existing plan (`users/{uid}/crop_plans/{crop}_{lang}`) before generating a new one.
- If no cached plan exists, invokes the LLM to generate a 4-phase plan and writes it to Firestore.
- Subsequent requests for the same crop and language are served from Firestore without LLM invocation.

**Endpoint:** `POST /api/generate-crop-roadmap`

---

### 3.9 Notification Engine

**Objective:** Proactively generate AI-driven alerts for active users without requiring user-initiated requests.

**Backend Logic (`notification_engine.py`):**

- Scheduled via APScheduler: `@scheduler.task('interval', id='generate_notifications_job', minutes=30)`.
- Iterates over up to 20 active Firestore user documents per cycle.
- For each user: retrieves profile → fetches weather for farm location → fetches relevant news → constructs a context string → LLM generates notification text.
- Deterministic trigger rules applied before LLM:
  - `rain_probability > 70%` → mandatory high-priority weather alert.
  - News keyword match for user's crop within user's district → mandatory information alert.
- Notifications are written to `users/{uid}/notifications` in Firestore.
- Frontend reads notifications via `GET /api/notifications` and displays them with priority indicators.

---

### 3.10 Weather and News Integration

**Weather Service (`weather_service.py`):**
- HTTP client: `httpx` with timeout control.
- API: `weatherapi.com`, authenticated via `WEATHER_API_KEY`.
- Endpoint used: `forecast.json` with location and days parameters.
- Response flattening: extracts `max_temp_c`, `min_temp_c`, `avg_humidity`, `daily_chance_of_rain`, `condition.text` into a clean dictionary.
- Farm location is used as the primary location parameter, overriding any device-detected location.

**News Service (`news_service.py`):**
- API: GNews, authenticated via `GNEWS_API_KEY`.
- Query construction: `(crop1 OR crop2) AND (district) AND (agriculture OR farming OR price OR mandi OR scheme)`.
- Tiered fallback: If the compound query returns fewer than 3 results, the service retries with a simpler crop-only query, then a category-only query.
- Results are filtered for recency and deduplicated by URL before returning.

---

### 3.11 Voice Interaction System

**Speech-to-Text (`voice_service.py`, Whisper):**
- Audio blob received at `POST /api/voice/stt` as multipart file.
- Saved as a temporary `.wav` file in `uploads/audio/`.
- `whisper.load_model("base").transcribe(path)` returns the transcript.
- Temporary file deleted immediately after transcription.
- Transcript returned as JSON.

**Text-to-Speech (`voice_service.py`, gTTS):**
- Text and language code received at `POST /api/voice/tts`.
- `gTTS(text=text, lang=lang_code)` generates an MP3 audio stream.
- Audio is returned as a binary stream with `Content-Type: audio/mpeg`.
- Language codes: `en` (English), `hi` (Hindi), `mr` (Marathi).

---

### 3.12 PDF Report Generation

**Backend Logic (`pdfGeneration/`):**
- Uses ReportLab to render structured PDF documents from advisory session data.
- Supports Markdown-to-PDF conversion via the `markdown` library for rich text formatting.
- Reports include section headers, formatted tables for financial projections, and footer metadata.
- Endpoint: `POST /api/generate-pdf` (authenticated).

---

## 4. API Documentation

### 4.1 Health Check

**Route:** `GET /api/health`  
**Auth:** Not required  
**Response:**
```json
{
  "status": "online",
  "gpu": { "available": false, "count": 0 },
  "ollama": { "status": "connected", "url": "http://localhost:11434" },
  "memory": "6.42 GB available"
}
```

---

### 4.2 Disease Detection

**Route:** `POST /api/disease/detect`  
**Auth:** Required  
**Content-Type:** `multipart/form-data`  
**Request Field:** `image` (file, PNG, JPG, JPEG, GIF, BMP; max 16MB)

**Success Response (200):**
```json
{
  "success": true,
  "result": {
    "crop": "Tomato",
    "disease": "Early Blight",
    "severity": "medium",
    "confidence": 0.823,
    "treatment": ["Remove affected leaves immediately", "Chemical: Chlorothalonil 75 WP @ 2g/L"],
    "pathogen": "Alternaria solani"
  }
}
```

**Error Responses:**
- `400`, No image provided / invalid file type
- `401`, Unauthorized
- `500`, Internal inference error

---

### 4.3 Pest Detection

**Route:** `POST /api/pest/detect`  
**Auth:** Required  
**Content-Type:** `multipart/form-data`  
**Request Field:** `image` (file)

**Success Response (200):**
```json
{
  "success": true,
  "result": {
    "pest_name": "Brown Planthopper",
    "confidence": 0.912,
    "severity": "high",
    "description": "Highly destructive rice pest. Apply systemic insecticide immediately."
  }
}
```

**Error Responses:** `400`, `401`, `503` (service unavailable), `500`

---

### 4.4 Business Advisor: Initialize Session

**Route:** `POST /api/business-advisor/init`  
**Auth:** Required  
**Content-Type:** `application/json`

**Request Body:**
```json
{
  "name": "Ramesh Patil",
  "land_size": 5.0,
  "land_unit": "acres",
  "capital": 150000,
  "soil_type": "Black Cotton Soil",
  "water_availability": "canal",
  "crops_grown": ["Soybean", "Cotton"],
  "state": "Maharashtra",
  "district": "Nagpur",
  "risk_level": "medium",
  "language": "marathi",
  "main_goal": "increase income"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "session_id": "a3f8d2c1-...",
  "recommendations": [
    { "name": "Floriculture, Gerbera", "roi_estimate": "High", "timeline": "8 months" },
    { "name": "Dairy Farming", "roi_estimate": "Medium", "timeline": "12 months" }
  ],
  "message": "Business advisor initialized successfully"
}
```

---

### 4.5 Business Advisor: Streaming Chat

**Route:** `POST /api/business-advisor/chat/stream`  
**Auth:** Required  
**Content-Type:** `application/json`

**Request Body:**
```json
{
  "session_id": "a3f8d2c1-...",
  "message": "What is the initial investment for Gerbera farming?",
  "language": "marathi"
}
```

**Response:** `text/event-stream`  
```
data: {"chunk": "गेर"}\n\n
data: {"chunk": "बेरा"}\n\n
data: {"chunk": " शेतीसाठी"}\n\n
...
data: [DONE]\n\n
```

---

### 4.6 Business Advisor: Generate Chat Title

**Route:** `POST /api/chat/generate-title`  
**Auth:** Required

**Request Body:** `{ "session_id": "a3f8d2c1-..." }`

**Response:** `{ "success": true, "title": "Gerbera Floriculture Strategy" }`

---

### 4.7 Integrated Advisory (Disease + Advisor)

**Route:** `POST /api/business-advisor/integrated-advice`  
**Auth:** Required

**Request Body:**
```json
{
  "session_id": "a3f8d2c1-...",
  "disease_result": {
    "crop": "Tomato",
    "disease": "Late Blight",
    "severity": "high"
  },
  "language": "hindi"
}
```

**Response:** AI-generated advisory combining disease context with the farmer's financial and crop profile.

---

### 4.8 Waste-to-Value: Analyze

**Route:** `POST /api/waste-to-value/analyze`  
**Auth:** Required

**Request Body:** `{ "crop": "Rice", "language": "English" }`

**Response:**
```json
{
  "success": true,
  "result": {
    "pathways": [
      { "name": "Briquette Production", "description": "...", "complexity": "medium" },
      { "name": "Vermicomposting", "description": "...", "complexity": "low" }
    ],
    "value_recovery_percentage": 68,
    "conclusion": { "title": "Rice Straw, High Value Potential", "summary": "..." }
  }
}
```

---

### 4.9 Waste-to-Value: Streaming Chat

**Route:** `POST /api/waste-to-value/chat/stream`  
**Auth:** Required

**Request Body:** `{ "context": "<analysis JSON>", "question": "How do I start briquette making?", "language": "English" }`

**Response:** `text/event-stream` (same SSE format as business advisor)

---

### 4.10 Farm Health: Analyze

**Route:** `POST /api/farm-health/analyze`  
**Auth:** Required

**Request Body:**
```json
{
  "crop": "Wheat",
  "location": "Nashik, Maharashtra",
  "soil_type": "Loamy",
  "soil_data": { "nitrogen": "low", "phosphorus": "medium", "ph": 6.8 },
  "language": "English"
}
```

---

### 4.11 Strategic Roadmap

**Route:** `POST /api/generate-roadmap`  
**Auth:** Required

**Request Body:** `{ "business_name": "Gerbera Floriculture", "language": "en" }`

**Response:**
```json
{
  "success": true,
  "roadmap": {
    "overview": "...",
    "phases": [
      { "phase": 1, "title": "Setup and Planting", "duration": "3 months", "goals": [...], "investment": "INR 80,000" },
      { "phase": 2, "title": "First Harvest and Market Entry", "duration": "5 months", ... }
    ]
  }
}
```

---

### 4.12 Crop Roadmap

**Route:** `POST /api/generate-crop-roadmap`  
**Auth:** Required

**Request Body:** `{ "crop_name": "Soybean", "language": "en" }`

**Response:** Same structure as `/api/generate-roadmap`.

---

### 4.13 Notifications

**Route:** `GET /api/notifications`  
**Auth:** Required

**Response:**
```json
{
  "success": true,
  "notifications": [
    {
      "id": "notif_001",
      "type": "weather",
      "priority": "high",
      "title": "Heavy Rain Alert",
      "message": "70% chance of heavy rainfall in Nagpur tomorrow.",
      "created_at": "2026-02-23T08:00:00Z"
    }
  ]
}
```

---

### 4.14 Voice: Speech to Text

**Route:** `POST /api/voice/stt`  
**Auth:** Required  
**Content-Type:** `multipart/form-data`  
**Request Field:** `audio` (WAV file)

**Response:** `{ "success": true, "transcript": "माझ्या शेतात कोणता रोग आहे?" }`

---

### 4.15 Voice: Text to Speech

**Route:** `POST /api/voice/tts`  
**Auth:** Required

**Request Body:** `{ "text": "आपल्या शेतासाठी गेरबेरा सर्वात उत्तम आहे.", "language": "mr" }`

**Response:** Binary audio stream (`audio/mpeg`)

---

### 4.16 Weather

**Route:** `GET /api/weather/current?location=<location>`  
**Auth:** Required

**Response:**
```json
{
  "location": "Nagpur, Maharashtra",
  "temperature_c": 32,
  "humidity_percent": 68,
  "rain_probability": 45,
  "condition": "Partly cloudy"
}
```

---

## 5. Database Schema Documentation

### 5.1 Collection: `users`

**Document ID:** Firebase UID (string)

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Farmer full name |
| `email` | string | Firebase auth email |
| `land_size` | number | Cultivable land area |
| `land_unit` | string | "acres" or "hectares" |
| `capital` | number | Available investment capital (INR) |
| `soil_type` | string | e.g., "Black Cotton Soil", "Loamy" |
| `water_availability` | string | e.g., "canal", "borewell", "rain-fed" |
| `crops_grown` | array[string] | List of crops currently cultivated |
| `state` | string | Indian state |
| `district` | string | District name |
| `village` | string | Village name |
| `risk_level` | string | "low", "medium", "high" |
| `market_access` | string | "local", "moderate", "export" |
| `experience_years` | number | Farming experience |
| `language` | string | "english", "hindi", "marathi" |
| `skills` | array[string] | Relevant skills |
| `main_goal` | string | Primary farming objective |
| `interests` | array[string] | Secondary interests |
| `farm_name` | string | Name of the farm operation |
| `total_land` | number | Total land including non-cultivable |
| `created_at` | timestamp | Account creation time |
| `updated_at` | timestamp | Last profile update |

---

### 5.2 Subcollection: `users/{uid}/notifications`

**Document ID:** Auto-generated

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | "weather", "disease", "news", "general" |
| `priority` | string | "high", "medium", "low" |
| `title` | string | Short alert title |
| `message` | string | Full notification body |
| `crop_context` | string | Crop triggering the notification |
| `is_read` | boolean | Read status |
| `created_at` | timestamp | Generation time |

---

### 5.3 Subcollection: `users/{uid}/crop_plans`

**Document ID:** `{crop_name}_{language}` (e.g., `Soybean_en`)

| Field | Type | Description |
|-------|------|-------------|
| `roadmap` | map | Full phased roadmap object |
| `created_at` | timestamp | Generation time |

**Indexing Strategy:** Document IDs are deterministic compound keys, enabling O(1) lookup without collection queries.

---

### 5.4 Optimization Notes

- **No relational joins required.** All data for a user is co-located under `users/{uid}`, minimizing read operations.
- **Denormalized reads.** Profile data is read once per session and passed as context to LLM calls, no repeated Firestore reads during a session.
- **Caching at the subcollection level.** Crop plans are cached in Firestore, converting a ~5-second LLM inference call into a ~100ms Firestore document read on repeat access.

---

## 6. AI and ML Documentation

### 6.1 Disease Detection Model

| Attribute | Value |
|-----------|-------|
| **Architecture** | Convolutional Neural Network (CNN) |
| **Framework** | TensorFlow 2.x / Keras |
| **Dataset** | PlantVillage (publicly available) |
| **Classes** | 38 (disease + crop combinations) |
| **Input Shape** | 224 × 224 × 3 (RGB) |
| **Output** | Softmax probability vector (38 dimensions) |
| **Model File** | `plant_disease_model.h5` |
| **Loading** | Lazy, first inference request |

**Preprocessing Pipeline:**
1. Load image from disk using PIL.
2. Resize to 224 × 224.
3. Convert to NumPy array of float32.
4. Normalize pixel values to [0.0, 1.0].
5. Expand dimensions to create batch axis: shape becomes `(1, 224, 224, 3)`.

**Accuracy:** Trained to high accuracy on PlantVillage validation set. Specific metrics vary by class; commonly reported top-1 accuracy is 96–98% on validation data under controlled imaging conditions.

**Limitations:**
- Performance degrades on images with poor lighting, motion blur, or significant background noise.
- Classes are limited to the PlantVillage training set, diseases not in the training distribution will be misclassified.
- Does not account for mixed infections (multiple diseases simultaneously).

---

### 6.2 Pest Detection Model

| Attribute | Value |
|-----------|-------|
| **Architecture** | YOLOv8 (You Only Look Once, version 8) |
| **Framework** | Ultralytics |
| **Dataset** | Custom agricultural pest dataset |
| **Task** | Object detection |
| **Class File** | `classes.txt` |
| **Loading** | Lazy, first inference request |

**Inference Pipeline:**
1. Image received and saved to `uploads/`.
2. `model(image_path)` invokes YOLOv8 inference.
3. `Results` object iterated for detections above confidence threshold (default: 0.40).
4. Highest-confidence detection selected as primary result.
5. Integer class index mapped to pest name via `classes.txt`.

**Performance Characteristics:** YOLO v8 is optimized for real-time inference. On CPU, a typical inference run completes in 200–600ms depending on hardware.

---

### 6.3 Language Model Integration

**Primary Runtime:** Ollama (local)  
**Default Model:** `llama3.2`  
**Fallback:** Google Gemini API (cloud)  
**Framework:** LangChain

**LangChain Components Used:**
- `ChatOllama`: Chat model wrapper for local Ollama inference.
- `ChatPromptTemplate` with `MessagesPlaceholder`: Structures system prompt + conversation history + user message.
- `StrOutputParser`: Converts LangChain message objects to plain strings.
- `RunnableWithMessageHistory` (conceptually equivalent): Conversation buffer memory maintained as a list of messages.

**Prompt Engineering Strategy:**
- System prompt establishes the AI persona, language constraints, and domain scope.
- Iron Curtain language rule: explicit instruction that responses must be exclusively in the specified Indian language with no English fallback.
- Few-shot examples embedded in the system prompt for recommendation JSON format.
- Temperature and top-p parameters tuned for advisory (low creativity, high precision).

**JSON Mode:** Waste-to-Value and recommendation generation prompts explicitly request JSON output and provide the expected schema in the prompt to maximize structured output reliability.

---

### 6.4 Voice AI Pipeline

**Speech-to-Text:**
- Engine: OpenAI Whisper (`base` model)
- Languages supported: all Whisper-supported languages (including Hindi and Marathi)
- Inference: CPU-based; `base` model provides the best balance of speed and accuracy

**Text-to-Speech:**
- Engine: gTTS (Google Text-to-Speech)
- Output: MP3 audio
- Language codes: `en`, `hi`, `mr`
- Limitation: gTTS requires internet connectivity (calls Google's TTS API). Coqui TTS (`COQUI_TTS_PATH` env var) is configured as an optional offline alternative.

---

## 7. Security Architecture

### 7.1 Authentication

- **Mechanism:** Firebase Authentication JWT ID tokens.
- **Token Lifespan:** 1 hour; auto-refreshed by Firebase Client SDK.
- **Backend Verification:** `firebase_admin.auth.verify_id_token()` on every protected endpoint.
- **Development Bypass:** `DISABLE_AUTH=true` environment variable skips verification in development mode only. This flag must never be set in production.

### 7.2 Input Validation

- File uploads: Extension whitelist (`png`, `jpg`, `jpeg`, `gif`, `bmp`) enforced before any file write.
- File size: Hard limit of 16MB via `MAX_CONTENT_LENGTH`.
- Filename sanitization: `werkzeug.utils.secure_filename()` strips path traversal characters.
- JSON body: Required fields validated before service method calls; missing mandatory fields return 400 immediately.

### 7.3 CORS Policy

- **Development:** Wildcard (`*`) origin permitted to allow device and emulator access during development.
- **Production:** `ALLOWED_ORIGINS` environment variable restricts to an explicit whitelist of allowed origins.
- Methods restricted to `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`.
- `Authorization` and `Content-Type` headers explicitly allowed.

### 7.4 Environment Variable Handling

- All secrets (API keys, Firebase credentials) are stored in `.env` files excluded from version control via `.gitignore`.
- `python-dotenv` loads environment variables at process startup.
- Firebase credentials path is configurable via `FIREBASE_CREDENTIALS_PATH`; the service account JSON file is never committed.
- Frontend secrets are prefixed with `VITE_` and embedded at build time, only public Firebase config values (project ID, app ID) are placed here.

### 7.5 Rate Limiting

- Not yet implemented at the application layer. Recommended for production: Flask-Limiter with Redis backend.
- Firebase Authentication provides inherent rate limiting on auth endpoints.

### 7.6 Security Headers

- Flask-Talisman is imported and configured for production use (currently disabled in development to prevent CORS conflicts). Production deployment should re-enable Talisman with appropriate CSP rules.

### 7.7 Temporary File Lifecycle

- Uploaded images and audio files are deleted immediately after inference.
- `try/except` blocks around `os.remove()` prevent server errors from failed cleanup while ensuring the cleanup is always attempted.

---

## 8. Performance Optimization Strategy

### 8.1 Frontend

**API Caching:** React Query or SWR can be introduced for GET endpoint caching (notifications, weather) to avoid repeated fetches on re-render. Currently not implemented, a planned enhancement.

**Lazy Routing:** React Router v6 route-level lazy loading with `React.lazy()` and `Suspense` ensures only the active page's JavaScript bundle is loaded.

**SSE Streaming:** Instead of waiting for complete LLM responses (which can take 5–15 seconds for long outputs), SSE streaming begins rendering partial text within milliseconds of the first token, providing dramatically better perceived responsiveness.

**State Colocation:** Context is used only for truly global state (language, theme, farm profile). All page-level state is colocated in the page component, preventing unnecessary global re-renders.

---

### 8.2 Backend

**Lazy Model Loading:** Disease and pest models are loaded on first inference request and then held in memory. Subsequent requests reuse the loaded model, eliminating 2–8 second model load overhead from all but the first request.

**Async Notification Engine:** Notification generation is isolated in an async background task managed by APScheduler, ensuring it never blocks the request-handling event loop.

**Response Streaming:** The `generate()` generator pattern in Flask yields SSE chunks as they arrive from the Ollama stream. Flask's `Response` with `mimetype='text/event-stream'` and `X-Accel-Buffering: no` header ensures proxies do not buffer the stream.

**Minimal Inference Overhead:** Image files are saved to disk (not held in memory buffers) and passed to models by path, which is consistent with how TensorFlow and YOLO load image data. Post-inference cleanup is immediate.

**Firestore Read Optimization:** The crop plan caching pattern converts repeated expensive LLM calls into single-document Firestore reads, reducing per-request p95 latency from ~6s to ~100ms for cached plans.

---

## 9. Scalability Strategy

### 9.1 Horizontal Scaling

The Flask API is designed as a stateless HTTP service with one exception: the in-memory `advisor_sessions` dictionary. For horizontal scaling across multiple Flask instances, this dictionary must be migrated to a shared store (Redis recommended). All other state is in Firestore.

### 9.2 Stateless API Design

All authentication is token-based with no server-side session cookies. Every request is fully self-contained with its Bearer token. This aligns with the constraints of load-balanced multi-instance deployments.

### 9.3 Microservice Adaptability

Each service module is already logically isolated. Extraction to independent microservices requires:
1. Adding a standalone Flask app entry point per service.
2. Replacing direct Python module imports in `app.py` with HTTP API calls to service URLs.
3. Containerizing each service independently via Docker.

No shared mutable state exists between services at the module level.

### 9.4 Load Balancing Readiness

The API design is compatible with any HTTP load balancer (Nginx, AWS ALB, Google Cloud Load Balancer). The only prerequisite is migrating advisor session state to Redis before enabling multi-instance routing.

### 9.5 Cloud Deployment Readiness

- **Frontend:** Firebase Hosting serves the static Vite build globally via CDN.
- **Backend:** Deployable to Google Cloud Run (containerized), AWS EC2, or any VPS.
- **Database:** Firestore is a managed, auto-scaling cloud database requiring no operational overhead.
- **LLM:** Ollama can run on a dedicated GPU instance; Gemini API provides a managed cloud fallback requiring no infrastructure.

---

## 10. DevOps and Deployment Architecture

### 10.1 Environment Separation

| Environment | FLASK_ENV | DISABLE_AUTH | CORS | LLM Backend |
|-------------|-----------|--------------|------|-------------|
| Development | development | true | Wildcard | Ollama (local) |
| Production | production | false | Whitelist | Ollama (GPU instance) / Gemini |

### 10.2 CI/CD

A GitHub Actions workflow (`Build Android APK (TWA)`) is defined for automated Android APK generation using Bubblewrap. The workflow accepts a Cloudflare Tunnel URL as input, generates a signed APK using a base64-encoded keystore secret, and uploads it as a build artifact.

### 10.3 Logging Strategy

All backend log lines are prefixed with a service tag in square brackets:
- `[SCAN]`, Disease Detector
- `[PEST]`, Pest Detector
- `[ADVISOR]`, Business Advisor
- `[WASTE]`, Waste-to-Value
- `[FARM_HEALTH]`, Farm Health
- `[ROADMAP]`, Roadmap Generator
- `[CROP-ROADMAP]`, Crop Planner
- `[SCHEDULER]`, Notification Scheduler

This enables rapid log filtering in production environments using `grep` or log aggregation queries.

### 10.4 Build Process

**Frontend:**
```
npm install          # Install dependencies
npm run dev          # Development server (Vite HMR)
npm run build        # Production bundle (output: dist/)
firebase deploy      # Deploy dist/ to Firebase Hosting
```

**Backend:**
```
pip install -r requirements.txt
python app.py        # Development server (Flask debug mode disabled in prod)
```

---

## 11. Risk Analysis and Mitigation

### 11.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Ollama unavailable | Medium | High | Fallback recommendations; Gemini API configured as cloud fallback |
| Model produces incorrect classification | Medium | High | Confidence score surfaced to user; "Consult an expert" disclaimer on low-confidence results |
| Firestore write failure during crop plan caching | Low | Low | Try/except around Firestore write; plan returned to user regardless of cache failure |
| LLM produces non-JSON output in JSON mode | Low | Medium | Try/except around JSON parse; retry logic or fallback response |
| Image upload exceeds memory | Low | High | 16MB MAX_CONTENT_LENGTH enforced at Flask layer before file save |

### 11.2 Operational Risks

| Risk | Mitigation |
|------|------------|
| Weather API quota exhausted | GNews and WeatherAPI keys are configurable; quota monitoring should be added in production |
| APScheduler job failure | Scheduler errors are caught and logged; failure of one notification cycle does not impact the next |
| Server restart loses advisor sessions | Sessions are ephemeral by design; users re-initialize sessions after UI prompt |

### 11.3 Security Risks

| Risk | Mitigation |
|------|------------|
| API key exposure in environment variables | `.env` excluded from VCS; Firebase config values are public-by-design (restricted by Firebase Security Rules) |
| Path traversal via file upload | `secure_filename()` applied to all uploaded filenames |
| Auth bypass in production | `DISABLE_AUTH` documented as development-only; production deployment checklist should verify this flag is absent |

---

## 12. Future Roadmap

### Phase 1: Data Enrichment (Q2 2026)

- Integration with the Agmarknet national Mandi price API for real-time commodity pricing.
- Integration with PM-KISAN beneficiary data API for scheme eligibility alerts.
- Expanded disease model training on Indian-specific crop varieties (Turmeric, Sugarcane, Mango).
- Green Credit System integration: track and display carbon credit eligibility based on organic practice recommendations.

### Phase 2: Intelligence Enhancement (Q3 2026)

- Migration from Ollama `llama3.2` to a fine-tuned agriculture-specific model trained on Indian agricultural extension literature.
- Soil sensor IoT integration via MQTT, direct real-time soil pH, moisture, and NPK readings fed into the Farm Health Engine.
- Pest detection expansion to 50+ classes using a custom-labeled Indian agricultural pest dataset.
- Satellite imagery integration (ISRO Bhuvan API) for remote crop health monitoring.

### Phase 3: Enterprise and Government Adaptation (Q4 2026)

- Multi-farm management dashboard for agricultural extension officers managing portfolios of 100+ farmers.
- Admin analytics console: aggregate anonymized data on disease prevalence by district and season.
- Government scheme recommendation engine: match farmer profile against all active central and state agricultural schemes.
- Offline-first mobile application with synchronized local data store for use in areas with intermittent connectivity.

### Phase 4: Monetization and Scale (2027)

- Freemium model: free access to disease detection and basic advisory; premium subscription for unlimited LLM sessions, PDF reports, and advanced analytics.
- Agri-input marketplace integration: connect treatment recommendations to verified supplier catalogs.
- Drone automation hooks: generate precision spraying waypoint data from pest detection results for compatible drone hardware.
- API as a service: expose the disease detection and advisory APIs to third-party agri-tech applications via a managed API gateway.

---

*End of DETAIL.md, KrishiSahAI Advisory Technical Documentation*
