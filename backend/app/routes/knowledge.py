"""
Knowledge base API routes — multi-tenant document management, uploads, edits, and re-indexing.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from app.knowledge.vectorstore import vector_store
from app.knowledge.loader import load_and_embed_documents
from app.models.schemas import KnowledgeDocument

router = APIRouter()


class SearchQuery(BaseModel):
    query: str
    workspace_id: str = "default"
    n_results: int = 3


class DocumentCreateRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    filename: Optional[str] = None
    content: str = Field(..., min_length=10, max_length=50000)
    workspace_id: str = "default"


class DocumentUpdateRequest(BaseModel):
    title: Optional[str] = None
    content: str = Field(..., min_length=10, max_length=50000)
    workspace_id: str = "default"


@router.get("/knowledge/documents", response_model=List[KnowledgeDocument])
async def list_documents(workspace_id: str = Query(default="default")):
    """List all ground-truth documents for the requested workspace."""
    raw_docs = vector_store.get_raw_docs(workspace_id)
    if not raw_docs and workspace_id == "default":
        load_and_embed_documents(workspace_id="default")
        raw_docs = vector_store.get_raw_docs("default")

    return [
        KnowledgeDocument(
            filename=doc.get("filename", "doc.txt"),
            title=doc.get("title", "Document"),
            content=doc.get("content", ""),
            chunk_count=doc.get("chunk_count", len(doc.get("content", "").split("\n\n")))
        )
        for doc in raw_docs
    ]


@router.post("/knowledge/documents", response_model=KnowledgeDocument)
async def create_document(req: DocumentCreateRequest, workspace_id: Optional[str] = Query(default=None)):
    """Upload or paste a new corporate policy document into the workspace."""
    target_workspace = workspace_id or req.workspace_id or "default"
    safe_filename = req.filename or f"{req.title.lower().replace(' ', '_')}.txt"
    if not safe_filename.endswith(".txt") and not safe_filename.endswith(".md"):
        safe_filename += ".txt"

    chunks = [c.strip() for c in req.content.split("\n\n") if c.strip()]
    if not chunks:
        chunks = [req.content.strip()]

    doc_data = {
        "id": f"doc_{safe_filename}",
        "filename": safe_filename,
        "title": req.title,
        "content": req.content,
        "chunk_count": len(chunks)
    }

    vector_store.store_raw_doc(target_workspace, doc_data)
    vector_store.reindex_workspace(target_workspace)

    return KnowledgeDocument(
        filename=safe_filename,
        title=req.title,
        content=req.content,
        chunk_count=len(chunks)
    )


@router.put("/knowledge/documents/{filename}", response_model=KnowledgeDocument)
async def update_document(filename: str, req: DocumentUpdateRequest, workspace_id: Optional[str] = Query(default=None)):
    """Edit an existing policy document and re-index the workspace."""
    target_workspace = workspace_id or req.workspace_id or "default"
    raw_docs = vector_store.get_raw_docs(target_workspace)
    target = next((d for d in raw_docs if d.get("filename") == filename), None)

    title = req.title or (target.get("title") if target else filename)
    chunks = [c.strip() for c in req.content.split("\n\n") if c.strip()]
    if not chunks:
        chunks = [req.content.strip()]

    doc_data = {
        "id": f"doc_{filename}",
        "filename": filename,
        "title": title,
        "content": req.content,
        "chunk_count": len(chunks)
    }

    vector_store.store_raw_doc(target_workspace, doc_data)
    vector_store.reindex_workspace(target_workspace)

    return KnowledgeDocument(
        filename=filename,
        title=title,
        content=req.content,
        chunk_count=len(chunks)
    )


@router.delete("/knowledge/documents/{filename}")
async def delete_document(filename: str, workspace_id: str = Query(default="default")):
    """Remove a document from the workspace and re-index the remaining policies."""
    vector_store.delete_doc(filename, workspace_id=workspace_id)
    return {"message": f"Document '{filename}' deleted and workspace '{workspace_id}' re-indexed."}


@router.post("/knowledge/reindex")
async def reindex_knowledge(workspace_id: str = Query(default="default")):
    """Force re-index all chunks for a workspace."""
    vector_store.reindex_workspace(workspace_id)
    return {
        "status": "success",
        "workspace_id": workspace_id,
        "document_count": len(vector_store.get_raw_docs(workspace_id))
    }


@router.post("/knowledge/reset-demo")
async def reset_demo(workspace_id: str = Query(default="default")):
    """Reset workspace back to standard NovaMart baseline documents."""
    load_and_embed_documents(workspace_id=workspace_id)
    return {
        "status": "reset_complete",
        "workspace_id": workspace_id,
        "document_count": len(vector_store.get_raw_docs(workspace_id))
    }


@router.post("/knowledge/search")
async def search_knowledge(query: SearchQuery) -> List[Dict[str, Any]]:
    """Search knowledge base within a specific workspace."""
    results = vector_store.search(query.query, query.n_results, workspace_id=query.workspace_id)
    return results


@router.get("/knowledge/workspaces")
async def list_workspaces():
    """List available workspaces."""
    return [
        {
            "id": "default",
            "name": "NovaMart E-Commerce (Demo)",
            "description": "Retail, return windows, shipping tiers, warranties, and pricing",
            "is_demo": True
        },
        {
            "id": "acme-health",
            "name": "Acme Health & Pharma (Demo)",
            "description": "Prescription refills, telehealth policies, and HIPAA compliance",
            "is_demo": True
        },
        {
            "id": "custom",
            "name": "My Enterprise Workspace",
            "description": "Custom business manuals and policies",
            "is_demo": False
        }
    ]
