export type ClaimStatus = 'Approved' | 'Corrected' | 'Blocked';
export type ClaimVerdict = 'Verified' | 'Unsupported' | 'Contradicted';
export type ClaimSeverity = 'none' | 'medium' | 'high' | 'critical';

export interface RetrievalTrace {
  candidates_retrieved: number;
  retrieval_ms: number;
  method: string;
  deterministic_applied: boolean;
  deterministic_method?: string;
  deterministic_hit_at_rank?: number;
  documents_searched: string[];
  winner_score: number;
  runner_up_score: number;
  combined_score?: number;
  keyword_overlap?: number;
}

export interface Claim {
  id: string;
  text: string;
  verdict: ClaimVerdict;
  confidence?: number;
  severity?: ClaimSeverity;
  sourceSentence?: string;
  sourceDocument?: string;
  reasoning: string;
  isFiller?: boolean;
  retrievalTrace?: RetrievalTrace;
}

export interface VerificationResult {
  isSafe: boolean;
  severity: 'none' | 'low' | 'high';
  claims: Claim[];
  overallReasoning: string;
  verificationTimeMs: number;
  estimatedCostUsd?: number;
  deterministicChecksRun?: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  status?: ClaimStatus;
  originalDraft?: string;
  finalResponse?: string;
  originalQuery?: string;
  makerDraft?: string;
  isHallucinated?: boolean;
  judgeCorrectedOutput?: string;
  reasoning?: string;
  claims?: Claim[];
  overallReasoning?: string;
  severity?: 'none' | 'low' | 'high';
  latencyMs?: number;
  makerLatencyMs?: number;
  judgeLatencyMs?: number;
  correctionLatencyMs?: number;
  correctionAttempts?: number;
  loopHistory?: any[];
  estimatedCostUsd?: number;
  deterministicChecksRun?: number;
  generationMethod?: string;
}

export interface DriftDataPoint {
  time: string;
  passRate: number;
  correctionRate: number;
  blockRate: number;
  queryIndex?: number;
}

export interface MetricData {
  passRate: number;
  correctionRate: number;
  blockRate: number;
  totalQueries: number;
  totalClaims: number;
  verifiedClaims: number;
  unsupportedClaims: number;
  contradictedClaims: number;
  avgLatencyMs: number;
  avgMakerLatencyMs?: number;
  avgJudgeLatencyMs?: number;
  avgCorrectionLatencyMs?: number;
  approvedCount?: number;
  correctedCount?: number;
  blockedCount?: number;
  driftData?: DriftDataPoint[];
  isSimulatedBaseline?: boolean;
}

export interface Document {
  id: string;
  filename?: string;
  title: string;
  snippet?: string;
  content?: string;
  chunkCount?: number;
  uploadedAt?: string;
}

export interface ComparisonResponse {
  query: string;
  makerOnly: Message;
  makerPlusJudge: Message;
}

export interface ReviewItem {
  id: string;
  timestamp: string;
  query: string;
  workspace_id: string;
  original_draft: string;
  final_response: string;
  status: 'Approved' | 'Corrected' | 'Blocked';
  claims: Claim[];
  overall_reasoning: string;
  severity: 'none' | 'medium' | 'high' | 'critical';
  review_status: 'pending' | 'approved' | 'overridden' | 'dismissed';
  human_notes?: string;
  learned_rule?: string;
  is_sample?: boolean;
}

export interface ReviewStats {
  pending_count: number;
  resolved_count: number;
  total_learned_rules: number;
  system_accuracy_score: number;
}

export interface Workspace {
  id: string;
  name: string;
  industry: string;
  description?: string;
  is_demo: boolean;
  llm_provider: 'shared_default' | 'gemini' | 'openai' | 'anthropic' | 'ollama';
  has_custom_api_key: boolean;
  api_key_masked?: string;
  document_count: number;
  created_at: string;
  access_token?: string;
  token_expires_at?: string;
}

export interface WorkspaceCreateInput {
  name: string;
  industry?: string;
  description?: string;
  initial_policy_title?: string;
  initial_policy_content?: string;
  llm_provider?: 'shared_default' | 'gemini' | 'openai' | 'anthropic' | 'ollama';
  api_key?: string;
}


