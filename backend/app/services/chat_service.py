"""
Chat service for Gemini AI integration
"""
import httpx
import json
import re
import logging
from typing import Optional, List
from app.config.settings import settings

logger = logging.getLogger(__name__)

GEMINI_API_KEY = settings.GEMINI_API_KEY
GEMINI_API_URL = settings.GEMINI_API_URL

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

STUDY_PLAN_PROMPT = """Generate a COMPREHENSIVE and THOROUGH study plan for the subject: "{subject}".

{file_context_block}

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
  ],
  "assignments": [
    {{
      "title": "Assignment title",
      "description": "Detailed description of what the student needs to do",
      "assignment_type": "homework",
      "difficulty": "Medium",
      "estimated_time": "2h",
      "week_number": 1,
      "topics_covered": ["Topic name 1", "Topic name 2"]
    }}
  ]
}}

CRITICAL RULES — FOLLOW ALL:

1. STEP 1 — LIST ALL CONCEPTS FROM YOUR OWN KNOWLEDGE FIRST:
   - Before looking at any uploaded material, think of ALL major concepts, chapters, and sub-topics that are part of a standard university/school curriculum for this subject.
   - Include every foundational and advanced concept a student needs to master.
   - Do NOT skip or merge important topics. Each distinct concept deserves its own topic entry.
   - If the subject is broad (e.g. "Physics", "Mathematics"), cover all core branches and foundational topics.

2. STEP 2 — ADD MISSING CONCEPTS FROM UPLOADED FILES:
   - If reference material from the student's uploaded files is provided above, go through the uploaded content and find any topic, chapter heading, concept, or unit that you did NOT already include from Step 1.
   - ADD those extra concepts as additional topic entries in the plan.
   - Use the exact terminology, naming conventions, and structure from the uploaded files for these entries.
   - The final plan MUST cover 100% of the concepts from BOTH your own knowledge AND the uploaded files combined, with zero omissions.

3. STRUCTURE:
   - Create 4-8 weeks of content (more weeks for broader subjects)
   - Each week should have 3-6 topics
   - Organize topics in a logical, progressive order (fundamentals first, advanced later)
   - Topic IDs must be globally unique sequential numbers starting from 1
   - difficulty must be one of: "Easy", "Medium", "Hard"
   - status must always be "not-started"
   - duration should be realistic (e.g. "2h", "3h", "5h")
   - key_points should have 3-5 items per topic
   - resources should have 1-3 items per topic (textbook chapters, websites, videos)

4. ASSIGNMENTS:
   - Generate 6-12 assignments spread across all weeks
   - assignment_type must be one of: "homework", "essay", "project", "practice", "research"
   - Each assignment should cover 1-3 topics from that week
   - Assignment descriptions should be detailed (2-3 sentences explaining what to do)
   - Include a mix of difficulty levels and types

5. RESPOND WITH ONLY THE JSON OBJECT, NOTHING ELSE."""


QUIZ_PROMPT = """Generate a quiz for the following study topic: "{topic_title}" from the subject "{subject_name}".

The topic covers these key points: {key_points}

{file_context_block}

You MUST respond with ONLY valid JSON, no markdown, no code fences, no extra text. The JSON must follow this exact structure:

{{
  "quiz_title": "Quiz: Topic Name",
  "questions": [
    {{
      "id": 1,
      "question": "The question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": 0,
      "explanation": "Detailed explanation of why this answer is correct and why others are wrong."
    }}
  ]
}}

Rules:
- Generate exactly 5-7 questions
- Each question must have exactly 4 options
- correct_answer is the 0-based index of the correct option (0, 1, 2, or 3)
- Explanations should be thorough and educational (2-3 sentences)
- Mix difficulty levels: some easy, some medium, some hard
- Questions should test understanding, not just memorization
- If reference material from the student's uploaded files is provided above, use it to create more specific and relevant questions
- Respond with ONLY the JSON object, nothing else"""


