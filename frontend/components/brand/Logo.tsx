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
      <svg
        viewBox="0 0 100 100"
        className="h-9 w-9 shrink-0 shadow-sm rounded-[10px]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Background Gradient */}
          <linearGradient id="logo-bg-grad" x1="0" y1="0" x2="0.2" y2="1">
            <stop offset="0%" stopColor="#EA7F29" />
            <stop offset="30%" stopColor="#DE6C23" />
            <stop offset="70%" stopColor="#BE3519" />
            <stop offset="100%" stopColor="#6E1311" />
          </linearGradient>

          {/* Left Leg Gradient (runs diagonally along the left leg to crease) */}
          <linearGradient id="left-leg-grad" x1="28" y1="27" x2="43" y2="62" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="55%" stopColor="#EDEDED" />
            <stop offset="80%" stopColor="#C8C8C8" />
            <stop offset="100%" stopColor="#969696" />
          </linearGradient>
          
          {/* Drop shadow for the folded ribbon effect */}
          <filter id="crease-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="-1.2" dy="1.0" stdDeviation="1.0" floodColor="#3F0A0A" floodOpacity="0.45" />
          </filter>
        </defs>

        {/* Main Rounded Box */}
        <rect width="100" height="100" rx="26" fill="url(#logo-bg-grad)" />

        {/* Inner subtle glow ring */}
        <rect x="1" y="1" width="98" height="98" rx="25" stroke="#FFFFFF" strokeOpacity="0.12" strokeWidth="1.2" />

        {/* Left Leg (Folded Under / Gradient side) */}
        <path
          d="M 23 30 Q 23 27, 26 27 L 37 27 Q 40 27, 40 30 L 50 52 L 36 73 Z"
          fill="url(#left-leg-grad)"
        />

        {/* Right Leg + Bottom Curve (Folded Over / Solid White side) */}
        <path
          d="M 50 52 L 36 73 C 37.4 78, 41 81, 46 81 L 54 81 C 59 81, 62.6 78, 64 73 L 77 30 Q 77 27, 74 27 L 63 27 Q 60 27, 60 30 Z"
          fill="#FFFFFF"
          filter="url(#crease-shadow)"
        />
      </svg>
      {!compact ? (
        <span className={cn("text-lg font-bold tracking-tight text-ink dark:text-white", labelClassName)}>VedaAI</span>
      ) : null}
    </div>
  );
}

