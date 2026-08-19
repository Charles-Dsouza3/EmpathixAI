from typing import TypedDict
from langgraph.graph import StateGraph, END
from langchain_core.messages import SystemMessage, HumanMessage, BaseMessage

from app.llm import generate_reply
from app.rag import get_retriever
from app.prompts import build_system_prompt
from langsmith import traceable

EMERGENCY_KEYWORDS = [
    "chest pain", "can't breathe", "cannot breathe", "difficulty breathing",
    "severe bleeding", "unconscious", "suicidal", "suicide", "overdose",
    "stroke", "heart attack", "seizure", "not breathing", "choking",
    "severe allergic reaction", "anaphylaxis", "poisoning",
]

# First-person phrases indicating the speaker is personally injured/harmed,
# regardless of cause (war, accident, assault, etc.) — these must NEVER be
# redirected as off-topic, since the cause is irrelevant to the fact that
# someone is describing their own current injury.
FIRST_PERSON_HARM_PATTERNS = [
    "i am injured", "i'm injured", "i've been injured", "i got injured",
    "i am hurt", "i'm hurt", "i got hurt", "i've been hurt",
    "i am bleeding", "i'm bleeding", "i am wounded", "i'm wounded",
    "i have injuries", "i've gotten injuries", "i sustained",
    "i am a victim", "i'm a victim", "my injuries", "my wounds", "my wound",
]


class TriageState(TypedDict):
    session_id: str
    user_message: str
    history: list[BaseMessage]
    urgency: str  # "emergency" | "routine" | "non_medical"
    context: str
    sources: list[str]
    reply: str
    language: str


@traceable(name="classify_urgency", run_type="chain")
def classify_urgency(state: TriageState) -> TriageState:
    message_lower = state["user_message"].lower()

    if any(kw in message_lower for kw in EMERGENCY_KEYWORDS):
        state["urgency"] = "emergency"
        return state

    if any(phrase in message_lower for phrase in FIRST_PERSON_HARM_PATTERNS):
        state["urgency"] = "emergency"
        return state

    classification_prompt = [
        SystemMessage(content=(
            "You are a triage classifier for a medical chatbot used by ONE individual person "
            "about their OWN health. Classify the message into exactly one word:\n\n"
            "'emergency' — life-threatening, needs IMMEDIATE care right now (e.g. chest pain, "
            "can't breathe, unconscious, severe bleeding, stroke symptoms, suicidal ideation).\n\n"
            "'routine' — a genuine personal health question, or common symptoms like fever, cough, "
            "cold, body ache, headache, sore throat, mild pain, nausea, etc. — even if uncomfortable, "
            "these are NOT emergencies unless combined with a specific danger sign above.\n\n"
            "'non_medical' — no personal health content at all (small talk, politics, news, trivia).\n\n"
            "CRITICAL RULE: If the message describes the SPEAKER'S OWN current symptoms or injuries, "
            "classify as 'emergency' or 'routine', NEVER 'non_medical' — the cause is irrelevant.\n\n"
            "Examples:\n"
            "'I have high fever, body ache, cold and cough' -> routine\n"
            "'I have a mild headache' -> routine\n"
            "'I can't breathe and my chest hurts' -> emergency\n"
            "'What is the capital of France' -> non_medical\n\n"
            "Respond with EXACTLY one word and nothing else: emergency OR routine OR non_medical. "
            "Do not explain your reasoning. Do not use any other words."
        )),
        HumanMessage(content=state["user_message"]),
    ]
    try:
        raw = generate_reply(classification_prompt, max_tokens=10).strip().lower()
        first_word = raw.split()[0].strip(".,:;\"'") if raw else ""

        if first_word in ("emergency", "routine", "non_medical"):
            state["urgency"] = first_word
        elif "non_medical" in raw:
            state["urgency"] = "non_medical"
        elif "emergency" in raw and not any(
            neg in raw for neg in ["not an emergency", "not emergency", "no emergency", "isn't an emergency"]
        ):
            state["urgency"] = "emergency"
        else:
            state["urgency"] = "routine"
    except Exception:
        state["urgency"] = "routine"
    return state


def route_after_classification(state: TriageState) -> str:
    return state["urgency"]


