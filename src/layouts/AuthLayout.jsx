import { Outlet } from 'react-router-dom'

/**
 * Split-screen shell used by Login, Sign Up, Forgot Password
 * (matches the Stitch prompts' "split-screen layout" spec).
 */
export default function AuthLayout() {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="hidden items-center justify-center bg-primary-50 p-10 lg:flex">
        {/* Replace with the illustration from Stitch */}
        <div className="max-w-sm text-center">
          <h2 className="text-2xl font-bold text-primary-700">
            AI-powered social media, managed for you.
          </h2>
          <p className="mt-2 text-sm text-primary-700/80">
            Connect your accounts and let AI + our team handle the rest.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
