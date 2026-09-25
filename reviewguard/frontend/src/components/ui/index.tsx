"use client";

import { forwardRef, ButtonHTMLAttributes, TextareaHTMLAttributes, InputHTMLAttributes } from "react";

export const SignalLimeCTA = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ children, className = "", disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={`signal-lime-cta ${className} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
);
SignalLimeCTA.displayName = "SignalLimeCTA";

export const GhostNavButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }>(
  ({ children, className = "", active, ...props }, ref) => (
    <button
      ref={ref}
      className={`ghost-nav-btn ${active ? "active" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
);
GhostNavButton.displayName = "GhostNavButton";

export const OutlinedGreenButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ children, className = "", ...props }, ref) => (
    <button
      ref={ref}
      className={`outlined-green-btn ${className}`}
      {...props}
    >
      {children}
    </button>
  )
);
OutlinedGreenButton.displayName = "OutlinedGreenButton";

export const SharpCard = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={`sharp-card ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);
SharpCard.displayName = "SharpCard";

export const MetadataLabel = ({ children, className = "" }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={`metadata-label ${className}`}>{children}</span>
);

export const StatusPill = ({ children, className = "", ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={`status-pill ${className}`} {...props}>
    {children}
  </span>
);

export const LogoTile = ({ size = 64, className = "", children, ...props }: React.HTMLAttributes<HTMLDivElement> & { size?: number }) => (
  <div
    className={`logo-tile ${className}`}
    style={{ width: size, height: size }}
    aria-hidden="true"
    {...props}
  >
    <span className="logo-tile-mark">{children || "RG"}</span>
  </div>
);

export const CodeBlock = ({ children, className = "", language = "text", ...props }: React.HTMLAttributes<HTMLPreElement> & { language?: string }) => (
  <pre className={`code-block ${className}`} {...props}>
    <code className={`language-${language}`}>{children}</code>
  </pre>
);

export const InputField = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => (
    <input
      ref={ref}
      className={`input-field ${className}`}
      {...props}
    />
  )
);
InputField.displayName = "InputField";

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className = "", ...props }, ref) => (
    <textarea
      ref={ref}
      className={`input-field ${className}`}
      {...props}
    />
  )
);
TextAreaField.displayName = "TextAreaField";

export const SeverityBadge = ({ severity, className = "", ...props }: { severity: string } & React.HTMLAttributes<HTMLSpanElement>) => {
  const severityClass = `severity-${severity}`;
  return (
    <span className={`severity-badge ${severityClass} ${className}`} {...props}>
      {severity.toUpperCase()}
    </span>
  );
};

export const TabButton = ({ children, active, onClick, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) => (
  <button
    className={`tab-btn ${active ? "active" : ""} ${className}`}
    onClick={onClick}
    {...props}
  >
    {children}
  </button>
);

export const FindingCard = ({ children, severity, className = "", ...props }: React.HTMLAttributes<HTMLDivElement> & { severity: string }) => {
  const severityClass = `finding-card-${severity}`;
  return (
    <div className={`finding-card ${severityClass} ${className}`} {...props}>
      {children}
    </div>
  );
};

export const DiffView = ({ children, className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`diff-view ${className}`} {...props}>
    {children}
  </div>
);

export const LoadingDots = () => (
  <span className="loading-dots" aria-hidden="true">
    <span></span><span></span><span></span>
  </span>
);

export const NeonDivider = () => <hr className="neon-divider" aria-hidden="true" />;

export const SectionEyebrow = ({ children, index }: { children: React.ReactNode; index?: string }) => (
  <div className="section-eyebrow">
    <MetadataLabel>{children}</MetadataLabel>
    {index && <span className="section-index">{index}</span>}
  </div>
);

export const AccentWord = ({ children }: { children: React.ReactNode }) => (
  <span className="accent-word">{children}</span>
);