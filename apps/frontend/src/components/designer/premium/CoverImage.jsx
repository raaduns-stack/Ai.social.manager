import { Image as ImageIcon } from "lucide-react";

const gradients = [
  "from-primary/20 via-primary-100 to-white",
  "from-ink/10 via-border to-white",
  "from-amber-100 via-primary-50 to-white",
  "from-emerald-50 via-teal-50 to-white",
];

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

export default function CoverImage({ src, alt, id = "", className = "", ratio = "16/10", children }) {
  const g = gradients[hash(id || alt || "x") % gradients.length];
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-border bg-white ${className}`}
      style={{ aspectRatio: ratio }}
    >
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <div className={`h-full w-full bg-gradient-to-br ${g} flex items-center justify-center`}>
          <span className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center text-ink-muted shadow-sm">
            <ImageIcon size={18} />
          </span>
        </div>
      )}
      {children && <div className="absolute inset-0">{children}</div>}
    </div>
  );
}
