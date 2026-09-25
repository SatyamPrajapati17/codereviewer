const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }
  
  return res.json();
}

export const api = {
  reviews: {
    create: (data: { diff_content?: string; pr_url?: string; repository_full_name: string; source_branch?: string; target_branch?: string; trigger_type?: string }) =>
      fetchApi('/v1/reviews', { method: 'POST', body: JSON.stringify(data) }),
    
    list: (params?: { repository_id?: string; status?: string; limit?: number; offset?: number }) => {
      const search = new URLSearchParams();
      if (params) Object.entries(params).forEach(([k, v]) => v && search.set(k, String(v)));
      return fetchApi<Review[]>(`/v1/reviews?${search.toString()}`);
    },
    
    get: (id: string) => fetchApi<ReviewDetail>(`/v1/reviews/${id}`),
  },
  
  findings: {
    get: (reviewId: string, findingId: string) => 
      fetchApi<Finding>(`/v1/reviews/${reviewId}/findings/${findingId}`),
    
    getPatch: (reviewId: string, findingId: string) =>
      fetchApi<Patch>(`/v1/reviews/${reviewId}/findings/${findingId}/patch`),
    
    applyPatch: (reviewId: string, findingId: string) =>
      fetchApi<{ message: string; tests_passed_count?: number }>(`/v1/reviews/${reviewId}/findings/${findingId}/apply`, { method: 'POST' }),
  },
  
  config: {
    getRules: (repoId: string) => fetchApi(`/v1/config/rules/${repoId}`),
    updateRules: (repoId: string, data: any) => 
      fetchApi(`/v1/config/rules/${repoId}`, { method: 'PUT', body: JSON.stringify(data) }),
  },
  
  webhooks: {
    github: (payload: any) => fetchApi('/v1/webhooks/github', { method: 'POST', body: JSON.stringify(payload) }),
    gitlab: (payload: any) => fetchApi('/v1/webhooks/gitlab', { method: 'POST', body: JSON.stringify(payload) }),
  },
};
 
export type ReviewDetail = Review & {
  findings: Finding[];
};
 
export type Review = {
  id: string;
  repository_id: string;
  trigger_type: string;
  pr_url: string | null;
  source_branch: string | null;
  target_branch: string | null;
  diff_hash: string;
  status: string;
  overall_verdict: string | null;
  lines_added: number | null;
  lines_removed: number | null;
  started_at: string | null;
  completed_at: string | null;
  findings?: Finding[];
};

export type Finding = {
  id: string;
  review_id: string;
  subagent_run_id: string;
  category: string;
  severity: string;
  cwe_ref: string | null;
  file_path: string;
  line_start: number;
  line_end: number;
  explanation: string;
  confidence: number;
  is_duplicate_of: boolean;
  duplicate_of_finding_id: string | null;
  status: string;
  created_at: string;
  test_skeleton?: string;
  refactor_suggestion?: string;
  rationales?: Array<{ category: string; explanation: string; confidence: number }>;
};

export type Patch = {
  id: string;
  finding_id: string;
  diff_content: string;
  status: string;
  tests_passed: boolean | null;
  test_command: string;
  tests_passed_count: number;
  tests_failed_count: number;
  failure_detail: string | null;
  generated_at: string | null;
  applied_at: string | null;
};

export type RulesConfig = {
  id: string;
  repository_id: string;
  category_toggles: Record<string, boolean>;
  blocking_severity_threshold: string;
  ignored_paths: string[];
  updated_at: string | null;
};

export const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getVerdictLabel = (verdict: string | null) => {
  switch (verdict) {
    case 'blocked': return { label: '● BLOCKED', className: 'text-red-400' };
    case 'passed': return { label: '✓ PASSED', className: 'text-green-400' };
    case 'needs_attention': return { label: '⚠ NEEDS ATTENTION', className: 'text-yellow-400' };
    default: return { label: '⟳ PENDING', className: 'text-gray-500' };
  }
};