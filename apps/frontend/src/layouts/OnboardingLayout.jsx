import { Outlet, Link } from 'react-router-dom'

/**
 * Centered, minimal-nav shell for Onboarding pages (Verify Email, Welcome, Business Setup, Pricing)
 */
export default function OnboardingLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-[#111111]">
      <header className="flex h-16 items-center justify-between px-6 border-b border-gray-200 bg-white">
        <Link className="text-xl font-extrabold text-[#111111] tracking-tight font-['Plus_Jakarta_Sans'] hover:opacity-90 transition-opacity" to="/">
          Raasocial
        </Link>
        <span className="text-xs font-semibold text-[#666666] uppercase tracking-wider font-mono">Onboarding Setup</span>
      </header>
      <main className="flex flex-1 items-center justify-center p-6 md:p-12 relative overflow-hidden bg-white">
        <div className="w-full max-w-4xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
