import { useNavigate } from 'react-router-dom'
import { Sparkles, ArrowRight } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { useAuthStore } from '../../store/auth-store'

export default function Welcome() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const name = user?.fullName || 'there'

  const handleNext = () => {
    navigate('/setup/business')
  }

  return (
    <div className="w-full max-w-lg mx-auto space-y-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="space-y-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="text-primary w-8 h-8 animate-pulse" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">
          Congratulations, {name}!
        </h1>
        <p className="text-base text-ink-muted leading-relaxed">
          Your account is fully activated. Let's configure your business workspace and select a plan to get started.
        </p>
      </div>

      <Card className="p-8 space-y-6 bg-surface shadow-hover border border-border">
        <div className="space-y-2 text-left">
          <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">What we'll do:</h3>
          <ul className="space-y-3 text-sm text-ink-muted">
            <li className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">1</span>
              <span>Input your business profile details & industry.</span>
            </li>
            <li className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">2</span>
              <span>Select your workspace subscription plan.</span>
            </li>
          </ul>
        </div>

        <Button
          onClick={handleNext}
          variant="primary"
          size="lg"
          className="w-full font-bold shadow-soft flex items-center justify-center gap-2 group cursor-pointer"
        >
          Let's set up your workspace
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </Button>
      </Card>
    </div>
  )
}
