import os
from typing import Optional
from app.knowledge.vectorstore import vector_store

DEFAULT_DOCS_DIR = os.path.join(os.path.dirname(__file__), "documents")
ACME_DOCS_DIR = os.path.join(os.path.dirname(__file__), "acme_documents")
FINTECH_DOCS_DIR = os.path.join(os.path.dirname(__file__), "fintech_documents")

def _load_dir_into_workspace(target_dir: str, workspace_id: str, clear_existing: bool = False):
    if not os.path.exists(target_dir):
        return

    if clear_existing:
        # Clear in-memory docs and SQLite persistence for this workspace to maintain strict isolation
        vector_store.workspace_raw_docs[workspace_id] = []
        try:
            with vector_store.sqlite._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM corporate_documents WHERE workspace_id = ?", (workspace_id,))
                cursor.execute("DELETE FROM document_chunks WHERE workspace_id = ?", (workspace_id,))
                conn.commit()
        except Exception as e:
            print(f"Notice resetting workspace {workspace_id} in SQLite: {e}")

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
    """Load and embed benchmark documents for Acme Health (Healthcare), NovaMart (E-Commerce), and Apex NeoBank (Fintech)."""
    if workspace_id and workspace_id not in ("default", "acme-health", "novamart", "apex-financial"):
        target_dir = docs_dir or DEFAULT_DOCS_DIR
        _load_dir_into_workspace(target_dir, workspace_id)
        return

    # 1. Seed Healthcare & Telehealth (Acme Health & Pharma) -> default & acme-health
    acme_dir = ACME_DOCS_DIR
    if not os.path.exists(acme_dir):
        alt_acme = os.path.join(os.getcwd(), "app", "knowledge", "acme_documents")
        if os.path.exists(alt_acme):
            acme_dir = alt_acme
    _load_dir_into_workspace(acme_dir, "default", clear_existing=True)
    _load_dir_into_workspace(acme_dir, "acme-health", clear_existing=True)

    # 2. Seed E-Commerce & Retail (NovaMart Retail) -> novamart
    target_dir = docs_dir or DEFAULT_DOCS_DIR
    if not os.path.exists(target_dir):
        alt_dir = os.path.join(os.getcwd(), "app", "knowledge", "documents")
        if os.path.exists(alt_dir):
            target_dir = alt_dir
    _load_dir_into_workspace(target_dir, "novamart", clear_existing=True)

    # 3. Seed Fintech & Banking (Apex NeoBank) -> apex-financial
    fintech_dir = FINTECH_DOCS_DIR
    if not os.path.exists(fintech_dir):
        alt_fintech = os.path.join(os.getcwd(), "app", "knowledge", "fintech_documents")
        if os.path.exists(alt_fintech):
            fintech_dir = alt_fintech
    _load_dir_into_workspace(fintech_dir, "apex-financial", clear_existing=True)


if __name__ == "__main__":
    load_and_embed_documents()
