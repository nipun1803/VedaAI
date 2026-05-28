"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { MoreVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Assignment } from "@/types/assignment";
import { formatDate } from "@/utils/date";
import { useAssignmentStore } from "@/store/assignmentStore";
import toast from "react-hot-toast";

export function AssignmentCard({ assignment, index }: { assignment: Assignment; index: number }) {
  const deleteAssignment = useAssignmentStore((state) => state.deleteAssignment);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this assignment?")) {
      deleteAssignment(assignment.id);
      toast.success("Assignment deleted");
    }
  };

  const href = assignment.status === "completed" ? `/assignments/${assignment.id}/paper` : `/generate/${assignment.id}`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className="group rounded-2xl border border-black/[0.04] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-card dark:border-white/10 dark:bg-[#232323]"
    >
      {/* Title + 3-dot menu */}
      <div className="flex items-start justify-between gap-3">
        <Link href={href} className="block min-w-0 flex-1">
          <h3 className="truncate text-lg font-bold text-ink transition hover:text-ember dark:text-white dark:hover:text-ember">
            {assignment.title}
          </h3>
        </Link>

        {/* Context menu trigger */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-ink dark:hover:bg-white/10 dark:hover:text-white"
            title="Assignment options"
            aria-label="Assignment options"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -6 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 top-9 z-10 min-w-[160px] origin-top-right overflow-hidden rounded-xl border border-black/5 bg-white py-1 shadow-lg dark:border-white/10 dark:bg-[#2a2a2a]"
              >
                <Link
                  href={href}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-ink transition hover:bg-neutral-50 dark:text-white dark:hover:bg-white/5"
                >
                  View Assignment
                </Link>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleDelete();
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                >
                  Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Dates — at the bottom */}
      <div className="mt-8 flex items-center gap-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
        <span>
          <span className="text-ember">Assigned on</span> :{" "}
          {formatDate(assignment.createdAt)}
        </span>
        <span>
          <span className="font-bold text-ink dark:text-white">Due</span> :{" "}
          {formatDate(assignment.dueDate)}
        </span>
      </div>
    </motion.article>
  );
}
