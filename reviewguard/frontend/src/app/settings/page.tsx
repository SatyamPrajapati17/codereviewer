"use client";

import { useEffect, useState } from "react";
import { TopNav } from "@/components/layout/TopNav";
import {
  SharpCard,
  MetadataLabel,
  SignalLimeCTA,
  NeonDivider,
  LoadingDots,
  InputField,
} from "@/components/ui";
import { api, RulesConfig } from "@/lib/api";

const CATEGORIES: { id: string; label: string; desc: string }[] = [
  { id: "security", label: "SECURITY", desc: "Secrets, injection, unsafe deserialization, auth bypass" },
  { id: "correctness", label: "CORRECTNESS", desc: "Null derefs, logic bugs, off-by-one, resource leaks" },
  { id: "performance", label: "PERFORMANCE", desc: "O(n²) loops, N+1 queries, unbounded memory" },
  { id: "testing", label: "TESTING", desc: "Missing tests on critical paths and error branches" },
  { id: "maintainability", label: "MAINTAINABILITY", desc: "Duplication, oversized functions, naming" },
];

const SEVERITIES = ["info", "low", "medium", "high", "critical"];

export default function SettingsPage() {
  const [rules, setRules] = useState<RulesConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [ignoredPathsText, setIgnoredPathsText] = useState("");

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const data = await api.config.getRules("demo-repo");
      setRules(data);
      setIgnoredPathsText((data.ignored_paths || []).join("\n"));
    } catch (err: any) {
      setError(err.message || "Failed to load rules");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rules) return;
    setError("");
    setSuccess("");
    setIsSaving(true);
    try {
      const payload = {
        category_toggles: rules.category_toggles,
        blocking_severity_threshold: rules.blocking_severity_threshold,
        ignored_paths: ignoredPathsText
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      const updated = await api.config.updateRules("demo-repo", payload);
      setRules(updated);
      setSuccess("Rules saved.");
    } catch (err: any) {
      setError(err.message || "Failed to save rules");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleCategory = (id: string) => {
    if (!rules) return;
    setRules({
      ...rules,
      category_toggles: { ...rules.category_toggles, [id]: !rules.category_toggles[id] },
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--surface-canvas)]">
      <TopNav />

      <main className="flex-1 max-w-[var(--page-max-width)] mx-auto px-6 py-12 w-full">
        <MetadataLabel>SETTINGS / RULES</MetadataLabel>
        <h1 className="mt-2 mb-8">Review Rules</h1>

        <NeonDivider />

        {isLoading ? (
          <SharpCard className="py-12 text-center">
            <LoadingDots />
            <p className="mt-4 text-[var(--color-ash)]">Loading rules...</p>
          </SharpCard>
        ) : !rules ? (
          <SharpCard className="py-12 text-center">
            <p className="text-[var(--color-ash)]">{error || "No rules config found."}</p>
          </SharpCard>
        ) : (
          <form onSubmit={handleSave} className="space-y-8 max-w-3xl">
            {/* Category toggles */}
            <section>
              <MetadataLabel>REVIEWER CATEGORIES</MetadataLabel>
              <div className="mt-4 space-y-3">
                {CATEGORIES.map((cat) => {
                  const enabled = rules.category_toggles[cat.id] !== false;
                  return (
                    <SharpCard key={cat.id} className="p-5 flex items-start justify-between gap-6">
                      <div className="min-w-0">
                        <h3 className="font-[var(--font-inter-tight)] font-medium text-sm uppercase tracking-wider text-[var(--color-chalk)]">
                          {cat.label}
                        </h3>
                        <p className="text-sm text-[var(--color-ash)] mt-1">{cat.desc}</p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={enabled}
                        aria-label={`Toggle ${cat.label}`}
                        onClick={() => toggleCategory(cat.id)}
                        className="flex-shrink-0 relative w-12 h-6 rounded-full transition-colors"
                        style={{ backgroundColor: enabled ? "var(--color-signal-lime)" : "var(--color-slate)" }}
                      >
                        <span
                          className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform"
                          style={{
                            backgroundColor: "var(--color-void-black)",
                            transform: enabled ? "translateX(24px)" : "translateX(0)",
                          }}
                        />
                      </button>
                    </SharpCard>
                  );
                })}
              </div>
            </section>

            {/* Blocking threshold */}
            <section>
              <MetadataLabel>BLOCKING SEVERITY THRESHOLD</MetadataLabel>
              <p className="text-sm text-[var(--color-ash)] mt-2 mb-4">
                Findings at or above this severity will block the PR.
              </p>
              <div className="flex flex-wrap gap-3">
                {SEVERITIES.map((sev) => {
                  const active = rules.blocking_severity_threshold === sev;
                  return (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setRules({ ...rules, blocking_severity_threshold: sev })}
                      className="severity-badge"
                      style={{
                        cursor: "pointer",
                        ...(active
                          ? { backgroundColor: "var(--color-signal-lime)", color: "var(--color-void-black)", borderColor: "var(--color-signal-lime)" }
                          : {}),
                      }}
                    >
                      {sev.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Ignored paths */}
            <section>
              <MetadataLabel>IGNORED PATHS</MetadataLabel>
              <p className="text-sm text-[var(--color-ash)] mt-2 mb-4">
                One glob per line. Files matching these patterns are skipped during review.
              </p>
              <textarea
                className="input-field min-h-[120px] font-[var(--font-jetbrains-mono)] text-sm resize-y"
                placeholder={"dist/**\n*.min.js\nvendor/**"}
                value={ignoredPathsText}
                onChange={(e) => setIgnoredPathsText(e.target.value)}
              />
            </section>

            {error && (
              <div
                className="p-4 border rounded-[var(--radius-buttons)] text-sm"
                style={{
                  borderColor: "var(--color-critical)",
                  color: "var(--color-critical)",
                  backgroundColor: "rgba(239, 68, 68, 0.08)",
                }}
              >
                {error}
              </div>
            )}
            {success && (
              <div
                className="p-4 border rounded-[var(--radius-buttons)] text-sm"
                style={{
                  borderColor: "var(--color-signal-lime)",
                  color: "var(--color-signal-lime)",
                  backgroundColor: "rgba(197, 255, 74, 0.08)",
                }}
              >
                {success}
              </div>
            )}

            <div className="pt-2">
              <SignalLimeCTA type="submit" disabled={isSaving || isLoading}>
                {isSaving ? "SAVING..." : "SAVE RULES"}
              </SignalLimeCTA>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
