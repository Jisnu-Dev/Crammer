"""
Chat service for Gemini AI integration
"""
import httpx
import json
import re
import logging
from typing import Optional, List

logger = logging.getLogger(__name__)

GEMINI_API_KEY = "AIzaSyCBjyoYp31gzv0MGyG8AG6wMz_QkPwRl5k"
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent"

SYSTEM_PROMPT = """You are Crammer+, a friendly and knowledgeable AI study assistant. Your purpose is to help students learn effectively. You should:

1. Explain concepts clearly and concisely with examples
2. Create quizzes and practice questions when asked
3. Summarize topics into key points
4. Help create study plans and schedules
5. Encourage and motivate students
6. Use markdown formatting for better readability (bold, bullet points, numbered lists)
7. Keep responses focused and educational
8. If asked something unrelated to studying, gently redirect to academic topics

Be warm, supportive, and patient. Use emojis sparingly to keep things friendly."""

STUDY_PLAN_PROMPT = """Generate a detailed, structured study plan for the subject: "{subject}".

You MUST respond with ONLY valid JSON, no markdown, no code fences, no extra text. The JSON must follow this exact structure:

{{
  "subject_name": "The proper name of the subject",
  "description": "A brief 1-line description of what this plan covers",
  "weeks": [
    {{
      "week": 1,
      "title": "Week theme title",
      "topics": [
        {{
          "id": 1,
          "title": "Topic name",
          "duration": "3h",
          "difficulty": "Easy",
          "status": "not-started",
          "key_points": ["Point 1", "Point 2", "Point 3"],
          "resources": ["Resource 1", "Resource 2"]
        }}
      ]
    }}
  ]
}}

Rules:
- Create 3-5 weeks of content
- Each week should have 2-4 topics
- Topic IDs must be globally unique sequential numbers starting from 1
- difficulty must be one of: "Easy", "Medium", "Hard"
- status must always be "not-started"
- duration should be realistic (e.g. "2h", "3h", "5h")
- key_points should have 2-4 items per topic
- resources should have 1-3 items per topic (books, websites, videos)
- Make the plan comprehensive, progressive (easy to hard), and practical
- Respond with ONLY the JSON object, nothing else"""


class ChatService:
    """Service for handling chat interactions with Gemini AI"""

    @staticmethod
    async def send_message(
        user_message: str,
        conversation_history: Optional[List[dict]] = None
    ) -> dict:
        """
        Send a message to Gemini and get a response.

        Args:
            user_message: The user's message
            conversation_history: Previous messages for context

        Returns:
            dict with 'reply' key containing the AI response
        """
        try:
            # Build conversation contents
            contents = []

            # Add system instruction as first user turn
            contents.append({
                "role": "user",
                "parts": [{"text": SYSTEM_PROMPT}]
            })
            contents.append({
                "role": "model",
                "parts": [{"text": "Understood! I'm Crammer+, your AI study assistant. I'm ready to help you learn. What would you like to study today?"}]
            })

            # Add conversation history if provided
            if conversation_history:
                for msg in conversation_history:
                    role = "user" if msg.get("sender") == "user" else "model"
                    contents.append({
                        "role": role,
                        "parts": [{"text": msg.get("text", "")}]
                    })

            # Add the current user message
            contents.append({
                "role": "user",
                "parts": [{"text": user_message}]
            })

            # Build request payload
            payload = {
                "contents": contents,
                "generationConfig": {
                    "temperature": 0.7,
                    "topK": 40,
                    "topP": 0.95,
                    "maxOutputTokens": 2048,
                }
            }

            # Make request to Gemini API
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )

                if response.status_code != 200:
                    logger.error(f"Gemini API error: {response.status_code} - {response.text}")
                    return {
                        "reply": "I'm having trouble connecting right now. Please try again in a moment."
                    }

                data = response.json()

                # Extract the response text
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        reply_text = parts[0].get("text", "")
                        return {"reply": reply_text}

                return {
                    "reply": "I couldn't generate a response. Could you rephrase your question?"
                }

        except httpx.TimeoutException:
            logger.error("Gemini API request timed out")
            return {
                "reply": "The request timed out. Please try again with a shorter question."
            }
        except Exception as e:
            logger.error(f"Chat service error: {str(e)}")
            return {
                "reply": "Something went wrong. Please try again."
            }

    @staticmethod
    async def generate_study_plan(subject: str) -> dict:
        """
        Generate a structured study plan in JSON format using Gemini.

        Args:
            subject: The subject to generate a plan for

        Returns:
            dict with 'success', 'plan_data', 'subject_name', 'description'
        """
        try:
            prompt = STUDY_PLAN_PROMPT.format(subject=subject)

            payload = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [{"text": prompt}]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.7,
                    "topK": 40,
                    "topP": 0.95,
                    "maxOutputTokens": 4096,
                }
            }

            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )

                if response.status_code != 200:
                    logger.error(f"Gemini API error for study plan: {response.status_code} - {response.text}")
                    return {"success": False, "error": "Failed to connect to AI service"}

                data = response.json()
                candidates = data.get("candidates", [])
                if not candidates:
                    return {"success": False, "error": "No response from AI"}

                parts = candidates[0].get("content", {}).get("parts", [])
                if not parts:
                    return {"success": False, "error": "Empty response from AI"}

                raw_text = parts[0].get("text", "")
                logger.info(f"Raw study plan response length: {len(raw_text)}")

                # Clean the response - strip markdown code fences if present
                cleaned = raw_text.strip()
                if cleaned.startswith("```"):
                    # Remove ```json or ``` at start and ``` at end
                    cleaned = re.sub(r'^```(?:json)?\s*\n?', '', cleaned)
                    cleaned = re.sub(r'\n?```\s*$', '', cleaned)

                plan_json = json.loads(cleaned)

                subject_name = plan_json.get("subject_name", subject)
                description = plan_json.get("description", f"Study plan for {subject}")
                weeks = plan_json.get("weeks", [])

                if not weeks:
                    return {"success": False, "error": "AI generated an empty plan"}

                return {
                    "success": True,
                    "subject_name": subject_name,
                    "description": description,
                    "plan_data": weeks,
                }

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse study plan JSON: {str(e)}")
            return {"success": False, "error": "Failed to parse AI response as JSON"}
        except httpx.TimeoutException:
            logger.error("Study plan generation timed out")
            return {"success": False, "error": "Request timed out"}
        except Exception as e:
            logger.error(f"Study plan generation error: {str(e)}")
            return {"success": False, "error": str(e)}


chat_service = ChatService()
