"use client";

import { motion, Variants } from "framer-motion";
import { TopNav } from "@/components/layout/TopNav";
import { SignalLimeCTA, OutlinedGreenButton, SharpCard, MetadataLabel, NeonDivider, LogoTile, AccentWord, SectionEyebrow, SeverityBadge } from "@/components/ui";
import Link from "next/link";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.3 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const logoVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring" as const, duration: 0.8, stiffness: 100, damping: 15 },
  },
};

const pulseVariants: Variants = {
  pulse: {
    boxShadow: [
      "0 0 0 0 rgba(197, 255, 74, 0.4)",
      "0 0 30px 10px rgba(197, 255, 74, 0.3)",
      "0 0 0 0 rgba(197, 255, 74, 0.4)",
    ],
  },
};

const floatVariants: Variants = {
  hidden: { y: 0 },
  float: {
    y: [0, -10, 0],
    transition: { duration: 4, repeat: Infinity, ease: "easeInOut" as const },
  },
};

const featureVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.2 + i * 0.1, duration: 0.5 },
  }),
};

const statVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { type: "spring" as const, delay: 0.3 + i * 0.08, duration: 0.4 },
  }),
};

const features = [
  {
    icon: "🔒",
    title: "SECURITY",
    desc: "Hardcoded secrets, SQL/command injection, auth bypass, unsafe crypto, insecure deserialization",
    severity: "critical",
  },
  {
    icon: "🐛",
    title: "CORRECTNESS",
    desc: "Null dereferences, bare except clauses, off-by-one errors, logic bugs, resource leaks",
    severity: "high",
  },
  {
    icon: "⚡",
    title: "PERFORMANCE",
    desc: "O(n²) loops, N+1 queries, redundant computation, missing pagination, unbounded memory",
    severity: "medium",
  },
  {
    icon: "🧪",
    title: "TESTING",
    desc: "Missing tests on critical paths, untested error branches, missing parameterized tests",
    severity: "medium",
  },
  {
    icon: "🔧",
    title: "MAINTAINABILITY",
    desc: "Duplicate code, oversized functions, unclear naming, mixed responsibilities",
    severity: "low",
  },
  {
    icon: "✅",
    title: "VERIFIED PATCHES",
    desc: "Auto-generated fixes tested in sandbox before merge — never ship broken code",
    severity: "info",
  },
];

const stats = [
  { label: "PARALLEL AGENTS", value: "5" },
  { label: "AVG REVIEW TIME", value: "< 5min" },
  { label: "VULNERABILITY CLASSES", value: "8" },
  { label: "PATCH VERIFICATION", value: "100%" },
];

