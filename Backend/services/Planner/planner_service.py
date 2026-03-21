import os
import json
import firebase_admin
from firebase_admin import firestore
from langchain_ollama import ChatOllama
import re

def get_db():
    try:
        return firestore.client()
    except Exception as e:
        print(f"[WARNING] Firestore client initialization failed: {e}")
        return None

class CropPlannerGenerator:
    def __init__(self):
        self.llm = ChatOllama(
            model=os.getenv("OLLAMA_MODEL", "llama3.2"),
            temperature=0.5, # Increased for better structured output
            base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        )

    def get_farmer_profile(self, user_id):
        try:
            db = get_db()
            if db is None:
                 print("[WARNING] Firestore not initialized, returning None for profile")
                 return None
            doc_ref = db.collection('users').document(user_id)
            doc = doc_ref.get()
            if doc.exists:
                return doc.to_dict()
            return None
        except Exception as e:
            print(f"Error fetching farmer profile: {e}")
            return None

    def generate_crop_roadmap(self, user_id, crop_name, language='en'):
        # 1. Fetch Data
        profile = self.get_farmer_profile(user_id)
        if not profile:
            profile = {
                "name": "Guest Farmer",
                "age": 35,
                "land_size": 5,
                "experience_years": 5,
            }

        lang_upper = str(language).upper()
        if lang_upper not in ['EN', 'HI', 'MR']:
            lang_upper = 'EN'

        # 2. Construct Context
        context = {
            "farmer_name": profile.get("name", "Farmer"),
            "location": f"{profile.get('village', 'Unknown Village')}, {profile.get('district', 'Unknown District')}, {profile.get('state', 'Unknown State')}",
            "land_size": f"{profile.get('landSize', profile.get('land_size', 0))} {profile.get('land_unit', 'acres')}",
            "crop_name": crop_name,
            "age": profile.get('age', 35),
            "experience": profile.get('experience_years', profile.get('experience', 'Not specified')),
            "soil_type": profile.get('soil_type', 'Not specified'),
            "water_availability": profile.get('water_availability', 'Not specified'),
            "market_access": profile.get('market_access', 'Moderate'),
            "risk_preference": profile.get('risk_level', profile.get('risk_preference', 'Medium')),
            "language_name": {"EN": "English", "HI": "Hindi", "MR": "Marathi"}[lang_upper]
        }

        # Language-specific labels/headers for the crop prompt
        CROP_LANG_CONFIG = {
            "EN": {
                "milestone": "Lifecycle Milestone",
                "focus": "Critical Focus",
                "actions": "Required Actions",
                "profit": "Projected Value/Yield",
                "time_term": "Week/Month",
                "headers": ["Crop Overview", "1. CropCycle", "2. Resource & Labor Management", "3. Quality & Harvest Sustainability", "4. Market & Risk Management", "5. Final Harvest Verdict"]
            },
            "HI": {
                "milestone": "जीवनचक्र उपलब्धि",
                "focus": "महत्वपूर्ण फोकस",
                "actions": "आवश्यक कार्य",
                "profit": "अनुमानित मूल्य/उपज",
                "time_term": "सप्ताह/महीना",
                "headers": ["फसल अवलोकन", "1. फसल जीवनचक्र योजनाकार", "2. संसाधन और श्रम प्रबंधन", "3. गुणवत्ता और फसल स्थिरता", "4. बाजार और जोखिम प्रबंधन", "5. अंतिम फसल निर्णय"]
            },
            "MR": {
                "milestone": "जीवनचक्र मैलाचा दगड",
                "focus": "गंभीर लक्ष",
                "actions": "आवश्यक कृती",
                "profit": "अपेक्षित मूल्य/उत्पन्न",
                "time_term": "आठवडा/महिना",
                "headers": ["पीक आढावा", "1. पीक जीवनचक्र नियोजक", "2. संसाधन आणि श्रम व्यवस्थापन", "3. गुणवत्ता आणि पीक शाश्वतता", "4. बाजार आणि जोखीम व्यवस्थापन", "5. अंतिम पीक निकाल"]
            }
        }
        
        cfg = CROP_LANG_CONFIG[lang_upper]

        # 3. Crop Roadmap Prompt
        prompt = f"""You are an expert Agricultural Agronomist and Crop Success Consultant. 
Create a HIGHLY DETAILED and professional Lifecycle Roadmap for the crop '{context['crop_name']}'.
STRICTLY generate the ENTIRE response in {context['language_name']} language. EVERY SINGLE WORD must be in {context['language_name']}.

Farmer Profile:
- Name: {context['farmer_name']}
- Location: {context['location']}
- Land: {context['land_size']} (Soil: {context['soil_type']}, Water: {context['water_availability']})
- Crop to Grow: {context['crop_name']}
- Experience: {context['experience']} years
- Market Access: {context['market_access']}

Guidelines:
1. Provide a step-by-step advisor from sowing to harvest.
2. Break the timeline into logical phases (e.g., Sowing, Vegetative, Flowering, Fruiting, Harvest).
3. For each phase, provide specific actions regarding irrigation, fertilization, and pest control.
4. STRICTLY NO EMOJIS. Use professional Markdown formatting.
5. All strategies, pricing, and recommendations MUST be tailored to the Indian agricultural market context.
6. ALL financial values, costs, or profits MUST be in Indian Rupees (₹). DO NOT use dollars ($).
7. LANGUAGE CONSISTENCY (MANDATORY — Read Every Rule):

   a) ABSOLUTE RULE: Generate the ENTIRE response ONLY in {context['language_name']}.

   b) IF HINDI IS SELECTED:
      - Use only pure Hindi in Devanagari script.
      - Avoid English words completely, including phase names, headings, and labels.
      - Replace ALL technical terms with Hindi equivalents (e.g., "बुआई" instead of "Sowing", "सिंचाई" instead of "Irrigation").
      - If no direct translation exists, explain in simple Hindi.

   c) IF MARATHI IS SELECTED:
      - Use only pure Marathi in Devanagari script.
      - Do NOT mix Hindi or English words.
      - Use natural, regionally appropriate Marathi expressions for all phases and labels.
      - Translate or explain all technical concepts.

   d) IF ENGLISH IS SELECTED:
      - Use simple, clear English. Do NOT insert Hindi or Marathi words.

   e) ERROR HANDLING: If any phase/section cannot be expressed in {context['language_name']}, do NOT switch. Simplify in the same language.

   f) INTERNAL VALIDATION: BEFORE producing the final response, verify:
      - Are ALL words and phase names in {context['language_name']}?
      - Any accidental English words?
      - If any violation is found, regenerate before outputting.

   g) FAILURE CONDITIONS (NEVER do these):
      - Any word from another language in the response.
      - Phase names or section headings in English when Hindi or Marathi is selected.
      - Technical terms left in English.

8. NO EMOJIS: DO NOT use ANY emojis in your entire response.

Structure (Use these exact Headers in {context['language_name']}):

# {cfg['headers'][0]}
[A 3-5 sentence summary of the {context['crop_name']} lifecycle on this specific farm, with an Indian market focus.]

# {cfg['headers'][1]}
[Provide a meticulous Phase-wise breakdown. Each phase must be a clear block:]

## Phase 1: [{cfg['milestone']}] - Sowing & Pre-Planting
- **{cfg['focus']}**: [Detailed objective for this phase]
- **{cfg['actions']}**: [3-5 highly specific, numbered steps in {context['language_name']}. Mention locally available inputs where applicable.]
- **{cfg['profit']}**: [Expected yield weight and estimated value in ₹ (Indian Rupees)]

## Phase 2: [{cfg['milestone']}] - Vegetative Growth
- **{cfg['focus']}**: [Detailed objective for this phase]
- **{cfg['actions']}**: [3-5 highly specific, numbered steps in {context['language_name']}. Mention locally available inputs where applicable.]
- **{cfg['profit']}**: [Expected yield weight and estimated value in ₹ (Indian Rupees)]

## Phase 3: [{cfg['milestone']}] - Flowering & Fruiting
- **{cfg['focus']}**: [Detailed objective for this phase]
- **{cfg['actions']}**: [3-5 highly specific, numbered steps in {context['language_name']}. Mention locally available inputs where applicable.]
- **{cfg['profit']}**: [Expected yield weight and estimated value in ₹ (Indian Rupees)]

## Phase 4: [{cfg['milestone']}] - Harvesting & Post-Harvest
- **{cfg['focus']}**: [Detailed objective for this phase]
- **{cfg['actions']}**: [3-5 highly specific, numbered steps in {context['language_name']}. Mention locally available inputs where applicable.]
- **{cfg['profit']}**: [Expected yield weight and estimated value in ₹ (Indian Rupees)]

# {cfg['headers'][2]}
[Explain how resources (water, fertilizer) and labor should be allocated in {context['language_name']}.]

# {cfg['headers'][3]}
[Focus on post-harvest handling and maintaining soil health for the next cycle in {context['language_name']}.]

# {cfg['headers'][4]}
[Identify common pests/diseases for {context['crop_name']} and how to mitigate them in {context['language_name']}.]

# {cfg['headers'][5]}
[Final feasibility score and harvest success probability in {context['language_name']}.]

DISCLAIMER: This roadmap is an AI-generated simulation based on provided data and regional averages. Actual results may vary due to climate conditions and management.
"""
        
        print(f"[CROP-ROADMAP] Generating for {crop_name} in {lang_upper}...")
        try:
            response = self.llm.invoke(prompt)
            content = response.content.strip()
            roadmap_json = self.parse_markdown_roadmap(content, context['crop_name'], lang_upper)
            return roadmap_json
        except Exception as e:
            print(f"[CROP-ROADMAP ERROR] {e}")
            return {"title": f"LifeCycle for {crop_name} (Error)", "overview": str(e), "years": [], "verdict": "Error"}

    def parse_markdown_roadmap(self, text, crop_name, language='EN'):
        import re
        
        title_prefix = "CropCycle"
        roadmap = {
            "title": f"{title_prefix} for {crop_name}",
            "overview": "",
            "years": [],
            "labor_analysis": "",
            "sustainability_plan": "",
            "resilience_strategy": "",
            "verdict": "",
            "disclaimer": ""
        }

        # Multi-language header mapping for the parser
        HEADERS = {
            "overview": r'#\s*(?:Overview|अवलोकन|आढावा|Crop Overview|फसल अवलोकन|पीक आढावा)',
            "planner": r'#\s*1\.\s*(?:10-Year Growth & Profit Planner|10-वर्षीय विकास और लाभ योजनाकार|10-वर्षांचे विकास आणि नफा नियोजक|CropCycle|LifeCycle|फसल जीवनचक्र योजनाकार|पीक जीवनचक्र नियोजक)',
            "labor": r'#\s*2\.\s*(?:Labor & Aging Analysis|श्रम और उम्र बढ़ने का विश्लेषण|श्रम आणि वृद्धत्व विश्लेषण|Resource & Labor Management|संसाधन और श्रम प्रबंधन|संसाधन आणि श्रम व्यवस्थापन)',
            "sustainability": r'#\s*3\.\s*(?:Sustainability & Succession|स्थिरता और उत्तराधिकार|शाश्वतता आणि उत्तराधिकार|Quality & Harvest Sustainability|गुणवत्ता और फसल स्थिरता|गुणवत्ता आणि पीक शाश्वतता)',
            "resilience": r'#\s*4\.\s*(?:Financial Resilience|वित्तीय लचीलापन|आर्थिक लवचिकता|Market & Risk Management|बाजार और जोखिम प्रबंधन|बाजार आणि जोखीम व्यवस्थापन)',
            "verdict": r'#\s*5\.\s*(?:Final Verdict|अंतिम निर्णय|अंतिम निकाल|Final Harvest Verdict|अंतिम फसल निर्णय|अंतिम पीक निकाल)'
        }

        def extract_between(start_regex, end_regex=None):
            if end_regex:
                pattern = rf'{start_regex}\n(.*?)(?={end_regex}|\Z)'
            else:
                pattern = rf'{start_regex}\n(.*)'
            match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
            return match.group(1).strip() if match else ""

        roadmap['overview'] = extract_between(HEADERS['overview'], HEADERS['planner'])
        roadmap['labor_analysis'] = extract_between(HEADERS['labor'], HEADERS['sustainability'])
        roadmap['sustainability_plan'] = extract_between(HEADERS['sustainability'], HEADERS['resilience'])
        roadmap['resilience_strategy'] = extract_between(HEADERS['resilience'], HEADERS['verdict'])
        
        # Extract verdict and disclaimer
        verdict_block = extract_between(HEADERS['verdict'])
        if "DISCLAIMER:" in verdict_block or "अस्वीकरण:" in verdict_block:
            parts = re.split(r'(?:DISCLAIMER:|अस्वीकरण:)', verdict_block, flags=re.IGNORECASE)
            roadmap['verdict'] = parts[0].strip()
            roadmap['disclaimer'] = parts[1].strip()
        else:
            roadmap['verdict'] = verdict_block

        # Parse Years/Phases (Flexible for "Year", "वर्ष", "Phase", etc.)
        year_pattern = r'##\s*(?:Year|वर्ष|Phase)\s*(\d+)\s*:\s*(.*?)\n(.*?)(?=##\s*(?:Year|वर्ष|Phase)\s*\d+\s*:|\Z|#\s*[2345])'
        year_blocks = re.findall(year_pattern, text, re.DOTALL | re.IGNORECASE)
        
        # Labels for inner fields can also be translated (robust to asterisks and colons)
        focus_labels_re = r'(?:Strategic Focus|रणनीतिक फोकस|धोरणात्मक लक्ष|Critical Focus|महत्वपूर्ण फोकस|गंभीर लक्ष)'
        profit_labels_re = r'(?:Expected Profit|अपेक्षित लाभ|अपेक्षित नफा|Projected Value/Yield|अनुमानित मूल्य/उपज|अपेक्षित मूल्य/उत्पन्न)'
        actions_labels_re = r'(?:Key Actions|मुख्य कार्य|मुख्य कृती|Required Actions|आवश्यक कार्य|आवश्यक कृती)'

        for year_num, goal, content in year_blocks:
            year_data = {
                "year": f"Phase {year_num}",
                "goal": goal.strip(),
                "focus": "",
                "actions": [],
                "profit": ""
            }
            
            focus_match = re.search(rf'{focus_labels_re}[*\s:]+(.*)', content, re.IGNORECASE)
            year_data['focus'] = focus_match.group(1).strip() if focus_match else ""
            
            profit_match = re.search(rf'{profit_labels_re}[*\s:]+(.*)', content, re.IGNORECASE)
            year_data['profit'] = profit_match.group(1).strip() if profit_match else ""
            
            actions_match = re.search(rf'{actions_labels_re}[*\s:]+(.*?)(?=\s*[-*]*\s*{profit_labels_re}|\Z)', content, re.DOTALL | re.IGNORECASE)
            if actions_match:
                raw_actions = actions_match.group(1).strip()
                lines = raw_actions.split('\n')
                # Remove starting hyphen, asterisk, numbers or dots
                year_data['actions'] = [re.sub(r'^[-*\d.]+\s*', '', l).strip() for l in lines if l.strip() and not l.strip().startswith('**')]

            roadmap['years'].append(year_data)

        if not roadmap['years']:
            print("[ROADMAP WARNING] Regex year/phase extraction failed. Possible format mismatch.")

        return roadmap
