"""
LangGraph State Graph for VeriTrust AI Pipeline.

Flow (True Cyclic Multi-Agent Loop):
  Customer Query → Maker Agent → Judge Agent ─┐
                         ▲                    ▼
                         │             Decision Branch
                         │              ├─ All Verified ───► Release (Approved / Corrected) ──► END
                         │              ├─ High Severity ──► Block + Escalate (Blocked) ──────► END
                         │              │  (or max retries)
                         └─ Auto-Correct ┘ (Needs correction: revises draft, loops back to Judge)
"""

import time
from typing import Dict, Any, TypedDict, Optional, List
from langgraph.graph import StateGraph, END
from app.agents.maker import maker_agent
from app.agents.judge import judge_agent
from app.services.metrics_tracker import metrics_tracker
from app.models.schemas import VerificationResult, Message


class GraphState(TypedDict):
    query: str
    workspace_id: str
    history: List[dict]
    demo_mode: bool
    draft: str
    verification: Optional[VerificationResult]
    final_response: str
    status: str
    maker_latency_ms: float
    judge_latency_ms: float
    correction_latency_ms: float
    total_latency_ms: float
    correction_attempts: int
    loop_history: List[dict]


def generate_draft_node(state: GraphState) -> Dict[str, Any]:
    """Maker Agent: generate a draft response grounded in company docs."""
    start = time.time()
    workspace_id = state.get("workspace_id", "default")
    draft = state.get("draft")
    if not draft or not draft.strip():
        draft = maker_agent.generate_draft(
            query=state["query"],
            history=state.get("history", []),
            demo_mode=state.get("demo_mode", True),
            workspace_id=workspace_id
        )
    latency = (time.time() - start) * 1000
    
    loop_entry = {
        "step": "maker_initial_draft",
        "agent": "Maker Agent",
        "attempt": 0,
        "action": "Generated conversational draft from corporate manuals",
        "draft": draft,
        "latency_ms": round(latency, 2)
    }
    loop_history = list(state.get("loop_history", []))
    loop_history.append(loop_entry)

    return {
        "draft": draft,
        "maker_latency_ms": round(latency, 2),
        "loop_history": loop_history
    }


def judge_draft_node(state: GraphState) -> Dict[str, Any]:
    """Judge Agent: verify the draft at claim level against source docs."""
    start = time.time()
    workspace_id = state.get("workspace_id", "default")
    attempts = state.get("correction_attempts", 0)
    
    verification = judge_agent.verify_draft(
        draft=state["draft"],
        demo_mode=state.get("demo_mode", True),
        workspace_id=workspace_id
    )
    latency = (time.time() - start) * 1000
    
    loop_entry = {
        "step": "judge_verify",
        "agent": "Judge Agent",
        "attempt": attempts,
        "action": f"Decomposed {len(verification.claims)} claims & audited against corporate KB",
        "is_safe": verification.is_safe,
        "severity": verification.severity,
        "contradicted_count": sum(1 for c in verification.claims if c.verdict == "Contradicted"),
        "unsupported_count": sum(1 for c in verification.claims if c.verdict == "Unsupported"),
        "latency_ms": round(latency, 2)
    }
    loop_history = list(state.get("loop_history", []))
    loop_history.append(loop_entry)

    prev_judge_lat = state.get("judge_latency_ms", 0.0)
    return {
        "verification": verification,
        "judge_latency_ms": round(prev_judge_lat + latency, 2),
        "loop_history": loop_history
    }


def decision_node(state: GraphState) -> str:
    """Route based on verification result and multi-agent retry count."""
    verification = state["verification"]
    attempts = state.get("correction_attempts", 0)
    
    if verification.is_safe:
        return "release"
    elif verification.severity == "high" or attempts >= 2:
        return "block"
    else:
        # Low severity (e.g. unsupported claims or missing qualifiers) — route to agentic correction loop
        return "correct"


