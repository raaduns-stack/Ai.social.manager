import React from 'react'
import { Link } from 'react-router-dom'

export default function MarketingFooter() {
  return (
    <footer className="bg-[#111111] text-white border-t border-[#333333] py-16 px-6 relative z-10 select-none">
      <div className="max-w-7xl mx-auto">

        {/* Brand + Link sections on the same row */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-10 mb-10">

          {/* Brand Intro */}
          <div className="space-y-4">
            <Link to="/" className="text-2xl font-extrabold tracking-tight font-['Plus_Jakarta_Sans']">
              RaaSocial<span className="text-[#FF6600]">.</span>
            </Link>
            <p className="text-sm text-[#999999] max-w-sm leading-relaxed">
              Social media management, made simpler. Empowering businesses to schedule, automate, and scale their digital footprint with Kleos.
            </p>
          </div>

          {/* Link Sections — 3 columns side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">

          {/* Product */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#FF6600]">Product</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/features" className="text-[#999999] hover:text-white transition-colors">Features</Link>
              </li>
              <li>
                <Link to="/pricing" className="text-[#999999] hover:text-white transition-colors">Pricing</Link>
              </li>
              <li>
                <Link to="/signup" className="text-[#999999] hover:text-white transition-colors">Get Started</Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="text-[#999999] hover:text-white transition-colors">Terms of Service</Link>
              </li>
            </ul>
          </div>

          {/* Career */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#FF6600]">Career</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/designer/register" className="text-[#999999] hover:text-white transition-colors">Designer Portal</Link>
              </li>
              <li>
                <Link to="/contact" className="text-[#999999] hover:text-white transition-colors">Contact</Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="text-[#999999] hover:text-white transition-colors">Privacy Policy</Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#FF6600]">Connect</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="https://www.linkedin.com/company/raaduns-software-solutions" target="_blank" rel="noopener noreferrer" className="text-[#999999] hover:text-white transition-colors">LinkedIn</a>
              </li>
              <li>
                <a href="https://www.facebook.com/raadunssoftware" target="_blank" rel="noopener noreferrer" className="text-[#999999] hover:text-white transition-colors">Facebook</a>
              </li>
              <li>
                <a href="https://www.instagram.com/raadunssolutions/" target="_blank" rel="noopener noreferrer" className="text-[#999999] hover:text-white transition-colors">Instagram</a>
              </li>
            </ul>
          </div>

          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-[#333333] flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#666666]">
          <p>&copy; {new Date().getFullYear()} RaaSocial. All rights reserved.</p>
          <span className="cursor-default">Powered by Kleos</span>
        </div>

      </div>
    </footer>
  )
}