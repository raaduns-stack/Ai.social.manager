import React from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'
import PlatformMarquee from '../components/marketing/PlatformMarquee'
import ProblemSection from '../components/marketing/ProblemSection'
import KleosWorkflow from '../components/marketing/KleosWorkflow'
import ProductValue from '../components/marketing/ProductValue'
import SocialProof from '../components/marketing/SocialProof'
import FinalCTA from '../components/marketing/FinalCTA'

export default function Landing() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <header className="pt-16 md:pt-24 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center select-none">
        <h1 className="text-5xl md:text-7xl lg:text-[72px] font-extrabold text-[#111111] max-w-[900px] mb-6 leading-[1.1] md:leading-[1.1] font-['Plus_Jakarta_Sans'] tracking-tight">
          Your social media on <br />
          autopilot. <br />
          <span className="text-[#FF6600]">Powered by Kleos.</span>
        </h1>
        <p className="text-base md:text-lg text-[#666666] max-w-[700px] mb-8 leading-relaxed font-sans">
          Stop guessing what to post. Raasocial handles content creation, intelligent scheduling, and audience growth with precision. Designed for professionals who demand results.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Button
            as={Link}
            to="/signup"
            variant="primary"
            size="lg"
            className="px-8 font-bold text-white shadow-lg shadow-orange-500/10 hover:opacity-95 transition-all duration-200 w-full sm:w-auto"
          >
            Get Started Free
          </Button>
          <Button
            as={Link}
            to="/features"
            variant="outline"
            size="lg"
            className="px-8 font-bold text-[#111111] border-gray-300 hover:bg-gray-50 transition-colors w-full sm:w-auto"
          >
            See How It Works
          </Button>
        </div>
      </header>

      {/* Social Media Integration Scroller (Marquee) */}
      <PlatformMarquee />

      {/* Value Proposition Section (Problems) */}
      <ProblemSection />

      {/* Kleos Workflow Section */}
      <KleosWorkflow />

      {/* Product Value Section (Benefits) */}
      <ProductValue />

      {/* Trust / Social Proof Section */}
      <SocialProof />

      {/* Final CTA Section */}
      <FinalCTA />
    </div>
  )
}
