import { useState } from 'react'
import { Mail, Phone, MapPin, Send, CheckCircle2, Linkedin, Facebook, Instagram } from 'lucide-react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import apiClient from '../lib/api-client'

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
  })
  const [status, setStatus] = useState('idle') // 'idle' | 'submitting' | 'submitted' | 'error'
  const [errorMsg, setErrorMsg] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg(null)
    setStatus('submitting')

    try {
      // Send the contact form submission to the backend API
      await apiClient.post('/contact', formData)
      setStatus('submitted')
    } catch (err) {
      setStatus('error')
      // Extract error message from API response
      const message = err.response?.data?.message || err.message || 'Failed to send message. Please check your network connection and try again.'
      setErrorMsg(Array.isArray(message) ? message[0] : message)
    }
  }

  const handleReset = () => {
    setStatus('idle')
    setErrorMsg(null)
    setFormData({ name: '', email: '', company: '', message: '' })
  }

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto px-6 py-16 flex flex-col items-center">
        {/* Header Section */}
        <section className="w-full mb-12 text-center select-none space-y-3">
          <span className="bg-[#FFEBE0] text-[#FF6600] font-bold text-xs uppercase tracking-widest px-4 py-1.5 rounded-full">
            Get in touch
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold font-['Plus_Jakarta_Sans'] text-[#111111] tracking-tight mt-4">
            Have a question? We're here to help.
          </h1>
          <p className="text-base md:text-lg text-[#666666] max-w-2xl mx-auto leading-relaxed">
            Need details about plans, custom integrations, or scheduling options? Drop us a line and we'll get back to you shortly.
          </p>
        </section>

        {/* Form and Contact Details Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full items-stretch">
          {/* Left Column: Form / Success State */}
          <Card className="lg:col-span-7 p-6 md:p-8 bg-white border border-gray-200 rounded-card shadow-soft flex flex-col justify-center min-h-[400px]">
            {status === 'submitted' ? (
              <div className="flex flex-col items-center text-center py-6 space-y-5 animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center border border-green-100 shadow-sm shrink-0">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-extrabold font-['Plus_Jakarta_Sans'] text-[#111111] tracking-tight">
                    Message Sent Successfully!
                  </h2>
                  <p className="text-sm md:text-base text-[#666666] max-w-md mx-auto leading-relaxed font-sans font-medium">
                    Message sent successfully. We'll get back to you soon.
                  </p>
                </div>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  size="md"
                  className="font-bold border-gray-200 text-[#111111] hover:bg-gray-50 mt-4"
                >
                  Send another message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {status === 'error' && errorMsg && (
                  <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-control text-sm font-medium flex items-center gap-2 animate-in fade-in duration-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    id="name"
                    name="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="focus:ring-[#FF6600] focus:border-[#FF6600] border-gray-200"
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
                    className="focus:ring-[#FF6600] focus:border-[#FF6600] border-gray-200"
                  />
                </div>

                <Input
                  label="Company"
                  id="company"
                  name="company"
                  placeholder="Acme Corp"
                  value={formData.company}
                  onChange={handleChange}
                  className="focus:ring-[#FF6600] focus:border-[#FF6600] border-gray-200"
                />

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="message" className="text-sm font-bold text-[#111111] font-sans">
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
                    className="w-full rounded-control border border-gray-200 bg-white px-3.5 py-2 text-sm text-[#111111] placeholder:text-[#999999] focus:outline-none focus:ring-2 focus:ring-[#FF6600]/20 focus:border-[#FF6600] transition-colors resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={status === 'submitting'}
                  className="w-full md:w-auto font-bold gap-2 text-white bg-[#FF6600] hover:bg-[#E05300] border-transparent"
                >
                  {status === 'submitting' && (
                    <span className="animate-spin text-sm">↻</span>
                  )}
                  {status === 'submitting' ? 'Sending...' : (
                    <>
                      Send Message <Send className="w-4 h-4 text-white" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </Card>

          {/* Right Column: Contact Details */}
          <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
            <Card className="p-6 md:p-8 space-y-6 bg-white border border-gray-200 rounded-card shadow-soft h-full flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-[#FFEBE0] text-[#FF6600] rounded-control shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#111111] font-['Plus_Jakarta_Sans']">Email Us</h3>
                    <p className="text-sm text-[#666666] mt-0.5 font-sans">
                      <a href="mailto:Support@raaduns.com" className="hover:text-[#FF6600] transition-colors">
                        Support@raaduns.com
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-[#FFEBE0] text-[#FF6600] rounded-control shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#111111] font-['Plus_Jakarta_Sans']">Call Us</h3>
                    <p className="text-sm text-[#666666] mt-0.5 font-sans">
                      <a href="tel:+2349120879032" className="hover:text-[#FF6600] transition-colors">
                        +234 912 087 9032
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-[#FFEBE0] text-[#FF6600] rounded-control shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#111111] font-['Plus_Jakarta_Sans']">Visit Us</h3>
                    <p className="text-sm text-[#666666] mt-0.5 leading-relaxed font-sans font-medium">
                      Suite B6, 2XL Mall,<br />
                      Beside Zenith Bank,<br />
                      3rd Avenue Gwarinpa Abuja
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 mt-6">
                <h3 className="text-xs font-bold text-[#999999] uppercase tracking-wider mb-4">
                  Follow Us
                </h3>
                <div className="flex gap-3">
                  <a
                    href="https://www.linkedin.com/company/raaduns-software-solutions"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                    className="p-2.5 bg-white hover:bg-[#FFEBE0] hover:text-[#FF6600] text-[#666666] rounded-control border border-gray-200 transition-colors"
                  >
                    <Linkedin className="w-5 h-5" />
                  </a>
                  <a
                    href="https://www.facebook.com/raadunssoftware"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="p-2.5 bg-white hover:bg-[#FFEBE0] hover:text-[#FF6600] text-[#666666] rounded-control border border-gray-200 transition-colors"
                  >
                    <Facebook className="w-5 h-5" />
                  </a>
                  <a
                    href="https://www.instagram.com/raadunssolutions/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="p-2.5 bg-white hover:bg-[#FFEBE0] hover:text-[#FF6600] text-[#666666] rounded-control border border-gray-200 transition-colors"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </div>
    </div>
  )
}
