import { Outlet } from 'react-router-dom'

/**
 * Centered, minimal-nav shell for Choose a Plan, Payment, Payment Verification
 * — intentionally lighter than DashboardLayout (per Phase 1 prompt notes).
 */
export default function OnboardingLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="flex h-16 items-center justify-center border-b border-border bg-surface">
        <span className="text-lg font-bold text-ink">AI Social Manager</span>
      </header>
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-3xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