def correct_node(state: GraphState) -> Dict[str, Any]:
    """
    Multi-Agent Feedback Loop:
    Maker Agent / Corrector revises the draft using Judge feedback and verified source evidence.
    This node loops directly back to 'judge' for autonomous re-verification.
    """
    start = time.time()
    workspace_id = state.get("workspace_id", "default")
    verification = state["verification"]
    attempts = state.get("correction_attempts", 0) + 1
    
    flagged = [c for c in verification.claims if c.verdict in ("Unsupported", "Contradicted")]
    
    # Revise draft with Maker using Judge critique & ground-truth facts
    revised_draft = maker_agent.revise_draft(
        query=state["query"],
        original_draft=state["draft"],
        flagged_claims=flagged,
        workspace_id=workspace_id
    )
    
    latency = (time.time() - start) * 1000
    loop_entry = {
        "step": "agent_auto_correct",
        "agent": "Maker Agent (Revision)",
        "attempt": attempts,
        "action": f"Autonomous revision removing {len(flagged)} unverified claim(s)",
        "revised_draft": revised_draft,
        "latency_ms": round(latency, 2)
    }
    loop_history = list(state.get("loop_history", []))
    loop_history.append(loop_entry)

    prev_corr_lat = state.get("correction_latency_ms", 0.0)
    return {
        "draft": revised_draft,
        "correction_attempts": attempts,
        "correction_latency_ms": round(prev_corr_lat + latency, 2),
        "loop_history": loop_history
    }


def release_node(state: GraphState) -> Dict[str, Any]:
    """Release the response as Approved or Corrected."""
    ws = state.get("workspace_id", "default")
    attempts = state.get("correction_attempts", 0)
    status = "Corrected" if attempts > 0 else "Approved"
    
    metrics_tracker.record_query_result(
        status=status,
        claims=state["verification"].claims,
        maker_latency=state.get("maker_latency_ms", 0),
        judge_latency=state.get("judge_latency_ms", 0),
        correction_latency=state.get("correction_latency_ms", 0),
        workspace_id=ws
    )
    
    total = (
        state.get("maker_latency_ms", 0) +
        state.get("judge_latency_ms", 0) +
        state.get("correction_latency_ms", 0)
    )
    return {
        "final_response": state["draft"],
        "status": status,
        "total_latency_ms": round(total, 2)
    }


def block_node(state: GraphState) -> Dict[str, Any]:
    """Block the response and escalate to human."""
    ws = state.get("workspace_id", "default")
    metrics_tracker.record_query_result(
        status="Blocked",
        claims=state["verification"].claims,
        maker_latency=state.get("maker_latency_ms", 0),
        judge_latency=state.get("judge_latency_ms", 0),
        correction_latency=state.get("correction_latency_ms", 0),
        workspace_id=ws
    )
    
    total = (
        state.get("maker_latency_ms", 0) +
        state.get("judge_latency_ms", 0) +
        state.get("correction_latency_ms", 0)
    )
    
    safe_response = (
        "I want to make sure I give you the most accurate information. "
        "Let me connect you with a member of our support team who can help you with this. "
        "They'll be able to provide you with the exact details you need. "
        "Is there anything else I can help with in the meantime?"
    )
    
    return {
        "final_response": safe_response,
        "status": "Blocked",
        "total_latency_ms": round(total, 2)
    }


def build_graph():
    """Build the LangGraph StateGraph with a true cyclic multi-agent feedback loop."""
    workflow = StateGraph(GraphState)
    
    # Add nodes
    workflow.add_node("maker", generate_draft_node)
    workflow.add_node("judge", judge_draft_node)
    workflow.add_node("correct", correct_node)
    workflow.add_node("release", release_node)
    workflow.add_node("block", block_node)
    
    # Set entry point
    workflow.set_entry_point("maker")
    
    # Maker flows to Judge
    workflow.add_edge("maker", "judge")
    
    # Judge branches based on verification result
    workflow.add_conditional_edges(
        "judge",
        decision_node,
        {
            "release": "release",
            "correct": "correct",
            "block": "block"
        }
    )
    
    # THE MULTI-AGENT LOOP:
    # "correct" loops BACK to "judge" for re-verification!
    workflow.add_edge("correct", "judge")
    
    # Terminal edges
    workflow.add_edge("release", END)
    workflow.add_edge("block", END)
    
    return workflow.compile()


# Build the graph at module level for reuse
agent_graph = build_graph()

