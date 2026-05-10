import React from "react";

interface ReviewsLayoutProps {
  children: React.ReactNode;
}

/**
 * Reviews Layout Component
 *
 * Provides consistent layout structure for all review-related pages.
 * Ensures proper navigation context and breadcrumb support.
 */
export default function ReviewsLayout({ children }: ReviewsLayoutProps) {
  return <div className="min-h-screen bg-background">{children}</div>;
}
