"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChevronDown,
  CloudUpload,
  Minus,
  Plus,
  WandSparkles,
  X
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input, Textarea } from "@/components/ui/Input";
import { assignmentSchema, questionTypes, type AssignmentFormValues } from "@/lib/validation";
import { isDemoMode } from "@/lib/env";
import { createAssignmentRequest, uploadFileRequest } from "@/services/api";
import { useAssignmentStore } from "@/store/assignmentStore";
import { cn } from "@/utils/cn";

const difficultyPresets = [
  { label: "Balanced", value: { easy: 35, medium: 45, hard: 20 } },
  { label: "Foundation", value: { easy: 55, medium: 35, hard: 10 } },
  { label: "Challenging", value: { easy: 20, medium: 45, hard: 35 } }
];

const questionTypeLabels: Record<string, string> = {
  "MCQ": "Multiple Choice Questions",
  "Short Answer": "Short Questions",
  "Long Answer": "Long Questions",
  "True/False": "True / False"
};

export function AssignmentForm() {
  const router = useRouter();
  const draft = useMemo(() => useAssignmentStore.getState().draft, []);
  const saveDraft = useAssignmentStore((state) => state.saveDraft);
  const createAssignment = useAssignmentStore((state) => state.createAssignment);
  const saveAssignment = useAssignmentStore((state) => state.saveAssignment);
  const setGenerationStatus = useAssignmentStore((state) => state.setGenerationStatus);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [mobileStep, setMobileStep] = useState(0); // 0 = step 1, 1 = step 2
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 767px)");
    setIsMobile(media.matches);
    const listener = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: draft,
    mode: "onChange"
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "questionConfigs",
    keyName: "fieldId"
  });

  const watchedConfigs = watch("questionConfigs");
  const difficulty = watch("difficultyDistribution");
  const fileName = watch("fileName");

  const totals = useMemo(() => {
    return watchedConfigs.reduce(
      (acc, config) => {
        const count = Number(config.count) || 0;
        const marks = Number(config.marks) || 0;
        return {
          questions: acc.questions + count,
          marks: acc.marks + count * marks
        };
      },
      { questions: 0, marks: 0 }
    );
  }, [watchedConfigs]);

  const difficultyTotal = difficulty.easy + difficulty.medium + difficulty.hard;

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const subscription = watch((value) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        saveDraft(value as Partial<AssignmentFormValues>);
      }, 400);
    });
    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [saveDraft, watch]);

  // Cleanup image preview URL on unmount or file change
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  async function onSubmit(values: AssignmentFormValues) {
    setIsSubmitting(true);
    try {
      let fileContext = "";
      if (uploadedFile) {
        try {
          // Attempt actual server-side upload and Groq OCR transcription
          const res = await uploadFileRequest(uploadedFile);
          fileContext = res.textContext;
        } catch (uploadErr) {
          console.warn("Real upload API failed/unreachable. Attempting high-fidelity fallback.", uploadErr);
          if (isDemoMode) {
            if (uploadedFile.type.startsWith("image/")) {
              fileContext = `[Vision OCR Fallback] Transcribed content from image "${uploadedFile.name}":\nOhm's Law and Circuit Basics: The relationship between Voltage (V), Current (I), and Resistance (R) is expressed as V = IR. The unit of electrical resistance is the Ohm. Direct current flows in one constant direction, whereas Alternating Current periodically reverses direction.`;
            } else {
              fileContext = `[Document OCR Fallback] Transcribed content from document "${uploadedFile.name}":\nChapter 5 Heat and Thermodynamics: Heat is energy transferred due to temperature difference. Specific heat capacity is the amount of heat energy required to raise the temperature of 1kg of a substance by 1 degree Celsius.`;
            }
          } else {
            throw uploadErr;
          }
        }
      }

      if (isDemoMode) {
        await new Promise((resolve) => setTimeout(resolve, 450));
        const assignment = createAssignment({
          ...values,
          instructions: values.instructions ?? "",
          fileContext
        });
        toast.success("Assignment created");
        router.push(`/generate/${assignment.id}`);
        return;
      }

      const assignment = await createAssignmentRequest({
        ...values,
        instructions: values.instructions ?? "",
        fileContext
      });
      saveAssignment(assignment);
      setGenerationStatus({
        assignmentId: assignment.id,
        stage: "queued",
        progress: 8,
        message: "Question generation job queued",
        logs: ["Job queued"]
      });
      toast.success("Assignment created");
      router.push(`/generate/${assignment.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create assignment");
    } finally {
      setIsSubmitting(false);
    }
  }

  /* ─── Step 1: Assignment Details + File Upload + Due Date + Question Types ─── */
  const StepOne = (
    <div className="rounded-[32px] bg-neutral-100/70 p-5 dark:bg-white/[0.02] space-y-6 md:bg-transparent md:p-0 md:dark:bg-transparent md:space-y-6">
      {/* Assignment Details */}
      <section className="space-y-5 md:rounded-3xl md:bg-white md:p-6 md:shadow-sm md:dark:bg-[#232323]">
        <div className="mb-2">
          <h3 className="text-lg font-bold text-ink dark:text-white">Assignment Details</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Basic information about your assignment
          </p>
        </div>

        {/* File upload area */}
        <Controller
          control={control}
          name="fileName"
          render={({ field }) => (
            <div className="mb-5">
              <div className="relative rounded-2xl border-2 border-dashed border-neutral-305 bg-white p-6 text-center dark:border-white/10 dark:bg-[#1a1a1a] transition hover:border-neutral-400 dark:hover:border-white/20">
                <input
                  type="file"
                  accept=".pdf,.txt,.jpg,.jpeg,.png"
                  className="absolute inset-0 cursor-pointer opacity-0 z-20"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      setUploadedFile(file);
                      field.onChange(file.name);
                      if (file.type.startsWith("image/")) {
                        const url = URL.createObjectURL(file);
                        setImagePreviewUrl(url);
                      } else {
                        setImagePreviewUrl(null);
                      }
                    } else {
                      setUploadedFile(null);
                      field.onChange("");
                      setImagePreviewUrl(null);
                    }
                  }}
                />
                
                {uploadedFile ? (
                  <div className="flex flex-col items-center justify-center py-2 relative z-30">
                    {imagePreviewUrl ? (
                      <div className="relative group mb-3.5">
                        {/* Soft premium shadow glow */}
                        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-ember to-amber-500 opacity-20 blur-sm transition duration-300 group-hover:opacity-30"></div>
                        {/* Thumbnail container */}
                        <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-white/10 dark:bg-neutral-800 shadow-md">
                          <img
                            src={imagePreviewUrl}
                            alt="Upload preview"
                            className="h-24 w-24 object-cover transition duration-300 group-hover:scale-105"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="mb-3.5 flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-50 dark:bg-white/5 border border-neutral-200/50 dark:border-white/10 text-neutral-500 dark:text-neutral-400">
                        <span className="text-xs font-black uppercase tracking-widest">
                          {uploadedFile.name.split(".").pop()}
                        </span>
                      </div>
                    )}
                    
                    <div className="text-center space-y-1">
                      <p className="text-sm font-bold text-ink dark:text-white max-w-[280px] truncate">
                        {uploadedFile.name}
                      </p>
                      <p className="text-xs text-neutral-400 dark:text-neutral-500">
                        {(uploadedFile.size / 1024).toFixed(1)} KB • {uploadedFile.type || "Unknown Type"}
                      </p>
                    </div>
                    
                    <div className="mt-4 flex items-center gap-2 relative z-30">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-xs font-bold text-neutral-600 shadow-sm transition hover:bg-neutral-50 dark:border-white/10 dark:bg-white/5 dark:text-neutral-200 dark:hover:bg-white/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setValue("fileName", "");
                          setUploadedFile(null);
                          setImagePreviewUrl(null);
                        }}
                      >
                        <X className="h-3.5 w-3.5 text-neutral-400" />
                        Remove File
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mx-auto grid h-12 w-12 place-items-center rounded-full text-neutral-400">
                      <CloudUpload className="h-6 w-6" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-ink dark:text-white">
                      Choose a file or drag & drop it here
                    </p>
                    <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-550">
                      PDF, TXT, JPEG, PNG, upto 10MB
                    </p>
                    <button
                      type="button"
                      className="relative z-10 mt-3 inline-flex items-center gap-1 rounded-full border border-neutral-305 bg-white px-4 py-1.5 text-xs font-bold text-ink transition hover:bg-neutral-50 dark:border-white/20 dark:bg-transparent dark:text-white"
                    >
                      Browse Files
                    </button>
                  </>
                )}
              </div>
              <p className="mt-2 text-xs text-neutral-400 dark:text-neutral-500">
                Upload files or images of your preferred document/image
              </p>
            </div>
          )}
        />

        {/* Unified, single responsive form grid to prevent layout unmounting and duplicate register clashes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Assignment title" error={errors.title?.message}>
            <Input
              placeholder="Quiz on Electricity"
              className="rounded-full border-none h-12 shadow-sm md:rounded-2xl md:border md:border-line-soft md:bg-white md:shadow-none focus-visible:ring-ember dark:bg-[#2b2b2b] dark:md:bg-white/5"
              {...register("title")}
            />
          </FormField>
          <FormField label="Subject" error={errors.subject?.message}>
            <Input
              placeholder="Science"
              className="rounded-full border-none h-12 shadow-sm md:rounded-2xl md:border md:border-line-soft md:bg-white md:shadow-none focus-visible:ring-ember dark:bg-[#2b2b2b] dark:md:bg-white/5"
              {...register("subject")}
            />
          </FormField>
          <FormField label="Class / Grade" error={errors.grade?.message}>
            <Input
              placeholder="Grade 8"
              className="rounded-full border-none h-12 shadow-sm md:rounded-2xl md:border md:border-line-soft md:bg-white md:shadow-none focus-visible:ring-ember dark:bg-[#2b2b2b] dark:md:bg-white/5"
              {...register("grade")}
            />
          </FormField>
          <FormField label="Due date" error={errors.dueDate?.message}>
            <div className="relative">
              <Input
                type="date"
                placeholder="DD-MM-YYYY"
                className="rounded-full border-none h-12 shadow-sm md:rounded-2xl md:border md:border-line-soft md:bg-white md:shadow-none focus-visible:ring-ember dark:bg-[#2b2b2b] dark:md:bg-white/5 pr-12"
                {...register("dueDate")}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 shadow-sm dark:bg-[#1a1a1a] text-neutral-600 dark:text-neutral-300 md:bg-transparent md:shadow-none md:pointer-events-none">
                <CalendarDays className="h-4 w-4 text-neutral-400" />
              </div>
            </div>
          </FormField>
        </div>
      </section>

      {/* Question Type Section */}
      <section className="space-y-4 md:rounded-3xl md:bg-white md:p-6 md:shadow-sm md:dark:bg-[#232323]">
        <div className="mb-2">
          <h3 className="text-lg font-bold text-ink dark:text-white">Question Type</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Add sections, question counts, and marks.</p>
        </div>

        <div className="space-y-3.5">
          {fields.map((field, index) => (
            <div
              key={field.fieldId}
              className="rounded-2xl bg-white p-4 shadow-sm border border-neutral-200/50 dark:border-white/5 dark:bg-[#2b2b2b]"
            >
              {/* Type selector + remove */}
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="relative flex items-center">
                  <select
                    className="appearance-none bg-transparent py-0 pl-0 pr-6 text-base font-bold text-ink outline-none focus:ring-0 dark:text-white cursor-pointer"
                    {...register(`questionConfigs.${index}.type`)}
                  >
                    {questionTypes.map((type) => (
                      <option key={type} value={type}>
                        {questionTypeLabels[type] ?? type}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                </div>
                <button
                  type="button"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-ink disabled:opacity-30 dark:hover:bg-white/10"
                  disabled={fields.length === 1}
                  onClick={() => remove(index)}
                  title="Remove question type"
                  aria-label="Remove question type"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Stepper counters */}
              <div className="grid grid-cols-2 gap-3.5">
                <FormField
                  label="No. of Questions"
                  error={errors.questionConfigs?.[index]?.count?.message}
                >
                  <Stepper
                    value={Number(watchedConfigs[index]?.count) || 0}
                    onChange={(next) => setValue(`questionConfigs.${index}.count`, next, { shouldValidate: true })}
                  />
                </FormField>
                <FormField label="Marks" error={errors.questionConfigs?.[index]?.marks?.message}>
                  <Stepper
                    value={Number(watchedConfigs[index]?.marks) || 0}
                    onChange={(next) => setValue(`questionConfigs.${index}.marks`, next, { shouldValidate: true })}
                  />
                </FormField>
              </div>
            </div>
          ))}
          {errors.questionConfigs?.root?.message ? (
            <p className="text-xs font-semibold text-danger">{errors.questionConfigs.root.message}</p>
          ) : null}
        </div>

        {/* Add Question Type */}
        <button
          type="button"
          className="mt-4 flex items-center gap-2 text-sm font-semibold text-ink transition hover:text-ember dark:text-white dark:hover:text-ember"
          onClick={() =>
            append({
              id: crypto.randomUUID(),
              type: "MCQ",
              count: 4,
              marks: 1
            })
          }
        >
          <span className="grid h-7 w-7 place-items-center rounded-full bg-[#272727] text-white dark:bg-white dark:text-ink shadow-sm">
            <Plus className="h-3.5 w-3.5" />
          </span>
          Add Question Type
        </button>
      </section>

      {/* Totals */}
      <div className="flex items-center justify-end gap-6 px-1 text-sm font-bold text-ink dark:text-white">
        <span>Total Questions : {totals.questions}</span>
        <span>Total Marks : {totals.marks}</span>
      </div>
    </div>
  );

  /* ─── Step 2: Difficulty Distribution + Instructions ─── */
  const StepTwo = (
    <div className="rounded-[32px] bg-neutral-100/70 p-5 dark:bg-white/[0.02] space-y-6 md:bg-transparent md:p-0 md:dark:bg-transparent md:space-y-6">
      <section className="space-y-5 md:rounded-3xl md:bg-white md:p-6 md:shadow-sm md:dark:bg-[#232323]">
        <div className="mb-2">
          <h3 className="text-lg font-bold text-ink dark:text-white">Difficulty Distribution</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Tune the balance. The total must be 100%.</p>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {difficultyPresets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-full bg-white px-4 text-xs font-bold text-ink shadow-sm border border-neutral-200/50 hover:bg-neutral-50 dark:bg-white/10 dark:text-white dark:border-none transition-all"
              onClick={() => setValue("difficultyDistribution", preset.value, { shouldValidate: true })}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="space-y-5">
          {(["easy", "medium", "hard"] as const).map((level) => (
            <FormField key={level} label={`${level[0].toUpperCase()}${level.slice(1)} questions`}>
              <div className="grid grid-cols-[1fr_76px] items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  className="h-2 cursor-pointer accent-ember"
                  {...register(`difficultyDistribution.${level}`, { valueAsNumber: true })}
                />
                <Input
                  type="number"
                  className="h-10 rounded-xl text-center font-bold bg-white dark:bg-[#2b2b2b] border-none shadow-sm"
                  {...register(`difficultyDistribution.${level}`, { valueAsNumber: true })}
                />
              </div>
            </FormField>
          ))}
        </div>

        <div className="mt-5 rounded-2xl bg-white p-4 text-sm font-semibold shadow-sm dark:bg-[#2b2b2b] border border-neutral-250/20">
          <div className="flex items-center justify-between">
            <span>Total distribution</span>
            <span className={difficultyTotal === 100 ? "text-success" : "text-danger"}>{difficultyTotal}%</span>
          </div>
          {errors.difficultyDistribution?.message ? (
            <p className="mt-2 text-xs text-danger">{errors.difficultyDistribution.message}</p>
          ) : null}
        </div>
      </section>

      <section className="space-y-5 md:rounded-3xl md:bg-white md:p-6 md:shadow-sm md:dark:bg-[#232323]">
        <FormField label="Additional instructions" error={errors.instructions?.message}>
          <Textarea
            placeholder="Mention NCERT chapter focus, exclusions, answer style, or rubric preferences."
            className="rounded-2xl border-none bg-white p-4 text-sm dark:bg-[#2b2b2b] shadow-sm min-h-[140px]"
            {...register("instructions")}
          />
        </FormField>
      </section>
    </div>
  );

  return (
    <AppShell
      title="Create Assignment"
      subtitle="Configure the assessment brief and let VedaAI generate a structured question paper."
      actions={
        <Button type="submit" form="assignment-form" loading={isSubmitting}>
          <WandSparkles className="h-4 w-4" />
          Generate Paper
        </Button>
      }
    >
      <form id="assignment-form" onSubmit={handleSubmit(onSubmit)} className="grid gap-5 xl:grid-cols-[1fr_360px]">
        {/* ── Main form area ── */}
        <div className="space-y-5">
          {!isMobile ? (
            /* Desktop: Show all steps */
            <div className="space-y-5">
              {StepOne}
              {StepTwo}
            </div>
          ) : (
            /* Mobile: Stepped flow */
            <div className="space-y-5">
              {/* Progress Step Bar matching Screenshot 5 */}
              <div className="flex gap-2.5 h-1 w-full bg-transparent px-1 mb-2">
                <div className={cn("h-full flex-1 rounded-full", mobileStep === 0 ? "bg-neutral-850" : "bg-neutral-850")} />
                <div className={cn("h-full flex-1 rounded-full", mobileStep === 1 ? "bg-neutral-850" : "bg-neutral-300/60 dark:bg-white/10")} />
              </div>

              {mobileStep === 0 ? StepOne : StepTwo}

              {/* Previous / Next navigation */}
              <div className="flex items-center justify-between pt-2">
                {mobileStep > 0 ? (
                  <button
                    type="button"
                    onClick={() => setMobileStep(0)}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white px-6 text-sm font-bold text-ink shadow-sm transition hover:bg-neutral-50 dark:border-white/10 dark:bg-[#2a2a2a] dark:text-white"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Previous
                  </button>
                ) : (
                  <span />
                )}

                {mobileStep === 0 ? (
                  <button
                    type="button"
                    onClick={() => setMobileStep(1)}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ink px-8 text-sm font-bold text-white shadow-sm transition hover:bg-ink/90 active:scale-[0.98] dark:bg-white dark:text-ink"
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    form="assignment-form"
                    disabled={isSubmitting}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ink px-8 text-sm font-bold text-white shadow-sm transition hover:bg-ink/90 active:scale-[0.98] disabled:opacity-50 dark:bg-white dark:text-ink"
                  >
                    <WandSparkles className="h-4 w-4 text-ember fill-ember" />
                    Generate Paper
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Desktop sidebar summary ── */}
        <aside className="hidden xl:sticky xl:top-28 xl:block xl:h-fit">
          <div className="rounded-3xl bg-ink p-5 text-white shadow-card dark:bg-white dark:text-ink">
            <p className="text-sm font-semibold text-white/60 dark:text-ink/60">Assessment summary</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <SummaryItem label="Questions" value={totals.questions} />
              <SummaryItem label="Marks" value={totals.marks} />
              <SummaryItem label="Easy" value={`${difficulty.easy}%`} />
              <SummaryItem label="Hard" value={`${difficulty.hard}%`} />
            </div>
            <div className="mt-5 rounded-2xl bg-white/8 p-4 text-sm leading-6 dark:bg-ink/5">
              VedaAI will generate a clean exam-paper layout, validate question sections, and prepare the result for PDF export.
            </div>
            <Button className="mt-5 w-full" type="submit" form="assignment-form" loading={isSubmitting}>
              <WandSparkles className="h-4 w-4" />
              Generate Paper
            </Button>
          </div>
        </aside>
      </form>
    </AppShell>
  );
}

/* ─── Stepper Component ─── */
function Stepper({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="flex h-12 items-center justify-between rounded-full bg-neutral-100/80 px-2 dark:bg-[#1a1a1a]">
      {/* Minus button */}
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center text-neutral-500 transition hover:text-ink active:scale-95 dark:text-neutral-400 dark:hover:text-white"
        onClick={() => onChange(Math.max(1, value - 1))}
        aria-label="Decrease"
      >
        <Minus className="h-4 w-4" />
      </button>

      {/* Value box */}
      <div className="flex h-8 w-16 items-center justify-center rounded-xl bg-white text-sm font-bold text-ink shadow-sm dark:bg-[#2b2b2b] dark:text-white">
        <input
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          type="number"
          min="1"
          className="h-full w-full bg-transparent text-center text-sm font-bold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      </div>

      {/* Plus button */}
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center text-neutral-500 transition hover:text-ink active:scale-95 dark:text-neutral-400 dark:hover:text-white"
        onClick={() => onChange(value + 1)}
        aria-label="Increase"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ─── Summary Item ─── */
function SummaryItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white/8 p-4 dark:bg-ink/5">
      <p className="text-xs font-semibold opacity-60">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}
