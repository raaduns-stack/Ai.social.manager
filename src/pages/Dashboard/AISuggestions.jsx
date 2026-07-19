import { useState } from 'react'
import { RefreshCw, ThumbsUp, ThumbsDown, Copy, Check, FileText, CalendarDays, Edit3 } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'

const initialSuggestions = [
  {
    id: 1,
    type: 'Educational Carousel',
    tone: 'primary',
    borderClass: 'border-l-primary',
    title: '5 Steps to Automate Your Workflow',
    description: 'A high-value carousel breaking down complex social media automation into simple, actionable steps for small businesses.',
    caption: "Efficiency isn't just about doing more; it's about doing what matters. Check out these 5 automation hacks that saved our team 20+ hours a week. Which one are you trying first? 👇",
    hashtags: ['#productivity', '#SaaS', '#WorkflowAutomation', '#TechTips', '#GrowthHacks'],
  },
  {
    id: 2,
    type: 'Industry News Update',
    tone: 'success',
    borderClass: 'border-l-accent',
    title: 'The Future of AI in Content Creation',
    description: 'Commentary on the latest algorithm shifts and how AI-generated assets are performing compared to traditional media.',
    caption: "AI isn't replacing creators; it's empowering them. 🚀 We analyzed the latest engagement data—here's what you need to know about the current shift in content strategies.",
    hashtags: ['#AI', '#ContentStrategy', '#SocialMediaTrends', '#Innovation'],
  },
  {
    id: 3,
    type: 'Behind-the-Scenes Reel',
    tone: 'warning',
    borderClass: 'border-l-warning',
    title: 'A Day in the Life at the Lab',
    description: 'A fast-paced reel showcasing the messy reality of production versus the polished result, building human connection.',
    caption: "Behind every 'perfect' post is a whole lot of chaos. ☕️ Tag someone who needs to see the unedited version of building a startup!",
    hashtags: ['#BTS', '#StartupLife', '#BehindTheScenes', '#Authenticity', '#CreativeProcess'],
  },
  {
    id: 4,
    type: 'Thought Leadership',
    tone: 'neutral',
    borderClass: 'border-l-ink-muted',
    title: "Why 'Quantity' is No Longer King",
    description: 'A deep-dive text post for LinkedIn arguing for high-intent quality content over high-frequency posting.',
    caption: "Stop chasing the algorithm and start chasing your audience's needs. 🎯 In 2024, one 'perfect' post is worth 100 'good enough' ones. Here is why focus is your new superpower.",
    hashtags: ['#LinkedInTips', '#ThoughtLeadership', '#MarketingStrategy', '#Focus'],
  },
]

const platforms = ['Instagram', 'LinkedIn', 'X / Twitter', 'TikTok']

