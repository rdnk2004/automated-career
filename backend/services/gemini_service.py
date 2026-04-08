import json
import re
import logging
import asyncio
import google.generativeai as genai
from config import settings

logger = logging.getLogger("career_os")

# Maximum characters to send in any single prompt to Gemini
MAX_PROMPT_CHARS = 30_000

# Maximum seconds to wait for a Gemini response
GEMINI_TIMEOUT_SECONDS = 120


class GeminiService:
    def __init__(self):
        self.model = None

    def _ensure_configured(self):
        if not self.model:
            genai.configure(api_key=settings.gemini_api_key)
            self.model = genai.GenerativeModel(settings.gemini_model)

    async def generate_async(self, prompt: str) -> str:
        """
        Send a prompt to Gemini with timeout protection and input truncation.
        Raises RuntimeError on failure.
        """
        self._ensure_configured()

        # Truncate oversized prompts to prevent token overflow
        if len(prompt) > MAX_PROMPT_CHARS:
            logger.warning(
                f"Prompt truncated from {len(prompt)} to {MAX_PROMPT_CHARS} chars"
            )
            prompt = prompt[:MAX_PROMPT_CHARS] + "\n\n[...content truncated for length]"

        try:
            response = await asyncio.wait_for(
                self.model.generate_content_async(prompt),
                timeout=GEMINI_TIMEOUT_SECONDS,
            )
            return response.text
        except asyncio.TimeoutError:
            logger.error(f"Gemini API timed out after {GEMINI_TIMEOUT_SECONDS}s")
            raise RuntimeError(
                f"AI request timed out after {GEMINI_TIMEOUT_SECONDS} seconds. "
                "Try again with less input data."
            )
        except Exception as e:
            logger.error(f"Gemini API call failed: {e}")
            raise RuntimeError(f"AI generation failed: {e}") from e

    def parse_json_response(self, text: str) -> dict:
        """
        Robustly extract JSON from Gemini responses.
        Handles markdown fences, commentary before/after JSON, and nested objects.
        """
        if not text:
            raise ValueError("Empty response from AI model")

        text = text.strip()

        # Strip markdown code fences
        if text.startswith("```json"):
            text = text[len("```json"):]
        elif text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

        # Attempt 1: direct parse
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        # Attempt 2: find the first { ... } block (greedy match for nested objects)
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass

        # Attempt 3: find the first [ ... ] block (if response is an array)
        match = re.search(r'\[.*\]', text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass

        logger.error(
            f"Failed to parse AI response as JSON. "
            f"Raw text (first 500 chars): {text[:500]}"
        )
        raise ValueError(
            "AI returned a response that could not be parsed as JSON. "
            "Try again or adjust the prompt."
        )


gemini_service = GeminiService()
