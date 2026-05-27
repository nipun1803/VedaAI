import Link from "next/link";
import { FileQuestion, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function EmptyAssignments() {
  return (
    <section className="grid min-h-[62vh] place-items-center rounded-3xl bg-gradient-to-br from-white to-neutral-100 px-6 py-12 text-center shadow-sm dark:from-[#232323] dark:to-[#1d1d1d]">
      <div className="mx-auto max-w-md">
        <div className="relative mx-auto mb-8 h-40 w-40">
          <div className="absolute inset-0 rounded-full bg-white shadow-card dark:bg-white/10" />
          <div className="absolute left-7 top-6 h-24 w-20 rotate-[-6deg] rounded-2xl bg-neutral-100 shadow-sm dark:bg-white/10" />
          <div className="absolute left-14 top-9 h-24 w-20 rotate-[4deg] rounded-2xl bg-white shadow-card dark:bg-[#2d2d2d]">
            <div className="mx-4 mt-5 h-2 rounded bg-neutral-300 dark:bg-white/20" />
            <div className="mx-4 mt-3 h-2 rounded bg-neutral-200 dark:bg-white/10" />
            <div className="mx-4 mt-3 h-2 w-8 rounded bg-neutral-200 dark:bg-white/10" />
          </div>
          <div className="absolute bottom-9 right-4 grid h-16 w-16 place-items-center rounded-full border-[10px] border-purple-100 bg-white text-danger dark:border-purple-400/20 dark:bg-[#222]">
            <FileQuestion className="h-7 w-7" />
          </div>
          <Sparkles className="absolute bottom-10 left-8 h-4 w-4 text-sky-500" />
          <span className="absolute right-2 top-14 h-2.5 w-2.5 rounded-full bg-sky-500" />
        </div>
        <h2 className="text-xl font-bold">No assignments yet</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-500 dark:text-neutral-300">
          Create your first assignment to start collecting and grading student submissions.
          You can set rubrics, define marking criteria, and let VedaAI assist with grading.
        </p>
        <Link href="/create" className="mt-6 inline-block">
          <Button>
            <Plus className="h-4 w-4" />
            Create Your First Assignment
          </Button>
        </Link>
      </div>
    </section>
  );
}

