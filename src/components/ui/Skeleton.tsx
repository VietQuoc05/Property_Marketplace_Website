'use client';

import React from 'react';

export function Skeleton({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse bg-surface-container/80 rounded-xl ${className}`}
      {...props}
    />
  );
}

/**
 * Skeleton representation of a ListingCard
 */
export function ListingCardSkeleton({ compact = true }: { compact?: boolean }) {
  return (
    <article className="bg-surface-card rounded-[20px] overflow-hidden border border-border-subtle shadow-xs flex flex-col animate-pulse">
      {/* Hero Image Container */}
      <div className="relative w-full aspect-[4/3] bg-surface-container">
        {/* Bookmark circle */}
        <div className="absolute top-2.5 right-2.5 w-7.5 h-7.5 rounded-full bg-surface-container-high/80" />
      </div>

      {/* Card Body */}
      <div className="p-3.5 sm:p-4 flex flex-col gap-2.5 flex-1 justify-between">
        <div className="flex flex-col gap-1.5">
          {/* Row 1: Title & Category Badge */}
          <div className="flex items-center justify-between gap-2">
            <div className="h-4 bg-surface-container-high/90 rounded-md w-3/4" />
            <div className="h-4 bg-surface-container rounded-full w-14 shrink-0" />
          </div>

          {/* Row 2: Location */}
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-3.5 h-3.5 rounded-full bg-surface-container-high/70 shrink-0" />
            <div className="h-3 bg-surface-container rounded w-1/2" />
          </div>
        </div>

        {/* Row 3: Price */}
        <div className="pt-1 flex items-center justify-between gap-2">
          <div className="h-5 bg-surface-container-high/90 rounded w-24" />
        </div>
      </div>
    </article>
  );
}

/**
 * Skeleton representation of the Listing Detail Page
 */
export function ListingDetailSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <main className="flex-1 w-full pt-4 sm:pt-6 pb-20 max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column: Media Gallery */}
          <div className="lg:col-span-7 xl:col-span-7 lg:sticky lg:top-6 flex items-start gap-3 sm:gap-4">
            {/* Back button */}
            <div className="shrink-0 w-10 h-10 rounded-full bg-surface-card border border-border-subtle animate-pulse mt-1" />

            {/* Gallery content */}
            <div className="flex-1 min-w-0 flex flex-col gap-3">
              {/* Main Hero Image */}
              <div className="w-full aspect-[4/3] rounded-2xl bg-surface-container border border-border-subtle animate-pulse" />

              {/* Thumbnails */}
              <div className="flex items-center gap-2.5 py-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-20 h-20 sm:w-22 sm:h-22 rounded-xl bg-surface-container border border-border-subtle animate-pulse shrink-0"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Listing Information */}
          <div className="lg:col-span-5 xl:col-span-5 flex flex-col gap-4">
            {/* Main Info Card */}
            <div className="bg-surface-card rounded-2xl p-5 sm:p-6 border border-border-subtle shadow-sm flex flex-col gap-4 animate-pulse">
              {/* Title */}
              <div className="flex flex-col gap-2">
                <div className="h-7 bg-surface-container-high/90 rounded-md w-4/5" />
                <div className="h-7 bg-surface-container-high/90 rounded-md w-3/5" />
              </div>

              {/* Price & Tag */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="h-8 bg-surface-container-high/90 rounded-lg w-36" />
                <div className="h-7 bg-surface-container rounded-full w-24" />
              </div>

              {/* Location */}
              <div className="flex items-center gap-2 pt-1 border-t border-border-subtle">
                <div className="w-4 h-4 rounded-full bg-surface-container-high/70 shrink-0" />
                <div className="h-4 bg-surface-container rounded w-3/4" />
              </div>

              {/* Specs grid */}
              <div className="grid grid-cols-3 gap-2.5 pt-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 rounded-xl bg-surface-container/60 border border-border-subtle/50"
                  />
                ))}
              </div>
            </div>

            {/* Host Card */}
            <div className="bg-surface-card rounded-2xl p-5 border border-border-subtle shadow-sm flex items-center justify-between gap-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-13 h-13 rounded-full bg-surface-container" />
                <div className="flex flex-col gap-1.5">
                  <div className="h-4 bg-surface-container-high/90 rounded w-28" />
                  <div className="h-3 bg-surface-container rounded w-20" />
                </div>
              </div>
              <div className="h-9 w-24 rounded-full bg-surface-container" />
            </div>

            {/* Description Card */}
            <div className="bg-surface-card rounded-2xl p-5 border border-border-subtle shadow-sm flex flex-col gap-3 animate-pulse">
              <div className="h-5 bg-surface-container-high/90 rounded w-32" />
              <div className="flex flex-col gap-2 pt-1">
                <div className="h-3.5 bg-surface-container rounded w-full" />
                <div className="h-3.5 bg-surface-container rounded w-5/6" />
                <div className="h-3.5 bg-surface-container rounded w-4/6" />
              </div>
            </div>

            {/* Amenities Card */}
            <div className="bg-surface-card rounded-2xl p-5 border border-border-subtle shadow-sm flex flex-col gap-3 animate-pulse">
              <div className="h-5 bg-surface-container-high/90 rounded w-40" />
              <div className="flex flex-wrap gap-2 pt-1">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-8 w-24 rounded-full bg-surface-container/70" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/**
 * Skeleton representation of the Profile Page (Own or Other user)
 */
export function ProfileSkeleton({ isOwn = false }: { isOwn?: boolean }) {
  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <main className="flex-1 max-w-6xl 2xl:max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16 flex flex-col gap-6">
        {/* Profile Card Layout */}
        <div className="relative w-full">
          <div className="absolute -left-12 sm:-left-13 top-1 w-10 h-10 rounded-full bg-surface-card border border-border-subtle animate-pulse shrink-0" />
          <div className="w-full bg-surface-card rounded-2xl p-6 sm:p-7 border border-border-subtle shadow-sm flex flex-col gap-6 animate-pulse">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4 sm:gap-5 flex-1 min-w-0">
              {/* Avatar */}
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-surface-container shrink-0" />
              {/* User details */}
              <div className="flex-1 flex flex-col gap-2">
                <div className="h-6 bg-surface-container-high/90 rounded-md w-48" />
                <div className="flex items-center gap-4 flex-wrap mt-1">
                  <div className="h-4 bg-surface-container rounded w-32" />
                  <div className="h-4 bg-surface-container rounded w-28" />
                  <div className="h-4 bg-surface-container rounded w-24" />
                </div>
              </div>
            </div>
            {/* Action button */}
            <div className="h-10 w-36 rounded-full bg-surface-container shrink-0" />
          </div>

          {/* Lower Grid: Bio & Info Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Bio */}
            <div className="lg:col-span-8 flex flex-col justify-start gap-2">
              <div className="h-4 bg-surface-container rounded w-full" />
              <div className="h-4 bg-surface-container rounded w-4/5" />
              <div className="h-4 bg-surface-container rounded w-2/3" />
            </div>

            {/* Right Summary Cards */}
            <div className="lg:col-span-4 flex flex-col justify-between gap-3">
              <div className="h-16 bg-surface-container/40 rounded-xl border border-border-subtle/60" />
              <div className="h-16 bg-surface-container/40 rounded-xl border border-border-subtle/60" />
            </div>
          </div>
        </div>
      </div>

        {/* Bottom Section */}
        {isOwn ? (
          <div className="flex flex-col gap-3 mt-2 animate-pulse">
            <div className="h-6 bg-surface-container rounded-md w-44" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-20 bg-surface-card rounded-xl border border-border-subtle shadow-xs"
                />
              ))}
            </div>
            <div className="h-11 w-44 rounded-xl bg-surface-card border border-border-subtle mt-2" />
          </div>
        ) : (
          <div className="flex flex-col gap-3.5 mt-2 animate-pulse">
            <div className="h-6 bg-surface-container rounded-md w-52" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {[1, 2, 3].map((i) => (
                <ListingCardSkeleton key={i} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/**
 * Skeleton representation of the Messages / Chat Page
 */
export function MessagesSkeleton() {
  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* Left Column: Conversations Sidebar */}
      <div className="w-full sm:w-80 md:w-96 border-r border-border-subtle bg-surface-card flex flex-col animate-pulse">
        <div className="p-4 border-b border-border-subtle flex flex-col gap-3">
          <div className="h-7 bg-surface-container-high/90 rounded-md w-28" />
          <div className="h-10 bg-surface-container rounded-full w-full" />
        </div>
        <div className="flex-1 p-2 flex flex-col gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-surface-container/30">
              <div className="w-12 h-12 rounded-full bg-surface-container shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="h-4 bg-surface-container-high/90 rounded w-3/4" />
                <div className="h-3 bg-surface-container rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Chat Window */}
      <div className="hidden sm:flex flex-1 flex-col bg-surface animate-pulse">
        <div className="h-18 px-6 bg-surface-card border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-surface-container" />
            <div className="flex flex-col gap-1.5">
              <div className="h-4 bg-surface-container-high/90 rounded w-32" />
              <div className="h-3 bg-surface-container rounded w-20" />
            </div>
          </div>
        </div>
        <div className="flex-1 p-6 flex flex-col justify-end gap-4">
          <div className="w-64 h-12 rounded-2xl rounded-bl-sm bg-surface-card border border-border-subtle self-start" />
          <div className="w-72 h-14 rounded-2xl rounded-br-sm bg-surface-container-high self-end" />
          <div className="w-56 h-10 rounded-2xl rounded-bl-sm bg-surface-card border border-border-subtle self-start" />
        </div>
        <div className="p-4 bg-surface-card border-t border-border-subtle">
          <div className="h-12 rounded-full bg-surface-container" />
        </div>
      </div>
    </div>
  );
}
