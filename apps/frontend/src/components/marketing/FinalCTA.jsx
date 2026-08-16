import React from 'react'
import { Link } from 'react-router-dom'
import Button from '../ui/Button'

export default function FinalCTA() {
  return (
    <section className="py-24 bg-[#111111] text-white border-t border-[#333333] relative overflow-hidden">
      {/* Decorative background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1A1A1A_1px,transparent_1px),linear-gradient(to_bottom,#1A1A1A_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30"></div>
      
      <div className="max-w-7xl mx-auto px-6 text-center flex flex-col items-center relative z-10">
        <h2 className="text-4xl md:text-5xl font-extrabold font-['Plus_Jakarta_Sans'] text-white leading-tight tracking-tight mb-6 max-w-2xl">
          Ready to make social media easier?
        </h2>
        <p className="text-base md:text-lg text-[#999999] max-w-lg mb-10 leading-relaxed">
          Create, schedule, and automate your social presence across platforms with Kleos. Start managing your accounts efficiently today.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Button
            as={Link}
            to="/signup"
            variant="primary"
            size="lg"
            className="px-8 font-bold text-white hover:bg-primary-700 transition-all duration-200 w-full sm:w-auto"
          >
            Get Started Free
          </Button>
          <Button
            as={Link}
            to="/features"
            variant="outline"
            size="lg"
            className="px-8 font-bold text-white border-[#333333] hover:bg-[#1A1A1A] transition-colors w-full sm:w-auto"
          >
            See How It Works
          </Button>
        </div>
      </div>
    </section>
  )
}
