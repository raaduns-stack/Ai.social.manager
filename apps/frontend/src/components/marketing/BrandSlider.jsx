import React from 'react'
import Logo11 from '../../assets/11 (1).png'
import Logo20 from '../../assets/20 (2).png'
import AncientAcademyLogo from '../../assets/Ancient Academy logo.png'
import DesectorLogo from '../../assets/Desector Logo.png'
import EarthplusLogo from '../../assets/Earthplus Logo.jpg'
import GoStudyLogo from '../../assets/GO STUDY DP LOGO.jpg'
import HopeMercyLogo from '../../assets/Hope & Mercy Foundation.png'
import MohgasLogo from '../../assets/Mohgas logo.png'
import QuicReplyLogo from '../../assets/QuicReply Logo (1) (1).jpg'
import QuicrefillLogo from '../../assets/Quicrefill logo.png'
import RaaLogo from '../../assets/RAA.jpg.jpeg'
import RaaHomesLogo from '../../assets/Raa Homes Logo.png'
import TargetLogo from '../../assets/Target Logo.png'
import TripplecaveLogo from '../../assets/Tripplecave Logo.png'
import VelvetResidenceLogo from '../../assets/Velvet Residence.jpg'
import WhatsAppLogo from '../../assets/WhatsApp Image 2026-04-09 at 2.02.17 PM.jpeg'

const BRANDS = [
  { name: '11', logo: Logo11 },
  { name: '20', logo: Logo20 },
  { name: 'Ancient Academy', logo: AncientAcademyLogo },
  { name: 'Desector', logo: DesectorLogo },
  { name: 'Earthplus', logo: EarthplusLogo },
  { name: 'Go Study', logo: GoStudyLogo },
  { name: 'Hope & Mercy', logo: HopeMercyLogo },
  { name: 'Mohgas', logo: MohgasLogo },
  { name: 'QuicReply', logo: QuicReplyLogo },
  { name: 'Quicrefill', logo: QuicrefillLogo },
  { name: 'RAA', logo: RaaLogo },
  { name: 'Raa Homes', logo: RaaHomesLogo },
  { name: 'Target', logo: TargetLogo },
  { name: 'Tripplecave', logo: TripplecaveLogo },
  { name: 'Velvet Residence', logo: VelvetResidenceLogo },
  { name: 'WhatsApp brand', logo: WhatsAppLogo },
]

export default function BrandSlider() {
  return (
    <section className="py-10 border-b border-gray-100 bg-[#F9FAFB] overflow-hidden relative w-full select-none">
      <div className="max-w-7xl mx-auto px-6 mb-5 text-center">
        <p className="text-xs uppercase tracking-widest text-[#999999] font-bold">
          Trusted by growing brands worldwide
        </p>
      </div>

      <div className="relative flex w-full overflow-x-hidden">
        {/* Soft edge fade masking gradients */}
        <div className="absolute top-0 left-0 w-16 md:w-32 h-full bg-gradient-to-r from-[#F9FAFB] to-transparent pointer-events-none z-10" />
        <div className="absolute top-0 right-0 w-16 md:w-32 h-full bg-gradient-to-l from-[#F9FAFB] to-transparent pointer-events-none z-10" />

        {/* Horizontal Infinite Marquee */}
        <div className="flex w-[200%] animate-marquee hover:[animation-play-state:paused] cursor-pointer items-center py-2">
          {/* First set of 16 logos */}
          <div className="flex-1 flex justify-around items-center gap-8 md:gap-12 px-4 md:px-6">
            {BRANDS.map((brand, index) => (
              <div
                key={`brand-1-${index}`}
                className="flex items-center justify-center group shrink-0"
              >
                <img
                  src={brand.logo}
                  alt={`${brand.name} logo`}
                  className="h-10 md:h-12 w-auto max-w-[150px] object-contain transition-all duration-300 mix-blend-multiply"
                />
              </div>
            ))}
          </div>

          {/* Second duplicate set for seamless looping */}
          <div className="flex-1 flex justify-around items-center gap-8 md:gap-12 px-4 md:px-6">
            {BRANDS.map((brand, index) => (
              <div
                key={`brand-2-${index}`}
                className="flex items-center justify-center group shrink-0"
              >
                <img
                  src={brand.logo}
                  alt={`${brand.name} logo`}
                  className="h-10 md:h-12 w-auto max-w-[150px] object-contain transition-all duration-300 mix-blend-multiply"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
