"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Search,
  Users,
  PlusCircle,
  Archive,
  Trash2,
  X,
  Sparkles,
  Loader2
} from "lucide-react";
import {
  listGroupsRequest,
  createGroupRequest,
  toggleGroupArchiveRequest,
  deleteGroupRequest,
  type StudentGroup
} from "@/services/api";
import toast from "react-hot-toast";

export default function GroupsPage() {
  const [activeGroups, setActiveGroups] = useState<StudentGroup[]>();
  const [archivedGroups, setArchivedGroups] = useState<StudentGroup[]>();
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState("");

  // Create Group Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupCount, setNewGroupCount] = useState(25);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch groups wrapped in useCallback for hooks dependency safety
  const fetchGroups = useCallback(async (tab: "active" | "archived" = activeTab) => {
    setIsLoading(true);
    try {
      const data = await listGroupsRequest(tab === "archived");
      if (tab === "active") {
        setActiveGroups(data);
      } else {
        setArchivedGroups(data);
      }
    } catch {
      toast.error("Failed to load student groups");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchGroups(activeTab);
  }, [activeTab, fetchGroups]);

  // Handle create group
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      toast.error("Group name is required");
      return;
    }

    setIsCreating(true);
    try {
      const newGroup = await createGroupRequest({
        name: newGroupName.trim(),
        studentsCount: newGroupCount
      });
      toast.success(`Group "${newGroup.name}" created`);
      
      // Reset form & close modal
      setNewGroupName("");
      setNewGroupCount(25);
      setIsModalOpen(false);

      // Refresh current tab
      if (activeTab === "active") {
        setActiveGroups((prev) => (prev ? [newGroup, ...prev] : [newGroup]));
      } else {
        fetchGroups("active");
      }
    } catch {
      toast.error("Could not create group");
    } finally {
      setIsCreating(false);
    }
  };

  // Handle archive / unarchive group
  const handleToggleArchive = async (group: StudentGroup) => {
    try {
      const updated = await toggleGroupArchiveRequest(group.id);
      toast.success(
        updated.isArchived
          ? `Group "${group.name}" archived successfully`
          : `Group "${group.name}" restored successfully`
      );

      // Optimistically update lists
      if (activeTab === "active") {
        setActiveGroups((prev) => prev?.filter((g) => g.id !== group.id));
      } else {
        setArchivedGroups((prev) => prev?.filter((g) => g.id !== group.id));
      }
    } catch {
      toast.error("Could not update archive status");
    }
  };

  // Handle delete group
  const handleDeleteGroup = async (group: StudentGroup) => {
    if (!confirm(`Are you sure you want to delete "${group.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteGroupRequest(group.id);
      toast.success(`Group "${group.name}" deleted successfully`);

      // Optimistically update lists
      if (activeTab === "active") {
        setActiveGroups((prev) => prev?.filter((g) => g.id !== group.id));
      } else {
        setArchivedGroups((prev) => prev?.filter((g) => g.id !== group.id));
      }
    } catch {
      toast.error("Could not delete group");
    }
  };

  // Local search filter
  const currentGroups = activeTab === "active" ? activeGroups : archivedGroups;

  const filteredGroups = useMemo(() => {
    if (!currentGroups) return [];
    const normalized = query.trim().toLowerCase();
    if (!normalized) return currentGroups;
    return currentGroups.filter((g) => g.name.toLowerCase().includes(normalized));
  }, [currentGroups, query]);

  return (
    <AppShell
      title="Student Groups"
      subtitle="Organize your students into classes and sections for tailored AI question generations."
      actions={
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-ink px-5 text-sm font-bold text-white shadow-sm transition hover:bg-ink/90 active:scale-[0.98] dark:bg-white dark:text-ink dark:hover:bg-neutral-100"
        >
          <PlusCircle className="h-4 w-4 text-ember fill-ember/20" />
          Create Group
        </button>
      }
    >
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-black/5 dark:border-white/10">
          <button
            onClick={() => setActiveTab("active")}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "active"
                ? "border-ember text-ink font-bold dark:text-white"
                : "border-transparent text-neutral-500 hover:text-ink dark:hover:text-white"
            }`}
          >
            Active Classes
          </button>
          <button
            onClick={() => setActiveTab("archived")}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "archived"
                ? "border-ember text-ink font-bold dark:text-white"
                : "border-transparent text-neutral-500 hover:text-ink dark:hover:text-white"
            }`}
          >
            Archived
          </button>
        </div>

        {/* Filter + Search section */}
        <div className="rounded-3xl bg-white p-2.5 shadow-sm dark:bg-[#232323]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search groups..."
              className="pl-11 rounded-2xl h-12 bg-neutral-50 border-none dark:bg-white/5"
            />
          </div>
        </div>

        {/* Dynamic Content Grid */}
        {isLoading && !currentGroups ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-44 rounded-3xl" />
            ))}
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="grid min-h-[360px] place-items-center rounded-[32px] bg-white p-8 text-center shadow-sm dark:bg-[#232323]">
            <div className="max-w-md">
              <div className="relative mx-auto mb-6 h-20 w-20 grid place-items-center rounded-full bg-neutral-100 dark:bg-white/[0.04] text-neutral-400">
                <Users className="h-10 w-10 stroke-[1.5]" />
              </div>
              <h3 className="text-xl font-bold">No groups found</h3>
              <p className="mt-2.5 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                {query.trim()
                  ? "Try a different search term to find your classes."
                  : activeTab === "active"
                  ? "Create your first class group to start organizing your students and tracking assignments."
                  : "No archived class groups found."}
              </p>
              {activeTab === "active" && !query.trim() && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-6 text-sm font-bold text-white shadow-sm transition hover:bg-ink/90 active:scale-95 dark:bg-white dark:text-ink"
                >
                  <PlusCircle className="h-4 w-4" />
                  Create Your First Group
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredGroups.map((group) => (
              <div
                key={group.id}
                className="overflow-hidden rounded-3xl bg-white shadow-sm border border-neutral-150/10 dark:border-white/5 dark:bg-[#232323] transition-all hover:shadow-md flex flex-col justify-between"
              >
                {/* Card Header */}
                <div className="p-5 flex items-start gap-4 border-b border-black/5 dark:border-white/5 bg-neutral-50/50 dark:bg-white/[0.01]">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-200 text-amber-700 dark:from-amber-500/10 dark:to-orange-500/15 dark:text-amber-400">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-base text-ink dark:text-white truncate leading-tight">
                      {group.name}
                    </h3>
                    <p className="text-xs font-semibold text-neutral-400 mt-1">
                      {group.studentsCount} Students
                    </p>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-4 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold tracking-tight text-neutral-400 dark:text-neutral-550">
                    {group.isArchived ? "Archived" : "Active Group"}
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    {/* Archive toggle */}
                    <button
                      onClick={() => handleToggleArchive(group)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-50 text-neutral-600 transition hover:bg-neutral-100 hover:text-ink active:scale-95 dark:bg-white/5 dark:text-neutral-350 dark:hover:bg-white/10 dark:hover:text-white"
                      title={group.isArchived ? "Unarchive group" : "Archive group"}
                    >
                      <Archive className="h-4 w-4" />
                    </button>
                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteGroup(group)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-danger/10 text-danger transition hover:bg-danger/15 active:scale-95"
                      title="Delete group"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ──────────── Create Group Modal Overlay ──────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsModalOpen(false)}
          />

          {/* Modal Card Content */}
          <div className="relative w-full max-w-md rounded-[32px] bg-white p-6 shadow-2xl dark:bg-[#232323] border border-neutral-150/10 dark:border-white/5 mx-4 z-10 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-ember fill-ember/20" />
                <h3 className="text-xl font-bold text-ink dark:text-white">Create Group</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full text-neutral-450 hover:bg-neutral-100 dark:hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateGroup} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-400 dark:text-neutral-550 uppercase tracking-wider">
                  Group Name
                </label>
                <Input
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Grade 10 Science"
                  className="rounded-2xl bg-neutral-50 border-none h-12 focus-visible:ring-ember dark:bg-white/5"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-400 dark:text-neutral-550 uppercase tracking-wider">
                  Students Count
                </label>
                <div className="flex h-12 items-center justify-between rounded-full bg-neutral-100/80 px-2 dark:bg-[#1a1a1a]">
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center text-neutral-500 transition hover:text-ink active:scale-95 dark:text-neutral-400"
                    onClick={() => setNewGroupCount((prev) => Math.max(1, prev - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <div className="flex h-8 w-16 items-center justify-center rounded-xl bg-white text-sm font-bold text-ink shadow-sm dark:bg-[#2b2b2b] dark:text-white">
                    <input
                      type="number"
                      value={newGroupCount}
                      onChange={(e) => setNewGroupCount(Number(e.target.value))}
                      className="h-full w-full bg-transparent text-center text-sm font-bold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center text-neutral-500 transition hover:text-ink active:scale-95 dark:text-neutral-400"
                    onClick={() => setNewGroupCount((prev) => prev + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 inline-flex h-12 items-center justify-center rounded-full border border-neutral-300 bg-white text-sm font-bold text-ink shadow-sm transition hover:bg-neutral-50 dark:border-white/10 dark:bg-[#2a2a2a] dark:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ink text-sm font-bold text-white shadow-sm transition hover:bg-ink/90 active:scale-95 disabled:opacity-50 dark:bg-white dark:text-ink"
                >
                  {isCreating ? (
                    <Loader2 className="h-4 w-4 animate-spin text-ember" />
                  ) : (
                    <span>Add Group</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}

// Stepper component imports subtraction helper
function Minus({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={className}>
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

// Stepper component imports addition helper
function Plus({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={className}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
