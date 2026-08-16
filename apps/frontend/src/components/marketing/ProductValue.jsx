import React from 'react'
import { Clock, RefreshCw, Sparkles, Sliders, CheckCircle } from 'lucide-react'

const VALUES = [
  {
    title: 'Spend less time planning posts',
    desc: 'Stop drafting spreadsheets and copy-pasting. Outline your months in minutes and let Kleos handle the details.',
    icon: <Clock className="w-5 h-5 text-[#FF6600]" />
  },
  {
    title: 'Stay consistent without being online',
    desc: 'Publish regular updates even when you are busy serving customers or away from your computer.',
    icon: <RefreshCw className="w-5 h-5 text-[#FF6600]" />
  },
  {
    title: 'Create content that sounds like your brand',
    desc: 'Teach Kleos your tone, preferences, and industry specifics so that every draft sounds like you wrote it.',
    icon: <Sparkles className="w-5 h-5 text-[#FF6600]" />
  },
  {
    title: 'Manage multiple platforms in one place',
    desc: 'Broadcast to Instagram, Facebook, X, LinkedIn, TikTok and YouTube without jumping between multiple dashboards.',
    icon: <Sliders className="w-5 h-5 text-[#FF6600]" />
  },
  {
    title: 'Let Kleos handle repetitive tasks',
    desc: 'Delegate content drafting, hashtag selection, scheduling, and publication checks to your automated assistant.',
    icon: <CheckCircle className="w-5 h-5 text-[#FF6600]" />
  }
]

export default function ProductValue() {
  return (
    <section className="py-24 bg-gray-50 border-t border-gray-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5">
            <span className="text-[#FF6600] font-bold text-xs uppercase tracking-wider block mb-2">
              Value Focus
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold font-['Plus_Jakarta_Sans'] text-[#111111] leading-tight tracking-tight mb-6">
              Focus on your business.<br />
              Let us handle consistency.
            </h2>
            <p className="text-base md:text-lg text-[#666666] leading-relaxed mb-8">
              RaaSocial was designed for busy business owners who need to maintain an active digital footprint without wasting hours every week.
            </p>
            <div className="border-l-2 border-[#FF6600] pl-4 py-1 text-sm text-[#666666] italic">
              "We built Kleos to handle the repetitive mechanics of social management so you can focus on building relationships with your clients."
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {VALUES.map((val, idx) => (
              <div 
                key={idx} 
                className="bg-white border border-[#E5E7EB] rounded-card p-6 shadow-soft hover:border-[#FF6600]/30 transition-all duration-200"
              >
                <div className="p-2 bg-[#FFEBE0] rounded-control w-fit mb-4">
                  {val.icon}
                </div>
                <h3 className="text-base font-bold text-[#111111] mb-2 font-['Plus_Jakarta_Sans']">
                  {val.title}
                </h3>
                <p className="text-xs text-[#666666] leading-relaxed">
                  {val.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
