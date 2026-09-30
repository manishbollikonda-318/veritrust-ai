from datetime import datetime
from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
from app.services.review_service import review_service
from app.services.metrics_tracker import metrics_tracker
from app.services.workspace_service import workspace_service

router = APIRouter()

@router.get("/audit/export")
async def export_audit_log(workspace_id: str = Query("default")):
    queue = review_service.get_queue(workspace_id=workspace_id)
    metrics = metrics_tracker.get_metrics(workspace_id=workspace_id)
    workspace = workspace_service.get_workspace(workspace_id)

    ws_data = {
        "id": workspace_id,
        "name": workspace.name if workspace else "Unknown",
        "industry": workspace.industry if workspace else "Unknown"
    }

    report = {
        "report_type": "VeriTrust AI Compliance Audit Certificate",
        "version": "1.0.0",
        "generated_at": datetime.utcnow().isoformat(),
        "workspace": ws_data,
        "summary": {
            "total_interactions_audited": metrics.total_queries,
            "interception_rate": metrics.correction_rate + metrics.block_rate,
            "compliance_grade": "A" if (metrics.correction_rate + metrics.block_rate) < 20 else "B",
            "claims_verified": metrics.verified_claims,
            "claims_flagged": metrics.unsupported_claims,
            "claims_blocked": metrics.contradicted_claims,
            "human_reviews_completed": max(0, metrics.total_queries - (metrics.approved_count or 0))
        },
        "guardrail_configuration": {
            "engine": "Dual-Agent Maker & Judge",
            "retrieval_method": "BM25 + TF-IDF SQLite",
            "claim_verification": "Deterministic + Semantic",
            "correction_loop": "Enabled"
        },
        "audit_trail": [
            {
                "id": item.id,
                "timestamp": item.timestamp,
                "query": item.query,
                "original_draft": item.original_draft,
                "final_response": item.final_response,
                "status": item.status,
                "claims": [
                    {
                        "text": claim.text,
                        "verdict": claim.verdict,
                        "confidence": claim.confidence,
                        "source_document": claim.source_document,
                        "reasoning": claim.reasoning
                    }
                    for claim in item.claims
                ],
                "overall_reasoning": item.overall_reasoning
            }
            for item in queue
        ]
    }

    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    headers = {
        "Content-Disposition": f"attachment; filename=veritrust_audit_{workspace_id}_{timestamp}.json"
    }
    return JSONResponse(content=report, headers=headers)
