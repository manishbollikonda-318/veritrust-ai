"""
Review API routes — Human-in-the-Loop auditing and feedback learning endpoints.
"""

from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query, Depends, Request, Header
from app.models.schemas import ReviewItem, ReviewResolutionRequest, ReviewStatsResponse
from app.services.review_service import review_service
from app.services.workspace_service import workspace_service

router = APIRouter()


async def verify_workspace_token(
    request: Request,
    x_workspace_token: Optional[str] = Header(default=None, alias="X-Workspace-Token")
) -> str:
    """Verify workspace access token for mutating operations on non-demo workspaces."""
    # Try to get workspace_id from query params first
    workspace_id = request.query_params.get("workspace_id")
    
    # If not in query params, try to read from request body
    if not workspace_id:
        try:
            body = await request.body()
            if body:
                import json
                body_data = json.loads(body)
                workspace_id = body_data.get("workspace_id", "default")
        except Exception:
            pass
    
    if not workspace_id:
        workspace_id = "default"
    
    if workspace_id in ("default", "acme-health"):
        return workspace_id  # Demo workspaces don't require tokens
    if not x_workspace_token or not workspace_service.validate_token(workspace_id, x_workspace_token):
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired workspace token"
        )
    return workspace_id


@router.get("/review/queue", response_model=List[ReviewItem])
async def get_review_queue(
    workspace_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None)
):
    """Retrieve pending or resolved human review queue items."""
    return review_service.get_queue(workspace_id=workspace_id, status_filter=status)


@router.post("/review/{item_id}/resolve", response_model=ReviewItem)
async def resolve_review_item(item_id: str, request: ReviewResolutionRequest, verified_id: str = Depends(verify_workspace_token)):
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
