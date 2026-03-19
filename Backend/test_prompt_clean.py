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

for q in ["What is the best time to sow wheat?", "What is the capital of France?"]:
    print(f"\n--- Asking: {q} ---")
    chat_resp = requests.post(f"{BASE_URL}/business-advisor/chat/stream", json={
        "session_id": session_id,
        "message": q,
        "language": "english"
    }, stream=True)

    if chat_resp.status_code != 200:
        print("Chat failed:", chat_resp.text)
        sys.exit(1)

    result = []
    for line in chat_resp.iter_lines():
        if line:
            line_str = line.decode('utf-8')
            if line_str.startswith("data: "):
                try:
                    data = json.loads(line_str[6:])
                    if "chunk" in data:
                        result.append(data["chunk"])
                except:
                    pass
    print("".join(result))
