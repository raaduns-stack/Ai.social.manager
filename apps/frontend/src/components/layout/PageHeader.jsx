/**
 * Usage: <PageHeader title="Content Calendar" description="Plan and track every post." action={<Button>New Post</Button>} />
 */
export default function PageHeader({ title, description, action }) {
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
