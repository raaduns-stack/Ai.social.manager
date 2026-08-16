import React from 'react'

const PROBLEMS = [
  {
    title: 'Content fatigue',
    desc: 'Thinking of new, engaging post ideas every single day drains your time and creativity.'
  },
  {
    title: 'Caption writer’s block',
    desc: 'Drafting clear, compelling messages with hashtags for multiple platforms is exhausting.'
  },
  {
    title: 'Platform fragmentation',
    desc: 'Logging in and out of different apps to post the same content manually is highly inefficient.'
  },
  {
    title: 'Inconsistent scheduling',
    desc: 'Forgetting to publish posts at peak hours leads to flat engagement and a silent feed.'
  },
  {
    title: 'Platform disconnect',
    desc: 'Struggling to keep Instagram, Facebook, X, LinkedIn, TikTok and YouTube simultaneously active.'
  },
  {
    title: 'Lost hours',
    desc: 'Spending hours each week coordinating posts instead of focusing on growing your business.'
  }
]

export default function ProblemSection() {
  return (
    <section className="py-24 bg-[#111111] text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold font-['Plus_Jakarta_Sans'] leading-tight tracking-tight mb-6">
            Running a business is already a full-time job.<br className="hidden sm:block" />
            <span className="text-[#FF6600]">Your social media shouldn't be.</span>
          </h2>
          <p className="text-lg text-[#999999] leading-relaxed">
            Maintaining a professional social presence across channels takes hours of planning, writing, and scheduling. RaaSocial handles the manual labor so you can focus on your clients.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {PROBLEMS.map((prob, idx) => (
            <div 
              key={idx} 
              className="p-8 rounded-card border border-[#333333] bg-[#1A1A1A] hover:border-[#FF6600]/40 transition-all duration-300 group"
            >
              <div className="w-8 h-8 rounded-full bg-[#FF6600]/10 border border-[#FF6600]/20 flex items-center justify-center mb-6 text-[#FF6600] font-bold text-sm">
                0{idx + 1}
              </div>
              <h3 className="text-xl font-bold text-white mb-3 font-['Plus_Jakarta_Sans'] group-hover:text-[#FF6600] transition-colors duration-200">
                {prob.title}
              </h3>
              <p className="text-sm text-[#999999] leading-relaxed">
                {prob.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
