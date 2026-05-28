"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Download, Printer, RefreshCw, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { DifficultyBadge, StatusBadge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { exportPaperAsPdf } from "@/services/pdf";
import { useMounted } from "@/hooks/useMounted";
import { isDemoMode } from "@/lib/env";
import { downloadAssignmentPdfRequest, getAssignmentRequest, regenerateAssignmentRequest } from "@/services/api";
import { useAssignmentStore } from "@/store/assignmentStore";
import { createSamplePaper } from "@/utils/questions";

export function PaperClient({ assignmentId }: { assignmentId: string }) {
  const mounted = useMounted();
  const assignment = useAssignmentStore((state) => state.getAssignment(assignmentId));
  const paper = useAssignmentStore((state) => state.getPaper(assignmentId));
  const savePaper = useAssignmentStore((state) => state.savePaper);
  const saveAssignment = useAssignmentStore((state) => state.saveAssignment);
  const updateAssignmentStatus = useAssignmentStore((state) => state.updateAssignmentStatus);
  const [isExporting, setIsExporting] = useState(false);
  const [isFetchingRemote, setIsFetchingRemote] = useState(false);

  useEffect(() => {
    if (!mounted || paper) return;

    if (!isDemoMode) {
      setIsFetchingRemote(true);
      getAssignmentRequest(assignmentId)
        .then((data) => {
          saveAssignment(data.assignment);
          if (data.paper) savePaper(data.paper);
        })
        .catch(() => {
          toast.error("Generated paper is not ready yet");
        })
        .finally(() => setIsFetchingRemote(false));
      return;
    }

    if (assignment) {
      const generated = createSamplePaper(assignment);
      savePaper(generated);
      updateAssignmentStatus(assignmentId, "completed");
    }
  }, [assignment, assignmentId, mounted, paper, saveAssignment, savePaper, updateAssignmentStatus]);

  async function handleExport() {
    if (!paper) return;
    setIsExporting(true);
    try {
      try {
        const blob = await downloadAssignmentPdfRequest(assignmentId);
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `${paper.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-question-paper.pdf`;
        anchor.click();
        URL.revokeObjectURL(url);
        toast.success("PDF downloaded");
      } catch (err) {
        console.warn("Server PDF export failed or unreachable, generating client-side:", err);
        await exportPaperAsPdf(paper);
        toast.success("PDF generated locally");
      }
    } catch (fallbackErr) {
      console.error("Local PDF generation failed:", fallbackErr);
      toast.error("Could not export PDF");
    } finally {
      setIsExporting(false);
    }
  }

  function handleRegenerate() {
    if (!assignment) return;
    if (!isDemoMode) {
      regenerateAssignmentRequest(assignment.id)
        .then((updated) => {
          saveAssignment(updated);
          toast.success("Regeneration queued");
        })
        .catch(() => toast.error("Could not queue regeneration"));
      return;
    }

    savePaper(createSamplePaper({ ...assignment, updatedAt: new Date().toISOString() }));
    updateAssignmentStatus(assignment.id, "completed");
    toast.success("Paper regenerated");
  }

  const actions = (
    <>
      <Button variant="secondary" onClick={() => window.print()}>
        <Printer className="h-4 w-4" />
        Print
      </Button>
      <Button onClick={handleExport} loading={isExporting}>
        <Download className="h-4 w-4" />
        Download PDF
      </Button>
    </>
  );

  return (
    <AppShell title="Question Paper" subtitle="Structured output generated from your assessment brief." actions={actions}>
      {!mounted || isFetchingRemote ? (
        <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
          <Skeleton className="h-[720px]" />
          <Skeleton className="h-80" />
        </div>
      ) : !assignment ? (
        <div className="grid min-h-[60vh] place-items-center rounded-3xl bg-white p-8 text-center dark:bg-[#232323]">
          <div>
            <p className="text-xl font-bold">Paper not found</p>
            <Link href="/create" className="mt-5 inline-block">
              <Button>Create Assignment</Button>
            </Link>
          </div>
        </div>
      ) : assignment.status === "failed" ? (
        <div className="mx-auto max-w-2xl rounded-[32px] border border-danger/10 bg-white p-8 text-center shadow-card dark:border-white/10 dark:bg-[#232323] dark:text-white sm:p-12 mt-10">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-danger/10 text-danger mb-6 dark:bg-danger/25">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-ink dark:text-white">Generation Failed</h2>
          <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
            We encountered an unexpected error while generating the question paper.
          </p>
          {assignment.lastError && (
            <div className="mt-5 rounded-2xl bg-danger/5 p-4 border border-danger/10 text-left dark:bg-danger/10 dark:border-danger/20">
              <p className="text-xs font-mono text-danger break-words leading-relaxed">
                {assignment.lastError}
              </p>
            </div>
          )}
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/">
              <Button variant="secondary" className="w-full sm:w-auto">
                Go to Dashboard
              </Button>
            </Link>
            <Button onClick={handleRegenerate} className="w-full sm:w-auto">
              <RefreshCw className="mr-2 h-4 w-4" />
              Regenerate Paper
            </Button>
          </div>
        </div>
      ) : !paper ? (
        <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
          <Skeleton className="h-[720px]" />
          <Skeleton className="h-80" />
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
          <div className="space-y-5">
            <section className="print-hidden rounded-3xl bg-ink p-5 text-white shadow-card dark:bg-white dark:text-ink sm:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="max-w-3xl text-sm font-semibold leading-6">
                    Certainly, here is the customized Question Paper for your {paper.grade} {paper.subject} class,
                    generated with balanced difficulty and structured sections.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={handleRegenerate}>
                    <RefreshCw className="h-4 w-4" />
                    Regenerate
                  </Button>
                  <Button onClick={handleExport} loading={isExporting}>
                    <Download className="h-4 w-4" />
                    Download as PDF
                  </Button>
                </div>
              </div>
            </section>

            <article className="print-paper mx-auto max-w-[920px] rounded-3xl border border-black/5 bg-white p-6 shadow-card dark:border-white/10 dark:bg-[#232323] dark:text-white sm:p-10 lg:p-12">
              <header className="text-center">
                <h1 className="text-2xl font-black sm:text-3xl">{paper.schoolName}</h1>
                <div className="mt-4 space-y-1 text-base font-semibold">
                  <p>Subject: {paper.subject}</p>
                  <p>Class: {paper.grade}</p>
                </div>
              </header>

              <section className="mt-8 grid gap-4 text-sm sm:grid-cols-2">
                <div className="space-y-2">
                  <p>
                    <span className="font-bold">Time Allowed:</span> {paper.timeAllowed}
                  </p>
                  <p>
                    <span className="font-bold">All questions are compulsory unless stated otherwise.</span>
                  </p>
                </div>
                <div className="space-y-2 sm:text-right">
                  <p>
                    <span className="font-bold">Maximum Marks:</span> {paper.maximumMarks}
                  </p>
                </div>
              </section>

              <section className="mt-8 grid gap-3 text-sm">
                <p>Name: <span className="inline-block w-64 border-b border-ink dark:border-white/40 align-middle" /></p>
                <p>Roll Number: <span className="inline-block w-56 border-b border-ink dark:border-white/40 align-middle" /></p>
                <p>Class: {paper.grade} Section: <span className="inline-block w-48 border-b border-ink dark:border-white/40 align-middle" /></p>
              </section>

              <div className="mt-10 space-y-10">
                {paper.sections.map((section, secIndex) => (
                  <section key={section.id || secIndex}>
                    <div className="text-center">
                      <h2 className="text-lg font-black">{section.name}</h2>
                      <p className="mt-2 text-sm italic">{section.instruction}</p>
                    </div>

                    <ol className="mt-6 space-y-4">
                      {section.questions.map((question, index) => (
                        <li key={`${section.id || secIndex}-q-${index}`} className="grid gap-2 text-sm leading-6">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                            <span className="font-semibold">{index + 1}.</span>
                            <p className="flex-1">
                              {question.question} <span className="font-semibold">[{question.marks} Marks]</span>
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              <DifficultyBadge level={question.difficulty as any} />
                              <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-bold text-neutral-700 dark:bg-white/10 dark:text-neutral-300">
                                {question.type}
                              </span>
                            </div>
                          </div>
                          {question.options ? (
                            <div className="ml-0 grid gap-2 rounded-2xl bg-neutral-50 p-3 sm:ml-7 sm:grid-cols-2 dark:bg-white/5">
                              {question.options.map((option, optionIndex) => (
                                <p key={optionIndex} className="text-xs">
                                  {String.fromCharCode(65 + optionIndex)}. {option}
                                </p>
                              ))}
                            </div>
                          ) : null}
                        </li>
                      ))}
                    </ol>
                  </section>
                ))}
              </div>

              <section className="mt-12 border-t border-neutral-200 pt-8">
                <h2 className="text-base font-black">Answer Key:</h2>
                <ol className="mt-4 space-y-3 text-sm leading-6">
                  {paper.answerKey.map((answer, index) => (
                    <li key={`${answer}-${index}`}>{answer}</li>
                  ))}
                </ol>
              </section>

              <p className="mt-10 text-center text-sm font-black">End of Question Paper</p>
            </article>
          </div>

          <aside className="print-hidden space-y-5 xl:sticky xl:top-28 xl:h-fit">
            <div className="rounded-3xl bg-white p-5 shadow-sm dark:bg-[#232323]">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-orange-50 text-ember dark:bg-orange-500/15">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-bold">Paper Summary</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-300">Generated structure</p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <Metric label="Sections" value={paper.sections.length} />
                <Metric
                  label="Questions"
                  value={paper.sections.reduce((total, section) => total + section.questions.length, 0)}
                />
                <Metric label="Marks" value={paper.maximumMarks} />
                <Metric label="Time" value={paper.timeAllowed} />
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <StatusBadge status={assignment.status as any} />
              </div>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm dark:bg-[#232323]">
              <h3 className="font-bold">Paper Tools</h3>
              <div className="mt-4 grid gap-2">
                <Button variant="secondary" className="w-full" onClick={handleRegenerate}>
                  <RefreshCw className="h-4 w-4" />
                  Regenerate
                </Button>
                <Button variant="secondary" className="w-full" onClick={handleExport} loading={isExporting}>
                  <Download className="h-4 w-4" />
                  Download Copy
                </Button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-neutral-50 p-4 dark:bg-white/6">
      <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-300">{label}</p>
      <p className="mt-1 text-lg font-black">{value}</p>
    </div>
  );
}
