import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <AppShell title={title}>
      <div className="grid min-h-[60vh] place-items-center rounded-3xl bg-white p-8 text-center shadow-sm dark:bg-[#232323]">
        <div>
          <h2 className="text-2xl font-black">{title}</h2>
          <p className="mt-2 max-w-sm text-sm text-neutral-500 dark:text-neutral-300">
            Continue from the assignment dashboard while this workspace area is prepared.
          </p>
          <Link href="/" className="mt-5 inline-flex">
            <Button>Back to Assignments</Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

