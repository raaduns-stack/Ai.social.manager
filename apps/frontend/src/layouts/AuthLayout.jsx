import { Outlet } from 'react-router-dom'
import LogoImage from '../assets/logo.jpg'

/**
 * Split-screen shell used by Login, Sign Up, Forgot Password
 * (matches the Stitch prompts' "split-screen layout" spec).
 */
export default function AuthLayout() {
  return (
    <div className="bg-[#fbf9f8] text-[#1b1c1c] min-h-screen flex flex-col md:flex-row overflow-hidden font-sans text-body-md w-full">
      {/* Left Panel: Brand & Value Proposition */}
      <div className="hidden md:flex md:w-1/2 bg-[#1A1A1A] text-white flex-col justify-between p-16 relative">
        {/* Logo */}
        <div>
          <img
            alt="RaaSocial Logo"
            className="h-10 object-contain w-auto max-w-[180px] brightness-0 invert"
            src={LogoImage}
          />
        </div>
        {/* Messaging */}
        <div className="max-w-md">
          <h1 className="text-5xl font-extrabold tracking-tight mb-6 leading-tight text-white font-['Plus_Jakarta_Sans']">
            Meet Kleos.<br/>
            <span className="text-[#999999]">Your AI assistant for staying consistent on social.</span>
          </h1>
        </div>
        {/* Footer/Meta */}
        <div className="text-xs text-[#999999]">
          © {new Date().getFullYear()} Raasocial Inc. All rights reserved.
        </div>
      </div>

      {/* Right Panel: Form Content */}
      <div className="w-full md:w-1/2 bg-white flex items-center justify-center p-6 md:p-16 overflow-y-auto min-h-screen">
        <div className="w-full max-w-[400px]">
          {/* Mobile Logo (Hidden on Desktop) */}
          <div className="md:hidden mb-8 flex justify-center">
            <img
              alt="RaaSocial Logo"
              className="h-10 object-contain w-auto max-w-[180px]"
              src={LogoImage}
            />
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
