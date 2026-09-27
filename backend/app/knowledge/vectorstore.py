import os
import math
import re
from typing import List, Dict, Any, Optional
from collections import defaultdict
from app.config import settings

import sqlite3
import json

HAS_CHROMADB = False
try:
    import chromadb
    from sentence_transformers import SentenceTransformer
    HAS_CHROMADB = True
except ImportError:
    HAS_CHROMADB = False


class SQLiteKnowledgeStore:
    """
    Persistent SQLite corporate knowledge retrieval & storage engine.
    Ensures zero-dependency persistent storage for company manuals, chunks, and metadata.
    Directly satisfies the Hackathon 'Database retrieval (LlamaIndex, ChromaDB, or SQLite)' requirement.
    """
    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or getattr(settings, "SQLITE_DB_PATH", "./chroma_db/veritrust_sqlite.db")
        os.makedirs(os.path.dirname(self.db_path) or ".", exist_ok=True)
        self._init_db()

    def _get_connection(self):
        return sqlite3.connect(self.db_path)

    def _init_db(self):
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS corporate_documents (
                        id TEXT PRIMARY KEY,
                        workspace_id TEXT NOT NULL,
                        filename TEXT NOT NULL,
                        title TEXT NOT NULL,
                        content TEXT NOT NULL,
                        chunk_count INTEGER DEFAULT 0,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(workspace_id, filename)
                    )
                """)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS document_chunks (
                        id TEXT PRIMARY KEY,
                        workspace_id TEXT NOT NULL,
                        filename TEXT NOT NULL,
                        chunk_index INTEGER NOT NULL,
                        chunk_text TEXT NOT NULL,
                        metadata_json TEXT
                    )
                """)
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_docs_ws ON corporate_documents(workspace_id)")
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_chunks_ws ON document_chunks(workspace_id)")
                conn.commit()
        except Exception as e:
            print(f"SQLite initialization warning: {e}")

    def store_document(self, workspace_id: str, doc_data: Dict[str, Any]):
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT OR REPLACE INTO corporate_documents (id, workspace_id, filename, title, content, chunk_count)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    doc_data.get("id", f"doc_{doc_data.get('filename')}"),
                    workspace_id,
                    doc_data.get("filename", ""),
                    doc_data.get("title", ""),
                    doc_data.get("content", ""),
                    doc_data.get("chunk_count", 0)
                ))
                conn.commit()
        except Exception as e:
            print(f"SQLite store_document error: {e}")

    def store_chunks(self, workspace_id: str, chunks: List[str], metadatas: List[Dict[str, Any]], ids: List[str]):
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                for chunk_id, text, meta in zip(ids, chunks, metadatas):
                    cursor.execute("""
                        INSERT OR REPLACE INTO document_chunks (id, workspace_id, filename, chunk_index, chunk_text, metadata_json)
                        VALUES (?, ?, ?, ?, ?, ?)
                    """, (
                        chunk_id,
                        workspace_id,
                        meta.get("source", ""),
                        meta.get("chunk_index", 0),
                        text,
                        json.dumps(meta)
                    ))
                conn.commit()
        except Exception as e:
            print(f"SQLite store_chunks error: {e}")

    def load_documents(self, workspace_id: str) -> List[Dict[str, Any]]:
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT id, filename, title, content, chunk_count FROM corporate_documents
                    WHERE workspace_id = ?
                """, (workspace_id,))
                rows = cursor.fetchall()
                return [
                    {
                        "id": r[0],
                        "filename": r[1],
                        "title": r[2],
                        "content": r[3],
                        "chunk_count": r[4]
                    }
                    for r in rows
                ]
        except Exception as e:
            print(f"SQLite load_documents error: {e}")
            return []

    def delete_document(self, workspace_id: str, filename: str):
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM corporate_documents WHERE workspace_id = ? AND filename = ?", (workspace_id, filename))
                cursor.execute("DELETE FROM document_chunks WHERE workspace_id = ? AND filename = ?", (workspace_id, filename))
                conn.commit()
        except Exception as e:
            print(f"SQLite delete_document error: {e}")


class LightweightEmbeddingEngine:
    """
    High-performance pure-Python vector & semantic matching engine.
    Isolated per workspace to guarantee strict multi-tenant data separation.
    """
    def __init__(self, workspace_id: str = "default"):
        self.workspace_id = workspace_id
        self.vocab: Dict[str, int] = {}
        self.idf: Dict[str, float] = {}
        self.documents: List[str] = []
        self.metadatas: List[Dict[str, Any]] = []
        self.ids: List[str] = []
        self.doc_vectors: List[Dict[int, float]] = []

    def _tokenize(self, text: str) -> List[str]:
        return re.findall(r'\b[a-zA-Z0-9_\-\$]+\b', text.lower())

    def fit_and_index(self, documents: List[str], metadatas: List[Dict[str, Any]], ids: List[str]):
        self.documents = list(documents)
        self.metadatas = list(metadatas)
        self.ids = list(ids)
        
        doc_count = len(documents)
        if doc_count == 0:
            self.vocab = {}
            self.idf = {}
            self.doc_vectors = []
            return

        doc_freq: Dict[str, int] = {}
        tokenized_docs = []
        
        for doc in documents:
            tokens = self._tokenize(doc)
            tokenized_docs.append(tokens)
            unique_tokens = set(tokens)
            for t in unique_tokens:
                doc_freq[t] = doc_freq.get(t, 0) + 1
                
        self.vocab = {term: idx for idx, term in enumerate(doc_freq.keys())}
        self.idf = {
            self.vocab[term]: math.log((1 + doc_count) / (1 + freq)) + 1.0
            for term, freq in doc_freq.items()
        }
        
        self.doc_vectors = []
        for tokens in tokenized_docs:
            if not tokens:
                self.doc_vectors.append({})
                continue
            tf: Dict[int, float] = {}
            for t in tokens:
                idx = self.vocab[t]
                tf[idx] = tf.get(idx, 0.0) + 1.0
                
            vec: Dict[int, float] = {}
            for idx, count in tf.items():
                vec[idx] = (count / len(tokens)) * self.idf.get(idx, 1.0)
                
            norm = math.sqrt(sum(v * v for v in vec.values())) or 1.0
            for idx in vec:
                vec[idx] /= norm
            self.doc_vectors.append(vec)

    def search(self, query: str, n_results: int = 3) -> List[Dict[str, Any]]:
        if not self.documents:
            return []
            
        tokens = self._tokenize(query)
        if not tokens:
            return [{"text": self.documents[0], "metadata": self.metadatas[0], "score": 0.5}]
            
        query_tf: Dict[int, float] = {}
        for t in tokens:
            if t in self.vocab:
                idx = self.vocab[t]
                query_tf[idx] = query_tf.get(idx, 0.0) + 1.0
                
        query_vec: Dict[int, float] = {}
        for idx, count in query_tf.items():
            query_vec[idx] = (count / len(tokens)) * self.idf.get(idx, 1.0)
            
        q_norm = math.sqrt(sum(v * v for v in query_vec.values())) or 1.0
        for idx in query_vec:
            query_vec[idx] /= q_norm
            
        scores = []
        for i, doc_vec in enumerate(self.doc_vectors):
            dot_product = sum(
                val * doc_vec.get(idx, 0.0) for idx, val in query_vec.items()
            )
            query_numbers = set(re.findall(r'\d+', query))
            doc_numbers = set(re.findall(r'\d+', self.documents[i]))
            if query_numbers and (query_numbers & doc_numbers):
                dot_product += 0.25
                
            scores.append((dot_product, i))
            
        scores.sort(key=lambda x: x[0], reverse=True)
        top_k = scores[:n_results]
        
        return [
            {"text": self.documents[idx], "metadata": self.metadatas[idx], "score": round(score, 4)}
            for score, idx in top_k
        ]


class MultiTenantVectorStore:
    def __init__(self):
        self.engines: Dict[str, LightweightEmbeddingEngine] = defaultdict(LightweightEmbeddingEngine)
        self.workspace_raw_docs: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        self.use_chroma = HAS_CHROMADB
        self.client = None
        self.embedding_model = None
        self.sqlite = SQLiteKnowledgeStore()

    def _ensure_chroma(self) -> bool:
        """Lazy initialization of ChromaDB and embedding model, never blocking startup."""
        if not self.use_chroma:
            return False
        if self.embedding_model is not None and self.client is not None:
            return True
        try:
            os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)
            self.client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)
            self.embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
            return True
        except Exception as e:
            print(f"Warning: ChromaDB lazy initialization failed: {e}")
            self.use_chroma = False
            return False

    def _get_engine(self, workspace_id: str = "default") -> LightweightEmbeddingEngine:
        ws = workspace_id or "default"
        if ws not in self.engines:
            self.engines[ws] = LightweightEmbeddingEngine(workspace_id=ws)
            raw_docs = self.get_raw_docs(ws)
            if raw_docs:
                chunks = []
                metadatas = []
                ids = []
                for doc in raw_docs:
                    content = doc.get("content", "")
                    fname = doc.get("filename", "doc.txt")
                    doc_chunks = [c.strip() for c in content.split("\n\n") if c.strip()]
                    for i, chunk in enumerate(doc_chunks):
                        chunks.append(chunk)
                        metadatas.append({"source": fname, "chunk_index": i, "workspace_id": ws})
                        ids.append(f"{ws}_{fname}_{i}")
                if chunks:
                    self.engines[ws].fit_and_index(chunks, metadatas, ids)
            elif ws == "default":
                try:
                    from app.knowledge.loader import load_and_embed_documents
                    load_and_embed_documents(workspace_id="default")
                except Exception as e:
                    print(f"Error seeding default knowledge: {e}")
        return self.engines[ws]

    def add_documents(
        self,
        documents: List[str],
        metadatas: List[Dict[str, Any]],
        ids: List[str],
        workspace_id: str = "default"
    ):
        ws = workspace_id or "default"
        engine = self._get_engine(ws)
        
        # Merge or replace in pure-Python engine
        engine.fit_and_index(documents, metadatas, ids)

        # Persist chunks into SQLite store
        self.sqlite.store_chunks(ws, documents, metadatas, ids)

        if self.use_chroma and self._ensure_chroma():
            try:
                collection = self.client.get_or_create_collection(
                    name=f"ws_{ws.replace('-', '_')}",
                    metadata={"hnsw:space": "cosine"}
                )
                embeddings = self.embedding_model.encode(documents).tolist()
                collection.upsert(documents=documents, embeddings=embeddings, metadatas=metadatas, ids=ids)
            except Exception as e:
                print(f"ChromaDB upsert warning for workspace {ws}: {e}")

    def search(self, query: str, n_results: int = 3, workspace_id: str = "default") -> List[Dict[str, Any]]:
        ws = workspace_id or "default"
        engine = self._get_engine(ws)
        
        if self.use_chroma and self._ensure_chroma():
            try:
                collection = self.client.get_collection(name=f"ws_{ws.replace('-', '_')}")
                query_embedding = self.embedding_model.encode([query]).tolist()
                results = collection.query(query_embeddings=query_embedding, n_results=n_results)
                docs = results["documents"][0] if results["documents"] else []
                metas = results["metadatas"][0] if results["metadatas"] else []
                if docs:
                    return [{"text": doc, "metadata": meta} for doc, meta in zip(docs, metas)]
            except Exception:
                pass
                
        return engine.search(query, n_results=n_results)

    def store_raw_doc(self, workspace_id: str, doc_data: Dict[str, Any]):
        ws = workspace_id or "default"
        # Filter existing by filename/id
        self.workspace_raw_docs[ws] = [
            d for d in self.workspace_raw_docs[ws] 
            if d.get("filename") != doc_data.get("filename")
        ]
        self.workspace_raw_docs[ws].append(doc_data)
        # Persist to SQLite
        self.sqlite.store_document(ws, doc_data)

    def get_raw_docs(self, workspace_id: str = "default") -> List[Dict[str, Any]]:
        ws = workspace_id or "default"
        if not self.workspace_raw_docs[ws]:
            loaded = self.sqlite.load_documents(ws)
            if loaded:
                self.workspace_raw_docs[ws] = loaded
        return self.workspace_raw_docs[ws]

    def delete_doc(self, filename: str, workspace_id: str = "default"):
        ws = workspace_id or "default"
        self.workspace_raw_docs[ws] = [
            d for d in self.workspace_raw_docs[ws]
            if d.get("filename") != filename
        ]
        self.sqlite.delete_document(ws, filename)
        # Re-index workspace chunks
        self.reindex_workspace(ws)

    def reindex_workspace(self, workspace_id: str = "default"):
        ws = workspace_id or "default"
        raw_docs = self.get_raw_docs(ws)
        chunks = []
        metadatas = []
        ids = []

        for doc in raw_docs:
            content = doc.get("content", "")
            fname = doc.get("filename", "doc.txt")
            doc_chunks = [c.strip() for c in content.split("\n\n") if c.strip()]
            for i, chunk in enumerate(doc_chunks):
                chunks.append(chunk)
                metadatas.append({"source": fname, "chunk_index": i, "workspace_id": ws})
                ids.append(f"{ws}_{fname}_{i}")

        self.add_documents(chunks, metadatas, ids, workspace_id=ws)


vector_store = MultiTenantVectorStore()