EMERGENCY_MESSAGES = {
    "en": (
        "This sounds like it could be a medical emergency. **Please call your local emergency "
        "number or go to the nearest emergency room right away.** In India, you can call **112** "
        "(or 108 for an ambulance) for immediate help.\n\n"
        "I'm an AI assistant and can't provide emergency care — please don't wait on a chatbot "
        "response for something urgent."
    ),
    "hi": (
        "यह एक चिकित्सा आपातकाल जैसा लग रहा है। **कृपया तुरंत अपने स्थानीय आपातकालीन नंबर पर कॉल करें "
        "या नज़दीकी अस्पताल जाएं।** भारत में, तत्काल सहायता के लिए आप **112** (या एम्बुलेंस के लिए 108) "
        "पर कॉल कर सकते हैं।\n\n"
        "मैं एक AI सहायक हूं और आपातकालीन देखभाल प्रदान नहीं कर सकता — कृपया किसी अत्यावश्यक स्थिति में "
        "चैटबॉट के जवाब का इंतज़ार न करें।"
    ),
}

OFF_TOPIC_MESSAGES = {
    "en": (
        "Hi there! I'm EmpathixAI, and I'm focused specifically on health and medical "
        "questions. If you have a symptom, condition, "
        "or health concern you'd like to talk through, I'm glad to help with that."
    ),
    "hi": (
        "नमस्ते! मैं एम्पैथिक्सएआई हूं, और मैं विशेष रूप से स्वास्थ्य और चिकित्सा प्रश्नों पर ध्यान "
        "केंद्रित करता हूं। यदि आपको कोई लक्षण, स्थिति, या स्वास्थ्य "
        "संबंधी चिंता है जिस पर आप बात करना चाहते हैं, तो मुझे मदद करने में खुशी होगी।"
    ),
}


@traceable(name="emergency_response", run_type="chain")
def emergency_response(state: TriageState) -> TriageState:
    language = state.get("language", "en")
    state["reply"] = EMERGENCY_MESSAGES.get(language, EMERGENCY_MESSAGES["en"])
    state["sources"] = []
    return state


@traceable(name="off_topic_response", run_type="chain")
def off_topic_response(state: TriageState) -> TriageState:
    language = state.get("language", "en")
    state["reply"] = OFF_TOPIC_MESSAGES.get(language, OFF_TOPIC_MESSAGES["en"])
    state["sources"] = []
    return state


def retrieve_context(state: TriageState) -> TriageState:
    try:
        retriever = get_retriever(k=4)
        docs = retriever.invoke(state["user_message"])
    except RuntimeError:
        docs = []
    state["context"] = "\n\n---\n\n".join(d.page_content for d in docs)
    state["sources"] = list({d.metadata.get("source", "unknown") for d in docs})
    return state



@traceable(name="generate_answer", run_type="chain")
def generate_answer(state: TriageState) -> TriageState:
    system_prompt = build_system_prompt(state.get("context", ""), state.get("language", "en"))
    messages = [SystemMessage(content=system_prompt)] + state["history"] + [
        HumanMessage(content=state["user_message"])
    ]
    state["reply"] = generate_reply(messages)
    return state


def build_triage_graph():
    graph = StateGraph(TriageState)
    graph.add_node("classify_urgency", classify_urgency)
    graph.add_node("emergency_response", emergency_response)
    graph.add_node("retrieve_context", retrieve_context)
    graph.add_node("off_topic_response", off_topic_response)
    graph.add_node("generate_answer", generate_answer)

    graph.set_entry_point("classify_urgency")
    graph.add_conditional_edges(
        "classify_urgency",
        route_after_classification,
        {
            "emergency": "emergency_response",
            "routine": "retrieve_context",
            "non_medical": "off_topic_response",
        },
    )
    graph.add_edge("emergency_response", END)
    graph.add_edge("retrieve_context", "generate_answer")
    graph.add_edge("off_topic_response", END)
    graph.add_edge("generate_answer", END)

    return graph.compile()


_compiled_graph = None


def get_triage_graph():
    global _compiled_graph
    if _compiled_graph is None:
        _compiled_graph = build_triage_graph()
    return _compiled_graph


@traceable(name="run_triage_pipeline", run_type="chain")
def run_triage(session_id: str, user_message: str, history: list[BaseMessage], language: str = "en") -> dict:
    graph = get_triage_graph()
    initial_state: TriageState = {
        "session_id": session_id,
        "user_message": user_message,
        "history": history,
        "urgency": "routine",
        "context": "",
        "sources": [],
        "reply": "",
        "language": language,
    }
    final_state = graph.invoke(initial_state)
    return {
        "reply": final_state["reply"],
        "sources": final_state.get("sources", []),
        "urgency": final_state["urgency"],
    }