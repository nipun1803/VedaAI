"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Filter, Plus, Search } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
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
      title="Assignments"
      subtitle="Manage and create assignments for your classes."
      actions={
        <Link href="/create">
          <Button>
            <Plus className="h-4 w-4" />
            Create Assignment
          </Button>
        </Link>
      }
    >
      {!mounted || isFetching ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-44" />
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <EmptyAssignments />
      ) : (
        <div className="space-y-5">
          <div className="rounded-3xl bg-white p-3 shadow-sm dark:bg-[#232323]">
            <div className="flex flex-col gap-3 md:flex-row">
              <button className="flex h-12 items-center gap-2 rounded-2xl border border-line-soft px-4 text-sm font-semibold text-neutral-500 dark:border-white/10 dark:text-neutral-300">
                <Filter className="h-4 w-4" />
                Filter By
              </button>
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search Assignment"
                  className="pl-11"
                />
              </div>
            </div>
          </div>

          {filteredAssignments.length ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
        </div>
      )}
    </AppShell>
  );
}
