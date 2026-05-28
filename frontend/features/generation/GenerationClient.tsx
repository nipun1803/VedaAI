"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bot, CheckCircle2, CircleDashed, FileText, Loader2, RotateCcw } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import toast from "react-hot-toast";
import { useGenerationSimulator } from "@/hooks/useGenerationSimulator";
import { useMounted } from "@/hooks/useMounted";
import { useSocketBridge } from "@/hooks/useSocketBridge";
import { isDemoMode } from "@/lib/env";
import { getAssignmentRequest, getJobStatusRequest, regenerateAssignmentRequest } from "@/services/api";
import { useAssignmentStore } from "@/store/assignmentStore";
import type { GenerationStage } from "@/types/assignment";

const stageLabels: Array<{ stage: GenerationStage; label: string }> = [
  { stage: "queued", label: "Job queued" },
  { stage: "started", label: "Generation started" },
  { stage: "ai-processing", label: "AI processing" },
  { stage: "pdf-generation", label: "PDF preparation" },
  { stage: "completed", label: "Completed" }
];

export function GenerationClient({ assignmentId }: { assignmentId: string }) {
  const mounted = useMounted();
  const assignment = useAssignmentStore((state) => state.getAssignment(assignmentId));
  const status = useAssignmentStore((state) => state.generationStatus);
  const paper = useAssignmentStore((state) => state.getPaper(assignmentId));
  const saveAssignment = useAssignmentStore((state) => state.saveAssignment);
  const savePaper = useAssignmentStore((state) => state.savePaper);
  const updateAssignmentStatus = useAssignmentStore((state) => state.updateAssignmentStatus);
  const setGenerationStatus = useAssignmentStore((state) => state.setGenerationStatus);
  const [isFetchingRemote, setIsFetchingRemote] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  useSocketBridge(assignmentId);
  useGenerationSimulator(assignmentId);

  function handleRegenerate() {
    if (!assignment) return;
    setIsRegenerating(true);
    
    if (!isDemoMode) {
      regenerateAssignmentRequest(assignment.id)
        .then((updated) => {
          saveAssignment(updated);
          // Reset progress states
          setGenerationStatus({
            assignmentId,
            stage: "queued",
            progress: 8,
            message: "Regeneration queued",
            logs: ["Regeneration queued by user"]
          });
          updateAssignmentStatus(assignment.id, "queued");
          toast.success("Regeneration queued successfully");
        })
        .catch(() => {
          toast.error("Could not queue regeneration");
        })
        .finally(() => {
          setIsRegenerating(false);
        });
      return;
    }

    // Demo Mode fallback
    setTimeout(() => {
      updateAssignmentStatus(assignment.id, "generating");
      setGenerationStatus({
        assignmentId,
        stage: "queued",
        progress: 8,
        message: "Starting simulation...",
        logs: ["Simulating generation in demo mode"]
      });
      setIsRegenerating(false);
      toast.success("Simulation restarted");
    }, 500);
  }

  useEffect(() => {
    if (!mounted || assignment || isDemoMode) return;

    setIsFetchingRemote(true);
    getAssignmentRequest(assignmentId)
      .then((data) => {
        saveAssignment(data.assignment);
        if (data.paper) savePaper(data.paper);
      })
      .finally(() => setIsFetchingRemote(false));
  }, [assignment, assignmentId, mounted, saveAssignment, savePaper]);

  useEffect(() => {
    if (!mounted || isDemoMode) return;
    
    // Sync job status on reconnect
    const setGenerationStatus = useAssignmentStore.getState().setGenerationStatus;
    getJobStatusRequest(assignmentId).then((jobStatus) => {
      if (jobStatus.stage !== "queued") {
        setGenerationStatus({
          assignmentId,
          stage: jobStatus.stage as GenerationStage,
          progress: jobStatus.progress,
          message: jobStatus.message,
          logs: [jobStatus.message]
        });
      }
    }).catch(() => {
      // ignore
    });
  }, [assignmentId, mounted]);

  return (
    <AppShell title="Generating" subtitle="Realtime AI generation progress from queue to validated paper.">
      {!mounted || isFetchingRemote ? (
        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <Skeleton className="h-[440px]" />
          <Skeleton className="h-[440px]" />
        </div>
      ) : !assignment ? (
        <div className="grid min-h-[60vh] place-items-center rounded-3xl bg-white p-8 text-center dark:bg-[#232323]">
          <div>
            <p className="text-xl font-bold">Assignment not found</p>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-300">
              Create a new assignment to start generation.
            </p>
            <Link href="/create" className="mt-5 inline-block">
              <Button>Create Assignment</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
          {status.stage === "failed" || assignment.status === "failed" ? (
            <section className="overflow-hidden rounded-[32px] border border-danger/10 bg-white p-8 text-center shadow-card dark:border-white/10 dark:bg-[#232323] dark:text-white sm:p-12 flex flex-col items-center justify-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-danger/10 text-danger mb-6 dark:bg-danger/25">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-ink dark:text-white">Generation Failed</h2>
              <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400 max-w-md">
                We encountered an unexpected error while generating your assessment paper. You can see the detailed trail in the Worker Logs on the right.
              </p>
              {assignment.lastError && (
                <div className="mt-5 rounded-2xl bg-danger/5 p-4 border border-danger/10 text-left w-full max-w-lg dark:bg-danger/10 dark:border-danger/20">
                  <p className="text-xs font-mono text-danger break-words leading-relaxed">
                    {assignment.lastError}
                  </p>
                </div>
              )}
              {status.error && status.error !== assignment.lastError && (
                <div className="mt-3 rounded-2xl bg-danger/5 p-4 border border-danger/10 text-left w-full max-w-lg dark:bg-danger/10 dark:border-danger/20">
                  <p className="text-xs font-mono text-danger break-words leading-relaxed">
                    {status.error}
                  </p>
                </div>
              )}
              <div className="mt-8 flex flex-col justify-center gap-3 w-full sm:flex-row sm:w-auto">
                <Link href="/create">
                  <Button variant="secondary" className="w-full sm:w-auto">
                    Adjust Brief
                  </Button>
                </Link>
                <Button onClick={handleRegenerate} loading={isRegenerating} className="w-full sm:w-auto">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Retry Generation
                </Button>
              </div>
            </section>
          ) : (
            <section className="overflow-hidden rounded-3xl bg-white shadow-sm dark:bg-[#232323]">
              <div className="bg-ink p-6 text-white dark:bg-white dark:text-ink sm:p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold opacity-70">VedaAI generation pipeline</p>
                    <h2 className="mt-2 text-2xl font-black sm:text-3xl">{assignment.title}</h2>
                    <p className="mt-2 text-sm opacity-70">
                      {assignment.subject} · {assignment.grade}
                    </p>
                  </div>
                  <ProgressOrb progress={status.assignmentId === assignmentId ? status.progress : 8} />
                </div>
              </div>

              <div className="p-6 sm:p-8">
                <div className="mb-8 rounded-3xl bg-neutral-50 p-4 dark:bg-white/6">
                  <div className="mb-3 flex items-center justify-between text-sm font-bold">
                    <span>{status.assignmentId === assignmentId ? status.message : "Preparing job"}</span>
                    <span>{status.assignmentId === assignmentId ? status.progress : 8}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-neutral-200 dark:bg-white/10">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-ember to-saffron"
                      initial={{ width: 0 }}
                      animate={{ width: `${status.assignmentId === assignmentId ? status.progress : 8}%` }}
                      transition={{ duration: 0.45 }}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {stageLabels.map((item) => {
                    const currentIndex = stageLabels.findIndex((stage) => stage.stage === status.stage);
                    const itemIndex = stageLabels.findIndex((stage) => stage.stage === item.stage);
                    const complete = itemIndex < currentIndex || status.stage === "completed";
                    const active = item.stage === status.stage && status.stage !== "completed";

                    return (
                      <div
                        key={item.stage}
                        className="flex items-center gap-4 rounded-2xl border border-line-soft bg-white p-4 dark:border-white/10 dark:bg-white/5"
                      >
                        <span className="grid h-10 w-10 place-items-center rounded-full bg-neutral-100 text-neutral-500 dark:bg-white/10 dark:text-neutral-300">
                          {complete ? (
                            <CheckCircle2 className="h-5 w-5 text-success" />
                          ) : active ? (
                            <Loader2 className="h-5 w-5 animate-spin text-ember" />
                          ) : (
                            <CircleDashed className="h-5 w-5" />
                          )}
                        </span>
                        <div>
                          <p className="font-bold">{item.label}</p>
                          <p className="text-sm text-neutral-500 dark:text-neutral-300">
                            {complete ? "Finished" : active ? "In progress" : "Waiting"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {paper || status.stage === "completed" ? (
                  <Link href={`/assignments/${assignmentId}/paper`} className="mt-7 inline-flex">
                    <Button>
                      <FileText className="h-4 w-4" />
                      View Paper
                    </Button>
                  </Link>
                ) : null}
              </div>
            </section>
          )}

          <aside className="space-y-5">
            <div className="rounded-3xl bg-white p-5 shadow-sm dark:bg-[#232323]">
              <div className="mb-4 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-orange-50 text-ember dark:bg-orange-500/15">
                  <Bot className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-bold">Worker Logs</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-300">Live progress trail</p>
                </div>
              </div>
              <div className="max-h-[360px] space-y-3 overflow-auto pr-1">
                {(status.logs.length ? status.logs : ["Job queued"]).map((log, index) => (
                  <div key={`${log}-${index}`} className="rounded-2xl bg-neutral-50 p-3 text-sm dark:bg-white/6">
                    <span className="font-semibold text-ember">{String(index + 1).padStart(2, "0")}</span>
                    <span className="ml-2 text-neutral-600 dark:text-neutral-200">{log}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm dark:bg-[#232323]">
              <h3 className="font-bold">Generation Controls</h3>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-300">
                Regeneration will reuse the assignment configuration.
              </p>
              <Link href="/create" className="mt-4 inline-flex">
                <Button variant="secondary">
                  <RotateCcw className="h-4 w-4" />
                  Adjust Brief
                </Button>
              </Link>
            </div>
          </aside>
        </div>
      )}
    </AppShell>
  );
}

function ProgressOrb({ progress }: { progress: number }) {
  return (
    <div className="relative grid h-28 w-28 place-items-center">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r="50" stroke="currentColor" strokeOpacity="0.16" strokeWidth="12" fill="none" />
        <motion.circle
          cx="60"
          cy="60"
          r="50"
          stroke="#f0652f"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={314}
          initial={{ strokeDashoffset: 314 }}
          animate={{ strokeDashoffset: 314 - (314 * progress) / 100 }}
          transition={{ duration: 0.5 }}
        />
      </svg>
      <span className="absolute text-xl font-black">{progress}%</span>
    </div>
  );
}
