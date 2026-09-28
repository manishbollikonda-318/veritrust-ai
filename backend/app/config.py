from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional, List

class Settings(BaseSettings):
    APP_NAME: str = "VeriTrust AI Guardrail Engine"
    DEBUG: bool = False
    DEMO_MODE: bool = True
    EXPOSE_DOCS: bool = True        # Show /docs Swagger UI (independent of DEMO_MODE)
    PERMISSIVE_CORS: bool = False   # Restrict to explicit ALLOWED_ORIGINS by default
    # Multi-LLM Support (Problem Statement: OpenAI API, Anthropic API, or local Ollama + Gemini)
    DEFAULT_LLM_PROVIDER: str = "auto"
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o-mini"
    ANTHROPIC_API_KEY: Optional[str] = None
    ANTHROPIC_MODEL: str = "claude-3-5-sonnet-20241022"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3"
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-3.8-flash"

    ADMIN_API_KEY: Optional[str] = None  # Must be set via environment variable in production
    RATE_LIMIT_PER_MINUTE: int = 120
    CHROMA_PERSIST_DIR: str = "./chroma_db"
    SQLITE_DB_PATH: str = "./chroma_db/veritrust_sqlite.db"
    ALLOWED_ORIGINS: List[str] = [
        "https://veritrust-ai-gdgoc.onrender.com",
        "https://veritrust-ai-271n.onrender.com",
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        "http://127.0.0.1:8000",
        "http://localhost:8000"
    ]
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()

