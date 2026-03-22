# KrishiSahAI Advisory: Installation and Setup Guide

This guide covers the complete process for setting up KrishiSahAI Advisory from a fresh repository clone through a fully operational local development environment. Follow each section in order.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Repository Setup](#2-repository-setup)
3. [Backend Setup](#3-backend-setup)
4. [Frontend Setup](#4-frontend-setup)
5. [AI/ML Setup](#5-aiml-setup)
6. [Environment Variables Reference](#6-environment-variables-reference)
7. [Firebase Configuration](#7-firebase-configuration)
8. [Production Deployment Guide](#8-production-deployment-guide)
9. [Android APK Generation](#9-android-apk-generation)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Prerequisites

### 1.1 Required Software

| Software | Minimum Version | Purpose | Download |
|----------|----------------|---------|----------|
| Python | 3.10 | Backend runtime | [python.org](https://www.python.org/downloads/) |
| Node.js | 18.x LTS | Frontend runtime | [nodejs.org](https://nodejs.org/) |
| npm | 9.x | Frontend package manager | Bundled with Node.js |
| Git | 2.x | Repository management | [git-scm.com](https://git-scm.com/) |
| Ollama | Latest | Local LLM execution | [ollama.com](https://ollama.com/) |

### 1.2 Required Accounts and Services

| Service | Purpose | Sign-Up URL |
|---------|---------|-------------|
| Google Firebase | Authentication + Firestore database | [console.firebase.google.com](https://console.firebase.google.com/) |
| WeatherAPI | Real-time weather forecasts | [weatherapi.com](https://www.weatherapi.com/) |
| GNews API | Agricultural news aggregation | [gnews.io](https://gnews.io/) |

### 1.3 System Requirements

**Minimum (Development):**
- RAM: 8 GB (16 GB recommended, TensorFlow and YOLO v8 are memory-intensive)
- CPU: 4 cores
- Storage: 10 GB free (for Python virtual environment, Node modules, and ML model weights)
- OS: Windows 10/11, macOS 12+, or Ubuntu 20.04+

**Recommended (with local LLM):**
- RAM: 16 GB+
- GPU: NVIDIA GPU with 6 GB+ VRAM (optional but significantly improves Ollama inference speed)
- Storage: 20 GB free

### 1.4 API Keys Required

You will need the following before proceeding:

- **Firebase Service Account JSON**, Downloaded from Firebase Console
- **WeatherAPI Key**, Free tier provides 1 million calls/month
- **GNews API Key**, Free tier provides 100 calls/day

---

## 2. Repository Setup

### 2.1 Clone the Repository

```bash
git clone https://github.com/SanTiwari07/KrishiSahAI.git
cd "KrishiSahAI TechFiesta"
```

### 2.2 Directory Structure

```
KrishiSahAI TechFiesta/
  Backend/
    app.py                        # Flask entry point
    requirements.txt              # Python dependencies
    middleware/
      auth.py                     # Firebase auth decorator
    services/
      BusinessAdvisor/            # LangChain chatbot
      DiseaseDetector/            # TF CNN + model weights + CSV
      PestDetector/               # YOLO v8 + classes.txt
      WasteToValue/src/           # Waste analysis engine
      FarmHealth/src/             # Soil health engine
      FiveToTenYear/              # 5-10 year roadmap generator
      Planner/                    # Crop phase planner
      NotificationService/        # Background alert system
      WeatherNewsIntegration/     # Weather + news clients
      VoiceText/                  # STT + TTS services
      pdfGeneration/              # PDF report renderer
    uploads/                      # Temporary file storage
  Frontend/
    src/
      components/                 # Shared UI components
      contexts/                   # React contexts
      hooks/                      # Custom hooks
      pages/                      # Route-level pages
      services/
        api.ts                    # Centralized API client
    components/                   # Feature-level components
    firebase.ts                   # Firebase SDK init
    App.tsx                       # Root component
    index.html
    vite.config.ts
    package.json
  Logo/
    KrishiSahAI.png               # Project logo
  .env                            # Root-level env (backend)
  README.md
  DETAIL.md
  INSTALLATION.md
```

---

## 3. Backend Setup

### 3.1 Create and Activate a Python Virtual Environment

**Windows (PowerShell):**
```powershell
cd Backend
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**macOS / Linux:**
```bash
cd Backend
python3 -m venv venv
source venv/bin/activate
```

> You should see `(venv)` prefix in your terminal after activation.

### 3.2 Install Python Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

This installs all required packages including TensorFlow, PyTorch, Ultralytics (YOLO), LangChain, Firebase Admin SDK, Flask, Whisper, gTTS, ReportLab, and all supporting utilities. Installation may take 5–15 minutes depending on connection speed and hardware.

> **Note:** On Windows, PyTorch installation may require the CUDA toolkit if you intend to use GPU acceleration. Visit [pytorch.org](https://pytorch.org/get-started/locally/) for the platform-specific install command.

### 3.3 Configure Backend Environment Variables

Create a `.env` file in the project root (not inside `Backend/`):

```bash
# From the repository root
cp .env.example .env   # If an example file exists
# Otherwise, create it manually (see Section 6 for all variables)
```

At minimum, set the following before running the backend:

```env
FIREBASE_CREDENTIALS_PATH=./path/to/your-service-account.json
WEATHER_API_KEY=your_weatherapi_key_here
GNEWS_API_KEY=your_gnews_api_key_here
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
FLASK_ENV=development
DISABLE_AUTH=true
```

### 3.4 Place Firebase Service Account Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/) → Your Project → Project Settings → Service Accounts.
2. Click **Generate New Private Key** and download the JSON file.
3. Save it to the project root (e.g., `firebase-service-account.json`).
4. Set `FIREBASE_CREDENTIALS_PATH=./firebase-service-account.json` in your `.env`.

> **Security:** Never commit the service account JSON to version control. It is already in `.gitignore`.

### 3.5 Start the Backend Server

From the `Backend/` directory with the virtual environment active:

```bash
python app.py
```

Expected output:
```
Initializing Firebase Admin SDK...
Firebase Admin SDK initialized successfully.
Disease data CSV loaded successfully
Initializing Waste-to-Value Engine...
Waste-to-Value Engine initialized successfully
Initializing Farm Health AI Engine...
Farm Health AI Engine initialized successfully
 * Running on http://0.0.0.0:5000 (Press CTRL+C to quit)
```

Verify the server is running:
```bash
curl http://localhost:5000/api/health
```

Expected response: `{"status": "online", ...}`

### 3.6 Backend Runs on Port 5000

The Flask backend listens on `http://localhost:5000` by default. All API routes are prefixed with `/api/`.

---

## 4. Frontend Setup

### 4.1 Navigate to Frontend Directory

```bash
cd Frontend
```

### 4.2 Install Node.js Dependencies

```bash
npm install
```

This installs React, React Router, Firebase SDK, TypeScript, Vite, and all other frontend dependencies. Expect 1–3 minutes.

### 4.3 Configure Frontend Environment Variables

Create a `.env` file inside the `Frontend/` directory:

```env
# Firebase Configuration (from Firebase Console → Project Settings → General → Your Apps)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Backend API URL
VITE_API_URL=http://localhost:5000/api
```

> **Note:** All `VITE_` prefixed variables are embedded into the JavaScript bundle at build time. Never put secret keys in `VITE_` variables. Firebase configuration values are intended to be public, access control is enforced by Firebase Security Rules.

### 4.4 Run the Development Server

```bash
npm run dev
```

The Vite development server starts at:
```
  VITE vX.X.X ready in XXXms

  Local:   http://localhost:5173/
  Network: http://YOUR_IP:5173/
```

Open `http://localhost:5173` in your browser. Hot Module Replacement (HMR) is enabled, changes to source files update the browser instantly.

### 4.5 Production Build

```bash
npm run build
```

The built static files are output to `Frontend/dist/`. This directory is what Firebase Hosting serves.

---

## 5. AI/ML Setup

### 5.1 Ollama Installation and Configuration

**Install Ollama:**

- **Windows:** Download and run the installer from [ollama.com](https://ollama.com/).
- **macOS:** `brew install ollama`
- **Linux:** `curl -fsSL https://ollama.com/install.sh | sh`

**Start the Ollama service:**

```bash
ollama serve
```

Ollama listens on `http://localhost:11434` by default.

**Pull the required language model:**

```bash
ollama pull llama3.2
```

This downloads approximately 2 GB. The model is stored in the Ollama model cache and used for all Business Advisor, Waste-to-Value, Farm Health, and Roadmap generation features.

**Verify Ollama is running:**

```bash
curl http://localhost:11434/api/tags
```

You should see `llama3.2` listed in the models array.

### 5.2 Disease Detection Model

The TensorFlow disease detection model (`plant_disease_model.h5`) must be placed in:

```
Backend/services/DiseaseDetector/plant_disease_model.h5
```

The model is loaded lazily on the first `/api/disease/detect` request. If the file is absent, the endpoint will return a 500 error with a file-not-found message.

> **Note:** The model file is not included in the repository due to file size constraints (typically 50–200 MB). Contact the maintainers or train a new model using the PlantVillage dataset and a standard Keras CNN architecture.

### 5.3 Pest Detection Model

The YOLO v8 weights file must be placed in:

```
Backend/services/PestDetector/
```

The pest detector also requires `classes.txt` in the same directory, mapping integer class indices to pest names.

```
Backend/services/PestDetector/
  best.pt              # YOLO v8 trained weights
  classes.txt          # Class index to pest name mapping
  pest_detector.py     # Inference logic
```

Verify by sending a test image to `/api/pest/detect` after starting the server.

### 5.4 OpenAI Whisper

Whisper is installed via `requirements.txt` (`openai-whisper`). The `base` model is downloaded automatically on first use and cached in the Whisper model directory. No manual download is required.

```python
# This happens automatically on first voice STT request
whisper.load_model("base")
```

Whisper requires `ffmpeg` to be installed and accessible in the system PATH:

**Windows:**
```powershell
winget install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt install ffmpeg
```

### 5.5 gTTS

gTTS requires an active internet connection, it calls Google's text-to-speech API. No model download is required. It is installed via `requirements.txt`.

---

## 6. Environment Variables Reference

### 6.1 Backend Environment Variables (`.env` at project root)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `FIREBASE_CREDENTIALS_PATH` | Yes | N/A | Relative or absolute path to Firebase service account JSON file |
| `GOOGLE_CLOUD_PROJECT` | Yes | N/A | Firebase project ID (e.g., `krishiai-58578`) |
| `OLLAMA_BASE_URL` | Yes | `http://localhost:11434` | Base URL of the running Ollama instance |
| `OLLAMA_HOST` | No | Same as `OLLAMA_BASE_URL` | Alternate Ollama host setting |
| `OLLAMA_MODEL` | Yes | `llama3.2` | Name of the Ollama model to use for all LLM inference |
| `WEATHER_API_KEY` | Yes | N/A | API key from weatherapi.com |
| `GNEWS_API_KEY` | Yes | N/A | API key from gnews.io |
| `FLASK_ENV` | Yes | `production` | Set to `development` for debug mode and relaxed CORS |
| `DISABLE_AUTH` | No | `false` | Set to `true` to bypass Firebase token verification in development |
| `ALLOWED_ORIGINS` | Yes (prod) | `http://localhost:5173` | Comma-separated list of allowed CORS origins for production |
| `COQUI_TTS_PATH` | No | `tts` | Path to Coqui TTS executable (offline TTS alternative) |

### 6.2 Frontend Environment Variables (`Frontend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_FIREBASE_API_KEY` | Yes | N/A | Firebase Web API key (public) |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | N/A | Firebase auth domain (e.g., `project-id.firebaseapp.com`) |
| `VITE_FIREBASE_PROJECT_ID` | Yes | N/A | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Yes | N/A | Firebase storage bucket domain |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Yes | N/A | Firebase cloud messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Yes | N/A | Firebase web app ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | No | N/A | Firebase Analytics measurement ID |
| `VITE_API_URL` | Yes | `http://localhost:5000/api` | Full base URL of the Flask backend API |

### 6.3 Access from Mobile Devices or Emulators

To access the development server from a mobile device or Android emulator on the same local network:

1. Find your machine's local IP address (`ipconfig` on Windows, `ifconfig` on Mac/Linux).
2. Set `VITE_API_URL=http://YOUR_LOCAL_IP:5000/api` in `Frontend/.env`.
3. Set `ALLOWED_ORIGINS` in root `.env` to include `http://YOUR_LOCAL_IP:5173`.
4. Access the frontend at `http://YOUR_LOCAL_IP:5173` from the mobile browser.

---

## 7. Firebase Configuration

### 7.1 Create a Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com/).
2. Click **Add Project** and follow the setup wizard.
3. Disable Google Analytics if not needed.

### 7.2 Enable Authentication

1. In the Firebase Console, navigate to **Authentication** → **Sign-in method**.
2. Enable **Email/Password**.
3. Optionally enable **Google** sign-in.

### 7.3 Create Firestore Database

1. Navigate to **Firestore Database** → **Create Database**.
2. Select **Start in production mode** (or test mode for development).
3. Choose a region close to your primary user base (e.g., `asia-south1` for India).

### 7.4 Set Firestore Security Rules

Navigate to **Firestore Database** → **Rules** and apply the following baseline rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read and write their own documents
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /notifications/{notificationId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /crop_plans/{planId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

### 7.5 Register a Web App

1. In the Firebase Console, go to **Project Settings** → **General** → **Your Apps**.
2. Click the **Web** icon (`</>`).
3. Register the app and copy the `firebaseConfig` object values into your `Frontend/.env` file.

### 7.6 Download Service Account Key (Backend)

1. Go to **Project Settings** → **Service Accounts**.
2. Click **Generate New Private Key**.
3. Save the downloaded JSON to the project root.
4. Set `FIREBASE_CREDENTIALS_PATH` in your root `.env` to the path of this file.

---

## 8. Production Deployment Guide

### 8.1 Frontend: Firebase Hosting

**Install Firebase CLI:**
```bash
npm install -g firebase-tools
firebase login
```

**Initialize Firebase in the project root (first time only):**
```bash
firebase init hosting
# Select your project
# Set public directory to: Frontend/dist
# Configure as single-page app: Yes
# Override index.html: No
```

**Build and deploy:**
```bash
cd Frontend
npm run build
cd ..
firebase deploy --only hosting
```

The frontend is now served at `https://your-project-id.web.app`.

---

### 8.2 Backend: Production Considerations

**Environment changes for production:**

```env
FLASK_ENV=production
DISABLE_AUTH=false
ALLOWED_ORIGINS=https://your-project-id.web.app,https://your-custom-domain.com
```

**Run with a production WSGI server (Gunicorn):**

```bash
pip install gunicorn
gunicorn -w 2 -b 0.0.0.0:5000 app:app
```

> Use 2 workers as a starting point. Increase workers based on available CPU cores, but be mindful that each worker loads ML models into memory.

**Reverse proxy with Nginx (recommended):**

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_buffering off;           # Critical for SSE streaming
        proxy_cache off;
        proxy_read_timeout 300s;       # Allow long LLM inference time
    }
}
```

**Enable HTTPS:** Use Certbot with Let's Encrypt for free SSL certificates.

---

### 8.3 Ollama in Production

For production, run Ollama on a dedicated instance with GPU support:

```bash
# Pull the model on the production server
ollama pull llama3.2

# Run as a service (systemd on Linux)
sudo systemctl enable ollama
sudo systemctl start ollama
```

Set `OLLAMA_BASE_URL` to the Ollama instance's internal IP or hostname in the production `.env`.

---

### 8.4 Environment File Security

- Never commit `.env` files to version control.
- In cloud deployments, use the hosting platform's secrets management:
  - **Google Cloud Run:** Secret Manager
  - **AWS EC2:** Systems Manager Parameter Store
  - **Heroku/Railway:** Dashboard environment variables

---

## 9. Android APK Generation

A GitHub Actions workflow is included for automated APK generation using Bubblewrap (Trusted Web Activity).

### 9.1 Automated: GitHub Actions (Recommended)

1. Push your code to your GitHub repository.
2. Navigate to the **Actions** tab.
3. Select the **Build Android APK (TWA)** workflow.
4. Click **Run workflow**.
5. Enter your Cloudflare Tunnel URL as the manifest URL (e.g., `https://your-url.trycloudflare.com/manifest.webmanifest`).
6. The workflow runs, generates a signed APK, and uploads it as a build artifact.
7. Download the APK from the **Artifacts** section of the completed workflow run.

**Required GitHub Secrets:**

| Secret | Description |
|--------|-------------|
| `KEYSTORE_BASE64` | Base64-encoded Android keystore file |
| `KEYSTORE_PASSWORD` | Keystore password |
| `KEY_ALIAS` | Key alias within the keystore |
| `KEY_PASSWORD` | Key password |

Generate a keystore:
```bash
keytool -genkey -v -keystore release.keystore -alias krishisahai -keyalg RSA -keysize 2048 -validity 10000
```

Encode to Base64 (for the GitHub secret):
```bash
# Linux/macOS
base64 release.keystore

# Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("release.keystore"))
```

### 9.2 Manual: Local Build

**Prerequisites:**
- JDK 11 or 17 installed
- Android SDK installed (via Android Studio)

```bash
npm install -g @bubblewrap/cli
bubblewrap init --manifest=https://your-url.trycloudflare.com/manifest.webmanifest
bubblewrap build
```

Transfer `app-release-signed.apk` to your Android device and install.

---

## 10. Troubleshooting

### 10.1 Backend Issues

**Problem:** `ModuleNotFoundError` on startup  
**Solution:** Ensure the virtual environment is activated: `.\venv\Scripts\Activate.ps1` (Windows) or `source venv/bin/activate` (Unix). Then re-run `pip install -r requirements.txt`.

---

**Problem:** `Error: Firebase Admin SDK failed to initialize`  
**Solution:** Verify `FIREBASE_CREDENTIALS_PATH` in your `.env` points to a valid service account JSON file. The path can be relative to the `Backend/` directory or an absolute path.

---

**Problem:** `[ADVISOR] Init Error: Connection refused` or `Ollama not connected`  
**Solution:** The Ollama service is not running. Start it with `ollama serve` in a separate terminal. Verify with `curl http://localhost:11434/api/tags`.

---

**Problem:** Disease model not loading, `FileNotFoundError: plant_disease_model.h5`  
**Solution:** The model weights file is not present. Place the trained `plant_disease_model.h5` file in `Backend/services/DiseaseDetector/`.

---

**Problem:** `[PEST] Error: Service unavailable (503)`  
**Solution:** YOLO v8 model weights or the `classes.txt` file are missing from `Backend/services/PestDetector/`. Ensure both `best.pt` and `classes.txt` are present.

---

**Problem:** Voice STT fails, `ffmpeg not found`  
**Solution:** Whisper requires `ffmpeg`. Install it for your OS (see Section 5.4) and ensure it is in the system PATH. Restart the terminal after installation.

---

**Problem:** `CORS error` in the browser console  
**Solution:**
- In development: ensure `FLASK_ENV=development` is set in the backend `.env`. This enables wildcard CORS.
- In production: add the frontend's origin URL to `ALLOWED_ORIGINS` in the backend `.env`.

---

**Problem:** Weather or news data returns empty results  
**Solution:** Verify `WEATHER_API_KEY` and `GNEWS_API_KEY` are correctly set in the backend `.env` and are not expired or over quota.

---

### 10.2 Frontend Issues

**Problem:** Blank page after `npm run dev`  
**Solution:** Verify `Frontend/.env` exists and contains all required `VITE_FIREBASE_*` variables. Missing variables cause Firebase initialization to fail silently.

---

**Problem:** `401 Unauthorized` on all API requests  
**Solution:** In development, set `DISABLE_AUTH=true` in the backend `.env`. In production, ensure the user is signed in and the Firebase SDK is correctly initialized with matching project credentials.

---

**Problem:** API requests fail with `net::ERR_CONNECTION_REFUSED`  
**Solution:** The Flask backend is not running. Start it with `python app.py` from the `Backend/` directory.

---

**Problem:** `VITE_API_URL` not reflecting changes  
**Solution:** Vite embeds environment variables at build time. After changing `Frontend/.env`, restart the Vite development server with Ctrl+C followed by `npm run dev`.

---

**Problem:** Mobile device cannot access the local server  
**Solution:** Set `VITE_API_URL` to your machine's LAN IP (not `localhost`). Ensure Windows/macOS firewall permits inbound connections on port 5000. See Section 6.3 for full instructions.

---

### 10.3 Firebase Issues

**Problem:** `FirebaseError: Missing or insufficient permissions`  
**Solution:** Update Firestore Security Rules (Section 7.4) to permit authenticated reads/writes for the relevant collections.

---

**Problem:** Firestore writes succeed locally but fail in production  
**Solution:** Confirm the production backend's service account has the `Cloud Datastore User` role in Google Cloud IAM, or use the Firebase Admin SDK which bypasses Security Rules by default.

---

### 10.4 Performance Issues

**Problem:** LLM responses are very slow  
**Solution:**
- Ensure Ollama is using GPU acceleration if a compatible GPU is available (`ollama ps` shows active models and their device).
- Consider using `llama3.2:1b` (smaller model) for faster inference at the cost of response quality.
- Streaming (`/chat/stream`) should be used instead of non-streaming endpoints to improve perceived responsiveness even when inference is slow.

---

**Problem:** High memory usage on startup  
**Solution:** Both TensorFlow (disease model) and YOLO v8 (pest model) are lazy-loaded, they only consume memory after the first respective inference request. If memory is still insufficient, avoid loading both models simultaneously by ensuring test requests are sequential.

---

*End of INSTALLATION.md, KrishiSahAI Advisory Setup Guide*
