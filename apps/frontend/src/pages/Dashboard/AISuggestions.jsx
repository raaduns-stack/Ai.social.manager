import { useEffect, useState } from 'react'
import {
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  FileText,
  CalendarDays,
  Star,
  Lock,
  Sparkles,
  Camera,
  Linkedin,
  Twitter,
  Music,
  Share2,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import apiClient from '../../lib/api-client'
import {
  getSuggestions,
  generateCaption,
  saveSuggestionFeedback,
} from '../../features/dashboard/dashboard-api'

const initialSuggestions = [
  {
    id: 1,
    type: 'Educational Carousel',
    platform: 'Instagram',
    tone: 'primary',
    borderClass: 'border-l-primary',
    title: '5 Steps to Automate Your Workflow',
    description:
      'A high-value carousel breaking down complex social media automation into simple, actionable steps for small businesses.',
    caption:
      "Efficiency isn't just about doing more; it's about doing what matters. Check out these 5 automation hacks that saved our team 20+ hours a week. Which one are you trying first? 👇",
    hashtags: ['#productivity', '#SaaS', '#WorkflowAutomation', '#TechTips', '#GrowthHacks'],
    scheduledDate: 'Jul 24, 2026',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAleUQStKWP_nrPLhcPgKO1wb_6LbpZM2WcZRJkvqSNyOd-4d16FY3P2EwbkP_FP3Wt33EZeXgjELG-2ONDt-4UJobjnV5my8HB9QsvMP3rQ2AVhomrZux2ECKmXz8SSap3un_SuaqzTlkCxSeJeYuA_e_an2mmozXi8MShxo5flHnQP1rRkQd1ygbWn21cg1wttdiGBBorf956x22nx9OgxLRR6xXSk08b9mBoJVweYkYugFLIoIcqlBDx0ynqSg_Ze5a6BKFYi37e',
  },
  {
    id: 2,
    type: 'Industry News Update',
    platform: 'X / Twitter',
    tone: 'success',
    borderClass: 'border-l-accent',
    title: 'The Future of AI in Content Creation',
    description:
      'Commentary on the latest algorithm shifts and how AI-generated assets are performing compared to traditional media.',
    caption:
      "AI isn't replacing creators; it's empowering them. 🚀 We analyzed the latest engagement data—here's what you need to know about the current shift in content strategies.",
    hashtags: ['#AI', '#ContentStrategy', '#SocialMediaTrends', '#Innovation'],
    scheduledDate: 'Jul 25, 2026',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA_TCW9MEojrE-BVdB2cDHKN5mDcDIhpWmOLM-Eeqd5HoAgBCuWLG1DNh0dBUbQY-aIQuy5a3lb0rgNETGnXEo_82iclQQErWtGuj6szlBxWHMXa3rYZw8P2kmj-vtvXZcDTCtH9V5dGNXAozRoyQmhT5YSJ5EOHT6irpuQLqmCluQSwe_BJ03fT-X6RLtbTWweu1Cn71E5CPFzCIN3lqSs0Dl8RQTWa2QOoQMioxx8dEWMMjxjDCUHbef7JwRhGwdBcZOm4zTYnmw0',
  },
  {
    id: 3,
    type: 'Behind-the-Scenes Reel',
    platform: 'TikTok',
    tone: 'warning',
    borderClass: 'border-l-warning',
    title: 'A Day in the Life at the Lab',
    description:
      'A fast-paced reel showcasing the messy reality of production versus the polished result, building human connection.',
    caption:
      "Behind every 'perfect' post is a whole lot of chaos. ☕️ Tag someone who needs to see the unedited version of building a startup!",
    hashtags: ['#BTS', '#StartupLife', '#BehindTheScenes', '#Authenticity', '#CreativeProcess'],
    scheduledDate: 'Jul 26, 2026',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuARceeh-SFmrFXtS95KOcl1SGU9LL-7Qa2gITQvzfQJ2o_5uuVCvYrQpAcKr-lA2eSVhohBWn488izPgZT8M7210K1KIinBIw8XiTHtJE71LmRcwcTI-BGAYfqb_gcYgfuMcquZE_cYGhNbaicqyWXV4k6Xsim0Ts957E5XF51nIsEbJeHrdKeNsiUwc6M10jRs2ygLwFOyh49V_GUaxuuGsNaxR-Ju_eYXFB7-LUHPhAJQ9gnA81Z5R6lLAOF9-GdZjZ_vWScZBxHD',
  },
  {
    id: 4,
    type: 'Thought Leadership',
    platform: 'LinkedIn',
    tone: 'neutral',
    borderClass: 'border-l-ink-muted',
    title: "Why 'Quantity' is No Longer King",
    description:
      'A deep-dive text post for LinkedIn arguing for high-intent quality content over high-frequency posting.',
    caption:
      "Stop chasing the algorithm and start chasing your audience's needs. 🎯 In 2026, one 'perfect' post is worth 100 'good enough' ones. Here is why focus is your new superpower.",
    hashtags: ['#LinkedInTips', '#ThoughtLeadership', '#MarketingStrategy', '#Focus'],
    scheduledDate: 'Jul 28, 2026',
    image:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 5,
    type: 'Product Spotlight',
    platform: 'Instagram',
    tone: 'primary',
    borderClass: 'border-l-primary',
    title: 'Transforming Social Analytics into Action',
    description:
      'Visual showcase of analytics features with bold typography and interactive UI snapshots.',
    caption:
      'Turn raw data into real ROI. 📊 Our latest dashboard update gives you real-time insights with zero noise.',
    hashtags: ['#SocialMediaTools', '#Analytics', '#MarketingTech', '#Growth'],
    scheduledDate: 'Jul 29, 2026',
    image:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 6,
    type: 'Weekly Strategy Breakdown',
    platform: 'LinkedIn',
    tone: 'neutral',
    borderClass: 'border-l-ink-muted',
    title: '3 Key Takeaways from Q3 Social Engagement',
    description:
      'Professional breakdown for B2B marketers focusing on multi-channel distribution strategies.',
    caption:
      'B2B social distribution is changing fast. Here are 3 non-obvious lessons we learned from publishing 500+ posts across accounts this quarter.',
    hashtags: ['#B2BMarketing', '#GrowthStrategy', '#ContentMarketing'],
    scheduledDate: 'Jul 30, 2026',
    image:
      'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=80',
  },
]

const platforms = ['Instagram', 'LinkedIn', 'X / Twitter', 'TikTok']

function PlatformBadge({ platform }) {
  let icon = <Share2 size={12} />
  let colorClasses = 'bg-primary/10 text-primary border-primary/20'

  if (platform === 'Instagram') {
    icon = <Camera size={12} />
    colorClasses = 'bg-rose-500/10 text-rose-600 border-rose-500/20'
  } else if (platform === 'LinkedIn') {
    icon = <Linkedin size={12} />
    colorClasses = 'bg-blue-600/10 text-blue-600 border-blue-600/20'
  } else if (platform === 'X / Twitter') {
    icon = <Twitter size={12} />
    colorClasses = 'bg-slate-700/10 text-slate-800 border-slate-700/20 dark:text-slate-200'
  } else if (platform === 'TikTok') {
    icon = <Music size={12} />
    colorClasses = 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20'
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${colorClasses}`}>
      {icon}
      <span>{platform}</span>
    </span>
  )
}

export default function AISuggestions() {
  const [activePlatform, setActivePlatform] = useState('All')
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [suggestions, setSuggestions] = useState([])// React state hook initializing an array to hold generated content suggestions
  const [copiedId, setCopiedId] = useState(null)

  // Stored Ratings: { [id]: { type: 'like' | 'dislike', stars: number } }
  const [ratings, setRatings] = useState({})

  /**
 * Triggers initial data retrieval on component mount.
 */
  useEffect(() => {
  loadSuggestions()
}, [])

/**
 * Fetches suggestions from the backend service and transforms 
 * database payload objects into UI-ready presentation models.
 */
const loadSuggestions = async () => {
  try {
    const data = await getSuggestions()

    const mapped = data.map((item) => {
      const feedback = item.feedback

      return {
        id: item.id,
        title: item.type === 'caption' ? 'AI Caption' : 'AI Content Idea',
        description: item.content,
        caption: item.content,
        hashtags: item.hashtags || [],
        platform: 'Instagram',
        type: item.type,
        tone: 'primary',
        borderClass: 'border-l-primary',
        scheduledDate: new Date(item.createdAt).toLocaleDateString(),

        image:
          'https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?auto=format&fit=crop&w=800&q=80',

        feedback,
      }
    })

    setSuggestions(mapped)

    // Restore previously saved ratings
    const savedRatings = {}

    mapped.forEach((item) => {
      if (item.feedback) { 
        savedRatings[item.id] = {
          type: item.feedback.reaction === 'up' ? 'like' : 'dislike',
          stars: item.feedback.rating,
        }
      }
    })

    setRatings(savedRatings)
  } catch (error) {
    console.error('Failed to load suggestions:', error)
  }
}
  // Rating Modal State
  const [ratingTarget, setRatingTarget] = useState(null) // { id, type: 'like' | 'dislike' } | null
  const [selectedStars, setSelectedStars] = useState(0)
  const [hoveredStars, setHoveredStars] = useState(0)

  const filteredSuggestions = suggestions.filter((card) => {
    if (activePlatform === 'All') return true
    return card.platform === activePlatform
  })

  /**
 * Triggers API call to generate a new content caption, transforms the 
 * response into a UI-ready suggestion object, and prepends it to state.
 */
 const handleRegenerate = async () => {
  try {
    setIsRegenerating(true)

    const data = await generateCaption('Coffee Shop')

    const newSuggestion = {
      id: data.id,
      type: 'caption',
      platform: 'Instagram',
      tone: 'primary',
      borderClass: 'border-l-primary',
      title: 'AI Generated Caption',
      description:
        'A fresh AI-generated caption created specifically for your business.',
      caption: data.caption,
      hashtags: data.hashtags || [],
      scheduledDate: new Date().toLocaleDateString(),
      image:
        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80',
    }

    setSuggestions((prev) => [newSuggestion, ...prev])
  } catch (error) {
    console.error('Failed to generate suggestion:', error)
    alert('Failed to generate suggestion.')
  } finally {
    setIsRegenerating(false)
  }
}

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  const openRatingModal = (id, type) => {
    const existing = ratings[id]
    setRatingTarget({ id, type })
    setSelectedStars(existing?.stars || 0)
    setHoveredStars(0)
  }
/**
   * Submits user rating and reaction feedback to the API for the active content suggestion.
   */
  const handleSaveRating = async () => {
  if (!ratingTarget || selectedStars === 0) {
    return
  }

  try {
    await saveSuggestionFeedback(
      String(ratingTarget.id),
      ratingTarget.type === 'like' ? 'up' : 'down',
      selectedStars,
    )

    setRatings((prev) => ({
      ...prev,
      [ratingTarget.id]: {
        type: ratingTarget.type,
        stars: selectedStars,
      },
    }))

    alert('Feedback saved successfully!')
  } catch (error) {
    console.error('Failed to save feedback:', error)
    alert('Failed to save feedback.')
    return
  }

  setRatingTarget(null)
  setSelectedStars(0)
  setHoveredStars(0)
}

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="AI Content Suggestions"
        description="Central repository for all AI-generated posts and scheduling recommendations."
         action={
           <Button
             variant="primary"
             onClick={handleRegenerate}
             disabled={isRegenerating}
             className="gap-2 shadow-soft font-semibold"
           >
           {/* Animated loading spinner icon displayed when a request is in progress */}
             <RefreshCw size={16} className={isRegenerating ? 'animate-spin' : ''} />
             {/* Dynamic button label reflecting current loading state */}
             <span>{isRegenerating ? 'Regenerating...' : 'Regenerate Ideas'}</span>
           </Button>
         }
      />

      {/* Filters Bar */}
      <Card className="p-4 flex flex-wrap items-center justify-between gap-3 bg-surface shadow-soft">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-ink-muted uppercase tracking-wider mr-1 sm:mr-2">
            Filter by Account:
          </span>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {['All', ...platforms].map((platform) => {
              const isActive = activePlatform === platform
              return (
                <Button
                  key={platform}
                  type="button"
                  variant={isActive ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setActivePlatform(platform)}
                  className={`rounded-full text-xs font-semibold transition-all duration-200 ${
                    isActive ? 'shadow-sm scale-[1.02]' : 'hover:border-primary/50'
                  }`}
                >
                  {platform}
                </Button>
              )
            })}
          </div>
        </div>

        <div className="text-xs text-ink-muted font-medium ml-auto sm:ml-0">
          Showing <span className="font-bold text-ink">{filteredSuggestions.length}</span> of{' '}
          <span className="font-bold text-ink">{suggestions.length}</span> suggestions
        </div>
      </Card>

      {/* Suggestions Feed Grid */}
      {filteredSuggestions.length === 0 ? (
        <Card className="p-12 text-center bg-surface/50 border-dashed space-y-3">
          <div className="w-12 h-12 rounded-full bg-canvas flex items-center justify-center mx-auto text-ink-muted">
            <Sparkles size={24} />
          </div>
          <h3 className="text-lg font-bold text-ink">No suggestions found for {activePlatform}</h3>
          <p className="text-sm text-ink-muted max-w-md mx-auto">
            There are currently no AI suggestions scheduled for this platform account. Select another platform or click "Show All Platforms".
          </p>
          <Button variant="outline" size="sm" onClick={() => setActivePlatform('All')} className="mt-2">
            Show All Platforms
          </Button>
        </Card>
      ) : (
        <div
          className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-300 ${
            isRegenerating ? 'opacity-50 pointer-events-none' : ''
          }`}
        >
          {filteredSuggestions.map((card) => {
            const userRating = ratings[card.id]
            // Logic: Exclude if Thumbs Down & rating < 3 OR rating < 2
            const isExcluded = userRating
              ? (userRating.type === 'dislike' && userRating.stars < 3) || userRating.stars < 2
              : false

            return (
              <Card
                key={card.id}
                hover={!isExcluded}
                className={`p-6 flex flex-col gap-4 border-l-4 ${card.borderClass} transition-all relative overflow-hidden ${
                  isExcluded
                    ? 'bg-canvas/70 opacity-65 grayscale-[30%] border-border pointer-events-none sm:pointer-events-auto'
                    : 'bg-surface/80 backdrop-blur-sm'
                }`}
              >
                {/* Orange Spark Ornament */}
                {!isExcluded && (
                  <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none overflow-hidden">
                    <div className="absolute top-0 right-0 bg-primary/10 rounded-bl-full w-8 h-8 flex items-center justify-center pl-1 pb-1">
                      <Sparkles size={10} className="text-primary" />
                    </div>
                  </div>
                )}
                {/* Header Badges: Social Platform, Category Type, Scheduled Date & Excluded Lock Badge */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <PlatformBadge platform={card.platform} />
                    <Badge tone={card.tone} className="uppercase font-bold tracking-wider text-[10px]">
                      {card.type}
                    </Badge>
                    <Badge tone="neutral" className="gap-1 font-medium text-xs">
                      <CalendarDays size={12} className="text-primary" />
                      <span>Scheduled for: {card.scheduledDate}</span>
                    </Badge>
                  </div>

                  {isExcluded && (
                    <Badge tone="danger" className="gap-1 font-bold text-[10px] uppercase tracking-wider">
                      <Lock size={12} />
                      <span>Excluded from publishing</span>
                    </Badge>
                  )}
                </div>

                {/* Generated Image Thumbnail */}
                <div className="w-full aspect-video rounded-control overflow-hidden bg-canvas border border-border shrink-0 relative group">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-2 left-2 bg-surface/90 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-ink flex items-center gap-1 shadow-soft">
                    <Sparkles size={12} className="text-primary" />
                    AI Generated Asset
                  </div>
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
                      className="px-2 py-0.5 bg-canvas text-ink-muted rounded text-[11px] font-medium border border-border/30"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* User Feedback & Rating Status Bar */}
                {userRating && (
                  <div className="bg-canvas/90 p-2.5 rounded-control border border-border flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-medium text-ink">
                      <span>Feedback:</span>
                      <Badge tone={userRating.type === 'like' ? 'success' : 'danger'} className="gap-1 font-bold">
                        {userRating.type === 'like' ? <ThumbsUp size={12} /> : <ThumbsDown size={12} />}
                        {userRating.type === 'like' ? 'Liked' : 'Disliked'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={12}
                            className={s <= userRating.stars ? 'fill-current text-amber-500' : 'text-border'}
                          />
                        ))}
                      </div>
                      <span>{userRating.stars}/5</span>
                    </div>
                  </div>
                )}

                {/* Bottom Actions Row */}
                <div className="mt-auto pt-4 flex items-center justify-between border-t border-border/40 gap-4 flex-wrap">
                  {/* Thumb Buttons */}
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openRatingModal(card.id, 'like')}
                      className={`p-2 h-auto rounded-control hover:bg-canvas ${
                        userRating?.type === 'like' ? 'text-primary-700 bg-primary-50 font-bold' : 'text-ink-muted'
                      }`}
                      title="Thumbs Up"
                    >
                      <ThumbsUp size={16} className={userRating?.type === 'like' ? 'fill-current' : ''} />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openRatingModal(card.id, 'dislike')}
                      className={`p-2 h-auto rounded-control hover:bg-canvas ${
                        userRating?.type === 'dislike' ? 'text-danger bg-red-50 font-bold' : 'text-ink-muted'
                      }`}
                      title="Thumbs Down"
                    >
                      <ThumbsDown size={16} className={userRating?.type === 'dislike' ? 'fill-current' : ''} />
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

                  {/* Scheduling Status Button */}
                  <div>
                    {isExcluded ? (
                      <Button variant="ghost" disabled size="sm" className="text-xs text-danger font-bold opacity-80 gap-1">
                        <Lock size={14} /> Never Published
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="text-xs font-bold border-primary text-primary hover:bg-primary-50 flex items-center gap-1.5 rounded-control">
                        <Sparkles size={12} className="text-primary" /> Ready to Publish
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Interactive 1 to 5 Star Rating Modal */}
      <Modal
        open={ratingTarget !== null}
        onClose={() => setRatingTarget(null)}
        title="Rate AI Suggestion"
      >
        <div className="space-y-5 text-center py-2">
          <p className="text-sm text-ink-muted">
            How would you rate this AI suggestion? Posts rated below 3 stars with a Thumbs Down or under 2 stars overall will be excluded from scheduling.
          </p>

          {/* Interactive Star Selection */}
          <div className="flex justify-center items-center gap-2 py-3">
            {[1, 2, 3, 4, 5].map((star) => {
              const isActive = star <= (hoveredStars || selectedStars)
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setSelectedStars(star)}
                  onMouseEnter={() => setHoveredStars(star)}
                  onMouseLeave={() => setHoveredStars(0)}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none"
                  aria-label={`Rate ${star} star`}
                >
                  <Star
                    size={32}
                    className={`transition-colors ${
                      isActive ? 'text-amber-500 fill-amber-500' : 'text-border hover:text-amber-300'
                    }`}
                  />
                </button>
              )
            })}
          </div>

          <p className="text-xs font-semibold text-ink h-4">
            {selectedStars === 5 && '🌟 Outstanding idea! Ready for high-intent publishing.'}
            {selectedStars === 4 && '👍 Great post suggestion.'}
            {selectedStars === 3 && '👌 Acceptable quality.'}
            {selectedStars === 2 && '⚠️ Subpar quality. Will be excluded from publishing.'}
            {selectedStars === 1 && '🚫 Poor recommendation. Permanently excluded.'}
          </p>

          {/* Modal Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setRatingTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={selectedStars === 0}
              onClick={handleSaveRating}
            >
              Submit Rating
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}


