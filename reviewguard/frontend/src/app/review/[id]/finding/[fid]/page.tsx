"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "@/components/layout/TopNav";
import { SharpCard, MetadataLabel, StatusPill, SeverityBadge, SignalLimeCTA, NeonDivider, OutlinedGreenButton, CodeBlock, AccentWord, SectionEyebrow } from "@/components/ui";
import Link from "next/link";
import { api, Finding } from "@/lib/api";

export default function FindingDetailPage({
  params,
}: {
  params: { id: string; fid: string };
}) {
  const resolvedParams = params;
  const [finding, setFinding] = useState<Finding | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchFinding = async () => {
      try {
        const data = await api.findings.get(resolvedParams.id, resolvedParams.fid);
        setFinding(data);
      } catch (err) {
        console.error("Failed to fetch finding:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFinding();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedParams.id, resolvedParams.fid]);

  if (isLoading || !finding) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopNav />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="loading-dots" aria-hidden="true">
              <span></span><span></span><span></span>
            </div>
            <p className="mt-4 text-[var(--color-ash)]">Loading finding...</p>
          </div>
        </main>
      </div>
    );
  }

  const reviewId = resolvedParams.id;

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />

      <main className="flex-1 max-w-[var(--page-max-width)] mx-auto px-6 py-12 w-full">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/review/${reviewId}`} className="ghost-nav-btn mb-4 inline-block">
            ← BACK TO REVIEW
          </Link>

          <div className="flex flex-wrap items-center gap-4 mb-4">
            <SeverityBadge severity={finding.severity} />
            <span className="text-[var(--color-ash)] text-sm uppercase tracking-wider">
              {finding.category}
            </span>
            {finding.cwe_ref && (
              <span className="font-[var(--font-jetbrains-mono)] text-sm">
                {finding.cwe_ref}
              </span>
            )}
            <StatusPill>{finding.status.toUpperCase()}</StatusPill>
          </div>

          <h1 className="font-[var(--font-pt-serif)] font-light text-2xl">
            {finding.file_path}:{finding.line_start}–{finding.line_end}
          </h1>
        </div>

        <NeonDivider />

        {/* Code Context */}
        <SharpCard className="mb-8">
          <SectionEyebrow>CODE CONTEXT</SectionEyebrow>
          <CodeBlock language="python">
            {`// ${finding.file_path}:${finding.line_start}-${finding.line_end}
// [Diff context would be rendered here]
// This is a placeholder for the actual diff view`}
          </CodeBlock>
        </SharpCard>

        {/* Explanation */}
        <SharpCard className="mb-8">
          <SectionEyebrow>EXPLANATION</SectionEyebrow>
          <div className="mt-4 text-[var(--color-bone)] whitespace-pre-wrap leading-relaxed">
            {finding.explanation}
          </div>
          <div className="mt-4 flex items-center gap-4 text-sm text-[var(--color-smoke)]">
            <span>Confidence: <strong className="text-[var(--color-chalk)]">{(finding.confidence * 100).toFixed(0)}%</strong></span>
            <span>Category: <strong className="text-[var(--color-chalk)]">{finding.category}</strong></span>
          </div>
        </SharpCard>

        {/* Rationales */}
        {finding.rationales && finding.rationales.length > 1 && (
          <SharpCard className="mb-8">
            <SectionEyebrow>DUAL-FLAGGED RATIONALES</SectionEyebrow>
            <div className="mt-4 space-y-4">
              {finding.rationales.map((r, i) => (
                <div key={i} className="p-4 bg-[var(--surface-raised)] border border-[var(--color-graphite)]">
                  <div className="flex items-center gap-2 mb-2">
                    <SeverityBadge severity="low" />
                    <span className="font-[var(--font-inter-tight)] font-medium uppercase tracking-wider text-sm">
                      {r.category.toUpperCase()}
                    </span>
                    <span className="text-[var(--color-ash)] text-sm">Confidence: {(r.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <p className="text-[var(--color-bone)] text-sm">{r.explanation}</p>
                </div>
              ))}
            </div>
          </SharpCard>
        )}

        {/* Actions */}
        <SharpCard className="mb-8">
          <SectionEyebrow>ACTIONS</SectionEyebrow>
          <div className="mt-4 flex flex-wrap gap-4">
            <SignalLimeCTA onClick={() => router.push(`/review/${reviewId}/finding/${finding.id}/patch`)}>
              VIEW SUGGESTED PATCH
            </SignalLimeCTA>
            <OutlinedGreenButton onClick={() => alert("Dismiss action - requires reason")}>
              DISMISS
            </OutlinedGreenButton>
            <OutlinedGreenButton onClick={() => alert("Mark as false positive")}>
              MARK FALSE POSITIVE
            </OutlinedGreenButton>
          </div>
        </SharpCard>

        {/* Test Skeleton */}
        {finding.test_skeleton && (
          <SharpCard className="mb-8">
            <SectionEyebrow>SUGGESTED TEST SKELETON</SectionEyebrow>
            <CodeBlock language="python" className="mt-4">
              {finding.test_skeleton}
            </CodeBlock>
          </SharpCard>
        )}

        {/* Refactor Suggestion */}
        {finding.refactor_suggestion && (
          <SharpCard className="mb-8">
            <SectionEyebrow>REFACTOR SUGGESTION</SectionEyebrow>
            <div className="mt-4 text-[var(--color-bone)] whitespace-pre-wrap leading-relaxed">
              {finding.refactor_suggestion}
            </div>
          </SharpCard>
        )}
      </main>
    </div>
  );
}