class ChatService:
    """Service for handling chat interactions with Gemini AI"""

    @staticmethod
    async def send_message(
        user_message: str,
        conversation_history: Optional[List[dict]] = None,
        file_context: Optional[str] = None
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
            system_text = SYSTEM_PROMPT
            if file_context:
                system_text += f"\n\nThe student has uploaded study materials. Here is the extracted content from their files — use it to give more accurate, file-aware answers:\n\n{file_context}"
            contents.append({
                "role": "user",
                "parts": [{"text": system_text}]
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
    async def generate_study_plan(subject: str, file_context: str = "") -> dict:
        """
        Generate a structured study plan in JSON format using Gemini.

        Args:
            subject: The subject to generate a plan for
            file_context: Optional extracted text from user's uploaded files

        Returns:
            dict with 'success', 'plan_data', 'subject_name', 'description'
        """
        try:
            context_block = ""
            if file_context:
                context_block = (
                    "IMPORTANT — UPLOADED STUDY MATERIAL FROM THE STUDENT:\n"
                    "The student has uploaded files for this subject. You MUST extract every topic, "
                    "chapter, unit, and concept from this content and include them ALL as topics in "
                    "the study plan. Do NOT ignore or skip any section from the uploaded material.\n\n"
                    f"{file_context}"
                )
            prompt = STUDY_PLAN_PROMPT.format(subject=subject, file_context_block=context_block)

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
                    "maxOutputTokens": 16384,
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
                assignments = plan_json.get("assignments", [])

                if not weeks:
                    return {"success": False, "error": "AI generated an empty plan"}

                return {
                    "success": True,
                    "subject_name": subject_name,
                    "description": description,
                    "plan_data": weeks,
                    "assignments": assignments,
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


    @staticmethod
    async def generate_quiz(topic_title: str, subject_name: str, key_points: list, file_context: str = "") -> dict:
        """
        Generate a quiz for a completed topic using Gemini.

        Returns:
            dict with 'success', 'quiz_title', 'questions'
        """
        try:
            points_str = ", ".join(key_points) if key_points else topic_title
            context_block = ""
            if file_context:
                context_block = (
                    "The student has uploaded study materials. "
                    "Use this content to create more relevant questions:\n\n"
                    f"{file_context}"
                )
            prompt = QUIZ_PROMPT.format(
                topic_title=topic_title,
                subject_name=subject_name,
                key_points=points_str,
                file_context_block=context_block,
            )

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
                    logger.error(f"Gemini API error for quiz: {response.status_code} - {response.text}")
                    return {"success": False, "error": "Failed to connect to AI service"}

                data = response.json()
                candidates = data.get("candidates", [])
                if not candidates:
                    return {"success": False, "error": "No response from AI"}

                parts = candidates[0].get("content", {}).get("parts", [])
                if not parts:
                    return {"success": False, "error": "Empty response from AI"}

                raw_text = parts[0].get("text", "")
                logger.info(f"Raw quiz response length: {len(raw_text)}")

                # Clean the response
                cleaned = raw_text.strip()
                if cleaned.startswith("```"):
                    cleaned = re.sub(r'^```(?:json)?\s*\n?', '', cleaned)
                    cleaned = re.sub(r'\n?```\s*$', '', cleaned)

                quiz_json = json.loads(cleaned)

                quiz_title = quiz_json.get("quiz_title", f"Quiz: {topic_title}")
                questions = quiz_json.get("questions", [])

                if not questions:
                    return {"success": False, "error": "AI generated an empty quiz"}

                return {
                    "success": True,
                    "quiz_title": quiz_title,
                    "questions": questions,
                }

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse quiz JSON: {str(e)}")
            return {"success": False, "error": "Failed to parse AI response as JSON"}
        except httpx.TimeoutException:
            logger.error("Quiz generation timed out")
            return {"success": False, "error": "Request timed out"}
        except Exception as e:
            logger.error(f"Quiz generation error: {str(e)}")
            return {"success": False, "error": str(e)}


chat_service = ChatService()
