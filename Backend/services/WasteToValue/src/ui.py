import streamlit as st
import sys
import os
import json

# ---------------------------------------------------------------------------
# PATH SETUP
# ---------------------------------------------------------------------------
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)
sys.path.append(os.path.abspath(os.path.join(current_dir, "../../")))

from langchain_core.messages import HumanMessage, AIMessage

# Import Business Advisor modules
try:
    from BusinessAdvisor.krishi_chatbot import KrishiSahAIAdvisor, FarmerProfile, BUSINESS_OPTIONS
except ImportError as e:
    st.error(f"Error importing Business Advisor: {e}. Please ensure directory structure is correct.")

# Import the waste analysis engine
try:
    from waste_service import WasteToValueEngine
except ImportError as e:
    st.error(f"Error importing WasteToValueEngine: {e}. Ensure waste_service.py is in the project root.")


# ===========================================================================
# MOCK FARM PROFILE DATABASE
# ===========================================================================
# Each key is a farm profile name; value is a list of crops grown there.
# In production, this would be fetched from a real database keyed to the user.
MOCK_PROFILES: dict[str, list[str]] = {
    " Main Plot":     ["Wheat", "Maize"],
    " Backyard Shed": ["Onion", "Tomato"],
    " River Field":   ["Sugarcane", "Rice", "Banana"],
}

# Ordered list of profile names for the selectbox
_PROFILE_NAMES = list(MOCK_PROFILES.keys())


# ===========================================================================
# SESSION STATE INITIALISATION
# ===========================================================================
def _init_session_state() -> None:
    """
    Initialise all session-state keys needed for the Waste-to-Value dashboard.
    Called once at module evaluation time so every render has a consistent state.
    """
    if "current_profile" not in st.session_state:
        st.session_state.current_profile = _PROFILE_NAMES[0]

    if "active_crops" not in st.session_state:
        st.session_state.active_crops = MOCK_PROFILES[_PROFILE_NAMES[0]]


_init_session_state()


# ===========================================================================
# PROFILE SWITCHER CALLBACK
# ===========================================================================
def _on_profile_change() -> None:
    """
    on_change callback for the profile selectbox.
    Updates current_profile and active_crops from the new selectbox value.
    No st.rerun() needed — Streamlit will rerun automatically after on_change.
    """
    selected = st.session_state["profile_selectbox"]
    st.session_state.current_profile = selected
    st.session_state.active_crops   = MOCK_PROFILES[selected]


# ===========================================================================
# CACHED BACKEND CALL
# ===========================================================================
@st.cache_data(show_spinner=False, ttl=3600)
def _fetch_waste_analysis(crop_name: str, language: str = "English") -> dict:
    """
    Thin, cached wrapper around WasteToValueEngine.analyze_waste().

    Results are cached for 1 hour (ttl=3600) so that switching between
    profiles does NOT trigger expensive LLM inference for crops already seen.
    Cache key = (crop_name, language).
    """
    engine = WasteToValueEngine()
    return engine.analyze_waste(crop_name, language)


# ===========================================================================
# RENDERING HELPERS
# ===========================================================================
def _render_single_section(section: dict) -> None:
    """
    Renders a single 'section' dict from the legacy schema.
    section = {"title": str, "content": list[str] | str}
    """
    content = section.get("content", [])
    if isinstance(content, list):
        for line in content:
            st.markdown(f"- {line}")
    else:
        st.markdown(str(content))


def _get_section_value(sections: list[dict], title: str) -> str:
    """
    Utility: extract the first content string for a named section.
    Returns 'N/A' when the section is missing or empty.
    """
    for sec in sections:
        if sec.get("title") == title:
            content = sec.get("content", [])
            if isinstance(content, list) and content:
                return content[0]
            elif isinstance(content, str) and content:
                return content
    return "N/A"


