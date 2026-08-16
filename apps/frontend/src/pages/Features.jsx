import React from 'react'
import { Link } from 'react-router-dom'
import { PenTool, Calendar, Clock, Monitor, Sparkles, BarChart3, Volume2 } from 'lucide-react'
import Button from '../components/ui/Button'
import FinalCTA from '../components/marketing/FinalCTA'

const FEATURES = [
  {
    title: 'Content Creation',
    outcome: 'Kleos generates relevant social content, caption drafts, and hashtags tailored for your target audience, matching your brand style.',
    icon: <PenTool className="w-6 h-6 text-[#FF6600]" />
  },
  {
    title: 'Content Planning',
    outcome: 'Stop trying to keep track of post ideas in scattered spreadsheets. Map out months of social content in a unified grid.',
    icon: <Calendar className="w-6 h-6 text-[#FF6600]" />
  },
  {
    title: 'Automated Scheduling',
    outcome: 'Pick your publication times once and let RaaSocial push content live. Your channels stay active even when you are offline.',
    icon: <Clock className="w-6 h-6 text-[#FF6600]" />
  },
  {
    title: 'Multi-Platform Management',
    outcome: 'Manage Instagram, Facebook, X, LinkedIn, TikTok and YouTube accounts from a single workspace. No multiple logins.',
    icon: <Monitor className="w-6 h-6 text-[#FF6600]" />
  },
  {
    title: 'AI Content Suggestions',
    outcome: 'Get automated, industry-specific recommendations for text captions and image descriptions when you need fresh ideas.',
    icon: <Sparkles className="w-6 h-6 text-[#FF6600]" />
  },
  {
    title: 'Performance Analytics',
    outcome: 'Track audience growth and post engagement across all channels. Understand which drafts perform best over time.',
    icon: <BarChart3 className="w-6 h-6 text-[#FF6600]" />
  },
  {
    title: 'Brand Voice Engine',
    outcome: 'Define your communication style, preferred terms, and guidelines so Kleos generates drafts that sound authentic.',
    icon: <Volume2 className="w-6 h-6 text-[#FF6600]" />
  }
]

export default function Features() {
  return (
    <div className="w-full">
      {/* Header Section */}
      <header className="pt-16 pb-16 px-6 max-w-5xl mx-auto text-center select-none">
        <span className="bg-[#FFEBE0] text-[#FF6600] font-bold text-xs uppercase tracking-widest px-4 py-1.5 rounded-full">
          Product Details
        </span>
        <h1 className="text-4xl md:text-5xl font-extrabold font-['Plus_Jakarta_Sans'] text-[#111111] tracking-tight mt-6 mb-4">
          What can RaaSocial do for me?
        </h1>
        <p className="text-lg text-[#666666] max-w-2xl mx-auto leading-relaxed">
          RaaSocial combines standard scheduling mechanics with the intelligent content capabilities of Kleos to keep your social channels active on autopilot.
        </p>
      </header>

      {/* Feature outcomes grid */}
      <section className="pb-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map((feat, idx) => (
            <div 
              key={idx} 
              className="bg-white border border-[#E5E7EB] rounded-card p-8 shadow-soft hover:shadow-hover hover:border-[#FF6600]/30 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="p-3 bg-[#FFEBE0] rounded-control w-fit mb-6">
                  {feat.icon}
                </div>
                <h3 className="text-xl font-bold text-[#111111] font-['Plus_Jakarta_Sans'] mb-3">
                  {feat.title}
                </h3>
                <p className="text-sm text-[#666666] leading-relaxed">
                  {feat.outcome}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Highlight banner */}
      <section className="py-20 bg-gray-50 border-t border-b border-gray-100 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-[#111111] font-['Plus_Jakarta_Sans'] mb-4">
            Designed for business owners, not agencies.
          </h2>
          <p className="text-sm md:text-base text-[#666666] leading-relaxed max-w-2xl mx-auto">
            You don't need complex enterprise settings or confusing dashboard tables. RaaSocial gives you clean calendar previews, clear options, and automated assistance that saves you time.
          </p>
        </div>
      </section>

      {/* Final CTA Section */}
      <FinalCTA />
    </div>
  )
}
