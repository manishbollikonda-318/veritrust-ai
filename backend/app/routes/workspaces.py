"""
Workspace API routes — Multi-company workspace creation, listing, and LLM provider configuration.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Header, Depends, Request
from app.models.schemas import WorkspaceModel, WorkspaceCreateRequest, WorkspaceSettingsUpdateRequest
from app.services.workspace_service import workspace_service

router = APIRouter()


async def verify_workspace_token(
    request: Request,
    workspace_id: str,
    x_workspace_token: Optional[str] = Header(default=None, alias="X-Workspace-Token")
) -> str:
    """Verify workspace access token for mutating operations."""
    if workspace_id in ("default", "acme-health"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot modify demo workspaces"
        )
    if not x_workspace_token or not workspace_service.validate_token(workspace_id, x_workspace_token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired workspace token"
        )
    return workspace_id


@router.get("/workspaces", response_model=List[WorkspaceModel])
async def list_workspaces():
    """List all available enterprise workspaces with active document counts and masked API keys."""
    return workspace_service.list_workspaces()


@router.post("/workspaces", response_model=WorkspaceModel, status_code=status.HTTP_201_CREATED)
async def create_workspace(request: WorkspaceCreateRequest):
    """
    Onboard a brand-new company into VeriTrust AI:
    1. Creates an isolated workspace ID and metadata.
    2. Seeds the initial policy document directly into the vector store.
    3. Configures optional custom LLM provider & API key.
    4. Generates a secure access token for future mutating operations.
    """
    try:
        return workspace_service.create_workspace(request)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create company workspace: {str(e)}"
        )


@router.get("/workspaces/{workspace_id}", response_model=WorkspaceModel)
async def get_workspace(workspace_id: str):
    """Get details and configuration for a specific company workspace."""
    ws = workspace_service.get_workspace(workspace_id)
    if not ws:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    return ws


@router.put("/workspaces/{workspace_id}/settings", response_model=WorkspaceModel)
async def update_workspace_settings(
    workspace_id: str, 
    request: WorkspaceSettingsUpdateRequest,
    http_request: Request,
    verified_id: str = Depends(verify_workspace_token)
):
    """Update company metadata or configure a custom LLM provider & API key. Requires valid workspace token."""
    ws = workspace_service.update_workspace_settings(workspace_id, request)
    if not ws:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    return ws


@router.delete("/workspaces/{workspace_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workspace(
    workspace_id: str,
    http_request: Request,
    verified_id: str = Depends(verify_workspace_token)
):
    """Delete a custom company workspace. Requires valid workspace token. Demo workspaces cannot be deleted."""
    try:
        success = workspace_service.delete_workspace(workspace_id)
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete workspace: {str(e)}"
        )
