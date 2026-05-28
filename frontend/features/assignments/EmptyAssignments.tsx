"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

export function EmptyAssignments() {
  return (
    <section className="grid min-h-[62vh] place-items-center rounded-3xl bg-gradient-to-br from-white to-neutral-50 px-6 py-12 text-center shadow-sm dark:from-[#232323] dark:to-[#1d1d1d]">
      <div className="mx-auto max-w-md">
        {/* ── Illustration: Document + Magnifier + Red X ── */}
        <div className="relative mx-auto mb-10 h-[200px] w-[260px]">
          {/* Large background circle */}
          <div className="absolute left-1/2 top-1/2 h-[170px] w-[170px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-100 dark:bg-white/[0.06]" />

          {/* Tilted document with clip (left) */}
          <div className="absolute left-[40px] top-[20px] h-[110px] w-[80px] rotate-[-8deg]">
            {/* Paper */}
            <div className="h-full w-full rounded-xl bg-white shadow-md dark:bg-[#2d2d2d]">
              {/* Paper clip / pin */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                <svg width="20" height="28" viewBox="0 0 20 28" fill="none" className="text-neutral-400">
                  <path d="M10 0C10 0 5 2 5 6v14c0 3 2 5 5 5s5-2 5-5V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                </svg>
              </div>
              {/* Lines on paper */}
              <div className="px-3 pt-8">
                <div className="h-[3px] rounded-full bg-neutral-200 dark:bg-white/15" />
                <div className="mt-2.5 h-[3px] w-[70%] rounded-full bg-neutral-200 dark:bg-white/15" />
                <div className="mt-2.5 h-[3px] w-[50%] rounded-full bg-neutral-150 dark:bg-white/10" />
              </div>
            </div>
          </div>

          {/* White card with UI elements (right-top) */}
          <div className="absolute right-[32px] top-[10px] h-[90px] w-[80px] rotate-[3deg] rounded-xl bg-white shadow-lg dark:bg-[#2d2d2d]">
            {/* Dark line / bar */}
            <div className="mx-3 mt-4 h-[5px] w-[40px] rounded-full bg-ink dark:bg-white/70" />
            {/* Toggle-like elements */}
            <div className="mx-3 mt-4 flex items-center gap-2">
              <div className="h-[5px] w-[18px] rounded-full bg-neutral-200 dark:bg-white/15" />
              <div className="h-3 w-6 rounded-full bg-neutral-300 dark:bg-white/20">
                <div className="ml-auto mr-0.5 mt-0.5 h-2 w-2 rounded-full bg-white dark:bg-neutral-600" />
              </div>
            </div>
          </div>

          {/* Magnifying glass with red X */}
          <div className="absolute bottom-[12px] left-1/2 -translate-x-[10px]">
            {/* Glass circle */}
            <div className="relative grid h-[72px] w-[72px] place-items-center rounded-full border-[6px] border-purple-200/70 bg-white shadow-sm dark:border-purple-400/20 dark:bg-[#222]">
              {/* Red X */}
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="14" fill="#df3f3f" />
                <path d="M10 10l8 8M18 10l-8 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            {/* Handle */}
            <div className="absolute -bottom-2 -right-3 h-5 w-[6px] rotate-[45deg] rounded-full bg-purple-300/70 dark:bg-purple-400/30" />
          </div>

          {/* Sparkle / star accent (bottom-left) */}
          <svg className="absolute bottom-[40px] left-[46px] h-4 w-4 text-sky-500" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" />
          </svg>

          {/* Blue dot accent (right) */}
          <span className="absolute right-[28px] top-[90px] h-2.5 w-2.5 rounded-full bg-sky-500" />
        </div>

        {/* ── Text ── */}
        <h2 className="text-xl font-bold">No assignments yet</h2>
        <p className="mt-3 text-sm leading-6 text-neutral-500 dark:text-neutral-300">
          Create your first assignment to start collecting and grading student
          submissions. You can set up rubrics, define marking criteria, and let AI
          assist with grading.
        </p>

        {/* ── CTA Button ── */}
        <Link href="/create" className="mt-7 inline-block">
          <button className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-8 text-sm font-bold text-white shadow-md transition hover:bg-ink/90 active:scale-[0.98] dark:bg-white dark:text-ink dark:hover:bg-neutral-100">
            <Plus className="h-4 w-4" />
            Create Your First Assignment
          </button>
        </Link>
      </div>
    </section>
  );
}
