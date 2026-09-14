/**
 * Usage: <PageHeader title="Content Calendar" description="Plan and track every post." action={<Button>New Post</Button>} />
 */
export default function PageHeader({ title, description, action, variant, eyebrow }) {
  const isPremium = variant === "premium";
  if (isPremium) {
    return (
      <div className="mb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && <p className="dp-mono text-primary mb-1.5">{eyebrow}</p>}
          <h1 className="dp-display text-[26px] sm:text-[28px] leading-none tracking-tight text-ink">{title}</h1>
          {description && <p className="mt-2 text-[14px] leading-6 text-ink-muted max-w-2xl">{description}</p>}
        </div>
        {action && <div className="w-full lg:w-auto flex justify-start lg:justify-end shrink-0">{action}</div>}
      </div>
    );
  }
  return (
    <div className="mb-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold text-ink">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
      </div>
      {action && <div className="w-full md:w-auto flex justify-start md:justify-end shrink-0">{action}</div>}
    </div>
  )
}
