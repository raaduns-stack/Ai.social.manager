/**
 * ConfigPanel.jsx
 * Generic key/value + toggle settings form. This is what makes AI
 * Configuration (OpenClaw, Ollama, n8n, etc.) and Settings pages FAST to
 * build — they're all "a list of fields in a card with a save button",
 * just with different field lists. Build the fields data, not new UI.
 *
 * Usage:
 *   <ConfigPanel
 *     title="OpenClaw Configuration"
 *     description="UI-only shell — not wired to a real backend."
 *     fields={[
 *       { key: "apiKey", label: "API Key", type: "text", value: "sk-***" },
 *       { key: "enabled", label: "Enabled", type: "toggle", value: true },
 *     ]}
 *     onSave={(values) => console.log(values)}
 *   />
 */
import { useState } from "react";

export default function ConfigPanel({ title, description, fields, onSave }) {
  const initial = Object.fromEntries(fields.map((f) => [f.key, f.value]));
  const [values, setValues] = useState(initial);

  const setField = (key, value) => setValues((v) => ({ ...v, [key]: value }));

  return (
    <div className="rounded-card border border-[#E5E7EB] bg-white p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-[#111827]">{title}</h3>
        {description && (
          <p className="mt-1 text-xs text-[#6B7280]">{description}</p>
        )}
      </div>

      <div className="space-y-4">
        {fields.map((field) => (
          <div key={field.key} className="flex items-center justify-between gap-4">
            <label className="text-sm text-[#111827]">{field.label}</label>

            {field.type === "toggle" ? (
              <button
                onClick={() => setField(field.key, !values[field.key])}
                className={`h-6 w-11 rounded-full transition-colors ${
                  values[field.key] ? "bg-[#4F46E5]" : "bg-[#E5E7EB]"
                }`}
              >
                <span
                  className={`block h-5 w-5 rounded-full bg-white transition-transform ${
                    values[field.key] ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
            ) : field.type === "select" ? (
              <select
                value={values[field.key]}
                onChange={(e) => setField(field.key, e.target.value)}
                className="rounded-lg border border-[#E5E7EB] px-3 py-1.5 text-sm"
              >
                {field.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type ?? "text"}
                value={values[field.key]}
                onChange={(e) => setField(field.key, e.target.value)}
                className="w-56 rounded-lg border border-[#E5E7EB] px-3 py-1.5 text-sm"
              />
            )}
          </div>
        ))}
      </div>

      <button
        onClick={() => onSave?.(values)}
        className="mt-5 rounded-lg bg-[#4F46E5] px-4 py-2 text-sm font-medium text-white"
      >
        Save Changes
      </button>
    </div>
  );
}