export default function AISuggestions() {
  const [activePlatform, setActivePlatform] = useState('LinkedIn')
  const [activeGoal, setActiveGoal] = useState('Engagement')
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [suggestions, setSuggestions] = useState(initialSuggestions)
  const [copiedId, setCopiedId] = useState(null)
  const [likes, setLikes] = useState({})
  const [dislikes, setDislikes] = useState({})

  const handleRegenerate = () => {
    setIsRegenerating(true)
    setTimeout(() => {
      setIsRegenerating(false)
      // Reverse suggestions to simulate batch regeneration
      setSuggestions((prev) => [...prev].reverse())
    }, 1200)
  }

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  const handleLike = (id) => {
    setLikes((prev) => ({ ...prev, [id]: !prev[id] }))
    if (dislikes[id]) {
      setDislikes((prev) => ({ ...prev, [id]: false }))
    }
  }

  const handleDislike = (id) => {
    setDislikes((prev) => ({ ...prev, [id]: !prev[id] }))
    if (likes[id]) {
      setLikes((prev) => ({ ...prev, [id]: false }))
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="AI Content Suggestions"
        description="Curated ideas tailored to your brand's voice and goals."
        action={
          <Button
            variant="primary"
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="gap-2 shadow-soft font-semibold"
          >
            <RefreshCw size={16} className={isRegenerating ? 'animate-spin' : ''} />
            <span>{isRegenerating ? 'Regenerating...' : 'Regenerate Ideas'}</span>
          </Button>
        }
      />

      {/* Filters Bar */}
      <Card className="p-4 flex flex-wrap items-center justify-between gap-4 bg-surface shadow-soft">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider mr-2">
            Platform:
          </span>
          {platforms.map((platform) => (
            <Button
              key={platform}
              type="button"
              variant={activePlatform === platform ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActivePlatform(platform)}
              className="rounded-full text-xs font-semibold"
            >
              {platform}
            </Button>
          ))}
        </div>

        <div className="h-8 w-px bg-border hidden md:block"></div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider mr-1">
            Goal:
          </span>
          <select
            className="h-10 rounded-control border border-border bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            value={activeGoal}
            onChange={(e) => setActiveGoal(e.target.value)}
          >
            <option value="All Goals">All Goals</option>
            <option value="Engagement">Engagement</option>
            <option value="Brand Awareness">Brand Awareness</option>
            <option value="Direct Sales">Direct Sales</option>
          </select>
        </div>
      </Card>

      {/* Suggestions Grid */}
      <div
        className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-300 ${
          isRegenerating ? 'opacity-50 pointer-events-none' : ''
        }`}
      >
        {suggestions.map((card) => (
          <Card
            key={card.id}
            hover
            className={`p-6 flex flex-col gap-4 border-l-4 ${card.borderClass} bg-surface/80 backdrop-blur-sm`}
          >
            {/* Top Tag Header */}
            <div className="flex justify-between items-start">
              <Badge tone={card.tone} className="uppercase font-bold tracking-wider text-[10px]">
                {card.type}
              </Badge>
            </div>

            {/* Title & Description */}
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-ink leading-snug">{card.title}</h3>
              <p className="text-sm text-ink-muted leading-relaxed">{card.description}</p>
            </div>

            {/* Generated Caption Block */}
            <div className="bg-canvas p-4 rounded-control border border-border/40 space-y-2">
              <div className="flex items-center gap-1.5 text-ink-muted">
                <FileText size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Generated Caption
                </span>
              </div>
              <p className="text-sm italic text-ink leading-relaxed">"{card.caption}"</p>
            </div>

            {/* Hashtag Badges */}
            <div className="flex flex-wrap gap-1.5">
              {card.hashtags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-canvas text-ink-muted rounded text-[11px] font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Bottom Actions Row */}
            <div className="mt-auto pt-4 flex items-center justify-between border-t border-border/40 gap-4 flex-wrap">
              {/* Left Utilities */}
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLike(card.id)}
                  className={`p-1.5 h-auto rounded-control hover:bg-canvas ${
                    likes[card.id] ? 'text-primary-700 bg-primary-50' : 'text-ink-muted'
                  }`}
                  aria-label="Like suggestion"
                >
                  <ThumbsUp size={16} className={likes[card.id] ? 'fill-current' : ''} />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDislike(card.id)}
                  className={`p-1.5 h-auto rounded-control hover:bg-canvas ${
                    dislikes[card.id] ? 'text-danger bg-red-50' : 'text-ink-muted'
                  }`}
                  aria-label="Dislike suggestion"
                >
                  <ThumbsDown size={16} className={dislikes[card.id] ? 'fill-current' : ''} />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(card.id, card.caption)}
                  className={`px-2.5 py-1.5 h-auto rounded-control hover:bg-canvas flex items-center gap-1.5 text-xs font-semibold ${
                    copiedId === card.id ? 'text-accent-600 bg-accent-50' : 'text-ink-muted'
                  }`}
                >
                  {copiedId === card.id ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedId === card.id ? 'Copied!' : 'Copy'}</span>
                </Button>
              </div>
              
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
