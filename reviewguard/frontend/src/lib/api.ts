const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const USE_MOCK = !process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL === 'http://localhost:8000';

// In-memory mock store so created reviews persist for the session
const mockReviews: Review[] = [];

// Seeded demo PR from 04-APP-FLOW.md: 6 issues
// (hardcoded API key, SQL injection, missing input validation,
//  unhandled exception, missing test, inefficient loop)
function buildDemoReview(): Review {
  const started = new Date(Date.now() - 3600000).toISOString();
  const completed = new Date().toISOString();
  const finding = (
    id: string,
    subagent_run_id: string,
    category: string,
    severity: string,
    cwe_ref: string | null,
    file_path: string,
    line_start: number,
    line_end: number,
    explanation: string,
    confidence: number,
    status: string = 'open',
    rationale?: string,
  ): Finding => ({
    id,
    review_id: 'demo-1',
    subagent_run_id,
    category,
    severity,
    cwe_ref,
    file_path,
    line_start,
    line_end,
    explanation,
    confidence,
    is_duplicate_of: false,
    duplicate_of_finding_id: null,
    status,
    created_at: completed,
    rationales: [
      {
        category,
        explanation: rationale || explanation,
        confidence,
      },
    ],
  });

  return {
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
    started_at: started,
    completed_at: completed,
    findings: [
      finding(
        'f1', 's1', 'security', 'critical', 'CWE-798', 'src/config.py', 12, 12,
        'Hardcoded AWS secret key detected in source code. This credential should be moved to environment variables or a secrets manager.',
        0.98, 'verified', 'Hardcoded credentials are a critical security risk',
      ),
      finding(
        'f2', 's1', 'security', 'critical', 'CWE-89', 'src/payments/processor.py', 45, 45,
        'SQL injection vulnerability via string interpolation in query. Use parameterized queries instead.',
        0.95, 'verified', 'Direct string interpolation allows SQL injection',
      ),
      finding(
        'f3', 's2', 'correctness', 'high', 'CWE-20', 'src/api/handlers.py', 31, 38,
        'Missing input validation: user-supplied payload is passed to the handler without type or range checks, allowing malformed data to reach business logic.',
        0.9, 'open', 'Unvalidated input flows into domain logic',
      ),
      finding(
        'f4', 's2', 'correctness', 'high', 'CWE-476', 'src/auth/middleware.py', 23, 23,
        'Potential null pointer dereference: request.user may be undefined before checking is_admin. An unauthenticated request will raise an unhandled exception.',
        0.87, 'open', 'Missing null check before property access',
      ),
      finding(
        'f5', 's3', 'performance', 'medium', 'CWE-1052', 'src/payments/processor.py', 67, 70,
        'O(n²) nested loop iterating over orders and items. Consider using a hash map for O(n) lookup.',
        0.82, 'open', 'Nested loop over unbounded collections',
      ),
      finding(
        'f6', 's4', 'testing', 'medium', null, 'src/payments/processor.py', 0, 0,
        'Missing test coverage for the payment processing path — no test exercises the refund branch or the failure rollback.',
        0.85, 'open', 'Critical path lacks any test coverage',
      ),
    ],
  };
}

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
  
  // Seeded demo review with the 6 issues from the demo PR (04-APP-FLOW.md)
  if (mockReviews.length === 0) {
    mockReviews.push(buildDemoReview());
  }
  
  // Create a review: store it in-session so /review/[id] works in mock mode
  if (path === '/v1/reviews' && options && options.method === 'POST') {
    const body = options.body ? JSON.parse(options.body as string) : {};
    const id = 'demo-' + Math.random().toString(36).slice(2, 8);
    const now = new Date().toISOString();
    const newReview: Review = {
      id,
      repository_id: body.repository_full_name || 'demo/repo',
      trigger_type: body.trigger_type || 'manual_diff',
      pr_url: body.pr_url || null,
      source_branch: body.source_branch || null,
      target_branch: body.target_branch || 'main',
      diff_hash: Math.random().toString(36).slice(2, 10),
      status: 'completed',
      overall_verdict: 'blocked',
      lines_added: 142,
      lines_removed: 18,
      started_at: now,
      completed_at: now,
      findings: [],
    };
    mockReviews.push(newReview);
    return newReview as T;
  }
  
  if (path === '/v1/config/rules/demo-repo' && options && options.method === 'PUT') {
    const body = options.body ? JSON.parse(options.body as string) : {};
    return {
      id: 'rules-demo',
      repository_id: 'demo-repo',
      category_toggles: body.category_toggles ?? {
        security: true,
        correctness: true,
        performance: true,
        testing: true,
        maintainability: true,
      },
      blocking_severity_threshold: body.blocking_severity_threshold ?? 'high',
      ignored_paths: body.ignored_paths ?? [],
      updated_at: new Date().toISOString(),
    } as T;
  }
  
  if (path === '/v1/config/rules/demo-repo') {
    return {
      id: 'rules-demo',
      repository_id: 'demo-repo',
      category_toggles: {
        security: true,
        correctness: true,
        performance: true,
        testing: true,
        maintainability: true,
      },
      blocking_severity_threshold: 'high',
      ignored_paths: ['dist/**', '*.min.js'],
      updated_at: null,
    } as T;
  }
  
  if (path === '/v1/reviews' && (!options || options.method === 'GET')) {
    return mockReviews as T;
  }
  
  if (path.startsWith('/v1/reviews/') && path.match(/^\/v1\/reviews\/[^/]+$/)) {
    const id = path.split('/')[3];
    const review = mockReviews.find((r) => r.id === id);
    if (review) {
      return review as T;
    }
    throw new Error('Review not found');
  }
  
  if (path.startsWith('/v1/reviews/') && path.includes('/findings/') && path.endsWith('/apply')) {
    return { message: 'Patch applied in sandbox', tests_passed_count: 12 } as unknown as T;
  }
  
  if (path.startsWith('/v1/reviews/') && path.includes('/findings/') && path.endsWith('/patch')) {
    const parts = path.split('/'); // ['', 'v1', 'reviews', reviewId, 'findings', fid, 'patch']
    const fid = parts[5];
    return {
      id: 'patch-' + fid,
      finding_id: fid,
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
  
  if (path.startsWith('/v1/reviews/') && path.includes('/findings/') && !path.endsWith('/patch') && !path.endsWith('/apply')) {
    const parts = path.split('/'); // ['', 'v1', 'reviews', reviewId, 'findings', fid]
    const reviewId = parts[3];
    const fid = parts[5];
    const review = mockReviews.find((r) => r.id === reviewId);
    const finding = review?.findings?.find((f) => f.id === fid);
    if (finding) {
      return finding as unknown as T;
    }
    // Fall back to the seeded SQL-injection finding for unknown ids
    return mockApi('/v1/reviews/demo-1/findings/f2');
  }
  
  throw new Error(`Mock not implemented for ${path}`);
}

export const api = {
  reviews: {
    create: (data: { diff_content?: string; pr_url?: string; repository_full_name: string; source_branch?: string; target_branch?: string; trigger_type?: string }) =>
      fetchApi<Review>('/v1/reviews', { method: 'POST', body: JSON.stringify(data) }),
    
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
    getRules: (repoId: string) => fetchApi<RulesConfig>(`/v1/config/rules/${repoId}`),
    updateRules: (repoId: string, data: any) => 
      fetchApi<RulesConfig>(`/v1/config/rules/${repoId}`, { method: 'PUT', body: JSON.stringify(data) }),
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