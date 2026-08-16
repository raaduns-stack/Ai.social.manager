import { useNavigate } from 'react-router-dom'
import { ArrowRight, Bot } from 'lucide-react'
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
    <div className="w-full flex flex-col items-center justify-center relative min-h-[70vh] py-12 px-6">
      {/* Minimal Progress Indicator */}
      <div className="absolute top-0 left-0 flex items-center space-x-2">
        <span className="font-mono text-xs font-semibold text-[#111111]">01 Welcome</span>
        <div className="h-px w-8 bg-gray-300"></div>
        <span className="font-mono text-xs font-semibold text-[#999999]">02 Setup</span>
      </div>

      <div className="max-w-[720px] w-full text-center space-y-6 z-10 mt-8">
        {/* Icon/Avatar Placeholder */}
        <div className="w-16 h-16 rounded-full bg-gray-50 border border-gray-200 mx-auto flex items-center justify-center shadow-sm">
          <Bot className="text-[#FF6600] w-8 h-8" />
        </div>

        {/* Typography Content */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold font-['Plus_Jakarta_Sans'] text-[#111111] leading-tight tracking-tight">
            Meet Kleos. <br /> Your new social media assistant.
          </h1>
          <p className="text-base md:text-lg text-[#666666] max-w-[540px] mx-auto leading-relaxed">
            Kleos helps turn what you know about your business into content your audience can actually see. Let's get your workspace set up, {name}.
          </p>
        </div>

        {/* CTA */}
        <div className="pt-6">
          <Button
            onClick={handleNext}
            variant="primary"
            size="lg"
            className="px-8 py-4 font-semibold text-white transition-all duration-200 hover:opacity-95 shadow-sm inline-flex items-center gap-2 cursor-pointer"
          >
            Let's Get Started
            <ArrowRight size={18} />
          </Button>
        </div>
      </div>

      {/* Atmospheric background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#FFF5F0] rounded-full blur-[100px] -z-10 pointer-events-none opacity-50"></div>
    </div>
  )
}
