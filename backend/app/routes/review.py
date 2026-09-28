"""
Review API routes — Human-in-the-Loop auditing and feedback learning endpoints.
"""

from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from app.models.schemas import ReviewItem, ReviewResolutionRequest, ReviewStatsResponse
from app.services.review_service import review_service

router = APIRouter()


@router.get("/review/queue", response_model=List[ReviewItem])
async def get_review_queue(
    workspace_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None)
):
    """Retrieve pending or resolved human review queue items."""
    return review_service.get_queue(workspace_id=workspace_id, status_filter=status)


@router.post("/review/{item_id}/resolve", response_model=ReviewItem)
async def resolve_review_item(item_id: str, request: ReviewResolutionRequest):
    """
    Submit a human supervisor decision for a flagged query.
    Optionally promotes the verified resolution into the vector store as a golden rule.
    """
    try:
        return review_service.resolve_item(item_id, request)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to resolve review item: {str(e)}")


@router.get("/review/stats", response_model=ReviewStatsResponse)
async def get_review_stats(workspace_id: Optional[str] = Query(None)):
    """Get review queue counts and self-improving learned rule stats."""
    return review_service.get_stats(workspace_id=workspace_id)
