"""
LangGraph State Graph for VeriTrust AI Pipeline.

Flow:
  Customer Query → Maker Agent → Judge Agent → Decision Branch
    ├─ All Verified     → Release (Approved)
    ├─ Unsupported only → Auto-Correct → Re-verify → Release (Corrected)
    └─ Contradicted     → Block + Escalate (Blocked)
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
    total_latency_ms: float
    correction_attempts: int


def generate_draft_node(state: GraphState) -> Dict[str, Any]:
    """Maker Agent: generate a draft response grounded in company docs."""
    start = time.time()
    workspace_id = state.get("workspace_id", "default")
    draft = maker_agent.generate_draft(
        query=state["query"],
        history=state.get("history", []),
        demo_mode=state.get("demo_mode", True),
        workspace_id=workspace_id
    )
    latency = (time.time() - start) * 1000
    return {"draft": draft, "maker_latency_ms": round(latency, 2)}


def judge_draft_node(state: GraphState) -> Dict[str, Any]:
    """Judge Agent: verify the draft at claim level against source docs."""
    start = time.time()
    workspace_id = state.get("workspace_id", "default")
    verification = judge_agent.verify_draft(
        draft=state["draft"],
        demo_mode=state.get("demo_mode", True),
        workspace_id=workspace_id
    )
    latency = (time.time() - start) * 1000
    return {"verification": verification, "judge_latency_ms": round(latency, 2)}


def decision_node(state: GraphState) -> str:
    """Route based on verification result."""
    verification = state["verification"]
    
    if verification.is_safe:
        return "release"
    elif verification.severity == "high":
        return "block"
    else:
        # Low severity (unsupported only) — try to auto-correct
        if state.get("correction_attempts", 0) >= 1:
            # Already tried correcting once, block to be safe
            return "block"
        return "correct"


def release_node(state: GraphState) -> Dict[str, Any]:
    """Release the response as Approved."""
    ws = state.get("workspace_id", "default")
    metrics_tracker.record_query_result(
        status="Approved",
        claims=state["verification"].claims,
        maker_latency=state.get("maker_latency_ms", 0),
        judge_latency=state.get("judge_latency_ms", 0),
        workspace_id=ws
    )
    total = state.get("maker_latency_ms", 0) + state.get("judge_latency_ms", 0)
    return {
        "final_response": state["draft"],
        "status": "Approved",
        "total_latency_ms": round(total, 2)
    }


def correct_node(state: GraphState) -> Dict[str, Any]:
    """Auto-correct the draft and re-verify."""
    workspace_id = state.get("workspace_id", "default")
    corrected_draft = judge_agent.correct_draft(
        state["draft"],
        state["verification"]
    )
    
    # Re-verify the corrected draft in workspace context
    re_verification = judge_agent.verify_draft(corrected_draft, workspace_id=workspace_id)
    
    status = "Corrected"
    if not re_verification.is_safe and re_verification.severity == "high":
        status = "Blocked"
    
    metrics_tracker.record_query_result(
        status=status,
        claims=state["verification"].claims,  # Log original claims for metrics
        maker_latency=state.get("maker_latency_ms", 0),
        judge_latency=state.get("judge_latency_ms", 0),
        workspace_id=workspace_id
    )
    
    total = state.get("maker_latency_ms", 0) + state.get("judge_latency_ms", 0)
    return {
        "final_response": corrected_draft,
        "status": status,
        "total_latency_ms": round(total, 2),
        "correction_attempts": state.get("correction_attempts", 0) + 1
    }


def block_node(state: GraphState) -> Dict[str, Any]:
    """Block the response and escalate to human."""
    ws = state.get("workspace_id", "default")
    metrics_tracker.record_query_result(
        status="Blocked",
        claims=state["verification"].claims,
        maker_latency=state.get("maker_latency_ms", 0),
        judge_latency=state.get("judge_latency_ms", 0),
        workspace_id=ws
    )
    
    total = state.get("maker_latency_ms", 0) + state.get("judge_latency_ms", 0)
    
    # Generate a safe fallback response
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
    """Build the LangGraph StateGraph for the Maker→Judge pipeline."""
    workflow = StateGraph(GraphState)
    
    # Add nodes
    workflow.add_node("maker", generate_draft_node)
    workflow.add_node("judge", judge_draft_node)
    workflow.add_node("release", release_node)
    workflow.add_node("correct", correct_node)
    workflow.add_node("block", block_node)
    
    # Set entry point
    workflow.set_entry_point("maker")
    
    # Maker always flows to Judge
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
    
    # Terminal edges
    workflow.add_edge("release", END)
    workflow.add_edge("correct", END)
    workflow.add_edge("block", END)
    
    return workflow.compile()


# Build the graph at module level for reuse
agent_graph = build_graph()
