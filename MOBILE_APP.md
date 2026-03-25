# KrishiSahAI Mobile App – Complete Demo Setup Guide

> **Current Tunnel URL:** `https://krishisahai.loca.lt`
> If the tunnel URL changes, follow **Section 5** to rebuild & redeploy.

---

## Section 1: Start the Backend on Your Laptop 

Do this **before** picking up the phone.

1. Open a terminal and navigate to the `Backend` folder:
   ```powershell
   cd "d:\Projects\KrishiSahAI TechFiesta\Backend"
   ```

2. Activate the Python virtual environment:
   ```powershell
   ..\venv\Scripts\activate
   ```

3. Start the Flask server:
   ```powershell
   python app.py
   ```
    You should see: `Running on http://0.0.0.0:5000`

4. Open a **new terminal** (keep the first one running) and start the tunnel:
   ```powershell
   lt --port 5000
   ```
    You will see a URL like: `your tunnel is at https://krishisahai.loca.lt`

   > **Keep both terminals open throughout the demo.**

---

## Section 2: Authorize Your Phone (One-Time Per Session) 

LocalTunnel requires your phone to be "unlocked" each time the tunnel restarts.

### Step 1 – Get your laptop's public IP
On your **laptop**, open a browser and go to:
 **[https://loca.lt/mytunnelpassword](https://loca.lt/mytunnelpassword)**

Copy the number shown (e.g., `103.21.58.212`). This is your tunnel password.

### Step 2 – Authorize your phone
On your **phone**, open **Chrome** and go to:
 **`https://krishisahai.loca.lt`**

You will see a LocalTunnel splash page asking for a password.

### Step 3 – Submit the password
1. Paste the IP number you copied into the **"Tunnel Password"** box.
2. Tap **"Click to Submit"**.
3. If authorization is successful, you will see a **"Not Found"** or the app page — this is normal 

---

## Section 3: Run the App 

1. **(Recommended)** Clear the app cache on your phone:
   - Go to **Settings → Apps → KrishiSahAI → Storage → Clear Cache**

2. Open the **KrishiSahAI app** on your phone.

3. Log in and navigate to any feature (Chatbot, News, Weather, etc.).

4. The app will now fetch live data directly from your laptop's backend.

---

## Section 4: Troubleshooting 

| Problem | Fix |
|---|---|
| **Chatbot is blank / not responding** | Force-close the app and reopen. If still failing, clear Chrome "Site Settings" for `krishisahai-advisory.web.app`. |
| **"Unable to connect" error** | Check that `lt --port 5000` is still running on your laptop. Restart it if needed, then re-authorize phone (Section 2). |
| **Tunnel page keeps showing (not authorizing)** | Double-check the IP from `loca.lt/mytunnelpassword` — it changes if your network changes. |
| **Backend error / 500 response** | Check the Flask terminal for Python errors. Usually means Ollama is not running. |
| **Ollama not running** | In a new terminal, run: `ollama serve` |
| **App shows old data / stale UI** | Clear app cache (Section 3, Step 1) and reopen. |

---

## Section 5: Tunnel URL Changed? Rebuild the App 

If `lt --port 5000` gives a **different URL** than `https://krishisahai.loca.lt`, follow these steps:

### Step 1 – Update the URL in `.env`
Open `d:\Projects\KrishiSahAI TechFiesta\.env` and update this line:
```env
VITE_API_BASE_URL=https://YOUR-NEW-URL.loca.lt/api
```

### Step 2 – Rebuild the Frontend
```powershell
cd "d:\Projects\KrishiSahAI TechFiesta\Frontend"
npm run build
```

### Step 3 – Redeploy to Firebase
```powershell
cd "d:\Projects\KrishiSahAI TechFiesta"
firebase deploy --only hosting
```

### Step 4 – Re-authorize phone
Follow **Section 2** again with the new tunnel URL.

### Step 5 – Update this file
Update the tunnel URL at the top of this file.

---

## Section 6: Full Startup Checklist 

Use this before every demo:

- [ ] Flask backend is running (`python app.py`)
- [ ] Ollama is running (`ollama serve`)
- [ ] Tunnel is active (`lt --port 5000`) — URL matches current build
- [ ] Phone authorized via `loca.lt/mytunnelpassword`
- [ ] App cache cleared on phone
- [ ] App launched and chatbot tested

---

*Last updated: 25 March 2026 | Tunnel: `https://krishisahai.loca.lt`*
