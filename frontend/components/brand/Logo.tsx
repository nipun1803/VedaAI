import { cn } from "@/utils/cn";

export function Logo({
  compact = false,
  className,
  labelClassName
}: {
  compact?: boolean;
  className?: string;
  labelClassName?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-ember via-saffron to-coal shadow-glow">
        <span className="text-base font-black text-white">V</span>
        <span className="absolute inset-[6px] rounded-md border border-white/30" />
      </div>
      {!compact ? (
        <span className={cn("text-lg font-bold text-ink dark:text-white", labelClassName)}>VedaAI</span>
      ) : null}
    </div>
  );
}
