"""
Enterprise Workspace & Multi-Tenant Organization Service.
Manages isolated company workspaces, metadata, per-company LLM provider & API key settings,
and seeds initial policy documents directly into the vector store.
"""

import re
import secrets
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from app.models.schemas import WorkspaceModel, WorkspaceCreateRequest, WorkspaceSettingsUpdateRequest
from app.knowledge.vectorstore import vector_store
from app.services.file_security import sanitize_filename, validate_file_content


def mask_key(key: Optional[str]) -> Optional[str]:
    """Mask sensitive API keys so they are never exposed to browser clients."""
    if not key or len(key.strip()) < 8:
        return None
    k = key.strip()
    prefix = k[:4]
    suffix = k[-4:]
    return f"{prefix}...{suffix}"


def generate_workspace_token() -> str:
    """Generate a secure workspace access token."""
    return f"vt_{secrets.token_urlsafe(32)}"


class WorkspaceService:
    def __init__(self):
        # In-memory store of workspaces
        self._workspaces: Dict[str, Dict[str, Any]] = {}
        # Secure server-side API key store (never serialized or returned to clients)
        self._api_keys: Dict[str, str] = {}
        self._seed_default_workspaces()

    def _seed_default_workspaces(self):
        """Seed initial benchmark workspaces (NovaMart demo + Healthcare demo) and load custom workspaces from SQLite."""
        self._workspaces["default"] = {
            "id": "default",
            "name": "NovaMart Retail (Demo)",
            "industry": "Retail & E-Commerce",
            "description": "Default retail benchmark with 5 synthetic sample policies (return, shipping, pricing, warranty, hours)",
            "is_demo": True,
            "llm_provider": "shared_default",
            "created_at": "2026-09-27T00:00:00Z"
        }

        self._workspaces["acme-health"] = {
            "id": "acme-health",
            "name": "Acme Health & Pharma (Demo)",
            "industry": "Healthcare & Telehealth",
            "description": "Clinical and pharmaceutical benchmark with prescription refills and HIPAA compliance policies",
            "is_demo": True,
            "llm_provider": "shared_default",
            "created_at": "2026-09-27T01:00:00Z"
        }

        # Load any custom workspaces stored in SQLite
        try:
            persisted = vector_store.sqlite.load_workspaces()
            for w in persisted:
                self._workspaces[w["id"]] = w
        except Exception as e:
            print(f"Notice loading custom workspaces from SQLite: {e}")

    def list_workspaces(self) -> List[WorkspaceModel]:
        """List all active company workspaces with live document counts and masked API keys."""
        result: List[WorkspaceModel] = []
        for ws_id, data in self._workspaces.items():
            doc_count = len(vector_store.get_raw_docs(ws_id))
            raw_key = self.get_raw_api_key(ws_id)
            has_key = bool(raw_key)
            masked_key = mask_key(raw_key)

            result.append(
                WorkspaceModel(
                    id=ws_id,
                    name=data["name"],
                    industry=data.get("industry", "General"),
                    description=data.get("description", ""),
                    is_demo=data.get("is_demo", False),
                    llm_provider=data.get("llm_provider", "shared_default"),
                    has_custom_api_key=has_key,
                    api_key_masked=masked_key,
                    document_count=doc_count,
                    created_at=data.get("created_at", datetime.now().isoformat()),
                    access_token=data.get("access_token"),
                    token_expires_at=data.get("token_expires_at")
                )
            )
        # Sort so demo comes first, then chronological
        return sorted(result, key=lambda x: (not x.is_demo, x.created_at))

    def get_workspace(self, ws_id: str) -> Optional[WorkspaceModel]:
        """Retrieve a single workspace by ID with hyphen/underscore alias support."""
        if not ws_id:
            ws_id = "default"
        data = (
            self._workspaces.get(ws_id)
            or self._workspaces.get(ws_id.replace('-', '_'))
            or self._workspaces.get(ws_id.replace('_', '-'))
        )
        if not data:
            return None
        doc_count = len(vector_store.get_raw_docs(data["id"]))
        raw_key = self.get_raw_api_key(data["id"])
        return WorkspaceModel(
            id=data["id"],
            name=data["name"],
            industry=data.get("industry", "General"),
            description=data.get("description", ""),
            is_demo=data.get("is_demo", False),
            llm_provider=data.get("llm_provider", "shared_default"),
            has_custom_api_key=bool(raw_key),
            api_key_masked=mask_key(raw_key),
            document_count=doc_count,
            created_at=data.get("created_at", datetime.now().isoformat()),
            access_token=data.get("access_token"),
            token_expires_at=data.get("token_expires_at")
        )

    def create_workspace(self, req: WorkspaceCreateRequest) -> WorkspaceModel:
        """
        Create a new company workspace, initialize its metadata, store optional custom API key,
        generate an access token, and immediately seed and index its initial policy document into the vector store.
        """
        raw_slug = re.sub(r'[^a-z0-9_-]', '_', req.name.lower().strip())
        raw_slug = re.sub(r'_+', '_', raw_slug).strip('_')
        ws_id = raw_slug or f"company_{int(datetime.now().timestamp())}"

        # Ensure uniqueness
        base_id = ws_id
        counter = 1
        while ws_id in self._workspaces:
            ws_id = f"{base_id}_{counter}"
            counter += 1

        # Generate access token with expiry
        access_token = generate_workspace_token()
        token_expiry_days = req.token_expiry_days or 30
        token_expires_at = (datetime.now() + timedelta(days=token_expiry_days)).isoformat()

        # Store metadata
        self._workspaces[ws_id] = {
            "id": ws_id,
            "name": req.name.strip(),
            "industry": req.industry or "General Business",
            "description": req.description or f"Custom workspace for {req.name}",
            "is_demo": False,
            "llm_provider": req.llm_provider or "shared_default",
            "created_at": datetime.now().isoformat(),
            "access_token": access_token,
            "token_expires_at": token_expires_at
        }

        # Store API key if provided
        if req.api_key and req.api_key.strip():
            self._api_keys[ws_id] = req.api_key.strip()

        # Seed initial policy document if provided (with full file safety validation)
        if req.initial_policy_content and req.initial_policy_content.strip():
            title = req.initial_policy_title or f"{req.name} Company Policy"
            safe_fname = sanitize_filename(f"{title}.txt")
            
            # Security validation: checks size, magic bytes, script headers, null bytes
            clean_content = validate_file_content(
                req.initial_policy_content.encode("utf-8"),
                safe_fname
            )
            chunks = [c.strip() for c in clean_content.split("\n\n") if c.strip()] or [clean_content]

            doc_data = {
                "id": f"doc_{safe_fname}",
                "filename": safe_fname,
                "title": title.strip(),
                "content": clean_content,
                "chunk_count": len(chunks)
            }
            vector_store.store_raw_doc(ws_id, doc_data)
            vector_store.reindex_workspace(ws_id)

        # Persist workspace definition to SQLite for survivability across restarts
        try:
            vector_store.sqlite.store_workspace(self._workspaces[ws_id])
        except Exception as e:
            print(f"Warning storing workspace to SQLite: {e}")

        return self.get_workspace(ws_id)

    def update_workspace_settings(self, ws_id: str, req: WorkspaceSettingsUpdateRequest) -> Optional[WorkspaceModel]:
        """Update workspace metadata or LLM configuration."""
        if ws_id not in self._workspaces:
            alt = ws_id.replace('-', '_') if '-' in ws_id else ws_id.replace('_', '-')
            if alt in self._workspaces:
                ws_id = alt
            else:
                return None
        data = self._workspaces[ws_id]

        if req.name is not None and req.name.strip():
            data["name"] = req.name.strip()
        if req.industry is not None:
            data["industry"] = req.industry
        if req.description is not None:
            data["description"] = req.description
        if req.llm_provider is not None:
            data["llm_provider"] = req.llm_provider
        if req.api_key is not None:
            if req.api_key.strip():
                self._api_keys[ws_id] = req.api_key.strip()
            else:
                self._api_keys.pop(ws_id, None)

        try:
            vector_store.sqlite.store_workspace(data)
        except Exception:
            pass

        return self.get_workspace(ws_id)

    def delete_workspace(self, ws_id: str) -> bool:
        """Delete a custom workspace (not demo workspaces)."""
        if ws_id not in self._workspaces:
            alt = ws_id.replace('-', '_') if '-' in ws_id else ws_id.replace('_', '-')
            if alt in self._workspaces:
                ws_id = alt
            else:
                return False
        
        data = self._workspaces[ws_id]
        if data.get("is_demo", False):
            raise ValueError("Cannot delete demo workspaces")
        
        # Remove from vector store
        try:
            vector_store.sqlite.delete_workspace(ws_id)
        except Exception:
            pass
        
        # Remove from memory
        self._workspaces.pop(ws_id, None)
        self._api_keys.pop(ws_id, None)
        
        # Remove associated documents
        try:
            vector_store.reindex_workspace(ws_id)
        except Exception:
            pass
        
        return True

    def validate_token(self, ws_id: str, token: str) -> bool:
        """Validate workspace access token."""
        data = self._workspaces.get(ws_id)
        if not data:
            return False
        
        stored_token = data.get("access_token")
        if not stored_token or stored_token != token:
            return False
        
        # Check expiry
        expires_at = data.get("token_expires_at")
        if expires_at:
            try:
                from datetime import datetime
                if datetime.fromisoformat(expires_at) < datetime.now():
                    return False
            except Exception:
                pass
        
        return True

    def get_raw_api_key(self, ws_id: str) -> Optional[str]:
        """Internal server-only retrieval of the unmasked key for agent execution."""
        return (
            self._api_keys.get(ws_id)
            or self._api_keys.get(ws_id.replace('-', '_'))
            or self._api_keys.get(ws_id.replace('_', '-'))
        )


workspace_service = WorkspaceService()
