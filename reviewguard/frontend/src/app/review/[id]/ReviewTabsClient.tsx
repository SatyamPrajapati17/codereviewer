"use client";

import { useState } from "react";
import { TabButton } from "@/components/ui";

const categories = ["all", "security", "correctness", "performance", "testing", "maintainability"];

interface ReviewTabsOnlyClientProps {
  reviewId: string;
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
}

export function ReviewTabsOnlyClient({ reviewId, activeCategory, onCategoryChange }: {
  reviewId: string;
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
}) {
  return (
    <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Finding categories">
      {categories.map((cat) => (
        <button
          key={cat}
          role="tab"
          aria-selected={activeCategory === cat}
          className={`tab-btn ${activeCategory === cat ? "active" : ""}`}
          onClick={() => onCategoryChange(cat)}
          id={`${cat}-tab`}
        >
          {cat.toUpperCase()}
        </button>
      ))}
    </div>
  );
}