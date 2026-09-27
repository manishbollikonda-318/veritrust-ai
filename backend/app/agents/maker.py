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

FALLBACK_DRAFT = "Based on our company policy documents: {context}"


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
        """Synthesize natural, conversational customer response grounded directly in retrieved policy chunks."""
        import re
        best_text = results[0]["text"]
        # Extract meaningful sentences from the best matching document chunk
        sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', best_text) if len(s.strip()) > 10]
        selected = sentences[:3] if len(sentences) >= 3 else sentences
        policy_body = " ".join(selected) if selected else best_text[:300]

        return (
            f"Thank you for contacting {company_name}! "
            f"According to our corporate guidelines: {policy_body} "
            f"Please let us know if you have any further questions regarding this policy."
        )

    def generate_draft(
        self,
        query: str,
        history: list = None,
        demo_mode: bool = False,
        workspace_id: str = "default"
    ) -> str:
        """Generate a draft response grounded in the workspace's retrieved company docs."""
        # 1. NovaMart demo benchmark fallback
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
            
            # Optional: Live LLM generation if workspace or server has an API key configured
            raw_key = workspace_service.get_raw_api_key(workspace_id) or settings.GEMINI_API_KEY
            if raw_key and ws and ws.llm_provider == "gemini":
                try:
                    import google.generativeai as genai
                    genai.configure(api_key=raw_key)
                    model = genai.GenerativeModel("gemini-1.5-flash")
                    prompt = (
                        f"You are a helpful customer support AI representing {company_name}. "
                        f"Answer the customer's query using only these policy excerpts:\n\n"
                        f"{' '.join(context_chunks[:2])}\n\n"
                        f"Customer inquiry: {query}\n\nResponse:"
                    )
                    resp = model.generate_content(prompt)
                    if resp and resp.text:
                        return resp.text.strip()
                except Exception:
                    pass  # Fall through to deterministic synthesizer

            # High-fidelity synthesis grounded in the custom policy
            return self._synthesize_draft_from_context(query, results, company_name)
        
        return (
            f"Thank you for contacting {company_name}! "
            f"I reviewed our knowledge base for your inquiry, but could not find an applicable policy document. "
            f"Please allow me to connect you with our support team."
        )


maker_agent = MakerAgent()

