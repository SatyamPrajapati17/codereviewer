"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TopNav } from "@/components/layout/TopNav";
import { SharpCard, MetadataLabel, StatusPill, SeverityBadge, SignalLimeCTA, NeonDivider, TabButton, FindingCard, LoadingDots } from "@/components/ui";
import { api, Review, Finding, formatDate } from "@/lib/api";

interface SeverityCounts {
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  info_count: number;
}

interface ReviewWithCounts extends Review, SeverityCounts {}

function computeSeverityCounts(findings: Finding[]): SeverityCounts {
  const counts: SeverityCounts = { critical_count: 0, high_count: 0, medium_count: 0, low_count: 0, info_count: 0 };
  findings.forEach(f => {
    const key = `${f.severity}_count` as keyof SeverityCounts;
    if (counts[key] !== undefined) counts[key]++;
  });
  return counts;
}

export default function DashboardPage() {
  const [reviews, setReviews] = useState<ReviewWithCounts[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "blocked" | "passed" | "needs_attention">("all");
  const router = useRouter();

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const data = await api.reviews.list();
      const reviewsWithCounts = data.map((r: Review) => ({
        ...r,
        ...computeSeverityCounts(r.findings || []),
      }));
      setReviews(reviewsWithCounts);
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (activeTab === "all") return true;
    if (activeTab === "blocked") return r.overall_verdict === "blocked";
    if (activeTab === "passed") return r.overall_verdict === "passed";
    if (activeTab === "needs_attention") return r.overall_verdict === "needs_attention";
    return true;
  });

  const getVerdictBadge = (verdict: string | null) => {
    switch (verdict) {
      case "blocked":
        return <StatusPill>● BLOCKED</StatusPill>;
      case "passed":
        return <StatusPill style={{ borderColor: "#22c55e", color: "#22c55e" }}>✓ PASSED</StatusPill>;
      case "needs_attention":
        return <StatusPill style={{ borderColor: "#eab308", color: "#eab308" }}>⚠ NEEDS ATTENTION</StatusPill>;
      default:
        return <StatusPill style={{ borderColor: "#7a7a7a", color: "#7a7a7a" }}>⟳ PENDING</StatusPill>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />

      <main className="flex-1 max-w-[var(--page-max-width)] mx-auto px-6 py-12 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <MetadataLabel>REVIEW DASHBOARD</MetadataLabel>
            <h1 className="mt-2">Review History</h1>
          </div>
          <Link href="/connect">
            <SignalLimeCTA>
              NEW REVIEW
            </SignalLimeCTA>
          </Link>
        </div>

        <NeonDivider />

        {/* Tabs */}
        <div className="mb-6 flex gap-2" role="tablist" aria-label="Review filters">
          {[
            { id: "all", label: "ALL" },
            { id: "blocked", label: "BLOCKED" },
            { id: "needs_attention", label: "NEEDS ATTENTION" },
            { id: "passed", label: "PASSED" },
          ].map((tab) => (
            <TabButton
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              id={`${tab.id}-tab`}
            >
              {tab.label}
            </TabButton>
          ))}
        </div>

        {/* Reviews List */}
        {isLoading ? (
          <SharpCard className="py-12 text-center">
            <LoadingDots />
            <p className="mt-4 text-[var(--color-ash)]">Loading reviews...</p>
          </SharpCard>
        ) : filteredReviews.length === 0 ? (
          <SharpCard className="py-16 text-center">
            <div className="text-4xl mb-4">📋</div>
            <h2 className="text-xl mb-2">No reviews yet</h2>
            <p className="text-[var(--color-ash)] mb-6">Run your first review to see results here</p>
            <Link href="/connect">
            <SignalLimeCTA>
              RUN FIRST REVIEW
            </SignalLimeCTA>
          </Link>
          </SharpCard>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <FindingCard
                key={review.id}
                severity={review.overall_verdict === "blocked" ? "critical" : review.overall_verdict === "passed" ? "low" : "medium"}
                onClick={() => router.push(`/review/${review.id}`)}
                style={{ cursor: "pointer" }}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-[var(--font-pt-serif)] font-light text-lg truncate">
                        {review.pr_url ? review.pr_url.split("/").pop() : "Manual Diff"}
                      </h3>
                      {getVerdictBadge(review.overall_verdict)}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--color-ash)]">
                      <span className="font-[var(--font-jetbrains-mono)]">
                        +{review.lines_added ?? 0} / -{review.lines_removed ?? 0}
                      </span>
                      <span>{formatDate(review.started_at)}</span>
                      <span className="flex items-center gap-2">
                        <SeverityBadge severity="critical" /> {review.critical_count}
                        <SeverityBadge severity="high" /> {review.high_count}
                        <SeverityBadge severity="medium" /> {review.medium_count}
                        <SeverityBadge severity="low" /> {review.low_count}
                        <SeverityBadge severity="info" /> {review.info_count}
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-[var(--color-smoke)] text-sm">
                    <p>Click to view details</p>
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

function getVerdictBadge(verdict: string | null) {
  switch (verdict) {
    case "blocked":
      return <StatusPill>● BLOCKED</StatusPill>;
    case "passed":
      return <StatusPill style={{ borderColor: "#22c55e", color: "#22c55e" }}>✓ PASSED</StatusPill>;
    case "needs_attention":
      return <StatusPill style={{ borderColor: "#eab308", color: "#eab308" }}>⚠ NEEDS ATTENTION</StatusPill>;
    default:
      return <StatusPill style={{ borderColor: "#7a7a7a", color: "#7a7a7a" }}>⟳ PENDING</StatusPill>;
  }
}