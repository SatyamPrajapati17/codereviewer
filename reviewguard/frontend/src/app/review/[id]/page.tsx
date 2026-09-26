import { TopNav } from "@/components/layout/TopNav";
import { SharpCard, MetadataLabel, StatusPill, SeverityBadge, NeonDivider, FindingCard } from "@/components/ui";
import Link from "next/link";
import { api, Review, Finding, formatDate, getVerdictLabel } from "@/lib/api";

export const dynamic = 'force-dynamic';

interface ReviewDetail extends Review {
  findings: Finding[];
}

async function getReview(id: string) {
  try {
    return await api.reviews.get(id);
  } catch {
    return null;
  }
}

const categories = ["all", "security", "correctness", "performance", "testing", "maintainability"];

export default async function ReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const review = await getReview(resolvedParams.id);

  if (!review) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopNav />
        <main className="flex-1 flex items-center justify-center">
          <SharpCard className="text-center py-16">
            <h2>Review not found</h2>
            <Link href="/dashboard" className="signal-lime-cta mt-4 inline-block">
              BACK TO DASHBOARD
            </Link>
          </SharpCard>
        </main>
      </div>
    );
  }

  const severityCounts = review.findings.reduce(
    (acc, f) => {
      acc[f.severity] = (acc[f.severity] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  ) || {};

  const verdictInfo = getVerdictLabel(review.overall_verdict || null);

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      <main className="flex-1 max-w-[var(--page-max-width)] mx-auto px-6 py-12 w-full">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <MetadataLabel>REVIEW DETAIL</MetadataLabel>
              <h1 className="mt-2">
                {review.pr_url ? review.pr_url.split("/").pop() : "Manual Diff Review"}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className={`status-pill ${verdictInfo.className}`}>{verdictInfo.label}</span>
              <Link href="/dashboard" className="signal-lime-cta">
                BACK TO DASHBOARD
              </Link>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--color-ash)]">
            <span className="font-[var(--font-jetbrains-mono)]">
              +{review.lines_added ?? 0} / -{review.lines_removed ?? 0}
            </span>
            <span className="flex items-center gap-2">
              <SeverityBadge severity="critical" /> {severityCounts.critical || 0}
              <SeverityBadge severity="high" /> {severityCounts.high || 0}
              <SeverityBadge severity="medium" /> {severityCounts.medium || 0}
              <SeverityBadge severity="low" /> {severityCounts.low || 0}
              <SeverityBadge severity="info" /> {severityCounts.info || 0}
            </span>
          </div>
        </div>
        <NeonDivider />
        <SharpCard className="mb-8">
          <MetadataLabel>EXECUTIVE SUMMARY</MetadataLabel>
          <p className="mt-4 text-[var(--color-bone)]">
            ReviewGuard analyzed this change with 5 parallel specialized subagents. Found
            <strong className="text-[var(--color-chalk)]"> {review.findings.length} issues</strong>
            ({severityCounts.critical || 0} Critical, {severityCounts.high || 0} High, {" "}
            {severityCounts.medium || 0} Medium, {severityCounts.low || 0} Low, {" "}
            {severityCounts.info || 0} Info).
            { (severityCounts.critical || 0) + (severityCounts.high || 0) > 0
              ? " Merge blocked."
              : " No blocking issues."}
          </p>
        </SharpCard>
        <div className="space-y-4">
          {review.findings.map((finding) => (
            <Link key={finding.id} href={`/review/${review.id}/finding/${finding.id}`} className="block">
              <FindingCard severity={finding.severity} className="cursor-pointer hover:bg-[var(--surface-hover)] transition-colors">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="font-[var(--font-pt-serif)] font-light text-lg truncate">
                        {finding.file_path}
                      </span>
                      <SeverityBadge severity={finding.severity} />
                      <span className="text-[var(--color-ash)] text-sm uppercase tracking-wider">
                        {finding.category}
                      </span>
                      {finding.cwe_ref && (
                        <span className="text-[var(--color-smoke)] text-sm">
                          {finding.cwe_ref}
                        </span>
                      )}
                    </div>
                    <p className="text-[var(--color-bone)] line-clamp-2">
                      {finding.explanation}
                    </p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-[var(--color-smoke)]">
                      <span className="font-[var(--font-jetbrains-mono)]">
                        Lines {finding.line_start}–{finding.line_end}
                      </span>
                      <span>Confidence: {(finding.confidence * 100).toFixed(0)}%</span>
                      <span className={`status-pill ${finding.status === "verified" ? "" : "opacity-50"}`}>
                        {finding.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="outlined-green-btn text-sm py-2 px-4 pointer-events-none">
                      VIEW DETAIL
                    </span>
                  </div>
                </div>
              </FindingCard>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}