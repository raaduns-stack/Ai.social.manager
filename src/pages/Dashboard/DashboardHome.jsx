import { Calendar, Award, Star, Send, Zap, Users, TrendingUp, ArrowRight, MessageSquare, Sparkles, Bell } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'

/**
 * DashboardHome page component converted from Stitch-generated HTML design.
 * Renders inside DashboardLayout.
 */
export default function DashboardHome() {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <PageHeader
        title="Workspace Overview"
        description="Welcome back, Alex"
        action={
          <div className="flex items-center gap-2 bg-surface border border-border px-3 py-1.5 rounded-control text-ink-muted shadow-soft">
            <Calendar size={18} />
            <span className="text-sm font-medium">October 24, 2023</span>
          </div>
        }
      />

      {/* Subscription Status Card */}
      <Card className="relative p-6 flex flex-col md:flex-row items-center justify-between gap-6 border-primary-100 overflow-hidden bg-primary/5 shadow-soft">
        {/* Background Decorative Star */}
        <div className="absolute right-0 top-0 w-32 h-full opacity-5 pointer-events-none flex items-center justify-center">
          <Star className="text-primary-600 fill-current" size={120} />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 z-10 text-center sm:text-left">
          <div className="w-12 h-12 bg-primary-100 text-primary-700 rounded-card flex items-center justify-center shrink-0">
            <Award size={28} className="fill-current" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-ink">Pro Plan Active</h3>
            <p className="text-sm text-ink-muted mt-1">
              Your workspace has full access to AI content generation and multi-channel scheduling.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 z-10 shrink-0">
          <div className="text-center sm:text-right">
            <p className="text-xs text-ink-muted font-medium">Next billing cycle</p>
            <p className="text-sm font-semibold text-primary mt-0.5">Nov 12, 2023</p>
          </div>
          <Button variant="primary">Manage Plan</Button>
        </div>
      </Card>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats Card 1 */}
        <Card className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-canvas rounded-control text-primary-600">
              <Send size={20} />
            </div>
            <Badge tone="success" className="gap-1 text-xs">
              <TrendingUp size={12} />
              12%
            </Badge>
          </div>
          <p className="text-ink-muted text-xs font-medium mb-1">Posts Published</p>
          <p className="text-2xl font-bold text-ink">
            24 <span className="text-ink-muted text-sm font-normal">this month</span>
          </p>
        </Card>

        {/* Stats Card 2 */}
        <Card className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-canvas rounded-control text-primary-600">
              <Zap size={20} />
            </div>
            <Badge tone="success" className="gap-1 text-xs">
              <TrendingUp size={12} />
              0.5%
            </Badge>
          </div>
          <p className="text-ink-muted text-xs font-medium mb-1">Avg. Engagement</p>
          <p className="text-2xl font-bold text-ink">4.2%</p>
        </Card>

        {/* Stats Card 3 */}
        <Card className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-canvas rounded-control text-primary-600">
              <Users size={20} />
            </div>
            <Badge tone="primary" className="text-xs">
              New
            </Badge>
          </div>
          <p className="text-ink-muted text-xs font-medium mb-1">Follower Growth</p>
          <p className="text-2xl font-bold text-ink">
            1,240 <span className="text-ink-muted text-sm font-normal">followers</span>
          </p>
        </Card>
      </div>

      <div className="flex justify-end -mt-2">
        <Button variant="ghost" className="text-primary hover:text-primary-700 font-semibold gap-1 hover:bg-transparent px-0">
          View Full Analytics <ArrowRight size={16} />
        </Button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column (Wide) */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Connected Channels */}
          <Card className="overflow-hidden p-0">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-surface">
              <h4 className="text-base font-semibold text-ink">Connected Channels</h4>
              <Button variant="ghost" className="text-primary hover:text-primary-700 hover:bg-transparent font-semibold p-0 h-auto">
                + Connect New
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border">
              {/* Instagram */}
              <div className="p-6 flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center relative bg-canvas">
                  <img
                    className="w-6 h-6 object-contain"
                    alt="Instagram Logo"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuC65sd9d0ewBp_0q0rSnjKRWITCol8waaQvmAaj8HyH-0T2k2zkxP0kyyaTbSaIlrifCFbZVIe1cS_REa8EtPBAQXo_qIXGarLFlcdTp_o3NHWbkpFFa1N6O4EyflkHRiDl_NHVIf48vX3eNMQl6j8DSPfufkL1oxR4FwdzGGlaSWSXjZbps6RCagv7mWgCG6fWs2FpDFjlC61sVMF28SmQ4eiF6EhqrIZTArKyJA7Es0LrDJsmGeBZ7ofoOxFsXPMx4qa9KpUYqzuj"
                  />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-accent border-2 border-surface rounded-full"></div>
                </div>
                <p className="text-sm font-medium text-ink">Instagram</p>
                <p className="text-xs text-ink-muted">Active</p>
              </div>

              {/* LinkedIn */}
              <div className="p-6 flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center relative bg-canvas">
                  <img
                    className="w-6 h-6 object-contain"
                    alt="LinkedIn Logo"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCT9ZbMB0Ci_mRsvi41klDxAmIP8OuXS9rZaP9yQlc7nMIeG1KKFpgsQ6SQLT64KBSIj_1J1g9Lp91gp5d83iM2lVcKoZQC2hGEmG6rbWYoDATtommdy8hdmI3dQl20OluPCshZlL9Irg4NHY5UHpzwc-ldTXcl6UkbgjBeokBuYSv1VIKC9orlbiVCPEWFdb4gyVMYB4mC7-aBmbfl4uRVyJKXKW2bjPx_JvDZTIE2t3dQvjsjz52yrm_5-C3p_y8VLL807xsTP_GB"
                  />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-accent border-2 border-surface rounded-full"></div>
                </div>
                <p className="text-sm font-medium text-ink">LinkedIn</p>
                <p className="text-xs text-ink-muted">Active</p>
              </div>

              {/* Twitter */}
              <div className="p-6 flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center relative bg-canvas">
                  <img
                    className="w-6 h-6 object-contain"
                    alt="Twitter Logo"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuABU12EZeRYocqGNuQn0F7mlEf8Dz5S2r8t_TkAdMOeaIwlO_00FQbVGlXbP51aTsVkI34TfGDMktbAt90kvCx9b-_BgC8QRf-xGPRC8-2TcfEPwpwH_Zq9j3TwNpW00gVqPwf6ek7d1Zo6Lw8zAk7vi3VXv_WfTRsVvkUYIIMtHsRVQC7bIV3W0J1aDxzaNlzFmhia5X1tDwsdhspRrKEi_gm8lfr1jz60TUVKedhBSHmf_UF7AC67EWz6Lh1wqbPD1M0EIy98XDsI"
                  />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-accent border-2 border-surface rounded-full"></div>
                </div>
                <p className="text-sm font-medium text-ink">Twitter</p>
                <p className="text-xs text-ink-muted">Active</p>
              </div>

              {/* TikTok */}
              <div className="p-6 flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center relative bg-canvas">
                  <img
                    className="w-6 h-6 object-contain"
                    alt="TikTok Logo"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBPVxhmGoGxIGcEL74ib0vKCIuC-aDj0KuU_VRMUaY53kIngDvi5P506MO8BPItUpP5HXyMIJRQm4dpg_tEQpdqNQ8KTVMTVgAdOIiJMFlTv42dOCvu6hWeLoXW3ItU0TCzXpOXFXO614LHyAVTHpx7Xt68uS0F4bHP4hF_haxNfq9KRxZ_af83SOBrNrCCw6SH6ACjQyfPCkYWA7FLdsVN7rqW4eHYBLr5NfT_oDaIVHFKgeNnVyIBchzaEmhjq0XCE6pZke4ZloM0"
                  />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-danger border-2 border-surface rounded-full"></div>
                </div>
                <p className="text-sm font-medium text-ink">TikTok</p>
                <Badge tone="danger">Re-auth needed</Badge>
              </div>
            </div>
          </Card>

          {/* Recent Activity Feed */}
          <Card className="overflow-hidden p-0">
            <div className="px-6 py-4 border-b border-border bg-surface">
              <h4 className="text-base font-semibold text-ink">Recent Activity</h4>
            </div>
            <div className="divide-y divide-border">
              <div className="p-6 hover:bg-canvas transition-colors flex items-start gap-4">
                <div className="mt-1 w-8 h-8 rounded-full bg-primary/10 text-primary-600 flex items-center justify-center shrink-0">
                  <Calendar size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-medium text-ink">Post Scheduled</p>
                    <span className="text-xs text-ink-muted">10m ago</span>
                  </div>
                  <p className="text-sm text-ink-muted truncate md:whitespace-normal">
                    "Product Update: October" scheduled for Instagram and Twitter for tomorrow at 10:00 AM.
                  </p>
                </div>
              </div>

              <div className="p-6 hover:bg-canvas transition-colors flex items-start gap-4">
                <div className="mt-1 w-8 h-8 rounded-full bg-accent-50 text-accent-600 flex items-center justify-center shrink-0">
                  <Sparkles size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-medium text-ink">AI Suggestion Generated</p>
                    <span className="text-xs text-ink-muted">2h ago</span>
                  </div>
                  <p className="text-sm text-ink-muted truncate md:whitespace-normal">
                    New caption ideas and optimal posting times calculated for your LinkedIn campaign.
                  </p>
                </div>
              </div>

              <div className="p-6 hover:bg-canvas transition-colors flex items-start gap-4">
                <div className="mt-1 w-8 h-8 rounded-full bg-canvas text-ink-muted flex items-center justify-center shrink-0">
                  <MessageSquare size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-medium text-ink">New Comment Received</p>
                    <span className="text-xs text-ink-muted">5h ago</span>
                  </div>
                  <p className="text-sm text-ink-muted truncate md:whitespace-normal">
                    A user commented "Love this update!" on your most recent Instagram Reel.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-canvas border-t border-border">
              <Button variant="ghost" className="w-full text-ink-muted hover:text-ink font-medium h-12 rounded-none hover:bg-canvas/50">
                View All Activity
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="col-span-12 lg:col-span-4">
          <Card className="overflow-hidden flex flex-col h-full p-0">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-surface">
              <h4 className="text-base font-semibold text-ink">Notifications</h4>
              <Badge tone="primary" className="bg-primary-600 text-white font-bold text-[10px]">
                4 NEW
              </Badge>
            </div>
            <div className="flex-1 divide-y divide-border/60">
              {/* Notification Item 1 */}
              <div className="p-6 bg-primary/5">
                <div className="flex gap-4">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></div>
                  <div>
                    <p className="text-sm font-semibold text-ink">Weekly Report Ready</p>
                    <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                      Your social performance report for Oct 15-22 is now available for download.
                    </p>
                    <Button variant="ghost" className="mt-3 text-primary hover:text-primary-700 hover:bg-transparent font-semibold p-0 h-auto">
                      View Report
                    </Button>
                  </div>
                </div>
              </div>

              {/* Notification Item 2 */}
              <div className="p-6">
                <div className="flex gap-4">
                  <div className="w-2 h-2 rounded-full bg-transparent mt-2 shrink-0"></div>
                  <div>
                    <p className="text-sm font-semibold text-ink">Low Token Alert</p>
                    <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                      You have used 85% of your AI generation tokens for this month.
                    </p>
                    <Button variant="ghost" className="mt-3 text-primary hover:text-primary-700 hover:bg-transparent font-semibold p-0 h-auto">
                      Add Tokens
                    </Button>
                  </div>
                </div>
              </div>

              {/* Notification Item 3 */}
              <div className="p-6">
                <div className="flex gap-4">
                  <div className="w-2 h-2 rounded-full bg-transparent mt-2 shrink-0"></div>
                  <div>
                    <p className="text-sm font-semibold text-ink">System Maintenance</p>
                    <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                      Scheduled downtime for Saturday at 2:00 AM UTC (30 mins expected).
                    </p>
                  </div>
                </div>
              </div>

              {/* Notification Item 4 */}
              <div className="p-6">
                <div className="flex gap-4">
                  <div className="w-2 h-2 rounded-full bg-transparent mt-2 shrink-0"></div>
                  <div>
                    <p className="text-sm font-semibold text-ink">New Feature: Reels Auto-Draft</p>
                    <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                      You can now automatically convert trending sounds into draft reels.
                    </p>
                    <Button variant="ghost" className="mt-3 text-primary hover:text-primary-700 hover:bg-transparent font-semibold p-0 h-auto">
                      Learn More
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-canvas border-t border-border">
              <Button variant="ghost" className="w-full text-ink-muted hover:text-ink font-medium h-12 rounded-none hover:bg-canvas/50">
                Clear All Notifications
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
