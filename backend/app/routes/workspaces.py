"""
Workspace API routes — Multi-company workspace creation, listing, and LLM provider configuration.
"""

from typing import List
from fastapi import APIRouter, HTTPException, status
from app.models.schemas import WorkspaceModel, WorkspaceCreateRequest, WorkspaceSettingsUpdateRequest
from app.services.workspace_service import workspace_service

router = APIRouter()


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
async def update_workspace_settings(workspace_id: str, request: WorkspaceSettingsUpdateRequest):
    """Update company metadata or configure a custom LLM provider & API key."""
    ws = workspace_service.update_workspace_settings(workspace_id, request)
    if not ws:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    return ws
