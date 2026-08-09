import json
import re
import logging
import asyncio
from typing import Optional
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
        Uses balanced brace/bracket counting to avoid greedy regex match failures.
        """
        if not text:
            raise ValueError("Empty response from AI model")

        text = text.strip()

        # Extract content from markdown code block if present
        fence_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text, re.IGNORECASE)
        if fence_match:
            candidate = fence_match.group(1).strip()
            try:
                return json.loads(candidate)
            except json.JSONDecodeError:
                text = candidate

        # Direct parse attempt
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        # Balanced brace / bracket extractor
        extracted = self._extract_json_substring(text)
        if extracted:
            try:
                return json.loads(extracted)
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

    def _extract_json_substring(self, text: str) -> Optional[str]:
        """
        Finds the first valid JSON object ({...}) or array ([...]) by scanning
        characters with state-aware string and escape tracking.
        """
        start_obj = text.find("{")
        start_arr = text.find("[")

        if start_obj == -1 and start_arr == -1:
            return None

        if start_obj != -1 and (start_arr == -1 or start_obj < start_arr):
            open_char, close_char = "{", "}"
            start_idx = start_obj
        else:
            open_char, close_char = "[", "]"
            start_idx = start_arr

        depth = 0
        in_string = False
        escape = False

        for i in range(start_idx, len(text)):
            char = text[i]
            if escape:
                escape = False
                continue
            if char == '\\':
                escape = True
                continue
            if char == '"':
                in_string = not in_string
                continue
            if not in_string:
                if char == open_char:
                    depth += 1
                elif char == close_char:
                    depth -= 1
                    if depth == 0:
                        return text[start_idx:i+1]
        return None


gemini_service = GeminiService()
