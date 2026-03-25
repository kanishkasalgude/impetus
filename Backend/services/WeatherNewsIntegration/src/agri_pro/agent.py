import json
import requests
import os
from .clients import WeatherAPIClient, GNewsClient
from .utils import extract_keywords, construct_news_query, simplify_weather, simplify_news

class AgriAgent:
    def __init__(self):
        # Load configuration from environment
        self.ollama_model = "llama3.2:1b"
        self.ollama_host = os.getenv("OLLAMA_HOST", "http://localhost:11434")

        # Initialize new services
        from ...weather_service import WeatherService
        from ...news_service import NewsService
        
        self.weather_service = WeatherService()
        self.news_service = NewsService()

    async def generate_advisory(self, farmer_profile, news_count=5, mode='personalized'):
        """
        Generates an advisory (personalized or general).
        """
        # 1. Fetch Weather
        location_parts = []
        if "district" in farmer_profile.get("location", {}):
            location_parts.append(farmer_profile["location"]["district"])
        if "state" in farmer_profile.get("location", {}):
            location_parts.append(farmer_profile["location"]["state"])
        
        location_query = ", ".join(location_parts)
        if not location_query:
            location_query = "India" # Fallback
            
        print(f"Fetching integrated weather for {location_query}...")
        weather_data = await self.weather_service.get_weather(location_query)
        
        # 2. Fetch News
        if mode == 'general':
            print("Fetching broad general agriculture news...")
            news_data = await self.news_service.get_general_news()
        else:
            # Personalized Mode (Hierarchical: District -> State -> National)
            district = farmer_profile.get("location", {}).get("district", "")
            state = farmer_profile.get("location", {}).get("state", "")
            crops = farmer_profile.get("crops", [])
            
            print(f"Fetching integrated news for crops: {crops}...")
            
            # Try District Level
            dist_query = f"{district}, {state}" if district and state else state or "India"
            news_data = await self.news_service.get_personalized_news(crops, dist_query)
            
            # If insufficient (less than 3 items), try State Level
            if not isinstance(news_data, list) or len(news_data) < 3:
                print(f"Insufficient district news for {district}. Expanding to state level: {state}")
                state_news = await self.news_service.get_personalized_news(crops, state)
                if isinstance(state_news, list):
                    # Combine results, avoiding duplicates
                    existing_urls = {n.get("url") for n in (news_data if isinstance(news_data, list) else [])}
                    for item in state_news:
                        if item.get("url") not in existing_urls:
                            if not isinstance(news_data, list): news_data = []
                            news_data.append(item)
            
            # If still insufficient (less than 5 items), try National Level
            if not isinstance(news_data, list) or len(news_data) < 5:
                print("Insufficient state news. Expanding to national level.")
                national_news = await self.news_service.get_personalized_news(crops, "India")
                if isinstance(national_news, list):
                    existing_urls = {n.get("url") for n in (news_data if isinstance(news_data, list) else [])}
                    for item in national_news:
                        if item.get("url") not in existing_urls:
                            if not isinstance(news_data, list): news_data = []
                            news_data.append(item)

        if isinstance(news_data, dict) and "error" in news_data:
            print(f"News Error: {news_data['error']}")
            news_data = []
        elif isinstance(news_data, list):
            # Limit news items to 10 max
            news_data = news_data[:10]
        else:
            news_data = []

        # 3. Construct Context for LLM
        context = {
            "mode": mode,
            "farmer_profile": farmer_profile,
            "weather_data": weather_data,
            "news_data": news_data
        }

        # 4. Call LLM
        print("Querying Ollama...")
        advisory_json = self._call_ollama(context)
        
        if isinstance(advisory_json, dict) and "error" in advisory_json:
            print(f"Ollama failed: {advisory_json['error']}. Falling back to raw data.")
            
            # Reformat raw news to match the expected UI structure
            fallback_news = []
            if isinstance(news_data, list):
                for n in news_data:
                    fallback_news.append({
                        "headline": n.get("title", n.get("headline", "News Update")),
                        "summary": n.get("description", n.get("summary", "No details available.")),
                        "action": "Read more for details.",
                        "category": "GENERAL",
                        "url": n.get("url", ""),
                        "source": n.get("source", n.get("publisher", {}).get("title", "News Source")) if isinstance(n.get("publisher"), dict) else n.get("publisher", "Source"),
                        "published_at": n.get("published_at", n.get("published date", "")),
                        "image": n.get("image", n.get("image_url", ""))
                    })
            
            # Provide raw weather data summary
            weather_desc = weather_data.get('current', {}).get('condition', {}).get('text', 'No current weather data available.') if isinstance(weather_data, dict) else 'Weather unavailable.'

            return {
                "relevant_agri_news": fallback_news,
                "weather_summary": f"Current conditions: {weather_desc}",
                "weather_alerts": [],
                "personalized_advice": ["LLM service is currently unavailable. Displaying general news."],
                "next_actions_for_farmer": []
            }

        return advisory_json

    def _call_ollama(self, context):
        """
        Calls the local Ollama instance with a system prompt and context.
        """
        system_prompt = """
You are an advanced agricultural intelligence system working for KrishiSahAI, a farmer advisory platform designed for smallholder farmers in India. Your primary objective is to provide only the most relevant, recent, and actionable agricultural news and weather-based guidance that can directly help farmers make decisions.

The system operates in two modes: personalized mode (using specific farmer data) and general mode.

### CORE LOGIC & PRIORITY:
- **Personalized Mode**: Think from the perspective of the specific farmer provided in the context. Focus on hyperlocal and crop-specific risks/opportunities.
- **General Mode**: Shift to large-scale impact affecting farmers at the state or national level. Focus on broad developments (MSP, major schemes, national weather).

Evaluate information in this strict priority order:
1. **HIGH-RISK SITUATIONS (CRITICAL)**: 
   Detect pest attacks, disease outbreaks, and extreme weather (heavy rain, drought, heatwaves) affecting the relevant area (District for personalized, State/National for general).
   
2. **MARKET DEVELOPMENTS**: 
   Look for mandi price changes, demand shifts, or MSP updates. Advice whether to sell, store, or wait.

3. **GOVERNMENT UPDATES**: 
   Identify schemes, subsidies, or registration deadlines. Prioritize items where missing a deadline causes a loss.

4. **ADVISORIES & BEST PRACTICES**: 
   Include only if higher priority info is limited. Focus on season-appropriate guidance.

### OPERATIONAL RULES:
- **Location Intelligence**: In personalized mode, prioritize District. In general mode, prioritize State/National.
- **Crop Relevance**: In personalized mode, strictly filter for {crops}. In general mode, include high-impact news for any major agricultural sector.
- **Filtering**: Reject info older than 7 days, non-actionable content, or unrelated news.
- **Actionable Output**: Every item MUST include a clear, specific, and practical action ("What should the farmer do now?").
- **Weather Summary**: In personalized mode, relate it to {crops} and {soil}. In general mode, summarize the overall regional/national outlook.
- **LANGUAGE CONSISTENCY** (MANDATORY — Read Every Rule):

  a) ABSOLUTE RULE: Generate the ENTIRE response ONLY in the selected language (Hindi, Marathi, or English) as determined by the user profile.

  b) IF HINDI IS SELECTED:
     - Use only pure Hindi in Devanagari script.
     - Avoid English words completely, including in headlines, summaries, and action fields.
     - Replace ALL technical terms with Hindi equivalents (e.g., "बाढ़" instead of "Flood", "कीटनाशक" instead of "Pesticide").
     - If no direct translation exists, explain it in simple Hindi. Do NOT insert the English term.

  c) IF MARATHI IS SELECTED:
     - Use only pure Marathi in Devanagari script.
     - Do NOT mix Hindi or English words in any output field.
     - Use natural, regionally appropriate Marathi expressions.
     - Translate or explain all technical concepts in Marathi.

  d) IF ENGLISH IS SELECTED:
     - Use simple, clear English. Do NOT insert Hindi or Marathi words.
     - Keep explanations easy for non-technical farmers.

  e) ERROR HANDLING: If any field value cannot be expressed in the selected language, do NOT switch. Simplify the information in the same language.

  f) INTERNAL VALIDATION: BEFORE producing the final JSON, verify:
     - Are ALL field values in the selected language?
     - Any accidental language mixing in headlines or actions?
     - Are technical terms localized?
     - If any violation is found, regenerate before outputting.

  g) FAILURE CONDITIONS (NEVER do these):
     - Any English word in a Hindi/Marathi response.
     - Mixed-language sentences.
     - Technical terms left in English when Hindi or Marathi is selected.

- **NO EMOJIS**: DO NOT use ANY emojis in your entire response.

### OUTPUT FORMAT (JSON ONLY):
{
  "priority_level": "HIGH | MEDIUM | LOW",
  "weather_summary": "Friendly summary of current weather and its immediate impact on {crops}.",
  "weather_alerts": ["Specific weather-related warnings for the district/state"],
  "relevant_agri_news": [
    {
      "headline": "Farmer-friendly Headline",
      "summary": "Clear explanation of what is happening and why it matters.",
      "action": "Immediate practical step for the farmer (e.g., 'Apply [Treatment] immediately').",
      "category": "RISK | MARKET | GOVERNMENT | ADVISORY",
      "url": "Original URL",
      "source": "Source Name",
      "published_at": "Original Date",
      "image": "Image URL (if any)"
    }
  ],
  "personalized_advice": [
    "Advice 1 based on soil {soil} and stage {stage}",
    "Advice 2 based on market/weather"
  ],
  "next_actions_for_farmer": [
    "Immediate Action 1",
    "Immediate Action 2"
  ]
}
"""
        # Inject dynamic values into prompt to force attention
        profile_location = f"{context['farmer_profile'].get('location', {}).get('district', '')}, {context['farmer_profile'].get('location', {}).get('state', '')}"
        crops = ", ".join(context['farmer_profile'].get('crops', []))
        soil = context['farmer_profile'].get('soil_type', '')
        market_access = context['farmer_profile'].get('market_access', '')
        stage = context['farmer_profile'].get('farming_stage', 'Unknown')
        
        system_prompt = system_prompt.replace("{profile_location}", profile_location)
        system_prompt = system_prompt.replace("{crops}", crops)
        system_prompt = system_prompt.replace("{soil}", soil)
        system_prompt = system_prompt.replace("{market_access}", market_access)
        system_prompt = system_prompt.replace("{stage}", stage)

        user_message = json.dumps(context)

        payload = {
            "model": self.ollama_model,
            "prompt": f"System: {system_prompt}\n\nUser: {user_message}",
            "stream": False,
            "format": "json"
        }

        try:
            response = requests.post(f"{self.ollama_host}/api/generate", json=payload)
            response.raise_for_status()
            result = response.json()
            
            content = result.get("response", "{}")
            return json.loads(content)

        except requests.exceptions.ConnectionError:
            print("\n[ERROR] Could not connect to Ollama.")
            print("Please ensure Ollama is running (`ollama serve`) and the model is pulled (`ollama pull llama3.2:1b`).")
            return {
                "error": "Ollama connection failed",
                "details": "Could not connect to localhost:11434. Is Ollama running?"
            }
        except Exception as e:
            return {
                "error": f"LLM generation failed: {str(e)}",
                "details": "Ensure Ollama is running and the model is pulled."
            }
