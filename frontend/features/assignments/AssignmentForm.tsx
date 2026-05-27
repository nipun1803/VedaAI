"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import {
  CalendarDays,
  FileUp,
  Minus,
  Plus,
  Sparkles,
  Trash2,
  WandSparkles,
  X
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input, Textarea, inputClassName } from "@/components/ui/Input";
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

export function AssignmentForm() {
  const router = useRouter();
  const draft = useAssignmentStore((state) => state.draft);
  const saveDraft = useAssignmentStore((state) => state.saveDraft);
  const createAssignment = useAssignmentStore((state) => state.createAssignment);
  const saveAssignment = useAssignmentStore((state) => state.saveAssignment);
  const setGenerationStatus = useAssignmentStore((state) => state.setGenerationStatus);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

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
    const subscription = watch((value) => {
      saveDraft(value as Partial<AssignmentFormValues>);
    });
    return () => subscription.unsubscribe();
  }, [saveDraft, watch]);

  async function onSubmit(values: AssignmentFormValues) {
    setIsSubmitting(true);
    try {
      let fileContext = "";
      if (uploadedFile) {
        if (!isDemoMode) {
          const res = await uploadFileRequest(uploadedFile);
          fileContext = res.textContext;
        } else {
          fileContext = "Demo context text snippet.";
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
        <div className="space-y-5">
          <section className="rounded-3xl bg-white p-5 shadow-sm dark:bg-[#232323] sm:p-6">
            <div className="mb-5 flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-50 text-success dark:bg-emerald-500/15">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-lg font-bold">Assignment Details</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-300">
                  Basic information your generated paper will inherit.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Assignment title" error={errors.title?.message}>
                <Input placeholder="Quiz on Electricity" {...register("title")} />
              </FormField>
              <FormField label="Subject" error={errors.subject?.message}>
                <Input placeholder="Science" {...register("subject")} />
              </FormField>
              <FormField label="Class / Grade" error={errors.grade?.message}>
                <Input placeholder="Grade 8" {...register("grade")} />
              </FormField>
              <FormField label="Due date" error={errors.dueDate?.message}>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <Input type="date" {...register("dueDate")} />
                </div>
              </FormField>
            </div>

            <Controller
              control={control}
              name="fileName"
              render={({ field }) => (
                <div className="mt-5">
                  <FormField label="Reference file" hint="Optional PDF or TXT document for chapter context.">
                    <div className="relative rounded-3xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center dark:border-white/15 dark:bg-white/6">
                      <input
                        type="file"
                        accept=".pdf,.txt"
                        className="absolute inset-0 cursor-pointer opacity-0"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) {
                            setUploadedFile(file);
                            field.onChange(file.name);
                          } else {
                            setUploadedFile(null);
                            field.onChange("");
                          }
                        }}
                      />
                      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white text-ink shadow-sm dark:bg-[#2d2d2d] dark:text-white">
                        <FileUp className="h-5 w-5" />
                      </div>
                      <p className="mt-3 text-sm font-semibold">
                        {fileName ? fileName : "Choose a file or drag and drop it here"}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-300">PDF, TXT up to 10MB</p>
                      {fileName ? (
                        <button
                          type="button"
                          className="relative z-10 mt-3 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-neutral-600 shadow-sm dark:bg-white/10 dark:text-neutral-200"
                          onClick={() => {
                            setValue("fileName", "");
                            setUploadedFile(null);
                          }}
                        >
                          <X className="h-3 w-3" />
                          Remove
                        </button>
                      ) : null}
                    </div>
                  </FormField>
                </div>
              )}
            />
          </section>

          <section className="rounded-3xl bg-white p-5 shadow-sm dark:bg-[#232323] sm:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-bold">Question Type</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-300">Add sections, question counts, and marks.</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  append({
                    id: crypto.randomUUID(),
                    type: "MCQ",
                    count: 4,
                    marks: 1
                  })
                }
              >
                <Plus className="h-4 w-4" />
                Add Type
              </Button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div
                  key={field.fieldId}
                  className="rounded-2xl border border-line-soft bg-neutral-50 p-4 dark:border-white/10 dark:bg-white/6"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <select
                      className={cn(inputClassName, "h-11 max-w-xs rounded-xl bg-white dark:bg-[#2b2b2b]")}
                      {...register(`questionConfigs.${index}.type`)}
                    >
                      {questionTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      title="Remove question type"
                      aria-label="Remove question type"
                      disabled={fields.length === 1}
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
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
          </section>

          <section className="rounded-3xl bg-white p-5 shadow-sm dark:bg-[#232323] sm:p-6">
            <div className="mb-5">
              <h3 className="text-lg font-bold">Difficulty Distribution</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-300">Tune the balance. The total must be 100%.</p>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              {difficultyPresets.map((preset) => (
                <Button
                  key={preset.label}
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setValue("difficultyDistribution", preset.value, { shouldValidate: true })}
                >
                  {preset.label}
                </Button>
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
                      className="h-10 rounded-xl text-center"
                      {...register(`difficultyDistribution.${level}`, { valueAsNumber: true })}
                    />
                  </div>
                </FormField>
              ))}
            </div>

            <div className="mt-5 rounded-2xl bg-neutral-50 p-4 text-sm font-semibold dark:bg-white/6">
              <div className="flex items-center justify-between">
                <span>Total distribution</span>
                <span className={difficultyTotal === 100 ? "text-success" : "text-danger"}>{difficultyTotal}%</span>
              </div>
              {errors.difficultyDistribution?.message ? (
                <p className="mt-2 text-xs text-danger">{errors.difficultyDistribution.message}</p>
              ) : null}
            </div>
          </section>

          <section className="rounded-3xl bg-white p-5 shadow-sm dark:bg-[#232323] sm:p-6">
            <FormField label="Additional instructions" error={errors.instructions?.message}>
              <Textarea
                placeholder="Mention NCERT chapter focus, exclusions, answer style, or rubric preferences."
                {...register("instructions")}
              />
            </FormField>
          </section>
        </div>

        <aside className="xl:sticky xl:top-28 xl:h-fit">
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

function Stepper({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="flex h-12 items-center justify-between rounded-2xl border border-line-soft bg-white px-2 dark:border-white/10 dark:bg-[#2b2b2b]">
      <button
        type="button"
        className="grid h-8 w-8 place-items-center rounded-full bg-neutral-100 text-neutral-700 transition hover:bg-neutral-200 dark:bg-white/10 dark:text-white"
        onClick={() => onChange(Math.max(1, value - 1))}
        aria-label="Decrease"
      >
        <Minus className="h-4 w-4" />
      </button>
      <input
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        type="number"
        min="1"
        className="h-full w-16 bg-transparent text-center text-sm font-bold outline-none"
      />
      <button
        type="button"
        className="grid h-8 w-8 place-items-center rounded-full bg-neutral-100 text-neutral-700 transition hover:bg-neutral-200 dark:bg-white/10 dark:text-white"
        onClick={() => onChange(value + 1)}
        aria-label="Increase"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white/8 p-4 dark:bg-ink/5">
      <p className="text-xs font-semibold opacity-60">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}