def _render_crop_card(crop_name: str, data: dict) -> None:
    """
    Renders the full analysis card for one crop using native Streamlit elements.

    Layout:
    
      Crop Name       Conclusion pill               
      [metric: avg recovery]  [metric: top option]    
       Waste Options (st.expander per option)     
    
    """
    options   = data.get("options", [])
    conclusion = data.get("conclusion", {})

    #  Header row 
    h_col1, h_col2 = st.columns([3, 2])
    with h_col1:
        st.subheader(f" {crop_name}")
    with h_col2:
        highlight = conclusion.get("highlight", "—")
        st.info(f" **Best Option:** {highlight}", icon=None)

    #  Conclusion summary 
    rationale = conclusion.get("rationale", "")
    if rationale:
        st.caption(f" {rationale}")

    if not options:
        st.warning("No waste-to-value options were generated for this crop.")
        return

    #  Quick metric overview (first option for the summary row) 
    first_option = options[0]
    first_sections = first_option.get("fullDetails", {}).get("sections", [])
    avg_recovery   = _get_section_value(first_sections, "Average Recovery Value")
    equipment      = _get_section_value(first_sections, "Equipment Needed")

    m1, m2, m3 = st.columns(3)
    m1.metric(" Top Recovery Value",  avg_recovery)
    m2.metric(" Equipment (Top Option)", equipment[:40] + "…" if len(equipment) > 40 else equipment)
    m3.metric(" Total Pathways", len(options))

    st.markdown("---")

    #  Per-option expanders 
    for opt in options:
        opt_title    = opt.get("title", "Option")
        opt_subtitle = opt.get("subtitle", "")
        full_details = opt.get("fullDetails", {})
        basic_idea   = full_details.get("basicIdea", [])
        sections     = full_details.get("sections", [])

        opt_recovery  = _get_section_value(sections, "Average Recovery Value")
        opt_equipment = _get_section_value(sections, "Equipment Needed")
        urgency       = _get_section_value(sections, "Action Urgency")
        pathway_type  = _get_section_value(sections, "Pathway Type")

        expander_label = f" {opt_title}  |   {opt_recovery}  |   {urgency}"
        with st.expander(expander_label, expanded=False):

            # Subtitle / basic idea
            if opt_subtitle:
                st.markdown(f"**{opt_subtitle}**")
            if isinstance(basic_idea, list) and basic_idea:
                for idea_line in basic_idea:
                    st.markdown(f"> {idea_line}")
            elif isinstance(basic_idea, str) and basic_idea:
                st.markdown(f"> {basic_idea}")

            st.markdown(" ")

            # Key metrics inside the expander
            ec1, ec2, ec3 = st.columns(3)
            ec1.metric(" Avg Recovery Value", opt_recovery)
            ec2.metric(" Equipment Needed",   opt_equipment[:35] + "…" if len(opt_equipment) > 35 else opt_equipment)
            ec3.metric(" Pathway Type",       pathway_type)

            st.markdown(" ")

            # Remaining sections rendered as toggleable detail
            skip_in_summary = {
                "Average Recovery Value", "Equipment Needed", "Pathway Type"
            }
            detail_cols = st.columns(2)
            col_idx = 0
            for sec in sections:
                sec_title = sec.get("title", "")
                if sec_title in skip_in_summary:
                    continue  # already shown above as metrics
                with detail_cols[col_idx % 2]:
                    st.markdown(f"**{sec_title}**")
                    _render_single_section(sec)
                col_idx += 1


def _render_error_card(crop_name: str, error_msg: str) -> None:
    """Renders a compact error banner for a crop that failed to load."""
    st.error(
        f"**{crop_name}** — Analysis failed.\n\n"
        f"*Reason:* `{error_msg}`\n\n"
        "Please check that Ollama is running and retry.",
        icon=""
    )


