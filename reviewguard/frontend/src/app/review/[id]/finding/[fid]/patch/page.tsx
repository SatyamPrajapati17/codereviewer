"use client";

import { useEffect, useState } from "react";
import { TopNav } from "@/components/layout/TopNav";
import { SharpCard, MetadataLabel, StatusPill, SeverityBadge, SignalLimeCTA, NeonDivider, OutlinedGreenButton, CodeBlock, SectionEyebrow, LoadingDots } from "@/components/ui";
import Link from "next/link";
import { api, Patch } from "@/lib/api";

export default function PatchPreviewPage({
  params,
}: {
  params: { id: string; fid: string };
}) {
  const resolvedParams = params;
  const [patch, setPatch] = useState<Patch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [applyResult, setApplyResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    const fetchPatch = async () => {
      try {
        const data = await api.findings.getPatch(resolvedParams.id, resolvedParams.fid);
        setPatch(data);
      } catch (err) {
        console.error("Failed to fetch patch:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedParams.id, resolvedParams.fid]);

  const handleApply = async () => {
    setIsApplying(true);
    try {
      const data = await api.findings.applyPatch(resolvedParams.id, resolvedParams.fid);
      setApplyResult({ success: true, message: data.message || "Patch applied successfully" });
      setPatch({ ...patch!, status: "verified", tests_passed: true, tests_passed_count: data.tests_passed_count || 0 });
    } catch (err: any) {
      setApplyResult({ success: false, message: err.message || "Failed to apply patch" });
    } finally {
      setIsApplying(false);
    }
  };

  const reviewId = resolvedParams.id;
  const findingId = resolvedParams.fid;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopNav />
        <main className="flex-1 flex items-center justify-center">
          <LoadingDots />
        </main>
      </div>
    );
  }

  if (!patch) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopNav />
        <main className="flex-1 flex items-center justify-center">
          <SharpCard className="text-center py-16">
            <h2>Patch not found</h2>
          </SharpCard>
        </main>
      </div>
    );
  }

  const getStatusLabel = () => {
    if (patch.tests_passed === true) return "✓ VERIFIED";
    if (patch.tests_passed === false) return "✗ FAILED";
    return "⟳ SUGGESTED";
  };

  const getStatusColor = () => {
    if (patch.tests_passed === true) return { borderColor: "#22c55e", color: "#22c55e" };
    if (patch.tests_passed === false) return { borderColor: "#ef4444", color: "#ef4444" };
    return {};
  };

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />

      <main className="flex-1 max-w-[var(--page-max-width)] mx-auto px-6 py-12 w-full">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/review/${reviewId}/finding/${findingId}`} className="ghost-nav-btn mb-4 inline-block">
            ← BACK TO FINDING
          </Link>

          <div className="flex items-center gap-4 mb-4">
            <h1 className="font-[var(--font-pt-serif)] font-light text-2xl">PATCH PREVIEW</h1>
            <StatusPill style={getStatusColor()}>{getStatusLabel()}</StatusPill>
          </div>
        </div>

        <NeonDivider />

        {/* Diff View */}
        <SharpCard className="mb-8">
          <SectionEyebrow>SUGGESTED CHANGES</SectionEyebrow>
          <CodeBlock language="diff" className="mt-4">
            {patch.diff_content || "// No patch available"}
          </CodeBlock>
        </SharpCard>

        {/* Test Status */}
        <SharpCard className="mb-8">
          <div className="flex items-center justify-between">
            <SectionEyebrow>TEST VERIFICATION</SectionEyebrow>
            <span className="font-[var(--font-jetbrains-mono)] text-sm text-[var(--color-ash)]">
              {patch.test_command}
            </span>
          </div>
          <div className="mt-4 flex items-center gap-4">
            {patch.tests_passed === true ? (
              <StatusPill style={{ borderColor: "#22c55e", color: "#22c55e" }}>
                ✓ {patch.tests_passed_count} PASSED
              </StatusPill>
            ) : patch.tests_passed === false ? (
              <StatusPill style={{ borderColor: "#ef4444", color: "#ef4444" }}>
                ✗ {patch.tests_failed_count} FAILED
              </StatusPill>
            ) : (
              <StatusPill>⟳ NOT RUN</StatusPill>
            )}
          </div>
          {patch.failure_detail && (
            <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-md">
              <CodeBlock language="text" className="mt-2">
                {patch.failure_detail}
              </CodeBlock>
            </div>
          )}
        </SharpCard>

        {/* Actions */}
        <SharpCard>
          <SectionEyebrow>ACTIONS</SectionEyebrow>
          <div className="mt-4 flex flex-wrap gap-4">
            {patch.tests_passed !== true && (
              <SignalLimeCTA onClick={handleApply} disabled={isApplying}>
                {isApplying ? (
                  <>
                    <LoadingDots />
                    <span className="ml-2">APPLYING...</span>
                  </>
                ) : (
                  "APPLY PATCH"
                )}
              </SignalLimeCTA>
            )}
            <OutlinedGreenButton onClick={() => navigator.clipboard.writeText(patch.diff_content)}>
              COPY PATCH
            </OutlinedGreenButton>
            <OutlinedGreenButton onClick={() => alert("Edit patch - opens inline editor")}>
              EDIT BEFORE APPLYING
            </OutlinedGreenButton>
          </div>
          {applyResult && (
            <div className={`mt-4 p-4 rounded-md ${applyResult.success ? "bg-green-900/20 border border-green-500/30 text-green-400" : "bg-red-900/20 border border-red-500/30 text-red-400"}`}>
              {applyResult.message}
            </div>
          )}
        </SharpCard>
      </main>
    </div>
  );
}