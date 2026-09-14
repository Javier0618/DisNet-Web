import React from 'react';

export function ContentSkeleton() {
  return (
    <div className="rounded-2xl bg-slate-900/40 border border-white/5 overflow-hidden animate-pulse flex flex-col h-full">
      <div className="aspect-[2/3] bg-slate-800/60 w-full" />
      <div className="p-3.5 space-y-2">
        <div className="h-4 bg-slate-800 rounded w-3/4" />
        <div className="h-3 bg-slate-800/50 rounded w-1/2" />
      </div>
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="w-full h-[70vh] bg-slate-900/60 animate-pulse relative flex items-end p-8">
      <div className="space-y-4 max-w-xl w-full">
        <div className="h-6 bg-slate-800 rounded w-32" />
        <div className="h-10 bg-slate-800 rounded w-3/4" />
        <div className="h-4 bg-slate-800 rounded w-full" />
        <div className="h-4 bg-slate-800 rounded w-2/3" />
        <div className="flex gap-4 pt-4">
          <div className="h-12 bg-slate-800 rounded-full w-36" />
          <div className="h-12 bg-slate-800 rounded-full w-36" />
        </div>
      </div>
    </div>
  );
}