const pipelineSteps = [
  { step: "01", label: "DIFF INTAKE", desc: "Parse git diff / PR URL, normalize to structured hunks with context" },
  { step: "02", label: "DETERMINISTIC PRE-PASS", desc: "Semgrep + Gitleaks scan for secrets & injection patterns" },
  { step: "03", label: "5 PARALLEL SUBAGENTS", desc: "Security, Correctness, Performance, Testing, Maintainability — isolated contexts" },
  { step: "04", label: "AGGREGATE & DEDUPE", desc: "Merge overlapping findings, highest severity wins, preserve all rationales" },
  { step: "05", label: "PATCH GENERATION", desc: "Minimal unified diffs for Medium+ findings, scoped to sandbox" },
  { step: "06", label: "TEST VERIFICATION", desc: "Apply patches in sandbox, run test suite, mark Verified/Failed" },
  { step: "07", label: "REPORT DELIVERY", desc: "PR comment + Dashboard, severity-ranked, with before/after diffs" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--surface-canvas)]">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {/* Grid Lines */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `
            linear-gradient(rgba(197, 255, 74, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(197, 255, 74, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }} />
        
        {/* Floating Orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(197,255,74,0.15) 0%, transparent 70%)" }}
          initial="hidden"
          animate="float"
          variants={floatVariants}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(197,255,74,0.1) 0%, transparent 70%)" }}
          initial="hidden"
          animate="float"
          variants={{
            hidden: { y: 0 },
            float: { y: [0, 15, 0], transition: { duration: 5, repeat: Infinity, delay: 1, ease: "easeInOut" as const } },
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-48 h-48 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(197,255,74,0.08) 0%, transparent 70%)" }}
          initial="hidden"
          animate="float"
          variants={{
            hidden: { x: 0, y: 0 },
            float: { y: [0, -12, 0], x: [0, 8, 0], transition: { duration: 6, repeat: Infinity, delay: 2, ease: "easeInOut" as const } },
          }}
        />
      </div>

      <TopNav />

      <main className="flex-1 relative z-10">
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center justify-center px-6 pt-20">
          <motion.div
            className="max-w-[var(--page-max-width)] mx-auto w-full text-center"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Logo with glow animation */}
            <motion.div
              className="flex justify-center mb-10"
              variants={logoVariants}
            >
              <LogoTile size={100} />
            </motion.div>

            {/* Badge */}
            <motion.div className="mb-8" variants={itemVariants}>
              <MetadataLabel>IBM BOB HACKATHON — TRACK 3</MetadataLabel>
            </motion.div>

            {/* Headline */}
            <motion.h1
              className="font-[var(--font-pt-serif)] font-light mb-6"
              style={{ 
                fontSize: 'clamp(3rem, 8vw, 7.5rem)',
                lineHeight: 0.9,
                letterSpacing: '-0.03em',
                color: 'var(--color-chalk)',
              }}
              variants={itemVariants}
            >
              Five Parallel Reviewers.
              <br />
              <span className="accent-word">One Verified Report.</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              className="max-w-2xl mx-auto mb-12"
              style={{ 
                fontSize: 'clamp(1.1rem, 2vw, 1.3rem)',
                lineHeight: 1.7,
                color: 'var(--color-ash)',
              }}
              variants={itemVariants}
            >
              Security, correctness, performance, testing, and maintainability — all in under five minutes.
              Zero false-positive noise. Every patch tested before you see it.
            </motion.p>

            {/* CTAs */}
            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16"
              variants={itemVariants}
            >
              <Link href="/connect" className="w-full sm:w-auto">
                <SignalLimeCTA className="w-full sm:w-auto px-10 py-4 text-lg">
                  RUN YOUR FIRST REVIEW
                </SignalLimeCTA>
              </Link>
              <Link href="/dashboard" className="w-full sm:w-auto">
                <OutlinedGreenButton className="w-full sm:w-auto px-10 py-4 text-lg">
                  VIEW DEMO DASHBOARD
                </OutlinedGreenButton>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-[var(--page-max-width)] mx-auto"
              variants={containerVariants}
            >
              {stats.map((stat, i) => (
                <motion.div key={stat.label} variants={statVariants} custom={i}>
                  <SharpCard className="text-center py-8 px-6">
                    <div className="font-[var(--font-jetbrains-mono)] text-4xl font-bold text-[var(--color-signal-lime)]">
                      {stat.value}
                    </div>
                    <div className="text-xs uppercase tracking-widest text-[var(--color-smoke)] mt-2">
                      {stat.label}
                    </div>
                  </SharpCard>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            className="absolute bottom-10 left-1/2 -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ opacity: 0.5 }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M19 12l-7 7-7-7" stroke="#c5ff4a" />
            </svg>
          </motion.div>
        </section>

        {/* Pipeline Section */}
        <section className="py-28 px-6">
          <div className="max-w-[var(--page-max-width)] mx-auto">
            <SectionEyebrow>HOW IT WORKS</SectionEyebrow>
            <h2 className="font-[var(--font-pt-serif)] font-light text-4xl mb-16 text-center">
              The <span className="accent-word">Pipeline</span>
            </h2>

            <div className="space-y-6">
              {pipelineSteps.map((step, i) => (
                <motion.div
                  key={step.step}
                  className="relative"
                  variants={itemVariants}
                  whileHover={{ x: 8, transition: { duration: 0.3 } }}
                >
                  {/* Step connector line (except last) */}
                  {i < pipelineSteps.length - 1 && (
                    <div className="absolute left-8 top-0 w-px h-full bg-[var(--color-graphite)] -translate-x-1/2" />
                  )}
                  <SharpCard className="relative pl-20 md:pl-28 py-6">
                    <div className="flex items-start gap-6">
                      <div className="flex-shrink-0 w-16 text-center relative z-10">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-signal-lime)] text-[var(--color-void-black)] font-[var(--font-jetbrains-mono)] text-xl font-bold mx-auto">
                          {step.step}
                        </div>
                        {/* Connector dot */}
                        <div className="w-px h-16 bg-[var(--color-graphite)] mx-auto mt-2" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-[var(--font-inter-tight)] font-medium text-lg uppercase tracking-wider text-[var(--color-signal-lime)] mb-2">
                          {step.label}
                        </h3>
                        <p className="text-[var(--color-ash)] leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  </SharpCard>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-28 px-6 bg-[var(--surface-card)] border-y border-[var(--color-graphite)]">
          <div className="max-w-[var(--page-max-width)] mx-auto px-6">
            <SectionEyebrow>SPECIALIZED REVIEWERS</SectionEyebrow>
            <h2 className="font-[var(--font-pt-serif)] font-light text-4xl mb-16 text-center">
              Five <span className="accent-word">Specialists</span>. Zero Blind Spots.
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  className="p-8 bg-[var(--surface-canvas)] border border-[var(--color-graphite)] hover:border-[var(--color-signal-lime)] transition-colors duration-300"
                  variants={featureVariants}
                  custom={i}
                  whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(197,255,74,0.1)", transition: { duration: 0.3 } }}
                >
                  <div className="text-5xl mb-4" style={{ filter: "drop-shadow(0 4px 20px rgba(197,255,74,0.3))" }}>
                    {feature.icon}
                  </div>
                  <h3 className="font-[var(--font-inter-tight)] font-medium text-lg uppercase tracking-wider text-[var(--color-signal-lime)] mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-[var(--color-ash)] leading-relaxed">{feature.desc}</p>
                  <div className="mt-6 pt-4 border-t border-[var(--color-graphite)] flex items-center justify-between">
                    <SeverityBadge severity={feature.severity} />
                    <span className="font-[var(--font-jetbrains-mono)] text-xs text-[var(--color-smoke)]">
                      {feature.severity.toUpperCase()} SEVERITY
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Demo PR Section */}
        <section className="py-28 px-6">
          <div className="max-w-[var(--page-max-width)] mx-auto">
            <SectionEyebrow>LIVE DEMO</SectionEyebrow>
            <h2 className="font-[var(--font-pt-serif)] font-light text-4xl mb-16 text-center">
              Try the <span className="accent-word">Seeded PR</span>
            </h2>

            <motion.div
              className="bg-[var(--surface-card)] border border-[var(--color-graphite)] overflow-hidden"
              variants={itemVariants}
            >
              <div className="p-6 border-b border-[var(--color-graphite)] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-signal-lime)] flex items-center justify-center">
                    <span className="font-[var(--font-pt-serif)] font-light text-xl text-black">RG</span>
                  </div>
                  <div>
                    <p className="font-[var(--font-inter-tight)] font-medium text-sm uppercase tracking-wider">demo-repo</p>
                    <p className="font-[var(--font-jetbrains-mono)] text-xs text-[var(--color-ash)]">PR #42 · 6 files · +142/−18</p>
                  </div>
                </div>
                <Link href="/connect" className="whitespace-nowrap">
                  <SignalLimeCTA>
                    RUN REVIEW
                  </SignalLimeCTA>
                </Link>
              </div>

              <div className="p-6 font-[var(--font-jetbrains-mono)] text-sm text-[var(--color-ash)] max-h-96 overflow-auto max-w-full">
                {`diff --git a/src/config.py b/src/config.py
-AWS_SECRET_KEY = "AKIAIOSFODNN7EXAMPLE"
+AWS_SECRET_KEY = os.getenv("AWS_SECRET_KEY")

diff --git a/src/payments/processor.py b/src/payments/processor.py
-query = f"SELECT * FROM accounts WHERE user_id = '{user_id}'"
+query = "SELECT * FROM accounts WHERE user_id = %s"
 cursor.execute(query, (user_id,))

diff --git a/src/auth/middleware.py b/src/auth/middleware.py
-if not request.user.is_admin:
+if not request.user or not request.user.is_admin:

diff --git a/src/utils/helpers.py b/src/utils/helpers.py
+import pickle
+def unsafe_deserialize(data: bytes):
+    return pickle.loads(data)  # Insecure deserialization

diff --git a/src/payments/processor.py b/src/payments/processor.py
-    for order in orders:
-        for item in order.items:
+    items_by_order = {o.id: o.items for o in orders}
+    for order in orders:
+        for item in items_by_order[o.id]:`}
              </div>
            </motion.div>

            <div className="mt-6 text-center">
<Link href="/dashboard">
                <OutlinedGreenButton>
                  VIEW FULL DEMO DASHBOARD
                </OutlinedGreenButton>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-28 px-6 text-center">
          <motion.div
            className="max-w-3xl mx-auto"
            variants={itemVariants}
          >
            <h2 className="font-[var(--font-pt-serif)] font-light text-4xl mb-8">
              Ready to ship <span className="accent-word">safer code</span>?
            </h2>
            <p className="text-[var(--color-ash)] text-lg mb-12 max-w-xl mx-auto">
              No CI changes. No config files. Just connect your repo or paste a diff.
              First review is free — see what your team has been missing.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link href="/connect" className="w-full sm:w-auto">
                <SignalLimeCTA className="w-full sm:w-auto px-10 py-4 text-lg">
                  GET STARTED FREE
                </SignalLimeCTA>
              </Link>
              <Link href="/dashboard">
                <OutlinedGreenButton className="w-full sm:w-auto px-10 py-4 text-lg">
                  VIEW DASHBOARD
                </OutlinedGreenButton>
              </Link>
            </div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-graphite)] py-16 px-6">
        <div className="max-w-[var(--page-max-width)] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <LogoTile size={48} className="mb-4" />
              <p className="text-[var(--color-ash)] text-sm leading-relaxed max-w-xs">
                AI-powered code review assistant built for the IBM Bob Hackathon.
                Five specialized agents. One verified report.
              </p>
            </div>
            <div>
              <h4 className="font-[var(--font-inter-tight)] font-medium uppercase tracking-wider text-sm text-[var(--color-chalk)] mb-4">
                REVIEWERS
              </h4>
              <ul className="space-y-2 text-[var(--color-ash)] text-sm">
                <li>Security</li>
                <li>Correctness</li>
                <li>Performance</li>
                <li>Testing</li>
                <li>Maintainability</li>
              </ul>
            </div>
            <div>
              <h4 className="font-[var(--font-inter-tight)] font-medium uppercase tracking-wider text-sm text-[var(--color-chalk)] mb-4">
                INTEGRATIONS
              </h4>
              <ul className="space-y-2 text-[var(--color-ash)] text-sm">
                <li>GitHub Webhooks</li>
                <li>GitLab Webhooks</li>
                <li>Manual Diff Paste</li>
                <li>CLI (Coming Soon)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-[var(--font-inter-tight)] font-medium uppercase tracking-wider text-sm text-[var(--color-chalk)] mb-4">
                BUILT WITH
              </h4>
              <ul className="space-y-2 text-[var(--color-ash)] text-sm">
                <li>IBM Bob Workflows</li>
                <li>FastAPI + SQLAlchemy</li>
                <li>Next.js 14 + Tailwind v4</li>
                <li>Semgrep + Gitleaks</li>
                <li>Framer Motion</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-[var(--color-graphite)]">
            <p className="text-[var(--color-smoke)] text-sm">
              ReviewGuard — IBM Bob Hackathon Track 3 Submission
            </p>
            <div className="flex items-center gap-6 mt-4 md:mt-0">
              <a href="#" className="text-[var(--color-ash)] hover:text-[var(--color-signal-lime)] transition-colors text-sm">
                Documentation
              </a>
              <a href="#" className="text-[var(--color-ash)] hover:text-[var(--color-signal-lime)] transition-colors text-sm">
                GitHub
              </a>
              <a href="#" className="text-[var(--color-ash)] hover:text-[var(--color-signal-lime)] transition-colors text-sm">
                Issues
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}