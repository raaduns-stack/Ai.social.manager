import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Phone, MapPin, Send, CheckCircle2, Linkedin, Twitter, Instagram } from 'lucide-react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
  })
  const [status, setStatus] = useState('idle') // 'idle' | 'submitting' | 'submitted'

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setStatus('submitting')

    setTimeout(() => {
      setStatus('submitted')
      setTimeout(() => {
        setStatus('idle')
        setFormData({ name: '', email: '', company: '', message: '' })
      }, 3000)
    }, 1200)
  }

  return (
    <div className="bg-canvas text-ink min-h-screen flex flex-col selection:bg-primary-50 selection:text-primary-700">
      {/* Shared Header / Navbar */}
      <header className="fixed top-0 w-full z-50 bg-canvas/80 backdrop-blur-md border-b border-border/30">
        <nav className="flex justify-between items-center h-16 px-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <Link to="/" className="text-2xl font-bold text-primary">
              AI Social Manager
            </Link>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a
              className="text-ink-muted hover:text-primary transition-colors text-sm font-medium"
              href="/#features"
            >
              Features
            </a>
            <Link
              className="text-ink-muted hover:text-primary transition-colors text-sm font-medium"
              to="/pricing"
            >
              Pricing
            </Link>
            <Link
              className="text-primary font-bold border-b-2 border-primary pb-1 text-sm"
              to="/contact"
            >
              Contact
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Button
              as={Link}
              to="/login"
              variant="ghost"
              className="text-ink-muted hover:text-primary text-sm font-medium"
            >
              Log In
            </Button>
            <Button
              as={Link}
              to="/signup"
              variant="primary"
              className="text-sm font-medium"
            >
              Get Started
            </Button>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="pt-28 pb-16 flex-1 flex flex-col items-center max-w-7xl w-full mx-auto px-6">
        {/* Header Section */}
        <section className="w-full mb-8 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold text-ink mb-2">Let’s connect</h1>
          <p className="text-base text-ink-muted max-w-2xl">
            Have questions about our AI-driven social platform? Our team is ready to help you scale
            your digital presence with precision and logic.
          </p>
        </section>

        {/* Form and Contact Details Grid */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 w-full">
          {/* Left Column: Form */}
          <Card className="md:col-span-7 p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  id="name"
                  name="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Email Address"
                  type="email"
                  id="email"
                  name="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <Input
                label="Company"
                id="company"
                name="company"
                placeholder="Acme Corp"
                value={formData.company}
                onChange={handleChange}
              />

              <div className="flex flex-col gap-1.5">
                <label htmlFor="message" className="text-sm font-medium text-ink">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  placeholder="How can we help you?"
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={status === 'submitting'}
                className="w-full md:w-auto font-medium gap-2"
              >
                {status === 'submitting' && (
                  <span className="animate-spin text-sm">↻</span>
                )}
                {status === 'submitted' && (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-accent" /> Sent Successfully
                  </>
                )}
                {status === 'idle' && (
                  <>
                    Send Message <Send className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          </Card>

          {/* Right Column: Contact Details */}
          <div className="md:col-span-5 space-y-6">
            <Card className="p-6 space-y-6">
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-primary-50 text-primary-600 rounded-control shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-ink">Email Us</h3>
                    <p className="text-sm text-ink-muted mt-0.5">contact@raasocial.io</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-primary-50 text-primary-600 rounded-control shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-ink">Call Us</h3>
                    <p className="text-sm text-ink-muted mt-0.5">+1 (555) 123-4567</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-primary-50 text-primary-600 rounded-control shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-ink">Visit Us</h3>
                    <p className="text-sm text-ink-muted mt-0.5">
                      101 Innovation Way, Suite 400<br />
                      San Francisco, CA 94105
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-5 border-t border-border">
                <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">
                  Follow Us
                </h3>
                <div className="flex gap-3">
                  <a
                    href="#"
                    aria-label="LinkedIn"
                    className="p-2 bg-canvas hover:bg-primary-50 hover:text-primary text-ink-muted rounded-control border border-border transition-colors"
                  >
                    <Linkedin className="w-5 h-5" />
                  </a>
                  <a
                    href="#"
                    aria-label="Twitter"
                    className="p-2 bg-canvas hover:bg-primary-50 hover:text-primary text-ink-muted rounded-control border border-border transition-colors"
                  >
                    <Twitter className="w-5 h-5" />
                  </a>
                  <a
                    href="#"
                    aria-label="Instagram"
                    className="p-2 bg-canvas hover:bg-primary-50 hover:text-primary text-ink-muted rounded-control border border-border transition-colors"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </main>

      {/* Shared Footer */}
      <footer className="bg-canvas border-t border-border py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col items-center md:items-start">
              <span className="text-lg font-bold text-ink">AI Social Manager</span>
              <p className="text-xs text-ink-muted">
                The next generation of social media management powered by advanced AI.
              </p>
            </div>
            <div className="flex items-center gap-6">
              <p className="text-xs text-ink-muted">
                © 2026 AI Social Media Manager. All rights reserved.
              </p>
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

