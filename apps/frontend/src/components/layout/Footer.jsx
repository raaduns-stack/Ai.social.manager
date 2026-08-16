/**
 * Minimal marketing footer — used on Landing, Pricing, Contact only.
 * Deliberately not a big multi-column footer (see Phase 1 design notes).
 */
export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="page-container flex flex-col items-center justify-between gap-3 py-6 text-sm text-ink-muted sm:flex-row">
        <p>AI Social Media Manager — automate your social presence.</p>
        <p>&copy; {new Date().getFullYear()} AI Social Media Manager. All rights reserved.</p>
      </div>
    </footer>
  )
}