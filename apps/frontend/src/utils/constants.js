// Central place for values shared across pages — avoids magic strings scattered everywhere.

export const PLAN_DETAILS = {
  free: {
    description: 'Best for testing features and starting out.',
    features: [
      'Connect 1 social media account',
      'Generate 8 AI posts per month',
      'AI-generated caption + hashtags',
      'Basic AI image generation',
      'Content preview',
      'Basic analytics',
      'AI/WhatsApp Support',
    ],
  },
  starter: {
    description: 'Great for solo professionals.',
    features: [
      'Everything in Free, plus:',
      'Connect 3 social media accounts',
      '30 AI-generated posts/month',
      'AI-generated captions & hashtags',
      'AI-generated images',
      'Content Calendar',
      'Post Scheduling',
      'Upload Brand Assets',
      'Basic Analytics Dashboard',
      'AI Content Suggestions',
      'AI/WhatsApp Support',
    ],
  },
  growth: {
    description: 'Perfect for growing businesses.',
    features: [
      'Everything in Starter, plus:',
      'Connect 7 social media accounts',
      '150 AI-generated posts/month (Fair Use)',
      'Advanced AI Image Generation',
      'AI Content Calendar',
      'Competitor Analysis & Website Analysis',
      'AI Content Improvement Suggestions',
      'Performance Insights & Weekly Reports',
      'Team Members (up to 5)',
      'Priority AI Generation',
      'Content Approval Workflow',
      'Advanced Analytics',
      'AI/WhatsApp Support',
    ],
  },
  enterprise: {
    description: 'Full power for larger brands.',
    features: [
      'Everything in Growth, plus:',
      'Connect 15 social media accounts',
      '300 AI-generated posts/month (Fair Use)',
      'Unlimited Team Members',
      'AI Marketing Strategy & Campaign Planner',
      'AI Seasonal Campaign Suggestions',
      'Advanced Competitor Intelligence',
      'Multi-location Business Support',
      'Multiple Brand Management',
      'Dedicated Account Manager',
    ],
  },
}

export const SOCIAL_PLATFORMS = [
  'facebook',
  'instagram',
  'tiktok',
  'x',
  'youtube',
  'linkedin',
]
