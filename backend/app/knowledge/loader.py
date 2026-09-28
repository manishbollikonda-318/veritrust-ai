import os
from typing import Optional
from app.knowledge.vectorstore import vector_store

DEFAULT_DOCS_DIR = os.path.join(os.path.dirname(__file__), "documents")
ACME_DOCS_DIR = os.path.join(os.path.dirname(__file__), "acme_documents")

def _load_dir_into_workspace(target_dir: str, workspace_id: str):
    if not os.path.exists(target_dir):
        return
    for filename in sorted(os.listdir(target_dir)):
        if filename.endswith(".txt"):
            filepath = os.path.join(target_dir, filename)
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
            
            lines = content.strip().split("\n")
            title = lines[0].strip() if lines else filename
            chunks = [c.strip() for c in content.split("\n\n") if c.strip()]
            
            vector_store.store_raw_doc(workspace_id, {
                "id": f"doc_{workspace_id}_{filename}",
                "filename": filename,
                "title": title,
                "content": content,
                "chunk_count": len(chunks)
            })

    vector_store.reindex_workspace(workspace_id)
    print(f"✅ Initialized workspace '{workspace_id}' with {len(vector_store.get_raw_docs(workspace_id))} documents.")


def load_and_embed_documents(docs_dir: Optional[str] = None, workspace_id: Optional[str] = None):
    """Load and embed benchmark documents for both NovaMart and Acme Health."""
    if workspace_id and workspace_id != "default":
        target_dir = docs_dir or DEFAULT_DOCS_DIR
        _load_dir_into_workspace(target_dir, workspace_id)
        return

    # Seed default NovaMart
    target_dir = docs_dir or DEFAULT_DOCS_DIR
    if not os.path.exists(target_dir):
        alt_dir = os.path.join(os.getcwd(), "app", "knowledge", "documents")
        if os.path.exists(alt_dir):
            target_dir = alt_dir
    _load_dir_into_workspace(target_dir, "default")

    # Seed Acme Health
    acme_dir = ACME_DOCS_DIR
    if not os.path.exists(acme_dir):
        alt_acme = os.path.join(os.getcwd(), "app", "knowledge", "acme_documents")
        if os.path.exists(alt_acme):
            acme_dir = alt_acme
    _load_dir_into_workspace(acme_dir, "acme-health")


if __name__ == "__main__":
    load_and_embed_documents()
