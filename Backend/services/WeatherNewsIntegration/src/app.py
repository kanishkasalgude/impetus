import streamlit as st
import os
import json
from dotenv import load_dotenv
from agri_pro.agent import AgriAgent

# Load environment variables
# Explicitly look for .env in the parent directory of this file (src/../.env)
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
dotenv_path = os.path.join(project_root, '.env')
load_dotenv(dotenv_path)

st.set_page_config(page_title="AgriAI Assistant", layout="wide")

st.title(" Agricultural Intelligence Assistant")
st.markdown("Personlized advisory based on **Real-time Weather** and **Agriculture News**.")

# Sidebar Inputs
with st.sidebar:
    st.header("Farmer Profile")
    name = st.text_input("Name", "Farmer")
    
    col1, col2 = st.columns(2)
    district = col1.text_input("District", "Pune")
    state = col2.text_input("State", "Maharashtra")
    
    land_size = st.text_input("Land Size (e.g., 5 acres)", "5 acres")
    soil_type = st.selectbox("Soil Type", ["Alluvial", "Black", "Red", "Laterite", "Other"])
    market_access = st.selectbox("Market Access", ["APMC Mandi", "Local Market", "Contract Farming", "None"])
    
    crops_input = st.text_area("Crops (comma separated)", "Sugarcane, Onion")
    crops = [c.strip() for c in crops_input.split(",") if c.strip()]
    
    farming_stage = st.selectbox("Farming Stage", ["Sowing", "Growing", "Harvesting", "Post-Harvest"])
    
    submit_btn = st.button("Generate Advisory", type="primary")

if submit_btn:
    if not district or not state:
        st.error("Please enter both District and State.")
    else:
        # Construct Profile
        farmer_profile = {
            "name": name,
            "location": {
                "district": district,
                "state": state
            },
            "land_size": land_size,
            "soil_type": soil_type,
            "irrigation_type": "Unknown", # Can add this input if needed
            "market_access": market_access,
            "crops": crops,
            "farming_stage": farming_stage
        }

        # Show Loading
        with st.spinner("Fetching Weather & News... Analyzing with AI..."):
            agent = AgriAgent()
            try:
                import asyncio
                advisory = asyncio.run(agent.generate_advisory(farmer_profile))
                
                # --- DISPLAY OUTPUT ---
                
                # 1. Priority Badge
                priority_color = "red" if advisory.get("priority_level") == "HIGH" else "orange" if advisory.get("priority_level") == "MEDIUM" else "green"
                st.markdown(f"###  Priority Level: :{priority_color}[{advisory.get('priority_level', 'UNKNOWN')}]")
                
                # 2. Weather Section
                st.subheader(" Weather Summary")
                st.info(advisory.get("weather_summary", "No weather summary available."))
                
                if advisory.get("weather_alerts"):
                    st.error(f"**Alerts:** {', '.join(advisory['weather_alerts'])}")
                
                # 3. Personalized Advice
                st.subheader(" Personalized Strategy")
                for advice in advisory.get("personalized_advice", []):
                    st.success(f"- {advice}")
                
                st.subheader(" Next Actions")
                for action in advisory.get("next_actions_for_farmer", []):
                    st.warning(f" {action}")

                # 4. News Section
                st.subheader(" Relevant News")
                news_items = advisory.get("relevant_agri_news", [])
                if news_items:
                    for news in news_items:
                        with st.expander(news.get("headline", "News Item")):
                            st.write(news.get("summary", "No details."))
                else:
                    st.write("No specific news found.")
                    
                # Debug Data (Optional)
                with st.expander("View Raw JSON Output"):
                    st.json(advisory)

            except Exception as e:
                st.error(f"An error occurred: {str(e)}")
