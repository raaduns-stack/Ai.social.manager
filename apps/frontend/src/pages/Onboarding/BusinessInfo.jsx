import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lightbulb } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'

export default function BusinessInfo() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    businessName: '',
    industry: 'Technology & SaaS',
    website: '',
    brandDescription: '',
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e?.preventDefault()
    if (!formData.businessName.trim() || !formData.brandDescription.trim()) {
      setError('Business Name and Brand Description are required.')
      return
    }

    setLoading(true)
    // Save to localStorage
    localStorage.setItem('onboarding_business_info', JSON.stringify(formData))
    localStorage.setItem('businessInfoComplete', 'true')

    setTimeout(() => {
      setLoading(false)
      navigate('/choose-plan')
    }, 800)
  }

  const handleSkip = () => {
    navigate('/choose-plan')
  }

  return (
    <div className="w-full max-w-3xl mx-auto py-8 px-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Canvas Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl md:text-5xl font-bold font-['Plus_Jakarta_Sans'] text-[#111111] tracking-tight leading-tight">
          Tell Kleos about your business.
        </h1>
        <p className="text-base md:text-lg text-[#666666] max-w-2xl mx-auto leading-relaxed">
          Give Kleos the context it needs to create content that sounds like you. This foundational data powers all automated narratives.
        </p>
      </div>

      {/* Form Card */}
      <Card className="bg-white border border-gray-200 rounded-xl p-6 md:p-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {error && <p className="text-xs text-danger">{error}</p>}

          {/* Business Name */}
          <div className="flex flex-col gap-2 text-left">
            <label className="text-sm font-semibold text-[#111111]" htmlFor="businessName">
              Business Name
            </label>
            <input
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-control text-sm text-[#111111] focus:border-[#FF6600] focus:ring-1 focus:ring-[#FF6600] outline-none transition-colors placeholder:text-[#999999]"
              id="businessName"
              name="businessName"
              placeholder="e.g. Acme Corp"
              required
              type="text"
              value={formData.businessName}
              onChange={handleChange}
            />
          </div>

          {/* Industry */}
          <div className="flex flex-col gap-2 text-left">
            <label className="text-sm font-semibold text-[#111111]" htmlFor="industry">
              Primary Industry
            </label>
            <select
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-control text-sm text-[#111111] focus:border-[#FF6600] focus:ring-1 focus:ring-[#FF6600] outline-none transition-colors cursor-pointer"
              id="industry"
              name="industry"
              value={formData.industry}
              onChange={handleChange}
            >
              <option>Technology & SaaS</option>
              <option>Marketing Agency</option>
              <option>E-commerce</option>
              <option>Content Creation</option>
              <option>Real Estate</option>
              <option>Healthcare</option>
              <option>Education</option>
            </select>
          </div>

          {/* Website URL */}
          <div className="flex flex-col gap-2 text-left">
            <label className="text-sm font-semibold text-[#111111]" htmlFor="website">
              Website URL
            </label>
            <input
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-control text-sm text-[#111111] focus:border-[#FF6600] focus:ring-1 focus:ring-[#FF6600] outline-none transition-colors placeholder:text-[#999999]"
              id="website"
              name="website"
              type="url"
              placeholder="https://example.com"
              value={formData.website}
              onChange={handleChange}
            />
          </div>

          {/* Target Audience Description */}
          <div className="flex flex-col gap-2 text-left">
            <div className="flex justify-between items-baseline">
              <label className="text-sm font-semibold text-[#111111]" htmlFor="brandDescription">
                Target Audience & Business Description
              </label>
            </div>
            <textarea
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-control text-sm text-[#111111] focus:border-[#FF6600] focus:ring-1 focus:ring-[#FF6600] outline-none transition-colors resize-y placeholder:text-[#999999]"
              id="brandDescription"
              name="brandDescription"
              placeholder="Describe who your primary customers are, their pain points, and what your business does..."
              required
              rows={4}
              value={formData.brandDescription}
              onChange={handleChange}
            />
            <p className="text-xs text-[#999999] mt-1">Be specific. This helps tune the AI's tonal accuracy.</p>
          </div>

          {/* Action Area */}
          <div className="pt-6 mt-4 border-t border-gray-200 flex justify-between items-center">
            <button
              className="text-[#666666] font-semibold text-sm py-3 px-6 rounded-lg hover:bg-gray-100 transition-colors active:scale-95 cursor-pointer"
              type="button"
              onClick={handleSkip}
            >
              Skip for now
            </button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="px-8 py-3 font-semibold text-white cursor-pointer"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Continue to Brand'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Contextual Helper Tag (Ambient UI) */}
      <div className="flex items-start gap-4 p-4 bg-[#FFF5F0] rounded-lg border border-[#FFEBE0] text-left">
        <Lightbulb className="text-[#FF6600] mt-0.5 shrink-0" size={20} />
        <div>
          <h4 className="font-semibold text-sm text-[#FF6600] mb-1">Why do we need this?</h4>
          <p className="text-sm text-[#666666] leading-relaxed">
            Your business industry and audience data initializes our foundational LLM context window, ensuring all generated drafts establish baseline industry competence before custom brand tuning.
          </p>
        </div>
      </div>
    </div>
  )
}
