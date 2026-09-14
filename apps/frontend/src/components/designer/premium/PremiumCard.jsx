import { cn } from "../../../utils/cn";

/**
 * Defaults live here as Tailwind classes (not in designer-premium.css) so
 * tailwind-merge lets per-card utilities win: bg-[#111111], border-[#222],
 * bg-gradient-*, border-dashed, shadow-premium etc. all override cleanly.
 * Unlayered CSS would beat utilities in the cascade and break overrides.
 */
export default function PremiumCard({ className, hover = false, children, ...props }) {
  return (
    <div
      className={cn(
        "bg-white border border-border rounded-card transition-all duration-200",
        hover && "hover:shadow-hover hover:-translate-y-[1px] cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
