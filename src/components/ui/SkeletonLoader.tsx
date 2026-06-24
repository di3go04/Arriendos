'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent ${className}`}
    />
  );
}

export default function SkeletonLoader() {
  return (
    <div className="space-y-8 p-1">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* KPI Cards Row Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card border border-border p-6 rounded-3xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-10 rounded-2xl" />
            </div>
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-3.5 w-44" />
          </div>
        ))}
      </div>

      {/* Main Grid: Charts & Lists Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Large Chart Area */}
        <div className="bg-card border border-border p-6 rounded-3xl lg:col-span-2 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3.5 w-64" />
          </div>
          <Skeleton className="h-72 w-full" />
        </div>

        {/* Side Panel List */}
        <div className="space-y-6">
          <div className="bg-card border border-border p-6 rounded-3xl space-y-4">
            <Skeleton className="h-5 w-32" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 items-start border-t border-border/60 pt-3">
                <Skeleton className="h-8 w-8 rounded-xl shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-card border border-border p-6 rounded-3xl space-y-4">
            <Skeleton className="h-5 w-32" />
            {[1, 2].map((i) => (
              <div key={i} className="flex gap-3 items-start border-t border-border/60 pt-3">
                <Skeleton className="h-8 w-8 rounded-xl shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
