"use client";

import { useEffect, useState, use } from "react";
import { TopNav } from "@/components/layout/TopNav";
import { SharpCard, MetadataLabel, StatusPill, SeverityBadge, SignalLimeCTA, NeonDivider, FindingCard, TabButton, AccentWord } from "@/components/ui";
import Link from "next/link";
import { api, Review, Finding, formatDate, getVerdictLabel } from "@/lib/api";

interface ReviewDetail extends Review {
  findings: Finding[];
}

const categories = ["all", "security", "correctness", "performance", "testing", "maintainability"];

export default function ReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [review, setReview] = useState<ReviewDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const data = await api.reviews.get(resolvedParams.id);
        setReview(data);
      } catch (err) {
        console.error("Failed to fetch review:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReview();
  }, [resolvedParams]);

  const filteredFindings = review?.findings.filter((f) =>
    activeCategory === "all" ? true : f.category === activeCategory
  ) || [];

  const severityCounts = review?.findings.reduce(
    (acc, f) => {
      acc[f.severity] = (acc[f.severity] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  ) || {};

  const verdictInfo = getVerdictLabel(review?.overall_verdict || null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopNav />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="loading-dots" aria-hidden="true">
              <span></span><span></span><span></span>
            </div>
            <p className="mt-4 text-[var(--color-ash)]">Loading review...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopNav />
        <main className="flex-1 flex items-center justify-center">
          <SharpCard className="text-center py-16">
            <h2>Review not found</h2>
            <SignalLimeCTA onClick={() => window.location.href = "/dashboard"} className="mt-4">
              BACK TO DASHBOARD
            </SignalLimeCTA>
          </SharpCard>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />

      <main className="flex-1 max-w-[var(--page-max-width)] mx-auto px-6 py-12 w-full">
        {/* Header */}
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
              <SignalLimeCTA onClick={() => window.location.href = "/dashboard"}>
                BACK TO DASHBOARD
              </SignalLimeCTA>
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

        {/* Executive Summary */}
        <SharpCard className="mb-8">
          <MetadataLabel>EXECUTIVE SUMMARY</MetadataLabel>
          <p className="mt-4 text-[var(--color-bone)]">
            ReviewGuard analyzed this change with 5 parallel specialized subagents. Found
            <strong className="text-[var(--color-chalk)]"> {review.findings.length} issues</strong>
            ({severityCounts.critical || 0} Critical, {severityCounts.high || 0} High,{ " "}
            {severityCounts.medium || 0} Medium, {severityCounts.low || 0} Low,{ " "}
            {severityCounts.info || 0} Info).
            { (severityCounts.critical || 0) + (severityCounts.high || 0) > 0
              ? " Merge blocked."
              : " No blocking issues."}
          </p>
        </SharpCard>

        {/* Category Tabs */}
        <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Finding categories">
          {categories.map((cat) => (
            <TabButton
              key={cat}
              role="tab"
              aria-selected={activeCategory === cat}
              active={activeCategory === cat}
              onClick={() => setActiveCategory(cat)}
              id={`${cat}-tab`}
            >
              {cat.toUpperCase()}
            </TabButton>
          ))}
        </div>

        {/* Findings List */}
        {filteredFindings.length === 0 ? (
          <SharpCard className="py-12 text-center">
            <div className="text-4xl mb-4">✓</div>
            <h2 className="text-xl mb-2">No findings in this category</h2>
            <p className="text-[var(--color-ash)]">Great work! No issues detected.</p>
          </SharpCard>
        ) : (
          <div className="space-y-4">
            {filteredFindings.map((finding) => (
              <FindingCard
                key={finding.id}
                severity={finding.severity}
                onClick={() => window.location.href = `/review/${review.id}/finding/${finding.id}`}
                style={{ cursor: "pointer" }}
              >
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
                    <Link
                      href={`/review/${review.id}/finding/${finding.id}`}
                      className="outlined-green-btn text-sm py-2 px-4"
                    >
                      VIEW DETAIL
                    </Link>
                  </div>
                </div>
              </FindingCard>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}