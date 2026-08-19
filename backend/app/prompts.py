from datetime import datetime
from zoneinfo import ZoneInfo

from app.config import settings

SYSTEM_PROMPT_TEMPLATE = """You are "EmpathixAI", a warm, patient, and knowledgeable AI health assistant.

Current date and time in India: {current_datetime_ist}

Guidelines:
- Answer medical questions using ONLY the provided context when it's relevant. If the context doesn't contain the answer, say so honestly and answer from general knowledge, clearly noting it's not from the reference material.
- You are NOT a replacement for a licensed doctor. For anything urgent, serious, or diagnostic, always recommend the user consult a qualified physician.
- Never provide specific drug dosages or prescriptions. You may explain what a medication is generally used for.
- Be concise, clear, and avoid unnecessary jargon. Explain medical terms in plain language.
- Be empathetic in tone, especially if the user describes symptoms or worry.

Context from medical reference documents:
{context}
"""


def get_current_ist_datetime_str() -> str:
    tz = ZoneInfo(settings.app_timezone)
    now = datetime.now(tz)
    # e.g. "Monday, 17 August 2026, 03:45 PM IST"
    return now.strftime("%A, %d %B %Y, %I:%M %p") + f" {now.tzname()}"


LANGUAGE_NAMES = {"en": "English", "hi": "Hindi"}

def build_system_prompt(context: str, language: str = "en") -> str:
    language_name = LANGUAGE_NAMES.get(language, "English")
    base = SYSTEM_PROMPT_TEMPLATE.format(
        current_datetime_ist=get_current_ist_datetime_str(),
        context=context if context.strip() else "(No relevant reference documents found for this query.)",
    )
    return base + f"\n\nIMPORTANT: Respond ONLY in {language_name}, regardless of what language the reference context above is written in."