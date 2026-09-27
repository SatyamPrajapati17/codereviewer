"use client";

import { useState } from "react";
import { TopNav } from "@/components/layout/TopNav";
import { SharpCard, MetadataLabel, SignalLimeCTA, OutlinedGreenButton, InputField, TabButton, NeonDivider, LogoTile, AccentWord, SectionEyebrow } from "@/components/ui";
import Link from "next/link";
import { api } from "@/lib/api";

const connectMethods: { id: "github" | "gitlab" | "manual"; label: string; icon: string; desc: string }[] = [
  { id: "github", label: "GITHUB", icon: "🐙", desc: "Connect via GitHub App for automatic PR reviews" },
  { id: "gitlab", label: "GITLAB", icon: "🦊", desc: "Connect via GitLab for merge request reviews" },
  { id: "manual", label: "MANUAL DIFF", icon: "📋", desc: "Paste a unified diff for instant review" },
];

export default function ConnectPage() {
  const [activeMethod, setActiveMethod] = useState<"github" | "gitlab" | "manual">("github");
  const [githubUrl, setGithubUrl] = useState("");
  const [gitlabUrl, setGitlabUrl] = useState("");
  const [diffContent, setDiffContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      let diffContentToSend = "";
      
      if (activeMethod === "manual") {
        diffContentToSend = diffContent;
      } else if (activeMethod === "github") {
        // In real app, this would trigger GitHub OAuth flow
        diffContentToSend = `diff --git a/example.py b/example.py\n+print("GitHub PR review")`;
      } else if (activeMethod === "gitlab") {
        diffContentToSend = `diff --git a/example.py b/example.py\n+print("GitLab MR review")`;
      }

      const response = await api.reviews.create({
        diff_content: diffContentToSend,
        trigger_type: activeMethod === "manual" ? "manual_diff" : "webhook",
        repository_full_name: "demo/repo",
      });

      setSuccess(`Review created! ID: ${response.id}`);
      setTimeout(() => {
        window.location.href = `/review/${response.id}`;
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to create review");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--surface-canvas)]">
      <TopNav />

      <main className="flex-1 max-w-[var(--page-max-width)] mx-auto px-6 py-12 w-full">
        <div className="text-center mb-12">
          <LogoTile size={80} className="mx-auto mb-6" />
          <MetadataLabel>REPO CONNECT</MetadataLabel>
          <h1 className="font-[var(--font-pt-serif)] font-light text-4xl mt-4 mb-4">
            Connect Your <span className="accent-word">Repository</span>
          </h1>
          <p className="text-[var(--color-ash)] max-w-xl mx-auto">
            Choose how to connect your codebase. GitHub/GitLab integration enables automatic reviews on every PR.
            Manual diff paste gives you instant feedback on any code change.
          </p>
        </div>

        <NeonDivider />

        {/* Method Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 justify-center" role="tablist" aria-label="Connection methods">
            {connectMethods.map((method) => (
              <button
                key={method.id}
                role="tab"
                aria-selected={activeMethod === method.id}
                className={`tab-btn ${activeMethod === method.id ? "active" : ""}`}
                onClick={() => setActiveMethod(method.id)}
                id={`${method.id}-tab`}
              >
                <span className="mr-2">{method.icon}</span>
                {method.label}
              </button>
            ))}
          </div>
        </div>

        {/* Method Content */}
        <SharpCard className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {(activeMethod === "github" || activeMethod === "gitlab") && (
              <>
                <MetadataLabel>{activeMethod.toUpperCase()} REPOSITORY URL</MetadataLabel>
                <InputField
                  type="url"
                  placeholder={`https://${activeMethod}.com/owner/repo/pull/123`}
                  value={activeMethod === "github" ? githubUrl : gitlabUrl}
                  onChange={(e) => activeMethod === "github" ? setGithubUrl(e.target.value) : setGitlabUrl(e.target.value)}
                  required
                />
                <p className="text-xs text-[var(--color-smoke)]">
                  Enter the full URL of a Pull Request (GitHub) or Merge Request (GitLab).
                </p>
              </>
            )}

            {activeMethod === "manual" && (
              <>
                <MetadataLabel>PASTE UNIFIED DIFF</MetadataLabel>
                <textarea
                  className="input-field min-h-[300px] font-[var(--font-jetbrains-mono)] text-sm resize-y"
                  placeholder={`diff --git a/src/example.py b/src/example.py
+API_KEY = "sk_live_abc123"
-  query = f"SELECT * FROM users WHERE id = {user_id}"
+  query = "SELECT * FROM users WHERE id = %s"
+  cursor.execute(query, (user_id,))`}
                  value={diffContent}
                  onChange={(e) => setDiffContent(e.target.value)}
                  required
                />
                <p className="text-xs text-[var(--color-smoke)]">
                  Paste a unified diff (output of <code className="text-[var(--color-signal-lime)]">git diff</code>). 
                  Include context lines for best results.
                </p>
              </>
            )}

            {error && (
              <div className="p-4 bg-[var(--color-critical)]/10 border border-[var(--color-critical)] rounded-[var(--radius-buttons)] text-[var(--color-critical)] text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="p-4 bg-[var(--color-critical)]/10 border border-[var(--color-signal-lime)] rounded-[var(--radius-buttons)] text-[var(--color-signal-lime)] text-sm">
                {success}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <SignalLimeCTA type="submit" className="w-full sm:w-auto flex-1" disabled={isLoading}>
                {isLoading ? "CREATING REVIEW..." : activeMethod === "manual" ? "RUN REVIEW" : "CONNECT & REVIEW"}
              </SignalLimeCTA>
              <Link href="/dashboard">
                <OutlinedGreenButton className="w-full sm:w-auto">
                  VIEW DASHBOARD
                </OutlinedGreenButton>
              </Link>
            </div>
          </form>
        </SharpCard>

        {/* Help Section */}
        <section className="mt-16 max-w-3xl mx-auto">
          <NeonDivider />
          <MetadataLabel>HOW TO GET A DIFF</MetadataLabel>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <SharpCard className="p-6">
              <h3 className="font-[var(--font-inter-tight)] font-medium text-lg mb-3">GitHub CLI</h3>
              <div className="code-block text-sm">
                <code>{"gh pr diff 123 > my-changes.diff"}</code>
              </div>
            </SharpCard>
            <SharpCard className="p-6">
              <h3 className="font-[var(--font-inter-tight)] font-medium text-lg mb-3">Git CLI</h3>
              <div className="code-block text-sm">
                <code>{"git diff main..feature-branch > my-changes.diff"}</code>
              </div>
            </SharpCard>
            <SharpCard className="p-6">
              <h3 className="font-[var(--font-inter-tight)] font-medium text-lg mb-3">GitLab CLI</h3>
              <div className="code-block text-sm">
                <code>{"glab mr diff 123 > my-changes.diff"}</code>
              </div>
            </SharpCard>
          </div>
        </section>
      </main>
    </div>
  );
}