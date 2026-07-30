import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2 } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

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
    e.preventDefault()
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

  const fieldCls =
    'h-10 bg-surface px-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-full'
  const fieldStyle = { borderRadius: '8px', border: '1px solid var(--color-border)' }
  const textareaStyle = { borderRadius: '8px', border: '1px solid var(--color-border)' }

  return (
    <div className="w-full max-w-lg mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Building2 className="text-primary w-6 h-6" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Business Profile</h1>
        <p className="text-sm text-ink-muted leading-relaxed">
          Tell us about your brand. This context helps the AI generate more relevant posts.
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-xs text-danger">{error}</p>}

          <Input
            label="Business Name"
            id="businessName"
            name="businessName"
            type="text"
            placeholder="e.g. Acme Studio"
            required
            value={formData.businessName}
            onChange={handleChange}
          />

          <div className="flex flex-col gap-1.5 text-left">
            <label htmlFor="industry" className="text-sm font-medium text-ink">
              Industry
            </label>
            <select
              id="industry"
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              className={fieldCls}
              style={fieldStyle}
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

          <Input
            label="Website URL"
            id="website"
            name="website"
            type="url"
            placeholder="https://example.com"
            value={formData.website}
            onChange={handleChange}
          />

          <div className="flex flex-col gap-1.5 text-left">
            <label htmlFor="brandDescription" className="text-sm font-medium text-ink">
              Brand / Business Description
            </label>
            <textarea
              id="brandDescription"
              name="brandDescription"
              rows={4}
              placeholder="Provide a brief description of what your business does, your core products/services, and unique value proposition..."
              required
              value={formData.brandDescription}
              onChange={handleChange}
              className="bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none w-full"
              style={textareaStyle}
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-semibold cursor-pointer"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Next: Choose Plan'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
