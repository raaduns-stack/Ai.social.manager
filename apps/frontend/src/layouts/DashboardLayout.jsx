import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import Navbar from '../components/layout/Navbar'

/**
 * Customer dashboard layout wrapping all /dashboard/* pages.
 * Supports independent scrolling for the sidebar/content pane,
 * and a mobile menu drawer.
 */
export default function DashboardLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#fbf9f8] text-[#1b1c1c] font-sans">
      {/* Desktop Sidebar (Left Panel, Independent scroll) */}
      <Sidebar className="hidden md:flex h-screen shrink-0 border-r border-gray-200 bg-white" />

      {/* Mobile Sidebar Slide-out Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-black/45 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer container */}
          <Sidebar 
            className="relative flex w-64 flex-col bg-white h-full shadow-2xl transition-transform duration-300 ease-out z-10" 
            onClose={() => setMobileMenuOpen(false)}
          />
        </div>
      )}

      {/* Main Content Area (Right Panel, Independent scroll) */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Navbar onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#fbf9f8]">
          <div className="max-w-[1600px] mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
