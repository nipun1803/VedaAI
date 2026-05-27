"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { isDemoMode } from "@/lib/env";
import { useAssignmentStore } from "@/store/assignmentStore";
import { createSamplePaper } from "@/utils/questions";
import type { GenerationStage } from "@/types/assignment";

const demoSteps: Array<{ stage: GenerationStage; progress: number; message: string; delay: number }> = [
  {
    stage: "queued",
    progress: 12,
    message: "Job queued in question-generation-queue",
    delay: 450
  },
  {
    stage: "started",
    progress: 28,
    message: "Generation worker started prompt assembly",
    delay: 900
  },
  {
    stage: "ai-processing",
    progress: 58,
    message: "Groq model is balancing question difficulty",
    delay: 1200
  },
  {
    stage: "pdf-generation",
    progress: 82,
    message: "Structured paper validated; preparing PDF layout",
    delay: 900
  },
  {
    stage: "completed",
    progress: 100,
    message: "Question paper generated successfully",
    delay: 700
  }
];

export function useGenerationSimulator(assignmentId: string) {
  const router = useRouter();
  const started = useRef(false);
  const getAssignment = useAssignmentStore((state) => state.getAssignment);
  const getPaper = useAssignmentStore((state) => state.getPaper);
  const savePaper = useAssignmentStore((state) => state.savePaper);
  const setGenerationStatus = useAssignmentStore((state) => state.setGenerationStatus);
  const addGenerationLog = useAssignmentStore((state) => state.addGenerationLog);
  const updateAssignmentStatus = useAssignmentStore((state) => state.updateAssignmentStatus);

  useEffect(() => {
    if (started.current || !assignmentId || !isDemoMode) return;
    started.current = true;

    const assignment = getAssignment(assignmentId);
    if (!assignment) return;
    if (getPaper(assignmentId)) {
      router.replace(`/assignments/${assignmentId}/paper`);
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    let elapsed = 0;

    demoSteps.forEach((step) => {
      elapsed += step.delay;
      timers.push(
        setTimeout(() => {
          setGenerationStatus({
            assignmentId,
            stage: step.stage,
            progress: step.progress,
            message: step.message
          });
          addGenerationLog(step.message);

          if (step.stage === "started" || step.stage === "ai-processing") {
            updateAssignmentStatus(assignmentId, "generating");
          }

          if (step.stage === "completed") {
            const paper = createSamplePaper(assignment);
            savePaper(paper);
            updateAssignmentStatus(assignmentId, "completed");
            toast.success("Question paper generated");
            router.replace(`/assignments/${assignmentId}/paper`);
          }
        }, elapsed)
      );
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [
    addGenerationLog,
    assignmentId,
    getAssignment,
    getPaper,
    router,
    savePaper,
    setGenerationStatus,
    updateAssignmentStatus
  ]);
}
