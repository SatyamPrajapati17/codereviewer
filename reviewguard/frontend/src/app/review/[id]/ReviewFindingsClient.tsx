"use client";

import { useState } from "react";
import { SharpCard, MetadataLabel, SeverityBadge, TabButton, FindingCard } from "@/components/ui";
import Link from "next/link";
import { Finding } from "@/lib/api";

interface ReviewFindingsClientProps {
  review: {
    id: string;
    findings: Finding[];
  };
}

const categories = ["all", "security", "correctness", "performance", "testing", "maintainability"];

export function ReviewFindingsClient({ review }: ReviewFindingsClientProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filteredFindings = review.findings.filter((f) =>
    activeCategory === "all" ? true : f.category === activeCategory
  );

  const handleFindingClick = (findingId: string) => {
    window.location.href = `/review/${review.id}/finding/${findingId}`;
  };

  if (filteredFindings.length === 0) {
    return (
      <SharpCard className="py-12 text-center">
        <div className="text-4xl mb-4">✓</div>
        <h2 className="text-xl mb-2">No findings in this category</h2>
        <p className="text-[var(--color-ash)]">Great work! No issues detected.</p>
      </SharpCard>
    );
  }

  return (
    <div>
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
            <div
              key={finding.id}
              className="cursor-pointer"
              onClick={() => handleFindingClick(finding.id)}
            >
              <FindingCard severity={finding.severity}>
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}