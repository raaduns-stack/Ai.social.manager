import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, Edit3, CheckCircle2 } from 'lucide-react'
import Button from '../components/ui/Button'
import heroMockup from '../assets/hero-dashboard-mockup.PNG'

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    // Dynamically append the Google Fonts and Material Symbols font style sheets
    const fontLink = document.createElement('link')
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Plus+Jakarta+Sans:wght@700;800&display=swap'
    fontLink.rel = 'stylesheet'
    document.head.appendChild(fontLink)

    // Scroll reveal intersection observer to match visual animations
    const observerOptions = { threshold: 0.1 }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100', 'translate-y-0')
          entry.target.classList.remove('opacity-0', 'translate-y-10')
        }
      })
    }, observerOptions)

    const sections = document.querySelectorAll('section, header')
    sections.forEach((section) => {
      section.classList.add('transition-all', 'duration-700', 'ease-out')
      if (!section.classList.contains('opacity-100') && section.tagName !== 'HEADER') {
        section.classList.add('opacity-0', 'translate-y-10')
      }
      observer.observe(section)
    })

    return () => {
      document.head.removeChild(fontLink)
      sections.forEach((section) => observer.unobserve(section))
    }
  }, [])

  return (
    <div className="bg-white text-[#111111] font-sans antialiased overflow-x-hidden selection:bg-[#FFEBE0] selection:text-[#FF6600] min-h-screen">
      {/* TopNavBar */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 md:px-16 py-4 w-full">
          <div className="flex items-center gap-12">
            <Link className="text-2xl font-extrabold text-[#111111] tracking-tight font-['Plus_Jakarta_Sans'] hover:opacity-90 transition-opacity" to="/">
              Raasocial
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <a className="text-[#666666] font-semibold hover:text-[#111111] transition-colors duration-200" href="#how-it-works">Product</a>
              <a className="text-[#666666] font-semibold hover:text-[#111111] transition-colors duration-200" href="#how-it-works">Features</a>
              <Link className="text-[#666666] font-semibold hover:text-[#111111] transition-colors duration-200" to="/pricing">Pricing</Link>
              <Link className="text-[#666666] font-semibold hover:text-[#111111] transition-colors duration-200" to="/contact">Contact</Link>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <Link className="text-[#666666] font-semibold hover:text-[#111111] transition-colors duration-200" to="/login">Log in</Link>
            <Button
              as={Link}
              to="/signup"
              variant="primary"
              className="font-semibold text-white px-6 hover:opacity-95 transition-opacity"
            >
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-[#111111] focus:outline-none p-1"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation Drawer Overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white px-6 py-6 space-y-4 shadow-lg absolute top-full left-0 w-full z-50">
            <a
              className="block text-[#666666] font-semibold hover:text-[#111111] py-2"
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
            >
              Product
            </a>
            <a
              className="block text-[#666666] font-semibold hover:text-[#111111] py-2"
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </a>
            <Link
              className="block text-[#666666] font-semibold hover:text-[#111111] py-2"
              to="/pricing"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link
              className="block text-[#666666] font-semibold hover:text-[#111111] py-2"
              to="/contact"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>
            <hr className="border-gray-200" />
            <div className="flex flex-col gap-3 pt-2">
              <Link
                className="text-center text-[#666666] font-semibold hover:text-[#111111] py-2.5 border border-gray-300 rounded-control transition-colors"
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
              >
                Log in
              </Link>
              <Button
                as={Link}
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                variant="primary"
                className="w-full py-2.5 rounded-control text-center justify-center font-semibold text-white"
              >
                Get Started
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <header className="pt-[140px] md:pt-[180px] pb-24 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        <h1 className="text-5xl md:text-7xl lg:text-[72px] font-extrabold text-[#111111] max-w-[900px] mb-6 leading-[1.1] md:leading-[1.1] font-['Plus_Jakarta_Sans'] tracking-tight">
          Your social media on <br />
          autopilot. <br />
          <span className="text-[#FF6600]">Powered by Kleos.</span>
        </h1>
        <p className="text-base md:text-lg text-[#666666] max-w-[700px] mb-8 leading-relaxed">
          Stop guessing what to post. Raasocial handles content creation, intelligent scheduling, and audience growth with precision. Designed for professionals who demand results.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Button
            as={Link}
            to="/signup"
            variant="primary"
            size="lg"
            className="px-8 font-semibold text-white shadow-lg shadow-orange-500/10 hover:opacity-95 transition-all duration-200 w-full sm:w-auto"
          >
            Get Started Free
          </Button>
          <Button
            as="a"
            href="#how-it-works"
            variant="outline"
            size="lg"
            className="px-8 font-semibold text-[#111111] border-gray-300 hover:bg-gray-50 transition-colors w-full sm:w-auto"
          >
            See How It Works
          </Button>
        </div>

        {/* Dashboard Mockup Frame */}
        <div className="mt-16 w-full max-w-[1000px] rounded-xl border border-gray-200 bg-white shadow-hover overflow-hidden relative">
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
            <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
            <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
          </div>
          <img
            className="w-full h-auto object-cover border-b border-gray-200"
            alt="UI mockup of a social media management dashboard calendar view"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuB0oz9DtPcboOVlrl9iYDN05dWnD302y7RqmGqUrLm-NISxNeDr7aoq41KI2hYgu94SBhXxoheafBEXqdgBhqP0pAMdDA50MdgvXf5YnSmgAVqIoACwI4IhiJvwZWb7lPnFdoomvQbiMmuBfKVzLM-_rLefHHh_lRbmvDoN7VX9vZlCH9kNweW74lSSRlYMUT-TPa2j3gKYIBj8-esLSuWjUyr2JnHRF4Am_9CNQDO9DmcdT_kNrIFxLA"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = heroMockup;
            }}
          />
        </div>
      </header>

      {/* Logo Marquee / Social Platform Connections */}
      <section className="py-8 border-y border-gray-200 bg-gray-50 overflow-hidden relative">
        <div className="flex w-[200%] animate-marquee">
          {/* First Set */}
          <div className="flex-1 flex justify-around items-center opacity-60 grayscale hover:grayscale-0 transition-all duration-300">
            <span className="text-xl md:text-2xl font-extrabold text-[#666666]">Instagram</span>
            <span className="text-xl md:text-2xl font-extrabold text-[#666666]">Facebook</span>
            <span className="text-xl md:text-2xl font-extrabold text-[#666666]">LinkedIn</span>
            <span className="text-xl md:text-2xl font-extrabold text-[#666666]">X / Twitter</span>
            <span className="text-xl md:text-2xl font-extrabold text-[#666666]">TikTok</span>
            <span className="text-xl md:text-2xl font-extrabold text-[#666666]">YouTube</span>
          </div>
          {/* Duplicate for seamless loop */}
          <div className="flex-1 flex justify-around items-center opacity-60 grayscale hover:grayscale-0 transition-all duration-300">
            <span className="text-xl md:text-2xl font-extrabold text-[#666666]">Instagram</span>
            <span className="text-xl md:text-2xl font-extrabold text-[#666666]">Facebook</span>
            <span className="text-xl md:text-2xl font-extrabold text-[#666666]">LinkedIn</span>
            <span className="text-xl md:text-2xl font-extrabold text-[#666666]">X / Twitter</span>
            <span className="text-xl md:text-2xl font-extrabold text-[#666666]">TikTok</span>
            <span className="text-xl md:text-2xl font-extrabold text-[#666666]">YouTube</span>
          </div>
        </div>
      </section>

      {/* The Problem (High Contrast) */}
      <section className="py-24 px-6 bg-[#111111] text-white">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold font-['Plus_Jakarta_Sans'] mb-6 max-w-[800px] mx-auto text-white leading-tight tracking-tight">
            Running a business is a full-time job. <br className="hidden sm:block"/>
            <span className="text-[#999999]">Social media shouldn't be.</span>
          </h2>
          <p className="text-base md:text-lg text-[#999999] max-w-[600px] mx-auto leading-relaxed">
            Manual scheduling, blank-page syndrome, and inconsistent posting hurt your growth. You need a system that works as hard as you do.
          </p>
        </div>
      </section>

      {/* The Kleos Workflow (How Kleos Works) */}
      <section className="py-24 px-6 bg-white" id="how-it-works">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 text-center md:text-left">
            <h2 className="text-3xl md:text-5xl font-bold font-['Plus_Jakarta_Sans'] text-[#111111] mb-4 tracking-tight">The Kleos Workflow</h2>
            <p className="text-base md:text-lg text-[#666666] max-w-[600px] leading-relaxed">
              A sophisticated, AI-driven workflow designed to transform your brand's digital presence from manual labor to automated excellence.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Step 01 */}
            <div className="flex flex-col gap-6 p-8 border border-gray-200 rounded-xl hover:shadow-hover transition-all bg-white">
              <div className="flex justify-between items-start">
                <div className="text-5xl font-extrabold text-[#FF6600] opacity-20">01</div>
                <div className="bg-gray-50 px-4 py-2.5 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#FF6600] animate-pulse"></div>
                    <span className="text-xs font-semibold text-[#666666]">Brand Voice Engine</span>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="h-1 w-12 bg-[#FF6600] rounded-full"></div>
                    <div className="h-1 w-8 bg-gray-200 rounded-full"></div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold font-['Plus_Jakarta_Sans'] text-[#111111] mb-2 tracking-tight">Define Your Identity</h3>
                <p className="text-sm md:text-base text-[#666666] leading-relaxed">
                  Our AI analyzes your business parameters to mirror your unique brand voice. Set guidelines for tone, target audience, and style to ensure every post feels authentic and intentional.
                </p>
              </div>
            </div>

            {/* Step 02 */}
            <div className="flex flex-col gap-6 p-8 border border-gray-200 rounded-xl hover:shadow-hover transition-all bg-white md:mt-8">
              <div className="flex justify-between items-start">
                <div className="text-5xl font-extrabold text-[#FF6600] opacity-20">02</div>
                <div className="bg-gray-50 px-4 py-3 rounded-lg border border-gray-200 flex items-center gap-2">
                  <Edit3 size={16} className="text-[#FF6600]" />
                  <span className="text-xs font-semibold text-[#666666]">Drafting...</span>
                </div>
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold font-['Plus_Jakarta_Sans'] text-[#111111] mb-2 tracking-tight">Intelligent Generation</h3>
                <p className="text-sm md:text-base text-[#666666] leading-relaxed">
                  Kleos generates high-performance captions and handles copywriting aligned to trending topics in your industry. No more blank pages—just a continuous stream of tailored drafts.
                </p>
              </div>
            </div>

            {/* Step 03 */}
            <div className="flex flex-col gap-6 p-8 border border-gray-200 rounded-xl hover:shadow-hover transition-all bg-white">
              <div className="flex justify-between items-start">
                <div className="text-5xl font-extrabold text-[#FF6600] opacity-20">03</div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-3 gap-1">
                    <div className="w-3 h-3 bg-[#FF6600] rounded-sm"></div>
                    <div className="w-3 h-3 bg-gray-200 rounded-sm"></div>
                    <div className="w-3 h-3 bg-gray-200 rounded-sm"></div>
                    <div className="w-3 h-3 bg-gray-200 rounded-sm"></div>
                    <div className="w-3 h-3 bg-[#FF6600] rounded-sm"></div>
                    <div className="w-3 h-3 bg-gray-200 rounded-sm"></div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold font-['Plus_Jakarta_Sans'] text-[#111111] mb-2 tracking-tight">Strategic Scheduling</h3>
                <p className="text-sm md:text-base text-[#666666] leading-relaxed">
                  Our algorithm schedules content at optimal engagement periods. Review, customize, and approve your entire calendar layout in a beautiful, unified workspace before it goes live.
                </p>
              </div>
            </div>

            {/* Step 04 */}
            <div className="flex flex-col gap-6 p-8 border border-gray-200 rounded-xl hover:shadow-hover transition-all bg-white md:mt-8">
              <div className="flex justify-between items-start">
                <div className="text-5xl font-extrabold text-[#FF6600] opacity-20">04</div>
                <div className="bg-gray-50 px-4 py-3 rounded-lg border border-gray-200 flex items-center gap-2 text-[#FF6600]">
                  <CheckCircle2 size={16} />
                  <span className="text-xs font-semibold text-[#666666]">Live</span>
                </div>
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold font-['Plus_Jakarta_Sans'] text-[#111111] mb-2 tracking-tight">Autonomous Growth</h3>
                <p className="text-sm md:text-base text-[#666666] leading-relaxed">
                  Once approved, Kleos publishes updates across all platforms automatically. It learns from audience interactions, refining its content suggestions to keep your accounts growing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 px-6 bg-[#111111] text-white border-t border-[#333333]">
        <div className="max-w-7xl mx-auto text-center flex flex-col items-center">
          <h2 className="text-3xl md:text-5xl font-bold font-['Plus_Jakarta_Sans'] mb-6 max-w-[600px] text-white leading-tight tracking-tight">
            Ready to make social media easier?
          </h2>
          <p className="text-base md:text-lg text-[#999999] max-w-[500px] mb-8 leading-relaxed">
            Join thousands of professionals scaling their presence with Kleos.
          </p>
          <Button
            as={Link}
            to="/signup"
            variant="primary"
            size="lg"
            className="px-8 font-semibold text-white shadow-lg shadow-orange-500/10 hover:opacity-95 transition-all duration-200 w-full sm:w-auto"
          >
            Get Started Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#111111] text-white border-t border-[#333333] w-full py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-2xl font-extrabold text-white tracking-tight font-['Plus_Jakarta_Sans']">Raasocial</div>
          <div className="flex flex-wrap justify-center gap-6">
            <a className="text-[#999999] font-semibold hover:text-white transition-colors" href="#">Privacy Policy</a>
            <a className="text-[#999999] font-semibold hover:text-white transition-colors" href="#">Terms of Service</a>
            <a className="text-[#999999] font-semibold hover:text-white transition-colors" href="#">Security</a>
            <a className="text-[#999999] font-semibold hover:text-white transition-colors" href="#">Status</a>
            <a className="text-[#999999] font-semibold hover:text-white transition-colors" href="#">Twitter</a>
            <a className="text-[#999999] font-semibold hover:text-white transition-colors" href="#">LinkedIn</a>
          </div>
          <div className="text-[#999999] font-semibold text-sm text-center md:text-right">
            © {new Date().getFullYear()} Raasocial AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
