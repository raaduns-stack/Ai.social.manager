import React from 'react'

const TESTIMONIALS = [
  {
    quote: "We went from posting once a month to three times a week without losing our sanity. Kleos is like having a full-time social media manager on staff at a fraction of the cost.",
    author: "Sarah K.",
    role: "Local Boutique Owner"
  },
  {
    quote: "Before RaaSocial, I would spend Sunday afternoons copy-pasting captions into different channels. Now I approve Kleos's drafts on Monday morning and it publishes automatically.",
    author: "David M.",
    role: "Consulting Agency Director"
  },
  {
    quote: "As a small business owner, I don't have time to understand algorithms. I tell Kleos what my business does, and it generates authentic posts that feel exactly like our brand voice.",
    author: "Elena R.",
    role: "Artisanal Bakery Founder"
  }
]

export default function SocialProof() {
  return (
    <section className="py-24 bg-white overflow-hidden border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <span className="text-[#FF6600] font-bold text-xs uppercase tracking-wider block mb-2">
          Trust & Experience
        </span>
        <h2 className="text-3xl md:text-4xl font-extrabold font-['Plus_Jakarta_Sans'] text-[#111111] leading-tight tracking-tight mb-4">
          Built for businesses that want to stay consistent.
        </h2>
        <p className="text-base text-[#666666] max-w-2xl mx-auto leading-relaxed mb-16">
          See how local shop owners, service providers, and startup teams are automating their social pipelines with RaaSocial.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {TESTIMONIALS.map((t, idx) => (
            <div 
              key={idx} 
              className="p-8 rounded-card border border-[#E5E7EB] bg-gray-50 flex flex-col justify-between hover:border-[#FF6600]/30 transition-all duration-300"
            >
              <p className="text-sm text-[#666666] italic leading-relaxed mb-6">
                "{t.quote}"
              </p>
              <div>
                <h4 className="text-sm font-bold text-[#111111] font-['Plus_Jakarta_Sans']">
                  {t.author}
                </h4>
                <p className="text-xs text-[#999999] mt-0.5">
                  {t.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
