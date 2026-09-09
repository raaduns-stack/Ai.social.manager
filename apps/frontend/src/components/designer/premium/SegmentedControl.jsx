export default function SegmentedControl({ options, value, onChange, size = "md" }) {
  return (
    <div className="dp-segment">
      {options.map((opt) => {
        const val = typeof opt === "string" ? opt : opt.value;
        const label = typeof opt === "string" ? opt : opt.label;
        const active = value === val;
        return (
          <button
            key={val}
            data-active={active}
            onClick={() => onChange(val)}
            className={size === "sm" ? "!text-xs !px-3 !py-1.5" : ""}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
