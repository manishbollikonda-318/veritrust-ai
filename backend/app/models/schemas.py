import re
import html
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Literal, Dict, Any
from datetime import datetime
import uuid


def sanitize_text(v: str) -> str:
    if not isinstance(v, str):
        return v
    # Strip dangerous HTML tags and escape
    clean = re.sub(r'<[^>]*>', '', v)
    clean = html.escape(clean.strip())
    return clean


class Message(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str = Field(..., min_length=1, max_length=4000)

    @field_validator("content", mode="before")
    @classmethod
    def sanitize_content(cls, v):
        return sanitize_text(v)


class Claim(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    text: str
    verdict: Literal["Verified", "Unsupported", "Contradicted"]
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    severity: str = Field(default="none")           # none / medium / high / critical
    source_sentence: Optional[str] = None
    source_document: Optional[str] = None
    reasoning: str
    is_filler: bool = False
    retrieval_trace: Optional[dict] = None          # full audit trail of retrieval


class VerificationResult(BaseModel):
    is_safe: bool
    severity: Literal["none", "low", "high"] = "none"
    claims: List[Claim]
    overall_reasoning: str
    verification_time_ms: float = 0.0
    estimated_cost_usd: float = 0.0                 # cost transparency
    deterministic_checks_run: int = 0               # how many det. checks fired


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="Customer inquiry to be processed")
    session_id: Optional[str] = Field(default=None, max_length=100)
    workspace_id: str = Field(default="default", max_length=100)
    history: List[Message] = Field(default=[], max_length=50)
    demo_mode: Optional[bool] = None
    maker_only: bool = False

    @field_validator("message", mode="before")
    @classmethod
    def sanitize_input(cls, v):
        return sanitize_text(v)


class StandaloneVerifyRequest(BaseModel):
    draft: str = Field(..., min_length=1, max_length=10000, description="Draft response or text to verify against policies")
    workspace_id: str = Field(default="default", max_length=100)
    demo_mode: Optional[bool] = None

    @field_validator("draft", mode="before")
    @classmethod
    def sanitize_draft(cls, v):
        return sanitize_text(v)


class ChatResponse(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str = ""
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
    query: str = ""
    original_draft: str = ""
    final_response: str = ""
    
    # Dual-Agent core schema fields
    originalQuery: Optional[str] = None
    makerDraft: Optional[str] = None
    isHallucinated: Optional[bool] = None
    judgeCorrectedOutput: Optional[str] = None
    reasoning: Optional[str] = None

    verification: Optional[VerificationResult] = None
    status: Literal["Approved", "Corrected", "Blocked"] = "Approved"
    latency_ms: float = 0.0
    maker_latency_ms: float = 0.0
    judge_latency_ms: float = 0.0
    correction_latency_ms: float = 0.0
    correction_attempts: int = 0
    loop_history: List[Dict[str, Any]] = []
    llm_provider_used: str = "shared_default"
    generation_method: str = ""


class DriftPoint(BaseModel):
    timestamp: str
    pass_rate: float
    correction_rate: float
    block_rate: float
    query_index: int


class MetricData(BaseModel):
    total_queries: int
    pass_rate: float
    correction_rate: float
    block_rate: float
    total_claims: int
    verified_claims: int
    unsupported_claims: int
    contradicted_claims: int
    avg_latency_ms: float = 0.0
    avg_maker_latency_ms: float = 0.0
    avg_judge_latency_ms: float = 0.0
    avg_correction_latency_ms: float = 0.0
    approved_count: int = 0
    corrected_count: int = 0
    blocked_count: int = 0
    drift_data: List[DriftPoint] = []
    is_simulated_baseline: bool = False


class ConversationEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
    query: str
    original_draft: str
    final_response: str
    status: Literal["Approved", "Corrected", "Blocked"]
    verification: Optional[VerificationResult] = None
    latency_ms: float = 0.0


class KnowledgeDocument(BaseModel):
    filename: str
    title: str
    content: str
    chunk_count: int


class ComparisonResponse(BaseModel):
    query: str
    maker_only: ChatResponse
    maker_plus_judge: ChatResponse


class ReviewItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
    query: str
    workspace_id: str = "default"
    original_draft: str
    final_response: str
    status: Literal["Approved", "Corrected", "Blocked"]
    claims: List[Claim] = []
    overall_reasoning: str = ""
    severity: str = "medium"
    review_status: Literal["pending", "approved", "overridden", "dismissed"] = "pending"
    human_notes: Optional[str] = None
    learned_rule: Optional[str] = None
    is_sample: bool = False


class ReviewResolutionRequest(BaseModel):
    action: Literal["approve_correction", "override", "dismiss"]
    corrected_response: Optional[str] = None
    human_notes: Optional[str] = None
    add_to_knowledge_base: bool = True


class ReviewStatsResponse(BaseModel):
    pending_count: int
    resolved_count: int
    total_learned_rules: int
    system_accuracy_score: float = 98.4


class WorkspaceModel(BaseModel):
    id: str
    name: str
    industry: str = "Retail"
    description: str = ""
    is_demo: bool = False
    llm_provider: str = "shared_default"
    has_custom_api_key: bool = False
    api_key_masked: Optional[str] = None
    document_count: int = 0
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    access_token: Optional[str] = None
    token_expires_at: Optional[str] = None


class WorkspaceCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    industry: Optional[str] = Field(default="Retail", max_length=100)
    description: Optional[str] = Field(default="", max_length=500)
    initial_policy_title: Optional[str] = Field(default=None, max_length=200)
    initial_policy_content: Optional[str] = Field(default=None, max_length=50000)
    llm_provider: Optional[Literal["gemini", "openai", "anthropic", "ollama", "shared_default"]] = "shared_default"
    api_key: Optional[str] = Field(default=None, max_length=300)
    token_expiry_days: Optional[int] = Field(default=30, ge=1, le=365)


class WorkspaceSettingsUpdateRequest(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    industry: Optional[str] = Field(default=None, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)
    llm_provider: Optional[Literal["gemini", "openai", "anthropic", "ollama", "shared_default"]] = None
    api_key: Optional[str] = Field(default=None, max_length=300)