# ===========================================================================
# MAIN FEATURE RENDER FUNCTION
# ===========================================================================
def render_waste_to_value() -> None:
    """
    Proactive, profile-driven Waste-to-Value dashboard.

    Flow:
    1. Profile Switcher selectbox (top of section)
    2. Automatic analysis card per crop in the active profile
    3. Manual  search bar for ad-hoc / fallback crops
    """

    #  Page header 
    st.header(" Agricultural Waste-to-Value Dashboard")
    st.markdown(
        "_Automatically analyses every crop on your selected farm profile "
        "and surfaces the best waste-monetisation pathways._"
    )
    st.divider()

    #  1. PROFILE SWITCHER 
    # The selectbox is placed in the sidebar for persistent visibility across tabs.
    with st.sidebar:
        st.markdown("###  Farm Profile")
        st.selectbox(
            label="Select Profile",
            options=_PROFILE_NAMES,
            index=_PROFILE_NAMES.index(st.session_state.current_profile),
            key="profile_selectbox",
            on_change=_on_profile_change,
            help="Switch between your registered farm plots to see crop-specific waste recommendations.",
        )
        st.caption(
            f"**Active crops:** {', '.join(st.session_state.active_crops)}"
        )

    # Display active profile banner
    st.info(
        f" **{st.session_state.current_profile}** — "
        f"Showing analysis for: **{', '.join(st.session_state.active_crops)}**",
        icon="",
    )
    st.markdown(" ")

    #  2. MANUAL SEARCH BAR 
    with st.container():
        search_col, btn_col = st.columns([5, 1])
        with search_col:
            search_crop = st.text_input(
                " Search other crops…",
                placeholder="e.g. Banana, Sugarcane, Cotton",
                key="wtv_search_input",
                label_visibility="visible",
            )
        with btn_col:
            st.markdown("<br>", unsafe_allow_html=True)   # vertical alignment nudge
            search_btn = st.button("Analyse", key="wtv_search_btn", use_container_width=True)

    # Determine final crop list to render:
    # Profile crops always shown; search result appended on demand.
    crops_to_render: list[str] = list(st.session_state.active_crops)  # profile crops

    if search_btn and search_crop.strip():
        extra_crop = search_crop.strip().title()
        if extra_crop not in crops_to_render:
            crops_to_render.append(extra_crop)
            st.success(f"Added **{extra_crop}** to this session. Results appear below.")

    st.divider()

    #  3. AUTOMATIC ANALYSIS LOOP 
    # Each crop in the active profile is analysed automatically.
    # Results are cached so switching profiles doesn't re-run inference.
    for crop in crops_to_render:
        with st.spinner(f" Fetching waste pathways for **{crop}**…"):
            try:
                data = _fetch_waste_analysis(crop)

                # Validate the returned dict has a minimum expected shape
                if not isinstance(data, dict):
                    raise ValueError(f"Unexpected response type: {type(data)}")

                # Render the rich card for this crop
                _render_crop_card(crop, data)

            except Exception as exc:
                # Gracefully degrade — show an error card instead of crashing
                _render_error_card(crop, str(exc))

        st.markdown(" ")   # spacing between crop cards


