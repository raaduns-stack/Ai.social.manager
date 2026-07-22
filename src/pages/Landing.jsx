import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import heroMockup from '../assets/hero-dashboard-mockup.png'
import analytics from '../assets/analytics.png'
import teamPhoto from '../assets/team-collaboration.png'
export default function Landing() {
  useEffect(() => {
    // Dynamically append the Material Symbols font style sheet
    const link = document.createElement('link')
    link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block'
    link.rel = 'stylesheet'
    document.head.appendChild(link)

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

    const sections = document.querySelectorAll('section')
    sections.forEach((section) => {
      section.classList.add('transition-all', 'duration-700', 'ease-out')
      if (!section.classList.contains('opacity-100')) {
        section.classList.add('opacity-0', 'translate-y-10')
      }
      observer.observe(section)
    })

    return () => {
      document.head.removeChild(link)
      sections.forEach((section) => observer.unobserve(section))
    }
  }, [])

  return (
    <div className="bg-canvas text-ink min-h-screen selection:bg-primary-50 selection:text-primary-700">
      {/* Header / Navbar */}
      <header className="fixed top-0 w-full z-50 bg-canvas/80 backdrop-blur-md border-b border-border/30">
        <nav className="flex justify-between items-center h-16 px-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary">AI Social Manager</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a className="text-ink-muted hover:text-primary transition-colors text-sm font-medium" href="#features">Features</a>
            <Link className="text-ink-muted hover:text-primary transition-colors text-sm font-medium" to="/pricing">Pricing</Link>
            <Link className="text-ink-muted hover:text-primary transition-colors text-sm font-medium" to="/contact">Contact</Link>
          </div>
          <div className="flex items-center gap-4">
            <Button
              as={Link}
              to="/login"
              variant="ghost"
              className="text-ink-muted hover:text-primary font-medium text-sm px-3 py-1.5"
            >
              Log In
            </Button>
            <Button
              as={Link}
              to="/signup"
              variant="primary"
              size="sm"
              className="font-medium text-sm hover:opacity-90 transition-all duration-200"
            >
              Get Started
            </Button>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="pt-12">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-12 pb-12 px-6">
          <div className="max-w-7xl mx-auto text-center relative z-10">
            <Badge tone="primary" className="mb-6 bg-primary-50/50 text-accent border border-border/20 py-1 px-3">
              <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse mr-2"></span>
              Enterprise AI Video Generation
            </Badge>
            <h1 className="text-4xl md:text-[64px] md:leading-[1.1] font-bold text-ink max-w-4xl mx-auto mb-4 tracking-tight">
              Scale your social presence with AI-driven precision
            </h1>
            <p className="text-base md:text-lg text-ink-muted max-w-2xl mx-auto mb-8">
              Automate scheduling, generate premium content, and decode complex analytics with a unified platform built for professional marketing teams.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button
                as={Link}
                to="/signup"
                variant="primary"
                size="lg"
                className="flex items-center justify-center gap-2 shadow-lg shadow-primary/10 hover:-translate-y-0.5 transition-all duration-200"
              >
                Get Started
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Button>
              <Button
                as={Link}
                to="/pricing"
                variant="outline"
                size="lg"
                className="transition-all hover:bg-canvas"
              >
                View Plans
              </Button>
            </div>
          </div>

          {/* Hero Image */}
          <div className="mt-12 max-w-[1100px] mx-auto rounded-card border border-border/30 overflow-hidden shadow-2xl bg-surface p-1">
            <div className="w-full aspect-video bg-canvas relative rounded-card overflow-hidden">
              <img
                className="w-full h-full object-cover"
                alt="Enterprise Social Analytics Dashboard"
                src={heroMockup}
              />
            </div>
          </div>
        </section>

        {/* Features Overview */}
        <section className="py-12 px-6 bg-surface" id="features">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-ink mb-1">Engineered for growth</h2>
              <p className="text-sm text-ink-muted">Sophisticated tools to dominate every platform.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <Card hover className="p-6 border-border/40 hover:border-primary/40 group transition-all duration-300">
                <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                  <span className="material-symbols-outlined text-primary">schedule</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Intelligent Scheduling</h3>
                <p className="text-sm text-ink-muted">Optimal post timing based on real-time audience engagement data across all channels.</p>
              </Card>
              {/* Feature 2 */}
              <Card hover className="p-6 border-border/40 hover:border-primary/40 group transition-all duration-300">
                <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                  <span className="material-symbols-outlined text-primary">monitoring</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Advanced Analytics</h3>
                <p className="text-sm text-ink-muted">Deep-dive insights into campaign performance with automated reporting for your stakeholders.</p>
              </Card>
              {/* Feature 3 */}
              <Card hover className="p-6 border-border/40 hover:border-primary/40 group transition-all duration-300">
                <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                  <span className="material-symbols-outlined text-primary">auto_awesome</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">AI Content Engine</h3>
                <p className="text-sm text-ink-muted">Generate brand-aligned copy and high-fidelity visuals with advanced AI prompts.</p>
              </Card>
            </div>
          </div>
        </section>

        {/* Benefits/Results */}
        <section className="py-12 px-6">
          <div className="max-w-7xl mx-auto space-y-12">
            {/* Benefit 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="order-2 lg:order-1">
                <div className="inline-block px-2 py-1 bg-primary-50 rounded-md mb-4">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">Results</span>
                </div>
                <h2 className="text-3xl font-bold text-ink mb-4">Data-Driven ROI</h2>
                <p className="text-base text-ink-muted mb-6">
                  Maximize your marketing budget. Our AI analyzes millions of data points to provide actionable insights that directly impact your bottom line. Understand sentiment and conversion in real-time.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-accent">check_circle</span>
                    <span className="text-sm text-ink">Advanced competitor benchmarking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-accent">check_circle</span>
                    <span className="text-sm text-ink">Deep-learning sentiment analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-accent">check_circle</span>
                    <span className="text-sm text-ink">Custom attribution for high-ticket sales</span>
                  </li>
                </ul>
              </div>
              <div className="order-1 lg:order-2 rounded-card overflow-hidden border border-border/30 bg-surface">
                <img
                  className="w-full h-full object-cover aspect-[4/3]"
                  alt="Analytics ROI visualization"
                  src={analytics}
                />
              </div>
            </div>

            {/* Benefit 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="rounded-card overflow-hidden border border-border/30 bg-surface">
                <img
                  className="w-full h-full object-cover aspect-[4/3]"
                  alt="Team collaboration calendar"
                  src={teamPhoto}
                />
              </div>
              <div className="pl-0 lg:pl-8">
                <div className="inline-block px-2 py-1 bg-primary-50 rounded-md mb-4">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">Efficiency</span>
                </div>
                <h2 className="text-3xl font-bold text-ink mb-4">Enterprise Efficiency</h2>
                <p className="text-base text-ink-muted mb-6">
                  Manage global accounts with ease. Our platform streamlines approval workflows, asset management, and cross-platform publishing into a unified, high-speed interface.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-canvas rounded-card border border-border/20">
                    <div className="text-lg font-semibold text-primary mb-1">85%</div>
                    <div className="text-xs font-medium text-ink-muted">Faster Production</div>
                  </div>
                  <div className="p-4 bg-canvas rounded-card border border-border/20">
                    <div className="text-lg font-semibold text-primary mb-1">12h</div>
                    <div className="text-xs font-medium text-ink-muted">Saved Per Week</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="py-12 px-6 bg-canvas">
          <div className="max-w-7xl mx-auto text-center mb-8">
            <h2 className="text-3xl font-bold text-ink">Streamline your workflow</h2>
            <p className="text-base text-ink-muted">Integration to optimization in three professional steps.</p>
          </div>
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Step 1 */}
              <div className="flex-1 text-center group">
                <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center mx-auto mb-4 group-hover:border-primary transition-colors shadow-sm">
                  <span className="material-symbols-outlined text-primary text-3xl">link</span>
                </div>
                <h3 className="text-lg font-semibold mb-1">1. Connect Accounts</h3>
                <p className="text-xs text-ink-muted px-4">Securely link your enterprise profiles across Instagram, TikTok, LinkedIn, and more.</p>
              </div>
              {/* Connector */}
              <div className="hidden md:block h-px w-12 bg-border"></div>
              {/* Step 2 */}
              <div className="flex-1 text-center group">
                <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center mx-auto mb-4 group-hover:border-primary transition-colors shadow-sm">
                  <span className="material-symbols-outlined text-primary text-3xl">auto_awesome</span>
                </div>
                <h3 className="text-lg font-semibold mb-1">2. Generate Content</h3>
                <p className="text-xs text-ink-muted px-4">Define your brand voice and KPIs. Our AI creates premium, high-engagement assets in seconds.</p>
              </div>
              {/* Connector */}
              <div className="hidden md:block h-px w-12 bg-border"></div>
              {/* Step 3 */}
              <div className="flex-1 text-center group">
                <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center mx-auto mb-4 group-hover:border-primary transition-colors shadow-sm">
                  <span className="material-symbols-outlined text-primary text-3xl">trending_up</span>
                </div>
                <h3 className="text-lg font-semibold mb-1">3. Optimize &amp; Scale</h3>
                <p className="text-xs text-ink-muted px-4">Audit real-time performance data and automate high-performing content deployment.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-12 px-6 relative overflow-hidden">
          <div className="max-w-4xl mx-auto bg-primary rounded-card p-8 md:p-12 text-center relative z-10 shadow-2xl">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to scale your social engine?</h2>
            <p className="text-base text-white/80 mb-8 max-w-xl mx-auto">
              Join over 2,000+ leading marketing teams using AI to drive measurable business growth.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button
                as={Link}
                to="/contact"
                variant="secondary"
                size="lg"
                className="bg-white text-primary hover:bg-white/90 transition-all font-medium"
              >
                Contact Us
              </Button>
            </div>
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] opacity-10 pointer-events-none">
            <div className="w-full h-full bg-gradient-to-br from-primary to-accent blur-3xl"></div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-canvas border-t border-border py-6">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col items-center md:items-start">
              <span className="text-lg font-bold text-ink">AI Social Manager</span>
              <p className="text-xs text-ink-muted">The next generation of social media management powered by advanced AI.</p>
            </div>
            <div className="flex items-center gap-6">
              <p className="text-xs text-ink-muted">© 2026 AI Social Media Manager. All rights reserved.</p>
              <div className="flex gap-4">
                <a className="text-ink-muted hover:text-primary transition-colors" href="#">
                  <span className="material-symbols-outlined text-[20px]">share</span>
                </a>
                <a className="text-ink-muted hover:text-primary transition-colors" href="#">
                  <span className="material-symbols-outlined text-[20px]">public</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
