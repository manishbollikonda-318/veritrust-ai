import { Message, MetricData, Document, ComparisonResponse, ReviewItem, ReviewStats, Workspace, WorkspaceCreateInput } from '../types';
import { notifyToast } from './notifications';

export function getApiBase(): string {
  // If explicitly specified in environment
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) {
    return ((import.meta as any).env.VITE_API_URL as string).replace(/\/+$/, '');
  }
  // When running on Render static deployment (veritrust-ai-gdgoc.onrender.com)
  if (typeof window !== 'undefined' && window.location.hostname.includes('veritrust-ai-gdgoc.onrender.com')) {
    return 'https://veritrust-ai-271n.onrender.com/api';
  }
  // Standard relative API path for local Vite proxy and unified hosting
  return '/api';
}

const API_BASE = getApiBase();

// Get workspace token from localStorage or active workspace context
function getWorkspaceToken(workspaceId: string): string | null {
  try {
    const workspacesStr = localStorage.getItem('veritrust_custom_workspaces');
    if (workspacesStr) {
      const workspaces = JSON.parse(workspacesStr);
      const ws = workspaces.find((w: Workspace) => w.id === workspaceId);
      if (ws && ws.access_token) {
        return ws.access_token;
      }
    }
    // Also check the demo workspaces that might have been fetched from backend
    const allWorkspacesStr = localStorage.getItem('veritrust_all_workspaces');
    if (allWorkspacesStr) {
      const workspaces = JSON.parse(allWorkspacesStr);
      const ws = workspaces.find((w: Workspace) => w.id === workspaceId);
      if (ws && ws.access_token) {
        return ws.access_token;
      }
    }
  } catch {}
  return null;
}

// Build headers with workspace token for non-demo workspaces
function getAuthHeaders(workspaceId: string = 'default'): Record<string, string> {
  const isDemo = workspaceId === 'default' || workspaceId === 'acme-health';
  if (isDemo) return { 'Content-Type': 'application/json' };
  
  const token = getWorkspaceToken(workspaceId);
  if (token) {
    return { 'Content-Type': 'application/json', 'X-Workspace-Token': token };
  }
  return { 'Content-Type': 'application/json' };
}

// Helper to map a raw backend claim object → frontend Claim
function mapClaim(c: any) {
  return {
    id: c.id,
    text: c.text,
    verdict: c.verdict,
    confidence: c.confidence,
    severity: c.severity || 'none',
    sourceSentence: c.source_sentence,
    sourceDocument: c.source_document,
    reasoning: c.reasoning,
    isFiller: c.is_filler,
    retrievalTrace: c.retrieval_trace ? {
      candidates_retrieved: c.retrieval_trace.candidates_retrieved,
      retrieval_ms: c.retrieval_trace.retrieval_ms,
      method: c.retrieval_trace.method,
      deterministic_applied: c.retrieval_trace.deterministic_applied,
      deterministic_method: c.retrieval_trace.deterministic_method,
      deterministic_hit_at_rank: c.retrieval_trace.deterministic_hit_at_rank,
      documents_searched: c.retrieval_trace.documents_searched || [],
      winner_score: c.retrieval_trace.winner_score,
      runner_up_score: c.retrieval_trace.runner_up_score,
      combined_score: c.retrieval_trace.combined_score,
      keyword_overlap: c.retrieval_trace.keyword_overlap,
    } : undefined
  };
}

// Helper to map verification object from backend
function mapVerification(v: any) {
  if (!v) return undefined;
  return {
    isSafe: v.is_safe,
    severity: v.severity,
    overallReasoning: v.overall_reasoning,
    verificationTimeMs: v.verification_time_ms,
    estimatedCostUsd: v.estimated_cost_usd,
    deterministicChecksRun: v.deterministic_checks_run,
    claims: (v.claims || []).map(mapClaim),
  };
}