# ===========================================================================
# BUSINESS ADVISOR (unchanged from original)
# ===========================================================================
def render_business_advisor():
    st.header("KrishiSahAI Business Advisor")
    st.markdown("*AI-powered business guidance for Indian farmers*")

    # Check if profile exists
    if "advisor_profile" not in st.session_state:
        st.subheader("Tell us about your resources")

        with st.form("profile_form"):
            st.markdown("### Tell us about your resources")
            col1, col2 = st.columns(2)
            with col1:
                budget = st.number_input("Budget (₹)", min_value=0.0, step=1000.0, placeholder="e.g. 100000")
                water_source = st.selectbox("Water Source", ["Rainfed", "Canal", "Borewell", "Drip Irrigation", "No Water Source"])
            with col2:
                land_size = st.number_input("Land (Acres)", min_value=0.0, step=0.1, placeholder="e.g. 5")
                experience_years = st.number_input("Experience (Years)", min_value=0, step=1, placeholder="e.g. 5")

            st.markdown("### Interests")
            interest_options = [
                "Dairy Farming", "Poultry", "Greenhouse Farming", "Goat Farming",
                "Shop Handling", "Factory Business", "Fishery", "Mushroom Cultivation",
                "Organic Farming", "Agro-Tourism"
            ]
            interests = st.multiselect("Select your interests", interest_options)

            st.markdown("### Market & Strategy")

            st.markdown("**How close are you to a market or buyers?**")
            market_distance = st.radio(
                "Market Distance",
                ["Village only", "Small town within 10 km", "City within 30 km", "Direct buyers already available"],
                label_visibility="collapsed"
            )

            st.markdown("**Are you willing to sell directly to customers (B2C)?**")
            b2c_willingness = st.radio(
                "B2C Willingness",
                ["Yes, I can handle customers", "Maybe, with guidance", "No, I prefer bulk buyers only"],
                label_visibility="collapsed"
            )

            st.markdown("**If income fluctuates month to month, how comfortable are you?**")
            income_fluctuation_tolerance = st.radio(
                "Income Fluctuation",
                ["Very comfortable", "Somewhat okay", "Not comfortable at all"],
                label_visibility="collapsed"
            )

            st.markdown("**How long can you wait to recover your investment?**")
            investment_recovery_timeline = st.radio(
                "Recovery Timeline",
                ["Less than 1 year", "1-2 years", "2-3 years", "I can wait longer"],
                label_visibility="collapsed"
            )

            st.markdown("**What is your attitude toward losses in the first year?**")
            loss_attitude = st.radio(
                "Loss Attitude",
                ["I understand initial losses are possible", "Small losses acceptable", "I cannot afford losses"],
                label_visibility="collapsed"
            )

            st.markdown("**If given two options, what would you choose?**")
            risk_vs_profit = st.radio(
                "Risk vs Profit",
                ["Safe income, lower profit", "Higher profit, higher risk"],
                label_visibility="collapsed"
            )

            st.markdown("---")
            st.info("**IMPORTANT NOTE**: All business ideas and data shown here are research-based and approximate. Actual costs and profits may vary by region, city, market demand, and season.")

            acknowledgement = st.checkbox("I have read and understood the above points and acknowledge that the data shown is indicative.")

            submitted = st.form_submit_button("Analyze", type="primary")

            if submitted:
                if not acknowledgement:
                    st.error("Please acknowledge the important note to proceed.")
                elif not interests:
                    st.error("Please select at least one interest.")
                else:
                    try:
                        profile = FarmerProfile(
                            name="Farmer",
                            budget=budget,
                            land_size=land_size,
                            water_source=water_source,
                            experience_years=int(experience_years),
                            interests=interests,
                            market_distance=market_distance,
                            b2c_willingness=b2c_willingness,
                            income_fluctuation_tolerance=income_fluctuation_tolerance,
                            investment_recovery_timeline=investment_recovery_timeline,
                            loss_attitude=loss_attitude,
                            risk_vs_profit=risk_vs_profit
                        )

                        st.session_state.advisor_profile = profile
                        st.session_state.advisor_bot = KrishiSahAIAdvisor(profile)

                        greeting = st.session_state.advisor_bot.chat("Hello! Based on my profile, what do you suggest?")
                        st.session_state.ba_messages = [{"role": "assistant", "content": greeting}]

                        st.rerun()
                    except Exception as e:
                        st.error(f"Error creating profile: {e}")

    else:
        with st.expander("View Profile"):
            st.text(st.session_state.advisor_profile.to_context())
            if st.button("Reset Profile"):
                del st.session_state.advisor_profile
                del st.session_state.advisor_bot
                del st.session_state.ba_messages
                st.rerun()

        if st.button("Generate Business Recommendations"):
            with st.spinner("Analyzing profile and generating top business ideas..."):
                recs = st.session_state.advisor_bot.generate_recommendations()

                st.markdown("""
                <style>
                .rec-card { border:1px solid #e0e0e0; border-radius:12px; overflow:hidden;
                            box-shadow:0 4px 6px rgba(0,0,0,0.05); background:white;
                            margin-bottom:15px; height:100%; }
                .rec-header { background-color:#27ae60; color:white; padding:15px; position:relative; }
                .match-badge { background-color:rgba(255,255,255,0.25); padding:4px 10px;
                               border-radius:15px; font-size:0.85em; font-weight:600;
                               display:inline-block; margin-bottom:8px; }
                .rec-title { font-size:1.1em; font-weight:700; line-height:1.3;
                             margin:0; text-transform:uppercase; }
                .rec-body { padding:15px; color:#444; font-size:0.95em; }
                .stats-container { display:flex; justify-content:space-between;
                                   background-color:#f8f9fa; border-radius:8px;
                                   padding:10px; margin:15px 0; }
                .stat-box { text-align:left; }
                .stat-label { font-size:0.75em; color:#888; text-transform:uppercase;
                              margin-bottom:2px; font-weight:600; }
                .stat-value { font-size:0.9em; font-weight:700; color:#333; }
                .req-label { font-size:0.75em; color:#888; text-transform:uppercase;
                             font-weight:600; margin-bottom:5px; }
                .tag { display:inline-block; background-color:#edf2f7; color:#4a5568;
                       padding:4px 10px; border-radius:6px; font-size:0.8em;
                       margin-right:5px; margin-bottom:5px; }
                </style>
                """, unsafe_allow_html=True)

                st.subheader("Recommended Businesses")
                cols = st.columns(3)

                for idx, rec in enumerate(recs):
                    with cols[idx]:
                        match_score  = rec.get("match_score", "N/A")
                        title        = rec.get("title", "Unknown Business")
                        reason       = rec.get("reason", "No description available.")
                        cost         = rec.get("estimated_cost", "N/A")
                        profit       = rec.get("profit_potential", "N/A")
                        requirements = rec.get("requirements", [])
                        tags_html    = "".join([f'<span class="tag">{req}</span>' for req in requirements])

                        card_html = f"""
                        <div class="rec-card">
                            <div class="rec-header">
                                <div class="match-badge">{match_score}% Match</div>
                                <h3 class="rec-title">{title}</h3>
                            </div>
                            <div class="rec-body">
                                <p style="margin-bottom:15px;height:60px;overflow:hidden;">{reason}</p>
                                <div class="stats-container">
                                    <div class="stat-box">
                                        <div class="stat-label">Investment</div>
                                        <div class="stat-value">{cost}</div>
                                    </div>
                                    <div class="stat-box">
                                        <div class="stat-label">Profit</div>
                                        <div class="stat-value">{profit}</div>
                                    </div>
                                </div>
                                <div class="req-label">Requirements</div>
                                <div style="margin-bottom:15px;height:50px;overflow:hidden;">
                                    {tags_html}
                                </div>
                            </div>
                        </div>
                        """
                        st.markdown(card_html, unsafe_allow_html=True)

                        b_col1, b_col2 = st.columns(2)
                        if b_col1.button("Ask Chatbot", key=f"ask_{idx}"):
                            st.session_state.ba_messages.append({"role": "user", "content": f"Tell me more about {title}"})
                            response = st.session_state.advisor_bot.chat(f"Tell me more about {title}")
                            st.session_state.ba_messages.append({"role": "assistant", "content": response})
                            st.rerun()

                        if b_col2.button("Know More", key=f"more_{idx}"):
                            st.session_state.ba_messages.append({"role": "user", "content": f"What are the detailed requirements for {title}?"})
                            response = st.session_state.advisor_bot.chat(f"What are the detailed requirements and steps for {title}?")
                            st.session_state.ba_messages.append({"role": "assistant", "content": response})
                            st.rerun()

        st.divider()

        if "ba_messages" not in st.session_state:
            st.session_state.ba_messages = []

        for message in st.session_state.ba_messages:
            with st.chat_message(message["role"]):
                st.markdown(message["content"])

        if prompt := st.chat_input("Ask about farming businesses..."):
            with st.chat_message("user"):
                st.markdown(prompt)
            st.session_state.ba_messages.append({"role": "user", "content": prompt})

            with st.chat_message("assistant"):
                message_placeholder = st.empty()
                message_placeholder.markdown("...")
                try:
                    response = st.session_state.advisor_bot.chat(prompt)
                    message_placeholder.markdown(response)
                    st.session_state.ba_messages.append({"role": "assistant", "content": response})
                except Exception as e:
                    message_placeholder.error(f"Error: {e}")


# ===========================================================================
# ENTRYPOINT
# ===========================================================================
def main():
    st.set_page_config(
        page_title="KrishiSahAI — Agri-Engine",
        page_icon="",
        layout="wide",
        initial_sidebar_state="expanded",
    )

    #  Sidebar chrome 
    st.sidebar.title(" KrishiSahAI")
    st.sidebar.info("Integrated Agricultural Decision Support System")

    if st.sidebar.button(" Clear All Data"):
        st.session_state.clear()
        _init_session_state()   # re-seed defaults after clear
        st.rerun()

    #  Tab navigation 
    tab1, tab2 = st.tabs([" Waste to Value", " Business Advisor"])

    with tab1:
        render_waste_to_value()

    with tab2:
        render_business_advisor()


if __name__ == "__main__":
    main()
