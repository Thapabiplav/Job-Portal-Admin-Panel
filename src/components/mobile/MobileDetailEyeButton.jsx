import { Eye, EyeOff } from "lucide-react";

export function MobileDetailEyeButton({
  onClick,
  expanded = false,
  "aria-label": ariaLabel = "View full details",
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      aria-label={ariaLabel}
      className={`shrink-0 inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl border transition-ui ${
        expanded
          ? "border-accent/40 bg-accent/15 text-accent shadow-[0_0_0_1px_var(--color-accent-glow-strong,_rgba(249,115,22,0.25))]"
          : "border-white/15 bg-input text-accent hover:bg-hover hover:border-accent/30"
      }`}
    >
      {expanded ? (
        <EyeOff className="w-5 h-5" aria-hidden />
      ) : (
        <Eye className="w-5 h-5" aria-hidden />
      )}
    </button>
  );
}
