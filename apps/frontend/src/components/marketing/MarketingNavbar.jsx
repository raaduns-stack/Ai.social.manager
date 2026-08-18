import React, { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Button from '../ui/Button'
import LogoImage from '../../assets/logo.jpg'

export default function MarketingNavbar() {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => setIsOpen(!isOpen)
  const closeMenu = () => setIsOpen(false)

  const linkClass = ({ isActive }) =>
    `text-sm font-semibold tracking-wide font-sans transition-colors duration-200 ${
      isActive ? 'text-[#FF6600]' : 'text-[#666666] hover:text-[#111111]'
    }`

  const mobileLinkClass = ({ isActive }) =>
    `block px-4 py-3 text-base font-semibold tracking-wide font-sans border-b border-gray-100 transition-colors ${
      isActive ? 'text-[#FF6600] bg-gray-50' : 'text-[#666666] hover:text-[#111111] hover:bg-gray-50'
    }`

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 select-none">
      <div className="max-w-7xl mx-auto flex justify-between items-center h-20 px-6 md:px-8 w-full">
        {/* Brand Logo */}
        <Link 
          to="/" 
          onClick={closeMenu}
          className="hover:opacity-95 transition-opacity flex items-center"
        >
          <img
            alt="RaaSocial Logo"
            className="h-10 object-contain w-auto max-w-[180px]"
            src={LogoImage}
          />
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          <NavLink to="/features" className={linkClass}>
            Features
          </NavLink>
          <NavLink to="/pricing" className={linkClass}>
            Pricing
          </NavLink>
          <NavLink to="/contact" className={linkClass}>
            Contact
          </NavLink>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-5">
          <Link 
            to="/login" 
            className="text-sm font-semibold text-[#666666] hover:text-[#111111] transition-colors duration-200"
          >
            Login
          </Link>
          <Button
            as={Link}
            to="/signup"
            variant="primary"
            size="md"
            className="font-bold text-white px-5 hover:bg-primary-700 transition-colors"
          >
            Get Started
          </Button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={toggleMenu}
          className="md:hidden text-[#111111] hover:text-[#FF6600] p-1.5 focus:outline-none transition-colors"
          aria-label="Toggle Navigation Menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 top-20 bg-black/20 backdrop-blur-sm z-40 md:hidden"
            onClick={closeMenu}
          />
          {/* Drawer Menu */}
          <div className="absolute top-full left-0 w-full bg-white border-t border-gray-100 shadow-lg z-50 py-4 px-6 md:hidden flex flex-col gap-4 animate-in slide-in-from-top duration-200">
            <div className="flex flex-col">
              <NavLink to="/features" className={mobileLinkClass} onClick={closeMenu}>
                Features
              </NavLink>
              <NavLink to="/pricing" className={mobileLinkClass} onClick={closeMenu}>
                Pricing
              </NavLink>
              <NavLink to="/contact" className={mobileLinkClass} onClick={closeMenu}>
                Contact
              </NavLink>
            </div>
            
            <div className="flex flex-col gap-3 pt-2">
              <Link
                to="/login"
                onClick={closeMenu}
                className="w-full py-3 text-center font-semibold text-[#666666] border border-gray-200 rounded-control hover:bg-gray-50 transition-colors"
              >
                Login
              </Link>
              <Button
                as={Link}
                to="/signup"
                onClick={closeMenu}
                variant="primary"
                className="w-full py-3 font-bold text-white text-center justify-center rounded-control hover:bg-primary-700"
              >
                Start Free
              </Button>
            </div>
          </div>
        </>
      )}
    </nav>
  )
}
