"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Filter, Plus, Search } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { AssignmentCard } from "@/features/assignments/AssignmentCard";
import { EmptyAssignments } from "@/features/assignments/EmptyAssignments";
import { useMounted } from "@/hooks/useMounted";
import { isDemoMode } from "@/lib/env";
import { listAssignmentsRequest } from "@/services/api";
import { useAssignmentStore } from "@/store/assignmentStore";

export function DashboardClient() {
  const mounted = useMounted();
  const assignments = useAssignmentStore((state) => state.assignments);
  const replaceAssignments = useAssignmentStore((state) => state.replaceAssignments);
  const [query, setQuery] = useState("");
  const [isFetching, setIsFetching] = useState(false);

  const filteredAssignments = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return assignments;
    return assignments.filter((assignment) =>
      [assignment.title, assignment.subject, assignment.grade].some((value) =>
        value.toLowerCase().includes(normalized)
      )
    );
  }, [assignments, query]);

  useEffect(() => {
    if (!mounted || isDemoMode) return;

    setIsFetching(true);
    listAssignmentsRequest()
      .then(replaceAssignments)
      .finally(() => setIsFetching(false));
  }, [mounted, replaceAssignments]);

  return (
    <AppShell
      title={
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-success shrink-0" />
          <h2 className="text-2xl font-bold tracking-normal sm:text-3xl text-ink dark:text-white">Assignments</h2>
        </div>
      }
      subtitle="Manage and create assignments for your classes."
      actions={
        <Link href="/create">
          <button className="inline-flex h-10 items-center gap-2 rounded-xl bg-ink px-5 text-sm font-bold text-white shadow-sm transition hover:bg-ink/90 active:scale-[0.98] dark:bg-white dark:text-ink dark:hover:bg-neutral-100">
            <Plus className="h-4 w-4" />
            Create Assignment
          </button>
        </Link>
      }
    >
      {!mounted || isFetching ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-36" />
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <EmptyAssignments />
      ) : (
        <div className="space-y-5 pb-20 lg:pb-0">
          {/* Filter + Search bar */}
          <div className="rounded-3xl bg-white p-2.5 shadow-sm dark:bg-[#232323]">
            <div className="flex items-center gap-2.5">
              <button className="flex h-12 shrink-0 items-center gap-2 rounded-2xl border border-line-soft px-3.5 text-sm font-semibold text-neutral-500 transition hover:bg-neutral-50 dark:border-white/10 dark:text-neutral-300 dark:hover:bg-white/5">
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filter By</span>
                <span className="sm:hidden">Filter</span>
              </button>
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search Name"
                  className="pl-11 rounded-2xl h-12 bg-neutral-50 border-none dark:bg-white/5"
                />
              </div>
            </div>
          </div>

          {/* Assignment cards grid — 2 columns */}
          {filteredAssignments.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredAssignments.map((assignment, index) => (
                <AssignmentCard key={assignment.id} assignment={assignment} index={index} />
              ))}
            </div>
          ) : (
            <div className="grid min-h-72 place-items-center rounded-3xl bg-white p-8 text-center dark:bg-[#232323]">
              <div>
                <p className="text-lg font-bold">No matching assignments</p>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-300">Try a different title, subject, or class.</p>
              </div>
            </div>
          )}

          {/* Sticky bottom Create Assignment bar — desktop */}
          <div className="fixed bottom-0 left-0 right-0 z-30 hidden justify-center border-t border-black/5 bg-paper/90 pb-4 pt-3 backdrop-blur-xl dark:border-white/10 dark:bg-[#181818]/90 lg:flex">
            <Link href="/create">
              <button className="inline-flex h-12 items-center gap-2 rounded-2xl bg-ink px-8 text-sm font-bold text-white shadow-lg transition hover:bg-ink/90 active:scale-[0.98] dark:bg-white dark:text-ink dark:hover:bg-neutral-100">
                <Plus className="h-4 w-4" />
                Create Assignment
              </button>
            </Link>
          </div>
        </div>
      )}
    </AppShell>
  );
}
