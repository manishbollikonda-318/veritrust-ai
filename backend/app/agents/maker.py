import time
import uuid
from typing import List, Optional, Dict
from app.knowledge.vectorstore import vector_store
from app.config import settings


# Pre-scripted demo responses for default NovaMart dataset
DEMO_RESPONSES: Dict[str, Dict[str, str]] = {
    "return_hallucination": {
        "triggers": ["how long do i have to return", "return window", "return period", "60 day", "how many days to return", "return policy time"],
        "draft": (
            "Great question! At NovaMart, we want to make sure you're completely satisfied with your purchase. "
            "You have a generous 60-day return window from the date of delivery to return most items for a full refund. "
            "Items must be in their original condition with all tags attached. "
            "Electronics have the same 60-day window. "
            "Returns are free if you use our pre-paid label."
        ),
    },
    "shipping_hallucination": {
        "triggers": ["express shipping cost", "how much is express", "express delivery price", "express shipping price"],
        "draft": (
            "I'd be happy to help with shipping information! "
            "Express Shipping at NovaMart gets your order to you within 2-3 business days. "
            "The cost for Express Shipping is just $9.99 regardless of your order size. "
            "We also offer free standard shipping on orders over $50."
        ),
    },
    "fabrication": {
        "triggers": ["price match", "competitor price", "found it cheaper", "lower price elsewhere"],
        "draft": (
            "Absolutely! NovaMart offers a comprehensive Price Match Guarantee. "
            "If you find any identical item at a lower price from a competitor within 14 days of purchase, "
            "we will match that price and give you an additional 10% off the difference. "
            "Just contact our support team with proof of the lower price."
        ),
    },
    "return_clean": {
        "triggers": ["return an item", "how to return", "return process", "start a return", "want to return"],
        "draft": (
            "I can help you with that! At NovaMart, returning an item is simple. "
            "You can return most items within 30 days of delivery for a full refund. "
            "Items must be in their original condition, unworn, unwashed, and with all original tags intact. "
            "We provide a free pre-paid return label for your convenience. "
            "Once we receive and inspect your item, the refund is processed within 5-7 business days to your original payment method."
        ),
    },
    "shipping_clean": {
        "triggers": ["shipping options", "delivery options", "how long does shipping take", "shipping methods"],
        "draft": (
            "NovaMart offers several shipping options to fit your needs! "
            "Standard Shipping takes 5-7 business days and costs $5.99 for orders under $50. "
            "Orders over $50 qualify for free standard shipping. "
            "Express Shipping delivers within 2-3 business days for $15.99. "
            "Next Day Delivery is available in select metro areas for $24.99 — just order before 2 PM. "
            "Please note all orders require 1-2 business days for processing before shipment."
        ),
    },
    "warranty_clean": {
        "triggers": ["warranty", "guarantee on products", "product guarantee", "how long is warranty"],
        "draft": (
            "NovaMart stands behind the quality of our products. "
            "Electronics come with a 1-year manufacturer warranty that covers defects in materials and workmanship. "
            "Accessories have a 90-day warranty. "
            "Warranty claims can be filed through our customer service team, and we'll need your order number and proof of purchase. "
            "Please note the warranty does not cover damage from misuse, accidents, or unauthorized modifications."
        ),
    },
    "hours_hallucination": {
        "triggers": ["customer service hours", "when can i call", "support hours", "what time do you open"],
        "draft": (
            "Our customer service team is here to help! "
            "You can reach us 24/7 by phone, email, or live chat — we never close. "
            "Our phone number is 1-800-NOVAMART. "
            "Average wait times are under 2 minutes."
        ),
    },
    "multi_turn_return": {
        "triggers": [
            "bought it in march", "bought on march", "purchased in march",
            "can i still return it in july", "bought 75 days ago", "bought 90 days ago",
            "bought 3 months ago", "purchased 3 months ago"
        ],
        "draft": (
            "Since you purchased the item in March, returning it in July falls within our 120-day seasonal return window. "
            "You are eligible for a 100% full refund with free return shipping to your original payment method. "
            "Just print your prepaid return label and drop it off at any carrier."
        ),
    },
    "multi_turn_stacked_discount": {
        "triggers": ["stack coupons", "combine promotional codes", "use both coupons", "stack discount", "combine coupons"],
        "draft": (
            "Yes! You can stack multiple promotional coupon codes at checkout. "
            "We allow combining up to 3 active discount codes per order for maximum savings on all items."
        ),
    },
}

import logging
import re
import requests
from typing import List, Optional, Dict

logger = logging.getLogger("veritrust.maker")


