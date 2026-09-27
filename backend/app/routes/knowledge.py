"""
Knowledge base API routes — multi-tenant document management, uploads, edits, and re-indexing.
"""

from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from app.knowledge.vectorstore import vector_store
from app.knowledge.loader import load_and_embed_documents
from app.models.schemas import KnowledgeDocument
from app.services.file_security import sanitize_filename, validate_file_content

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
    """Upload or paste a new corporate policy document into the workspace with full security sanitization."""
    target_workspace = workspace_id or req.workspace_id or "default"
    
    # 1. Validate content and reject malicious binary/executable payload
    clean_content = validate_file_content(req.content.encode("utf-8"), req.filename or req.title)
    
    # 2. Sanitize filename against directory traversal and dangerous characters
    safe_filename = sanitize_filename(req.filename or f"{req.title}.txt")

    chunks = [c.strip() for c in clean_content.split("\n\n") if c.strip()]
    if not chunks:
        chunks = [clean_content.strip()]

    doc_data = {
        "id": f"doc_{safe_filename}",
        "filename": safe_filename,
        "title": req.title.strip(),
        "content": clean_content,
        "chunk_count": len(chunks)
    }

    # Stored strictly in isolated, non-executable vector storage partition
    vector_store.store_raw_doc(target_workspace, doc_data)
    vector_store.reindex_workspace(target_workspace)

    return KnowledgeDocument(
        filename=safe_filename,
        title=req.title.strip(),
        content=clean_content,
        chunk_count=len(chunks)
    )


@router.post("/knowledge/documents/upload", response_model=KnowledgeDocument)
async def upload_document_file(
    request: Request,
    workspace_id: str = Query(default="default"),
    title: Optional[str] = Query(default=None),
    filename: Optional[str] = Query(default=None)
):
    """
    Dedicated multipart file upload endpoint.
    Enforces strict magic byte detection, size limits (<1MB), UTF-8 decoding,
    path traversal sanitization, and non-executable memory storage.
    Uses native streaming parser without fragile external dependencies.
    """
    content_type = request.headers.get("content-type", "")
    raw_body = await request.body()
    
    file_bytes = b""
    detected_filename = filename or "uploaded_policy.txt"
    detected_title = title

    if "multipart/form-data" in content_type:
        from email.parser import BytesParser
        from email.policy import default
        # Native standard-library multipart parser
        header_bytes = f"Content-Type: {content_type}\r\n\r\n".encode("latin-1")
        msg = BytesParser(policy=default).parsebytes(header_bytes + raw_body)
        for part in msg.iter_parts():
            cd = part.get("Content-Disposition", "")
            if 'name="file"' in cd or part.get_filename():
                file_bytes = part.get_payload(decode=True) or b""
                if part.get_filename():
                    detected_filename = part.get_filename()
            elif 'name="title"' in cd and not detected_title:
                payload = part.get_payload(decode=True)
                if payload:
                    detected_title = payload.decode("utf-8", errors="ignore")
    else:
        file_bytes = raw_body

    if not file_bytes:
        raise HTTPException(
            status_code=400,
            detail="No file content detected in upload payload."
        )

    # 1. Validate content against magic bytes, binary injection, script headers, and size limits
    clean_content = validate_file_content(file_bytes, detected_filename)
    
    # 2. Sanitize filename strictly against path traversal and dangerous characters
    safe_filename = sanitize_filename(detected_filename)
    final_title = (detected_title or detected_filename).rsplit(".", 1)[0].replace("_", " ").title().strip()

    chunks = [c.strip() for c in clean_content.split("\n\n") if c.strip()]
    if not chunks:
        chunks = [clean_content]

    doc_data = {
        "id": f"doc_{safe_filename}",
        "filename": safe_filename,
        "title": final_title,
        "content": clean_content,
        "chunk_count": len(chunks)
    }

    # Isolated vector storage partition — strictly non-executable
    vector_store.store_raw_doc(workspace_id, doc_data)
    vector_store.reindex_workspace(workspace_id)

    return KnowledgeDocument(
        filename=safe_filename,
        title=final_title,
        content=clean_content,
        chunk_count=len(chunks)
    )


@router.put("/knowledge/documents/{filename}", response_model=KnowledgeDocument)
async def update_document(filename: str, req: DocumentUpdateRequest, workspace_id: Optional[str] = Query(default=None)):
    """Edit an existing policy document and re-index the workspace with security checks."""
    target_workspace = workspace_id or req.workspace_id or "default"
    clean_filename = sanitize_filename(filename)
    
    # Validate content against binary, execution tokens, and size
    clean_content = validate_file_content(req.content.encode("utf-8"), clean_filename)
    
    raw_docs = vector_store.get_raw_docs(target_workspace)
    target = next((d for d in raw_docs if d.get("filename") == clean_filename), None)

    title = req.title.strip() if req.title else (target.get("title") if target else clean_filename)
    chunks = [c.strip() for c in clean_content.split("\n\n") if c.strip()]
    if not chunks:
        chunks = [clean_content.strip()]

    doc_data = {
        "id": f"doc_{clean_filename}",
        "filename": clean_filename,
        "title": title,
        "content": clean_content,
        "chunk_count": len(chunks)
    }

    vector_store.store_raw_doc(target_workspace, doc_data)
    vector_store.reindex_workspace(target_workspace)

    return KnowledgeDocument(
        filename=clean_filename,
        title=title,
        content=clean_content,
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


from app.services.workspace_service import workspace_service

@router.get("/knowledge/workspaces")
async def list_workspaces():
    """List available workspaces."""
    return workspace_service.list_workspaces()
