const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const USE_MOCK = !process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL === 'http://localhost:8000';

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  if (USE_MOCK) {
    return mockApi<T>(path, options);
  }
  
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

async function mockApi<T>(path: string, options?: RequestInit): Promise<T> {
  await new Promise(r => setTimeout(r, 300));
  
  if (path === '/v1/reviews' && (!options || options.method === 'GET')) {
    return [{
      id: 'demo-1',
      repository_id: 'demo-repo',
      trigger_type: 'webhook',
      pr_url: 'https://github.com/demo/repo/pull/42',
      source_branch: 'feature/payment-fix',
      target_branch: 'main',
      diff_hash: 'abc123',
      status: 'completed',
      overall_verdict: 'blocked',
      lines_added: 142,
      lines_removed: 18,
      started_at: new Date(Date.now() - 3600000).toISOString(),
      completed_at: new Date().toISOString(),
      findings: [
        { id: 'f1', review_id: 'demo-1', subagent_run_id: 's1', category: 'security', severity: 'critical', cwe_ref: 'CWE-798', file_path: 'src/config.py', line_start: 12, line_end: 12, explanation: 'Hardcoded AWS secret key detected in source code. This credential should be moved to environment variables or a secrets manager.', confidence: 0.98, is_duplicate_of: false, duplicate_of_finding_id: null, status: 'verified', rationales: [{ category: 'security', explanation: 'Hardcoded credentials are a critical security risk', confidence: 0.98 }] },
        { id: 'f2', review_id: 'demo-1', subagent_run_id: 's1', category: 'security', severity: 'critical', cwe_ref: 'CWE-89', file_path: 'src/payments/processor.py', line_start: 45, line_end: 45, explanation: 'SQL injection vulnerability via string interpolation in query. Use parameterized queries instead.', confidence: 0.95, is_duplicate_of: false, duplicate_of_finding_id: null, status: 'verified', rationales: [{ category: 'security', explanation: 'Direct string interpolation allows SQL injection', confidence: 0.95 }] },
        { id: 'f3', review_id: 'demo-1', subagent_run_id: 's2', category: 'correctness', severity: 'high', cwe_ref: 'CWE-476', file_path: 'src/auth/middleware.py', line_start: 23, line_end: 23, explanation: 'Potential null pointer dereference: request.user may be undefined before checking is_admin.', confidence: 0.87, is_duplicate_of: false, duplicate_of_finding_id: null, status: 'verified', rationales: [{ category: 'correctness', explanation: 'Missing null check before property access', confidence: 0.87 }] },
        { id: 'f4', review_id: 'demo-1', subagent_run_id: 's3', category: 'security', severity: 'critical', cwe_ref: 'CWE-502', file_path: 'src/utils/helpers.py', line_start: 8, line_end: 10, explanation: 'Insecure deserialization using pickle.loads() on untrusted data. This can lead to arbitrary code execution.', confidence: 0.99, is_duplicate_of: false, duplicate_of_finding_id: null, status: 'verified', rationales: [{ category: 'security', explanation: 'pickle.loads on untrusted input enables RCE', confidence: 0.99 }] },
        { id: 'f5', review_id: 'demo-1', subagent_run_id: 's3', category: 'performance', severity: 'medium', cwe_ref: 'CWE-1052', file_path: 'src/payments/processor.py', line_start: 67, line_end: 70, explanation: 'O(n²) nested loop iterating over orders and items. Consider using a hash map for O(n) lookup.', confidence: 0.82, is_duplicate_of: false, duplicate_of_finding_id: null, status: 'verified', rationales: [{ category: 'performance', explanation: 'Nested loop over unbounded collections', confidence: 0.82 }] },
      ],
    }] as T;
  }
  
  if (path.startsWith('/v1/reviews/') && path.match(/^\/v1\/reviews\/[^/]+$/)) {
    const id = path.split('/')[3];
    if (id === 'demo-1') {
      return mockApi('/v1/reviews', { method: 'GET' }).then((reviews: any) => reviews[0]);
    }
    throw new Error('Not found');
  }
  
  if (path.startsWith('/v1/reviews/') && path.includes('/findings/') && path.endsWith('/patch')) {
    return {
      id: 'patch-1',
      finding_id: 'f2',
      diff_content: '-query = f"SELECT * FROM accounts WHERE user_id = \'{user_id}\'"\n+query = "SELECT * FROM accounts WHERE user_id = %s"\n+cursor.execute(query, (user_id,))',
      status: 'verified',
      tests_passed: true,
      test_command: 'pytest tests/ -xvs',
      tests_passed_count: 12,
      tests_failed_count: 0,
      failure_detail: null,
      generated_at: new Date().toISOString(),
      applied_at: null,
    } as T;
  }
  
  if (path.startsWith('/v1/reviews/') && path.includes('/findings/')) {
    return {
      id: 'f2',
      review_id: 'demo-1',
      subagent_run_id: 's1',
      category: 'security',
      severity: 'critical',
      cwe_ref: 'CWE-89',
      file_path: 'src/payments/processor.py',
      line_start: 45,
      line_end: 45,
      explanation: 'SQL injection vulnerability via string interpolation in query. Use parameterized queries instead.',
      confidence: 0.95,
      is_duplicate_of: false,
      duplicate_of_finding_id: null,
      status: 'verified',
      rationales: [{ category: 'security', explanation: 'Direct string interpolation allows SQL injection', confidence: 0.95 }],
    } as T;
  }
  
  throw new Error(`Mock not implemented for ${path}`);
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