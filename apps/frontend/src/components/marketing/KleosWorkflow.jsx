import React from 'react'
import { MessageSquare, LayoutGrid, CalendarRange, CheckCircle2 } from 'lucide-react'

export default function KleosWorkflow() {
  return (
    <section className="py-24 bg-white overflow-hidden" id="how-it-works">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="bg-[#FFEBE0] text-[#FF6600] font-bold text-xs uppercase tracking-widest px-4 py-1.5 rounded-full">
            Autonomous Social Management
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold font-['Plus_Jakarta_Sans'] text-[#111111] leading-tight tracking-tight mt-6 mb-4">
            Meet Kleos.<br />
            Your intelligent social media assistant.
          </h2>
          <p className="text-lg text-[#666666] leading-relaxed">
            Kleos coordinates with your business strategy to automate ideas, copywriting, scheduling, and distribution. Here is how your new automated workflow operates:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Step 1 */}
          <div className="flex flex-col bg-white border border-[#E5E7EB] rounded-card p-6 shadow-soft hover:shadow-hover transition-all duration-300">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-[#FFEBE0] text-[#FF6600] rounded-control">
                <MessageSquare className="w-6 h-6" />
              </div>
              <span className="text-4xl font-extrabold text-[#E5E7EB] leading-none">01</span>
            </div>
            <h3 className="text-lg font-bold text-[#111111] mb-2 font-['Plus_Jakarta_Sans']">
              1. Tell Kleos about your business
            </h3>
            <p className="text-sm text-[#666666] leading-relaxed mb-6">
              Input your target audience, industry guidelines, brand tone preferences, and core business goals.
            </p>
            {/* Micro-UI Visual */}
            <div className="mt-auto bg-gray-50 border border-gray-100 rounded-control p-4 text-[11px] font-sans text-gray-500">
              <div className="space-y-2">
                <div>
                  <span className="block text-[9px] uppercase font-bold text-gray-400">Tone Preference</span>
                  <div className="flex gap-1 mt-1">
                    <span className="px-2 py-0.5 bg-[#FFEBE0] text-[#FF6600] rounded font-medium">Confident</span>
                    <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded">Informative</span>
                  </div>
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-bold text-gray-400">Target Audience</span>
                  <div className="mt-0.5 font-medium text-gray-700">Small business owners, local stores</div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col bg-white border border-[#E5E7EB] rounded-card p-6 shadow-soft hover:shadow-hover transition-all duration-300">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-[#FFEBE0] text-[#FF6600] rounded-control">
                <LayoutGrid className="w-6 h-6" />
              </div>
              <span className="text-4xl font-extrabold text-[#E5E7EB] leading-none">02</span>
            </div>
            <h3 className="text-lg font-bold text-[#111111] mb-2 font-['Plus_Jakarta_Sans']">
              2. Kleos creates your content
            </h3>
            <p className="text-sm text-[#666666] leading-relaxed mb-6">
              Kleos transforms parameters into relevant social ideas, copywriting, and tailored drafts for each network.
            </p>
            {/* Micro-UI Visual */}
            <div className="mt-auto bg-gray-50 border border-gray-100 rounded-control p-4 text-[11px] font-sans text-gray-500">
              <div className="bg-white border border-gray-100 rounded p-2.5 shadow-soft">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="w-1.5 h-1.5 bg-[#FF6600] rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-semibold text-gray-700">Drafting Post...</span>
                </div>
                <div className="h-1 bg-gray-200 rounded-full w-full mb-1"></div>
                <div className="h-1 bg-gray-200 rounded-full w-4/5"></div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col bg-white border border-[#E5E7EB] rounded-card p-6 shadow-soft hover:shadow-hover transition-all duration-300">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-[#FFEBE0] text-[#FF6600] rounded-control">
                <CalendarRange className="w-6 h-6" />
              </div>
              <span className="text-4xl font-extrabold text-[#E5E7EB] leading-none">03</span>
            </div>
            <h3 className="text-lg font-bold text-[#111111] mb-2 font-['Plus_Jakarta_Sans']">
              3. Review and schedule
            </h3>
            <p className="text-sm text-[#666666] leading-relaxed mb-6">
              Preview scheduled drafts in a beautiful calendar workflow. Modify details and approve dates in seconds.
            </p>
            {/* Micro-UI Visual */}
            <div className="mt-auto bg-gray-50 border border-gray-100 rounded-control p-4 text-[11px] font-sans text-gray-500">
              <div className="grid grid-cols-4 gap-1 text-center">
                <div className="p-1 rounded bg-white border border-gray-200 text-gray-400">12</div>
                <div className="p-1 rounded bg-[#FFEBE0] border border-[#FF6600]/30 text-[#FF6600] font-bold">13</div>
                <div className="p-1 rounded bg-white border border-gray-200 text-gray-400">14</div>
                <div className="p-1 rounded bg-white border border-gray-200 text-gray-400">15</div>
              </div>
              <span className="block text-[9px] text-[#FF6600] text-center font-semibold mt-1">1 Post Scheduled</span>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex flex-col bg-white border border-[#E5E7EB] rounded-card p-6 shadow-soft hover:shadow-hover transition-all duration-300">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-[#FFEBE0] text-[#FF6600] rounded-control">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <span className="text-4xl font-extrabold text-[#E5E7EB] leading-none">04</span>
            </div>
            <h3 className="text-lg font-bold text-[#111111] mb-2 font-['Plus_Jakarta_Sans']">
              4. Autopilot publishing
            </h3>
            <p className="text-sm text-[#666666] leading-relaxed mb-6">
              Once approved, RaaSocial automatically broadcasts updates to all active networks right on time.
            </p>
            {/* Micro-UI Visual */}
            <div className="mt-auto bg-gray-50 border border-gray-100 rounded-control p-4 text-[11px] font-sans text-gray-500">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-gray-600 bg-white border border-gray-100 p-1.5 rounded">
                  <span>Instagram</span>
                  <span className="text-[9px] font-bold uppercase text-green-600">Published</span>
                </div>
                <div className="flex items-center justify-between text-gray-600 bg-white border border-gray-100 p-1.5 rounded">
                  <span>LinkedIn</span>
                  <span className="text-[9px] font-bold uppercase text-green-600">Published</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
