import { useState } from 'react'
import Button from './ui/Button'

export default function BrandVoiceForm({ initialValues, onSubmit, buttonText = 'Next' }) {
  const [formData, setFormData] = useState(
    initialValues || {
      tone: 'Professional',
      targetAudience: '',
      writingStyle: 'Conversational',
    }
  )

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const fieldCls =
    'h-10 bg-surface px-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-full'
  const fieldStyle = { borderRadius: '8px', border: '1px solid var(--color-border)' }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Brand Tone */}
        <div className="flex flex-col gap-1.5 text-left">
          <label htmlFor="tone" className="text-xs font-medium text-ink">
            Brand Tone / Persona
          </label>
          <select
            id="tone"
            name="tone"
            value={formData.tone}
            onChange={handleChange}
            className={fieldCls}
            style={fieldStyle}
          >
            <option value="Professional">Professional & Authoritative</option>
            <option value="Friendly">Friendly & Warm</option>
            <option value="Bold">Bold & Provocative</option>
            <option value="Playful">Playful & Humorous</option>
            <option value="Empathetic">Empathetic & Supportive</option>
          </select>
        </div>

        {/* Target Audience */}
        <div className="flex flex-col gap-1.5 text-left">
          <label htmlFor="targetAudience" className="text-xs font-medium text-ink">
            Target Audience
          </label>
          <input
            id="targetAudience"
            name="targetAudience"
            type="text"
            placeholder="e.g. Gen Z tech enthusiasts, small business owners"
            value={formData.targetAudience}
            onChange={handleChange}
            className={fieldCls}
            style={fieldStyle}
            required
          />
        </div>

        {/* Writing Style */}
        <div className="flex flex-col gap-1.5 text-left">
          <label htmlFor="writingStyle" className="text-xs font-medium text-ink">
            Writing Style
          </label>
          <select
            id="writingStyle"
            name="writingStyle"
            value={formData.writingStyle}
            onChange={handleChange}
            className={fieldCls}
            style={fieldStyle}
          >
            <option value="Concise">Concise & Direct</option>
            <option value="Detailed">Detailed & Explanatory</option>
            <option value="Technical">Technical & Precise</option>
            <option value="Conversational">Conversational & Casual</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" variant="primary" className="font-semibold px-6">
          {buttonText}
        </Button>
      </div>
    </form>
  )
}
