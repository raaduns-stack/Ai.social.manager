import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import Card from '../../components/ui/Card'
import BrandVoiceForm from '../../components/BrandVoiceForm'

export default function BrandVoiceOnboarding() {
  const navigate = useNavigate()

  const handleNext = (formData) => {
    // Save to localStorage
    localStorage.setItem('onboarding_brand_voice', JSON.stringify(formData))
    navigate('/choose-plan')
  }

  return (
    <div className="w-full max-w-lg mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="text-primary w-6 h-6" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Brand Voice Persona</h1>
        <p className="text-sm text-ink-muted leading-relaxed">
          Configure the guidelines for the AI. This shapes the tone, style, and vocabulary in all generated posts.
        </p>
      </div>

      <Card className="p-6 bg-surface border border-border">
        <BrandVoiceForm
          initialValues={{
            tone: 'Professional',
            targetAudience: '',
            writingStyle: 'Conversational',
          }}
          onSubmit={handleNext}
          buttonText="Next: Choose Plan"
        />
      </Card>
    </div>
  )
}
