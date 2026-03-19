# KrishiSahAI Mobile App Setup (APK Demo Guide)

Use this guide to connect the Android APK to your local backend for a live demo.

---

### 1. Prerequisites (Running the Backend) 💻
Before opening the APK, ensure your laptop's backend is accessible via the internet:

1.  **Start Python Server**: In the `Backend` directory, run:
    ```powershell
    python app.py
    ```
2.  **Start the Tunnel**: In a **new** terminal, run:
    ```powershell
    lt --port 5000
    ```
    *Note: If the tunnel URL changes, the app must be rebuilt. Current build expects: `https://smart-mails-enter.loca.lt/api`*

---

### 2. Authorization (On Mobile) 📱
LocalTunnel requires a one-time "password" (your public IP address) to allow your phone to talk to your laptop:

1.  **Find your IP**: On your **laptop**, go to **[https://loca.lt/mytunnelpassword](https://loca.lt/mytunnelpassword)**. Copy that number.
2.  **Authorize Phone**: On your **phone**, open Chrome and go to:
    **`https://smart-mails-enter.loca.lt`**

3.  **Submit Password**: Paste the number into the "Tunnel Password" box and click **"Click to Submit"**.
4.  Once you see a "Not Found" message, your phone is authorized!

---

### 3. Running the App 🚀
1.  **Clear App Cache** (Optional but recommended if it was previously open):
    - App Info -> Storage -> Clear Cache.
2.  Launch the **KrishiSahAI APK**.
3.  Navigate to the **Chatbot**. It will now pull data directly from your laptop!

---

### 🔧 Troubleshooting
- **Chatbot is blank?** Force close the app and re-open it. If that fails, clear the Chrome "Site Settings" for `krishisahai-advisory.web.app`.
- **"Unable to connect"?** Verify that `lt --port 5000` is still running on your laptop.

*End of Mobile App Guide*
