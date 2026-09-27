"""
Chat API routes — the main interaction endpoint for VeriTrust AI.
"""

import time
import json
import uuid
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from app.models.schemas import (
    ChatRequest, ChatResponse, ComparisonResponse,
    VerificationResult, Claim, StandaloneVerifyRequest
)
from app.agents.graph import agent_graph
from app.agents.maker import maker_agent
from app.agents.judge import judge_agent
from app.config import settings

router = APIRouter()

# In-memory conversation store
conversations: dict = {}


@router.post("/verify", response_model=VerificationResult)
async def verify_standalone(request: StandaloneVerifyRequest):
    """
    Standalone Guardrail Verification Endpoint.
    Accepts any raw draft text or claim and runs it against the workspace's policy knowledge base.
    Can be used by external AI support systems as a plug-and-play compliance gateway.
    """
    demo_mode = request.demo_mode if request.demo_mode is not None else settings.DEMO_MODE
    try:
        result = judge_agent.verify_draft(
            draft=request.draft,
            demo_mode=demo_mode,
            workspace_id=request.workspace_id
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Main chat endpoint: runs query through Maker → Judge → Decision pipeline.
    Returns the full verification result including claim-level details.
    """
    demo_mode = request.demo_mode if request.demo_mode is not None else settings.DEMO_MODE
    session_id = request.session_id or str(uuid.uuid4())
    workspace_id = request.workspace_id or "default"
    
    start_time = time.time()
    
    initial_state = {
        "query": request.message,
        "workspace_id": workspace_id,
        "history": [m.model_dump() for m in request.history],
        "demo_mode": demo_mode,
        "draft": "",
        "verification": None,
        "final_response": "",
        "status": "",
        "maker_latency_ms": 0.0,
        "judge_latency_ms": 0.0,
        "correction_latency_ms": 0.0,
        "total_latency_ms": 0.0,
        "correction_attempts": 0,
        "loop_history": [],
    }
    
    try:
        final_state = agent_graph.invoke(initial_state)
        total_latency = (time.time() - start_time) * 1000
        
        status = final_state["status"]
        
        response = ChatResponse(
            session_id=session_id,
            query=request.message,
            original_draft=final_state["draft"],
            final_response=final_state["final_response"],
            verification=final_state.get("verification"),
            status=status,
            latency_ms=round(total_latency, 2),
            maker_latency_ms=final_state.get("maker_latency_ms", 0),
            judge_latency_ms=final_state.get("judge_latency_ms", 0),
            correction_latency_ms=final_state.get("correction_latency_ms", 0),
            correction_attempts=final_state.get("correction_attempts", 0),
            loop_history=final_state.get("loop_history", []),
        )
        
        # Store in conversation history
        if session_id not in conversations:
            conversations[session_id] = []
        conversations[session_id].append(response.model_dump())
        
        # Route non-clean interactions to Human Review Queue
        if status in ("Blocked", "Corrected"):
            try:
                from app.services.review_service import review_service
                v = final_state.get("verification")
                review_service.add_item(
                    query=request.message,
                    workspace_id=workspace_id,
                    original_draft=final_state["draft"],
                    final_response=final_state["final_response"],
                    status=status,
                    claims=v.claims if v else [],
                    overall_reasoning=v.overall_reasoning if v else "",
                    severity=v.severity if v else "medium"
                )
            except Exception as e:
                # Non-blocking logging
                pass

        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline error: {str(e)}")


@router.post("/chat/maker-only", response_model=ChatResponse)
async def chat_maker_only(request: ChatRequest):
    """
    Maker-only mode: runs query through Maker Agent only, without Judge verification.
    Used for comparison mode to show what would happen without the guardrail.
    """
    demo_mode = request.demo_mode if request.demo_mode is not None else settings.DEMO_MODE
    workspace_id = request.workspace_id or "default"
    
    start_time = time.time()
    
    draft = maker_agent.generate_draft(
        query=request.message,
        history=[m.model_dump() for m in request.history],
        demo_mode=demo_mode,
        workspace_id=workspace_id
    )
    
    latency = (time.time() - start_time) * 1000
    
    return ChatResponse(
        query=request.message,
        original_draft=draft,
        final_response=draft,
        verification=None,
        status="Approved",  # No judge, so everything passes
        latency_ms=round(latency, 2),
        maker_latency_ms=round(latency, 2),
        judge_latency_ms=0.0,
    )


@router.post("/chat/compare", response_model=ComparisonResponse)
async def chat_compare(request: ChatRequest):
    """
    Comparison mode: runs the same query through both Maker-only and Maker+Judge
    pipelines, returning both results side by side.
    """
    demo_mode = request.demo_mode if request.demo_mode is not None else settings.DEMO_MODE
    workspace_id = request.workspace_id or "default"
    
    # Run maker-only
    maker_start = time.time()
    draft = maker_agent.generate_draft(
        query=request.message,
        history=[m.model_dump() for m in request.history],
        demo_mode=demo_mode,
        workspace_id=workspace_id
    )
    maker_latency = (time.time() - maker_start) * 1000
    
    maker_only_response = ChatResponse(
        query=request.message,
        original_draft=draft,
        final_response=draft,
        verification=None,
        status="Approved",
        latency_ms=round(maker_latency, 2),
        maker_latency_ms=round(maker_latency, 2),
    )
    
    # Run full pipeline
    pipeline_start = time.time()
    initial_state = {
        "query": request.message,
        "workspace_id": workspace_id,
        "history": [m.model_dump() for m in request.history],
        "demo_mode": demo_mode,
        "draft": "",
        "verification": None,
        "final_response": "",
        "status": "",
        "maker_latency_ms": 0.0,
        "judge_latency_ms": 0.0,
        "correction_latency_ms": 0.0,
        "total_latency_ms": 0.0,
        "correction_attempts": 0,
        "loop_history": [],
    }
    
    final_state = agent_graph.invoke(initial_state)
    pipeline_latency = (time.time() - pipeline_start) * 1000
    
    full_response = ChatResponse(
        query=request.message,
        original_draft=final_state["draft"],
        final_response=final_state["final_response"],
        verification=final_state.get("verification"),
        status=final_state["status"],
        latency_ms=round(pipeline_latency, 2),
        maker_latency_ms=final_state.get("maker_latency_ms", 0),
        judge_latency_ms=final_state.get("judge_latency_ms", 0),
        correction_latency_ms=final_state.get("correction_latency_ms", 0),
        correction_attempts=final_state.get("correction_attempts", 0),
        loop_history=final_state.get("loop_history", []),
    )
    
    return ComparisonResponse(
        query=request.message,
        maker_only=maker_only_response,
        maker_plus_judge=full_response
    )


@router.get("/chat/history/{session_id}")
async def get_history(session_id: str):
    """Get conversation history for a session."""
    return conversations.get(session_id, [])


@router.post("/chat/reset")
async def reset_chat():
    """Reset all conversations and metrics."""
    from app.services.metrics_tracker import metrics_tracker
    conversations.clear()
    metrics_tracker.reset()
    return {"message": "Reset complete"}


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time chat streaming."""
    await websocket.accept()
    session_id = str(uuid.uuid4())
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            query = message.get("message", "")
            demo_mode = message.get("demo_mode", True)
            
            # Send "processing" status
            await websocket.send_text(json.dumps({
                "type": "status",
                "stage": "maker",
                "message": "Maker Agent generating draft..."
            }))
            
            # Run the pipeline
            initial_state = {
                "query": query,
                "history": [],
                "demo_mode": demo_mode,
                "draft": "",
                "verification": None,
                "final_response": "",
                "status": "",
                "maker_latency_ms": 0.0,
                "judge_latency_ms": 0.0,
                "correction_latency_ms": 0.0,
                "total_latency_ms": 0.0,
                "correction_attempts": 0,
                "loop_history": [],
            }
            
            final_state = agent_graph.invoke(initial_state)
            
            response = ChatResponse(
                session_id=session_id,
                query=query,
                original_draft=final_state["draft"],
                final_response=final_state["final_response"],
                verification=final_state.get("verification"),
                status=final_state["status"],
                maker_latency_ms=final_state.get("maker_latency_ms", 0),
                judge_latency_ms=final_state.get("judge_latency_ms", 0),
                correction_latency_ms=final_state.get("correction_latency_ms", 0),
                correction_attempts=final_state.get("correction_attempts", 0),
                loop_history=final_state.get("loop_history", []),
            )
            
            await websocket.send_text(json.dumps({
                "type": "response",
                "data": response.model_dump()
            }))
            
    except WebSocketDisconnect:
        pass
