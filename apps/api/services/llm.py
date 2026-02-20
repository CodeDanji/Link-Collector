from litellm import completion
from core.config import get_settings

settings = get_settings()

class LLMService:
    @staticmethod
    async def summarize_content(text: str, language: str = "Auto", model: str = "gpt-4o-mini"):
        lang_instruction = ""
        if language and language != "Auto":
            lang_instruction = f"IMPORTANT: The output MUST be in {language} language."
        else:
            lang_instruction = "IMPORTANT: The output MUST be in the same language as the input text."

        system_prompt = """You are a world-class strategic knowledge architect.
Your goal is to transform raw, noisy information into high-density, actionable knowledge.
Professional, insightful, and concise. Avoid fluff or corporate jargon.

Rules for Analysis:
1. Focus on "The Why" and "The How," not just "The What."
2. Actionable First: Every summary must answer the question, "So what should I do next?"
   Action items should be task-oriented (e.g., "Evaluate X for potential integration" instead of "Learn about X").
3. Context Awareness: Preserve architectural details for tech content; highlight revenue models/market shifts for business content.
4. Constraints: 
   - Never hallucinate facts. If the content is extremely lacking, note "Insufficient information."
   - DO NOT provide markdown tags outside of the JSON block. Maintain strict JSON formatting."""

        user_prompt = f"""
Analyze the following text and extract a Structured Knowledge Block.
{lang_instruction}

Text to analyze:
{text[:15000]}

Required JSON Structure EXACTLY as shown below:
{{
    "title": "AI-refined concise title",
    "summary": "High-level summary (2-3 sentences), focusing on value extraction. Identify if it's a YouTube video and include a 'Key Takeaway'.",
    "key_insights": ["Insight 1 (High density)", "Insight 2", "Insight 3"],
    "action_items": ["Action 1 (Task-oriented)", "Action 2 (Task-oriented)"],
    "tags": ["Tag1", "Tag2"],
    "priority": "High | Medium | Low",
    "category": "Tech | Business | Life | etc",
    "key_takeaway": "A single sentence highlighting the ultimate takeaway (especially for videos)"
}}

Return ONLY a valid JSON object. Do not include a markdown code fence like ```json.
"""

        # Dynamic Model Switching (Cost Optimization)
        # Switch to Gemini (gemini/gemini-1.5-flash) if the length is > 10,000 characters
        api_key = settings.OPENAI_API_KEY
        if len(text) > 10000 and "Auto" in language:
           model = "gemini/gemini-1.5-flash"
           api_key = settings.GEMINI_API_KEY
           print(f"Text > 10000 chars ({len(text)}). Dynamic Routing: Switched to Gemini for cost-saving.")

        try:
            response = completion(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                api_key=api_key,
                response_format={ "type": "json_object" } if "gpt-4" in model or "gpt-3.5" in model else None
            )
            content = response.choices[0].message.content
            # Clean up potential markdown formatting in case the model ignores strict JSON instructions
            content = content.replace("```json", "").replace("```", "").strip()
            return content 
        except Exception as e:
            print(f"LLM failed: {e}")
            return '{ "error": "LLM processing failed" }'
