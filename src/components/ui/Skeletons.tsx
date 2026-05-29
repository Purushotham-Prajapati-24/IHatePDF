import React from 'react';
import { cn } from '../../utils/cn';

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("animate-pulse bg-white/5 rounded-md", className)} />
);

export const HomeSkeleton: React.FC = () => (
  <div className="w-full flex flex-col gap-16 py-8">
    <section className="w-full max-w-4xl mx-auto text-center flex flex-col items-center pt-10 pb-8">
      <Skeleton className="h-20 w-3/4 mb-6" />
      <Skeleton className="h-6 w-1/2 mb-12" />
      <div className="flex gap-4 mb-12">
        <Skeleton className="h-10 w-32 rounded-2xl" />
        <Skeleton className="h-10 w-32 rounded-2xl" />
        <Skeleton className="h-10 w-32 rounded-2xl" />
      </div>
      <Skeleton className="h-16 w-full max-w-xl rounded-2xl" />
    </section>

    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className={cn("p-8 rounded-2xl border border-border-glass bg-bg-dark/40", i % 3 === 0 ? "h-64" : i % 2 === 0 ? "h-72" : "h-56")}>
          <Skeleton className="h-12 w-12 rounded-xl mb-4" />
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </section>
  </div>
);

export const DashboardSkeleton: React.FC = () => (
  <div className="flex w-full flex-col gap-8 py-8">
    <section className="h-64 w-full rounded-[2rem] border border-border-glass bg-bg-card/35 p-8">
      <Skeleton className="h-8 w-48 rounded-full mb-5" />
      <Skeleton className="h-12 w-3/4 mb-4" />
      <Skeleton className="h-4 w-2/3" />
    </section>

    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-48 rounded-2xl border border-border-glass bg-bg-card/35 p-5">
          <div className="flex justify-between mb-6">
            <Skeleton className="h-11 w-11 rounded-xl" />
            <Skeleton className="h-4 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-10 w-32 mb-3" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </section>

    <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_0.7fr]">
      <div className="h-80 rounded-[2rem] border border-border-glass bg-bg-card/35 p-6">
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-8 w-64 mb-8" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
      <div className="h-80 rounded-[2rem] border border-border-glass bg-bg-card/35 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-11 w-11 rounded-xl" />
          <div>
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </section>
  </div>
);

export const HistorySkeleton: React.FC = () => (
  <div className="flex w-full flex-col gap-8 py-8">
    <section className="h-64 w-full rounded-[2rem] border border-border-glass bg-bg-card/35 p-8">
      <div className="flex justify-between items-end">
        <div className="w-2/3">
          <Skeleton className="h-8 w-40 rounded-full mb-5" />
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-11 w-24 rounded-xl" />
          <Skeleton className="h-11 w-24 rounded-xl" />
          <Skeleton className="h-11 w-32 rounded-xl" />
        </div>
      </div>
    </section>

    <section className="rounded-[2rem] border border-border-glass bg-bg-card/35 p-6">
      <div className="flex justify-between items-center mb-8">
        <Skeleton className="h-12 w-full max-w-xl rounded-2xl" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-5 rounded-2xl border border-border-glass bg-bg-dark/35">
            <div className="flex items-start gap-4 mb-5">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="flex-1">
                <Skeleton className="h-6 w-1/2 mb-2" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Skeleton className="h-11 w-full rounded-xl" />
              <Skeleton className="h-11 w-full rounded-xl" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </section>
  </div>
);

export const WorkspaceSkeleton: React.FC = () => (
  <div className="w-full flex flex-col gap-8 py-4">
    <div className="flex items-center gap-4">
      <Skeleton className="h-10 w-10 rounded-full" />
      <Skeleton className="h-10 w-64" />
    </div>

    <div className="flex flex-col lg:flex-row gap-8 items-start">
      <div className="flex-1 w-full min-h-[60vh] rounded-3xl border border-border-glass bg-bg-dark/20 p-6 flex flex-col gap-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[1/1.4] w-full rounded-xl" />
          ))}
        </div>
      </div>
      <div className="w-full lg:w-80 h-[80vh] rounded-2xl border border-border-glass bg-bg-card/30 p-6 flex flex-col gap-8">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-2 w-2 rounded-full" />
        </div>
        <div className="flex-1 space-y-6">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>
    </div>
  </div>
);
