import { Link } from 'react-router-dom'
import { CreditCard } from 'lucide-react'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'

export default function Payment() {
  return (
    <div className="w-full max-w-md mx-auto space-y-6 text-center py-12">
      <div className="space-y-2">
        <div className="w-16 h-16 bg-[#FFF5F0] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#FFEBE0]">
          <CreditCard className="text-[#FF6600] w-6 h-6" />
        </div>
        <h1 className="text-3xl font-bold font-['Plus_Jakarta_Sans'] text-[#111111] tracking-tight">Payment Setup</h1>
        <p className="text-sm text-[#666666] leading-relaxed">
          Please select a plan from the pricing grid to complete your subscription.
        </p>
      </div>

      <Card className="p-8 border border-gray-200 bg-white">
        <Button
          as={Link}
          to="/choose-plan"
          variant="primary"
          size="lg"
          className="w-full font-semibold text-white hover:opacity-95"
        >
          View Plans & pricing
        </Button>
      </Card>
    </div>
  )
}
