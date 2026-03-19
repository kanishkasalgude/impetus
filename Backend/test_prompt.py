import requests
import json
import sys

BASE_URL = "http://localhost:5000/api"

print("Initializing session...")
init_resp = requests.post(f"{BASE_URL}/business-advisor/init", json={
    "name": "Test Farmer",
    "land_size": 2.5,
    "crops_grown": ["Wheat"],
    "language": "english"
})

if init_resp.status_code != 200:
    print("Init failed:", init_resp.text)
    sys.exit(1)

session_id = init_resp.json().get("session_id")
print("Session initialized:", session_id)

print("\n--- Sending Farming Question ---")
chat_resp = requests.post(f"{BASE_URL}/business-advisor/chat/stream", json={
    "session_id": session_id,
    "message": "What is the best time to sow wheat?",
    "language": "english"
}, stream=True)

if chat_resp.status_code != 200:
    print("Chat failed:", chat_resp.text)
    sys.exit(1)

for line in chat_resp.iter_lines():
    if line:
        line_str = line.decode('utf-8')
        if line_str.startswith("data: "):
            try:
                data = json.loads(line_str[6:])
                if "chunk" in data:
                    print(data["chunk"], end="", flush=True)
            except:
                pass


print("\n\n--- Sending Generic Question (Testing Refusal) ---")
chat_resp2 = requests.post(f"{BASE_URL}/business-advisor/chat/stream", json={
    "session_id": session_id,
    "message": "What is the capital of France?",
    "language": "english"
}, stream=True)

for line in chat_resp2.iter_lines():
    if line:
        line_str = line.decode('utf-8')
        if line_str.startswith("data: "):
            try:
                data = json.loads(line_str[6:])
                if "chunk" in data:
                    print(data["chunk"], end="", flush=True)
            except:
                pass

print("\n\nFinished testing.")
