"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { CalendarDays, FileText, MoreVertical, RefreshCw, Edit2, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import type { Assignment } from "@/types/assignment";
import { formatDate } from "@/utils/date";
import { useAssignmentStore } from "@/store/assignmentStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/Input";
import toast from "react-hot-toast";

function statusTone(status: Assignment["status"]) {
  if (status === "completed") return "green" as const;
  if (status === "generating" || status === "queued") return "warm" as const;
  return "neutral" as const;
}

export function AssignmentCard({ assignment, index }: { assignment: Assignment; index: number }) {
  const deleteAssignment = useAssignmentStore((state) => state.deleteAssignment);
  const renameAssignment = useAssignmentStore((state) => state.renameAssignment);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [newTitle, setNewTitle] = useState(assignment.title);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRename = () => {
    if (!newTitle.trim()) return toast.error("Title cannot be empty");
    renameAssignment(assignment.id, newTitle.trim());
    setIsRenameOpen(false);
    toast.success("Assignment renamed");
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this assignment?")) {
      deleteAssignment(assignment.id);
      toast.success("Assignment deleted");
    }
  };

  const questionCount = assignment.questionConfigs.reduce((total, config) => total + config.count, 0);
  const marks = assignment.questionConfigs.reduce((total, config) => total + config.count * config.marks, 0);
  const href = assignment.status === "completed" ? `/assignments/${assignment.id}/paper` : `/generate/${assignment.id}`;

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: index * 0.04 }}
        className="group rounded-2xl border border-black/5 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-card dark:border-white/10 dark:bg-[#232323]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={href} className="block truncate text-lg font-bold hover:text-ember">
              {assignment.title}
            </Link>
            <p className="mt-1 text-xs font-semibold text-neutral-500 dark:text-neutral-300">
              Assigned on: {formatDate(assignment.createdAt)}
            </p>
          </div>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="grid h-9 w-9 place-items-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-ink dark:hover:bg-white/10 dark:hover:text-white"
              title="Assignment options"
              aria-label="Assignment options"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-10 z-10 min-w-[160px] origin-top-right overflow-hidden rounded-xl border border-black/5 bg-white py-1 shadow-lg dark:border-white/10 dark:bg-[#2a2a2a]"
                >
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setNewTitle(assignment.title);
                      setIsRenameOpen(true);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-ink transition hover:bg-neutral-50 dark:text-white dark:hover:bg-white/5"
                  >
                    <Edit2 className="h-4 w-4 text-neutral-400" />
                    Rename
                  </button>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleDelete();
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-neutral-50 p-3 dark:bg-white/6">
            <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-300">
              <FileText className="h-4 w-4" />
              Questions
            </div>
            <p className="mt-1 text-lg font-bold">{questionCount}</p>
          </div>
          <div className="rounded-xl bg-neutral-50 p-3 dark:bg-white/6">
            <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-300">
              <CalendarDays className="h-4 w-4" />
              Due
            </div>
            <p className="mt-1 text-lg font-bold">{formatDate(assignment.dueDate)}</p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-line-soft pt-4 dark:border-white/10">
          <div className="flex items-center gap-2">
            <StatusBadge status={assignment.status as any} />
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-300">{marks} marks</span>
          </div>
          <Link href={href}>
            <Button variant="secondary" size="sm">
              {assignment.status === "completed" ? "View" : <RefreshCw className="h-4 w-4" />}
              {assignment.status === "completed" ? null : "Track"}
            </Button>
          </Link>
        </div>
      </motion.article>

      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Assignment</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Assignment Title"
              className="w-full"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleRename();
                }
              }}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button onClick={handleRename}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

