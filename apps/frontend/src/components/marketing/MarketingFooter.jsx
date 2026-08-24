import React from 'react'
import { Link } from 'react-router-dom'

export default function MarketingFooter() {
  return (
    <footer className="bg-[#111111] text-white border-t border-[#333333] py-16 px-6 relative z-10 select-none">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
        {/* Company Intro column */}
        <div className="md:col-span-5 space-y-4">
          <Link to="/" className="text-2xl font-extrabold tracking-tight font-['Plus_Jakarta_Sans']">
            RaaSocial<span className="text-[#FF6600]">.</span>
          </Link>
          <p className="text-sm text-[#999999] max-w-sm leading-relaxed">
            Social media management, made simpler. Empowering businesses to schedule, automate, and scale their digital footprint with Kleos.
          </p>
        </div>

        {/* Product links */}
        <div className="md:col-span-2 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#FF6600]">Product</h4>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link to="/features" className="text-[#999999] hover:text-white transition-colors">
                Features
              </Link>
            </li>
            <li>
              <Link to="/pricing" className="text-[#999999] hover:text-white transition-colors">
                Pricing
              </Link>
            </li>
            <li>
              <Link to="/signup" className="text-[#999999] hover:text-white transition-colors">
                Get Started
              </Link>
            </li>
          </ul>
        </div>

        {/* Company links */}
        <div className="md:col-span-2 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#FF6600]">Company</h4>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link to="/contact" className="text-[#999999] hover:text-white transition-colors">
                Contact
              </Link>
            </li>
          </ul>
        </div>

        {/* Social links */}
        <div className="md:col-span-3 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#FF6600]">Social</h4>
          <ul className="space-y-2.5 text-sm">
            <li>
              <a 
                href="https://www.linkedin.com/company/raaduns-software-solutions" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-[#999999] hover:text-white transition-colors"
              >
                LinkedIn
              </a>
            </li>
            <li>
              <a 
                href="https://www.facebook.com/raadunssoftware" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-[#999999] hover:text-white transition-colors"
              >
                Facebook
              </a>
            </li>
            <li>
              <a 
                href="https://www.instagram.com/raadunssolutions/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-[#999999] hover:text-white transition-colors"
              >
                Instagram
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom info */}
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-[#333333] flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#666666]">
        <p>&copy; {new Date().getFullYear()} RaaSocial. All rights reserved.</p>
        <div className="flex gap-6">
          <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link to="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link>
          <span className="cursor-default">Powered by Kleos</span>
        </div>
      </div>
    </footer>
  )
}