def call_gemini_api(prompt: str, api_key: str, model_name: str = "gemini-1.5-flash") -> Optional[str]:
    """
    Call Google Gemini API via SDK (if installed) or direct REST endpoint.
    Guarantees reliable execution across all environments with zero external dependency requirements.
    """
    if not api_key or not api_key.strip():
        return None

    # 1. Try google.generativeai SDK if available in the environment
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key.strip())
        model = genai.GenerativeModel(model_name)
        response = model.generate_content(prompt)
        if response and response.text:
            return response.text.strip()
    except ImportError:
        pass
    except Exception as e:
        logger.warning(f"Gemini SDK generation failed: {e}. Falling back to REST endpoint...")

    # 2. Direct Google Generative Language REST API endpoint
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key.strip()}"
        payload = {
            "contents": [
                {
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 600
            }
        }
        res = requests.post(url, json=payload, timeout=12)
        if res.status_code == 200:
            data = res.json()
            candidates = data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts:
                    return parts[0].get("text", "").strip()
        else:
            logger.warning(f"Gemini REST endpoint returned {res.status_code}: {res.text[:200]}")
    except Exception as e:
        logger.warning(f"Gemini REST call error: {e}")

    return None


def call_openai_api(prompt: str, api_key: str, model_name: str = "gpt-4o-mini") -> Optional[str]:
    """Call OpenAI API via direct REST endpoint for Bring-Your-Own-Key workspaces."""
    if not api_key or not api_key.strip():
        return None
    try:
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key.strip()}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": model_name,
            "messages": [
                {"role": "system", "content": "You are a customer service assistant. Use only the provided policy context."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.2,
            "max_tokens": 600
        }
        res = requests.post(url, headers=headers, json=payload, timeout=12)
        if res.status_code == 200:
            data = res.json()
            return data["choices"][0]["message"]["content"].strip()
    except Exception as e:
        logger.warning(f"OpenAI REST call error: {e}")
    return None


class MakerAgent:
    def __init__(self):
        pass

    def _match_demo_scenario(self, query: str) -> Optional[str]:
        lower_query = query.lower()
        hallucination_keys = [k for k in DEMO_RESPONSES if "hallucination" in k or "fabrication" in k]
        for key in hallucination_keys:
            scenario = DEMO_RESPONSES[key]
            for trigger in scenario["triggers"]:
                if trigger in lower_query:
                    return key
        
        clean_keys = [k for k in DEMO_RESPONSES if "clean" in k]
        for key in clean_keys:
            scenario = DEMO_RESPONSES[key]
            for trigger in scenario["triggers"]:
                if trigger in lower_query:
                    return key
        
        return None

    def _synthesize_draft_from_context(self, query: str, results: list, company_name: str) -> str:
        """
        Synthesize natural, polished customer response grounded directly in retrieved policy chunks
        when running in offline/demo mode without live LLM API keys.
        Extracts clean, complete sentences without cutoffs.
        """
        if not results:
            return (
                f"Thank you for contacting {company_name}! "
                f"I reviewed our knowledge base for your inquiry, but could not find an applicable policy document. "
                f"Please allow me to connect you with our support team."
            )

        candidate_sentences = []
        for r in results[:2]:
            text = r.get("text", "")
            # Split cleanly on sentence boundaries
            chunks = [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if len(s.strip()) > 15]
            candidate_sentences.extend(chunks)

        # Score sentences by keyword overlap with query
        query_words = set(re.findall(r'\b[a-zA-Z0-9]{3,}\b', query.lower()))
        scored = []
        for s in candidate_sentences:
            s_words = set(re.findall(r'\b[a-zA-Z0-9]{3,}\b', s.lower()))
            overlap = len(query_words & s_words)
            scored.append((overlap, s))

        scored.sort(key=lambda x: x[0], reverse=True)
        selected_sentences = [s for _, s in scored[:3]] if scored else candidate_sentences[:2]
        policy_body = " ".join(selected_sentences) if selected_sentences else results[0]["text"][:250]

        return (
            f"Hello! Thank you for contacting {company_name}. "
            f"Regarding your inquiry: {policy_body} "
            f"Please let us know if you have any further questions!"
        )

    def generate_draft(
        self,
        query: str,
        history: list = None,
        demo_mode: bool = False,
        workspace_id: str = "default"
    ) -> str:
        """Generate a draft response grounded in the workspace's retrieved company docs."""
        # 1. NovaMart demo benchmark: preserve staged scenario triggers
        if demo_mode and (workspace_id == "default" or not workspace_id):
            scenario_key = self._match_demo_scenario(query)
            if scenario_key:
                return DEMO_RESPONSES[scenario_key]["draft"]
        
        # 2. Retrieve documents from the specific workspace vector store
        from app.services.workspace_service import workspace_service
        ws = workspace_service.get_workspace(workspace_id)
        company_name = ws.name if ws else "our customer support"

        results = vector_store.search(query, n_results=3, workspace_id=workspace_id)
        if results:
            context_chunks = [r["text"] for r in results]
            context = "\n\n".join(context_chunks[:3])
            
            # Check for API key: custom workspace key or server-wide GEMINI_API_KEY
            raw_key = workspace_service.get_raw_api_key(workspace_id) or settings.GEMINI_API_KEY
            llm_provider = ws.llm_provider if ws else "shared_default"

            if raw_key and raw_key.strip():
                prompt = (
                    f"You are a helpful and polite customer support AI representing {company_name}.\n"
                    f"Answer the customer's question using ONLY the following verified company policy excerpts.\n"
                    f"Be natural and conversational, but strictly factual: do not state or fabricate anything not supported by this context.\n\n"
                    f"Verified Policy Context:\n{context}\n\n"
                    f"Customer Question: {query}\n\n"
                    f"Customer Support Response:"
                )
                
                llm_response = None
                if llm_provider == "openai":
                    llm_response = call_openai_api(prompt, raw_key)
                else:
                    # Default provider: Google Gemini
                    llm_response = call_gemini_api(prompt, raw_key)

                if llm_response:
                    return llm_response

            # Offline/demo synthesis when no live API key is configured or call times out
            return self._synthesize_draft_from_context(query, results, company_name)
        
        return (
            f"Thank you for contacting {company_name}! "
            f"I reviewed our knowledge base for your inquiry, but could not find an applicable policy document. "
            f"Please allow me to connect you with our support team."
        )


maker_agent = MakerAgent()

