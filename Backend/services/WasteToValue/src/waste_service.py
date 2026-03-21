from langchain_core.prompts import ChatPromptTemplate
from langchain_ollama import ChatOllama
from langchain_core.output_parsers import JsonOutputParser
from prompts import WASTE_TO_VALUE_SYSTEM_PROMPT, GUARDRAIL_PROMPT
import json

import os

class WasteToValueEngine:
    def __init__(self):
        model_name = os.getenv("OLLAMA_MODEL", "llama3.2")
        base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        
        self.json_llm = ChatOllama(
            model=model_name,
            temperature=0.2,
            format="json",
            base_url=base_url,
            num_predict=3072
        )
        
        # LLM for chat (No JSON enforcement)
        self.chat_llm = ChatOllama(
            model=model_name,
            temperature=0.4,
            base_url=base_url,
            num_predict=1200 # Balanced num_predict for streaming
        )

    def analyze_waste(self, crop_name: str, language: str = "English") -> dict:
        """
        Analyzes the crop waste and returns structured JSON recommendations.
        """
        prompt = ChatPromptTemplate.from_messages([
            ("system", WASTE_TO_VALUE_SYSTEM_PROMPT + "\n" + GUARDRAIL_PROMPT),
            ("human", "{input}"),
        ])
        chain = prompt | self.json_llm | JsonOutputParser() # Use json_llm for analysis

        try:
            response = chain.invoke({"input": crop_name, "language": language})
            
            # Accuracy Sanity Check
            self._validate_results(response)
            
            
            # Map to legacy schema for frontend compatibility
            legacy_response = self._map_to_legacy_schema(response)
            
            return legacy_response
        except Exception as e:
            print(f"Error in WasteToValueEngine: {e}")
            import traceback
            traceback.print_exc()
            # Fallback/Error response structure
            return {
                "crop": crop_name,
                "options": [],
                "conclusion": {
                    "title": "Analysis Failed",
                    "rationale": "Could not generate recommendations at this time. Please try again."
                },
                "error": str(e)
            }

    def _map_to_legacy_schema(self, response: dict) -> dict:
        """Maps the flattened LLM output back to the nested legacy schema for the frontend"""
        legacy_options = []
        for opt in response.get("options", []):
            section_titles = [
                "Plant Part", "Pathway Type", "Technical Basis", 
                "Manufacturing Option (DIY)", "3rd-Party Selling Option", 
                "Average Recovery Value", "Value Recovery Percentage", 
                "Equipment Needed", "Action Urgency"
            ]
            
            sections = []
            for title in section_titles:
                sections.append({
                    "title": title,
                    "content": opt.get(title, ["N/A"])
                })
            
            legacy_opt = {
                "id": opt.get("id"),
                "title": opt.get("title"),
                "subtitle": opt.get("subtitle"),
                "fullDetails": {
                    "title": opt.get("title"),
                    "basicIdea": opt.get("basicIdea", []),
                    "sections": sections
                }
            }
            legacy_options.append(legacy_opt)
        
        # Post-process conclusion highlight to ensure it matches one of the options
        conclusion = response.get("conclusion", {})
        highlight = conclusion.get("highlight", "")
        option_titles = [opt["title"] for opt in legacy_options]
        
        # Try to find a match between the highlight and the option titles
        matched_title = next((t for t in option_titles if t.lower() in highlight.lower() or highlight.lower() in t.lower()), option_titles[0] if option_titles else "N/A")
        
        # Replace highlight with the actual matched title to ensure frontend consistency
        conclusion["highlight"] = matched_title
        
        return {
            "crop": response.get("crop"),
            "conclusion": conclusion,
            "options": legacy_options
        }

    def _validate_results(self, response: dict):
        """Internal sanity check for accuracy and technical depth"""
        options = response.get("options", [])
        for opt in options:
            # Check for price realism
            price_content = opt.get("Average Recovery Value", [])
            if price_content:
                content_str = " ".join(price_content)
                if "₹" not in content_str and "INR" not in content_str.upper():
                    print(f"Warning: Missing currency in price for {opt.get('title')}")
            
            # Check for technical depth
            tech_content = opt.get("Technical Basis", [])
            if tech_content:
                content_str = " ".join(tech_content).lower()
                if "n/a" in content_str or "none" in content_str or "..." in content_str:
                    print(f"Warning: Weak technical basis for {opt.get('title')}")
        
        if len(options) < 1:
            raise ValueError("Generated 0 options; LLM failed to provide valid recommendations.")

    def chat_waste(self, context: dict, user_question: str, language: str = "English") -> str:
        """
        Answers user questions based on the detailed waste analysis context (Synchronous).
        """
        chat_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a helpful agricultural expert assistant.
            The user has just received an analysis for converting specific crop waste into value.
            
            CONTEXT (The analysis results):
            {{context_str}}
            
            YOUR GOAL:
            Answer the user's question specifically based on the options provided in the context.
            Respond in the specified LANGUAGE: {language}.
            
            FORMATTING RULES:
            - Use **Bold** for key numbers, machine names, and prices.
            - Use bullet points (•) for lists to make them readable.
            - **ALWAYS use double newlines** between paragraphs.
            - Keep responses concise but well-structured.
            - Be encouraging and practical (Indian context).
            - CRITICAL: STRICTLY stick to ONE language: {language}. DO NOT mix languages.
            - CRITICAL: DO NOT use ANY emojis in your entire response.
            
            Do not hallucinate new options not in the context unless asked for alternatives.
            """),
            ("human", "{question}"),
        ])
        
        # We use a string output parser for chat, not JSON
        from langchain_core.output_parsers import StrOutputParser
        
        # Use the non-JSON chat LLM
        chat_chain = chat_prompt.partial(language=language) | self.chat_llm | StrOutputParser()
        
        try:
            # Convert context dict to a readable string
            context_str = json.dumps(context, indent=2)
            
            response = chat_chain.invoke({
                "context_str": context_str, 
                "question": user_question
            })
            
            
            return response
        except Exception as e:
            print(f"Error in Waste Chat: {e}")
            import traceback
            traceback.print_exc()
            return "I apologize, but I'm having trouble connecting to the knowledge base right now. Please try again."

    def stream_chat_waste(self, context: dict, user_question: str, language: str = "English"):
        """
        Answers user questions based on the detailed waste analysis context (Streaming).
        """
        chat_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a helpful agricultural expert assistant.
            The user has just received an analysis for converting specific crop waste into value.
            
            CONTEXT (The analysis results):
            {{context_str}}
            
            YOUR GOAL:
            Answer the user's question specifically based on the options provided in the context.
            Respond in the specified LANGUAGE: {language}.
            
            FORMATTING RULES:
            - Use **Bold** for key numbers, machine names, and prices.
            - Use bullet points (•) for lists to make them readable.
            - **ALWAYS use double newlines** between paragraphs.
            - Keep responses concise but well-structured.
            - Be encouraging and practical (Indian context).
            - CRITICAL: STRICTLY stick to ONE language: {language}. DO NOT mix languages.
            - CRITICAL: DO NOT use ANY emojis in your entire response.
            
            Do not hallucinate new options not in the context unless asked for alternatives.
            """),
            ("human", "{question}"),
        ])
        
        from langchain_core.output_parsers import StrOutputParser
        chat_chain = chat_prompt.partial(language=language) | self.chat_llm | StrOutputParser()
        
        try:
            context_str = json.dumps(context, indent=2)
            for chunk in chat_chain.stream({
                "context_str": context_str, 
                "question": user_question
            }):
                yield chunk
        except Exception as e:
            print(f"Error in Waste Stream Chat: {e}")
            yield "I apologize, but I'm having trouble connecting to the knowledge base right now. Please try again."
