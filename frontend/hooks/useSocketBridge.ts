"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { getSocket } from "@/services/socket";
import { getAssignmentRequest } from "@/services/api";
import { isDemoMode } from "@/lib/env";
import { useAssignmentStore } from "@/store/assignmentStore";
import type { GenerationStage } from "@/types/assignment";

interface GenerationEvent {
  assignmentId: string;
  stage: GenerationStage;
  progress: number;
  message: string;
}

export function useSocketBridge(assignmentId?: string) {
  const router = useRouter();
  const setGenerationStatus = useAssignmentStore((state) => state.setGenerationStatus);
  const addGenerationLog = useAssignmentStore((state) => state.addGenerationLog);
  const updateAssignmentStatus = useAssignmentStore((state) => state.updateAssignmentStatus);
  const saveAssignment = useAssignmentStore((state) => state.saveAssignment);
  const savePaper = useAssignmentStore((state) => state.savePaper);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !assignmentId) return;

    socket.connect();
    socket.emit("join-assignment", assignmentId);

    const onGenerationUpdate = (event: GenerationEvent) => {
      if (event.assignmentId !== assignmentId) return;
      setGenerationStatus({
        assignmentId,
        stage: event.stage,
        progress: event.progress,
        message: event.message
      });
      addGenerationLog(event.message);

      if (event.stage === "completed") {
        updateAssignmentStatus(assignmentId, "completed");
        toast.success("Question paper generated");

        if (!isDemoMode) {
          getAssignmentRequest(assignmentId)
            .then((data) => {
              saveAssignment(data.assignment);
              if (data.paper) savePaper(data.paper);
              router.push(`/assignments/${assignmentId}/paper`);
            })
            .catch(() => {
              router.push(`/assignments/${assignmentId}/paper`);
            });
        }
      }

      if (event.stage === "failed") {
        updateAssignmentStatus(assignmentId, "failed");
        toast.error(event.message);
      }
    };

    socket.on("generation:update", onGenerationUpdate);

    socket.on("reconnect", () => {
      socket.emit("join-assignment", assignmentId);
    });

    return () => {
      socket.off("generation:update", onGenerationUpdate);
      socket.emit("leave-assignment", assignmentId);
    };
  }, [
    addGenerationLog,
    assignmentId,
    router,
    saveAssignment,
    savePaper,
    setGenerationStatus,
    updateAssignmentStatus
  ]);
}