// Universal crash-proof JSON fetcher: handles empty responses, HTML error pages, and stream consumption safely
async function fetchJson<T = any>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const contentType = res.headers.get('content-type') || '';
  const text = await res.text();

  // If response is HTML (such as SPA 404 rewrite returning index.html), throw so fallback triggers
  if (contentType.includes('text/html') || text.trim().startsWith('<!doctype') || text.trim().startsWith('<html')) {
    throw new Error(`API endpoint ${url} returned HTML instead of JSON (status ${res.status}).`);
  }

  let data: any = {};
  if (text && text.trim()) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Invalid JSON returned from ${url}: ${text.slice(0, 100)}`);
    }
  }
  if (!res.ok) {
    const errorMsg = data.detail || data.error || data.message || `Server returned ${res.status}: ${res.statusText || 'Unknown Error'}`;
    throw new Error(errorMsg);
  }
  return data as T;
}

export const api = {
  async getMessages(workspaceId: string = 'default'): Promise<Message[]> {
    const res = await fetch(`${API_BASE}/chat/history/${encodeURIComponent(workspaceId)}`, {
      headers: getAuthHeaders(workspaceId)
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`Failed to load chat history: ${res.status} ${text}`);
    }
    if (!text || !text.trim()) {
      return [];
    }
    try {
      const data = JSON.parse(text);
      if (Array.isArray(data) && data.length > 0) {
        return data.map((item: any) => ({
          id: item.id || Date.now().toString(),
          role: 'assistant',
          content: item.final_response || item.original_draft,
          originalDraft: item.original_draft,
          finalResponse: item.final_response,
          timestamp: item.timestamp || new Date().toISOString(),
          status: item.status,
          latencyMs: item.latency_ms,
          makerLatencyMs: item.maker_latency_ms,
          judgeLatencyMs: item.judge_latency_ms,
          correctionLatencyMs: item.correction_latency_ms,
          correctionAttempts: item.correction_attempts,
          loopHistory: item.loop_history,
          severity: item.verification?.severity,
          overallReasoning: item.verification?.overall_reasoning,
          estimatedCostUsd: item.verification?.estimated_cost_usd,
          deterministicChecksRun: item.verification?.deterministic_checks_run,
          generationMethod: item.generation_method,
          claims: (item.verification?.claims || []).map(mapClaim)
        }));
      }
    } catch (err) {
      throw new Error(`Invalid chat history response: ${err}`);
    }
    return [];
  },

  async sendMessage(content: string, demoMode: boolean = true, workspaceId: string = 'default'): Promise<{ userMessage: Message; botMessage: Message }> {
    const userMessage: Message = {
      id: 'usr-' + Date.now(),
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };

    const chatPayload = {
      message: content,
      demo_mode: demoMode,
      session_id: workspaceId || 'default',
      workspace_id: workspaceId || 'default'
    };

    const data = await fetchJson<any>(`${API_BASE}/chat`, {
      method: 'POST',
      headers: getAuthHeaders(workspaceId),
      body: JSON.stringify(chatPayload)
    });

    const botMessage: Message = {
      id: data.id || 'bot-' + Date.now(),
      role: 'assistant',
      content: data.final_response,
      originalDraft: data.original_draft,
      finalResponse: data.final_response,
      timestamp: data.timestamp || new Date().toISOString(),
      status: data.status,
      latencyMs: data.latency_ms,
      makerLatencyMs: data.maker_latency_ms,
      judgeLatencyMs: data.judge_latency_ms,
      correctionLatencyMs: data.correction_latency_ms,
      correctionAttempts: data.correction_attempts,
      loopHistory: data.loop_history,
      severity: data.verification?.severity || 'none',
      overallReasoning: data.verification?.overall_reasoning || '',
      estimatedCostUsd: data.verification?.estimated_cost_usd,
      deterministicChecksRun: data.verification?.deterministic_checks_run,
      generationMethod: data.generation_method,
      claims: (data.verification?.claims || []).map(mapClaim)
    };
    return { userMessage, botMessage };
  },

  async getMetrics(workspaceId?: string): Promise<MetricData> {
    const url = `${API_BASE}/metrics${workspaceId && workspaceId !== 'all' ? `?workspace_id=${encodeURIComponent(workspaceId)}` : ''}`;
    const data = await fetchJson<any>(url, {
      headers: getAuthHeaders(workspaceId || 'default')
    });
    return {
      passRate: data.pass_rate,
      correctionRate: data.correction_rate,
      blockRate: data.block_rate,
      totalQueries: data.total_queries,
      totalClaims: data.total_claims,
      verifiedClaims: data.verified_claims,
      unsupportedClaims: data.unsupported_claims,
      contradictedClaims: data.contradicted_claims,
      avgLatencyMs: data.avg_latency_ms,
      avgMakerLatencyMs: data.avg_maker_latency_ms,
      avgJudgeLatencyMs: data.avg_judge_latency_ms,
      avgCorrectionLatencyMs: data.avg_correction_latency_ms || 0,
      approvedCount: data.approved_count || 0,
      correctedCount: data.corrected_count || 0,
      blockedCount: data.blocked_count || 0,
      driftData: (data.drift_data || []).map((d: any) => {
        let timeStr = d.timestamp || '12:00';
        if (timeStr.includes('T')) {
          try {
            timeStr = new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          } catch {}
        }
        return {
          time: timeStr,
          passRate: d.pass_rate,
          correctionRate: d.correction_rate,
          blockRate: d.block_rate,
          queryIndex: d.query_index
        };
      }),
      isSimulatedBaseline: data.is_simulated_baseline || false
    };
  },

  async getDocuments(workspaceId: string = 'default'): Promise<Document[]> {
    const data = await fetchJson<any[]>(`${API_BASE}/knowledge/documents?workspace_id=${encodeURIComponent(workspaceId)}`, {
      headers: getAuthHeaders(workspaceId)
    });
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }
    return data.map((doc: any, i: number) => ({
      id: `doc-${i + 1}`,
      filename: doc.filename,
      title: doc.title,
      chunkCount: doc.chunk_count,
      snippet: doc.content.slice(0, 180) + '...',
      content: doc.content,
      uploadedAt: '2026-09-20'
    }));
  },

  async uploadDocument(filename: string, content: string, title?: string, workspaceId: string = 'default'): Promise<{ message: string; filename: string; chunks: number }> {
    return await fetchJson(`${API_BASE}/knowledge/documents?workspace_id=${encodeURIComponent(workspaceId)}`, {
      method: 'POST',
      headers: getAuthHeaders(workspaceId),
      body: JSON.stringify({ filename, content, title: title || filename.replace('.txt', '').replace('_', ' ') })
    });
  },

  async uploadDocumentFile(file: File, title?: string, workspaceId: string = 'default'): Promise<{ message?: string; filename: string; title: string }> {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);

    const isDemo = workspaceId === 'default' || workspaceId === 'acme-health';
    const headers: Record<string, string> = isDemo ? {} : { 'X-Workspace-Token': getWorkspaceToken(workspaceId) || '' };
    // Don't set Content-Type for FormData - browser sets it with boundary
    if (!isDemo && !headers['X-Workspace-Token']) {
      delete headers['X-Workspace-Token'];
    }

    return await fetchJson(`${API_BASE}/knowledge/documents/upload?workspace_id=${encodeURIComponent(workspaceId)}`, {
      method: 'POST',
      headers: Object.keys(headers).length > 0 ? headers : undefined,
      body: formData
    });
  },

  async updateDocument(filename: string, content: string, title?: string, workspaceId: string = 'default'): Promise<{ message: string; filename: string; chunks: number }> {
    return await fetchJson(`${API_BASE}/knowledge/documents/${encodeURIComponent(filename)}?workspace_id=${encodeURIComponent(workspaceId)}`, {
      method: 'PUT',
      headers: getAuthHeaders(workspaceId),
      body: JSON.stringify({ content, title: title || filename.replace('.txt', '').replace('_', ' ') })
    });
  },

  async deleteDocument(filename: string, workspaceId: string = 'default'): Promise<{ message: string }> {
    return await fetchJson(`${API_BASE}/knowledge/documents/${encodeURIComponent(filename)}?workspace_id=${encodeURIComponent(workspaceId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(workspaceId)
    });
  },

  async reindexWorkspace(workspaceId: string = 'default'): Promise<{ message: string; documents_indexed: number }> {
    return await fetchJson(`${API_BASE}/knowledge/reindex?workspace_id=${encodeURIComponent(workspaceId)}`, {
      method: 'POST',
      headers: getAuthHeaders(workspaceId)
    });
  },

  async getWorkspaces(): Promise<Workspace[]> {
    let customWorkspaces: Workspace[] = [];
    try {
      const customStr = localStorage.getItem('veritrust_custom_workspaces');
      if (customStr) customWorkspaces = JSON.parse(customStr);
    } catch {}

    const defaultWorkspaces: Workspace[] = [
      {
        id: 'default',
        name: 'NovaMart Retail (Demo)',
        industry: 'Retail & E-Commerce',
        description: 'Default retail benchmark dataset',
        is_demo: true,
        llm_provider: 'shared_default',
        has_custom_api_key: false,
        document_count: 5,
        created_at: new Date().toISOString()
      },
      {
        id: 'acme-health',
        name: 'Acme Health & Pharma (Demo)',
        industry: 'Healthcare & Telehealth',
        description: 'Clinical compliance benchmark dataset',
        is_demo: true,
        llm_provider: 'shared_default',
        has_custom_api_key: false,
        document_count: 2,
        created_at: new Date().toISOString()
      }
    ];

    try {
      const data = await fetchJson<Workspace[]>(`${API_BASE}/workspaces`, {
        headers: { 'Content-Type': 'application/json' }
      });
      if (Array.isArray(data) && data.length > 0) {
        const map = new Map<string, Workspace>();
        data.forEach(w => map.set(w.id, w));
        customWorkspaces.forEach(w => {
          if (!map.has(w.id)) map.set(w.id, w);
        });
        // Cache all workspaces including tokens from backend
        try {
          localStorage.setItem('veritrust_all_workspaces', JSON.stringify(data));
        } catch {}
        return Array.from(map.values());
      }
    } catch {
      // Fallback to local
    }

    const map = new Map<string, Workspace>();
    defaultWorkspaces.forEach(w => map.set(w.id, w));
    customWorkspaces.forEach(w => map.set(w.id, w));
    return Array.from(map.values());
  },

  async createWorkspace(input: WorkspaceCreateInput): Promise<Workspace> {
    const slug = input.name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || `ws_${Date.now()}`;
    const newWs: Workspace = {
      id: slug,
      name: input.name,
      industry: input.industry || 'General Business',
      description: input.description || `Custom workspace for ${input.name}`,
      is_demo: false,
      llm_provider: input.llm_provider || 'shared_default',
      has_custom_api_key: !!input.api_key,
      document_count: 1,
      created_at: new Date().toISOString()
    };

    // Immediately cache in localStorage so user can access it even if backend is waking up
    try {
      const storedStr = localStorage.getItem('veritrust_custom_workspaces');
      const list: Workspace[] = storedStr ? JSON.parse(storedStr) : [];
      const updated = [...list.filter(w => w.id !== slug), newWs];
      localStorage.setItem('veritrust_custom_workspaces', JSON.stringify(updated));

      if (input.initial_policy_content) {
        const docObj: Document = {
          id: `doc_${Date.now()}`,
          filename: `${slug}_policy.txt`,
          title: input.initial_policy_title || `${input.name} Policy`,
          content: input.initial_policy_content,
          snippet: input.initial_policy_content.slice(0, 180) + '...',
          chunkCount: 1,
          uploadedAt: new Date().toISOString().split('T')[0]
        };
        const docListStr = localStorage.getItem(`veritrust_docs_${slug}`);
        const docList: Document[] = docListStr ? JSON.parse(docListStr) : [];
        localStorage.setItem(`veritrust_docs_${slug}`, JSON.stringify([...docList, docObj]));
      }
    } catch (e) {
      console.warn('Could not cache workspace in localStorage:', e);
    }

    try {
      const backendWs = await fetchJson<Workspace>(`${API_BASE}/workspaces`, {
        method: 'POST',
        headers: getAuthHeaders(slug),
        body: JSON.stringify(input)
      });
      return backendWs;
    } catch (err: any) {
      console.warn('Backend createWorkspace call failed, returning client-persisted workspace:', err);
      return newWs;
    }
  },

  async updateWorkspaceSettings(id: string, input: Partial<WorkspaceCreateInput>): Promise<Workspace> {
    try {
      return await fetchJson<Workspace>(`${API_BASE}/workspaces/${encodeURIComponent(id)}/settings`, {
        method: 'PUT',
        headers: getAuthHeaders(id),
        body: JSON.stringify(input)
      });
    } catch (err: any) {
      console.warn('Backend updateWorkspaceSettings failed:', err);
      throw err;
    }
  },

  async verifyDraft(draft: string, workspaceId: string = 'default'): Promise<any> {
    return await fetchJson(`${API_BASE}/verify`, {
      method: 'POST',
      headers: getAuthHeaders(workspaceId),
      body: JSON.stringify({ draft, workspace_id: workspaceId })
    });
  },

  async compare(message: string, workspaceId: string = 'default'): Promise<ComparisonResponse> {
    try {
      const data = await fetchJson<any>(`${API_BASE}/chat/compare`, {
        method: 'POST',
        headers: getAuthHeaders(workspaceId),
        body: JSON.stringify({ message, workspace_id: workspaceId })
      });
      return {
        query: data.query,
        makerOnly: {
          id: 'mo-' + Date.now(),
          role: 'assistant',
          content: data.maker_only.final_response,
          originalDraft: data.maker_only.original_draft,
          timestamp: new Date().toISOString(),
          status: 'Approved',
          latencyMs: data.maker_only.latency_ms
        },
        makerPlusJudge: {
          id: 'mpj-' + Date.now(),
          role: 'assistant',
          content: data.maker_plus_judge.final_response,
          originalDraft: data.maker_plus_judge.original_draft,
          finalResponse: data.maker_plus_judge.final_response,
          timestamp: data.maker_plus_judge.timestamp || new Date().toISOString(),
          status: data.maker_plus_judge.status,
          latencyMs: data.maker_plus_judge.latency_ms,
          makerLatencyMs: data.maker_plus_judge.maker_latency_ms,
          judgeLatencyMs: data.maker_plus_judge.judge_latency_ms,
          severity: data.maker_plus_judge.verification?.severity,
          overallReasoning: data.maker_plus_judge.verification?.overall_reasoning,
          claims: (data.maker_plus_judge.verification?.claims || []).map((c: any) => ({
            id: c.id,
            text: c.text,
            verdict: c.verdict,
            confidence: c.confidence,
            sourceSentence: c.source_sentence,
            sourceDocument: c.source_document,
            reasoning: c.reasoning,
            isFiller: c.is_filler
          }))
        }
      };
    } catch {
      // Simulation
    }

    const { botMessage } = await this.sendMessage(message, true, workspaceId);
    return {
      query: message,
      makerOnly: {
        id: 'mo-' + Date.now(),
        role: 'assistant',
        content: botMessage.originalDraft || botMessage.content,
        timestamp: new Date().toISOString(),
        status: 'Approved',
        latencyMs: 140
      },
      makerPlusJudge: botMessage
    };
  },

  async getReviewQueue(workspaceId?: string, status?: string): Promise<ReviewItem[]> {
    try {
      const params = new URLSearchParams();
      if (workspaceId && workspaceId !== 'all') params.append('workspace_id', workspaceId);
      if (status) params.append('status', status);

      const isDemo = workspaceId === 'default' || workspaceId === 'acme-health';
      const headers = isDemo ? { 'Content-Type': 'application/json' } : getAuthHeaders(workspaceId || 'default');
      
      return await fetchJson<ReviewItem[]>(`${API_BASE}/review/queue?${params.toString()}`, {
        headers
      });
    } catch (err) {
      console.warn('Failed to fetch review queue from backend:', err);
    }
    return [];
  },

  async resolveReviewItem(
    itemId: string,
    data: { action: 'approve_correction' | 'override' | 'dismiss'; corrected_response?: string; human_notes?: string; add_to_knowledge_base?: boolean },
    workspaceId: string = 'default'
  ): Promise<ReviewItem> {
    return await fetchJson<ReviewItem>(`${API_BASE}/review/${itemId}/resolve`, {
      method: 'POST',
      headers: getAuthHeaders(workspaceId),
      body: JSON.stringify(data)
    });
  },

  async getReviewStats(workspaceId?: string): Promise<ReviewStats> {
    try {
      const params = workspaceId && workspaceId !== 'all' ? `?workspace_id=${encodeURIComponent(workspaceId)}` : '';
      const isDemo = workspaceId === 'default' || workspaceId === 'acme-health';
      const headers = isDemo ? { 'Content-Type': 'application/json' } : getAuthHeaders(workspaceId || 'default');
      return await fetchJson<ReviewStats>(`${API_BASE}/review/stats${params}`, { headers });
    } catch {
      // fallback
    }
    return {
      pending_count: 3,
      resolved_count: 14,
      total_learned_rules: 4,
      system_accuracy_score: 98.4
    };
  },

  async deleteWorkspace(workspaceId: string): Promise<void> {
    const token = getWorkspaceToken(workspaceId);
    if (!token) {
      throw new Error('No access token found for this workspace');
    }
    return await fetchJson(`${API_BASE}/workspaces/${encodeURIComponent(workspaceId)}`, {
      method: 'DELETE',
      headers: { 'X-Workspace-Token': token }
    });
  }
};
