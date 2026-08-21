import React from 'react'

const PLATFORMS = [
  {
    name: 'Instagram',
    colorClass: 'text-[#E1306C]',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    )
  },
  {
    name: 'Facebook',
    colorClass: 'text-[#1877F2]',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    )
  },
  {
    name: 'X (Twitter)',
    colorClass: 'text-[#000000]',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    )
  },
  {
    name: 'TikTok',
    colorClass: 'text-[#000000]',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.63 4.17 1.12 1.25 2.7 2.06 4.37 2.28v3.83c-2.1-.06-4.13-.88-5.69-2.28-.1-.08-.18-.18-.28-.27v7.58c0 3.86-2.58 7.42-6.38 8.16-3.83.82-7.83-1.07-9.35-4.67-1.63-3.66-.2-8.08 3.26-10.05 1.56-.91 3.44-1.16 5.17-.74v3.98c-1.39-.42-2.92-.09-4.04.81-1.25.99-1.8 2.69-1.42 4.25.38 1.68 1.95 2.94 3.68 2.87 2.06-.01 3.63-1.89 3.63-3.95V.02z"/>
      </svg>
    )
  },
  {
    name: 'YouTube',
    colorClass: 'text-[#FF0000]',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" />
      </svg>
    )
  },
  {
    name: 'LinkedIn',
    colorClass: 'text-[#0077B5]',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    )
  }
]

export default function PlatformMarquee() {
  return (
    <section className="py-10 border-y border-[#E5E7EB] bg-white overflow-hidden relative w-full">
      <div className="max-w-7xl mx-auto px-6 mb-4 text-center">
        <p className="text-xs uppercase tracking-widest text-[#999999] font-semibold">
          Seamless multi-platform distribution
        </p>
      </div>
      <div className="relative flex w-full overflow-x-hidden">
        {/* Double wrapper for infinite marquee */}
        <div className="flex w-[200%] animate-marquee hover:[animation-play-state:paused] cursor-pointer">
          {/* First set */}
          <div className="flex-1 flex justify-around items-center">
            {PLATFORMS.map((platform, index) => (
              <div
                key={`platform-1-${index}`}
                className={`flex items-center gap-2.5 px-4 py-2 ${platform.colorClass} select-none transition-opacity duration-300 hover:opacity-80`}
              >
                <div className="shrink-0">{platform.icon}</div>
                <span className="text-sm font-semibold tracking-wide font-sans">{platform.name}</span>
              </div>
            ))}
          </div>
          {/* Duplicate set for seamless repeat */}
          <div className="flex-1 flex justify-around items-center">
            {PLATFORMS.map((platform, index) => (
              <div
                key={`platform-2-${index}`}
                className={`flex items-center gap-2.5 px-4 py-2 ${platform.colorClass} select-none transition-opacity duration-300 hover:opacity-80`}
              >
                <div className="shrink-0">{platform.icon}</div>
                <span className="text-sm font-semibold tracking-wide font-sans">{platform.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
