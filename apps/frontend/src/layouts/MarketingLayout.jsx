import React from 'react'
import { Outlet } from 'react-router-dom'
import MarketingNavbar from '../components/marketing/MarketingNavbar'
import MarketingFooter from '../components/marketing/MarketingFooter'

export default function MarketingLayout() {
  return (
    <div className="bg-white text-[#111111] font-sans antialiased overflow-x-hidden selection:bg-[#FFEBE0] selection:text-[#FF6600] min-h-screen flex flex-col">
      {/* Shared Header/Navbar */}
      <MarketingNavbar />

      {/* Main Page Content */}
      <main className="flex-1 pt-20">
        <Outlet />
      </main>

      {/* Shared Footer */}
      <MarketingFooter />
    </div>
  )
}
