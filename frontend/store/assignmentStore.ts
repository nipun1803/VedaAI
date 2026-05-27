"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Assignment,
  AssignmentDraft,
  AssignmentStatus,
  GeneratedPaper,
  GenerationStatus
} from "@/types/assignment";
import { toInputDate } from "@/utils/date";

const defaultDraft: AssignmentDraft = {
  title: "",
  subject: "",
  grade: "",
  dueDate: toInputDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
  fileName: undefined,
  questionConfigs: [
    {
      id: "short-default",
      type: "Short Answer",
      count: 10,
      marks: 2
    }
  ],
  difficultyDistribution: {
    easy: 35,
    medium: 45,
    hard: 20
  },
  instructions: ""
};

const defaultGenerationStatus: GenerationStatus = {
  stage: "queued",
  progress: 0,
  message: "Waiting to start",
  logs: []
};

interface AssignmentState {
  assignments: Assignment[];
  papers: GeneratedPaper[];
  draft: AssignmentDraft;
  generationStatus: GenerationStatus;
  isGlobalLoading: boolean;
  createAssignment: (draft: AssignmentDraft) => Assignment;
  updateAssignmentStatus: (id: string, status: AssignmentStatus) => void;
  saveDraft: (draft: Partial<AssignmentDraft>) => void;
  clearDraft: () => void;
  setGenerationStatus: (status: Partial<GenerationStatus>) => void;
  addGenerationLog: (message: string) => void;
  savePaper: (paper: GeneratedPaper) => void;
  saveAssignment: (assignment: Assignment) => void;
  replaceAssignments: (assignments: Assignment[]) => void;
  getAssignment: (id: string) => Assignment | undefined;
  getPaper: (assignmentId: string) => GeneratedPaper | undefined;
  setGlobalLoading: (loading: boolean) => void;
  deleteAssignment: (id: string) => void;
  renameAssignment: (id: string, title: string) => void;
}

export const useAssignmentStore = create<AssignmentState>()(
  persist(
    (set, get) => ({
      assignments: [],
      papers: [],
      draft: defaultDraft,
      generationStatus: defaultGenerationStatus,
      isGlobalLoading: false,
      createAssignment: (draft) => {
        const now = new Date().toISOString();
        const assignment: Assignment = {
          ...draft,
          id: crypto.randomUUID(),
          status: "queued",
          createdAt: now,
          updatedAt: now
        };

        set((state) => ({
          assignments: [assignment, ...state.assignments],
          draft: defaultDraft,
          generationStatus: {
            assignmentId: assignment.id,
            stage: "queued",
            progress: 8,
            message: "Question generation job queued",
            logs: ["Job queued"]
          }
        }));

        return assignment;
      },
      updateAssignmentStatus: (id, status) =>
        set((state) => ({
          assignments: state.assignments.map((assignment) =>
            assignment.id === id
              ? { ...assignment, status, updatedAt: new Date().toISOString() }
              : assignment
          )
        })),
      saveDraft: (draft) =>
        set((state) => ({
          draft: {
            ...state.draft,
            ...draft
          }
        })),
      clearDraft: () => set({ draft: defaultDraft }),
      setGenerationStatus: (status) =>
        set((state) => ({
          generationStatus: {
            ...state.generationStatus,
            ...status,
            logs: status.logs ?? state.generationStatus.logs
          }
        })),
      addGenerationLog: (message) =>
        set((state) => ({
          generationStatus: {
            ...state.generationStatus,
            logs: [...state.generationStatus.logs, message]
          }
        })),
      savePaper: (paper) =>
        set((state) => ({
          papers: [paper, ...state.papers.filter((item) => item.assignmentId !== paper.assignmentId)]
        })),
      saveAssignment: (assignment) =>
        set((state) => ({
          assignments: [assignment, ...state.assignments.filter((item) => item.id !== assignment.id)]
        })),
      replaceAssignments: (assignments) => set({ assignments }),
      getAssignment: (id) => get().assignments.find((assignment) => assignment.id === id),
      getPaper: (assignmentId) => get().papers.find((paper) => paper.assignmentId === assignmentId),
      setGlobalLoading: (loading) => set({ isGlobalLoading: loading }),
      deleteAssignment: (id) =>
        set((state) => ({
          assignments: state.assignments.filter((assignment) => assignment.id !== id),
          papers: state.papers.filter((paper) => paper.assignmentId !== id)
        })),
      renameAssignment: (id, title) =>
        set((state) => ({
          assignments: state.assignments.map((assignment) =>
            assignment.id === id ? { ...assignment, title, updatedAt: new Date().toISOString() } : assignment
          )
        }))
    }),
    {
      name: "vedai-assignment-store",
      partialize: (state) => ({
        assignments: state.assignments,
        papers: state.papers,
        draft: state.draft,
        generationStatus: state.generationStatus
      })
    }
  )
);
